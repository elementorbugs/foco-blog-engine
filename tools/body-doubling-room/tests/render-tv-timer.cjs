// Renders the ?tv timer layer (clock, phase line, ring) as transparent PNGs, one per second,
// on a simulated clock, to lay over looped background clips. node tests/render-tv-timer.cjs <seconds> <outDir>
const { chromium } = require('../../../node_modules/playwright');
const fs = require('fs');
const secs = Number(process.argv[2] || 3600);
const dir = process.argv[3];
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=1'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.clock.install({ time: new Date('2026-10-26T09:00:00Z') });
  await p.clock.pauseAt(new Date('2026-10-26T09:00:10Z'));
  await p.goto('http://localhost:5178/?tv&layer=fg&hold=50', { waitUntil: 'load' });
  for (let i = 0; i < 50 && !(await p.evaluate(() => window.__tvStart)); i++) await p.clock.runFor(100);
  // frames sit mid-second, so frame s reads 25:00 minus s
  await p.clock.runFor(500);
  const box = await p.locator('#ring-wrap').boundingBox();
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
  fs.writeFileSync(dir + '/clip.json', JSON.stringify(clip));
  for (let s = 0; s < secs; s++) {
    await p.clock.runFor(s === 0 ? 0 : 1000);
    await p.screenshot({ path: `${dir}/t${String(s).padStart(4, '0')}.png`, clip, omitBackground: true });
    if (s % 300 === 0) console.log(s + 's', await p.evaluate(() => document.getElementById('clock').textContent + ' | ' + document.getElementById('phase').textContent));
  }
  await b.close();
  console.log('done', JSON.stringify(clip));
})();
