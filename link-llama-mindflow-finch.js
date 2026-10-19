// Inbound links to the three reviews published 2026-10-19: /llama-life-review/, /mindflow-ai-review/, /finch-app-review/.
// Llama Life: goblin-tools-alternative (its Llama Life section), routinery-app-review ("Comparing more options?").
// Mindflow AI: aligned-app-review ("Comparing more options?"), best-apps-for-adhd-task-paralysis (after the coach pointers).
// Finch: habitica-alternative (its Finch section), best-apps-for-adhd-task-paralysis (its Finch section), numo-app-review.
// Llama Life also from ellie-planner-review ("Comparing more planners?").
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-llama-mindflow-finch.js
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
const URLS = {
  llama: 'https://www.tryfoco.com/llama-life-review/',
  mindflow: 'https://www.tryfoco.com/mindflow-ai-review/',
  finch: 'https://www.tryfoco.com/finch-app-review/',
};
const LLAMA = `<a href="${URLS.llama}">Llama Life review</a>`;
const MINDFLOW = `<a href="${URLS.mindflow}">Mindflow AI review</a>`;
const FINCH = `<a href="${URLS.finch}">Finch app review</a>`;
const NUMO = '<a href="https://www.tryfoco.com/numo-app-review/">Numo review</a>';
const ROUTINERY_LINE = '<p>Stuck mostly on routines, like mornings and bedtime? Our <a href="https://www.tryfoco.com/routinery-app-review/">Routinery review</a> covers an app that times each step out loud.</p>';

const PLAN = {
  2058: [ // goblin-tools-alternative
    ["so one step can't quietly eat the afternoon.</p>",
     `so one step can't quietly eat the afternoon.</p>\n<p>For the full picture, pricing and who it suits, see our ${LLAMA}.</p>`],
  ],
  4983: [ // routinery-app-review
    [`our ${NUMO}, or the full`, `our ${NUMO}, our ${LLAMA}, or the full`],
  ],
  4497: [ // aligned-app-review
    [`our ${NUMO}, or the full`, `our ${NUMO}, our ${MINDFLOW}, or the full`],
  ],
  4315: [ // best-apps-for-adhd-task-paralysis
    [ROUTINERY_LINE, `${ROUTINERY_LINE}\n<p>Want an ADHD coach you can talk to out loud? Our ${MINDFLOW} covers a voice-first option.</p>`],
    ['which helps when the task itself feels too heavy to face directly.</p>',
     `which helps when the task itself feels too heavy to face directly.</p>\n<p>More on how it works and what Finch Plus adds in our ${FINCH}.</p>`],
  ],
  4950: [ // ellie-planner-review
    [`<a href="https://www.tryfoco.com/structured-app-alternative/">Structured alternatives</a>, our ${NUMO}, or the full`,
     `<a href="https://www.tryfoco.com/structured-app-alternative/">Structured alternatives</a>, our ${NUMO}, our ${LLAMA}, or the full`],
  ],
  4969: [ // numo-app-review
    ['our <a href="https://www.tryfoco.com/routinery-app-review/">Routinery review</a>, or the full',
     `our <a href="https://www.tryfoco.com/routinery-app-review/">Routinery review</a>, our ${FINCH}, or the full`],
  ],
  4425: [ // habitica-alternative
    ['with goal tracking, a mood tracker and guided journaling.</p>',
     `with goal tracking, a mood tracker and guided journaling.</p>\n<p>Our ${FINCH} goes through it in detail.</p>`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-lmf-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    const hits = Object.entries(URLS).filter(([, u]) => fresh.includes(u)).map(([k]) => k).join(',');
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links now present: ${hits}`);
  }
})();
