// Replaces the focus-timer <!-- wp:html --> block in every timer post with the
// current build from timer-widget.js, in WordPress AND in posts-new/.
//
//   node apply-timer-design.js            # dry run (writes nothing)
//   node apply-timer-design.js --live     # push to WP + rewrite local drafts
//
// Idempotent: the block is regenerated from scratch each run.

const fs = require('fs');
const https = require('https');
const path = require('path');
const { buildTimer } = require('./timer-widget');

const LIVE = process.argv.includes('--live');

const c = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const e = (k) => { const m = c.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; };
const auth = Buffer.from(e('WP_USER') + ':' + e('WP_APP_PASSWORD')).toString('base64');
const HOST = e('WP_HOST');

function req(method, p, body) {
  return new Promise((res, rej) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, port: 443, path: p, method, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' } };
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

const POSTS = [
  { id: 723, minutes: 5 },
  { id: 699, minutes: 10 },
  { id: 728, minutes: 15 },
  { id: 737, minutes: 20 },
  { id: 742, minutes: 25 },
  { id: 747, minutes: 30 },
];

// Swaps the whole wp:html block that contains the timer. Returns null if the
// block boundaries can't be located, so we never push a half-replaced body.
function swapBlock(html, block) {
  const at = html.indexOf('foco-timer-wrap');
  if (at === -1) return null;
  const start = html.lastIndexOf('<!-- wp:html -->', at);
  const endTag = '<!-- /wp:html -->';
  const end = html.indexOf(endTag, at);
  if (start === -1 || end === -1) return null;
  const rest = html.slice(end + endTag.length);
  if (rest.includes('foco-timer-wrap')) return null; // more than one block, bail
  return html.slice(0, start) + block + rest;
}

(async () => {
  console.log(LIVE ? 'MODE: live\n' : 'MODE: dry run (pass --live to write)\n');

  for (const p of POSTS) {
    const block = buildTimer(p.minutes);
    console.log(`→ ${p.minutes}-min  post ${p.id}  (new block ${block.length} chars)`);

    // ---- WordPress ----
    const r = await req('GET', `/wp-json/wp/v2/posts/${p.id}?context=edit&_fields=content,slug`);
    if (r.s !== 200) { console.log(`   WP fetch failed: ${r.s}`); continue; }
    const before = r.b.content.raw;
    const after = swapBlock(before, block);
    if (!after) { console.log('   WP: could not locate a single timer block, SKIPPED'); }
    else if (after === before) { console.log('   WP: already current'); }
    else if (!LIVE) { console.log(`   WP: would update (${before.length} -> ${after.length} chars)`); }
    else {
      const u = await req('POST', `/wp-json/wp/v2/posts/${p.id}`, { content: after });
      console.log(`   WP: ${u.s === 200 ? 'updated ✓' : 'FAILED ' + u.s}`);
    }

    // ---- local draft ----
    const file = path.join(__dirname, 'posts-new', `post-${p.minutes}-minute-timer-adhd.html`);
    if (!fs.existsSync(file)) { console.log('   local: no file'); continue; }
    const lBefore = fs.readFileSync(file, 'utf8');
    const lAfter = swapBlock(lBefore, block);
    if (!lAfter) console.log('   local: could not locate a single timer block, SKIPPED');
    else if (lAfter === lBefore) console.log('   local: already current');
    else if (!LIVE) console.log('   local: would rewrite');
    else { fs.writeFileSync(file, lAfter); console.log('   local: rewritten ✓'); }
  }

  console.log('\nAfter a live run: purge Varnish on Cloudways, then `node indexnow-ping.js 723 699 728 737 742 747`.');
})();
