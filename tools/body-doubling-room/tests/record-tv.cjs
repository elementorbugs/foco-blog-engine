// Records the ?tv stage in real time for a YouTube video.
// Every screencast frame goes to disk with its timestamp, then ffmpeg builds a 30fps mp4 at the end
// (piping JPEGs straight into ffmpeg died mid-recording on one bad frame).
// node tests/record-tv.cjs <seconds> <out.mp4>
const { chromium } = require('../../../node_modules/playwright');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const secs = Number(process.argv[2] || 60);
const out = path.resolve(process.argv[3] || 'tv-test.mp4');
const dir = out.replace(/\.mp4$/, '') + '-frames';
(async () => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=1'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  // hold the seat until the stage has painted, then start recording the moment the clock starts
  await p.goto('http://localhost:5178/?tv&hold=4000' + (process.argv[4] || ''), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__tvStart, null, { polling: 10, timeout: 20000 });
  const cdp = await p.context().newCDPSession(p);
  const index = [];
  let stopped = false;
  cdp.on('Page.screencastFrame', async (f) => {
    if (stopped) return;
    const name = 'f' + String(index.length).padStart(6, '0') + '.jpg';
    fs.writeFileSync(path.join(dir, name), Buffer.from(f.data, 'base64'));
    index.push([name, Date.now()]);
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const t0 = Date.now();
  const iv = setInterval(() => console.log(`${Math.round((Date.now() - t0) / 1000)}s ${index.length} frames on disk`), 30000);
  await new Promise(r => setTimeout(r, secs * 1000));
  stopped = true;
  clearInterval(iv);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await b.close();
  // concat list with real frame durations, trimmed to exactly secs
  const end = t0 + secs * 1000;
  let list = '';
  index.forEach(([name, t], i) => {
    const next = i + 1 < index.length ? index[i + 1][1] : end;
    list += `file '${name}'\nduration ${((Math.min(next, end) - Math.max(t, t0)) / 1000).toFixed(4)}\n`;
  });
  list += `file '${index[index.length - 1][0]}'\n`;
  fs.writeFileSync(path.join(dir, 'list.txt'), list);
  console.log(`captured ${index.length} frames, encoding...`);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'),
    '-vf', 'fps=30,format=yuv420p', '-t', String(secs), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', out], { stdio: 'inherit' });
  console.log(r.status === 0 ? `done -> ${out}` : 'ENCODE FAILED, frames kept in ' + dir);
})();
