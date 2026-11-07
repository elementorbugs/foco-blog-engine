#!/usr/bin/env node
// Saves a post (any status) from WordPress into the repo, so a cloud session can edit it.
// Writes posts-new/post-<slug>.html (an <h1> line from the WP title, then the raw content)
// and post-meta/<slug>.json (status, title, RankMath focus keyword and SEO title).
//
//   node scripts/fetch-post.js <slug>

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
const headers = { Authorization: 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64') };
const slug = process.argv[2];

(async () => {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: node scripts/fetch-post.js <slug>'); process.exit(1); }
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,status,title,content,meta,modified`, { headers });
  const post = (await res.json())[0];
  if (!post) { console.error(`No post with slug ${slug}`); process.exit(1); }

  const meta = post.meta || {};
  const title = post.title.raw;
  let body = post.content.raw;
  if (!/<h1[\s>]/i.test(body)) body = `<h1>${title}</h1>\n` + body;

  fs.writeFileSync(path.join(root, 'posts-new', `post-${slug}.html`), body);
  fs.mkdirSync(path.join(root, 'post-meta'), { recursive: true });
  fs.writeFileSync(path.join(root, 'post-meta', `${slug}.json`), JSON.stringify({
    id: post.id, status: post.status, modified: post.modified, title,
    focus_keyword: meta.rank_math_focus_keyword || null,
    seo_title: meta.rank_math_title || null,
    seo_description: meta.rank_math_description || null,
  }, null, 2) + '\n');
  console.log(`Saved post #${post.id} (${post.status}): ${body.length} chars, focus keyword: ${meta.rank_math_focus_keyword || 'none'}`);
})().catch(e => { console.error(e.message); process.exit(1); });
