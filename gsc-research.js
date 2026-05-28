#!/usr/bin/env node
// gsc-research.js — runs the 4 keyword-research templates from the GSC skill
// (long-tail, transactional, quick wins, content gap) against the gsc-raw-*.json
// files and prints a human-readable report. Optionally writes a markdown file.
//
//   node gsc-research.js              # print report to stdout
//   node gsc-research.js --md         # also write keyword-research/gsc-report.md
//
// This is the "readable report" the engine's gsc-analyze.js never produced —
// gsc-analyze.js emits machine JSON for the picker; this is for human reading.

const fs = require('fs');
const path = require('path');

const KW_DIR = path.join(__dirname, 'keyword-research');
const f = (n) => JSON.parse(fs.readFileSync(path.join(KW_DIR, n), 'utf8'));
const queries = f('gsc-raw-queries.json');
const pages = f('gsc-raw-pages.json');
const qp = f('gsc-raw-query-page.json');

const NEW_SITE_MIN_IMPR = 3;          // PDF: lower thresholds for new sites
const slug = (p) => p.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '') || '(home)';
const pct = (n) => (n * 100).toFixed(2) + '%';
const r1 = (n) => Math.round(n * 10) / 10;
const wc = (s) => s.trim().split(/\s+/).length;

// query -> top landing page (by impressions)
const landing = {};
for (const row of qp.rows) {
  if (!landing[row.query] || row.impressions > landing[row.query].impressions) {
    landing[row.query] = { page: row.page, impressions: row.impressions };
  }
}
const land = (q) => (landing[q] ? slug(landing[q].page) : '—');

const out = [];
const p = (s = '') => out.push(s);

// ─── Summary ──────────────────────────────────────────────────────────────
const totImpr = queries.rows.reduce((s, r) => s + r.impressions, 0);
const totClicks = queries.rows.reduce((s, r) => s + r.clicks, 0);
const pageImpr = pages.rows.reduce((s, r) => s + r.impressions, 0);
p(`# GSC Keyword Research — tryfoco.com`);
p(`Window: ${queries.startDate} → ${queries.endDate}`);
p('');
p(`- Queries (named): **${queries.rows.length}**  ·  query-level impressions: **${totImpr}**  ·  clicks: **${totClicks}**`);
p(`- Pages: **${pages.rows.length}**  ·  page-level impressions: **${pageImpr}**`);
p(`- Note: page impressions (${pageImpr}) >> query impressions (${totImpr}) because GSC anonymizes rare queries. The query list is a sample, not the full demand.`);

// ─── Template 1: Long-tail (5+ words) ───────────────────────────────────────
p('\n## 1. Long-Tail Keywords (5+ words)');
const longtail = queries.rows.filter(r => wc(r.query) >= 5).sort((a, b) => b.impressions - a.impressions);
if (!longtail.length) p('_None._');
else {
  p('| Keyword | Words | Impr | Clicks | Pos | Landing |');
  p('|---|--:|--:|--:|--:|---|');
  for (const r of longtail) p(`| ${r.query} | ${wc(r.query)} | ${r.impressions} | ${r.clicks} | ${r1(r.position)} | ${land(r.query)} |`);
}

// ─── Template 2: Transactional intent ───────────────────────────────────────
p('\n## 2. Transactional Intent Keywords');
const PATTERNS = [
  ['comparison', /\b(vs|versus|compared to|alternative|alternatives to|better than)\b/i],
  ['best-top', /\b(best|top \d+|top app|top tool)\b/i],
  ['price', /\b(price|pricing|cost|how much|fee|cheap|affordable|free trial|discount|coupon|deal)\b/i],
  ['review', /\b(review|reviews|worth it|honest review|pros and cons|is it good)\b/i],
  ['purchase', /\b(buy|purchase|order|subscribe|sign up)\b/i],
  ['tool', /\b(app|tool|software|platform)\b/i],
];
const intentOf = (q) => { for (const [t, re] of PATTERNS) if (re.test(q)) return t; return null; };
const trans = queries.rows.map(r => ({ ...r, intent: intentOf(r.query) })).filter(r => r.intent)
  .sort((a, b) => b.impressions - a.impressions);
if (!trans.length) p('_None — the site is surfacing for zero commercial-intent queries right now._');
else {
  p('| Keyword | Intent | Impr | Clicks | Pos | Landing |');
  p('|---|---|--:|--:|--:|---|');
  for (const r of trans) p(`| ${r.query} | ${r.intent} | ${r.impressions} | ${r.clicks} | ${r1(r.position)} | ${land(r.query)} |`);
}

