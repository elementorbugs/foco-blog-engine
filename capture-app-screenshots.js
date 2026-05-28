#!/usr/bin/env node
// capture-app-screenshots.js
// Uses Playwright to navigate to each app's marketing site and capture the
// hero / above-the-fold section as a real screenshot. Uploads each to WP
// media and returns the URLs ready to inject into post HTML.
//
// Output: prints a JSON map { appName: { mediaId, sourceUrl, alt } }

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const WP_HOST = env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const APPS = [
  { name: 'goblin-tools',  url: 'https://goblin.tools/',         alt: 'Goblin Tools Magic ToDo task breakdown interface' },
  { name: 'inflow',        url: 'https://www.getinflow.io/',     alt: 'Inflow ADHD coaching app homepage' },
  { name: 'habitica',      url: 'https://habitica.com/',         alt: 'Habitica gamified to-do RPG interface' },
  { name: 'remindher',     url: 'https://remindher.app/',        alt: 'RemindHer family task management app' },
];

function uploadToWp(buffer, filename) {
  return new Promise((res, rej) => {
    const opts = {
      hostname: WP_HOST, port: 443, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: {
        Authorization: 'Basic ' + AUTH,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      },
    };
    const r = https.request(opts, (response) => {
      let d = '';
      response.on('data', (c) => (d += c));
      response.on('end', () => {
        try { res({ status: response.statusCode, body: JSON.parse(d) }); }
        catch { res({ status: response.statusCode, body: d }); }
      });
    });
    r.on('error', rej);
    r.write(buffer);
    r.end();
  });
}

(async () => {
  const outDir = path.join(__dirname, '.audit-cache', 'app-screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const results = {};

  for (const app of APPS) {
    process.stdout.write(`  [${app.name}] navigating ${app.url} ... `);
    const page = await context.newPage();
    try {
      await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Give a bit more time for lazy-loaded hero images
      await page.waitForTimeout(2000);
      // Capture only the visible viewport (hero / above-the-fold)
      const filePath = path.join(outDir, `${app.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      const buf = fs.readFileSync(filePath);
      process.stdout.write(`captured (${(buf.length / 1024).toFixed(0)} KB) ... `);

      const up = await uploadToWp(buf, `${app.name}-website.png`);
      if (up.status !== 201) {
        process.stdout.write(`upload FAIL ${up.status}\n`);
        results[app.name] = { error: 'upload failed', status: up.status };
      } else {
        process.stdout.write(`uploaded #${up.body.id}\n`);
        results[app.name] = { mediaId: up.body.id, sourceUrl: up.body.source_url, alt: app.alt };
      }
    } catch (e) {
      process.stdout.write(`ERR ${e.message}\n`);
      results[app.name] = { error: e.message };
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Also handle FOCO — upload one of the theme's existing ASO screenshots
  const focoSrc = path.join(__dirname, 'wordpress-theme', 'assets', 'images', 'foco_aso_07.png');
  if (fs.existsSync(focoSrc)) {
    process.stdout.write(`  [foco] uploading existing ASO screenshot ... `);
    const buf = fs.readFileSync(focoSrc);
    const up = await uploadToWp(buf, 'foco-app-screenshot.png');
    if (up.status === 201) {
      process.stdout.write(`uploaded #${up.body.id}\n`);
      results.foco = { mediaId: up.body.id, sourceUrl: up.body.source_url, alt: 'FOCO ADHD task initiation app interface' };
    } else {
      process.stdout.write(`upload FAIL ${up.status}\n`);
      results.foco = { error: 'upload failed', status: up.status };
    }
  }

  console.log('\nRESULTS:');
  console.log(JSON.stringify(results, null, 2));
  // Save for the inject step
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(results, null, 2));
  console.log('\nManifest saved to', path.join(outDir, 'manifest.json'));
})();
