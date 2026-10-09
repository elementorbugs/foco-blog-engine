// Re-hosts App Store icon URLs (is*.mzstatic.com) found in posts-new/post-<slug>.html on our WP media
// library, rewrites the src, and records each new app in app-directory.json "apps" so it is reused.
// Usage: node scripts/rehost-icons.js <slug> [<slug> ...]
const fs = require('fs'), path = require('path'), https = require('https');
const root = path.join(__dirname, '..');
const env = {}; fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
const auth = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const host = env.WP_HOST || 'www.tryfoco.com';
const dirFile = path.join(root, 'app-directory.json');
const dir = JSON.parse(fs.readFileSync(dirFile, 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getBuf = u => new Promise((res, rej) => https.get(u, x => { if (x.statusCode !== 200) return rej(new Error('HTTP ' + x.statusCode)); const c = []; x.on('data', d => c.push(d)); x.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
const upload = (buf, name) => new Promise((res, rej) => {
  const r = https.request({ hostname: host, path: '/wp-json/wp/v2/media', method: 'POST', headers: { Authorization: auth, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${name}"`, 'Content-Length': buf.length } }, x => { let s = ''; x.on('data', d => s += d); x.on('end', () => { try { res(JSON.parse(s)); } catch (e) { rej(new Error(s.slice(0, 120))); } }); });
  r.on('error', rej); r.end(buf);
});
(async () => {
  const done = {};
  for (const slug of process.argv.slice(2)) {
    const file = path.join(root, 'posts-new', `post-${slug}.html`);
    let s = fs.readFileSync(file, 'utf8');
    const tags = [...s.matchAll(/<img src="(https:\/\/is\d+-ssl\.mzstatic\.com\/[^"]+)" alt="([^"]*?) app icon"/g)];
    for (const [, url, name] of tags) {
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let hosted = done[url] || (dir.apps[key] && dir.apps[key].icon);
      if (!hosted) {
        const png = await getBuf(url.replace(/\/[^/]+$/, '/96x96bb.png'));
        const m = await upload(png, `app-icon-${key}.png`);
        if (!m.source_url) { console.log('  upload failed', name); continue; }
        hosted = m.source_url; dir.apps[key] = { name, icon: hosted };
        console.log(`  + ${name} -> ${hosted}`); await sleep(1500);
      }
      done[url] = hosted;
      s = s.split(url).join(hosted);
    }
    fs.writeFileSync(file, s);
    console.log(`${slug}: ${tags.length} store icon(s) re-hosted, left: ${(s.match(/mzstatic\.com/g) || []).length}`);
  }
  fs.writeFileSync(dirFile, JSON.stringify(dir, null, 2) + '\n');
})().catch(e => { console.error(e.message); process.exit(1); });
