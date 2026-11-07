#!/usr/bin/env node
// Hero card (1600x860) and Pinterest pins (1000x1500) for the ADHD planner kit, built from the
// page PNGs that build.js wrote. Same look as the cleaning kit hero and pins.
//
//   NODE_PATH=$(npm root -g):<deps>/node_modules node tools/adhd-planner-kit/figures.js <kit-dir>

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = process.argv[2];
const repo = path.join(__dirname, '..', '..');
const font = (pkg, file) => 'data:font/woff2;base64,' + fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`)).toString('base64');
const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(repo, 'assets/foco-logo.png')).toString('base64');

const FONTS = `@font-face{font-family:Fraunces;font-weight:800;src:url(${font('fraunces', 'fraunces-latin-800-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:600;src:url(${font('figtree', 'figtree-latin-600-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:800;src:url(${font('figtree', 'figtree-latin-800-normal.woff2')})}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Figtree,'Noto Color Emoji',sans-serif}
.pg{position:absolute;width:300px;border-radius:14px;box-shadow:0 30px 60px -20px rgba(30,10,70,.55),0 0 0 1px rgba(255,255,255,.06)}`;

const hero = () => `<html><head><style>${FONTS}
body{width:1600px;height:860px;position:relative;overflow:hidden;background:#F6F4FB;background-image:linear-gradient(rgba(124,58,237,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.06) 1px,transparent 1px);background-size:28px 28px}
.glow{position:absolute;right:-200px;top:-260px;width:1100px;height:900px;background:radial-gradient(closest-side,rgba(167,139,250,.75),rgba(167,139,250,0));}
.l{position:absolute;left:72px;top:150px;width:560px}
.pill{display:inline-block;background:#7C3AED;color:#fff;font-weight:800;font-size:22px;letter-spacing:.04em;padding:10px 18px;border-radius:99px}
h1{font-family:Figtree;font-weight:800;font-size:66px;line-height:1;letter-spacing:-.03em;color:#160F22;margin-top:30px}
p{font-size:27px;line-height:1.35;color:#4A4266;margin-top:20px;font-weight:600}
.chips{margin-top:28px;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.chip{background:#fff;border-radius:99px;padding:12px 22px;font-size:22px;font-weight:600;color:#160F22;box-shadow:0 6px 18px -8px rgba(60,20,120,.25)}
.chip:before{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;background:#7C3AED;margin-right:12px;vertical-align:3px}
</style></head><body><div class="glow"></div>
<div class="l"><span class="pill">FREE PRINTABLE · 7 PAGES</span><h1>The ADHD<br>Planner Kit</h1><p>Plan less, start sooner. Undated pages for brains that plan fine and still can't start.</p>
<div class="chips"><span class="chip">Daily, weekly and monthly</span><span class="chip">Task breakdown + brain dump</span><span class="chip">Habit tracker with no streaks</span><span class="chip">Letter + A4, dark or ink-saver</span></div></div>
<img class="pg" src="${img('page-weekly.png')}" style="left:700px;top:300px;transform:rotate(-14deg)">
<img class="pg" src="${img('page-task-breakdown.png')}" style="left:830px;top:200px;transform:rotate(-6deg)">
<img class="pg" src="${img('page-habit-tracker.png')}" style="left:1210px;top:250px;transform:rotate(12deg)">
<img class="pg" src="${img('page-brain-dump.png')}" style="left:1110px;top:190px;transform:rotate(5deg)">
<img class="pg" src="${img('page-daily.png')}" style="left:960px;top:110px;width:330px;transform:rotate(0deg)">
</body></html>`;

const pin = (title, kicker, pages, bottom) => `<html><head><style>${FONTS}
body{width:1000px;height:1500px;position:relative;overflow:hidden;background:#07050C;color:#fff}
.c{position:absolute;right:-260px;bottom:-300px;width:1000px;height:1000px;border-radius:50%;background:#7C3AED}
.logo{position:absolute;left:72px;top:64px;height:44px}
.k{position:absolute;left:72px;top:160px;font-weight:800;font-size:38px;color:#C9B8FF}
h1{position:absolute;left:72px;top:215px;width:860px;font-family:Fraunces;font-weight:800;font-size:${title.length > 24 ? 104 : 124}px;line-height:.9;letter-spacing:-.045em}
.b{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font-size:34px;font-weight:600}
.b b{font-weight:800}
.pg{width:480px;border-radius:18px}
</style></head><body><div class="c"></div><img class="logo" src="${LOGO}"><div class="k">${kicker}</div><h1>${title}</h1>
${pages.length > 1 ? `<img class="pg" src="${img(pages[1])}" style="position:absolute;left:430px;top:600px;transform:rotate(4deg)"><img class="pg" src="${img(pages[0])}" style="position:absolute;left:90px;top:560px;transform:rotate(-4deg)">`
    : `<img class="pg" src="${img(pages[0])}" style="position:absolute;left:220px;top:560px;width:560px;transform:rotate(-3deg)">`}
<div class="b"><span>${bottom}</span><span>tryfoco.com</span></div></body></html>`;

const PINS = [
  ['kit', 'The ADHD planner kit.', 'Free ADHD printable', ['page-cover-paper.png', 'page-daily-paper.png'], '<b>7 pages</b>, print or tablet'],
  ['daily', 'Today, small.', 'Free ADHD daily planner', ['page-daily-paper.png'], '<b>Top 3</b> + first tiny step'],
  ['task-breakdown', 'Make it startable.', 'Free ADHD task breakdown', ['page-task-breakdown-paper.png'], '<b>Step one</b> in 2 minutes'],
  ['brain-dump', 'Empty your head.', 'Free ADHD brain dump', ['page-brain-dump-paper.png'], '<b>Dump</b>, then sort in 4'],
  ['time-block', 'See where time goes.', 'Free ADHD time blocking', ['page-time-block-paper.png'], '<b>Guess</b> vs. actual'],
  ['weekly', 'One week at a time.', 'Free ADHD weekly planner', ['page-weekly-paper.png'], '<b>3 lines</b> a day'],
  ['monthly', 'The month at a glance.', 'Free ADHD monthly planner', ['page-monthly-paper.png'], '<b>Undated</b>, any month'],
  ['habit-tracker', 'Count, don\'t chain.', 'Free ADHD habit tracker', ['page-habit-tracker-paper.png'], '<b>No streaks</b> to break'],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 860 } });
  await p.setContent(hero(), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(dir, 'hero.png') });
  const q = await b.newPage({ viewport: { width: 1000, height: 1500 } });
  for (const [k, t, kick, pages, bottom] of PINS) {
    await q.setContent(pin(t, kick, pages, bottom), { waitUntil: 'load' }); await q.evaluate(() => document.fonts.ready);
    await q.screenshot({ path: path.join(dir, `pin-${k}.png`) });
  }
  await b.close();
  console.log('figures done');
})();
