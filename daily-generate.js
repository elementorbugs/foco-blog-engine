#!/usr/bin/env node
// daily-generate.js — Foco Daily Routine Orchestrator
//
// Runs the 9-phase daily article generation pipeline:
//   1. Pick keywords from master-plan.json (top score, filtered)
//   2. Pre-flight: skip slugs that already exist in WP
//   3. Generate ~2,800-word HTML article (via Anthropic API)
//   4. Push through create-post.js engine (full pipeline)
//   5. Post-process: disclaimer + HowTo schema (engine doesn't auto-add)
//   6. Cross-link cluster siblings
//   7. Programmatic audit (14 spec items)
//   8. Update pipeline-tracker.json
//   9. Send notification email via Resend
//
// Usage:
//   node daily-generate.js                    — full live run, picks 3 keywords
//   node daily-generate.js --count=1          — generate 1 article only (faster)
//   node daily-generate.js --dry-run          — pick + announce, no generation
//   node daily-generate.js --keyword="..."    — bypass picker, force keyword
//
// Required env (in .env):
//   WP_HOST, WP_USER, WP_APP_PASSWORD
//   ANTHROPIC_API_KEY (for article generation)
//   RESEND_KEY (for email)
//   NOTIFY_EMAIL (recipient for daily summary)

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ─── ENV ─────────────────────────────────────────────────────────────────────
// Resolution chain: process.env → foco-blog-engine/.env → ../.foco-config/wp-creds.env
const envSources = {};
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
    if (m) envSources[m[1]] = m[2];
  }
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.foco-config', 'wp-creds.env'));

const E = (k, ...aliases) => {
  for (const key of [k, ...aliases]) {
    if (process.env[key]) return process.env[key];
    if (envSources[key]) return envSources[key];
  }
  return null;
};

// Aliases handle the two .env file formats:
// foco-blog-engine/.env: WP_HOST, WP_USER, WP_APP_PASSWORD
// .foco-config/wp-creds.env: WP_URL, WP_USER, WP_PASS
const WP_URL_RAW = E('WP_HOST', 'WP_URL');
const WP_HOST = WP_URL_RAW ? WP_URL_RAW.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
const WP_USER = E('WP_USER');
const WP_APP_PASSWORD = E('WP_APP_PASSWORD', 'WP_PASS');
const ANTHROPIC_API_KEY = E('ANTHROPIC_API_KEY');
const RESEND_KEY = E('RESEND_KEY');
// PEXELS_KEY: env var first, then file fallback for local
let PEXELS_KEY = E('PEXELS_KEY');
if (!PEXELS_KEY) {
  const p = path.join(__dirname, '.pexels-key');
  if (fs.existsSync(p)) PEXELS_KEY = fs.readFileSync(p, 'utf8').trim();
}
const NOTIFY_EMAIL = E('NOTIFY_EMAIL') || 'adibenelyahu@gmail.com';

const missing = [];
if (!WP_HOST) missing.push('WP_HOST/WP_URL');
if (!WP_USER) missing.push('WP_USER');
if (!WP_APP_PASSWORD) missing.push('WP_APP_PASSWORD/WP_PASS');
if (missing.length) {
  console.error('FATAL: missing required env vars: ' + missing.join(', '));
  console.error('Looked in: process.env, foco-blog-engine/.env, ../.foco-config/wp-creds.env');
  process.exit(1);
}
const AUTH = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');

