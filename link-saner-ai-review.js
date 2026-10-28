// Inbound links to the new /saner-ai-review/ post (published 2026-10-19), anchor "Saner.AI review":
// goblin-tools-alternative (its Saner.AI section), ai-task-breakdown ("Integration with existing workflows"),
// adhd-remote-work (tools section), mindflow-ai-review ("Comparing more options?").
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-saner-ai-review.js
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
const URL = 'https://www.tryfoco.com/saner-ai-review/';
const A = `<a href="${URL}">Saner.AI review</a>`;
const INFLOW = '<a href="https://www.tryfoco.com/inflow-review/">Inflow review</a>';

const PLAN = {
  2058: [ // goblin-tools-alternative
    ['with higher in-app prices on the App Store (checked Oct 9, 2026).</p>',
     `with higher in-app prices on the App Store (checked Oct 9, 2026).</p>\n<p>For screenshots, user reviews and a plan-by-plan breakdown, see our full ${A}.</p>`],
  ],
  401: [ // ai-task-breakdown
    ['Standalone AI tools that require copying tasks back and forth are giving way to AI built into the apps where you already work.</p>',
     `Standalone AI tools that require copying tasks back and forth are giving way to AI built into the apps where you already work.</p>\n<p>One example is an assistant that pulls tasks out of your email and Slack and breaks them down where they land; our ${A} looks at one built for ADHD.</p>`],
  ],
  4336: [ // adhd-remote-work
    ["keeps the day's edges visible without a commute doing it for you.</p>",
     `keeps the day's edges visible without a commute doing it for you.</p>\n<p><strong>For notes and to-dos scattered across Slack, email and docs:</strong> an AI assistant that gathers them in one place saves the hunt; our ${A} covers one aimed at ADHD knowledge workers.</p>`],
  ],
  5005: [ // mindflow-ai-review
    [`our ${INFLOW}, or the full`, `our ${INFLOW}, our ${A}, or the full`],
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
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-saner-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
