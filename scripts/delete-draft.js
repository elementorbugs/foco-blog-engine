#!/usr/bin/env node
// Permanently deletes one DRAFT post and the cover create-post.js uploaded for it.
// Refuses anything that is not a draft, so a live post can never be removed this way.
//
//   node scripts/delete-draft.js <slug>

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    const eq = line.indexOf('=');
    if (line && !line.startsWith('#') && eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}

const ENV = loadEnv();
const HOST = ENV.WP_HOST || 'tryfoco.com';
const USER = ENV.WP_USER;
const PASS = ENV.WP_APP_PASSWORD;
const slug = process.argv[2];

if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: node scripts/delete-draft.js <slug>'); process.exit(1); }
if (!USER || !PASS) { console.error('WP_USER + WP_APP_PASSWORD must be set in .env'); process.exit(1); }

const headers = { Authorization: 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64') };

async function wp(method, route) {
  const res = await fetch(`https://${HOST}/wp-json/wp/v2${route}`, { method, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

(async () => {
  const found = await wp('GET', `/posts?slug=${slug}&status=any&context=edit&_fields=id,status,featured_media`);
  if (found.status !== 200) { console.error(`Lookup failed: HTTP ${found.status}`); process.exit(1); }
  const post = found.data[0];
  if (!post) { console.log(`Nothing to delete: no post with slug "${slug}".`); return; }
  if (post.status !== 'draft') { console.error(`Refusing: post #${post.id} is "${post.status}", not a draft.`); process.exit(1); }

  // Only the cover made for this slug. A cover shared with another post stays.
  let coverId = null;
  if (post.featured_media) {
    const media = await wp('GET', `/media/${post.featured_media}?context=edit&_fields=id,slug,source_url`);
    const name = media.status === 200 ? path.basename(media.data.source_url || '') : '';
    if (name.startsWith(`cover-${slug}`)) coverId = post.featured_media;
    else console.log(`Keeping media #${post.featured_media} (not this post's own cover).`);
  }

  const del = await wp('DELETE', `/posts/${post.id}?force=true`);
  if (del.status !== 200) { console.error(`Delete failed: HTTP ${del.status}`); process.exit(1); }
  console.log(`Deleted draft #${post.id} (${slug}).`);

  if (coverId) {
    const delMedia = await wp('DELETE', `/media/${coverId}?force=true`);
    if (delMedia.status !== 200) { console.error(`Cover delete failed: media #${coverId}, HTTP ${delMedia.status}`); process.exit(1); }
    console.log(`Deleted cover media #${coverId}.`);
  }

  const check = await wp('GET', `/posts?slug=${slug}&status=any&_fields=id`);
  if (check.status !== 200 || check.data.length !== 0) { console.error('Post still present after delete.'); process.exit(1); }
  console.log('Verified: post is gone.');
})().catch(e => { console.error(e.message); process.exit(1); });
