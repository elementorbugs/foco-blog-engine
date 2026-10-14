// Builds the aesthetic "task i avoided for 3 weeks" short (1080x1920, ~15s), Tiimo-style: one bright cream desk world,
// real FOCO recording keyed into the screen (composite.js) + lowercase text in the TikTok safe zone (14-75% height).
// Run from foco-video/videos/dentist-aesthetic: node composite.js ... (args in the SC comments) then node build.js
// Output: out/dentist-aesthetic-silent.mp4 (for a TikTok in-app sound) and out/dentist-aesthetic-music.mp4 (ambient bed).
const fs = require('fs'), path = require('path'), https = require('https');
const { execFileSync } = require('child_process'); const FF = require('ffmpeg-static');
const OUT = path.join(__dirname, '..', '..', 'out'); fs.mkdirSync(OUT, { recursive: true });
const ff = a => execFileSync(FF, ['-y', '-loglevel', 'error', ...a]);
const getBuf = u => new Promise((res, rej) => https.get(u, x => { if (x.statusCode >= 300 && x.headers.location) return getBuf(x.headers.location).then(res, rej); const c = []; x.on('data', d => c.push(d)); x.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
// src: a Pexels clip (dl2.js), file: a pre-composited phone shot. y = vertical centre of the text block (fraction of height).
const SC = [ // one bright, creamy world (white desk, soft daylight); dark lowercase text in the same spot every shot
  { src: 'work/v-wd5.mp4', ss: 1.0, d: 3.2, y: 0.22, text: ['the task i avoided', 'for 3 weeks:'] },
  { src: 'work/v-wd6.mp4', ss: 2.0, d: 2.6, y: 0.22, text: ['calling the dentist.'] },
  { file: 'work/seg-m6.mp4', ss: 0, d: 4.4, y: 0.19, text: ['so i typed it into foco'] }, // LOCK=1 PRE=crop=720:1280:135:360 composite.js v-mock6 1.0 4.4 rec 7.9 white .. 1 540,1080
  { file: 'work/seg-m1.mp4', ss: 0, d: 3.0, y: 0.70, text: ['tomorrow, 7am,', 'with a reminder'] }, // TRACK=1 PRE=crop=720:1280:0:0 composite.js v-mock1 0.5 3.0 rec 18.7 green
  { src: 'work/v-lt7.mp4', ss: 1.0, d: 3.6, y: 0.22, text: ['tomorrow-me just has', 'to press call.'], tag: 'foco - adhd task planner' },
];
const FONT = 'work/font.ttf';
if (!fs.existsSync(FONT)) fs.copyFileSync('../tp-aesthetic/work/font.ttf', FONT);
const draw = (i, k, line, size, y, dark) => { fs.writeFileSync(path.join('work', `t${i}-${k}.txt`), line); return `drawtext=fontfile='${FONT}':textfile='work/t${i}-${k}.txt':fontsize=${size}:${dark ? 'fontcolor=0x3b3342:shadowcolor=white@0.3' : 'fontcolor=white:borderw=2:bordercolor=black@0.28:shadowcolor=black@0.6'}:x=(w-text_w)/2:y=${y}:shadowx=0:shadowy=2:alpha='if(lt(t,0.35),t/0.35,1)'`; };
(async () => {
  const parts = [];
  for (let i = 0; i < SC.length; i++) {
    const s = SC[i]; let raw = s.file;
    if (!raw) raw = s.src; // downloaded by dl2.js from work/search.json
    const seg = path.join('work', `seg${i}.mp4`), lh = 66, y0 = 1920 * s.y - (s.text.length * lh) / 2;
    // crop: tighter framing on a small phone so the FOCO screen reads; then a gentle centred push-in
    const zp = `zoompan=z='min(1.0+0.0007*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`;
    const vf = [...(s.crop ? [s.crop] : []), 'scale=1080:1920:force_original_aspect_ratio=increase', 'crop=1080:1920', 'setsar=1', 'fps=30', zp,
      "curves=all='0/0.07 0.5/0.53 1/0.97'", 'eq=saturation=0.82:contrast=0.94:brightness=0.02', 'colorbalance=rs=0.02:gs=0.01:bs=-0.025:rh=0.02:bh=-0.02', 'split[o][g];[g]gblur=sigma=28[gb];[o][gb]blend=all_mode=screen:all_opacity=0.16', 'noise=alls=4:allf=t',
      ...s.text.map((line, k) => draw(i, k, line, 50, y0 + k * lh, true)),
      ...(s.tag ? [draw(i, 'tag', s.tag, 34, Math.round(y0 + s.text.length * lh + 40), true)] : []),
    ].join(',');
    ff(['-ss', String(s.ss), '-t', String(s.d), '-i', raw, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', seg]);
    parts.push(seg);
  }
  let filter = '', last = '[0:v]', offset = 0; const X = 0.35;
  for (let i = 1; i < parts.length; i++) { offset += SC[i - 1].d - X; filter += `${last}[${i}:v]xfade=transition=fade:duration=${X}:offset=${offset.toFixed(2)}[x${i}];`; last = `[x${i}]`; }
  const total = SC.reduce((a, s) => a + s.d, 0) - X * (SC.length - 1);
  const silent = path.join(OUT, 'dentist-aesthetic-silent.mp4');
  ff([...parts.flatMap(p => ['-i', p]), '-filter_complex', filter.slice(0, -1).replace(/\[x\d+\]$/, '') + ',format=yuv420p[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', silent]);
  // ambient bed (scripts/make-ambient.js), faded out over the last 1.5s
  const bed = path.join(__dirname, '..', '..', 'public', 'video', 'dentist-aesthetic', 'ambient.wav');
  if (!fs.existsSync(bed)) execFileSync('node', ['scripts/make-ambient.js', String(Math.ceil(total) + 2)], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, OUT: 'video/dentist-aesthetic/ambient.wav' } });
  const music = path.join(OUT, 'dentist-aesthetic-music.mp4');
  ff(['-i', silent, '-i', bed, '-filter_complex', `[1:a]atrim=0:${total.toFixed(2)},afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5,volume=0.9[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', music]);
  console.log('silent:', silent, '\nmusic:', music, total.toFixed(1) + 's');
})().catch(e => { console.error(e.message); process.exit(1); });
