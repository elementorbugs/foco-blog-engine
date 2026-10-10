// Fixes FOCO pricing wording that implies the monthly plan has a free trial.
// Fact (Adi, 2026-10-10): only the yearly plan ($59/yr) has the 7-day free trial; monthly ($9/mo) is billed right away.
// Applies exact phrase replacements (most specific first) to live WP posts/pages (GET raw as base, backup, POST)
// and to the matching posts-new/ sources. The homepage (page 4760) is built from homepage-preview/index.html, so it is skipped here.
// Usage: node scripts/fix-trial-claims.js [--live]
const fs = require('fs'), path = require('path'), https = require('https');
const root = path.join(__dirname, '..');
const LIVE = process.argv.includes('--live');
const env = {}; fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
const auth = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const host = env.WP_HOST || 'www.tryfoco.com';
const req = (method, p, body) => new Promise((res, rej) => { const data = body ? JSON.stringify(body) : ''; const r = https.request({ hostname: host, path: p, method, headers: { Authorization: auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res({ status: x.statusCode, data: JSON.parse(d) }); } catch (e) { res({ status: x.statusCode, data: d.slice(0, 200) }); } }); }); r.on('error', rej); r.end(data); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PAIRS = [
  // full sentences
  ['FOCO starts with a 7-day free trial on the App Store and Google Play, then $9/month or $59/year.', 'FOCO is $59/year with a 7-day free trial, or $9/month, on the App Store and Google Play.'],
  ['FOCO offers a 7-day free trial of the full app, then $9/month or $59/year.', "FOCO's yearly plan ($59/year) starts with a 7-day free trial of the full app; monthly is $9/month."],
  ['FOCO starts with a 7-day free trial, then $9/month or $59/year.', 'FOCO is $59/year with a 7-day free trial, or $9/month.'],
  ['The mobile app starts with a 7-day free trial, then $9/month or $59/year.', 'The mobile app is $59/year with a 7-day free trial, or $9/month.'],
  ['It starts with a 7-day free trial, then $9/month or $59/year.', 'It is $59/year with a 7-day free trial, or $9/month.'],
  ['FOCO has a 7-day free trial, then costs $9 a month or $59 a year.', 'FOCO costs $59 a year with a 7-day free trial, or $9 a month.'],
  ['FOCO has a 7-day free trial, then a subscription.', "FOCO's yearly plan has a 7-day free trial."],
  ['FOCO offers a 7-day free trial of the full app.', "FOCO's yearly plan starts with a 7-day free trial of the full app."],
  ['FOCO starts with a 7-day free trial.', "FOCO's yearly plan starts with a 7-day free trial."],
  ['FOCO comes with a 7-day free trial on the App Store and Google Play', "FOCO's yearly plan comes with a 7-day free trial on the App Store and Google Play"],
  ['FOCO is available on the App Store and Google Play, with a 7-day free trial.', 'FOCO is available on the App Store and Google Play, with a 7-day free trial on the yearly plan.'],
  ["FOCO's 7-day free trial lets you test the full app before you pay.", "FOCO's yearly plan has a 7-day free trial, so you can test the full app before you pay."],
  ['and FOCO offers a 7-day free trial.', "and FOCO's yearly plan has a 7-day free trial."],
  // phrases inside sentences
  ['after a 7-day free trial ($9 a month or $59 a year)', '($59 a year with a 7-day free trial, or $9 a month)'],
  ['($9/month or $59/year after a 7-day trial)', '($59/year with a 7-day trial, or $9/month)'],
  ['with a 7-day trial, then $9 a month or $59 a year', 'at $59 a year with a 7-day free trial, or $9 a month'],
  [', after a 7-day free trial.', ', with a 7-day free trial on the yearly plan.'],
  ['Price:</strong> A 7-day free trial, then $9/month or $59/year', 'Price:</strong> $59/year with a 7-day free trial, or $9/month'],
  ['A 7-day free trial, then $9/month or $59/year', '$59/year with a 7-day free trial, or $9/month'],
  ['a 7-day free trial, then $9 a month or $59 a year', '$59 a year with a 7-day free trial, or $9 a month'],
  ['7-day free trial, then $9 a month or $59 a year', '$59 a year with a 7-day free trial, or $9 a month'],
  ['7-day free trial, then $9/month or $59/year', '$59/year with a 7-day free trial, or $9/month'],
  ['7-day trial, then $9/mo or $59/yr', '$59/yr with a 7-day trial, or $9/mo'],
  ['$9/mo or $59/yr after a 7-day free trial', '$59/yr with a 7-day free trial, or $9/mo'],
  ['7-day free trial, then $9/mo', '$59/yr with a 7-day free trial, or $9/mo'],
  ['Paid after the trial', 'Paid (7-day trial on yearly)'],
];

function fixTables(s) {
  // FOCO row in multi-app tables: "No 7-day trial" -> trial is yearly-only
  s = s.replace(/(<tr class="cm-ours">[\s\S]*?)7-day trial<\/td>/g, '$17-day trial on yearly</td>');
  // "Free trial" row in head-to-head tables: FOCO is the last cell
  s = s.replace(/(<tr><th scope="row">Free trial<\/th>(?:<td>[^<]*<\/td>)*?)<td>7 days<\/td><\/tr>/g, (m, a) => /yearly/.test(m.slice(-40)) ? m : a + '<td>7 days, yearly plan only</td></tr>');
  return s;
}
function fix(s) {
  let out = s; const used = [];
  for (const [a, b] of PAIRS) if (out.includes(a)) { out = out.split(a).join(b); used.push(a.slice(0, 50)); }
  const t = fixTables(out); if (t !== out) { used.push('[table cells]'); out = t; }
  return { out, used };
}

(async () => {
  const items = [];
  for (const type of ['posts', 'pages']) for (const status of ['publish', 'draft']) for (let page = 1; page < 10; page++) {
    const r = await req('GET', `/wp-json/wp/v2/${type}?status=${status}&per_page=100&page=${page}&context=edit&_fields=id,slug,status,content`);
    if (!Array.isArray(r.data) || !r.data.length) break; r.data.forEach(p => items.push({ type, ...p })); if (r.data.length < 100) break;
  }
  let changed = 0;
  for (const p of items) {
    if (p.id === 4760 || p.slug === 'home-draft' || p.slug === 'privacy-policy') continue;
    const raw = p.content.raw; const { out, used } = fix(raw);
    if (out === raw) continue;
    changed++; console.log(`${LIVE ? '✓' : '·'} ${p.type}/${p.slug} (${p.id}, ${p.status}): ${used.length} fix(es)`);
    if (LIVE) {
      fs.writeFileSync(path.join(root, '.audit-cache', 'backups', `${p.slug}-${p.id}-pre-trial-fix-${Date.now()}.html`), raw);
      const u = await req('POST', `/wp-json/wp/v2/${p.type}/${p.id}`, { content: out });
      if (u.status !== 200) console.log('   push failed HTTP', u.status);
      await sleep(4000);
    }
  }
  // local sources
  const dir = path.join(root, 'posts-new'); let local = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8'); const { out } = fix(s);
    if (out !== s) { local++; if (LIVE) fs.writeFileSync(path.join(dir, f), out); }
  }
  console.log(`\n${LIVE ? 'Updated' : 'Would update'} ${changed} WP item(s) and ${local} posts-new file(s).`);
})().catch(e => { console.error(e.message); process.exit(1); });
