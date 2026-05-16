#!/usr/bin/env node
// preclean-master-plan.js — Batch pre-clean the keyword pool against existing WP posts.
//
// Runs ONCE (or any time the WP post inventory changes meaningfully). For every
// keyword in master-plan.json that ISN'T already blocked, asks Haiku 4.5 whether
// it semantically duplicates any live/trash WP post. Confirmed duplicates get
// appended to blocked-keywords.json so the daily picker never wastes a Haiku
// call (or a Sonnet generation) on them.
//
// Usage:
//   node preclean-master-plan.js              — full run, ~$0.025
//   node preclean-master-plan.js --dry-run    — show what would be blocked, no write
//
// Idempotent. Safe to re-run.

const fs = require('fs');
const path = require('path');
const https = require('https');

const envSources = {};
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
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

const WP_HOST = (E('WP_HOST', 'WP_URL') || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const WP_USER = E('WP_USER');
const WP_APP_PASSWORD = E('WP_APP_PASSWORD', 'WP_PASS');
const ANTHROPIC_API_KEY = E('ANTHROPIC_API_KEY');
const AUTH = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');

const DRY_RUN = process.argv.includes('--dry-run');

function req(host, method, p, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: host, port: 443, path: p, method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}
const wpReq = (m, p, b) => req(WP_HOST, m, p, { Authorization: 'Basic ' + AUTH }, b);

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function serializeBlockedKeywords(obj) {
  const lines = ['{'];
  const keys = Object.keys(obj);
  keys.forEach((key, i) => {
    const trailing = i < keys.length - 1 ? ',' : '';
    if (key === 'blocked' && Array.isArray(obj[key])) {
      lines.push('  "blocked": [');
      obj[key].forEach((entry, j) => {
        const c = j < obj[key].length - 1 ? ',' : '';
        const pairs = Object.entries(entry).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ');
        lines.push(`    {${pairs}}${c}`);
      });
      lines.push(`  ]${trailing}`);
    } else {
      lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(obj[key])}${trailing}`);
    }
  });
  lines.push('}');
  return lines.join('\n') + '\n';
}

async function claudeJudgeDuplicate(candidate, existingPosts) {
  const list = existingPosts.map(p => `- ${p.slug}: ${(p.title || '').replace(/\s+/g, ' ').trim()}`).join('\n');
  const prompt = `You are checking for content duplication on a blog about ADHD task initiation.

CANDIDATE keyword for a new post: "${candidate.keyword}" (slug: ${candidate.slug})

EXISTING posts on the site (slug: title):
${list}

Would a new post on the candidate keyword substantially overlap with an existing one? Treat wording variations of the same topic as duplicates (e.g. "adhd pi" overlaps with "adhd-inattentive-presentation"; "symptoms to adhd" overlaps with "adhd-symptoms-in-adults"; "cognitive behavioural therapy for adhd" overlaps with "cbt-for-adhd" or "therapy-for-adhd").

Reply with ONLY a JSON object, no surrounding text:
{"duplicate": true|false, "matchSlug": "slug-of-existing-post-or-empty-string", "reason": "one short sentence"}`;

  try {
    const r = await req('api.anthropic.com', 'POST', '/v1/messages', {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    }, { model: 'claude-haiku-4-5', max_tokens: 200, messages: [{ role: 'user', content: prompt }] });
    if (r.status !== 200 || !r.body.content || !r.body.content[0]) return null;
    const text = r.body.content[0].text || '';
    const m = text.match(/\{[\s\S]*?\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch (e) {
    console.log(`  ! Haiku error for "${candidate.keyword}": ${e.message}`);
    return null;
  }
}

(async () => {
  console.log('━'.repeat(60));
  console.log(' MASTER-PLAN PRE-CLEAN — ' + new Date().toISOString());
  console.log(DRY_RUN ? ' (DRY RUN — no writes)' : '');
  console.log('━'.repeat(60));

  // 1. Load master-plan
  const masterPath = path.join(__dirname, 'keyword-research', 'master-plan.json');
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const candidates = [];
  for (const cluster of (master.clusters || [])) {
    if (cluster.name === 'Other (general ADHD)') continue;
    for (const k of (cluster.items || cluster.keywords || cluster.candidates || [])) {
      candidates.push({
        keyword: k.keyword,
        slug: k.slug || slugify(k.keyword),
        cluster: cluster.name,
        volume: k.volume || 0,
      });
    }
  }
  console.log(`Loaded ${candidates.length} candidates from master-plan.json`);

  // 2. Load blocked-keywords
  const blockedPath = path.join(__dirname, 'keyword-research', 'blocked-keywords.json');
  const blocked = JSON.parse(fs.readFileSync(blockedPath, 'utf8'));
  const blockedKeywords = new Set();
  const blockedSlugs = new Set();
  for (const b of blocked.blocked || []) {
    if (b.keyword) {
      blockedKeywords.add(b.keyword.toLowerCase().trim());
      blockedSlugs.add(slugify(b.keyword));
    }
    if (b.slug) blockedSlugs.add(b.slug);
  }
  console.log(`Loaded ${blocked.blocked.length} existing blocks`);

  // 3. Fetch all WP posts (live + trash) with titles
  console.log('Fetching WP posts...');
  const liveRes = await wpReq('GET', '/wp-json/wp/v2/posts?per_page=100&status=publish,future,draft&context=edit&_fields=slug,title');
  const trashRes = await wpReq('GET', '/wp-json/wp/v2/posts?per_page=100&status=trash&context=edit&_fields=slug,title');
  const existingPosts = [];
  const wpSlugs = new Set();
  if (Array.isArray(liveRes.body)) for (const p of liveRes.body) {
    existingPosts.push({ slug: p.slug, title: (p.title && (p.title.rendered || p.title.raw)) || '' });
    wpSlugs.add(p.slug);
  }
  if (Array.isArray(trashRes.body)) for (const p of trashRes.body) {
    const cleanSlug = p.slug.replace(/__trashed$/, '');
    existingPosts.push({ slug: cleanSlug, title: (p.title && (p.title.rendered || p.title.raw)) || '' });
    wpSlugs.add(cleanSlug);
  }
  console.log(`Fetched ${existingPosts.length} WP posts (live + trash)`);

  // 4. Filter: only check candidates that aren't already covered by string-match
  const toCheck = [];
  const skipped = { alreadyBlocked: 0, alreadyInWP: 0 };
  for (const c of candidates) {
    if (blockedKeywords.has(c.keyword.toLowerCase()) || blockedSlugs.has(c.slug)) { skipped.alreadyBlocked++; continue; }
    if (wpSlugs.has(c.slug)) { skipped.alreadyInWP++; continue; }
    toCheck.push(c);
  }
  console.log(`Skipping ${skipped.alreadyBlocked} already-blocked + ${skipped.alreadyInWP} already-in-WP candidates`);
  console.log(`Will check ${toCheck.length} candidates via Haiku (~$${(toCheck.length * 0.0005).toFixed(3)})`);
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing — cannot run semantic check.');
    process.exit(1);
  }

  // 5. Iterate, call Haiku, collect new blocks
  const newBlocks = [];
  let i = 0;
  for (const c of toCheck) {
    i++;
    process.stdout.write(`\r  [${i}/${toCheck.length}] checking "${c.keyword}"...`.padEnd(80));
    const j = await claudeJudgeDuplicate(c, existingPosts);
    if (j && j.duplicate) {
      process.stdout.write(`\r  [${i}/${toCheck.length}] ✗ "${c.keyword}" → duplicate of ${j.matchSlug}\n`);
      newBlocks.push({
        keyword: c.keyword,
        reason: `Auto-blocked: semantic duplicate of "${j.matchSlug || 'unknown'}" — ${j.reason || 'pre-clean batch'}`,
      });
    }
  }
  console.log(`\r${' '.repeat(80)}\r`);

  // 6. Write or report
  console.log(`\nResult: ${newBlocks.length} new duplicates identified out of ${toCheck.length} checked.`);
  if (newBlocks.length === 0) {
    console.log('Nothing new to block. blocked-keywords.json unchanged.');
    process.exit(0);
  }
  if (DRY_RUN) {
    console.log('\nWould add to blocked-keywords.json:');
    for (const b of newBlocks) console.log(`  - "${b.keyword}" — ${b.reason}`);
    console.log('\n(dry run — no writes)');
    process.exit(0);
  }
  const current = JSON.parse(fs.readFileSync(blockedPath, 'utf8'));
  current.blocked = current.blocked || [];
  current.blocked.push(...newBlocks);
  fs.writeFileSync(blockedPath, serializeBlockedKeywords(current));
  console.log(`✓ Appended ${newBlocks.length} blocks to ${blockedPath}`);
  console.log('Done.');
})();
