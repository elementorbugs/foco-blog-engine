#!/usr/bin/env node
// Applies exact text replacements to a post's live WordPress content. Use this to edit a post that
// already exists: create-post.js swaps local edits for the live content (see tasks/lessons.md).
// Each "old" must occur exactly once, or nothing is changed.
//
//   node scripts/patch-post.js <slug>     reads post-patches/<slug>.json: [{ "old": "...", "new": "..." }]

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
const patchFile = path.join(root, 'post-patches', `${slug}.json`);

(async () => {
  if (!fs.existsSync(patchFile)) { console.error(`No patch file: post-patches/${slug}.json`); process.exit(1); }
  const edits = JSON.parse(fs.readFileSync(patchFile, 'utf8'));

  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,status,content`, { headers });
  const post = (await res.json())[0];
  if (!post) { console.error(`No post with slug ${slug}`); process.exit(1); }

  let content = post.content.raw;
  for (const { old: from, new: to } of edits) {
    const count = content.split(from).length - 1;
    if (count !== 1) { console.error(`Nothing changed: expected 1 match, found ${count}: ${from.slice(0, 80)}`); process.exit(1); }
    content = content.split(from).join(to);
  }

  const put = await fetch(`https://${host}/wp-json/wp/v2/posts/${post.id}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (put.status !== 200) { console.error(`Update failed: HTTP ${put.status}`); process.exit(1); }
  console.log(`Patched post #${post.id} (${post.status}): ${edits.length} edit(s).`);
})().catch(e => { console.error(e.message); process.exit(1); });
