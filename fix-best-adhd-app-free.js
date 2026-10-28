// /best-adhd-app/ (1080) vs the new /best-free-adhd-apps/ (2026-10-19): hand the "free apps" intent to the new page.
// 1. H2 "Are free ADHD apps actually good?" body trimmed to a short answer + link out (heading kept for the TOC anchor).
// 2. H3 "Best free ADHD apps" category entry now points to the new guide.
// 3. FAQ "Is there a totally free ADHD app that actually works?" rewritten, visible answer and FAQPage text identical.
// Also fixes two facts: the old FAQ counted FOCO among apps covering ADHD needs "at zero cost" (FOCO is paid), and
// Goblin Tools is no longer "no premium tier" (optional Pro exists).
// GET -> guarded edit -> POST -> verify, with backup.
//   node fix-best-adhd-app-free.js
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const ID = 1080;
const URL = 'https://www.tryfoco.com/best-free-adhd-apps/';
const A = `<a href="${URL}">best free ADHD apps</a>`;

const H2_START = '<h2 id="are-free-adhd-apps-good">Are free ADHD apps actually good?</h2>';
const H2_END = '<h2 id="worst-adhd-apps">';
const H2_BODY = `${H2_START}\n<p>Yes, several are, and you can get far without paying. Goblin Tools is free on the web, and Structured, TickTick and Todoist have generous free plans.</p>\n<p>Our guide to the ${A} covers 12 of them by need, and where each free plan stops.</p>\n`;

const FAQ_OLD_HTML = '<p>Yes. Goblin Tools is fully free on the web with no usage limits and no premium tier. FOCO is $59/year with a 7-day free trial, or $9/month.</p>\n<p>Habitica is free at its core. The combination of these three covers most adult ADHD needs at zero cost.</p>';
const FAQ_NEW_TEXT = "Yes. Goblin Tools is free on the web, Habitica can be fully enjoyed for free, and Finch's core is free; our guide to the best free ADHD apps lists 12.";
const FAQ_NEW_HTML = `<p>Yes. Goblin Tools is free on the web, Habitica can be fully enjoyed for free, and Finch's core is free; our guide to the ${A} lists 12.</p>`;
const FAQ_OLD_TEXT = 'Yes. Goblin Tools is fully free on the web with no usage limits and no premium tier. FOCO is $59/year with a 7-day free trial, or $9/month. Habitica is free at its core. The combination of these three covers most adult ADHD needs at zero cost.';

const EDITS = [
  ['<h3 id="best-free-adhd-apps">Best free ADHD apps</h3>\n<p>Goblin Tools is free on the web with no premium tier. FOCO is $59/year with a 7-day free trial, or $9/month.</p>',
   `<h3 id="best-free-adhd-apps">Best free ADHD apps</h3>\n<p>Full guide: the ${A}, 12 picks by need. FOCO itself is paid ($59/year with a 7-day free trial, or $9/month).</p>`],
  [FAQ_OLD_HTML, FAQ_NEW_HTML],
  [`"text":"${FAQ_OLD_TEXT}"`, `"text":"${FAQ_NEW_TEXT}"`],
];

const get = async () => (await (await fetch(BASE + `/wp-json/wp/v2/posts/${ID}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } })).json()).content.raw;

if (!process.argv.includes('--facts')) (async () => {
  const live = await get(); let next = live, n = 0;
  // 1. H2 section, replaced between two unique markers
  const a = next.indexOf(H2_START), b = next.indexOf(H2_END);
  if (next.includes(H2_BODY)) console.log('SKIP h2 already');
  else if (a < 0 || b < a || next.split(H2_START).length !== 2 || next.split(H2_END).length !== 2) { console.error('ABORT h2 markers', a, b); process.exit(1); }
  else { next = next.slice(0, a) + H2_BODY + next.slice(b); n++; }
  for (const [find, to] of EDITS) {
    if (next.includes(to)) { console.log('SKIP already:', to.slice(0, 50)); continue; }
    const c = next.split(find).length - 1;
    if (c !== 1) { console.error(`ABORT guard x${c}: ${find.slice(0, 60)}`); process.exit(1); }
    next = next.replace(find, () => to); n++;
  }
  if (!n) return console.log('nothing to do');
  fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${ID}-pre-free-handoff-${Date.now()}.html`), live);
  const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
  await new Promise(res => setTimeout(res, 2500));
  const fresh = await get();
  console.log(`HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.split(URL).length - 1} | "zero cost" gone: ${!fresh.includes('zero cost')} | "no premium tier" gone: ${!fresh.includes('no premium tier')}`);
})();

// Second pass (same day): stale facts elsewhere on the page, found while verifying the first pass.
//   node fix-best-adhd-app-free.js --facts
if (process.argv.includes('--facts')) (async () => {
  const FIX = [
    ['It is also genuinely free with no paid tier on the web. You can use it indefinitely at zero cost.',
     'It is also free on the web with no account needed, so you can use it indefinitely without paying.'],
    ['<p><strong>Pricing.</strong> Free on the web. One-time ~$0.99 for the mobile app. No subscription, no premium tier.</p>',
     '<p><strong>Pricing.</strong> Free on the web. The iPhone app is a $1.99 one-time purchase on the US App Store, and an optional Pro adds advanced features.</p>'],
    ['This combination handles 70% of adult ADHD needs at zero cost.</p>',
     `This combination covers a lot of everyday ADHD needs without paying; see our guide to the ${A} for more.</p>`],
    ['<p><strong>Pricing.</strong> Free. Paid plans (~$5/month) add cosmetics. Core gameplay is fully free.</p>',
     '<p><strong>Pricing.</strong> Free. Its App Store listing says it "can be fully enjoyed for free," and the optional subscription is $4.99/month or $47.99/year on the US App Store.</p>'],
  ];
  const live = await get(); let next = live, n = 0;
  for (const [find, to] of FIX) {
    if (next.includes(to)) { console.log('SKIP already:', to.slice(0, 50)); continue; }
    const c = next.split(find).length - 1;
    if (c !== 1) { console.error(`ABORT guard x${c}: ${find.slice(0, 60)}`); process.exit(1); }
    next = next.replace(find, () => to); n++;
  }
  if (!n) return console.log('facts: nothing to do');
  fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${ID}-pre-free-facts-${Date.now()}.html`), live);
  const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
  await new Promise(res => setTimeout(res, 2500));
  const fresh = await get();
  console.log(`facts: HTTP ${r.status} | ${n} edit(s) | 70% gone: ${!fresh.includes('70%')} | zero cost gone: ${!fresh.includes('zero cost')} | no premium tier gone: ${!fresh.includes('no premium tier')} | $0.99 gone: ${!fresh.includes('$0.99')}`);
})();
