// Light-native infographic for #4163 (the five-step reset).
//   node inject-4163-fig.js
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

const CSS = '.foco-resetfig{margin:34px 0;background:#fff;border:1px solid #E7DFF7;border-radius:20px;padding:30px;box-shadow:0 24px 50px -30px rgba(45,18,87,.45);box-sizing:border-box;max-width:100%}.foco-resetfig *{box-sizing:border-box}.foco-resetfig .rs-t{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7C3AED;margin:0 0 6px}.foco-resetfig .rs-lead{font-size:14px;color:#6E6684;margin:0 0 24px;line-height:1.5}.foco-resetfig .rs-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.foco-resetfig .rs-s{position:relative;padding:18px 14px;border-radius:14px;border:1px solid #ECE3FA;background:#FBF9FE}.foco-resetfig .rs-s:last-child{background:#FBF2EA;border-color:#F3D6BE}.foco-resetfig .rs-n{width:26px;height:26px;border-radius:8px;background:#7C3AED;color:#fff;font-weight:800;font-size:12.5px;display:flex;align-items:center;justify-content:center;margin-bottom:11px}.foco-resetfig .rs-s:last-child .rs-n{background:#F97316}.foco-resetfig .rs-h{font-size:13.5px;font-weight:800;color:#160F22;margin:0 0 6px;line-height:1.35}.foco-resetfig .rs-d{font-size:12.5px;color:#544B69;line-height:1.5;margin:0}.foco-resetfig .rs-cap{margin:20px 2px 0;font-size:13.5px;color:#6E6684;line-height:1.55}@media(max-width:760px){.foco-resetfig{padding:22px 18px}.foco-resetfig .rs-steps{grid-template-columns:1fr 1fr}}@media(max-width:460px){.foco-resetfig .rs-steps{grid-template-columns:1fr}}';

const STEPS = [
  ['Empty your head', 'Write everything down. Do not organise it yet.'],
  ['Choose one task', 'The one that is urgent, important, or realistic to begin.'],
  ['Name the first action', 'Physical, and small enough to do right now.'],
  ['Remove one distraction', 'Phone away, tabs closed, notifications off.'],
  ['Set 15 minutes', 'Work until it rings. Then decide whether to continue.'],
];

const FIG = '<!-- wp:html --><style>' + CSS + '</style><div class="foco-resetfig">'
  + '<p class="rs-t">The five-step reset</p>'
  + '<p class="rs-lead">For the moment the day has already gone sideways and everything feels equally urgent.</p>'
  + '<div class="rs-steps">'
  + STEPS.map(([h, d], i) => '<div class="rs-s"><div class="rs-n">' + (i + 1) + '</div><p class="rs-h">' + h + '</p><p class="rs-d">' + d + '</p></div>').join('')
  + '</div>'
  + '<p class="rs-cap">You do not need to solve the whole day. You only need to make the next action clear.</p>'
  + '</div><!-- /wp:html -->';

const ANCHOR = 'When you feel overwhelmed, use this five-step reset.';

const get = async () => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/4163?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

(async () => {
  let c = await get();
  if (c.includes('foco-resetfig')) { console.log('OK    already present'); return; }
  if (/\n/.test(CSS)) { console.error('ABORT CSS contains a newline'); process.exit(1); }

  const n = c.split(ANCHOR).length - 1;
  if (n !== 1) { console.error('FAIL  anchor appears ' + n + 'x'); process.exit(1); }
  const i = c.indexOf(ANCHOR);
  const close = c.indexOf('</p>', i);
  const next = c.slice(0, close + 4) + '\n\n' + FIG + '\n' + c.slice(close + 4);

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + '/wp-json/wp/v2/posts/4163', {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next }),
    });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    if ((await get()).includes('foco-resetfig')) done = true;
    else console.error('  not persisted, retry ' + a);
  }
  console.log(done ? 'OK    foco-resetfig injected' : 'FAIL  did not persist');
})();
