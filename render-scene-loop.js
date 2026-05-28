#!/usr/bin/env node
// render-scene-loop.js — Animate video-assets/focus-scene.png into a seamless lofi-style MP4 loop.
//
// Adds: Ken Burns drift, rain, candle flicker, neon pulse, moon glow.
// All animations are deterministic and loop seamlessly at `--loop` seconds.
//
// Usage:
//   node render-scene-loop.js                       # 1920x1080, 12s seamless loop
//   node render-scene-loop.js --size=1080x1080      # square crop for social
//   node render-scene-loop.js --loop=8              # shorter loop
//   node render-scene-loop.js --duration=60         # 60s output (loops the cycle 5x)
//   node render-scene-loop.js --fps=24              # film-style framerate
//
// Output: video-assets/focus-scene-loop.mp4

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('ffmpeg-static');

const SCENE = path.join(__dirname, 'video-assets', 'focus-scene.png');
const OUT_DIR = path.join(__dirname, 'video-assets');

function parseArgs() {
  const a = { size: '1920x1080', loop: 12, fps: 30, duration: null };
  for (const x of process.argv.slice(2)) {
    const m = x.match(/^--(\w+)=(.+)$/);
    if (!m) continue;
    if (m[1] === 'size') a.size = m[2];
    else if (m[1] === 'loop') a.loop = parseFloat(m[2]);
    else if (m[1] === 'fps') a.fps = parseInt(m[2], 10);
    else if (m[1] === 'duration') a.duration = parseFloat(m[2]);
  }
  const [w, h] = a.size.split('x').map(Number);
  return { ...a, w, h };
}

function buildHTML(sceneDataUrl, w, h, loopSec) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:#040208}
.stage{position:fixed;inset:0;overflow:hidden;background:#040208}
.scene{position:absolute;inset:-3%;background:url("${sceneDataUrl}") center/cover no-repeat;will-change:transform;animation:kenburns ${loopSec}s ease-in-out infinite;animation-play-state:paused}
@keyframes kenburns{
  0%   { transform: scale(1.00) translate(0,0); }
  25%  { transform: scale(1.015) translate(-8px,-4px); }
  50%  { transform: scale(1.03) translate(-14px,-10px); }
  75%  { transform: scale(1.015) translate(-8px,-4px); }
  100% { transform: scale(1.00) translate(0,0); }
}
.fx{position:absolute;pointer-events:none;mix-blend-mode:screen;will-change:opacity,transform}
.rain{position:absolute;inset:0;pointer-events:none;opacity:0.45}
.neon{right:4%;top:6%;width:${Math.round(w*0.22)}px;height:${Math.round(h*0.45)}px;background:radial-gradient(ellipse at center, rgba(167,139,250,0.55) 0%, rgba(124,58,237,0.25) 35%, transparent 70%);animation:neonPulse 4s ease-in-out infinite;animation-play-state:paused}
@keyframes neonPulse{
  0%,100% { opacity: 0.55; transform: scale(1.00); }
  50%     { opacity: 0.95; transform: scale(1.06); }
}
.candle{right:11%;bottom:6%;width:${Math.round(w*0.13)}px;height:${Math.round(h*0.22)}px;background:radial-gradient(circle at 50% 60%, rgba(251,146,60,0.75) 0%, rgba(251,146,60,0.35) 30%, transparent 70%);animation:candleFlicker ${loopSec}s linear infinite;animation-play-state:paused}
@keyframes candleFlicker{
  0%   { opacity: 0.85; transform: scale(1.00); }
  7%   { opacity: 0.55; transform: scale(0.93); }
  14%  { opacity: 1.00; transform: scale(1.08); }
  22%  { opacity: 0.70; transform: scale(0.96); }
  31%  { opacity: 0.95; transform: scale(1.05); }
  42%  { opacity: 0.62; transform: scale(0.94); }
  53%  { opacity: 1.05; transform: scale(1.10); }
  64%  { opacity: 0.78; transform: scale(0.98); }
  75%  { opacity: 0.92; transform: scale(1.04); }
  84%  { opacity: 0.65; transform: scale(0.95); }
  93%  { opacity: 0.98; transform: scale(1.06); }
  100% { opacity: 0.85; transform: scale(1.00); }
}
.moon{left:48%;top:5%;width:${Math.round(w*0.16)}px;height:${Math.round(h*0.28)}px;background:radial-gradient(circle, rgba(255,245,200,0.32) 0%, rgba(255,245,200,0.10) 45%, transparent 75%);animation:moonGlow ${loopSec}s ease-in-out infinite;animation-play-state:paused}
@keyframes moonGlow{
  0%,100% { opacity: 0.55; }
  50%     { opacity: 0.95; }
}
.lamp{left:3%;top:4%;width:${Math.round(w*0.20)}px;height:${Math.round(h*0.45)}px;background:radial-gradient(ellipse at 35% 50%, rgba(255,210,140,0.30) 0%, rgba(255,180,100,0.12) 40%, transparent 75%);animation:lampWarm 8s ease-in-out infinite;animation-play-state:paused}
@keyframes lampWarm{
  0%,100% { opacity: 0.85; }
  50%     { opacity: 1.00; }
}
.vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%);mix-blend-mode:multiply}
</style></head><body>
<div class="stage">
  <div class="scene"></div>
  <canvas class="rain" width="${w}" height="${h}"></canvas>
  <div class="fx neon"></div>
  <div class="fx candle"></div>
  <div class="fx moon"></div>
  <div class="fx lamp"></div>
  <div class="vignette"></div>
