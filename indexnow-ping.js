// Pings IndexNow via Rank Math's submitUrls endpoint for any post(s) that are published.
// Use:
//   node indexnow-ping.js                    — pings all 6 timer pages (only those with status=publish)
//   node indexnow-ping.js 699 723 728        — pings specific post IDs

const fs = require('fs');
const https = require('https');

const c = fs.readFileSync('.env', 'utf8');
const e = (k) => { const m = c.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; };
const auth = Buffer.from(e('WP_USER') + ':' + e('WP_APP_PASSWORD')).toString('base64');
const HOST = e('WP_HOST');

function req(method, path, body) {
  return new Promise((res, rej) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, port: 443, path, method, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, response => {
      let d = ''; response.on('data', x => d += x);
      response.on('end', () => { try { res({ s: response.statusCode, b: JSON.parse(d) }); } catch { res({ s: response.statusCode, b: d }); } });
    });
    r.on('error', rej);
    if (payload) r.write(payload);
    r.end();
  });
}

const DEFAULT_IDS = [699, 723, 728, 737, 742, 747]; // all 6 timer pages

(async () => {
  const argIds = process.argv.slice(2).map(Number).filter(Boolean);
  const ids = argIds.length > 0 ? argIds : DEFAULT_IDS;
  console.log(`=== IndexNow ping for ${ids.length} post(s) ===\n`);

  const liveUrls = [];
  for (const id of ids) {
    const r = await req('GET', `/wp-json/wp/v2/posts/${id}?_fields=status,link,slug`);
    if (r.s !== 200) { console.log(`${id}: fetch fail ${r.s}`); continue; }
    const p = r.b;
    if (p.status !== 'publish') {
      console.log(`${id} ${p.slug}: status=${p.status} — skipping (only publish posts get IndexNow)`);
      continue;
    }
    console.log(`${id} ${p.slug}: status=publish ✓ queueing ${p.link}`);
    liveUrls.push(p.link);
  }

  if (liveUrls.length === 0) {
    console.log('\nNothing to submit.');
    return;
  }

  console.log(`\nSubmitting ${liveUrls.length} URL(s) to IndexNow via Rank Math (one at a time)...`);
  for (const url of liveUrls) {
    const submit = await req('POST', '/wp-json/rankmath/v1/in/submitUrls', { urls: url });
    if (submit.s === 200 && submit.b && submit.b.success) {
      console.log(`  ✓ ${url}`);
    } else {
      console.log(`  ⚠ ${url} → ${submit.s}: ${JSON.stringify(submit.b).slice(0, 200)}`);
    }
  }
})();
