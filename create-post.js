// create-post.js
// Unified blog-post creation pipeline. ONE command to do all 14 steps.
// See CLAUDE.md "Publishing Pipeline" section for the full spec.
//
// Usage:
//   node create-post.js posts-new/post-{slug}.html \
//     --keyword="adhd task paralysis" \
//     [--pillar] [--howto] [--publish] \
//     [--title="WP Title ≤58 chars"] \
//     [--cover-title="Two\nLines"] \
//     [--skip-cover] [--skip-pexels] [--dry-run]
//
// Idempotent: re-running detects existing state and updates instead of duplicating.

const https = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ─── LOAD .env ───────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) { console.error('❌ .env not found at', envPath); process.exit(1); }
  const env = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq < 0) return;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return env;
}
const ENV = loadEnv();
const WP_HOST = ENV.WP_HOST || 'tryfoco.com';
const WP_USER = ENV.WP_USER;
const WP_PASS = ENV.WP_APP_PASSWORD;
if (!WP_USER || !WP_PASS) { console.error('❌ WP_USER + WP_APP_PASSWORD must be set in .env'); process.exit(1); }
const auth = Buffer.from(WP_USER + ':' + WP_PASS).toString('base64');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const COVERS_DIR = path.join(__dirname, 'covers-new');
const POSTS_DIR  = path.join(__dirname, 'posts-new');
const MASCOT_DIR = path.join(__dirname, 'assets', 'mascots');
const SLUG_MAP_PATH = path.join(__dirname, 'slug-map.json');
const TITLE_LIMIT_DB = 58;
const TITLE_SUFFIX = ' — FOCO';
const TITLE_SUFFIX_LEN = TITLE_SUFFIX.length;
const PUBLISH_LOCK_THRESHOLD = 10; // posts 1-10 are forced-draft regardless of --publish

// FOCO theme colors (must match CLAUDE.md)
const C = {
  bg:        '#040208',
  bg2:       '#0a0410',
  primary:   '#7C3AED',
  primary2:  '#A78BFA',
  text:      '#FFFFFF',
};

// Mascot per pillar (matches CLAUDE.md mapping) — used for cover image
const PILLAR_MASCOT = {
  'adhd-task-paralysis':       'foco_state_6_pause',
  'adhd-executive-function':   'foco_state_1_presence',
  'how-to-focus-with-adhd':    'foco_state_3_focus',
  'adhd-for-students':         'foco_state_3_focus',
  'adhd-at-work':              'foco_state_2_alignment',
  'adhd-task-breakdown-apps':  'foco_state_5_completion',
};
const DEFAULT_MASCOT = 'foco_state_1_presence';

// Mascot divider sequences per pillar — 3 positions (early, middle, late)
// telling the post's emotional arc visually. Override via chart-configs.js
// with `mascotDividers` array if a specific post needs a different sequence.
const PILLAR_DIVIDERS = {
  'adhd-task-paralysis':      ['foco_state_6_pause',   'foco_state_3_focus', 'foco_state_2_alignment'],
  'adhd-executive-function':  ['foco_state_1_presence','foco_state_3_focus', 'foco_state_2_alignment'],
  'how-to-focus-with-adhd':   ['foco_state_4_drift',   'foco_state_3_focus', 'foco_state_5_completion'],
  'adhd-for-students':        ['foco_state_4_drift',   'foco_state_3_focus', 'foco_state_5_completion'],
  'adhd-at-work':             ['foco_state_4_drift',   'foco_state_3_focus', 'foco_state_2_alignment'],
  'adhd-task-breakdown-apps': ['foco_state_6_pause',   'foco_state_3_focus', 'foco_state_5_completion'],
};
const DEFAULT_DIVIDERS = ['foco_state_6_pause', 'foco_state_3_focus', 'foco_state_2_alignment'];

// ─── CLI PARSING ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(n) { return args.includes('--' + n); }
function arg(n)  { const m = args.find(a => a.startsWith('--' + n + '=')); return m ? m.slice(n.length + 3) : null; }
const file = args.find(a => !a.startsWith('--'));
if (!file) {
  console.error('Usage: node create-post.js <file.html> --keyword="..." [--pillar] [--howto] [--publish] [--title="..."] [--cover-title="Two\\nLines"] [--skip-cover] [--skip-pexels] [--dry-run]');
  process.exit(1);
}
const isPillar       = flag('pillar');
const isHowto        = flag('howto');
const wantPublish    = flag('publish');
const keyword        = arg('keyword');
const titleOverride  = arg('title');
const coverTitleArg  = arg('cover-title');
const dryRun         = flag('dry-run');
const skipCover      = flag('skip-cover');
const skipPexels     = flag('skip-pexels');

const PEXELS_KEY_PATH = path.join(__dirname, '.pexels-key');
const PEXELS_KEY = (!skipPexels && fs.existsSync(PEXELS_KEY_PATH)) ? fs.readFileSync(PEXELS_KEY_PATH, 'utf8').trim() : null;

if (!keyword) { console.error('❌ --keyword="..." is REQUIRED.'); process.exit(1); }
if (!fs.existsSync(file)) { console.error('❌ File not found:', file); process.exit(1); }
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

const slug = path.basename(file).replace(/^post-/, '').replace(/\.html$/, '');

console.log('\n' + '━'.repeat(78));
console.log(`  FOCO POST PIPELINE — ${dryRun ? '🟢 DRY-RUN' : '🔴 LIVE'}`);
console.log(`  File: ${file}`);
console.log(`  Slug: ${slug}   Pillar: ${isPillar ? 'YES' : 'no'}   Keyword: "${keyword}"`);
console.log('━'.repeat(78));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const log = {
  ok:   m => console.log('  ✓ ' + m),
  warn: m => console.log('  ⚠ ' + m),
  err:  m => console.log('  ✗ ' + m),
  step: n => console.log('\n━ ' + n + ' ━'),
};

