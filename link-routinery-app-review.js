// Inbound links to the new /routinery-app-review/ post (4983, published 2026-10-19), anchor "Routinery review":
// adhd-morning-routine (after the "where to keep it" tip), adhd-transitions (outside cues tip), numo-app-review
// ("Comparing more options?" line), best-apps-for-adhd-task-paralysis (after the Aligned pointer).
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-routinery-app-review.js
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
const URL = 'https://www.tryfoco.com/routinery-app-review/';
const A = `<a href="${URL}">Routinery review</a>`;

const PLAN = {
  4375: [ // adhd-morning-routine
    ['all work better than a notes app you have to remember to check.</p>',
     `all work better than a notes app you have to remember to check.</p>\n<p>Want an app to run the routine with you, one timed step at a time? See our ${A}.</p>`],
  ],
  182: [ // adhd-transitions
    ['External cues do the work your internal sense of time and mode-shifting doesn\'t.</p>',
     `External cues do the work your internal sense of time and mode-shifting doesn't.</p>\n<p>Some routine apps build these cues in, with a timer per step and a voice that announces the next one; our ${A} shows how that works.</p>`],
  ],
  4969: [ // numo-app-review
    ['<a href="https://www.tryfoco.com/foco-vs-inflow/">FOCO vs Inflow</a>, or the full',
     `<a href="https://www.tryfoco.com/foco-vs-inflow/">FOCO vs Inflow</a>, our ${A}, or the full`],
  ],
  4315: [ // best-apps-for-adhd-task-paralysis
    ['See our <a href="https://www.tryfoco.com/aligned-app-review/">Aligned app review</a>.</p>',
     `See our <a href="https://www.tryfoco.com/aligned-app-review/">Aligned app review</a>.</p>\n<p>Stuck mostly on routines, like mornings and bedtime? Our ${A} covers an app that times each step out loud.</p>`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-routinery-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
