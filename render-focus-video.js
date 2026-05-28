#!/usr/bin/env node
// render-focus-video.js — Produce a YouTube-ready focus session MP4 from a cover + audio.
// The cover can be a STILL IMAGE (png/jpg/webp) or a VIDEO clip (mov/mp4/webm/mkv):
//   - Image cover → held as a still for the whole duration.
//   - Video cover → looped to fill the duration; the clip's own audio is dropped (we use --audio).
// Usage:
//   node render-focus-video.js <minutes>                                     — render one duration
//   node render-focus-video.js all                                           — render 25, 50, and 90 min
//   node render-focus-video.js all --image=cover.mov --audio=track.mp3       — custom inputs
//   node render-focus-video.js all --suffix=v2                               — custom output suffix
//
// Inputs (place in video-assets/): a cover (image or video) + an audio bed (loops to fill duration).
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

const VF = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1';

// Detect whether the cover is a video (real Duration) vs a still image (Duration N/A).
// Robust even if the file has the wrong extension (e.g. a .mov saved as .png).
function coverIsVideo(file) {
  return new Promise((resolve) => {
    const p = spawn(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d.toString(); });
    p.on('exit', () => {
      const m = err.match(/Duration:\s*(N\/A|[0-9][0-9:.]+)/i);
      resolve(!!(m && m[1] !== 'N/A'));
    });
    p.on('error', () => resolve(false));
  });
}

function render(minutes, isVideo) {
  return new Promise((resolve, reject) => {
    const seconds = minutes * 60;
    const tag = SUFFIX ? `-${SUFFIX}` : '';
    const out = path.join(ASSETS, `foco-session${tag}-${minutes}min.mp4`);
    const args = isVideo
      ? [
          '-y',
          '-stream_loop', '-1', '-i', IMG,   // loop the cover video
          '-stream_loop', '-1', '-i', AUD,   // loop the audio bed
          '-map', '0:v:0', '-map', '1:a:0',  // video from clip, audio from the track (ignore clip's own audio)
          '-vf', VF,
          '-t', String(seconds),
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
          '-pix_fmt', 'yuv420p', '-r', '24',
          '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
          '-movflags', '+faststart',
          out,
        ]
      : [
          '-y',
          '-loop', '1', '-framerate', '2', '-i', IMG,  // hold the still image
          '-stream_loop', '-1', '-i', AUD,
          '-vf', VF,
          '-t', String(seconds),
          '-c:v', 'libx264', '-tune', 'stillimage', '-preset', 'veryfast', '-crf', '23',
          '-pix_fmt', 'yuv420p', '-r', '24',
          '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
          '-movflags', '+faststart',
          '-shortest',
          out,
        ];
    console.log(`\n▶ Rendering ${minutes} min (${isVideo ? 'video' : 'image'} cover) → ${path.basename(out)}`);
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

  const a = process.argv[2];
  if (!a) { console.error('Usage: node render-focus-video.js <minutes|all>'); process.exit(1); }

  const isVideo = await coverIsVideo(IMG);
  const durations = a === 'all' ? [25, 50, 90] : [parseInt(a, 10)];
  try {
    for (const d of durations) {
      if (isNaN(d) || d < 1 || d > 240) { console.error('Invalid duration:', d); continue; }
      await render(d, isVideo);
    }
  } catch (e) {
    console.error('Render failed:', e.message);
    process.exit(1);
  }
})();
