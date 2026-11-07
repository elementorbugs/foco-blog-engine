#!/usr/bin/env node
// Sets a post's RankMath SEO title (the line Google shows), which replaces the
// "%title% %sep% %sitename%" template, so nothing is appended to it.
//
//   node scripts/set-seo-title.js <slug> "<SEO title>"
//
// Refuses titles over 65 characters or with em dashes (CLAUDE.md rules).

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
const headers = {
  Authorization: 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64'),
  'Content-Type': 'application/json',
};
const [slug, title] = process.argv.slice(2);

(async () => {
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !title) {
    console.error('Usage: node scripts/set-seo-title.js <slug> "<SEO title>"');
    process.exit(1);
  }
  if (title.length > 65) { console.error(`Title is ${title.length} characters, the limit is 65.`); process.exit(1); }
  if (title.includes('—')) { console.error('Title contains an em dash.'); process.exit(1); }

  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,status,link,meta`, { headers });
  const post = (await res.json())[0];
  if (!post) { console.error(`No post with slug ${slug}`); process.exit(1); }
  const before = (post.meta && post.meta.rank_math_title) || '(none, template in use)';

  const body = JSON.stringify({ objectType: 'post', objectID: post.id, meta: { rank_math_title: title } });
  let r = await fetch(`https://${host}/wp-json/rankmath/v1/updateMeta`, { method: 'POST', headers, body });
  if (r.status === 404) {
    await new Promise(res => setTimeout(res, 1500));
    r = await fetch(`https://${host}/wp-json/rankmath/v1/updateMeta`, { method: 'POST', headers, body });
  }
  if (!r.ok) { console.error(`RankMath updateMeta failed: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }

  console.log(`Post #${post.id} (${slug}, ${post.status})`);
  console.log(`Before: ${before}`);
  console.log(`After:  ${title} (${title.length} chars)`);
})();
