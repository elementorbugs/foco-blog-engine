// Screen-replace compositor: keys a green or white phone screen in a stock clip and warps a FOCO screen recording into it.
// env PRE=<ffmpeg filter> crops/reframes the stock clip before keying (e.g. PRE=crop=720:1280:135:360).
// usage: node composite.js <stock.mp4> <ss> <dur> <rec.mp4> <recSs> <green|white> <out.mp4> [recSpeed] [seedX,seedY]
// Per frame: flood-fill the key colour from the last screen centre, take the 4 extreme corners, smooth them over time,
// then sample the recording through the inverse homography and blend by key strength (fingers/notch stay on top).
const { spawn, execFileSync } = require('child_process'); const FF = require('ffmpeg-static'); const fs = require('fs');
const [stock, ss, dur, rec, recSs, key, out, speed = '1', seedArg] = process.argv.slice(2); // seedArg 'x,y' = a point inside the screen
const W = 1080, H = 1920, FPS = 30, N = Math.round(+dur * FPS);
const RW = 384, RH = 748; // recording cropped below the status bar (red rec dot) and above the REC watermark
const raw = (args, size) => { const buf = execFileSync(FF, ['-loglevel', 'error', ...args, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 2 ** 31 - 1 }); const fr = []; for (let o = 0; o + size <= buf.length; o += size) fr.push(buf.subarray(o, o + size)); return fr; };
const S = raw(['-ss', ss, '-t', dur, '-i', stock, '-vf', `${process.env.PRE ? process.env.PRE + ',' : ''}scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS}`], W * H * 3);
const R = raw(['-ss', recSs, '-t', String(+dur * +speed + 0.5), '-i', rec, '-vf', `crop=384:${RH}:0:52,setpts=PTS/${speed},fps=${FPS}`], RW * RH * 3);
// key strength 0..1
const kf = key === 'green'
  ? (r, g, b) => { const d = g - Math.max(r, b); return d < 12 ? 0 : d > 50 ? 1 : (d - 12) / 38; }
  : (r, g, b) => { const l = (r + g + b) / 3, s = Math.max(r, g, b) - Math.min(r, g, b); const a = l < 120 ? 0 : l > 180 ? 1 : (l - 120) / 60; return s > 45 ? 0 : a; };
// homography: unit square (u,v) -> quad; we need quad -> (u,v), so solve for the forward map then invert numerically
function homog(q) { // q = [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] TL,TR,BR,BL ; returns 3x3 mapping (u,v,1)->(x,y,w)
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}
function inv(m) { const [a, b, c, d, e, f, g, h, i] = m; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g; const det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det]; }
// pass 1: find corners per frame
const masks = [], cents = []; // per frame: 2 = pixel in the screen component (only these + a 3px rim get replaced, so white backgrounds stay untouched)
let seed = seedArg ? seedArg.split(',').map(Number) : null; const quads = [];
for (let n = 0; n < N; n++) {
  const f = S[Math.min(n, S.length - 1)];
  if (!seed) { let best = 0; for (let y = 200; y < H - 200; y += 8) for (let x = 100; x < W - 100; x += 8) { const p = (y * W + x) * 3; if (kf(f[p], f[p + 1], f[p + 2]) > 0.9) { best++; if (!seed || Math.random() < 1 / best) seed = [x, y]; } } }
  const seen = new Uint8Array(W * H), st = [seed[1] * W + seed[0]]; let tl = 1e9, br = -1e9, tr = -1e9, bl = 1e9, TL, BR, TR, BL, sx = 0, sy = 0, cnt = 0;
  while (st.length) { const i = st.pop(); if (seen[i]) continue; seen[i] = 1; const p = i * 3; if (kf(f[p], f[p + 1], f[p + 2]) < 0.5) continue; seen[i] = 2;
    const x = i % W, y = (i / W) | 0; sx += x; sy += y; cnt++;
    if (x + y < tl) { tl = x + y; TL = [x, y]; } if (x + y > br) { br = x + y; BR = [x, y]; } if (x - y > tr) { tr = x - y; TR = [x, y]; } if (x - y < bl) { bl = x - y; BL = [x, y]; }
    if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (y > 0) st.push(i - W); if (y < H - 1) st.push(i + W); }
  if (cnt < 2000) { quads.push(quads[quads.length - 1]); masks.push(masks[masks.length - 1]); cents.push(cents[cents.length - 1]); continue; }
  masks.push(seen);
  seed = [Math.round(sx / cnt), Math.round(sy / cnt)];
  // rounded screen corners pull the extremes inward along the diagonal; push them back out from the centre
  const c = [sx / cnt, sy / cnt]; cents.push(c); quads.push([TL, TR, BR, BL].map(([x, y]) => [c[0] + (x - c[0]) * 1.025, c[1] + (y - c[1]) * 1.012]));
}
const sm = quads.map((_, n) => [0, 1, 2, 3].map(k => [0, 1].map(j => { let s = 0, c = 0; for (let d = -3; d <= 3; d++) { const q = quads[n + d]; if (q) { s += q[k][j]; c++; } } return s / c; })));
// LOCK=1 (phone and camera still): one fixed quad + mask for every frame (median corners, frame-0 mask) so the screen can't jitter
if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify({ quads, cents }));
// TRACK=1 (camera drifts, phone rigid): fixed median shape around the screen centroid, which is averaged over thousands
// of pixels so it is sub-pixel stable; the per-corner extremes are only a few px accurate and make the content wobble
if (process.env.TRACK) { const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
  // shape around the centroid, gaussian-smoothed (sigma 8 frames): slow rotation/scale survives, corner noise does not
  const rel = quads.map((Q, n) => Q.map(([x, y]) => [x - cents[n][0], y - cents[n][1]]));
  const shapeAt = n => [0, 1, 2, 3].map(k => [0, 1].map(j => { let a = 0, w = 0; for (let d = -24; d <= 24; d++) { const v = rel[n + d]; if (v) { const g = Math.exp(-d * d / 128); a += v[k][j] * g; w += g; } } return a / w; }));
  const cs = cents.map((_, n) => [0, 1].map(j => { let a = 0, c = 0; for (let d = -2; d <= 2; d++) { const v = cents[n + d]; if (v) { a += v[j]; c++; } } return a / c; }));
  for (let n = 0; n < N; n++) sm[n] = shapeAt(n).map(([dx, dy]) => [cs[n][0] + dx, cs[n][1] + dy]); }
