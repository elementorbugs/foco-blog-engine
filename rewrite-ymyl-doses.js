// Rewrites specific mg/dose claims in 348 + 452 to generic titration language.
// Removes "guidance" reading without losing educational value.
// Read-only first pass via --dry-run; live push otherwise.

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

// 348 — Wellbutrin: 2 mg-specific sentences in the titration steps
const REPLACE_348 = [
  {
    find: '<strong>Start at a low dose.</strong> Typically 150 mg of the extended-release (XL) formulation, taken in the morning.',
    with: '<strong>Start at a low dose.</strong> Wellbutrin is started at a low dose of the extended-release (XL) formulation, taken in the morning. Your prescriber sets the specific starting dose based on your medical history.',
  },
  {
    find: '<strong>Increase to therapeutic dose.</strong> If tolerated, the dose is typically increased to 300 mg/day after 1-2 weeks. Some people benefit from 450 mg/day, but the seizure risk increases at higher doses.',
    with: '<strong>Increase to therapeutic dose.</strong> If tolerated, the dose is typically increased after 1-2 weeks. Higher doses produce stronger effects but also raise the seizure risk, which is why titration is done under clinical supervision rather than self-adjusted.',
  },
];

// 452 — Non-stimulants: 4 drug entries each name a specific mg range
const REPLACE_452 = [
  {
    find: "It's taken once or twice daily, with typical doses ranging from 40-100mg.",
    with: "It's taken once or twice daily, with dosing determined by your prescriber based on weight, response, and tolerance.",
  },
  {
    find: 'Doses typically range from 1-4mg daily, with the medication reaching peak effectiveness after 1-2 weeks.',
    with: 'Dosing is titrated gradually under clinical guidance, with the medication reaching peak effectiveness after 1-2 weeks.',
  },
  {
    find: 'Typical doses range from 0.1-0.4mg daily.',
    with: 'Dosing is determined and titrated by the prescribing clinician.',
  },
  {
    find: 'It offers once-daily dosing at 400-600mg for adults.',
    with: 'It offers once-daily dosing for adults, with the specific dose set by the prescriber.',
  },
];

async function processPost(id, slug, replacements) {
  const r = await req('GET', `/wp-json/wp/v2/posts/${id}?context=edit&_fields=content,slug`);
  if (r.s !== 200) { console.log(`${id} ${slug}: FETCH FAIL ${r.s}`); return; }
  let html = r.b.content.raw;
  let count = 0;
  const misses = [];
  for (const { find, with: replaceWith } of replacements) {
    if (html.includes(find)) {
      html = html.replace(find, replaceWith);
      count++;
    } else {
      misses.push(find.slice(0, 60) + '...');
    }
  }
  console.log(`${id} ${slug}: ${count}/${replacements.length} replacements found`);
  if (misses.length) {
    console.log('  MISSED:');
    misses.forEach(m => console.log('    ' + m));
  }
  if (process.argv.includes('--dry-run')) {
    console.log('  (dry-run — not pushing)');
    return;
  }
  if (count === 0) {
    console.log('  no changes — skipping push');
    return;
  }
  const upd = await req('POST', `/wp-json/wp/v2/posts/${id}`, { content: html });
  if (upd.s === 200) {
    console.log(`  ✓ pushed`);
  } else {
    console.log(`  ✗ push failed ${upd.s}`);
  }
}

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE ===');
  await processPost(348, 'wellbutrin-for-adhd', REPLACE_348);
  await processPost(452, 'adhd-medication-non-stimulant', REPLACE_452);
})();
