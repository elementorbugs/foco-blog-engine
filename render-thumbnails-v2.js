#!/usr/bin/env node
// render-thumbnails-v2.js — Generate YouTube thumbnails (1280x720) for the v2 focus session videos.
// Background: foco2.png + dark gradient overlay. Bold "<N> MIN" on right with FOCO branding.
//
// Usage:
//   node render-thumbnails-v2.js                       # render 25/50/90 min thumbnails
//   node render-thumbnails-v2.js --image=foco2.png     # use a different background
//   node render-thumbnails-v2.js --suffix=v2           # output naming
//
// Output: video-assets/thumb-<suffix>-<N>min.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, 'video-assets');

function arg(name, fallback) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  return m ? m.split('=').slice(1).join('=') : fallback;
}

const IMG_NAME = arg('image', 'foco2.png');
const SUFFIX = arg('suffix', 'v2');
const DURATIONS = [25, 50, 90];

function buildHTML(bgDataUrl, minutes) {
  return `<!DOCTYPE html><html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden;background:#040208;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.bg{position:absolute;inset:0;background:url("${bgDataUrl}") center/cover no-repeat;filter:brightness(0.82) saturate(1.08)}
.scrim{position:absolute;inset:0;background:linear-gradient(90deg, transparent 0%, transparent 28%, rgba(4,2,8,0.5) 50%, rgba(4,2,8,0.92) 78%, rgba(4,2,8,0.96) 100%)}
.glow{position:absolute;top:-200px;right:-200px;width:800px;height:800px;background:radial-gradient(circle, rgba(124,58,237,0.32) 0%, transparent 60%);pointer-events:none}
.accent-line{position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#7C3AED 0%,#A78BFA 50%,#FB923C 100%)}
.brand{position:absolute;top:28px;left:36px;display:flex;align-items:center;gap:10px;z-index:5}
.brand-mark{width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #A78BFA 0%, #7C3AED 70%);box-shadow:0 4px 16px rgba(124,58,237,0.6)}
.brand-text{font-weight:900;font-size:20px;color:#fff;letter-spacing:2px}
.content{position:absolute;right:56px;top:50%;transform:translateY(-50%);text-align:right;z-index:4;max-width:620px}
.eyebrow{display:inline-block;font-weight:700;font-size:18px;color:#A78BFA;background:rgba(124,58,237,0.22);padding:8px 16px;border-radius:999px;text-transform:uppercase;letter-spacing:3px;margin-bottom:18px;border:1px solid rgba(167,139,250,0.4)}
.minutes{font-weight:900;font-size:230px;line-height:0.85;color:#fff;letter-spacing:-8px;text-shadow:0 8px 40px rgba(0,0,0,0.6);margin-bottom:4px}
.minutes .unit{font-size:88px;color:#FB923C;letter-spacing:-3px;margin-left:6px}
.title{font-weight:800;font-size:50px;line-height:1.0;color:#fff;letter-spacing:-1.5px;margin-top:8px;text-shadow:0 4px 24px rgba(0,0,0,0.6)}
.sep{display:inline-block;width:80px;height:4px;background:#7C3AED;margin:18px 0;border-radius:2px;float:right;clear:both}
.tag{clear:both;font-weight:600;font-size:22px;color:#B8B0CC;letter-spacing:1.5px;text-transform:uppercase;margin-top:14px}
.tag span{color:#FB923C;margin:0 8px}
.url{position:absolute;bottom:24px;right:36px;font-weight:600;font-size:16px;color:#A78BFA;letter-spacing:1px;z-index:5}
</style></head><body>
<div class="bg"></div>
<div class="scrim"></div>
<div class="glow"></div>
<div class="accent-line"></div>
<div class="brand"><div class="brand-mark"></div><div class="brand-text">FOCO</div></div>
<div class="content">
  <div class="eyebrow">ADHD Body Doubling</div>
  <div class="minutes">${minutes}<span class="unit">MIN</span></div>
  <div class="title">Study With Me<br/>No Talking · Lofi</div>
  <div class="sep"></div>
  <div class="tag">Focus<span>·</span>Calm<span>·</span>Done</div>
</div>
<div class="url">tryfoco.com</div>
</body></html>`;
}

(async () => {
  const imgPath = path.join(ASSETS, IMG_NAME);
  if (!fs.existsSync(imgPath)) { console.error('Missing image:', imgPath); process.exit(1); }

  const bgDataUrl = `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

  for (const m of DURATIONS) {
    const page = await ctx.newPage();
    await page.setContent(buildHTML(bgDataUrl, m), { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const out = path.join(ASSETS, `thumb-${SUFFIX}-${m}min.png`);
    await page.screenshot({ path: out, type: 'png', fullPage: false });
    await page.close();
    const sz = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`✓ ${m}min → ${path.basename(out)} (${sz} KB)`);
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
