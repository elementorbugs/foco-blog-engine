#!/usr/bin/env node
// Applies exact text replacements to a post's live WordPress content. Use this to edit a post that
// already exists: create-post.js swaps local edits for the live content (see tasks/lessons.md).
// Each "old" must occur exactly once, or nothing is changed.
//
//   node scripts/patch-post.js <slug>     reads post-patches/<slug>.json: [{ "old": "...", "new": "..." }]
//
// Batch mode: if post-patches/<name>.json is an object { "<slug>": [edits], ... }, every post in it is patched.
// Each post is all-or-nothing; a post whose text does not match is skipped and the run exits non-zero at the end.

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

async function patchOne(slug, edits) {
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,status,content`, { headers });
  const post = (await res.json())[0];
  if (!post) throw new Error(`No post with slug ${slug}`);

  let content = post.content.raw;
  for (const { old: from, new: to } of edits) {
    const count = content.split(from).length - 1;
    if (count !== 1) throw new Error(`Nothing changed in ${slug}: expected 1 match, found ${count}: ${from.slice(0, 80)}`);
    content = content.split(from).join(to);
  }

  const put = await fetch(`https://${host}/wp-json/wp/v2/posts/${post.id}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (put.status !== 200) throw new Error(`Update of ${slug} failed: HTTP ${put.status}`);
  console.log(`Patched post #${post.id} ${slug} (${post.status}): ${edits.length} edit(s).`);
}

(async () => {
  if (!fs.existsSync(patchFile)) { console.error(`No patch file: post-patches/${slug}.json`); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  if (Array.isArray(data)) { await patchOne(slug, data); return; }

  let failed = 0;
  for (const [s, edits] of Object.entries(data)) {
    try { await patchOne(s, edits); } catch (e) { failed++; console.error(e.message); }
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log(`Batch done: ${Object.keys(data).length - failed} patched, ${failed} failed.`);
  if (failed) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
