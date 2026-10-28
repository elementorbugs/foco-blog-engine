// Inbound links to the new /visual-timer/ tool page (2026-10-28).
//  - time-blindness-adhd, pomodoro-for-adhd: link an existing "visual timer(s)" mention
//  - the 5 minute-timer posts: one Key Takeaways line pointing to the visual timer
// GET -> backup -> guarded edit -> POST -> verify. Re-runnable: skips posts that already link.
//   node link-visual-timer.js [--dry]
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
const URL = 'https://www.tryfoco.com/visual-timer/';
const A = t => `<a href="${URL}">${t}</a>`;
const dry = process.argv.includes('--dry');
const TAKEAWAY = /(<div class="foco-key-takeaways">\s*<h2>Key Takeaways<\/h2>\s*<ul>)/;
const takeawayLine = `$1\n<li>Prefer to see time instead of reading it? Use our free ${A('visual timer')}: the colour shrinks as the minutes pass.</li>`;

// [find (string or regex), replace] with exactly one match required
const PLAN = {
  'time-blindness-adhd': [['External time anchors (visual timers, alarms, calendar blocks)', `External time anchors (${A('visual timers')}, alarms, calendar blocks)`]],
  'pomodoro-for-adhd': [['64% rated a visual timer as helpful', `64% rated a ${A('visual timer')} as helpful`]],
  '5-minute-timer-adhd': [[TAKEAWAY, takeawayLine]],
  '10-minute-timer-adhd': [[TAKEAWAY, takeawayLine]],
  '15-minute-timer-adhd': [[TAKEAWAY, takeawayLine]],
  '25-minute-timer-adhd': [[TAKEAWAY, takeawayLine]],
  '30-minute-timer-adhd': [[TAKEAWAY, takeawayLine]],
};

const api = (p, opt = {}) => fetch(BASE + p, { ...opt, headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...(opt.headers || {}) } });
const bySlug = async slug => (await (await api(`/wp-json/wp/v2/posts?slug=${slug}&context=edit&_=${Math.random()}`)).json())[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(path.join(__dirname, '.audit-cache', 'backups'), { recursive: true });
  for (const [slug, edits] of Object.entries(PLAN)) {
    const post = await bySlug(slug);
    if (!post) { console.log(`${slug}: NOT FOUND`); continue; }
    let body = post.content.raw;
    if (body.includes(URL)) { console.log(`${slug}: SKIP already links`); continue; }
    for (const [find, to] of edits) {
      const n = typeof find === 'string' ? body.split(find).length - 1 : (body.match(new RegExp(find.source, 'g')) || []).length;
      if (n !== 1) { console.log(`${slug}: SKIP guard x${n}`); body = null; break; }
      body = typeof find === 'string' ? body.replace(find, () => to) : body.replace(find, to);
    }
    if (!body) continue;
    if (dry) { console.log(`${slug}: would update`); continue; }
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${post.id}-pre-vt-link-${Date.now()}.html`), post.content.raw);
    const r = await api(`/wp-json/wp/v2/posts/${post.id}`, { method: 'POST', body: JSON.stringify({ content: body }) });
    await sleep(2000);
    console.log(`${slug}: HTTP ${r.status} | verified: ${(await bySlug(slug)).content.raw.includes(URL)}`);
  }
})();
