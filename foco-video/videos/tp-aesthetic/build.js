// Builds the aesthetic task-paralysis short (1080x1920, ~20s): Pexels b-roll + lowercase text overlays in the TikTok safe zone.
// Output: out/tp-aesthetic-silent.mp4 (for a TikTok in-app sound) and out/tp-aesthetic-music.mp4 (original ambient bed).
const fs = require('fs'), path = require('path'), https = require('https');
const { execFileSync } = require('child_process'); const FF = require('ffmpeg-static');
const cands = JSON.parse(fs.readFileSync('work/cands.json', 'utf8'));
const OUT = path.join(__dirname, '..', '..', 'out'); fs.mkdirSync(OUT, { recursive: true });
const ff = a => execFileSync(FF, ['-y', '-loglevel', 'error', ...a]);
const getBuf = u => new Promise((res, rej) => https.get(u, x => { if (x.statusCode >= 300 && x.headers.location) return getBuf(x.headers.location).then(res, rej); const c = []; x.on('data', d => c.push(d)); x.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
const SC = [ // scene, pick, clip start (s), duration (s), text lines (each shown for the whole scene unless split)
  { id: 'desk', pick: 3, ss: 1.0, d: 3.8, text: ['the cruelest part of', 'adhd task paralysis'] },
  { id: 'kitchen', pick: 4, ss: 2.0, d: 4.0, text: ['is knowing exactly', 'what needs to happen'] },
  { id: 'bed', pick: 3, ss: 1.0, d: 3.6, text: ['caring about it', 'deeply'] },
  { id: 'stare', pick: 2, ss: 1.5, d: 4.0, text: ['and still not being able', 'to make yourself start'] },
  { id: 'coffee', pick: 2, ss: 0.5, d: 5.2, text: ["it's not laziness.", 'it is the gap between', 'knowing and doing.'] },
];
const FONT = 'work/font.ttf';
(async () => {
  const parts = [];
  for (let i = 0; i < SC.length; i++) {
    const s = SC[i]; const c = cands[s.id].find(x => x.pick === s.pick);
    const raw = path.join('work', `${s.id}.mp4`);
    if (!fs.existsSync(raw)) fs.writeFileSync(raw, await getBuf(c.url));
    fs.writeFileSync(path.join('work', `t${i}.txt`), s.text.join('\n'));
    const seg = path.join('work', `seg${i}.mp4`);
    // scale/crop to 1080x1920, gentle warm grade, slow push-in, text centered at ~40% height (safe zone 14-75%)
    const vf = [
      'scale=1080:1920:force_original_aspect_ratio=increase', 'crop=1080:1920', 'setsar=1', 'fps=30',
      `zoompan=z='min(1.0+0.0007*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`,
      'eq=saturation=0.92:contrast=1.03:brightness=0.01', 'colorbalance=rs=0.03:gs=0.01:bs=-0.03',
      ...s.text.map((line, k) => { fs.writeFileSync(path.join('work', `t${i}-${k}.txt`), line); const lh = 78; const y0 = `h*0.40-${(s.text.length * lh) / 2}+${k * lh}`; return `drawtext=fontfile='${FONT}':textfile='work/t${i}-${k}.txt':fontsize=60:fontcolor=white:borderw=2:bordercolor=black@0.28:x=(w-text_w)/2:y=${y0}:shadowcolor=black@0.6:shadowx=0:shadowy=3:alpha='if(lt(t,0.35),t/0.35,1)'`; }),
    ].join(',');
    ff(['-ss', String(s.ss), '-t', String(s.d), '-i', raw, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', seg]);
    parts.push(seg);
  }
  // crossfade the scenes (0.35s)
  let filter = '', last = '[0:v]', offset = 0; const X = 0.35;
  for (let i = 1; i < parts.length; i++) { offset += SC[i - 1].d - X; filter += `${last}[${i}:v]xfade=transition=fade:duration=${X}:offset=${offset.toFixed(2)}[x${i}];`; last = `[x${i}]`; }
  const total = SC.reduce((a, s) => a + s.d, 0) - X * (SC.length - 1);
  const silent = path.join(OUT, 'tp-aesthetic-silent.mp4');
  ff([...parts.flatMap(p => ['-i', p]), '-filter_complex', filter.slice(0, -1).replace(/\[x\d+\]$/, '') + ',format=yuv420p[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', silent]);
  console.log('silent:', silent, total.toFixed(1) + 's');
  fs.writeFileSync('work/total.txt', total.toFixed(2));
})().catch(e => { console.error(e.message); process.exit(1); });
