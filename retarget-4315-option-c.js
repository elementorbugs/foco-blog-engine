// #4315 option C (Adi, 2026-10-14): lead with "apps for task paralysis" (Adi's niche), keep "procrastination" for
// volume (procrastination app 480/mo, anti procrastination app 210/mo). Splits intent with the homepage, which owns
// "THE ADHD app for task paralysis": the post is the plural comparison and links to the homepage with that anchor.
// Also fixes two stale facts in the FOCO section: "free tier" (there is none) and "not a calendar" (tasks land in it).
//   node retarget-4315-option-c.js
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ID = 4315;

const NEW_TITLE = '10 Best Apps for Task Paralysis & Procrastination (ADHD)'; // 56 chars
const META_DESC = 'The best apps for task paralysis and procrastination with ADHD, tested at the moment you freeze. FOCO turns a stuck task into one tiny first step.';
const FOCUS_KW = 'apps for task paralysis, task paralysis app, procrastination app, anti procrastination app';

const EDITS = [ // [find, replace, expected count]
  ["The best procrastination apps for ADHD task paralysis work at the exact moment you're frozen",
   "The best apps for task paralysis and procrastination work at the exact moment you're frozen", 1],
  ['<h2 id="faq">FAQ: Procrastination Apps for ADHD Task Paralysis</h2>', '<h2 id="faq">FAQ: Apps for Task Paralysis and Procrastination</h2>', 1],
  // post -> homepage with the homepage's own intent as anchor
  ['<p><a href="https://www.tryfoco.com/">FOCO</a> breaks one stuck task into small first steps',
   '<p><a href="https://www.tryfoco.com/">FOCO, the ADHD app for task paralysis,</a> breaks one stuck task into small first steps', 1],
  // stale facts
  ["<p><strong>Where it falls short.</strong> It's not a calendar or a project manager. If your problem is scheduling rather than starting, pair it with a separate planning app.</p>",
   "<p><strong>Where it falls short.</strong> It's not a project manager. If you run team projects or long timelines, pair it with a dedicated tool.</p>", 1],
  ['<p><strong>Pricing.</strong> Free tier covers the core breakdown feature. Paid tier adds unlimited sessions.</p>',
   '<p><strong>Pricing.</strong> FOCO is $59/year with a 7-day free trial, or $9/month.</p>', 1],
];

const get = async () => {
  const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } });
  const p = await r.json();
  return { content: p.content.raw, title: p.title.raw };
};

(async () => {
  const { content, title } = await get();
  fs.writeFileSync(path.join(__dirname, '.audit-cache', `backup-best-apps-for-adhd-task-paralysis-${new Date().toISOString().slice(0, 10)}-pre-option-c.html`), content);
  console.log(`before: "${title}"`);
  let next = content, applied = 0;
  for (const [find, to, n] of EDITS) {
    if (next.includes(to)) { console.log('SKIP  already: ' + to.slice(0, 60)); continue; }
    const got = next.split(find).length - 1;
    if (got !== n) { console.error(`ABORT guard x${got} (want ${n}): ${find.slice(0, 70)}`); process.exit(1); }
    next = next.split(find).join(to); applied++;
  }
  next = next.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, json) => {
    let o; try { o = JSON.parse(json); } catch (e) { return m; }
    if (o['@type'] !== 'Article') return m;
    o.headline = NEW_TITLE; o.keywords = FOCUS_KW + ', best apps for adhd task paralysis'; applied++;
    return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  });
  if (/—/.test(next) && !/—/.test(content)) { console.error('ABORT em dash introduced'); process.exit(1); }
  // FOCO has no free tier; competitors' free tiers further down are real and stay
  const focoSec = next.slice(next.indexOf('<h2 id="foco">'), next.indexOf('<h2 id="goblin-tools">'));
  if (/free tier|by hand is free/i.test(focoSec) || /by hand is free/i.test(next)) { console.error('ABORT a FOCO free-tier claim is still on the page'); process.exit(1); }

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next, title: NEW_TITLE }) });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const f = await get();
    if (f.title === NEW_TITLE && f.content.includes('$59/year with a 7-day free trial')) done = true; else console.error('  not persisted, retry ' + a);
  }
  if (!done) { console.error('FAIL did not persist'); process.exit(1); }
  const rm = await fetch(BASE + '/wp-json/rankmath/v1/updateMeta', { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectID: ID, objectType: 'post', meta: { rank_math_focus_keyword: FOCUS_KW, rank_math_description: META_DESC } }) });
  const t = (await get()).content.replace(/<[^>]+>/g, ' ');
  const c = k => (t.match(new RegExp(k, 'gi')) || []).length;
  console.log(`RankMath: HTTP ${rm.status} | title ${NEW_TITLE.length} chars | meta ${META_DESC.length} chars`);
  console.log(`after : apps for task paralysis x${c('apps for task paralysis')} | task paralysis app x${c('task paralysis app')} | procrastination app x${c('procrastination app')} | anti-procrastination app x${c('anti-procrastination app')}`);
  console.log(`OK ${applied} edit(s)`);
})();
