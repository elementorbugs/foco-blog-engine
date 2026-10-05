// Fetch a post's live raw content from WP into .audit-cache/live-<slug>.html (base for manual edits).
// Usage: node scripts/wp-fetch-post.js <slug>
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const eq = line.indexOf('=');
  if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});
const host = env.WP_HOST || 'tryfoco.com';
const auth = Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const slug = process.argv[2];

(async () => {
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&context=edit&status=publish,draft`, { headers: { Authorization: 'Basic ' + auth } });
  const [post] = await res.json();
  if (!post) throw new Error('post not found: ' + slug);
  const out = path.join(__dirname, '..', '.audit-cache', `live-${slug}.html`);
  fs.writeFileSync(out, post.content.raw);
  console.log(post.id, post.status, post.link, 'modified', post.modified, 'chars', post.content.raw.length);
  console.log('saved', out);
})();
