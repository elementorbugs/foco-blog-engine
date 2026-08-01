// Adds the two light-native infographics #4107 shipped without.
//   node inject-4107-figs.js
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

// ── FIG 1: the five situations ───────────────────────────────────────────────
const WHY_CSS = '.foco-whyfig{margin:34px 0;background:#fff;border:1px solid #E7DFF7;border-radius:20px;padding:30px;box-shadow:0 24px 50px -30px rgba(45,18,87,.45);box-sizing:border-box;max-width:100%}.foco-whyfig *{box-sizing:border-box}.foco-whyfig .wf-t{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7C3AED;margin:0 0 6px}.foco-whyfig .wf-lead{font-size:14px;color:#6E6684;margin:0 0 22px;line-height:1.5}.foco-whyfig .wf-row{display:grid;grid-template-columns:34px 1fr 1fr;gap:14px;align-items:start;padding:14px 0;border-top:1px solid #F1EAFB}.foco-whyfig .wf-row:first-of-type{border-top:0;padding-top:0}.foco-whyfig .wf-n{width:28px;height:28px;border-radius:9px;background:#F3EDFE;color:#7C3AED;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}.foco-whyfig .wf-s{font-size:14.5px;font-weight:800;color:#160F22;line-height:1.4;margin:3px 0 0}.foco-whyfig .wf-a{font-size:13.8px;color:#544B69;line-height:1.55;margin:3px 0 0;position:relative;padding-left:16px}.foco-whyfig .wf-a:before{content:"";position:absolute;left:0;top:8px;width:8px;height:8px;border-right:2px solid #F97316;border-top:2px solid #F97316;transform:rotate(45deg)}.foco-whyfig .wf-cap{margin:20px 2px 0;font-size:13.5px;color:#6E6684;line-height:1.55}@media(max-width:600px){.foco-whyfig{padding:22px 18px}.foco-whyfig .wf-row{grid-template-columns:28px 1fr;gap:10px}.foco-whyfig .wf-a{grid-column:2}}';

const ROWS = [
  ['You are not diagnosed', 'Nothing here needs a label. Build the structure anyway.'],
  ['You are diagnosed and waiting', 'A bridge period. Hold the important things together, do not redesign your life.'],
  ['You are in a supply gap', 'Short term. Protect one or two critical things, expect less output.'],
  ['You have chosen not to medicate', 'The long game. This is where durable structure pays off most.'],
  ['You are medicated but not covered', 'The largest group. These strategies fill the evening and weekend window.'],
];

const WHY_FIG = '<!-- wp:html --><style>' + WHY_CSS + '</style><div class="foco-whyfig">'
  + '<p class="wf-t">Five reasons, five different answers</p>'
  + '<p class="wf-lead">Almost no article asks this first, and it changes what you should prioritise.</p>'
  + ROWS.map(([s, a], i) => '<div class="wf-row"><div class="wf-n">' + (i + 1) + '</div><p class="wf-s">' + s + '</p><p class="wf-a">' + a + '</p></div>').join('')
  + '<p class="wf-cap">A supply gap and a long term decision call for very different amounts of effort. Name yours before you change anything.</p>'
  + '</div><!-- /wp:html -->';

