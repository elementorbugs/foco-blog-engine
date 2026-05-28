#!/usr/bin/env node
// render-mascot-loop.js — Render a seamless breathing/idle loop of a FOCO mascot to MP4.
//
// Usage:
//   node render-mascot-loop.js                       # default: state_3_focus, 1080x1080, 4s loop
//   node render-mascot-loop.js --state=2_alignment   # any state from states_1024/
//   node render-mascot-loop.js --size=1920x1080      # custom resolution
//   node render-mascot-loop.js --loop=6              # loop length in seconds (4 = one breath)
//   node render-mascot-loop.js --fps=30              # capture framerate
//   node render-mascot-loop.js --duration=60         # final MP4 length in seconds (loops the cycle)
//
// Output: video-assets/mascot-<state>-loop.mp4

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('ffmpeg-static');

const MASCOT_DIR = path.join(os.homedir(), 'design foco', 'states_1024');
const OUT_DIR = path.join(__dirname, 'video-assets');

function parseArgs() {
  const args = { state: '3_focus', size: '1080x1080', loop: 4, fps: 30, duration: null };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (!m) continue;
    if (m[1] === 'state') args.state = m[2];
    else if (m[1] === 'size') args.size = m[2];
    else if (m[1] === 'loop') args.loop = parseFloat(m[2]);
    else if (m[1] === 'fps') args.fps = parseInt(m[2], 10);
    else if (m[1] === 'duration') args.duration = parseFloat(m[2]);
  }
  const [w, h] = args.size.split('x').map(Number);
  return { ...args, w, h };
}

function buildHTML(mascotDataUrl, w, h, loopSec) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:#040208}
.stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 70% 30%, rgba(124,58,237,0.30) 0%, transparent 55%), radial-gradient(circle at 20% 85%, rgba(167,139,250,0.18) 0%, transparent 60%), #040208}
.mascot{width:${Math.round(w * 0.62)}px;height:auto;transform-origin:50% 60%;will-change:transform;animation:breathe ${loopSec}s ease-in-out infinite, bob ${loopSec}s ease-in-out infinite, tilt ${loopSec * 2}s ease-in-out infinite;animation-play-state:paused}
@keyframes breathe{0%,100%{transform:scale(1.000)}50%{transform:scale(1.025)}}
@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -8px}}
@keyframes tilt{0%,100%{rotate:-1.2deg}50%{rotate:1.2deg}}
</style></head><body>
<div class="stage"><img class="mascot" src="${mascotDataUrl}" /></div>
<script>
window.__setT = function(ms){
  const anims = document.querySelector('.mascot').getAnimations();
  for (const a of anims){ a.pause(); a.currentTime = ms; }
};
window.__ready = new Promise(r => {
  const img = document.querySelector('.mascot');
  if (img.complete) r();
  else img.onload = () => r();
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
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
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
  const { state, w, h, loop, fps, duration } = parseArgs();

  const mascotFile = path.join(MASCOT_DIR, `foco_state_${state}.png`);
  if (!fs.existsSync(mascotFile)) {
    console.error('Mascot not found:', mascotFile);
    console.error('Available states: 1_presence, 2_alignment, 3_focus, 4_drift, 5_completion, 6_pause');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foco-mascot-'));
  const totalFrames = Math.round(loop * fps);
  const finalSec = duration || loop;

  console.log(`▶ State: ${state} | ${w}x${h} | ${loop}s loop @ ${fps}fps = ${totalFrames} frames | output ${finalSec}s`);
  console.log(`▶ Tmp frames: ${tmpDir}`);

  const mascotBuf = fs.readFileSync(mascotFile);
  const mascotDataUrl = `data:image/png;base64,${mascotBuf.toString('base64')}`;
  const html = buildHTML(mascotDataUrl, w, h, loop);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => window.__ready);

  const t0 = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const ms = (f / fps) * 1000;
    await page.evaluate((t) => window.__setT(t), ms);
    const frameFile = path.join(tmpDir, `f_${String(f).padStart(4, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png', omitBackground: false });
    if (f % 30 === 0) process.stdout.write(`  frame ${f}/${totalFrames}\r`);
  }
  console.log(`✓ Captured ${totalFrames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close();

  const outFile = path.join(OUT_DIR, `mascot-${state}-loop.mp4`);
  const framePattern = path.join(tmpDir, 'f_%04d.png');
  await ffmpegEncode(framePattern, outFile, fps, finalSec);

  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));
  fs.rmdirSync(tmpDir);

  const sz = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Done: ${outFile} (${sz} MB)`);
})().catch((e) => { console.error(e); process.exit(1); });