function wpReq(method, p, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const req = https.request({
      hostname: WP_HOST, path: p, method,
      headers: { Authorization: 'Basic ' + auth, ...(data && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }) },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: r.statusCode, data: Buffer.concat(chunks).toString().slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(body);
    req.end();
  });
}

function wpUpload(filePath, filename, mime) {
  return new Promise((resolve, reject) => {
    const buf = fs.readFileSync(filePath);
    const req = https.request({
      hostname: WP_HOST, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': mime, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buf.length },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: r.statusCode, data: Buffer.concat(chunks).toString().slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

async function rankMathMeta(postId, meta) {
  // RankMath's updateMeta sometimes returns 404 right after a post is created
  // (Cloudways edge cache + nonce timing). Retry once with a delay.
  let r = await wpReq('POST', '/wp-json/rankmath/v1/updateMeta', { objectType: 'post', objectID: postId, meta });
  if (r.status === 404) {
    await new Promise(res => setTimeout(res, 1500));
    r = await wpReq('POST', '/wp-json/rankmath/v1/updateMeta', { objectType: 'post', objectID: postId, meta });
  }
  return r;
}

// ─── STEP 1: PARSE + VALIDATE ────────────────────────────────────────────────
function parseAndValidate(html) {
  const out = { warnings: [], errors: [] };

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  out.h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : null;
  if (!out.h1) out.errors.push('No <h1> in post HTML');

  const editorialMarkers = (html.match(/\[(?:PERSONAL EXPERIENCE|UNIQUE INSIGHT|ORIGINAL DATA|INFORMATION GAIN|EXPERT INSIGHT|RESEARCH DATA|CITATION|IMAGE|CHART)\]/gi) || []).length;
  if (editorialMarkers > 0) out.errors.push(`${editorialMarkers} editorial marker(s) found — remove before publishing`);

  const mdLinks = (html.match(/\[[^\]]+\]\(https?:\/\//g) || []).length;
  if (mdLinks > 0) out.errors.push(`${mdLinks} markdown link(s) — convert to <a href>`);

  out.hasTldr = /class="foco-tldr"/.test(html);
  if (!out.hasTldr) out.warnings.push('No TL;DR box — GEO impact, will auto-inject if possible');

  out.hasFaq = /<h2[^>]*>\s*FAQ|frequently asked/i.test(html);
  if (!out.hasFaq) out.warnings.push('No FAQ section detected — FAQ schema will be skipped');

  out.hasKeyTakeaways = /class="foco-key-takeaways"|<h2[^>]*>\s*Key Takeaways/i.test(html);
  if (!out.hasKeyTakeaways) out.warnings.push('No Key Takeaways box — GEO impact');

  const internalLinks = (html.match(/href=["']https?:\/\/(?:www\.)?tryfoco\.com\/[^"']+\/?["']/g) || []).length;
  out.internalLinks = internalLinks;
  if (internalLinks < 4) out.warnings.push(`Only ${internalLinks} internal links — target ≥4`);

  const externalLinks = [...html.matchAll(/<a\s+[^>]*href=["']https?:\/\/(?!(?:www\.)?tryfoco\.com)[^"']+["']/gi)].length;
  out.externalLinks = externalLinks;
  if (externalLinks < 3) out.warnings.push(`Only ${externalLinks} external citations — target ≥3 for E-E-A-T`);

  // Long paragraphs
  const longPs = [];
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = m[1].replace(/<[^>]+>/g, '');
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
    if (sentences.length > 3) longPs.push(text.slice(0, 80));
  }
  if (longPs.length > 0) out.warnings.push(`${longPs.length} paragraph(s) >3 sentences — auto-splitter will fix`);

  // Banned AI clichés
  const banned = ['delve', 'navigate', 'game-changer', 'moreover', 'furthermore', 'in today\'s fast-paced', 'in conclusion', 'unleash', 'leverage', 'seamlessly', 'dive deep', 'robust', 'cutting-edge', 'revolutionary', 'transformative', 'embark on'];
  const found = banned.filter(b => new RegExp('\\b' + b.replace(/'/g, "['']") + '\\b', 'i').test(html));
  if (found.length > 0) out.warnings.push(`Banned phrases found: ${found.join(', ')}`);

  return out;
}

// ─── STEP 2: AUTO-SPLIT LONG PARAGRAPHS ──────────────────────────────────────
function splitLongParagraphs(content, maxSentences = 3) {
  let total = 0, pass = 0, prev = '', cur = content;
  while (cur !== prev && pass < 10) {
    prev = cur; pass++;
    let passSplits = 0;
    cur = cur.replace(/<p([^>]*)>([\s\S]*?)<\/p>/g, (match, attrs, inner) => {
      const plain = inner.replace(/<[^>]+>/g, '');
      const sentences = plain.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
      if (sentences.length <= maxSentences) return match;
      const periods = [];
      let inTag = false;
      for (let i = 0; i < inner.length - 1; i++) {
        if (inner[i] === '<') inTag = true;
        if (inner[i] === '>') { inTag = false; continue; }
        if (!inTag && /[.!?]/.test(inner[i]) && /\s/.test(inner[i + 1])) periods.push(i);
      }
      if (periods.length < 2) return match;
      const mid = periods[Math.floor(periods.length / 2)];
      const a = inner.slice(0, mid + 1).trim();
      const b = inner.slice(mid + 1).trim();
      if (a.length < 30 || b.length < 30) return match;
      passSplits++;
      return `<p${attrs}>${a}</p>\n<p${attrs}>${b}</p>`;
    });
    total += passSplits;
    if (passSplits === 0) break;
  }
  return { content: cur, count: total };
}

// ─── STEP 3: TABLE OF CONTENTS ───────────────────────────────────────────────
function slugifyHeading(t) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60); }

function injectTableOfContents(content) {
  if (/<h2[^>]*>\s*Table of Contents\s*<\/h2>/i.test(content)) return { content, count: 0, msg: 'TOC already present' };
  const entries = [], used = new Set();
  let withIds = content.replace(/<h2(?:\s+[^>]*)?>([\s\S]*?)<\/h2>/g, (match, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return match;
    if (/^(table of contents|the bottom line|key takeaways|faq|frequently asked questions)$/i.test(text)) return match;
    if (/id\s*=/.test(match)) {
      const idMatch = match.match(/id\s*=\s*["']([^"']+)["']/);
      if (idMatch) entries.push({ id: idMatch[1], text });
      return match;
    }
    let id = slugifyHeading(text), n = 2;
    while (used.has(id)) { id = slugifyHeading(text) + '-' + n++; }
    used.add(id);
    entries.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  if (entries.length < 3) return { content: withIds, count: 0, msg: 'not enough h2 sections for TOC' };

  const toc = `\n<h2>Table of Contents</h2>\n<ol>\n${entries.map(e => `  <li><a href="#${e.id}">${e.text}</a></li>`).join('\n')}\n</ol>\n`;

  // Insert after Key Takeaways div, OR before first H2 if not found
  const ktClose = withIds.indexOf('</div>', withIds.indexOf('class="foco-key-takeaways"'));
  if (ktClose > 0) {
    const insertAt = ktClose + '</div>'.length;
    withIds = withIds.slice(0, insertAt) + '\n' + toc + withIds.slice(insertAt);
  } else {
    const firstH2 = withIds.search(/<h2[\s>]/);
    if (firstH2 < 0) return { content: withIds, count: 0, msg: 'no insertion point' };
    withIds = withIds.slice(0, firstH2) + toc + '\n' + withIds.slice(firstH2);
  }
  return { content: withIds, count: entries.length, msg: `${entries.length}-entry TOC inserted` };
}

// ─── STEP 4: LINK VALIDATION ─────────────────────────────────────────────────
function loadSlugMap() {
  if (!fs.existsSync(SLUG_MAP_PATH)) return { pillars: {}, spokes: {}, infrastructure: {} };
  return JSON.parse(fs.readFileSync(SLUG_MAP_PATH, 'utf8'));
}

function extractInternalLinks(content) {
  const re = /href=["']https?:\/\/(?:www\.)?tryfoco\.com\/([^"'#?]+?)\/?["']/g;
  const slugs = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    const s = m[1].replace(/^\/+|\/+$/g, '');
    if (s && !s.startsWith('wp-') && !s.startsWith('category/') && !s.startsWith('tag/')) slugs.add(s);
  }
  return [...slugs];
}

function checkSlugInWp(slug) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: WP_HOST,
      path: `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any&_fields=id,status`,
      method: 'GET', headers: { Authorization: 'Basic ' + auth },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (Array.isArray(data) && data.length > 0) resolve({ exists: true, status: data[0].status });
          else resolve({ exists: false, status: null });
        } catch (e) { resolve({ exists: false, status: null }); }
      });
    });
    req.on('error', () => resolve({ exists: false, status: null }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ exists: false, status: null }); });
    req.end();
  });
}

