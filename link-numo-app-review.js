// Inbound links to the new /numo-app-review/ post (4969, published 2026-10-19), anchor "Numo review":
// aligned-app-review + inflow-review ("Comparing more options?" line), ellie-planner-review ("Comparing more planners?"
// line), habitica-alternative (party accountability bullet). GET -> guarded edit -> POST -> verify, with backups.
//   node link-numo-app-review.js
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
const URL = 'https://www.tryfoco.com/numo-app-review/';
const A = `<a href="${URL}">Numo review</a>`;
const ELLIE = '<a href="https://www.tryfoco.com/ellie-planner-review/">Ellie Planner review</a>';

const PLAN = {
  4497: [ // aligned-app-review
    [`our ${ELLIE}, or the full`, `our ${ELLIE}, our ${A}, or the full`],
  ],
  1451: [ // inflow-review
    [`our ${ELLIE}, or the full`, `our ${ELLIE}, our ${A}, or the full`],
  ],
  4950: [ // ellie-planner-review
    ['<a href="https://www.tryfoco.com/structured-app-alternative/">Structured alternatives</a>, or the full',
     `<a href="https://www.tryfoco.com/structured-app-alternative/">Structured alternatives</a>, our ${A}, or the full`],
  ],
  4425: [ // habitica-alternative
    ['<li>A party or boss quest makes you show up for other people, and that accountability works for you.</li>',
     `<li>A party or boss quest makes you show up for other people, and that accountability works for you. For an ADHD-only community with points, see our ${A}.</li>`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-numo-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
