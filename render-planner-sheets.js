// Renders the printable planner sheets to PDF + preview PNG.
// Usage: node render-planner-sheets.js
const { chromium } = require('playwright');
const path = require('path');

const jobs = [
  { html: 'printable/adhd-weekly-planner-template.html', pdf: 'printable/adhd-weekly-planner-template.pdf', png: 'printable/page-weekly-template.png' },
  { html: 'printable/adhd-planner-template.html',        pdf: null,                                         png: 'printable/page-daily-template-v2.png' },
];

(async () => {
  const b = await chromium.launch();
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
    await p.goto('file:///' + path.resolve(__dirname, j.html).split(path.sep).join('/'));
    await p.waitForTimeout(400);
    if (j.pdf) {
      await p.pdf({ path: path.resolve(__dirname, j.pdf), format: 'Letter', printBackground: true });
      console.log('PDF  ' + j.pdf);
    }
    await p.screenshot({ path: path.resolve(__dirname, j.png) });
    console.log('PNG  ' + j.png);
    await p.close();
  }
  await b.close();
})();
