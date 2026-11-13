const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/adhd-app-list.html', { waitUntil: 'networkidle', timeout: 90000 });
  await p.pdf({ path: __dirname + '/foco-adhd-app-list-2026.pdf', preferCSSPageSize: true, printBackground: true });
  await b.close();
})();
