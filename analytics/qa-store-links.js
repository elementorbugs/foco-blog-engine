// QA for FOCO app-store links on tryfoco.com (install attribution).
//   node analytics/qa-store-links.js              crawl every URL in the sitemaps
//   node analytics/qa-store-links.js /get-foco/   check only the given paths
// For each page (loaded in a real browser, after JS ran) it checks:
//   1. every Google Play link for com.adiben.foco carries referrer=utm_source=tryfoco&utm_medium=..&utm_campaign=..
//      (the post bar uses utm_medium=post_bar without a campaign, which is fine)
//   2. App Store links for FOCO use the storefront-neutral form (no /us/, /il/ ... prefix), per CLAUDE.md
// Plus two site-wide tests:
//   3. a link injected AFTER page load gets the referrer at click time (covers links added later, e.g. by tools)
//   4. a referrer Play URL still opens the FOCO listing (HTTP 200)
// Exit code 1 when anything fails, so it can run in a routine or before a deploy.
const { chromium } = require('playwright');

const SITE = 'https://www.tryfoco.com';
const PKG = 'com.adiben.foco';
const APPLE_ID = '6762489184';
const CONCURRENCY = 4;

async function sitemapUrls() {
  const idx = await (await fetch(SITE + '/sitemap_index.xml')).text();
  const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const urls = [];
  for (const m of maps) urls.push(...[...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]));
  return [...new Set(urls)];
}

function checkPlay(href) {
  const u = new URL(href, SITE);
  if (u.searchParams.get('id') !== PKG) return null; // another app, not ours
  const ref = u.searchParams.get('referrer');
  if (!ref) return 'missing referrer';
  const r = new URLSearchParams(ref);
  if (r.get('utm_source') !== 'tryfoco') return 'utm_source is ' + r.get('utm_source');
  if (!r.get('utm_medium')) return 'no utm_medium';
  if (r.get('utm_medium') !== 'post_bar' && !r.get('utm_campaign')) return 'no utm_campaign';
  return 'ok:' + r.get('utm_medium') + (r.get('utm_campaign') ? '/' + r.get('utm_campaign') : '');
}

function checkApple(href) {
  if (!href.includes('id' + APPLE_ID)) return null;
  return /apps\.apple\.com\/[a-z]{2}\//.test(href) ? 'country-pinned storefront' : 'ok';
}

(async () => {
  const only = process.argv.slice(2);
  const urls = only.length ? only.map(p => SITE + p) : await sitemapUrls();
  console.log(`Checking ${urls.length} pages...\n`);
  const browser = await chromium.launch();
  const failures = [], stats = { pages: 0, play: 0, apple: 0, noLinks: 0 }, mediums = {};

  const queue = [...urls];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    const page = await browser.newPage();
    while (queue.length) {
      const url = queue.shift();
      try {
        await page.goto(url + (url.includes('?') ? '&' : '?') + 'qa=' + Date.now(), { waitUntil: 'load', timeout: 45000 });
        const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
        stats.pages++;
        let ours = 0;
        for (const h of hrefs) {
          if (h.includes('play.google.com')) {
            const res = checkPlay(h);
            if (res === null) continue;
            ours++; stats.play++;
            if (res.startsWith('ok:')) mediums[res.slice(3)] = (mediums[res.slice(3)] || 0) + 1;
            else failures.push({ url, problem: 'Play: ' + res, href: h });
          } else if (h.includes('apps.apple.com')) {
            const res = checkApple(h);
            if (res === null) continue;
            ours++; stats.apple++;
            if (res !== 'ok') failures.push({ url, problem: 'App Store: ' + res, href: h });
          }
        }
        if (!ours) stats.noLinks++;
      } catch (e) {
        failures.push({ url, problem: 'page failed to load: ' + e.message.split('\n')[0] });
      }
    }
    await page.close();
  }));

  // 3. links added after load get the referrer at click time
  const page = await browser.newPage();
  await page.goto(SITE + '/?qa=' + Date.now(), { waitUntil: 'load' });
  const clicked = await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = 'https://play.google.com/store/apps/details?id=com.adiben.foco';
    a.textContent = 'qa';
    document.body.appendChild(a);
    let seen = null;
    a.addEventListener('click', e => { e.preventDefault(); seen = a.getAttribute('href'); });
    a.click();
    a.remove();
    return seen;
  });
  const dyn = clicked ? checkPlay(clicked) : 'no click recorded';
  if (!dyn || !dyn.startsWith('ok:')) failures.push({ url: SITE + '/', problem: 'link added after load: ' + dyn, href: clicked });
  console.log('Link added after load  ->', dyn);
  await browser.close();

  // 4. referrer URL still resolves to the listing
  const test = 'https://play.google.com/store/apps/details?id=' + PKG + '&referrer=' + encodeURIComponent('utm_source=tryfoco&utm_medium=site&utm_campaign=qa');
  const r = await fetch(test, { redirect: 'follow' });
  console.log('Play URL with referrer ->', r.status);
  if (r.status !== 200) failures.push({ url: test, problem: 'Play listing returned ' + r.status });

  console.log(`\nPages: ${stats.pages}/${urls.length} | FOCO Play links: ${stats.play} | FOCO App Store links: ${stats.apple} | pages with no FOCO store link: ${stats.noLinks}`);
  console.log('Play links by medium/campaign:');
  Object.entries(mediums).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
  if (failures.length) {
    console.log(`\nFAIL: ${failures.length} problem(s)`);
    failures.forEach(f => console.log(`  ${f.url}\n    ${f.problem}${f.href ? '\n    ' + f.href : ''}`));
    process.exit(1);
  }
  console.log('\nPASS: every FOCO store link is attributed.');
})();