if (process.env.LOCK) { const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1]; const q = [0, 1, 2, 3].map(k => [0, 1].map(j => med(quads.filter(Boolean).map(Q => Q[k][j]))));
  const spread = [0, 1, 2, 3].map(k => [0, 1].map(j => { const v = quads.filter(Boolean).map(Q => Q[k][j]); return (Math.max(...v) - Math.min(...v)).toFixed(1); }).join('/')); console.log('corner spread px (x/y):', spread.join('  '));
  for (let n = 0; n < N; n++) { sm[n] = q; masks[n] = masks[0]; } }
// pass 2: render
const enc = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
(async () => {
  for (let n = 0; n < N; n++) {
    const f = Buffer.from(S[Math.min(n, S.length - 1)]), r = R[Math.min(n, R.length - 1)], q = sm[n], Mi = inv(homog(q));
    const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 30), x1 = Math.min(W - 1, Math.ceil(Math.max(...xs)) + 30), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 20), y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)) + 20);
    // dilate the component mask by 3px (separable max) inside the bbox
    const m0 = masks[n], bw = x1 - x0 + 1, bh = y1 - y0 + 1, hm = new Uint8Array(bw * bh), dm = new Uint8Array(bw * bh), RD = 3;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { for (let d = -RD; d <= RD; d++) { const xx = x + x0 + d; if (xx >= 0 && xx < W && m0[(y + y0) * W + xx] === 2) { hm[y * bw + x] = 1; break; } } }
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { for (let d = -RD; d <= RD; d++) { const yy = y + d; if (yy >= 0 && yy < bh && hm[yy * bw + x]) { dm[y * bw + x] = 1; break; } } }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!dm[(y - y0) * bw + (x - x0)]) continue;
      const p = (y * W + x) * 3; let a = kf(f[p], f[p + 1], f[p + 2]); if (key === 'green') { const m = Math.max(f[p], f[p + 2]); if (f[p + 1] > m) f[p + 1] = m; } if (!a) continue;
      const w = Mi[6] * x + Mi[7] * y + Mi[8], u = (Mi[0] * x + Mi[1] * y + Mi[2]) / w, v = (Mi[3] * x + Mi[4] * y + Mi[5]) / w;
      if (u < -0.08 || u > 1.08 || v < -0.04 || v > 1.04) continue; // edge-clamped sampling covers the anti-aliased rim
      const fx = Math.min(Math.max(u, 0), 1) * (RW - 1), fy = Math.min(Math.max(v, 0), 1) * (RH - 1), ix = Math.min(fx | 0, RW - 2), iy = Math.min(fy | 0, RH - 2), ax = fx - ix, ay = fy - iy;
      for (let k = 0; k < 3; k++) {
        const o = (iy * RW + ix) * 3 + k; const s = (r[o] * (1 - ax) + r[o + 3] * ax) * (1 - ay) + (r[o + RW * 3] * (1 - ax) + r[o + RW * 3 + 3] * ax) * ay;
        f[p + k] = Math.round(f[p + k] * (1 - a) + s * a);
      }
    }
    if (!enc.stdin.write(f)) await new Promise(r => enc.stdin.once('drain', r));
  }
  enc.stdin.end(); enc.on('close', c => console.log(out, c === 0 ? 'ok' : 'FAIL', N + ' frames', 'corners f0', JSON.stringify(sm[0].map(p => p.map(Math.round)))));
})();