</div>
<script>
const W=${w}, H=${h}, LOOP_MS=${loopSec*1000};
const RAIN_PERIOD_MS=4000;
const N_DROPS=Math.round(W*H/14000); // density scales with viewport
const drops=[];
let _s=42;
function rnd(){_s=(_s*1664525+1013904223)|0;return ((_s>>>8)&0xffffff)/0xffffff;}
for(let i=0;i<N_DROPS;i++){
  drops.push({
    x: rnd()*W,
    len: 10 + rnd()*22,
    alpha: 0.18 + rnd()*0.42,
    offset: rnd()*RAIN_PERIOD_MS,
    skew: 1 + rnd()*2,
  });
}
const cvs=document.querySelector('.rain');
const ctx=cvs.getContext('2d');
function renderRain(tMs){
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(200,220,255,0.85)';
  ctx.lineCap='round';
  for(const d of drops){
    const phase=(((tMs+d.offset)%RAIN_PERIOD_MS)/RAIN_PERIOD_MS);
    const y=phase*(H+200)-100;
    ctx.globalAlpha=d.alpha;
    ctx.lineWidth=1.4;
    ctx.beginPath();
    ctx.moveTo(d.x, y);
    ctx.lineTo(d.x-d.skew, y+d.len);
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}
renderRain(0);

window.__setT = function(ms){
  for (const a of document.getAnimations()){ a.pause(); a.currentTime = ms; }
  renderRain(ms);
};
window.__ready = new Promise(r => {
  const probe = new Image();
  probe.src = document.querySelector('.scene').style.backgroundImage.slice(5,-2);
  if (probe.complete) r();
  else { probe.onload = () => r(); probe.onerror = () => r(); }
});
</script></body></html>`;
}

function ffmpegEncode(framePattern, outPath, fps, totalSec) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-stream_loop', '-1',
      '-framerate', String(fps), '-i', framePattern,
      '-t', String(totalSec),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outPath,
    ];
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
    p.on('error', reject);
  });
}

(async () => {
  const { w, h, loop, fps, duration } = parseArgs();
  if (!fs.existsSync(SCENE)) { console.error('Missing:', SCENE); process.exit(1); }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foco-scene-'));
  const totalFrames = Math.round(loop * fps);
  const finalSec = duration || loop;

  console.log(`▶ ${w}x${h} | ${loop}s loop @ ${fps}fps = ${totalFrames} frames | output ${finalSec}s`);
  console.log(`▶ Tmp: ${tmpDir}`);

  const sceneBuf = fs.readFileSync(SCENE);
  const sceneUrl = `data:image/png;base64,${sceneBuf.toString('base64')}`;
  const html = buildHTML(sceneUrl, w, h, loop);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(150);

  const t0 = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const ms = (f / fps) * 1000;
    await page.evaluate((t) => window.__setT(t), ms);
    await page.screenshot({
      path: path.join(tmpDir, `f_${String(f).padStart(4, '0')}.png`),
      type: 'png',
      omitBackground: false,
    });
    if (f % 15 === 0) process.stdout.write(`  frame ${f}/${totalFrames}\r`);
  }
  console.log(`✓ Captured ${totalFrames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close();

  const outFile = path.join(OUT_DIR, 'focus-scene-loop.mp4');
  await ffmpegEncode(path.join(tmpDir, 'f_%04d.png'), outFile, fps, finalSec);

  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));
  fs.rmdirSync(tmpDir);

  const sz = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Done: ${outFile} (${sz} MB)`);
})().catch((e) => { console.error(e); process.exit(1); });
