// One-off render for the ADHD bedtime routine printable (PDF + preview PNG).
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.resolve(__dirname, 'printable/adhd-bedtime-routine-checklist.html').split(path.sep).join('/'));
  await p.waitForTimeout(300);
  await p.pdf({ path: path.resolve(__dirname, 'printable/adhd-bedtime-routine-checklist.pdf'), format: 'Letter', printBackground: true });
  console.log('PDF  printable/adhd-bedtime-routine-checklist.pdf');
  await p.screenshot({ path: path.resolve(__dirname, 'printable/adhd-bedtime-routine-checklist.png') });
  console.log('PNG  printable/adhd-bedtime-routine-checklist.png');
  await p.close();
  await b.close();
})();
