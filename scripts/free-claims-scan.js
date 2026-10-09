// Finds every sentence/table cell that implies FOCO has free access (no free tier exists: 7-day trial only).
const fs = require('fs'), https = require('https');
for (const l of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const get = p => new Promise(r => https.get({ hostname: WP_HOST, path: p, headers: { Authorization: 'Basic ' + auth } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => r(JSON.parse(d))) }));
const FREE = /manual task|by hand|free (tier|plan|version)|free to (download|start|use|install)|for free|free forever|no credit card|free manual|start free|is free\b|are free\b|\(free\)|free,? no/i;
(async () => {
  const hits = [];
  for (const t of ['posts', 'pages']) for (let p = 1; p < 6; p++) {
    const r = await get(`/wp-json/wp/v2/${t}?status=publish,draft&per_page=100&page=${p}&context=edit&_fields=id,slug,status,content`);
    if (!Array.isArray(r) || !r.length) break;
    for (const post of r) {
      const raw = post.content.raw.replace(/<style[\s\S]*?<\/style>/g, '');
      // split into units: sentences inside text, and whole table cells / list items
      const units = raw.split(/(?<=[.!?])\s+|<\/(?:td|li|p|h\d)>/);
      units.forEach(u => {
        const text = u.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (/FOCO/.test(text) || /^<td/.test(u.trim()) && /FOCO/.test(raw.slice(Math.max(0, raw.indexOf(u) - 300), raw.indexOf(u)))) {
          if (FREE.test(text) && !/goblin tools[^.]*free[^.]*$/i.test(text.replace(/FOCO.*/, ''))) hits.push({ t, id: post.id, slug: post.slug, status: post.status, text: text.slice(0, 220) });
        }
      });
    }
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(hits, null, 1));
  const by = {}; hits.forEach(h => (by[h.slug] = by[h.slug] || []).push(h));
  console.log('units:', hits.length, '| pages:', Object.keys(by).length);
  for (const [s, hs] of Object.entries(by)) { console.log(`\n## ${s} (${hs[0].t} ${hs[0].id}, ${hs[0].status})`); hs.forEach(h => console.log('  - ' + h.text)); }
})();