// ── FIG 2: where the stall actually happens ──────────────────────────────────
const GAP_CSS = '.foco-gapfig{margin:34px 0;background:#fff;border:1px solid #E7DFF7;border-radius:20px;padding:30px;box-shadow:0 24px 50px -30px rgba(45,18,87,.45);box-sizing:border-box;max-width:100%}.foco-gapfig *{box-sizing:border-box}.foco-gapfig .gf-t{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7C3AED;margin:0 0 6px}.foco-gapfig .gf-lead{font-size:14px;color:#6E6684;margin:0 0 22px;line-height:1.5}.foco-gapfig .gf-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.foco-gapfig .gf-col{padding:20px;border-radius:14px;border:1px solid #F3D6BE;background:#FBF2EA}.foco-gapfig .gf-col.gf-ok{background:#FBF9FE;border-color:#ECE3FA}.foco-gapfig .gf-h{font-size:15.5px;font-weight:800;color:#160F22;margin:0 0 4px;display:flex;align-items:center;gap:9px}.foco-gapfig .gf-dot{width:10px;height:10px;border-radius:50%;background:#F97316;flex-shrink:0}.foco-gapfig .gf-col.gf-ok .gf-dot{background:#A78BFA}.foco-gapfig .gf-when{font-size:12.5px;font-weight:700;color:#8C7FA6;margin:0 0 12px;padding-left:19px;letter-spacing:.02em}.foco-gapfig ul{margin:0;padding-left:18px}.foco-gapfig li{font-size:13.8px;color:#544B69;line-height:1.6;margin-bottom:7px}.foco-gapfig .gf-cap{margin:18px 2px 0;font-size:13.5px;color:#6E6684;line-height:1.55}@media(max-width:600px){.foco-gapfig{padding:22px 18px}.foco-gapfig .gf-grid{grid-template-columns:1fr}}';

const GAP_FIG = '<!-- wp:html --><style>' + GAP_CSS + '</style><div class="foco-gapfig">'
  + '<p class="gf-t">Two different problems</p>'
  + '<p class="gf-lead">Standard focus advice is good at the second one. The unmedicated day is usually lost in the first.</p>'
  + '<div class="gf-grid">'
  + '<div class="gf-col"><p class="gf-h"><span class="gf-dot"></span>Getting into the task</p><p class="gf-when">Before you begin</p><ul><li>The document is open and nothing moves</li><li>You know what to do and still do not start</li><li>No timer applies yet, because there is nothing to time</li><li>This is where the hours actually go</li></ul></div>'
  + '<div class="gf-col gf-ok"><p class="gf-h"><span class="gf-dot"></span>Staying in the task</p><p class="gf-when">After you begin</p><ul><li>Timers and the Pomodoro technique</li><li>Time blocking and calendar structure</li><li>Noise, headphones, removing distractions</li><li>Breaking the day into chunks</li></ul></div>'
  + '</div>'
  + '<p class="gf-cap">Fix the left column first. Focus duration is a second-order problem, and it gets easier on its own once starting is smaller.</p>'
  + '</div><!-- /wp:html -->';

const JOBS = [
  { key: 'foco-whyfig', fig: WHY_FIG, after: 'A temporary gap does not need a permanent system.' },
  { key: 'foco-gapfig', fig: GAP_FIG, after: 'Focus duration is a second-order problem and it gets easier on its own once the starting problem is smaller.' },
];

const get = async () => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/4107?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

(async () => {
  let content = await get();
  let next = content, applied = 0;

  for (const j of JOBS) {
    if (next.includes(j.key)) { console.log('SKIP  ' + j.key + ' already present'); continue; }
    const n = next.split(j.after).length - 1;
    if (n !== 1) { console.error('FAIL  ' + j.key + '  anchor appears ' + n + 'x'); continue; }
    const i = next.indexOf(j.after);
    const close = next.indexOf('</p>', i);
    if (close < 0) { console.error('FAIL  ' + j.key + '  no closing </p>'); continue; }
    next = next.slice(0, close + 4) + '\n\n' + j.fig + '\n' + next.slice(close + 4);
    applied++;
  }
  if (!applied) { console.log('nothing to do'); return; }

  // guard: single-line CSS only, or wpautop injects <br> into the style block
  for (const j of JOBS) {
    const m = next.match(new RegExp('<style>\\.' + j.key + '[\\s\\S]*?</style>'));
    if (m && /\n/.test(m[0])) { console.error('ABORT ' + j.key + ' CSS contains a newline'); process.exit(1); }
  }

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + '/wp-json/wp/v2/posts/4107', {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next }),
    });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const fresh = await get();
    if (JOBS.every(j => fresh.includes(j.key))) done = true;
    else console.error('  not persisted, retry ' + a);
  }
  console.log((done ? 'OK    ' : 'FAIL  ') + applied + ' infographic(s) injected');
})();
