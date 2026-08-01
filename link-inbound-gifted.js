// /gifted-and-adhd/ went live with 0 inbound internal links. Adds it to the
// Related articles list of the four published posts whose audience overlaps.
//   node link-inbound-gifted.js         dry run
//   node link-inbound-gifted.js --live
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const URL = 'https://www.tryfoco.com/gifted-and-adhd/';
const LI = '<li><a href="' + URL + '">Gifted and ADHD: Why Being Smart Hides It for Years</a></li>';
const IDS = [2373, 463, 834, 371];
const LIVE = process.argv.includes('--live');

const get = async id => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return { c: p.content.raw !== undefined ? p.content.raw : p.content.rendered, slug: p.slug };
};

(async () => {
  let ok = 0, skip = 0, fail = 0;
  for (const id of IDS) {
    const { c, slug } = await get(id);
    if (c.includes('gifted-and-adhd')) { console.log('SKIP  /' + slug + '/  already links'); skip++; continue; }

    // Find the Related articles heading, then the first <ul> after it.
    const h = c.search(/<h2[^>]*>\s*Related [Aa]rticles?\s*<\/h2>/);
    if (h < 0) { console.error('FAIL  /' + slug + '/  no Related articles heading'); fail++; continue; }
    const ul = c.indexOf('<ul', h);
    const close = c.indexOf('</ul>', ul);
    if (ul < 0 || close < 0) { console.error('FAIL  /' + slug + '/  no list after heading'); fail++; continue; }

    const next = c.slice(0, close) + LI + '\n' + c.slice(close);
    if (!LIVE) { console.log('WOULD  /' + slug + '/  (#' + id + ')'); ok++; continue; }

    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: next }),
      });
      if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
      await sleep(2500);
      if ((await get(id)).c.includes('gifted-and-adhd')) done = true;
      else console.error('  not persisted, retry ' + a);
    }
    if (done) { console.log('OK    /' + slug + '/'); ok++; }
    else { console.error('FAIL  /' + slug + '/  did not persist'); fail++; }
  }
  console.log('\n' + ok + (LIVE ? ' linked' : ' would link') + ', ' + skip + ' skipped, ' + fail + ' failed');
  if (!LIVE) console.log('Re-run with --live to apply.');
})();
