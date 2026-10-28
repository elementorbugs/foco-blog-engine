// Inbound links to the new /ellie-planner-review/ post (4950, published 2026-10-19), anchor "Ellie Planner review":
// aligned-app-review + inflow-review ("Comparing more options?" line), best-adhd-planner (after the Structured pick),
// ticktick-vs-structured (Structured section on time blindness). GET -> guarded edit -> POST -> verify, with backups.
//   node link-ellie-planner-review.js
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
const URL = 'https://www.tryfoco.com/ellie-planner-review/';
const A = `<a href="${URL}">Ellie Planner review</a>`;

const PLAN = {
  4497: [ // aligned-app-review
    ['<a href="https://www.tryfoco.com/foco-vs-inflow/">FOCO vs Inflow</a>, or the full',
     `<a href="https://www.tryfoco.com/foco-vs-inflow/">FOCO vs Inflow</a>, our ${A}, or the full`],
  ],
  1451: [ // inflow-review
    ['<a href="https://www.tryfoco.com/best-apps-for-adhd-task-paralysis/">best apps for ADHD task paralysis</a>, or the full',
     `<a href="https://www.tryfoco.com/best-apps-for-adhd-task-paralysis/">best apps for ADHD task paralysis</a>, our ${A}, or the full`],
  ],
  762: [ // best-adhd-planner
    ['The free version already includes the timeline, an inbox and a Pomodoro timer.</p>',
     `The free version already includes the timeline, an inbox and a Pomodoro timer.</p>\n<p>Prefer to brain dump first and then drag tasks into gaps next to your calendar? Our ${A} covers that approach.</p>`],
  ],
  4939: [ // ticktick-vs-structured
    ['warns you when a day is overloaded (<a href="https://help.structured.app/en/articles/998530" target="_blank" rel="nofollow noopener">Structured help: Energy Monitor</a>).</p>',
     `warns you when a day is overloaded (<a href="https://help.structured.app/en/articles/998530" target="_blank" rel="nofollow noopener">Structured help: Energy Monitor</a>).</p>\n<p>If you want time blocks beside your real calendar instead, see our ${A}.</p>`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-ellie-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