async function validateInternalLinks(content) {
  const slugs = extractInternalLinks(content);
  const map = loadSlugMap();
  const reservedSlugs = new Set([
    ...Object.keys(map.pillars || {}),
    ...Object.keys(map.spokes || {}),
    ...Object.keys(map.infrastructure || {}),
  ]);

  const results = await Promise.all(slugs.map(s => checkSlugInWp(s).then(r => ({ slug: s, ...r }))));
  const live    = results.filter(r => r.exists && r.status === 'publish');
  const drafts  = results.filter(r => r.exists && r.status !== 'publish');
  const planned = results.filter(r => !r.exists && reservedSlugs.has(r.slug));
  const dead    = results.filter(r => !r.exists && !reservedSlugs.has(r.slug));
  return { unique: slugs.length, live, drafts, planned, dead };
}

function autoFixExternalLinks(content) {
  let fixed = 0;
  const re = /<a\s+([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*)>/gi;
  const replacements = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    if (/tryfoco\.com/.test(m[2])) continue;
    const allAttrs = (m[1] + ' ' + m[3]).toLowerCase();
    const hasTarget = /target\s*=/.test(allAttrs);
    const hasNoopener = /rel\s*=\s*["'][^"']*noopener/.test(allAttrs);
    if (hasTarget && hasNoopener) continue;
    const cleanAttrs = (m[1] + m[3]).replace(/\btarget\s*=\s*["'][^"']*["']/gi, '').replace(/\brel\s*=\s*["'][^"']*["']/gi, '').replace(/\s+/g, ' ').trim();
    const replacement = `<a href="${m[2]}"${cleanAttrs ? ' ' + cleanAttrs : ''} target="_blank" rel="noopener">`;
    replacements.push({ from: m[0], to: replacement });
    fixed++;
  }
  for (const r of replacements) content = content.replace(r.from, r.to);
  return { content, fixed };
}

// ─── STEP 5: REBUILD CHARTS FROM CONFIG ──────────────────────────────────────
function rebuildChartsFromConfig(content, slug) {
  let configs;
  try { configs = require('./chart-configs'); } catch (e) { return { content, added: 0, msg: 'chart-configs.js not found' }; }
  const cfg = configs[slug];
  if (!cfg || !cfg.charts || cfg.charts.length === 0) return { content, added: 0, msg: 'no charts for this slug' };

  const stripRe = /<!-- wp:html -->\s*<figure class="foco-chart-\d+"[\s\S]*?<\/figure>\s*<!-- \/wp:html -->\n*/g;
  const stripped = (content.match(stripRe) || []).length;
  let out = content.replace(stripRe, '');

  const sorted = [...cfg.charts].sort((a, b) => b.pos - a.pos);
  const h2Re = /<h2[\s>]/gi;
  let added = 0;
  for (const { pos, html } of sorted) {
    const matches = [...out.matchAll(h2Re)];
    if (matches.length < pos) continue;
    const target = matches[pos - 1].index;
    out = out.slice(0, target) + '\n' + html + '\n\n' + out.slice(target);
    added++;
  }
  const msg = stripped > 0 ? `rebuilt: stripped ${stripped}, injected ${added}` : `${added} chart(s) injected`;
  return { content: out, added, stripped, msg };
}

// ─── STEP 6: PEXELS IMAGE INJECTION ──────────────────────────────────────────
function pexelsSearch(query) {
  return new Promise(resolve => {
    const req = https.request({ hostname: 'api.pexels.com', path: `/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, headers: { Authorization: PEXELS_KEY } }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch (e) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function downloadToFile(url, destPath) {
  return new Promise(resolve => {
    https.get(url, r => {
      if (r.statusCode === 301 || r.statusCode === 302) {
        return https.get(r.headers.location, r2 => { const s = fs.createWriteStream(destPath); r2.pipe(s); s.on('finish', () => { s.close(); resolve(true); }); }).on('error', () => resolve(false));
      }
      if (r.statusCode !== 200) return resolve(false);
      const s = fs.createWriteStream(destPath); r.pipe(s); s.on('finish', () => { s.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

function wpUploadJpg(filePath, filename, altText) {
  return new Promise(resolve => {
    const buf = fs.readFileSync(filePath);
    const boundary = '----FB' + Math.random().toString(36).slice(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buf, Buffer.from(footer)]);
    const req = https.request({ hostname: WP_HOST, path: '/wp-json/wp/v2/media', method: 'POST', headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length } }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.id && altText) wpReq('POST', '/wp-json/wp/v2/media/' + data.id, { alt_text: altText }).then(() => resolve(data));
          else resolve(data);
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body); req.end();
  });
}

const STOP_WORDS = new Set('a an and are as at be but by do does don from for has have how if in into is it its my of on or our she stop that the their them they this to too us was we were what when where why will with without you your he his her own one two three four five six seven eight nine ten not no actually really very just only also even still some most many'.split(' '));

function buildPexelsQuery(kw, h2Text) {
  const meaningful = h2Text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  const kwWords = new Set(kw.toLowerCase().split(/\s+/));
  const distinct = meaningful.filter(w => !kwWords.has(w)).slice(0, 2);
  return distinct.length > 0 ? `${kw} ${distinct.join(' ')}` : kw;
}

function stripPexelsImages(content) {
  return content.replace(/<!-- wp:html --><figure class="foco-img"[\s\S]*?<\/figure><!-- \/wp:html -->\n*/g, '');
}

function stripMascotDividers(content) {
  return content.replace(/<!-- wp:html --><figure class="foco-mascot-divider"[\s\S]*?<\/figure><!-- \/wp:html -->\n*/g, '');
}

function loadMascotUrls() {
  const p = path.join(__dirname, 'mascot-urls.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getDividerSequence(slug) {
  // Per-post override via chart-configs.js
  try {
    const cfg = require('./chart-configs');
    if (cfg[slug] && Array.isArray(cfg[slug].mascotDividers)) return cfg[slug].mascotDividers;
  } catch (e) {}

  // Pillar default
  const map = loadSlugMap();
  if (map.pillars && map.pillars[slug]) {
    return PILLAR_DIVIDERS[slug] || DEFAULT_DIVIDERS;
  }
  if (map.spokes && map.spokes[slug]) {
    const pillar = map.spokes[slug].pillar;
    return PILLAR_DIVIDERS[pillar] || DEFAULT_DIVIDERS;
  }
  return DEFAULT_DIVIDERS;
}

function injectMascotDividers(content, slug) {
  const urls = loadMascotUrls();
  if (!urls) return { content, added: 0, msg: 'mascot-urls.json missing — run setup-mascots.js' };

  // Strip any existing dividers first (idempotent re-runs)
  const beforeStrip = (content.match(/class="foco-mascot-divider"/g) || []).length;
  content = stripMascotDividers(content);

  const sequence = getDividerSequence(slug);

  // Find content H2s (skip TOC, Key Takeaways, FAQ, Bottom Line)
  const allH2 = [...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const contentH2s = allH2.filter(m => {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    return !/^(table of contents|key takeaways|faq|frequently asked questions|the bottom line)$/i.test(t);
  });

  // Place dividers AFTER H2 #1, #3, #5 (so they sit at the top of those sections' content)
  const targets = [1, 3, 5];
  let added = 0;

  // Process from latest to earliest so indexes don't shift
  for (let i = targets.length - 1; i >= 0; i--) {
    const h2Idx = targets[i];
    const h2Match = contentH2s[h2Idx];
    if (!h2Match) continue;
    const mascotName = sequence[i] || sequence[sequence.length - 1];
    const mascotData = urls[mascotName];
    if (!mascotData) continue;

    const after = h2Match[0];
    const idx = content.indexOf(after);
    if (idx === -1) continue;

    const figure = `\n\n<!-- wp:html --><figure class="foco-mascot-divider" style="margin:36px auto 28px;text-align:center;max-width:100%"><img src="${mascotData.url}" alt="" loading="lazy" style="width:200px;max-width:60%;height:auto;display:inline-block;filter:drop-shadow(0 20px 40px rgba(124,58,237,0.45)) drop-shadow(0 0 30px rgba(167,139,250,0.25))" aria-hidden="true"/></figure><!-- /wp:html -->\n`;
    content = content.slice(0, idx + after.length) + figure + content.slice(idx + after.length);
    added++;
  }

  const msg = beforeStrip > 0 ? `rebuilt: stripped ${beforeStrip}, injected ${added} mascot divider(s)` : `${added} mascot divider(s) injected`;
  return { content, added, msg };
}

// Curated Pexels injection — used when chart-configs.js defines pexelsPlans.
// Each plan = { query: "scene description", anchor: "exact substring after which to insert" }.
async function injectPexelsFromPlans(content, slug, plans) {
  if (!PEXELS_KEY) return { content, msg: 'no .pexels-key' };
  const TMP = path.join(__dirname, '.audit-cache', 'pexels-tmp');
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
  const used = new Set();
  let added = 0;
  for (const plan of plans) {
    const { query } = plan;
    // anchor can be an exact substring OR an H2 text that we match flexibly (with or without id attr)
    let idx = content.indexOf(plan.anchor);
    let anchorText = plan.anchor;
    if (idx === -1) {
      // Try matching H2 by inner text only (handles TOC-added id attrs)
      const h2Text = (plan.anchor.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
      if (h2Text) {
        const flexibleRe = new RegExp('<h2[^>]*>\\s*' + h2Text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*</h2>', 'i');
        const m = content.match(flexibleRe);
        if (m) { idx = content.indexOf(m[0]); anchorText = m[0]; }
      }
    }
    if (idx === -1) continue;
    // Skip if image already exists right after this anchor
    const after = content.slice(idx + anchorText.length, idx + anchorText.length + 300);
    if (/<figure[^>]*class="foco-img"/.test(after)) continue;
    const result = await pexelsSearch(query);
    if (!result || !result.photos || result.photos.length === 0) continue;
    const photo = result.photos.find(p => !used.has(p.id));
    if (!photo) continue;
    used.add(photo.id);
    const url = photo.src.large2x || photo.src.large;
    const desc = (photo.alt || query).replace(/[—|]/g, '-').trim();
    const altText = `${query.split(' ').slice(0, 4).join(' ')} — ${desc}`.slice(0, 125);
    const photographer = photo.photographer || 'Pexels';
    const localPath = path.join(TMP, `${slug}-${photo.id}.jpg`);
    if (!await downloadToFile(url, localPath)) continue;
    const media = await wpUploadJpg(localPath, `${slug}-${photo.id}.jpg`, altText);
    if (!media || !media.id) continue;
    const fig = `\n\n<!-- wp:html --><figure class="foco-img" style="margin:28px 0"><img src="${media.source_url}" alt="${altText.replace(/"/g, '&quot;')}" loading="lazy" style="width:100%;height:auto;border-radius:14px;display:block;border:1px solid rgba(167,139,250,0.18)"/><figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">Photo: ${photographer} via Pexels</figcaption></figure><!-- /wp:html -->\n`;
    content = content.slice(0, idx + anchorText.length) + fig + content.slice(idx + anchorText.length);
    added++;
  }
  return { content, msg: `${added} curated Pexels image(s) inserted` };
}

async function injectPexelsImages(content, kw, slug) {
  if (!PEXELS_KEY) return { content, added: 0, msg: 'no .pexels-key' };

  content = stripPexelsImages(content);
  const allH2 = [...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const contentH2s = allH2.filter(m => {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    return !/^(table of contents|key takeaways|faq|frequently asked questions|the bottom line)$/i.test(t);
  });

  const anchors = [];
  for (const i of [1, 3, 5]) {
    if (!contentH2s[i]) continue;
    anchors.push({ q: buildPexelsQuery(kw, contentH2s[i][1].replace(/<[^>]+>/g, '').trim()), after: contentH2s[i][0] });
  }
  if (anchors.length === 0) return { content, added: 0, msg: 'no content H2 anchors' };

  const TMP = path.join(__dirname, '.audit-cache', 'pexels-tmp');
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

  const used = new Set();
  let added = 0;
  for (const { q, after } of anchors) {
    const idx = content.indexOf(after);
    if (idx === -1) continue;
    const result = await pexelsSearch(q);
    if (!result || !result.photos || result.photos.length === 0) continue;
    const photo = result.photos.find(p => !used.has(p.id));
    if (!photo) continue;
    used.add(photo.id);
    const url = photo.src.large2x || photo.src.large;
    const desc = (photo.alt || 'editorial illustration').replace(/[—|]/g, '-').trim();
    const altText = `${kw} — ${desc}`.slice(0, 125);
    const photographer = photo.photographer || 'Pexels';
    const localPath = path.join(TMP, `${slug}-${photo.id}.jpg`);
    if (!await downloadToFile(url, localPath)) continue;
    const media = await wpUploadJpg(localPath, `${slug}-${photo.id}.jpg`, altText);
    if (!media || !media.id) continue;
    const fig = `\n\n<!-- wp:html --><figure class="foco-img" style="margin:24px 0"><img src="${media.source_url}" alt="${altText.replace(/"/g, '&quot;')}" loading="lazy" style="width:100%;height:auto;border-radius:14px;display:block"/><figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">Photo: ${photographer} via Pexels</figcaption></figure><!-- /wp:html -->\n`;
    content = content.slice(0, idx + after.length) + fig + content.slice(idx + after.length);
    added++;
  }
  return { content, added, msg: `${added} Pexels image(s) inserted` };
}

// ─── STEP 7: FAQ + HOWTO SCHEMA ──────────────────────────────────────────────
function buildFaqSchema(content) {
  const faqMatch = content.match(/<h2[^>]*>\s*FAQ[\s\S]*?(?=<h2[\s>]|$)/i);
  if (!faqMatch) return null;
  const block = faqMatch[0];
  const pairs = [];
  for (const m of block.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[\s>]|$)/gi)) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    const ps = [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(x => x[1].replace(/<[^>]+>/g, '').trim());
    const a = ps.join(' ').trim();
    if (q && a) pairs.push({ q, a });
  }
  if (pairs.length === 0) return null;
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: pairs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

function injectSchema(content, schema, type) {
  if (!schema) return content;
  if (content.includes(`"@type":"${type}"`)) return content;
  return content + '\n\n<!-- wp:html --><script type="application/ld+json">' + JSON.stringify(schema) + '</script><!-- /wp:html -->';
}

// ─── STEP 8: COVER GENERATION (mascot left + title right) ────────────────────
function deriveCoverTitle(h1) {
  const before = (h1.split(':')[0] || h1).trim();
  const words = before.split(/\s+/).slice(0, 4);
  if (words.length <= 2) return words.join(' ');
  const half = Math.ceil(words.length / 2);
  return words.slice(0, half).join(' ') + '\n' + words.slice(half).join(' ');
}

function coverHtml(title, mascotPath) {
  const mascotUri = 'file:///' + mascotPath.replace(/\\/g, '/');
  const titleHtml = title.split('\n').map(l => `<span>${l}</span>`).join('<br>');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Inter',-apple-system,'Segoe UI',sans-serif}
.cover{width:1200px;height:630px;background:linear-gradient(135deg,${C.bg} 0%,${C.bg2} 30%,#1a0a2e 60%,#2d1257 100%);display:flex;align-items:center;position:relative;overflow:hidden}
.cover::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 70% 30%,rgba(124,58,237,0.30),transparent 60%);pointer-events:none}
.cover::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 20% 90%,rgba(167,139,250,0.18),transparent 60%);pointer-events:none}
.accent{position:absolute;top:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,${C.primary},${C.primary2},${C.primary});box-shadow:0 0 16px rgba(167,139,250,0.6)}
.mascot-wrap{flex:0 0 35%;display:flex;align-items:center;justify-content:center;padding:0 20px 0 60px;position:relative;z-index:2}
.mascot-wrap img{width:100%;max-width:340px;filter:drop-shadow(0 30px 50px rgba(124,58,237,0.5))}
.title-wrap{flex:1;padding:0 60px 0 20px;position:relative;z-index:2}
.title{font-size:80px;font-weight:900;color:#fff;line-height:1.05;letter-spacing:-1.6px;text-shadow:0 4px 40px rgba(0,0,0,0.4)}
.title span{display:inline-block}
.brand{position:absolute;bottom:32px;right:48px;display:flex;align-items:center;gap:10px;z-index:3}
.logo-mark{width:34px;height:34px;background:linear-gradient(135deg,${C.primary},${C.primary2});border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:18px;box-shadow:0 0 24px rgba(124,58,237,0.5)}
.logo-text{font-weight:800;font-size:20px;color:#fff;letter-spacing:-0.4px}
</style></head><body><div class="cover">
<div class="accent"></div>
<div class="mascot-wrap"><img src="${mascotUri}" alt=""/></div>
<div class="title-wrap"><div class="title">${titleHtml}</div></div>
<div class="brand"><span class="logo-mark">F</span><span class="logo-text">FOCO</span></div>
</div></body></html>`;
}

async function generateCover(slug, h1, coverTitleArg) {
  const map = loadSlugMap();
  let mascotName = DEFAULT_MASCOT;
  if (map.pillars && map.pillars[slug]) mascotName = map.pillars[slug].mascot || DEFAULT_MASCOT;
  else if (map.spokes && map.spokes[slug]) {
    const pillar = map.spokes[slug].pillar;
    mascotName = PILLAR_MASCOT[pillar] || DEFAULT_MASCOT;
  }
  const mascotPath = path.join(MASCOT_DIR, mascotName + '.png');
  if (!fs.existsSync(mascotPath)) { log.warn(`Mascot not found: ${mascotPath}`); }

  const coverTitle = coverTitleArg || deriveCoverTitle(h1);
  const htmlPath = path.join(COVERS_DIR, `cover-${slug}.html`);
  const pngPath  = path.join(COVERS_DIR, `cover-${slug}.png`);
  fs.writeFileSync(htmlPath, coverHtml(coverTitle, mascotPath));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  await pg.goto('file:///' + htmlPath.replace(/\\/g, '/'));
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: pngPath, type: 'png' });
  await browser.close();
  return { pngPath, coverTitle, mascotName };
}

