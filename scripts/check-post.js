#!/usr/bin/env node
// Prints what actually landed in WordPress for a post, so a run can be verified without wp-admin.
// Fails if placeholders survived or the image count in the body is zero.
//
//   node scripts/check-post.js <slug>

const fs = require('fs');
const path = require('path');

const env = {};
for (const raw of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const line = raw.trim();
  const eq = line.indexOf('=');
  if (line && !line.startsWith('#') && eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
}
const host = env.WP_HOST || 'tryfoco.com';
const auth = 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64');
const slug = process.argv[2];

(async () => {
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,status,title,content,featured_media`, { headers: { Authorization: auth } });
  const post = (await res.json())[0];
  if (!post) { console.error(`No post with slug ${slug}`); process.exit(1); }
  const raw = post.content.raw;
  const body = raw.split('<!--foco-light-start')[0];
  const words = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const images = (body.match(/<img /g) || []).length;
  const placeholders = (raw.match(/\{\{media:/g) || []).length;
  console.log(JSON.stringify({
    id: post.id, status: post.status, title: post.title.raw, words, images, placeholders,
    featured_media: post.featured_media,
    h1_in_body: /<h1[\s>]/i.test(body),
    em_dashes: (body.match(/—/g) || []).length,
    edit_url: `https://${host}/wp-admin/post.php?post=${post.id}&action=edit`,
  }, null, 2));
  if (placeholders > 0 || images === 0 || !post.featured_media) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
