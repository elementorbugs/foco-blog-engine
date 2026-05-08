// (1) Add NIMH citation to 452 references
// (2) Move 367 to trash (reversible — sits in trash 30 days)
// Both reversible. No force-delete.

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

const NIMH_LI = '<li><a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" target="_blank" rel="noopener">National Institute of Mental Health. Attention-Deficit/Hyperactivity Disorder.</a></li>';

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE ===');

  // (1) Add NIMH to 452 references
  const r452 = await req('GET', '/wp-json/wp/v2/posts/452?context=edit&_fields=content');
  if (r452.s !== 200) { console.log('452 fetch fail', r452.s); return; }
  let html = r452.b.content.raw;

  if (html.includes('nimh.nih.gov')) {
    console.log('452: NIMH already present — skipping');
  } else {
    // Insert NIMH right before CDC line so list stays grouped
    const cdcMarker = '<li><a href="https://www.cdc.gov/adhd/about/index.html"';
    if (!html.includes(cdcMarker)) {
      console.log('452: CDC anchor not found — aborting NIMH insert');
      return;
    }
    html = html.replace(cdcMarker, NIMH_LI + '\n' + cdcMarker);
    console.log('452: NIMH citation added (before CDC)');
    if (!dryRun) {
      const upd = await req('POST', '/wp-json/wp/v2/posts/452', { content: html });
      console.log('  push:', upd.s === 200 ? '✓' : '✗ ' + upd.s);
    }
  }

  // (2) Move 367 to trash
  if (!dryRun) {
    const t = await req('DELETE', '/wp-json/wp/v2/posts/367');
    console.log('367 → trash:', t.s === 200 ? '✓ (reversible — sitting in trash)' : '✗ ' + t.s);
    if (t.s === 200 && t.b.status) console.log('   status now:', t.b.status);
  } else {
    console.log('367: would move to trash');
  }
})();