// ─── Template 3: Quick wins (striking distance, pos 5-20) ───────────────────
p('\n## 3. Quick Wins — Striking Distance (pos 5–20)');
p('Priority = impressions ÷ position. Higher = faster win.');
const strikeQ = queries.rows.filter(r => r.position >= 5 && r.position <= 20)
  .map(r => ({ ...r, priority: r.impressions / r.position }))
  .sort((a, b) => b.priority - a.priority);
if (!strikeQ.length) p('_No queries in the 5–20 band._');
else {
  p('\n**Query-level:**');
  p('| Keyword | Impr | Clicks | Pos | Landing | Priority |');
  p('|---|--:|--:|--:|---|--:|');
  for (const r of strikeQ) p(`| ${r.query} | ${r.impressions} | ${r.clicks} | ${r1(r.position)} | ${land(r.query)} | ${r1(r.priority)} |`);
}
// Page-level striking distance — the bigger story is usually here
const strikeP = pages.rows.filter(r => r.position >= 5 && r.position <= 20)
  .map(r => ({ ...r, priority: r.impressions / r.position }))
  .sort((a, b) => b.priority - a.priority);
p('\n**Page-level (the real opportunity — pages ranking p1-ish with low CTR):**');
p('| Page | Impr | Clicks | CTR | Pos | Diagnosis |');
p('|---|--:|--:|--:|--:|---|');
for (const r of strikeP) {
  let dx = 'healthy';
  if (r.position <= 10 && r.ctr === 0 && r.impressions >= 20) dx = '⚠ CTR PROBLEM — p1, 0 clicks → fix title/snippet';
  else if (r.position <= 10 && r.ctr < 0.02 && r.impressions >= 50) dx = '⚠ low CTR for position → title/snippet';
  else if (r.position > 15) dx = 'needs links/content to crack p1';
  p(`| ${slug(r.page)} | ${r.impressions} | ${r.clicks} | ${pct(r.ctr)} | ${r1(r.position)} | ${dx} |`);
}

// ─── Template 4: Content gap ────────────────────────────────────────────────
p('\n## 4. Content Gap Analysis');
p(`Filter: ≥${NEW_SITE_MIN_IMPR} impressions, 0–1 clicks, junk excluded. Grouped by theme.`);
const existing = new Set(pages.rows.map(r => slug(r.page)));
const gapRows = queries.rows.filter(r =>
  r.impressions >= NEW_SITE_MIN_IMPR && r.clicks <= 1 &&
  !r.query.startsWith('(') && !r.query.startsWith('"') && r.query.length <= 100
);
// crude theme = first salient token group
const themeOf = (q) => {
  if (/executive function|task initiation|nimh|chadd|cdc/.test(q)) return 'EF / task-initiation authoritative-source queries';
  if (/body doubl|body double|buddy|focusmate/.test(q)) return 'body doubling';
  if (/procrastinat|paralysis/.test(q)) return 'procrastination vs paralysis';
  if (/2.?minute|2 min/.test(q)) return '2-minute rule';
  if (/^foco|foco /.test(q)) return 'brand (foco)';
  return 'other';
};
const themes = {};
for (const r of gapRows) {
  const t = themeOf(r.query);
  (themes[t] = themes[t] || { impr: 0, items: [] });
  themes[t].impr += r.impressions;
  themes[t].items.push(r);
}
const tier = (i) => i >= 400 ? 'T1' : i >= 200 ? 'T2' : i >= 100 ? 'T3' : 'T4';
const sorted = Object.entries(themes).sort((a, b) => b[1].impr - a[1].impr);
for (const [name, t] of sorted) {
  const covered = t.items.every(r => existing.has(land(r.query)));
  p(`\n### [${tier(t.impr)}] ${name} — ${t.impr} impr  ·  ${covered ? 'covered by existing page' : 'GAP — no page'}`);
  p('| Keyword | Impr | Pos | Landing |');
  p('|---|--:|--:|---|');
  for (const r of t.items.sort((a, b) => b.impressions - a.impressions)) p(`| ${r.query} | ${r.impressions} | ${r1(r.position)} | ${land(r.query)} |`);
}

// ─── Lofi check (ties to the conversation) ──────────────────────────────────
p('\n## Lofi / music check');
const music = queries.rows.filter(r => /music|lofi|lo-fi|study|focus music|noise|sound|ambient|playlist/i.test(r.query));
p(music.length ? `Found ${music.length}: ${music.map(r => r.query).join(', ')}` :
  '**Zero** music/lofi/study queries in GSC. Confirmed: the website surfaces for nothing music-related. Lofi keyword expansion must come from Ubersuggest (web) or YouTube-native research — not GSC.');

const report = out.join('\n');
console.log(report);
if (process.argv.includes('--md')) {
  fs.writeFileSync(path.join(KW_DIR, 'gsc-report.md'), report);
  console.log('\n→ wrote keyword-research/gsc-report.md');
}
