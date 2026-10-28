// Homepage (page 4760) -> /best-apps-for-adhd-task-paralysis/ with the post's intent as anchor ("compare apps for task
// paralysis"), so Google separates the two pages that both ranked ~7-8 for "task paralysis app": the homepage is THE
// app, the post is the comparison. Same pattern as the FAQ answer above it (ends with a link to the explainer).
// Patches the live page (GET -> edit -> POST, verified) AND homepage-preview/index.html, so a rebuild keeps it.
//   node homepage-link-task-paralysis-apps.js
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
const ID = 4760;

const FIND = 'That combination is aimed squarely at the start, not at the planning.</p>';
const LINK = ' <a href="https://www.tryfoco.com/best-apps-for-adhd-task-paralysis/">Compare apps for task paralysis</a>.';
const TO = 'That combination is aimed squarely at the start, not at the planning.' + LINK + '</p>';

const get = async () => {
  const r = await fetch(BASE + `/wp-json/wp/v2/pages/${ID}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } });
  return (await r.json()).content.raw;
};

(async () => {
  // 1. local source
  const src = path.join(__dirname, 'homepage-preview', 'index.html');
  let s = fs.readFileSync(src, 'utf8');
  if (s.includes(LINK)) console.log('source: already linked');
  else if (s.split(FIND).length - 1 === 1) { fs.writeFileSync(src, s.replace(FIND, TO)); console.log('source: linked'); }
  else { console.error('ABORT source anchor not found exactly once'); process.exit(1); }

  // 2. live page
  const live = await get();
  if (live.includes(LINK)) { console.log('live: already linked'); return; }
  const n = live.split(FIND).length - 1;
  if (n !== 1) { console.error(`ABORT live anchor x${n}`); process.exit(1); }
  fs.writeFileSync(path.join(__dirname, '.audit-cache', `backup-homepage-4760-${new Date().toISOString().slice(0, 10)}.html`), live);
  const next = live.replace(FIND, TO);
  for (let a = 1; a <= 3; a++) {
    const r = await fetch(BASE + `/wp-json/wp/v2/pages/${ID}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const fresh = await get();
    if (fresh.includes(LINK) && fresh.length >= live.length) { console.log(`live: linked (content ${live.length} -> ${fresh.length} chars)`); return; }
    console.error('  not persisted, retry ' + a);
  }
  console.error('FAIL did not persist'); process.exit(1);
})();
