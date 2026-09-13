// One-off render for the ADHD morning routine printable (PDF + preview PNG).
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.resolve(__dirname, 'printable/adhd-morning-routine-checklist.html').split(path.sep).join('/'));
  await p.waitForTimeout(300);
  await p.pdf({ path: path.resolve(__dirname, 'printable/adhd-morning-routine-checklist.pdf'), format: 'Letter', printBackground: true });
  console.log('PDF  printable/adhd-morning-routine-checklist.pdf');
  await p.screenshot({ path: path.resolve(__dirname, 'printable/adhd-morning-routine-checklist.png') });
  console.log('PNG  printable/adhd-morning-routine-checklist.png');
  await p.close();
  await b.close();
})();
