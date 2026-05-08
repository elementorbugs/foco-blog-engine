// Ensures every timer page links to all 5 sibling timer pages in its Related articles list.
// Idempotent — only adds missing links.

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

const TIMERS = [
  { id: 723, slug: '5-minute-timer-adhd',  label: '5-Minute Timer for ADHD' },
  { id: 699, slug: '10-minute-timer-adhd', label: '10-Minute Timer for ADHD' },
  { id: 728, slug: '15-minute-timer-adhd', label: '15-Minute Timer for ADHD' },
  { id: 737, slug: '20-minute-timer-adhd', label: '20-Minute Timer for ADHD' },
  { id: 742, slug: '25-minute-timer-adhd', label: '25-Minute Timer for ADHD' },
  { id: 747, slug: '30-minute-timer-adhd', label: '30-Minute Timer for ADHD' },
];

(async () => {
  for (const src of TIMERS) {
    console.log(`\n→ ${src.id} ${src.slug}`);
    const r = await req('GET', `/wp-json/wp/v2/posts/${src.id}?context=edit&_fields=content`);
    if (r.s !== 200) { console.log('  fetch fail', r.s); continue; }
    let html = r.b.content.raw;
    const adds = [];

    // Collect missing sibling links
    for (const tgt of TIMERS) {
      if (tgt.slug === src.slug) continue;
      const url = `https://www.tryfoco.com/${tgt.slug}/`;
      if (!html.includes(`href="${url}"`)) {
        adds.push(`<li><a href="${url}">${tgt.label}</a></li>`);
        console.log(`  + missing: ${tgt.slug}`);
      }
    }

    if (adds.length === 0) { console.log('  all 5 siblings already linked'); continue; }

    // Find Related articles <h2> and append missing items to its <ul>
    const relIdx = html.indexOf('<h2>Related articles</h2>');
    if (relIdx === -1) { console.log('  ⚠ no <h2>Related articles</h2> — abort'); continue; }
    const ulCloseIdx = html.indexOf('</ul>', relIdx);
    if (ulCloseIdx === -1) { console.log('  ⚠ no </ul> after Related — abort'); continue; }

    // Insert missing <li>s before </ul>
    html = html.slice(0, ulCloseIdx) + adds.join('\n') + '\n' + html.slice(ulCloseIdx);

    const upd = await req('POST', `/wp-json/wp/v2/posts/${src.id}`, { content: html });
    console.log(`  ${adds.length} added — push: ${upd.s === 200 ? '✓' : '✗ ' + upd.s}`);
  }
})();
