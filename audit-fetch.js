// audit-fetch.js — pulls article content for audit from WP
const fs = require('fs');
const path = require('path');
const https = require('https');

const c = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const e = k => { const m = c.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; };
const auth = Buffer.from(e('WP_USER') + ':' + e('WP_APP_PASSWORD')).toString('base64');
const HOST = e('WP_HOST');

const IDS = [
  250, 314, 318, 322, 332, 336, 340, 344, 348, 363, 367, 371, 375, 379,
  393, 397, 401, 413, 417, 434, 438, 442, 452, 457, 463, 474, 479, 484,
  // engine canonical comparisons
  227, 152
];

const cacheDir = path.join(__dirname, '.audit-cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

function fetchPost(id) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST,
      port: 443,
      path: `/wp-json/wp/v2/posts/${id}?context=edit&_fields=id,slug,title,status,modified,content`,
      headers: { Authorization: 'Basic ' + auth, 'User-Agent': 'foco-audit/1.0' }
    };
    https.get(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for id=${id}: ${data.slice(0,200)}`));
        try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const meta = [];
  for (const id of IDS) {
    process.stdout.write(`Fetching ${id}... `);
    try {
      const p = await fetchPost(id);
      const html = (p.content && p.content.raw) || '';
      fs.writeFileSync(path.join(cacheDir, `${id}.html`), html, 'utf8');
      meta.push({
        id: p.id,
        slug: p.slug,
        title: (p.title && (p.title.raw || p.title.rendered)) || '',
        status: p.status,
        modified: p.modified,
        wc: html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        bytes: Buffer.byteLength(html, 'utf8')
      });
      console.log(`ok wc=${meta[meta.length-1].wc}`);
    } catch (err) {
      console.log(`FAIL ${err.message}`);
      meta.push({ id, error: err.message });
    }
  }
  fs.writeFileSync(path.join(cacheDir, 'audit-meta.json'), JSON.stringify(meta, null, 2));
  console.log(`\nWrote ${meta.length} entries to .audit-cache/audit-meta.json`);
})();