// ─── MAIN PIPELINE ───────────────────────────────────────────────────────────
(async () => {
  // STEP 1
  log.step('STEP 1/14: Parse + Validate');
  let content = fs.readFileSync(file, 'utf8');
  const v = parseAndValidate(content);
  if (v.errors.length > 0) { v.errors.forEach(e => log.err(e)); console.log('\n  Aborting.'); process.exit(1); }
  log.ok(`H1: "${v.h1}" (${v.h1.length} chars)`);
  log.ok(`Internal links: ${v.internalLinks}`);
  log.ok(`External citations: ${v.externalLinks}`);
  v.warnings.forEach(w => log.warn(w));

  // STEP 2: Determine WP title
  log.step('STEP 2/14: Determine WP Title');
  const wpTitle = titleOverride || (v.h1.length <= TITLE_LIMIT_DB ? v.h1 : null);
  if (!wpTitle) { log.err(`H1 is ${v.h1.length} chars (>${TITLE_LIMIT_DB}). Pass --title="Shorter Title" (≤${TITLE_LIMIT_DB} chars).`); process.exit(1); }
  if (wpTitle.length > TITLE_LIMIT_DB) { log.err(`--title is ${wpTitle.length} chars (>${TITLE_LIMIT_DB}).`); process.exit(1); }
  log.ok(`WP title: "${wpTitle}" (${wpTitle.length} DB / ${wpTitle.length + TITLE_SUFFIX_LEN} rendered)`);

  // STEP 3: Existing post?
  log.step('STEP 3/14: Look up existing post by slug');
  const existing = await wpReq('GET', `/wp-json/wp/v2/posts?slug=${slug}&context=edit&_fields=id,status,content&status=any`);
  let postId = (existing.data && existing.data[0] && existing.data[0].id) || null;
  let existingStatus = null;
  if (postId) {
    existingStatus = existing.data[0].status;
    log.ok(`Existing post #${postId} (status: ${existingStatus})`);
    const wpContent = existing.data[0].content && (existing.data[0].content.raw || existing.data[0].content.rendered);
    if (wpContent && wpContent.length > content.length * 0.8) {
      content = wpContent;
      log.ok(`Using WP content as base (${content.length} chars) — protects existing charts/markers from duplication`);
    }
  } else {
    log.ok('No existing post — will create new');
  }

  // STEP 4: Cover
  log.step('STEP 4/14: Generate cover');
  let mediaId = null;
  if (skipCover && postId) {
    const ex = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?_fields=featured_media`);
    if (ex.data && ex.data.featured_media) { mediaId = ex.data.featured_media; log.ok(`--skip-cover: reusing media #${mediaId}`); }
    else log.warn('--skip-cover but no existing featured_media');
  } else if (!dryRun) {
    const cov = await generateCover(slug, v.h1, coverTitleArg);
    log.ok(`Cover rendered: ${(fs.statSync(cov.pngPath).size / 1024).toFixed(0)}KB | mascot: ${cov.mascotName} | title: "${cov.coverTitle.replace(/\n/g, ' / ')}"`);
    const up = await wpUpload(cov.pngPath, `cover-${slug}.png`, 'image/png');
    if (up.status === 201) { mediaId = up.data.id; log.ok(`Uploaded: media #${mediaId}`); }
    else log.err(`Upload failed: ${up.status}`);
  } else {
    log.ok('[dry-run] would render + upload cover');
  }

  // STEP 5: Table of Contents
  log.step('STEP 5/14: Insert Table of Contents');
  const toc = injectTableOfContents(content);
  content = toc.content;
  log.ok(toc.msg);

  // STEP 6: Validate links
  log.step('STEP 6/14: Validate links');
  const lv = await validateInternalLinks(content);
  log.ok(`Internal: ${lv.unique} unique | ${lv.live.length} published | ${lv.drafts.length} draft | ${lv.planned.length} planned`);
  if (lv.dead.length > 0) {
    lv.dead.forEach(d => log.err(`Dead slug (not in slug-map.json AND not in WP): /${d.slug}/`));
    console.log('\n  Aborting — fix or remove these links.');
    process.exit(1);
  }
  if (lv.planned.length > 0) lv.planned.forEach(p => log.warn(`Planned slug (will 404 until drafted): /${p.slug}/`));
  if (lv.drafts.length > 0)  lv.drafts.forEach(d => log.warn(`Draft target: /${d.slug}/ — works only after publish`));
  const ef = autoFixExternalLinks(content);
  content = ef.content;
  log.ok(`External: ${ef.fixed} link(s) auto-fixed (added target/rel)`);

  // STEP 7: Auto-split paragraphs
  log.step('STEP 7/14: Auto-split long paragraphs');
  const sp = splitLongParagraphs(content, 3);
  content = sp.content;
  log.ok(sp.count > 0 ? `Split ${sp.count} paragraph(s)` : 'All paragraphs already ≤3 sentences');

  // STEP 8: Rebuild charts
  log.step('STEP 8/14: Rebuild SVG charts from chart-configs.js');
  const ch = rebuildChartsFromConfig(content, slug);
  content = ch.content;
  log.ok(ch.msg);

  // STEP 9: Inline visuals — mascot dividers default, Pexels opt-in
  log.step('STEP 9/14: Inline visuals (mascot dividers + optional Pexels)');

  // Always strip any old Pexels images on every run (legacy cleanup)
  const beforePx = (content.match(/class="foco-img"/g) || []).length;
  content = stripPexelsImages(content);
  if (beforePx > 0) log.ok(`Stripped ${beforePx} legacy Pexels image(s)`);

  // Strip ALL existing mascot dividers (clean slate every run)
  const beforeMd = (content.match(/class="foco-mascot-divider"/g) || []).length;
  content = stripMascotDividers(content);
  if (beforeMd > 0) log.ok(`Stripped ${beforeMd} legacy mascot divider(s)`);

  // Read pexelsPlans from chart-configs
  let pexelsPlans = null;
  try {
    const cfg = require('./chart-configs');
    if (cfg[slug] && Array.isArray(cfg[slug].pexelsPlans)) pexelsPlans = cfg[slug].pexelsPlans;
  } catch (e) {}

  // If curated Pexels plans exist, use them. Otherwise fall back to mascot dividers.
  if (pexelsPlans && PEXELS_KEY && !dryRun) {
    const px = await injectPexelsFromPlans(content, slug, pexelsPlans);
    content = px.content;
    log.ok(`Pexels (curated): ${px.msg}`);
  } else if (pexelsPlans && dryRun) {
    log.ok(`[dry-run] would inject ${pexelsPlans.length} curated Pexels image(s)`);
  } else if (!dryRun) {
    // Fallback: mascot dividers
    const md = injectMascotDividers(content, slug);
    content = md.content;
    log.ok(`No curated Pexels plan — using mascot dividers: ${md.msg}`);
  } else {
    log.ok('[dry-run] would inject mascot dividers (no curated Pexels plan)');
  }

  // STEP 10: Schema
  log.step('STEP 10/14: Inject schema (FAQ + Article)');
  const faqSchema = buildFaqSchema(content);
  if (faqSchema) {
    content = injectSchema(content, faqSchema, 'FAQPage');
    log.ok(`FAQPage schema: ${faqSchema.mainEntity.length} Q&A`);
  } else log.warn('No FAQ section detected — schema skipped');

  // Article schema (always)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: wpTitle,
    keywords: keyword,
    datePublished: new Date().toISOString(),
    author: { '@type': 'Organization', name: 'FOCO', url: `https://${WP_HOST}` },
    publisher: { '@type': 'Organization', name: 'FOCO', url: `https://${WP_HOST}` },
  };
  content = injectSchema(content, articleSchema, 'Article');
  log.ok('Article schema added');

  // STEP 11: Push to WP (with publish-lock for posts 1-10)
  log.step('STEP 11/14: Push to WP');
  // Count published posts to enforce publish-lock
  let publishedCount = 0;
  if (wantPublish) {
    const cnt = await wpReq('GET', '/wp-json/wp/v2/posts?per_page=1&_fields=id&status=publish');
    publishedCount = parseInt(cnt.status === 200 ? (cnt.data[0] ? 100 : 0) : 0, 10); // simplified — actual count via X-WP-Total header would be better
    // Use the proper header-based count instead
    const headRes = await new Promise(resolve => {
      https.get({ hostname: WP_HOST, path: '/wp-json/wp/v2/posts?per_page=1&status=publish', headers: { Authorization: 'Basic ' + auth } }, r => {
        resolve(parseInt(r.headers['x-wp-total'] || '0', 10));
      });
    });
    publishedCount = headRes;
  }

  let willPublish = false;
  if (wantPublish) {
    if (publishedCount < PUBLISH_LOCK_THRESHOLD) {
      log.warn(`--publish IGNORED. Only ${publishedCount} posts published (lock threshold = ${PUBLISH_LOCK_THRESHOLD}). Posts 1-10 ship as drafts.`);
    } else {
      willPublish = true;
      log.ok(`Publish lock cleared (${publishedCount} posts published). Will publish live.`);
    }
  }

  if (!dryRun) {
    const payload = { title: wpTitle, slug, content, ...(mediaId && { featured_media: mediaId }) };
    if (postId) {
      if (willPublish && existingStatus !== 'publish') payload.status = 'publish';
      const r = await wpReq('PUT', '/wp-json/wp/v2/posts/' + postId, payload);
      log.ok(`Updated post #${postId} (status: ${r.data.status || existingStatus})`);
    } else {
      payload.status = willPublish ? 'publish' : 'draft';
      const r = await wpReq('POST', '/wp-json/wp/v2/posts', payload);
      if (r.data && r.data.id) { postId = r.data.id; log.ok(`Created post #${postId} (status: ${r.data.status})`); }
      else log.err(`Create failed: ${JSON.stringify(r.data).slice(0, 300)}`);
    }
  } else { log.ok('[dry-run] would push to WP'); }

  // STEP 12: RankMath focus keyword + meta description (extracted from TL;DR)
  log.step('STEP 12/14: Set RankMath focus keyword + meta description');
  if (!dryRun && postId) {
    // Extract clean meta description from TL;DR (strip "TL;DR." prefix + tags, cap 160 chars)
    let metaDesc = '';
    const tldrMatch = content.match(/<div class="foco-tldr">[\s\S]*?<\/div>/);
    if (tldrMatch) {
      metaDesc = tldrMatch[0]
        .replace(/<[^>]+>/g, ' ')
        .replace(/TL;DR\.?\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 158);
      if (metaDesc.length === 158) metaDesc = metaDesc.replace(/\s\S*$/, '') + '…';
    }
    const meta = { rank_math_focus_keyword: keyword };
    if (metaDesc) {
      meta.rank_math_description = metaDesc;
      meta.rank_math_facebook_description = metaDesc;
      meta.rank_math_twitter_description = metaDesc;
    }
    const r = await rankMathMeta(postId, meta);
    log.ok(`Focus keyword set: "${keyword}" (HTTP ${r.status})`);
    if (metaDesc) log.ok(`Meta description set (${metaDesc.length} chars): "${metaDesc.slice(0, 80)}..."`);
  } else log.ok('[skip]');

  // STEP 13: Pillar flag
  log.step('STEP 13/14: RankMath pillar flag');
  if (isPillar && !dryRun && postId) {
    const r = await rankMathMeta(postId, { rank_math_pillar_content: 'on' });
    log.ok(`Pillar flag ON (HTTP ${r.status})`);
  } else if (isPillar) log.ok('[dry-run] would set pillar flag');
  else log.ok('Not a pillar — flag skipped');

  // STEP 14: Featured image alt text
  log.step('STEP 14/15: Featured image alt text');
  if (!dryRun && mediaId) {
    const altText = `${keyword} — ${v.h1}`.slice(0, 125);
    const r = await wpReq('POST', '/wp-json/wp/v2/media/' + mediaId, { alt_text: altText });
    log.ok(`Alt text: "${altText}"`);
  } else log.ok('[skip]');

  // STEP 15: IndexNow submission (only if post is published)
  log.step('STEP 15/15: IndexNow instant indexing submission');
  if (!dryRun && postId) {
    // Re-fetch to confirm current status
    const final = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?_fields=status,link`);
    if (final.data && final.data.status === 'publish') {
      const submit = await wpReq('POST', '/wp-json/rankmath/v1/in/submitUrls', { urls: final.data.link });
      if (submit.status === 200 && submit.data && submit.data.success) {
        log.ok(`Submitted to IndexNow: ${final.data.link}`);
      } else {
        log.warn(`IndexNow submit returned ${submit.status}: ${JSON.stringify(submit.data).slice(0, 200)}`);
      }
    } else {
      log.ok(`Skipped — post is ${final.data && final.data.status || 'unknown'} (IndexNow only fires on publish)`);
    }
  } else log.ok('[skip]');

  // FINAL REPORT
  console.log('\n' + '━'.repeat(78));
  console.log('  ✅ DONE');
  console.log('━'.repeat(78));
  if (postId) {
    console.log(`  Post ID:     ${postId}`);
    console.log(`  Edit URL:    https://${WP_HOST}/wp-admin/post.php?post=${postId}&action=edit`);
    console.log(`  Preview:     https://${WP_HOST}/?p=${postId}`);
    if (willPublish) console.log(`  LIVE URL:    https://${WP_HOST}/${slug}/`);
  }
  console.log(`  Title:       ${wpTitle} (${wpTitle.length}/${TITLE_LIMIT_DB} DB / ${wpTitle.length + TITLE_SUFFIX_LEN}/65 rendered)`);
  console.log(`  Keyword:     ${keyword}`);
  console.log(`  Pillar:      ${isPillar ? 'YES' : 'no'}`);
  console.log(`  Charts:      ${ch.added}`);
  console.log(`  FAQ schema:  ${faqSchema ? `YES (${faqSchema.mainEntity.length} Q&A)` : 'no'}`);
  console.log(`  Article schema: YES`);
  console.log(`  Featured:    ${mediaId ? `media #${mediaId}` : 'none'}`);
  if (v.warnings.length > 0) {
    console.log('\n  Warnings:');
    v.warnings.forEach(w => console.log('    ⚠  ' + w));
  }
  if (!willPublish && postId) {
    console.log('\n  📝 Post is a DRAFT. Review at the Edit URL above, then click Publish.');
  }
  console.log('\n  Manual TODO after publishing:');
  console.log('    1. Purge Cloudways cache (Application → Manage Services → Varnish → Purge)');
  console.log('    2. GSC → URL Inspection → Request Indexing');
  console.log('');
})().catch(e => { console.error('\n❌ Pipeline failed:', e.message); console.error(e.stack); process.exit(1); });
