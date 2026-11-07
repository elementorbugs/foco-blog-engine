#!/usr/bin/env node
// Uploads post-media/<slug>/* to WordPress and swaps {{media:<file>}} placeholders in the post file
// for the real URLs ({{mediaenc:<file>}} gets the URL-encoded form, for query strings such as
// Pinterest share links). PDFs are allowed. Run before create-post.js. Files already in the
// media library are reused, so give a changed file a new name (-v2).
//
//   node scripts/upload-post-media.js posts-new/post-<slug>.html

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const env = {};
for (const raw of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
  const line = raw.trim();
  const eq = line.indexOf('=');
  if (line && !line.startsWith('#') && eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
}
const host = env.WP_HOST || 'tryfoco.com';
const auth = 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' };

const postFile = process.argv[2];
const slug = path.basename(postFile).replace(/^post-/, '').replace(/\.html$/, '');
const dir = path.join(root, 'post-media', slug);

(async () => {
  let html = fs.readFileSync(postFile, 'utf8');
  const wanted = [...new Set([...html.matchAll(/\{\{media(?:enc)?:([^}]+)\}\}/g)].map(m => m[1]))];
  if (wanted.length === 0) { console.log('No media placeholders.'); return; }

  for (const name of wanted) {
    const file = path.join(dir, path.basename(name));
    const type = TYPES[path.extname(name).toLowerCase()];
    if (!fs.existsSync(file) || !type) { console.error(`Missing or unsupported media file: ${name}`); process.exit(1); }

    const mediaSlug = path.basename(name, path.extname(name)).toLowerCase();
    const found = await fetch(`https://${host}/wp-json/wp/v2/media?slug=${encodeURIComponent(mediaSlug)}&_fields=id,source_url`, { headers: { Authorization: auth } });
    const list = found.ok ? await found.json() : [];
    let url = list[0] && list[0].source_url;

    if (url) {
      console.log(`Reusing media #${list[0].id}: ${name}`);
    } else {
      const res = await fetch(`https://${host}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': type, 'Content-Disposition': `attachment; filename="${path.basename(name)}"` },
        body: fs.readFileSync(file),
      });
      if (res.status !== 201) { console.error(`Upload failed for ${name}: HTTP ${res.status}`); process.exit(1); }
      const data = await res.json();
      url = data.source_url;
      console.log(`Uploaded media #${data.id}: ${name}`);
    }
    html = html.split(`{{media:${name}}}`).join(url).split(`{{mediaenc:${name}}}`).join(encodeURIComponent(url));
  }
  fs.writeFileSync(postFile, html);
})().catch(e => { console.error(e.message); process.exit(1); });