const flag = (n) => process.argv.includes('--' + n);
const arg = (n) => {
  const a = process.argv.find(x => x.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : null;
};
const DRY_RUN = flag('dry-run');
const COUNT = parseInt(arg('count') || '3', 10);
const FORCE_KEYWORD = arg('keyword');
const SKIP_COVER = flag('skip-cover'); // for cloud env — skips playwright cover render

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function req(host, method, p, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const opts = {
      hostname: host, port: 443, path: p, method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}
const wpReq = (m, p, b) => req(WP_HOST, m, p, { Authorization: 'Basic ' + AUTH }, b);

// ─── PHASE 1: Pick keywords ──────────────────────────────────────────────────
async function pickKeywords() {
  // Try repo-local first (works in GitHub Actions), fall back to parent .foco-config (local dev)
  const masterPathRepo = path.join(__dirname, 'keyword-research', 'master-plan.json');
  const masterPathLocal = path.join(__dirname, '..', '.foco-config', 'master-plan.json');
  const masterPath = fs.existsSync(masterPathRepo) ? masterPathRepo : masterPathLocal;
  if (!fs.existsSync(masterPath)) {
    throw new Error('master-plan.json not found at ' + masterPathRepo + ' or ' + masterPathLocal);
  }
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  // schedule has pre-built picks; clusters has scored candidates
  const candidates = [];
  if (Array.isArray(master.clusters)) {
    for (const cluster of master.clusters) {
      if (cluster.name === 'Other (general ADHD)') continue; // per spec — too generic
      const items = cluster.items || cluster.keywords || cluster.candidates || [];
      for (const k of items) {
        if (k.covered) continue; // already in WP per master-plan's own tracking
        candidates.push({
          keyword: k.keyword,
          slug: k.slug || slugify(k.keyword),
          cluster: cluster.name,
          volume: k.volume || 0,
          sd: k.sd || 50,
          score: k.score || (k.volume || 0) / Math.max(k.sd || 30, 5),
          intent: k.intent || '',
        });
      }
    }
  }
  // Dedupe by slug
  const bySlug = new Map();
  for (const c of candidates) if (!bySlug.has(c.slug)) bySlug.set(c.slug, c);
  const all = [...bySlug.values()];
  // Sort by score desc
  all.sort((a, b) => b.score - a.score);

  // Filter: drop already-in-WP, recently-tracked, and previously-trashed
  const trackerPath = path.join(__dirname, 'keyword-research', 'pipeline-tracker.json');
  const tracker = fs.existsSync(trackerPath) ? JSON.parse(fs.readFileSync(trackerPath, 'utf8')) : { runs: [] };
  const recentSlugs = new Set();
  for (const run of tracker.runs.slice(-7)) for (const p of run.posts || []) recentSlugs.add(p.slug);

  // Fetch all trashed slugs once — we don't want to re-create things we deliberately killed
  const trashRes = await wpReq('GET', '/wp-json/wp/v2/posts?per_page=100&status=trash&context=edit&_fields=slug');
  const trashSlugs = new Set();
  if (Array.isArray(trashRes.body)) {
    for (const p of trashRes.body) trashSlugs.add(p.slug.replace(/__trashed$/, ''));
  }

  // Fetch all live slugs (publish/future/draft) once for cannibalization check
  const liveRes = await wpReq('GET', '/wp-json/wp/v2/posts?per_page=100&status=publish,future,draft&context=edit&_fields=slug');
  const liveSlugs = new Set();
  if (Array.isArray(liveRes.body)) {
    for (const p of liveRes.body) liveSlugs.add(p.slug);
  }

  // Explicit blocklist — keywords we never want to re-create
  const blockedPath = path.join(__dirname, 'keyword-research', 'blocked-keywords.json');
  const blocked = fs.existsSync(blockedPath) ? JSON.parse(fs.readFileSync(blockedPath, 'utf8')) : { blocked: [] };
  const blockedKeywords = new Set();
  const blockedSlugs = new Set();
  for (const b of blocked.blocked || []) {
    if (b.keyword) blockedKeywords.add(b.keyword.toLowerCase().trim());
    if (b.slug) blockedSlugs.add(b.slug);
    if (b.keyword) blockedSlugs.add(slugify(b.keyword));
  }

  // Track which clusters already used today (max 1 per cluster per run = diversity)
  const usedClusters = new Set();

  const picks = [];
  const skipped = { lowVol: 0, recent: 0, trashed: 0, live: 0, blocked: 0, clusterDup: 0 };
  for (const c of all) {
    if (picks.length >= COUNT) break;
    if (c.volume < 50) { skipped.lowVol++; continue; }
    if (blockedKeywords.has(c.keyword.toLowerCase()) || blockedSlugs.has(c.slug)) { skipped.blocked++; continue; }
    if (recentSlugs.has(c.slug)) { skipped.recent++; continue; }
    if (trashSlugs.has(c.slug)) { skipped.trashed++; continue; }
    if (liveSlugs.has(c.slug)) { skipped.live++; continue; }
    if (usedClusters.has(c.cluster)) { skipped.clusterDup++; continue; }
    picks.push(c);
    usedClusters.add(c.cluster);
  }
  console.log(`  [filter] skipped — low vol:${skipped.lowVol}, recently picked:${skipped.recent}, trashed:${skipped.trashed}, live:${skipped.live}, blocked:${skipped.blocked}, cluster-dup:${skipped.clusterDup}`);
  return picks;
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── PHASE 3: Generate article HTML via Anthropic API ────────────────────────
async function generateArticle({ keyword, slug, cluster }) {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
  const system = `You are FOCO's senior content writer. Produce ONE complete blog post in HTML that ranks on Google AND feels like a real person who gets it wrote it.

BRAND VOICE — non-negotiable:
- Validating, plain-spoken, neuroscience-grounded, zero shame
- Anti-hustle. Define ADHD struggles in physiological terms, not character flaws
- Address the reader directly ("you") throughout — never "the patient", "the individual", "people with ADHD"
- Each major section MUST contain ONE moment of dry humor, validation, or specific lived-experience that breaks clinical tone. Examples:
  • "Yes, you can fail an ADHD test by being too articulate. Welcome to gifted-burnt-out adulthood."
  • "You may have survived high school on willpower and adrenaline, then crashed when adulthood added kids, mortgage, and zero margin."
  • "If you're reading this at 2am because you can't stop thinking about it, that's the executive function deficit talking — not character."
- When you describe a problem, NAME the specific lived behavior: "six unfinished projects in your garage" beats "disorganization"
- Acknowledge nuance and edge cases (high-masking, late-diagnosed, comorbid) — don't write to a single archetype

REQUIRED structure (in this order):
1. <h1> — primary keyword front-loaded, ≤58 characters total. NEVER exceed 58.
2. <div class="foco-tldr"><strong>TL;DR.</strong> {40-60 word direct answer with specifics}</div>
3. <div class="foco-key-takeaways"><h2>Key Takeaways</h2><ul><li>×5 — specific, with numbers/names where possible</li></ul></div>
4. <h2>Table of Contents</h2><ol> with anchor links to each H2 below
5. 5-7 <h2 id="..."> sections, each 250-400 words. Each H2 phrased as a question or definitive statement. Each section MUST include one of: a specific stat, a named example, a pattern that validates lived experience, or a counterintuitive truth.
6. <h2>FAQ</h2> with 6 <h3> questions + <p> answers (40-100 words). Use real questions a person would Google, not generic ones.
7. <h2>The Bottom Line</h2> — ONE paragraph. Punchy. Just the truth. NO "in conclusion" framing.
8. <h2>Related articles</h2><ul> with 5-7 of these links (pick what fits the topic):
   https://www.tryfoco.com/adhd-task-paralysis/
   https://www.tryfoco.com/adhd-executive-function/
   https://www.tryfoco.com/how-to-focus-with-adhd/
   https://www.tryfoco.com/task-initiation-deficit-explained/
   https://www.tryfoco.com/time-blindness-adhd/
   https://www.tryfoco.com/body-doubling-adhd/
   https://www.tryfoco.com/pomodoro-for-adhd/
   https://www.tryfoco.com/10-minute-timer-adhd/
   https://www.tryfoco.com/adhd-and-rejection-sensitive-dysphoria/
9. <h2>References</h2><ul class="foco-references"> with these 5 (always include all):
   <li><a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" target="_blank" rel="noopener">National Institute of Mental Health. Attention-Deficit/Hyperactivity Disorder.</a></li>
   <li><a href="https://www.cdc.gov/adhd/about/index.html" target="_blank" rel="noopener">CDC. ADHD in Adults: Symptoms and Treatment.</a></li>
   <li><a href="https://pubmed.ncbi.nlm.nih.gov/9000892/" target="_blank" rel="noopener">Barkley RA. Behavioral inhibition, sustained attention, and executive functions: constructing a unifying theory of ADHD. Psychol Bull. 1997;121(1):65-94.</a></li>
   <li><a href="https://www.nature.com/articles/nrdp201520" target="_blank" rel="noopener">Faraone SV, Asherson P, Banaschewski T, et al. Attention-deficit/hyperactivity disorder. Nat Rev Dis Primers. 2015;1:15020.</a></li>
   <li><a href="https://chadd.org/about-adhd/overview/" target="_blank" rel="noopener">CHADD. ADHD Overview.</a></li>

INTERNAL LINKING (CRITICAL — don't dump all in Related Articles):
Weave 4-6 internal links INTO the body text, contextually placed where the topic naturally comes up. Use absolute URLs (https://www.tryfoco.com/...). When discussing executive function, link to the executive function pillar. When discussing initiation, link to task-paralysis. Make the links feel earned, not stuffed.

VISUAL STRUCTURE (CRITICAL — articles must be scannable):
Every section needs at least ONE structural element beyond prose:
- **Lists**: where you have 3+ items, USE <ol> for sequenced or <ul> for unordered. Don't write "5 ways" as 5 paragraphs.
- **Tables**: comparing 3+ things → use <div class="foco-table-wrap" style="overflow-x:auto;margin:24px 0"><table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="background:rgba(124,58,237,0.18)"><th style="text-align:left;padding:12px;border:1px solid rgba(167,139,250,0.18)">Header</th>...</tr></thead><tbody>...</tbody></table></div>
- **Charts** (REQUIRED — include 1-2 per article): emit a chart marker that the build pipeline will render. Format:
\`\`\`
<!-- FOCO_CHART:TYPE
{json_spec}
-->
\`\`\`
TYPES available:
  • statGrid — 4-6 big stats. spec: {"title":"...","caption":"...","items":[{"label":"4.4%","sub":"adult prevalence"},...]}
  • horizontalBar — comparing values. spec: {"title":"...","caption":"...","data":[{"label":"Item","value":75,"highlight":true},...]}
  • progressTimeline — sequence of steps. spec: {"title":"...","caption":"...","steps":[{"label":"Step 1","sub":"description"},...]}
  • infographicList — labeled facts with value column. spec: {"title":"...","caption":"...","items":[{"icon":"⏰","label":"Time","value":"30 min"},...]}
Place chart markers in their own <p> on a blank line. Use real numbers, not placeholders. If you don't have a real stat, don't fabricate — pick a different chart type or skip.

CRITICAL RULES:
- Max 1-2 sentences per paragraph. NEVER 3+ sentences in one block.
- Wrap every paragraph in explicit <p>...</p>.
- Word count: 2,500-3,000.
- NO editorial markers like [PERSONAL], [CITATION:], [CHART:], [IMAGE:].
- NO markdown links — use HTML <a href> only.
- For YMYL content (medications, diagnostic codes): NO specific milligram numbers in body. Use "your prescriber sets the dose" style.
- For comparison content: NO fabricated prices or stats. Use durable categories.
- Where you make a claim about prevalence, efficacy, or research, include the specific number or study where you can. "70-80% heritability" beats "highly heritable".
- Banned words: delve, navigate (verb), game-changer, moreover, furthermore, in conclusion, unleash, leverage (verb), seamlessly, dive deep, robust, cutting-edge, revolutionary, transformative, harness, embark on, journey (metaphorical).

OUTPUT: Just the HTML, starting with <h1>. No preamble, no markdown fence.`;

  const user = `Keyword: "${keyword}"
Cluster: ${cluster}
Slug: ${slug}

Write the complete article now. ~2,800 words.`;

  const body = {
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: user }],
  };
  const r = await req('api.anthropic.com', 'POST', '/v1/messages', {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }, body);
  if (r.status !== 200 || !r.body.content || !r.body.content[0]) {
    throw new Error('Anthropic API error: ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 300));
  }
  let html = r.body.content[0].text || '';
  html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  // Ensure article starts with <h1>. If Sonnet wrote a preamble, strip it.
  const h1Idx = html.indexOf('<h1');
  if (h1Idx > 0) html = html.slice(h1Idx);
  // If still no <h1>, retry once with stricter prompt
  if (!html.includes('<h1')) {
    const retry = await req('api.anthropic.com', 'POST', '/v1/messages', {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    }, {
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      system,
      messages: [
        { role: 'user', content: user },
        { role: 'assistant', content: html.slice(0, 100) },
        { role: 'user', content: 'Your previous response was missing the <h1>. Output the COMPLETE article starting with <h1>{title}</h1>. No preamble, no markdown fence, just HTML starting with <h1>.' },
      ],
    });
    if (retry.status === 200 && retry.body.content && retry.body.content[0]) {
      html = (retry.body.content[0].text || '').replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
      const h1Idx2 = html.indexOf('<h1');
      if (h1Idx2 > 0) html = html.slice(h1Idx2);
    }
  }
  return html;
}

// ─── PHASE 4: Run create-post.js engine ──────────────────────────────────────
// Ensure .env exists for create-post.js (which reads its own .env file).
// In GitHub Actions / cloud envs, .env doesn't exist on disk — write it from process.env.
function ensureEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) return;
  const envContent = [
    'WP_HOST=' + WP_HOST,
    'WP_USER=' + WP_USER,
    'WP_APP_PASSWORD=' + WP_APP_PASSWORD,
  ].join('\n') + '\n';
  fs.writeFileSync(envPath, envContent);
  console.log('  [env] wrote .env for create-post.js (runtime-generated from process.env)');
}

