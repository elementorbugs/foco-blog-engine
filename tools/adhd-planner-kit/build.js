#!/usr/bin/env node
// Free FOCO ADHD planner kit, in the same look as the ADHD cleaning kit (v2):
// night ground, Fraunces headlines, Figtree text, a purple corner circle with emoji stickers,
// a purple fill-in band with a QR code to the free FOCO focus room, and an ink-saver version.
//
// Builds: full kit PDFs (dark + ink-saver, US Letter + A4), one ink-saver PDF per page (Letter),
// page previews (webp), the hero card and Pinterest pins.
//
//   cd <dir with @fontsource/fraunces, @fontsource/figtree, qrcode installed>
//   NODE_PATH=$(npm root -g):$PWD/node_modules node <repo>/tools/adhd-planner-kit/build.js <out-dir>

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');

const out = process.argv[2] || path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const repo = path.join(__dirname, '..', '..');
const font = (pkg, file) => 'data:font/woff2;base64,' + fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`)).toString('base64');
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(repo, 'assets/foco-logo.png')).toString('base64');
const ROOM = 'https://www.tryfoco.com/body-doubling/?utm_source=printable&utm_medium=pdf&utm_campaign=adhd-planner-kit';
const V = 'v2';
// Bump a file's version whenever it changes: the uploader reuses media with the same name.
const KIT_V = 'v3';
const PAGE_V = { 'brain-dump': 'v3' };

const SIZES = { letter: { w: 816, h: 1056, pdf: 'Letter' }, a4: { w: 794, h: 1123, pdf: 'A4' } };

const css = (qr) => `
@font-face{font-family:Fraunces;font-weight:800;src:url(${font('fraunces', 'fraunces-latin-800-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:400;src:url(${font('figtree', 'figtree-latin-400-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:600;src:url(${font('figtree', 'figtree-latin-600-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:700;src:url(${font('figtree', 'figtree-latin-700-normal.woff2')})}
@font-face{font-family:Figtree;font-weight:800;src:url(${font('figtree', 'figtree-latin-800-normal.woff2')})}
@page{margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{--bg:#07050C;--ink:#F4F1FA;--mute:#B8B0CC;--soft:#8F86A8;--line:rgba(167,139,250,.30);--card:rgba(255,255,255,.045);--acc:#A78BFA;--circle:#7C3AED;--band:#7C3AED;--bandInk:#fff;--field:rgba(255,255,255,.22);--foot:#000;font-family:Figtree,'Noto Color Emoji',sans-serif;color:var(--ink)}
body.paper{--bg:#fff;--ink:#160F22;--mute:#5E5675;--soft:#8A82A0;--line:#DDD3F3;--card:#F7F3FE;--acc:#6D28D9;--circle:#EFE7FE;--band:#F1EAFC;--bandInk:#2A1650;--field:#fff;--foot:#fff}
.page{width:var(--w);height:var(--h);background:var(--bg);position:relative;overflow:hidden;display:flex;flex-direction:column;page-break-after:always}
.page:last-child{page-break-after:auto}
.circle{position:absolute;right:-120px;top:-250px;width:450px;height:450px;border-radius:50%;background:var(--circle)}
.circle.small{width:420px;height:420px;right:-170px;top:-220px}
.st{position:absolute;font-family:'Noto Color Emoji';line-height:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
.paper .st{filter:drop-shadow(0 4px 6px rgba(60,20,120,.15))}
.head{position:relative;padding:40px 48px 0}
.logo{height:24px;display:block;margin-bottom:26px}
h1{font-family:Fraunces;font-weight:800;font-size:66px;line-height:.9;letter-spacing:-.045em;max-width:470px}
.sub{font-size:15px;line-height:1.45;color:var(--mute);margin-top:16px;max-width:440px}
.sub b{color:var(--ink);font-weight:700}
.body{flex:1;min-height:0;padding:20px 48px 18px;display:flex;flex-direction:column;gap:12px;position:relative}
.sec{font-size:14px;font-weight:800;color:var(--acc);display:flex;align-items:center;gap:8px}
.sec small{font-weight:600;color:var(--soft);font-size:12.5px}
.ring{width:15px;height:15px;border-radius:50%;border:2.5px solid var(--line);border-top-color:var(--acc);border-right-color:var(--acc);flex:none}
.ring.q1{border-right-color:var(--line)} .ring.full{border-color:var(--acc)}
.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;min-height:0}
.lines{flex:1;min-height:26px;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 25px,var(--line) 25px,var(--line) 26px)}
.dots{flex:1;min-height:40px;background-image:radial-gradient(var(--line) 1.1px,transparent 1.3px);background-size:16px 16px}
.row{display:flex;gap:12px;min-height:0}
.col{display:flex;flex-direction:column;gap:12px;min-height:0}
.grow{flex:1;min-height:0}
.ck{width:13px;height:13px;border-radius:50%;border:1.8px solid var(--acc);display:inline-block;flex:none}
.num{width:24px;height:24px;border-radius:50%;background:var(--circle);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none}
.paper .num{background:#7C3AED}
.wl{flex:1;border-bottom:1.5px solid var(--line);height:22px}
.t{font-size:13.5px;color:var(--ink)} .m{font-size:12.5px;color:var(--soft)}
.band{background:var(--band);color:var(--bandInk);padding:18px 48px;display:flex;align-items:center;gap:22px;min-height:132px}
.band .say{flex:1;font-family:Fraunces;font-weight:800;font-size:24px;line-height:1.35;letter-spacing:-.02em}
.fill{display:inline-block;height:26px;border-radius:99px;background:var(--field);vertical-align:-5px;margin:0 4px}
.paper .fill{border:1.5px solid #C9B8F5}
.band .note{font-family:Figtree;font-weight:400;font-size:12.5px;letter-spacing:0;line-height:1.4;margin-top:8px;opacity:.92}
.band .note b{font-weight:800}
.qr{width:112px;height:112px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex:none}
.qr img{width:66px;height:66px}
.paper .qr{border:1.5px solid #C9B8F5}
.foot{background:var(--foot);display:flex;justify-content:space-between;padding:12px 48px;font-size:12.5px;color:var(--mute)}
.foot b{color:var(--ink)}
.paper .foot{border-top:1px solid var(--line)}
`;

const qrImg = (qr) => `<div class="qr"><img src="${qr}"></div>`;
const head = (title, sub, stickers, small) => `<div class="circle${small ? ' small' : ''}"></div>${stickers}<div class="head"><img class="logo" src="${LOGO}"><h1>${title}</h1><div class="sub">${sub}</div></div>`;
const band = (say, qr) => `<div class="band"><div class="say">${say}<div class="note"><b>Want company?</b> Scan to sit in the FOCO focus room, free and live, and work while other people work beside you.</div></div>${qrImg(qr)}</div>`;
const foot = `<div class="foot"><span><b>Stuck on step one?</b> The FOCO app breaks any task into tiny steps.</span><span>tryfoco.com</span></div>`;
const S = (e, x, y, s) => `<div class="st" style="right:${x}px;top:${y}px;font-size:${s}px">${e}</div>`;
const F = (w) => `<span class="fill" style="width:${w}px"></span>`;

const PAGES = {
  cover: (qr) => `<div class="page">${head('The ADHD planner kit.', 'Seven printable pages for brains that plan fine and still can\'t start. <b>Pick the page for your biggest problem.</b> Skip days freely, nothing is dated.', S('🗓️', 120, 28, 66) + S('✏️', 40, 112, 54) + S('✨', 175, 128, 39))}
    <div class="body" style="gap:10px;padding-top:26px">
      ${[['Daily planner', 'Top 3, a first tiny step for each, rough time blocks', '🗓️'], ['Task breakdown', 'shrink one big task until step one takes 2 minutes', '🧩'], ['Brain dump & sort', 'empty your head, then sort it into four boxes', '🧠'], ['Time-block day', 'guess vs. actual minutes, so time becomes visible', '⏰'], ['Weekly planner', 'one big thing and three lines a day', '🎯'], ['Monthly planner', 'an undated month plus dates you can\'t miss', '📆'], ['Habit tracker', 'count good days, with no streaks to break', '🌱']].map(([a, b, e], i) => `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line)"><span class="num">${i + 1}</span><span style="font-size:20px;font-family:'Noto Color Emoji'">${e}</span><span class="t" style="font-weight:800;font-size:15px">${a}</span><span class="m" style="font-size:14px">${b}</span></div>`).join('')}
      <div class="row" style="margin-top:14px">${[['Keep it where you look', 'Desk, fridge, next to the coffee.'], ['Start with one page', 'Add a second only when it sticks.'], ['Missed a day?', 'Write today\'s date and start there.']].map(([a, b]) => `<div class="box grow"><div class="t" style="font-weight:800">${a}</div><div class="m" style="margin-top:4px">${b}</div></div>`).join('')}</div>
    </div>
    ${band(`Print it, pin it, or use it on a tablet.`, qr)}${foot}</div>`,

  daily: (qr) => `<div class="page">${head('Today, small.', 'Three things that matter, and <b>the tiny first step for each.</b> If only these get done, today counts.', S('☕', 130, 28, 59) + S('🗓️', 40, 112, 56) + S('✨', 190, 128, 37))}
    <div class="body">
      <div class="sec"><span class="ring"></span>Top 3 <small>with the first step written down</small></div>
      ${[1, 2, 3].map(n => `<div style="display:flex;gap:12px;align-items:flex-start"><span class="num">${n}</span><div style="flex:1"><div class="wl"></div><div class="m" style="display:flex;gap:8px;align-items:flex-end;margin-top:6px">First tiny step <span class="wl" style="height:16px"></span></div></div><span class="ck" style="margin-top:6px"></span></div>`).join('')}
      <div class="row grow" style="margin-top:6px">
        <div class="col" style="flex:1.2">${[['Morning', '🌅'], ['Afternoon', '🌤️'], ['Evening', '🌙']].map(([t, e]) => `<div class="box grow"><div class="sec" style="font-size:13px"><span style="font-family:'Noto Color Emoji'">${e}</span>${t}</div><div class="lines"></div></div>`).join('')}</div>
        <div class="col" style="flex:1">
          <div class="box grow"><div class="sec" style="font-size:13px"><span class="ring q1"></span>Brain dump <small>out of your head</small></div><div class="dots"></div></div>
          <div class="box"><div class="sec" style="font-size:13px;margin-bottom:6px"><span class="ring full"></span>Body basics</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 8px" class="t">${[['🥗', 'A real meal'], ['💧', 'Water'], ['💊', 'Meds'], ['🚶', 'Moved a bit'], ['🌳', 'Outside'], ['😴', 'Slept okay']].map(([e, x]) => `<div style="display:flex;gap:6px;align-items:center;font-size:12.5px"><span class="ck"></span><span style="font-family:'Noto Color Emoji'">${e}</span>${x}</div>`).join('')}</div></div>
        </div>
      </div>
    </div>
    ${band(`I'll start with ${F(250)} at ${F(90)}.`, qr)}${foot}</div>`,

  'task-breakdown': (qr) => `<div class="page">${head('Make it startable.', 'Big tasks stall because the first step is fuzzy. <b>Shrink step one until it takes 2 minutes,</b> then guess the rest.', S('🧩', 120, 28, 64) + S('🪜', 35, 112, 56) + S('✨', 185, 128, 37))}
    <div class="body">
      <div class="box"><div class="sec" style="font-size:13px"><span class="ring"></span>The task I keep avoiding</div><div class="wl" style="margin-top:6px"></div>
        <div class="m" style="display:flex;gap:16px;margin-top:10px;align-items:center">It feels: <span><span class="ck"></span> fine</span><span><span class="ck"></span> meh</span><span><span class="ck"></span> huge</span><span style="flex:1"></span>Due <span class="wl" style="flex:none;width:110px;height:16px"></span></div></div>
      <div class="box" style="border:2px solid var(--acc)"><div class="sec" style="font-size:13px"><span class="ring full"></span>Step one, 2 minutes or less <small>open the file · find the form · put on shoes</small></div><div class="wl" style="margin-top:6px"></div></div>
      <div class="box grow"><div class="sec" style="font-size:13px;margin-bottom:4px"><span class="ring q1"></span>Then the next steps <small>one action each · guess the minutes</small></div>
        <div style="flex:1;display:flex;flex-direction:column">${Array.from({ length: 8 }, (_, i) => `<div style="flex:1;display:flex;align-items:flex-end;gap:10px;border-bottom:1px solid var(--line);padding-bottom:4px"><span class="m" style="width:16px;font-weight:800">${i + 2}</span><span style="flex:1"></span><span class="m">___ min</span><span class="ck"></span></div>`).join('')}</div></div>
      <div class="row"><div class="box grow"><div class="t" style="font-weight:800;font-size:13px">If I stall, I'll</div><div class="m" style="margin-top:5px;line-height:1.7">○ make the step smaller &nbsp;○ set a 10-minute timer<br>○ work next to someone &nbsp;○ ask for help</div></div>
      <div class="box grow"><div class="t" style="font-weight:800;font-size:13px">Done is</div><div class="m" style="margin-top:3px">What "good enough" looks like:</div><div class="lines" style="min-height:30px"></div></div></div>
    </div>
    ${band(`I'll do step one ${F(150)} at ${F(100)}.`, qr)}${foot}</div>`,

  'brain-dump': (qr) => `<div class="page">${head('Empty your head.', 'Write everything down, <b>no order and no judging.</b> Then sort it into four boxes, and let one box go.', S('🧠', 125, 28, 64) + S('🌀', 40, 112, 52) + S('✨', 185, 128, 37))}
    <div class="body">
      <div class="box" style="flex:1.1"><div class="sec" style="font-size:13px"><span class="ring"></span>1. Dump it all <small>tasks, worries, ideas, errands, that email</small></div><div class="lines"></div></div>
      <div class="sec" style="font-size:13px;margin-bottom:-4px"><span class="ring full"></span>2. Sort it</div>
      <div class="row grow">${[['✅', 'Do today', 'small, urgent or due'], ['📅', 'Schedule it', 'give it a day']].map(([e, a, b]) => `<div class="box grow"><div class="t" style="font-weight:800;font-size:13px;display:flex;gap:6px"><span style="font-family:'Noto Color Emoji'">${e}</span>${a} <span class="m" style="font-weight:600">${b}</span></div><div class="lines"></div></div>`).join('')}</div>
      <div class="row grow">${[['🤝', 'Ask or hand off', 'someone else can'], ['🎈', 'Let it go', 'not now, maybe never']].map(([e, a, b]) => `<div class="box grow"><div class="t" style="font-weight:800;font-size:13px;display:flex;gap:6px"><span style="font-family:'Noto Color Emoji'">${e}</span>${a} <span class="m" style="font-weight:600">${b}</span></div><div class="lines"></div></div>`).join('')}</div>
    </div>
    ${band(`First I'll do ${F(260)}.`, qr)}${foot}</div>`,

  'time-block': (qr) => `<div class="page">${head('See where time goes.', 'Guess how long each block will take, then <b>write what really happened.</b> The gap is the useful part.', S('⏰', 125, 28, 64) + S('⌛', 40, 112, 54) + S('✨', 188, 128, 37))}
    <div class="body">
      <div class="box grow" style="padding:10px 14px">
        <div style="display:flex;gap:10px;font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--acc);padding-bottom:5px"><span style="width:44px">TIME</span><span style="flex:1">PLAN</span><span style="width:56px;text-align:center">GUESS</span><span style="width:56px;text-align:center">ACTUAL</span></div>
        ${Array.from({ length: 16 }, (_, i) => { const h = 7 + i; const t = `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`; return `<div style="flex:1;display:flex;gap:10px;border-top:1px solid var(--line);align-items:center"><span class="m" style="width:44px;font-weight:700">${t}</span><span style="flex:1;align-self:stretch;border-right:1px dashed var(--line)"></span><span class="m" style="width:56px;text-align:center;opacity:.6">min</span><span class="m" style="width:56px;text-align:center;opacity:.6;border-left:1px dashed var(--line)">min</span></div>`; }).join('')}
      </div>
    </div>
    ${band(`Took longer than I guessed: ${F(170)}<br>Next time I'll add ${F(70)} minutes.`, qr)}${foot}</div>`,

  weekly: (qr) => `<div class="page">${head('One week at a time.', 'One big thing for the week and <b>no more than three lines a day.</b> Fill a ring on any day you showed up.', S('🎯', 125, 28, 62) + S('🗓️', 40, 112, 52) + S('✨', 188, 128, 37))}
    <div class="body">
      <div class="row"><div class="box" style="flex:1.3"><div class="sec" style="font-size:13px"><span class="ring full"></span>This week's one big thing</div><div class="wl" style="margin-top:4px"></div></div>
      <div class="box grow"><div class="sec" style="font-size:13px"><span class="ring"></span>Can't-miss</div><div class="lines" style="min-height:28px"></div></div></div>
      <div class="grow" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr);gap:10px;min-height:0">
        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => `<div class="box" style="padding:9px 12px"><div class="t" style="font-weight:800;font-size:13px;display:flex;justify-content:space-between">${d}<span class="ring" style="width:14px;height:14px;border-color:var(--line)"></span></div>${[1, 2, 3].map(() => `<div style="flex:1;border-bottom:1px solid var(--line);display:flex;align-items:flex-end;padding-bottom:3px"><span class="ck" style="width:10px;height:10px"></span></div>`).join('')}</div>`).join('')}
        <div class="box" style="padding:9px 12px"><div class="t" style="font-weight:800;font-size:13px">Next week <span class="m" style="font-weight:600">park it here</span></div><div class="lines"></div></div>
      </div>
    </div>
    ${band(`Days I showed up: ${F(60)} of 7.`, qr)}${foot}</div>`,

  monthly: (qr) => `<div class="page">${head('The month at a glance.', 'Undated, so it works for any month. <b>Write the dates in as you go</b> and check it once a week.', S('📆', 128, 28, 62) + S('🔔', 40, 112, 52) + S('✨', 190, 128, 37))}
    <div class="body">
      <div class="row grow">
        <div style="flex:3;display:flex;flex-direction:column;min-height:0">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--acc);text-align:center;margin-bottom:5px">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => `<div>${d}</div>`).join('')}</div>
          <div style="flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(6,1fr);border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card)">${Array.from({ length: 42 }, (_, i) => `<div style="border-right:${i % 7 < 6 ? '1px solid var(--line)' : '0'};border-bottom:${i < 35 ? '1px solid var(--line)' : '0'};padding:3px 5px"></div>`).join('')}</div>
        </div>
        <div class="col" style="flex:1.15">${[['🔔', "Can't miss"], ['💸', 'Bills & renewals'], ['🌟', 'This month I want to']].map(([e, a]) => `<div class="box grow"><div class="t" style="font-weight:800;font-size:13px;display:flex;gap:6px"><span style="font-family:'Noto Color Emoji'">${e}</span>${a}</div><div class="lines"></div></div>`).join('')}</div>
      </div>
    </div>
    ${band(`I'll check this page every ${F(170)}.`, qr)}${foot}</div>`,

  'habit-tracker': (qr) => `<div class="page">${head('Count, don\'t chain.', 'Fill a circle on any day you did it. <b>There are no streaks to break,</b> so a missed day costs nothing.', S('🌱', 128, 28, 62) + S('💧', 45, 112, 51) + S('✨', 190, 128, 37))}
    <div class="body">
      ${Array.from({ length: 5 }, () => `<div class="box grow" style="padding:10px 14px;justify-content:center">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px"><div class="m" style="display:flex;gap:8px;align-items:flex-end;width:62%">Habit <span class="wl" style="height:16px"></span></div><div class="m">Good days: <span style="display:inline-block;width:44px;border-bottom:1.5px solid var(--line)">&nbsp;</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(16,1fr);gap:4px 3px;text-align:center;font-size:8px;color:var(--soft)">${Array.from({ length: 31 }, (_, d) => `<div><span style="display:block;width:17px;height:17px;margin:0 auto 1px;border-radius:50%;border:1.6px solid var(--line)"></span>${d + 1}</div>`).join('')}</div></div>`).join('')}
    </div>
    ${band(`Ten good days is ten good days,<br>wherever they fall.`, qr)}${foot}</div>`,
};

const ORDER = ['cover', 'daily', 'task-breakdown', 'brain-dump', 'time-block', 'weekly', 'monthly', 'habit-tracker'];
const doc = (size, names, paper, qr) => `<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${size.w}px;--h:${size.h}px}${css()}</style></head><body class="${paper ? 'paper' : ''}">${names.map(n => PAGES[n](qr)).join('')}</body></html>`;

(async () => {
  const qr = await QRCode.toDataURL(ROOM, { margin: 0, width: 300, color: { dark: '#160F22', light: '#ffffff' } });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pdf = async (file, size, names, paper) => {
    await page.setContent(doc(size, names, paper, qr), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => [i, [...p.querySelectorAll('*')].some(e => e.getBoundingClientRect().bottom > p.getBoundingClientRect().bottom + 1 && getComputedStyle(e).position !== 'absolute')]).filter(x => x[1]).map(x => x[0]));
    if (over.length) console.log('OVERFLOW', file, over);
    await page.pdf({ path: path.join(out, file), format: size.pdf, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  };
  for (const [key, size] of Object.entries(SIZES)) {
    await pdf(`foco-adhd-planner-kit-${key}-${KIT_V}.pdf`, size, ORDER, false);
    await pdf(`foco-adhd-planner-kit-ink-saver-${key}-${KIT_V}.pdf`, size, ORDER, true);
  }
  for (const n of ORDER.slice(1)) await pdf(`foco-adhd-${n}-planner-${PAGE_V[n] || V}.pdf`, SIZES.letter, [n], true);

  const shot = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  for (const n of ORDER) for (const paper of [false, true]) {
    await shot.setContent(doc(SIZES.letter, [n], paper, qr), { waitUntil: 'load' });
    await shot.evaluate(() => document.fonts.ready);
    await shot.screenshot({ path: path.join(out, `page-${n}${paper ? '-paper' : ''}.png`) });
  }
  await browser.close();
  console.log('Built into', out);
})();
