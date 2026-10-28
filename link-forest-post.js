// Inbound links to the new /forest-app-for-adhd/ post (published 2026-10-14) from the two posts that already discuss
// Forest, plus two fixes found while there: forestapp.cc link -> nofollow (competitor rule), and a stale "free"
// FOCO claim in the pomodoro post (FOCO has no free tier). GET -> guarded edit -> POST -> verify, with backups.
//   node link-forest-post.js
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
const URL = 'https://www.tryfoco.com/forest-app-for-adhd/';

const PLAN = {
  222: [ // best-productivity-apps-for-adhd
    ["<p><strong>Cons:</strong> Doesn't help with task initiation - only with sustaining focus once you've started.</p>",
     `<p><strong>Cons:</strong> Doesn't help with task initiation - only with sustaining focus once you've started. More in our <a href="${URL}">Forest app for ADHD review</a>.</p>`],
    ['<a href="https://www.forestapp.cc" target="_blank" rel="noopener">forestapp.cc</a>',
     '<a href="https://www.forestapp.cc" target="_blank" rel="nofollow noopener">forestapp.cc</a>'],
  ],
  206: [ // pomodoro-for-adhd
    ['The visual metaphor and gentle gamification work well for ADHD brains.</p>',
     `The visual metaphor and gentle gamification work well for ADHD brains. See our <a href="${URL}">Forest app for ADHD guide</a>.</p>`],
    ['<p><strong>FOCO body doubling session:</strong> The free <a href="https://www.tryfoco.com/body-doubling-adhd/">body doubling session</a> pairs',
     '<p><strong>FOCO body doubling session:</strong> FOCO\'s <a href="https://www.tryfoco.com/body-doubling-adhd/">body doubling session</a> pairs'],
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
      next = next.replace(find, to); n++;
    }
    if (!n) continue;
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-forest-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to Forest post: ${fresh.includes(URL)}`);
  }
})();