function extractH1(slug) {
  // Read the saved post HTML and extract the H1 text (used for --title fallback)
  try {
    const html = fs.readFileSync(path.join(__dirname, 'posts-new', `post-${slug}.html`), 'utf8');
    const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

function shortenTitle(h1, max = 58) {
  // If H1 ≤ max, return null (no override needed). Else truncate at last word boundary.
  if (h1.length <= max) return null;
  // Try to cut at the colon if there is one
  const colon = h1.indexOf(':');
  if (colon > 0 && colon <= max) return h1.slice(0, colon).trim();
  // Else truncate at word boundary
  const truncated = h1.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 30 ? truncated.slice(0, lastSpace).trim() : truncated.trim();
}

function runEngine(slug, keyword) {
  ensureEnvFile();
  const file = `posts-new/post-${slug}.html`;
  const skipCoverFlag = SKIP_COVER ? ' --skip-cover' : '';
  // Auto-detect H1 too long and pass --title with shortened version
  const h1 = extractH1(slug);
  let titleFlag = '';
  if (h1) {
    const short = shortenTitle(h1);
    if (short) titleFlag = ` --title=${JSON.stringify(short)}`;
  }
  const cmd = `node create-post.js ${JSON.stringify(file)} --keyword=${JSON.stringify(keyword)}${skipCoverFlag}${titleFlag}`;
  try {
    const out = execSync(cmd, { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const idMatch = out.match(/Post ID:\s+(\d+)/);
    const featMatch = out.match(/Featured:\s+media #(\d+)/);
    return { ok: true, postId: idMatch ? +idMatch[1] : null, featured: featMatch ? +featMatch[1] : null, output: out };
  } catch (e) {
    return { ok: false, error: (e.stdout || e.stderr || e.message || '').slice(-500) };
  }
}

// ─── PHASE 5: Post-process — disclaimer + HowTo schema ───────────────────────
const DISCLAIMER = '<!-- wp:html --><div class="foco-disclaimer" style="margin:32px 0;padding:20px;background:rgba(167,139,250,0.06);border-left:3px solid #A78BFA;border-radius:8px;font-size:14px;color:#B8B0CC;line-height:1.6"><strong>Note.</strong> This article describes a pattern observed in many ADHD adults. It is not a substitute for clinical evaluation. If symptoms are significantly affecting your daily life, please consult a clinician with experience in adult ADHD.</div><!-- /wp:html -->';

function howToSchema(keyword) {
  return {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `How to apply: ${keyword}`,
    description: `A practical procedure for ADHD adults working through ${keyword}.`,
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Understand the mechanism', text: 'Read the neuroscience section to know what is actually happening in the ADHD brain.' },
      { '@type': 'HowToStep', position: 2, name: 'Recognize the pattern', text: 'Identify which of the patterns described matches your specific experience.' },
      { '@type': 'HowToStep', position: 3, name: 'Try one strategy', text: 'Pick one practical strategy from the article and use it for 7 days.' },
      { '@type': 'HowToStep', position: 4, name: 'Adjust based on results', text: 'Track what worked. Adjust or try a different strategy if needed.' },
    ],
  };
}

async function postProcess(postId) {
  const r = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content,title`);
  if (r.status !== 200) return { ok: false, error: 'fetch fail ' + r.status };
  let html = r.body.content.raw;
  let changes = [];
  if (!html.includes('foco-disclaimer')) {
    // Match <h2> with optional attributes (e.g., <h2 id="references">)
    const refsMatch = html.match(/<h2[^>]*>References<\/h2>/);
    if (refsMatch) {
      html = html.replace(refsMatch[0], DISCLAIMER + '\n\n' + refsMatch[0]);
      changes.push('disclaimer');
    }
  }
  if (!html.includes('"HowTo"')) {
    const block = `<!-- wp:html --><script type="application/ld+json">${JSON.stringify(howToSchema(r.body.title.rendered))}</script><!-- /wp:html -->`;
    html = html + '\n\n' + block;
    changes.push('HowTo');
  }
  if (changes.length === 0) return { ok: true, changes: [] };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, changes, status: upd.status };
}

// ─── PHASE 6.5: Inject Pexels images at H2 anchors ──────────────────────────
function pexelsSearch(query) {
  return new Promise((res, rej) => {
    const opts = {
      hostname: 'api.pexels.com', port: 443,
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      headers: { Authorization: PEXELS_KEY },
    };
    https.get(opts, (r) => {
      let d = ''; r.on('data', x => d += x);
      r.on('end', () => { try { res(JSON.parse(d)); } catch { rej(new Error('Pexels parse fail')); } });
    }).on('error', rej);
  });
}

function downloadFile(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) return res(downloadFile(r.headers.location));
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
}

async function uploadToWp(buffer, filename, contentType) {
  return new Promise((res, rej) => {
    const opts = {
      hostname: WP_HOST, port: 443, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: {
        Authorization: 'Basic ' + AUTH,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      },
    };
    const r = https.request(opts, (response) => {
      let d = ''; response.on('data', x => d += x);
      response.on('end', () => { try { res({ status: response.statusCode, body: JSON.parse(d) }); } catch { res({ status: response.statusCode, body: d }); } });
    });
    r.on('error', rej);
    r.write(buffer); r.end();
  });
}

// Build a visual-rich Pexels query from H2 text. Strips "what/why/how" lead, keeps content nouns.
function pexelsQueryFor(keyword, h2Text) {
  // Strip leading interrogatives + connectives
  let cleaned = h2Text
    .replace(/^(what|why|how|when|who|do|does|is|are|the|a|an)\b\s+/gi, '')
    .replace(/[?:.!,]/g, '')
    .trim();
  // Add visual modifiers based on topic clues
  const visualHints = [];
  if (/work|career|office|meeting/i.test(h2Text)) visualHints.push('workplace');
  else if (/sleep|rest|tired|exhaust/i.test(h2Text)) visualHints.push('bedroom morning');
  else if (/medic|drug|pill|prescrib|dose/i.test(h2Text)) visualHints.push('hands holding');
  else if (/test|diagnos|evaluat|appointment/i.test(h2Text)) visualHints.push('therapist office calm');
  else if (/focus|task|start|do/i.test(h2Text)) visualHints.push('desk laptop');
  else if (/cook|kitchen|meal|food/i.test(h2Text)) visualHints.push('kitchen prep');
  else if (/clean|tidy|home/i.test(h2Text)) visualHints.push('bright apartment');
  else if (/relat|partner|friend|social/i.test(h2Text)) visualHints.push('two people talking');
  else if (/kid|child|parent|family/i.test(h2Text)) visualHints.push('parent child home');
  else visualHints.push('person thoughtful');
  // Take first 3 content words from H2 + visual hint
  const contentWords = cleaned.split(/\s+/).slice(0, 3).join(' ');
  return `${contentWords} ${visualHints.join(' ')}`.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
}

// Generate descriptive alt text from H2 + visual scene (NOT keyword + title concat)
function altTextFor(h2Text, photographerHint) {
  const cleaned = h2Text
    .replace(/^(what|why|how|when|who|do|does|is|are)\b\s+/gi, '')
    .replace(/[?:.!,]/g, '')
    .trim();
  return `Person reflecting on ${cleaned.toLowerCase()}`.slice(0, 120);
}

async function injectPexelsImages(postId, keyword) {
  if (!PEXELS_KEY) return { ok: false, msg: 'no PEXELS_KEY — skipping Pexels' };
  const post = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content,slug`);
  if (post.status !== 200) return { ok: false, msg: 'fetch fail ' + post.status };
  let html = post.body.content.raw;
  const h2Re = /<h2[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h2>/g;
  const h2s = [...html.matchAll(h2Re)].slice(0, 5);
  if (h2s.length === 0) return { ok: false, msg: 'no anchored H2s found' };
  const picked = h2s.length <= 3 ? h2s : [h2s[0], h2s[Math.floor(h2s.length / 2)], h2s[h2s.length - 1]];

  // Track used photo IDs + photographers across this article so we don't repeat
  const usedPhotoIds = new Set();
  const usedPhotographers = new Set();
  let inserted = 0;
  const slug = post.body.slug;

  for (const h2 of picked) {
    const h2Tag = h2[0];
    const h2Text = h2[2];
    const query = pexelsQueryFor(keyword, h2Text);
    try {
      const pex = await pexelsSearch(query);
      if (!pex.photos || pex.photos.length === 0) continue;
      // Pick first photo whose id+photographer aren't already used in this article
      const candidates = pex.photos.filter(p => !usedPhotoIds.has(p.id) && !usedPhotographers.has(p.photographer));
      const pool = candidates.length > 0 ? candidates : pex.photos;
      // Random pick within first 5 (diversity)
      const photo = pool[Math.floor(Math.random() * Math.min(5, pool.length))];
      usedPhotoIds.add(photo.id);
      usedPhotographers.add(photo.photographer);
      const imgUrl = photo.src.large;
      const imgBuf = await downloadFile(imgUrl);
      const photographer = (photo.photographer || 'Pexels').replace(/[^a-zA-Z0-9 ]/g, '');
      const ext = imgUrl.match(/\.(jpe?g|png|webp)/i) ? imgUrl.match(/\.(jpe?g|png|webp)/i)[0] : '.jpg';
      const fname = `${slug}-${photo.id}${ext}`;
      const up = await uploadToWp(imgBuf, fname, 'image/jpeg');
      if (up.status !== 201) continue;
      const mediaUrl = up.body.source_url;
      const altText = altTextFor(h2Text, photographer);
      const figure = `\n<!-- wp:html --><figure class="foco-img" style="margin:28px 0"><img src="${mediaUrl}" alt="${altText.replace(/"/g, '&quot;')}" loading="lazy" style="width:100%;height:auto;border-radius:14px;display:block;border:1px solid rgba(167,139,250,0.18)"/><figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">Photo: ${photographer} via Pexels</figcaption></figure><!-- /wp:html -->\n`;
      html = html.replace(h2Tag, h2Tag + figure);
      inserted++;
    } catch (e) {
      // Skip this H2's image
    }
  }
  if (inserted === 0) return { ok: false, msg: 'no images inserted' };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, msg: `${inserted} Pexels image(s) inserted (diverse photographers)` };
}

// ─── PHASE 6.6: Render FOCO_CHART markers via chart-kit.js ───────────────────
async function renderCharts(postId) {
  let K;
  try { K = require('./chart-kit'); } catch (e) { return { ok: false, msg: 'chart-kit.js not loadable: ' + e.message }; }
  const post = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content`);
  if (post.status !== 200) return { ok: false, msg: 'fetch fail ' + post.status };
  let html = post.body.content.raw;
  // Match: <!-- FOCO_CHART:TYPE\n{json}\n-->
  const re = /<!--\s*FOCO_CHART:(\w+)\s*([\s\S]*?)-->/g;
  const matches = [...html.matchAll(re)];
  if (matches.length === 0) return { ok: true, msg: '0 chart markers found' };
  let rendered = 0;
  for (const m of matches) {
    const type = m[1];
    const jsonRaw = m[2].trim();
    let spec;
    try { spec = JSON.parse(jsonRaw); }
    catch (e) {
      // Strip code fences if present
      const cleaned = jsonRaw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      try { spec = JSON.parse(cleaned); } catch (e2) {
        console.log(`  [6.6] ⚠ chart ${type}: JSON parse failed, skipping`);
        continue;
      }
    }
    if (typeof K[type] !== 'function') {
      console.log(`  [6.6] ⚠ chart type "${type}" not in chart-kit.js, skipping`);
      continue;
    }
    try {
      const chartHtml = K[type](spec);
      const wrapped = `<!-- wp:html -->${chartHtml}<!-- /wp:html -->`;
      // Replace the entire <!-- FOCO_CHART... --> marker with wrapped chart
      html = html.replace(m[0], wrapped);
      rendered++;
    } catch (e) {
      console.log(`  [6.6] ⚠ chart ${type} render failed: ${e.message}`);
    }
  }
  if (rendered === 0) return { ok: true, msg: `0/${matches.length} charts rendered` };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, msg: `${rendered}/${matches.length} chart(s) rendered + pushed` };
}

// ─── PHASE 7: Programmatic audit ─────────────────────────────────────────────
async function audit(postId) {
  const r = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content,title,status`);
  if (r.status !== 200) return { ok: false, error: 'fetch fail' };
  const html = r.body.content.raw;
  const intLinks = (html.match(/href="https:\/\/www\.tryfoco\.com\/[\w-]+\//g) || []).length;
  const extLinks = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].filter(m => !m[1].includes('tryfoco') && !m[1].includes('schema.org')).length;
  const checks = {
    'Internal links (≥4)': intLinks >= 4,
    'External citations (≥3)': extLinks >= 3,
    'TL;DR': html.includes('foco-tldr'),
    'Key Takeaways': html.includes('foco-key-takeaways'),
    'FAQ': /<h2[^>]*>FAQ<\/h2>/i.test(html),
    'Bottom Line': /Bottom Line/i.test(html),
    'Disclaimer': html.includes('foco-disclaimer'),
    'Related articles': /related\s+articles/i.test(html),
    'References': html.includes('foco-references'),
    'FAQPage schema': html.includes('FAQPage'),
    'Article schema': html.includes('"Article"'),
    'HowTo schema': html.includes('"HowTo"'),
    'No editorial markers': !/\[(PERSONAL|UNIQUE|ORIGINAL|IMAGE:|CHART:|CITATION:)/.test(html),
    'No markdown links': !/\[[^\]]+\]\(https?:/.test(html),
  };
  const failed = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
  return {
    ok: failed.length === 0,
    title: r.body.title.rendered,
    status: r.body.status,
    intLinks, extLinks,
    wc: html.split(/\s+/).length,
    failed,
    checks,
  };
}

// ─── PHASE 9: Email via Resend ───────────────────────────────────────────────
async function sendEmail({ subject, html }) {
  if (!RESEND_KEY) { console.log('No RESEND_KEY — skipping email'); return { ok: false, skip: true }; }
  const r = await req('api.resend.com', 'POST', '/emails', {
    Authorization: 'Bearer ' + RESEND_KEY,
  }, {
    from: 'Foco Daily <onboarding@resend.dev>',
    to: [NOTIFY_EMAIL],
    subject,
    html,
  });
  return { ok: r.status === 200, status: r.status, body: r.body };
}

function buildEmailHtml({ picks, results }) {
  const date = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: 'short', day: 'numeric' });
  const time = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const ok = results.filter(r => r.audit && r.audit.ok);
  const fail = results.filter(r => !r.audit || !r.audit.ok);
  let html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:680px;color:#222">`;
  html += `<h2 style="color:#7C3AED">🤖 Foco Daily — ${date}</h2>`;
  html += `<p style="color:#666">${time} Israel time</p>`;
  html += `<h3>${ok.length}/${results.length} articles created ✓</h3>`;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const p = picks[i];
    html += `<div style="border-left:4px solid ${r.audit && r.audit.ok ? '#7C3AED' : '#FB923C'};padding:12px 16px;margin:12px 0;background:#fafafa">`;
    html += `<strong>${i + 1}. ${(r.audit && r.audit.title) || p.keyword}</strong><br>`;
    html += `<small>Slug: /${p.slug}/ | Keyword: "${p.keyword}" | Cluster: ${p.cluster}</small><br>`;
    if (r.audit) {
      html += `<small>WC: ${r.audit.wc} | Internal: ${r.audit.intLinks} | External: ${r.audit.extLinks} | Status: ${r.audit.status}</small><br>`;
      if (r.audit.failed.length) html += `<small style="color:#FB923C">⚠️ Failed checks: ${r.audit.failed.join(', ')}</small><br>`;
      else html += `<small style="color:#7C3AED">✓ All 14 spec items pass</small><br>`;
      html += `<a href="https://${WP_HOST}/wp-admin/post.php?post=${r.engine.postId}&action=edit">Edit in WP</a>`;
    } else {
      html += `<small style="color:#FB923C">⚠️ Failed: ${r.error}</small>`;
    }
    html += `</div>`;
  }
  html += `<p style="color:#666;margin-top:24px"><strong>Next steps:</strong> Review each draft → Publish from wp-admin → Reply "published" in Claude Code → IndexNow ping fires automatically.</p>`;
  html += `</div>`;
  return html;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function sendFailureEmail(stage, error) {
  try {
    const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:680px;color:#222">
      <h2 style="color:#FB923C">⚠️ Foco Daily — FAILED at ${stage}</h2>
      <p style="color:#666">${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })} Israel time</p>
      <p>The daily routine could not complete. Stage that failed: <strong>${stage}</strong></p>
      <pre style="background:#fafafa;padding:12px;border-radius:4px;font-family:monospace;font-size:11px;white-space:pre-wrap;overflow:auto">${String(error.stack || error.message || error).slice(0, 4000)}</pre>
      <p style="color:#666;margin-top:24px">No articles created today. Check the error above and rerun manually if needed.</p>
    </div>`;
    await sendEmail({ subject: `⚠️ Foco Daily — failed at ${stage}`, html });
  } catch (e) {
    console.error('Could not send failure email:', e.message);
  }
}

(async () => {
  console.log('━'.repeat(60));
  console.log(' FOCO DAILY ROUTINE — ' + new Date().toISOString());
  console.log('━'.repeat(60));

  // PHASE 1: pick
  let picks;
  try {
    if (FORCE_KEYWORD) {
      picks = [{ keyword: FORCE_KEYWORD, slug: slugify(FORCE_KEYWORD), cluster: 'manual', volume: 0, sd: 0, score: 0 }];
    } else {
      console.log('\n[Phase 1] Picking ' + COUNT + ' keywords...');
      picks = await pickKeywords();
    }
    if (!picks || picks.length === 0) throw new Error('Picker returned 0 candidates — blocklist or filters too strict');
  } catch (e) {
    console.error('PICK FAILED:', e.message);
    await sendFailureEmail('Phase 1 — keyword picker', e);
    process.exit(1);
  }
  console.log(`  Picked: ${picks.map(p => p.keyword).join(' | ')}`);

  if (DRY_RUN) {
    console.log('\n[Dry run] would generate:');
    picks.forEach((p, i) => console.log(`  ${i + 1}. ${p.keyword} (${p.cluster}, vol=${p.volume}, sd=${p.sd}, score=${p.score})`));
    process.exit(0);
  }

  const results = [];
  for (const pick of picks) {
    console.log(`\n→ Processing: ${pick.keyword}`);
    let result = { pick };
    try {
      // Phase 3: generate
      console.log('  [3] Generating article (Anthropic API)...');
      const html = await generateArticle(pick);
      const filePath = path.join(__dirname, 'posts-new', `post-${pick.slug}.html`);
      fs.writeFileSync(filePath, html);
      console.log(`  [3] Saved: ${filePath} (${html.length} chars)`);

      // Phase 4: engine
      console.log('  [4] Running create-post.js engine...');
      result.engine = runEngine(pick.slug, pick.keyword);
      if (!result.engine.ok) throw new Error('Engine: ' + result.engine.error);
      console.log(`  [4] ✓ Post #${result.engine.postId}`);

      // Phase 5: post-process
      console.log('  [5] Adding disclaimer + HowTo schema...');
      result.postProcess = await postProcess(result.engine.postId);
      console.log(`  [5] ${result.postProcess.changes.join(', ') || 'no changes'}`);

      // Phase 6.5: Pexels images
      console.log('  [6.5] Injecting Pexels images at H2 anchors...');
      result.pexels = await injectPexelsImages(result.engine.postId, pick.keyword);
      console.log(`  [6.5] ${result.pexels.msg}`);

      // Phase 6.6: Render FOCO_CHART markers via chart-kit.js
      console.log('  [6.6] Rendering chart markers (statGrid, horizontalBar, etc.)...');
      result.charts = await renderCharts(result.engine.postId);
      console.log(`  [6.6] ${result.charts.msg}`);

      // Phase 7: audit
      console.log('  [7] Running spec audit...');
      result.audit = await audit(result.engine.postId);
      if (result.audit.ok) console.log('  [7] ✓ All 14 checks pass');
      else console.log('  [7] ⚠️ Failed: ' + result.audit.failed.join(', '));
    } catch (e) {
      result.error = e.message;
      console.log('  ✗ Error: ' + e.message);
    }
    results.push(result);
  }

  // Phase 8: tracker
  const trackerPath = path.join(__dirname, 'keyword-research', 'pipeline-tracker.json');
  const tracker = fs.existsSync(trackerPath) ? JSON.parse(fs.readFileSync(trackerPath, 'utf8')) : { runs: [] };
  tracker.runs.push({
    date: new Date().toISOString(),
    posts: results.map((r, i) => ({
      slug: picks[i].slug,
      keyword: picks[i].keyword,
      cluster: picks[i].cluster,
      postId: r.engine && r.engine.postId,
      ok: !!(r.audit && r.audit.ok),
      failed: r.audit ? r.audit.failed : ['error: ' + (r.error || 'unknown')],
    })),
  });
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  console.log('\n[8] Tracker updated: ' + trackerPath);

  // Phase 9: email
  console.log('\n[9] Sending email...');
  const okCount = results.filter(r => r.audit && r.audit.ok).length;
  const subject = okCount === results.length
    ? `Foco Daily ✓ ${okCount}/${results.length} articles created`
    : `⚠️ Foco Daily — ${okCount}/${results.length} articles (some failed)`;
  const emailRes = await sendEmail({ subject, html: buildEmailHtml({ picks, results }) });
  console.log('[9] Email: ' + (emailRes.ok ? '✓ sent' : '⚠️ ' + JSON.stringify(emailRes.body).slice(0, 200)));

  // Count posts that were CREATED (engine.ok), regardless of audit warnings
  const createdCount = results.filter(r => r.engine && r.engine.ok && r.engine.postId).length;
  const auditOkCount = results.filter(r => r.audit && r.audit.ok).length;
  console.log('\n━'.repeat(60));
  console.log(` DONE — ${createdCount}/${results.length} posts created (${auditOkCount} passed full audit)`);
  console.log('━'.repeat(60));
  // Exit 0 if at least one post was successfully created. Audit warnings are not failures.
  // Exit 1 only when ALL articles failed at engine push (real automation breakage).
  process.exit(createdCount > 0 ? 0 : 1);
})();
