// Refreshes posts-new/post-<slug>.html from the live post (WordPress is the source of truth after the first push),
// minus the injected light-style block. Usage: node scripts/sync-local-post.js <slug> [<slug> ...]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
for (const slug of process.argv.slice(2)) {
  execFileSync('node', [path.join(__dirname, 'wp-fetch-post.js'), slug], { cwd: root, stdio: 'ignore' });
  let t = fs.readFileSync(path.join(root, '.audit-cache', `live-${slug}.html`), 'utf8');
  const i = t.indexOf('<!--foco-light-start-->');
  if (i >= 0) {
    const j = t.indexOf('<!--foco-light-end-->') + '<!--foco-light-end-->'.length;
    const a = t.slice(0, i).replace(/<!-- wp:html -->\s*$/, '');
    const b = t.slice(j).replace(/^\s*<!-- \/wp:html -->/, '').replace(/^\s*<!-- \/wp:post-content -->/, '');
    t = a.replace(/\s+$/, '') + '\n' + b.replace(/^\s+/, '');
  }
  fs.writeFileSync(path.join(root, 'posts-new', `post-${slug}.html`), t.replace(/\s+$/, '') + '\n');
  console.log('synced', slug);
}
