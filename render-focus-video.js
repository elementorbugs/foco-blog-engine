#!/usr/bin/env node
// render-focus-video.js — Produce a YouTube-ready focus session MP4 from a still image + lofi audio.
// Usage:
//   node render-focus-video.js <minutes>                                     — render one duration
//   node render-focus-video.js all                                           — render 25, 50, and 90 min versions
//   node render-focus-video.js all --image=foco2.png --audio=focomusic2.mp3  — use different inputs
//   node render-focus-video.js all --suffix=v2                               — custom output suffix
//
// Inputs (place in video-assets/):
//   focus-scene.png   — default still image (any size; scaled to 1920x1080 with letterboxing)
//   lofi-track.mp3    — default audio bed (loops automatically to fill duration)
//
// Output: video-assets/foco-session[-<suffix>]-<N>min.mp4

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

const ASSETS = path.join(__dirname, 'video-assets');

function arg(name, fallback) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  return m ? m.split('=').slice(1).join('=') : fallback;
}

const IMG = path.join(ASSETS, arg('image', 'focus-scene.png'));
const AUD = path.join(ASSETS, arg('audio', 'lofi-track.mp3'));
const SUFFIX = arg('suffix', '');

function render(minutes) {
  return new Promise((resolve, reject) => {
    const seconds = minutes * 60;
    const tag = SUFFIX ? `-${SUFFIX}` : '';
    const out = path.join(ASSETS, `foco-session${tag}-${minutes}min.mp4`);
    const args = [
      '-y',
      '-loop', '1', '-framerate', '2', '-i', IMG,
      '-stream_loop', '-1', '-i', AUD,
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1',
      '-t', String(seconds),
      '-c:v', 'libx264', '-tune', 'stillimage', '-preset', 'veryfast', '-crf', '23',
      '-pix_fmt', 'yuv420p', '-r', '24',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
      '-movflags', '+faststart',
      '-shortest',
      out,
    ];
    console.log(`\n▶ Rendering ${minutes} min → ${path.basename(out)}`);
    const t0 = Date.now();
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => {
      if (code !== 0) return reject(new Error(`FFmpeg exit ${code}`));
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      const sz = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
      console.log(`✓ ${minutes}min done in ${sec}s — ${sz} MB`);
      resolve(out);
    });
    p.on('error', reject);
  });
}

(async () => {
  if (!fs.existsSync(IMG)) { console.error('Missing:', IMG); process.exit(1); }
  if (!fs.existsSync(AUD)) { console.error('Missing:', AUD); process.exit(1); }

  const arg = process.argv[2];
  if (!arg) { console.error('Usage: node render-focus-video.js <minutes|all>'); process.exit(1); }

  const durations = arg === 'all' ? [25, 50, 90] : [parseInt(arg, 10)];
  for (const d of durations) {
    if (isNaN(d) || d < 1 || d > 240) { console.error('Invalid duration:', d); continue; }
    await render(d);
  }
})();
