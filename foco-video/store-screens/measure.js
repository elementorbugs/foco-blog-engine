// Prints where the person sits in each cut-out (alpha bbox per row band), so slides can place faces exactly.
// usage: node store-screens/measure.js rd-stuck rd-phone ...   (reads assets/<name>-cut.png)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FF = require(path.join(__dirname, '..', 'node_modules', 'ffmpeg-static'));
const w = 180, h = 270;
for (const f of process.argv.slice(2)) {
  const src = path.join(__dirname, 'assets', f + '-cut.png');
  const b = execFileSync(FF, ['-loglevel', 'error', '-i', src, '-vf', `format=rgba,alphaextract,scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], { maxBuffer: 1 << 26 });
  const span = y => { let a = -1, z = -1; for (let x = 0; x < w; x++) if (b[y * w + x] > 200) { if (a < 0) a = x; z = x; } return [a, z]; };
  let top = 0; while (top < h && span(top)[0] < 0) top++;
  // source px = fraction * source size (sizes are 1800x2700 for these cut-outs)
  const sx = 1800 / w, sy = 2700 / h;
  console.log(f, 'top', Math.round(top * sy), [6, 14, 24, 40, 60].map(d => { const y = Math.min(h - 1, top + d), [a, z] = span(y); return `y${Math.round(y * sy)}:${Math.round(a * sx)}-${Math.round(z * sx)}`; }).join('  '));
}
