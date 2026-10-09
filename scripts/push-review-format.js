// Pushes decision-first rewrites (posts-new/post-<slug>.html) to WordPress, one post at a time.
// For each slug: lint must PASS -> GET live raw content (backup) -> keep its light-style block ->
// POST new content -> IndexNow. Waits between posts so Cloudways bot protection is not triggered.
// Usage: node scripts/push-review-format.js <slug> [<slug> ...] [--dry]
const fs = require('fs'), path = require('path'), https = require('https'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const env = {}; fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
const auth = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const host = env.WP_HOST || 'www.tryfoco.com';
const dry = process.argv.includes('--dry');
const slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
function req(method, p, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const r = https.request({ hostname: host, path: p, method, timeout: 60000, headers: { Authorization: auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, x => {
      let s = ''; x.on('data', d => s += d); x.on('end', () => { try { resolve({ status: x.statusCode, data: JSON.parse(s) }); } catch (e) { resolve({ status: x.statusCode, data: s.slice(0, 200) }); } });
    });
    r.on('timeout', () => r.destroy(new Error('timeout'))); r.on('error', reject); r.end(data);
  });
}
(async () => {
  for (const slug of slugs) {
    const file = path.join(root, 'posts-new', `post-${slug}.html`);
    try { execFileSync('node', [path.join(root, 'tasks', 'review-format', 'lint.js'), file], { stdio: 'pipe' }); }
    catch (e) { console.log(`✗ ${slug}: lint failed\n${e.stdout}`); continue; }
    const g = await req('GET', `/wp-json/wp/v2/posts?slug=${slug}&context=edit&_fields=id,content,status`);
    const post = Array.isArray(g.data) && g.data[0];
    if (!post) { console.log(`✗ ${slug}: not found (HTTP ${g.status})`); continue; }
    const raw = post.content.raw; const i = raw.indexOf('<!--foco-light-start');
    if (i < 0) { console.log(`✗ ${slug}: live post has no light block, refusing`); continue; }
    fs.writeFileSync(path.join(root, '.audit-cache', 'backups', `${slug}-${post.id}-pre-push-${Date.now()}.html`), raw);
    const content = fs.readFileSync(file, 'utf8').trim() + '\n\n' + raw.slice(i);
    if (/&&/.test(content)) { console.log(`✗ ${slug}: "&&" in content`); continue; }
    if (dry) { console.log(`· ${slug} (${post.id}): would push ${content.length} chars`); continue; }
    const u = await req('POST', `/wp-json/wp/v2/posts/${post.id}`, { content });
    if (u.status !== 200) { console.log(`✗ ${slug}: push HTTP ${u.status}`); continue; }
    const n = await req('POST', '/wp-json/rankmath/v1/in/submitUrls', { urls: `https://www.tryfoco.com/${slug}/` });
    console.log(`✓ ${slug} (${post.id}) pushed, status ${u.data.status}, IndexNow ${n.data && n.data.success ? 'ok' : 'failed'}`);
    await sleep(20000);
  }
})();
