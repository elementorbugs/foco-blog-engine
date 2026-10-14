// Seam check on the FINAL files: for each pair of neighbouring slides, finds the light stream's height in the last
// column of slide i and the first column of slide i+1 (brightest pixel in the bottom 20%), prints the gap, and writes
// a zoomed proof image per seam plus the full stitched strip. usage: node store-screens/check-seams.js [Apple|Android]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FF = require(path.join(__dirname, '..', 'node_modules', 'ffmpeg-static'));
const dir = path.join(__dirname, process.argv[2] || 'Apple');
const files = fs.readdirSync(dir).filter(f => /^(FINAL-)?0\d.*\.png$/.test(f)).sort().map(f => path.join(dir, f));
const tag = (process.argv[2] || 'Apple').replace(/[\\/]/g, '-');
const proof = path.join(__dirname, 'work', 'seam-check'); fs.mkdirSync(proof, { recursive: true });
const size = f => execFileSync(FF, ['-i', f], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] }).toString();
const dims = f => { try { size(f); } catch (e) { const m = String(e.stderr).match(/(\d{3,4})x(\d{3,4})/); return [+m[1], +m[2]]; } };
const col = (f, x, w, h) => { // one pixel column, bottom 20%, as luma
  const y0 = Math.round(h * .8), b = execFileSync(FF, ['-loglevel', 'error', '-i', f, '-vf', `crop=1:${h - y0}:${x}:${y0}`, '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1']);
  let best = 0, by = 0; for (let y = 0; y < b.length; y++) if (b[y] > best) { best = b[y]; by = y; } return [y0 + by, best];
};
const [w, h] = dims(files[0]); let worst = 0;
for (let i = 0; i < files.length - 1; i++) {
  const [ya, la] = col(files[i], w - 1, w, h), [yb, lb] = col(files[i + 1], 0, w, h), gap = Math.abs(ya - yb); worst = Math.max(worst, gap);
  console.log(`seam ${i + 1}|${i + 2}: line y ${ya} vs ${yb}  gap ${gap}px  brightness ${la}/${lb}`);
  const cw = Math.round(w * .18), ch = Math.round(h * .16), cy = Math.max(0, Math.min(h - ch, ya - ch / 2));
  execFileSync(FF, ['-loglevel', 'error', '-y', '-i', files[i], '-i', files[i + 1], '-filter_complex', `[0]crop=${cw}:${ch}:${w - cw}:${cy}[a];[1]crop=${cw}:${ch}:0:${cy}[b];[a][b]hstack,scale=-1:420`, path.join(proof, `${tag}-seam-${i + 1}-${i + 2}.png`)]);
}
execFileSync(FF, ['-loglevel', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', `hstack=${files.length},scale=4000:-1`, path.join(proof, `${tag}-ALL-stitched.jpg`)]);
console.log(`${w}x${h}  worst gap ${worst}px  ->`, proof);
