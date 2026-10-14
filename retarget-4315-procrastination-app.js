// Retargets #4315 (best-apps-for-adhd-task-paralysis) to "procrastination app" (480/mo) + "anti procrastination app"
// (210/mo), keeping "task paralysis" (Google already shows the page at ~7.6 for "task paralysis app", 10/mo).
// None of the three strings appeared on the page before this ran. Same URL, no redirects.
// Also fixes a stale pricing claim in FAQ #1 ("adding tasks by hand is free": FOCO has no free tier).
//   node retarget-4315-procrastination-app.js
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

const NEW_TITLE = '10 Best Procrastination Apps for ADHD Task Paralysis'; // 52 chars, + " - FOCO" = 59
const META_DESC = 'The best procrastination apps for ADHD task paralysis, tested at the moment you freeze. FOCO turns a stuck task into one tiny first step. 10 apps compared.';
const FOCUS_KW = 'procrastination app, anti procrastination app, task paralysis app';

const Q1_OLD = "What's the single best app to try first for task paralysis?";
const Q1_NEW = "What's the best anti-procrastination app for ADHD?";
const A1_OLD = 'Start with Goblin Tools, which is free, or FOCO, where adding tasks by hand is free.';
const A1_NEW = 'Start with FOCO, which turns the stuck task into one tiny first step, or Goblin Tools if you want a free option.';
const QN = 'Is there an app for task paralysis?';
const AN = 'Yes. A task paralysis app works at the moment you freeze rather than at the planning stage: it shrinks the stuck task into a first step small enough to start. FOCO and Goblin Tools both do this, and FOCO adds the step to your calendar.';

// string edits: [find, replace, expected count]
const EDITS = [
  ["The best apps for ADHD task paralysis work at the exact moment you're frozen",
   "The best procrastination apps for ADHD task paralysis work at the exact moment you're frozen", 1],
  ['<h2 id="faq">FAQ: Apps for ADHD Task Paralysis</h2>', '<h2 id="faq">FAQ: Procrastination Apps for ADHD Task Paralysis</h2>', 1],
  [Q1_OLD, Q1_NEW, 2],   // H3 + FAQPage schema
  [A1_OLD, A1_NEW, 2],   // answer + FAQPage schema
];

const get = async () => {
  const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } });
  const p = await r.json();
  return { content: p.content.raw, title: p.title.raw };
};
const count = (s, k) => (s.replace(/<[^>]+>/g, ' ').match(new RegExp(k, 'gi')) || []).length;

(async () => {
  const { content, title } = await get();
  fs.writeFileSync(path.join(__dirname, '.audit-cache', `backup-best-apps-for-adhd-task-paralysis-${new Date().toISOString().slice(0, 10)}-pre-retarget.html`), content);
  console.log(`before: "${title}" | procrastination app x${count(content, 'procrastination app')} | task paralysis app x${count(content, 'task paralysis app')}`);

  let next = content, applied = 0;
  for (const [find, to, n] of EDITS) {
    if (next.includes(to) && !next.includes(find)) { console.log('SKIP  already: ' + to.slice(0, 50)); continue; }
    const got = next.split(find).length - 1;
    if (got !== n) { console.error(`ABORT guard x${got} (want ${n}): ${find.slice(0, 60)}`); process.exit(1); }
    next = next.split(find).join(to); applied++;
  }

  // new FAQ entry (visible) right after the first answer
  if (!next.includes(QN)) {
    const anchor = `<h3>${Q1_NEW}</h3>`;
    const i = next.indexOf(anchor), j = next.indexOf('</p>', i) + 4;
    if (i < 0 || j < 4) { console.error('ABORT FAQ anchor'); process.exit(1); }
    next = next.slice(0, j) + `\n\n<h3>${QN}</h3>\n<p>${AN}</p>` + next.slice(j); applied++;
  }
  // schema: Article headline + keywords, FAQPage new Question
  next = next.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, json) => {
    let o; try { o = JSON.parse(json); } catch (e) { return m; }
    if (o['@type'] === 'Article') { o.headline = NEW_TITLE + ' (2026)'; o.keywords = 'procrastination app, anti procrastination app, task paralysis app, best apps for adhd task paralysis'; applied++; }
    if (o['@type'] === 'FAQPage' && !o.mainEntity.some(q => q.name === QN)) {
      o.mainEntity.splice(1, 0, { '@type': 'Question', name: QN, acceptedAnswer: { '@type': 'Answer', text: AN } }); applied++;
    }
    return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  });

  if (/—/.test(next) && !/—/.test(content)) { console.error('ABORT em dash introduced'); process.exit(1); }
  if (/adding tasks by hand is free/.test(next)) { console.error('ABORT stale free claim still present'); process.exit(1); }

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${ID}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next, title: NEW_TITLE }) });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const fresh = await get();
    if (fresh.title === NEW_TITLE && fresh.content.includes(QN) && fresh.content.includes(Q1_NEW)) done = true; else console.error('  not persisted, retry ' + a);
  }
  if (!done) { console.error('FAIL did not persist'); process.exit(1); }

  const rm = await fetch(BASE + '/wp-json/rankmath/v1/updateMeta', { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectID: ID, objectType: 'post', meta: { rank_math_focus_keyword: FOCUS_KW, rank_math_description: META_DESC } }) });
  console.log('RankMath focus keyword + description: HTTP ' + rm.status);

  const after = await get();
  console.log(`after : "${after.title}" (${after.title.length} chars) | procrastination app x${count(after.content, 'procrastination app')} | anti-procrastination app x${count(after.content, 'anti-procrastination app')} | task paralysis app x${count(after.content, 'task paralysis app')}`);
  console.log(`OK ${applied} edit(s); meta description ${META_DESC.length} chars`);
})();
