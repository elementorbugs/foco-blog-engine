// audit-snippets.js — extracts H1 + TL;DR + first 1200 chars of stripped text per article
const fs = require('fs');
const path = require('path');
const cacheDir = path.join(__dirname, '.audit-cache');
const meta = JSON.parse(fs.readFileSync(path.join(cacheDir, 'audit-meta.json'), 'utf8'));

function strip(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const out = [];
for (const m of meta) {
  if (m.error) continue;
  const html = fs.readFileSync(path.join(cacheDir, `${m.id}.html`), 'utf8');
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
  const tldr = (html.match(/<div[^>]*class=["'][^"']*foco-tldr[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '';
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => strip(m[1])).slice(0, 8);
  const stripped = strip(html).slice(0, 1400);
  out.push({ id: m.id, slug: m.slug, status: m.status, wc: m.wc, h1: strip(h1), tldr: strip(tldr), h2s, body: stripped });
}

fs.writeFileSync(path.join(cacheDir, 'audit-snippets.json'), JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} snippets`);
