// Inbound links to the new /best-free-adhd-apps/ post (5058, published 2026-10-19), anchor "best free ADHD apps".
// Each goes as a new paragraph after an existing "free" FAQ answer, so the answer text (and its FAQPage schema) is
// untouched: best-adhd-apps-for-adult-women, goblin-tools-alternative, habitica-alternative.
// (The /best-adhd-app/ hand-off lives in fix-best-adhd-app-free.js.)
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-best-free-adhd-apps.js
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
const URL = 'https://www.tryfoco.com/best-free-adhd-apps/';
const A = `<a href="${URL}">best free ADHD apps</a>`;
const MORE = `\n<p>For 12 free options sorted by need, see our guide to the ${A}.</p>`;

const PLAN = {
  1042: [ // best-adhd-apps-for-adult-women
    ["RemindHer's offerings vary - check the official site for current free vs paid features.</p>",
     `RemindHer's offerings vary - check the official site for current free vs paid features.</p>${MORE}`],
  ],
  2058: [ // goblin-tools-alternative
    ['<p>Yes. Structured has a free version with almost every feature, Todoist has a free plan, and Tiimo and Saner.AI have limited free versions.</p>',
     `<p>Yes. Structured has a free version with almost every feature, Todoist has a free plan, and Tiimo and Saner.AI have limited free versions.</p>${MORE}`],
  ],
  4425: [ // habitica-alternative
    ['<p>Yes. Finch, TickTick and Todoist all have free versions, and Habitica itself is free to play.</p>',
     `<p>Yes. Finch, TickTick and Todoist all have free versions, and Habitica itself is free to play.</p>${MORE}`],
  ],
};

const get = async id => (await (await fetch(BASE + `/wp-json/wp/v2/posts/${id}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } })).json()).content.raw;

(async () => {
  for (const [id, edits] of Object.entries(PLAN)) {
    const live = await get(id); let next = live, n = 0;
    for (const [find, to] of edits) {
      if (next.includes(to)) { console.log(`${id}: SKIP already: ${to.slice(0, 50)}`); continue; }
      const c = next.split(find).length - 1;
      if (c !== 1) { console.error(`${id}: ABORT guard x${c}: ${find.slice(0, 60)}`); process.exit(1); }
      next = next.replace(find, () => to); n++;
    }
    if (!n) continue;
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-free-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
