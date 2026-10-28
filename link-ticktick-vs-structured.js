// Inbound links to the new /ticktick-vs-structured/ post (4939, published 2026-10-19) from its siblings, each with the
// exact-match anchor "TickTick vs Structured": ticktick-alternative (Structured section), structured-app-alternative
// (TickTick section), tiimo-vs-structured + tiimo-vs-ticktick ("Comparing more options?" line).
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-ticktick-vs-structured.js
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
const URL = 'https://www.tryfoco.com/ticktick-vs-structured/';
const A = `<a href="${URL}">TickTick vs Structured</a>`;

const PLAN = {
  4430: [ // ticktick-alternative
    ['There is less around it than in TickTick or Tiimo, which can make it easier to keep opening.</p>',
     `There is less around it than in TickTick or Tiimo, which can make it easier to keep opening.</p>\n<p>Torn between these two? Our ${A} comparison goes through them side by side.</p>`],
  ],
  2205: [ // structured-app-alternative
    ['You can use only the list and ignore the rest, which is gentler than an app that needs full setup.</p>',
     `You can use only the list and ignore the rest, which is gentler than an app that needs full setup.</p>\n<p>Deciding between these two? See our full ${A} comparison.</p>`],
  ],
  4411: [ // tiimo-vs-structured
    ['<a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>,',
     `<a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>, ${A},`],
  ],
  4916: [ // tiimo-vs-ticktick
    ['<a href="https://www.tryfoco.com/tiimo-vs-structured/">Tiimo vs Structured</a>,',
     `<a href="https://www.tryfoco.com/tiimo-vs-structured/">Tiimo vs Structured</a>, ${A},`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-tvs-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
