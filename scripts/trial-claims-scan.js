// Finds FOCO pricing/trial wording that implies the monthly plan has a free trial.
// Fact (Adi, 2026-10-10): only the yearly plan ($59/yr) has the 7-day free trial; monthly ($9/mo) is billed right away.
// Usage: node scripts/trial-claims-scan.js   -> writes .audit-cache/trial-claims.json
const fs = require('fs'), path = require('path'), https = require('https');
const root = path.join(__dirname, '..');
const env = {}; fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
const auth = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const get = p => new Promise((res, rej) => https.get({ hostname: env.WP_HOST || 'www.tryfoco.com', path: p, headers: { Authorization: auth } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res({ status: x.statusCode, data: JSON.parse(d) })); }).on('error', rej));
(async () => {
  const items = [];
  for (const type of ['posts', 'pages']) for (const status of ['publish', 'draft']) for (let page = 1; page < 10; page++) {
    const r = await get(`/wp-json/wp/v2/${type}?status=${status}&per_page=100&page=${page}&context=edit&_fields=id,slug,status,content`);
    if (!Array.isArray(r.data) || !r.data.length) break; r.data.forEach(p => items.push({ type, ...p })); if (r.data.length < 100) break;
  }
  const hits = [];
  for (const p of items) {
    const text = p.content.raw.replace(/<!--foco-light-start[\s\S]*$/, '').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ');
    const plain = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
    const sentences = plain.split(/(?<=[.!?])\s+/);
    sentences.forEach(s => {
      if (!/trial/i.test(s)) return;
      if (!/FOCO|\$9|\$59|monthly|month|year/i.test(s)) return;
      if (/Tiimo|Motion|Sunsama|Todoist|Marvin|Inflow|Aligned|Structured|TickTick|Llama|Saner|Reclaim|Finch|Habitica/i.test(s) && !/FOCO/.test(s)) return;
      const bad = /\$9|monthly|month/i.test(s) && !/(yearly|annual|\$59)[^.]*(only|trial)|trial[^.]*(yearly|annual|\$59)/i.test(s);
      hits.push({ id: p.id, slug: p.slug, type: p.type, status: p.status, likelyWrong: bad, sentence: s.trim().slice(0, 240) });
    });
  }
  fs.writeFileSync(path.join(root, '.audit-cache', 'trial-claims.json'), JSON.stringify(hits, null, 2));
  const pages = [...new Set(hits.map(h => h.slug))];
  console.log(`scanned ${items.length} | sentences ${hits.length} | pages ${pages.length} | likely wrong ${hits.filter(h => h.likelyWrong).length}`);
  const forms = {}; hits.forEach(h => { const k = h.sentence.replace(/https?:\S+/g, '').slice(0, 110); forms[k] = (forms[k] || 0) + 1; });
  Object.entries(forms).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(String(v).padStart(3), '|', k));
})().catch(e => { console.error(e.message); process.exit(1); });
