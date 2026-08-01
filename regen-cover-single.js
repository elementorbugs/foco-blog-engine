// Regenerates ONE post's cover using create-post.js's current title/size logic,
// uploads it and swaps the featured image. Avoids re-running the whole pipeline
// on a live post.
//   node regen-cover-single.js <postId> "<H1 or cover title>"
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

// reuse the live implementations so this can never drift from the pipeline
const src = fs.readFileSync(path.join(__dirname, 'create-post.js'), 'utf8');
const C = { bg: '#040208', bg2: '#0a0410', primary: '#7C3AED', primary2: '#A78BFA' };
eval(src.match(/function deriveCoverTitle[\s\S]*?\n}/)[0]);
eval(src.match(/function coverFontSize[\s\S]*?\n}/)[0]);
eval(src.match(/function coverHtml[\s\S]*?\n}\n/)[0]);

const [, , idArg, h1Arg, mascotArg] = process.argv;
if (!idArg || !h1Arg) { console.error('Usage: node regen-cover-single.js <postId> "<H1>" [mascotFile]'); process.exit(1); }

(async () => {
  const mascot = path.resolve('c:/Users/User/design foco/states_1024', mascotArg || 'foco_state_3_focus.png');
  if (!fs.existsSync(mascot)) { console.error('mascot not found: ' + mascot); process.exit(1); }

  const title = deriveCoverTitle(h1Arg);
  const size = coverFontSize(title);
  console.log('title : ' + JSON.stringify(title));
  console.log('size  : ' + size + 'px, ' + title.split('\n').length + ' lines');

  const htmlPath = path.join(__dirname, 'covers-new', 'cover-regen-' + idArg + '.html');
  const pngPath = path.join(__dirname, 'covers-new', 'cover-regen-' + idArg + '.png');
  fs.writeFileSync(htmlPath, coverHtml(title, mascot));

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file:///' + htmlPath.split(path.sep).join('/'));
  await p.waitForTimeout(600);
  await p.screenshot({ path: pngPath });
  await b.close();
  console.log('rendered: ' + (fs.statSync(pngPath).size / 1024).toFixed(0) + 'KB');

  const post = await (await fetch(BASE + '/wp-json/wp/v2/posts/' + idArg + '?_fields=slug', { headers: { Authorization: AUTH } })).json();
  const filename = 'cover-' + post.slug + '-v2.png';

  const up = await fetch(BASE + '/wp-json/wp/v2/media', {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="' + filename + '"' },
    body: fs.readFileSync(pngPath),
  });
  const media = await up.json();
  if (!up.ok) { console.error('upload failed ' + up.status + ' ' + JSON.stringify(media).slice(0, 200)); process.exit(1); }
  console.log('uploaded: media #' + media.id);

  await fetch(BASE + '/wp-json/wp/v2/media/' + media.id, {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ alt_text: h1Arg.split(':')[0].trim() }),
  });
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + idArg, {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ featured_media: media.id }),
  });
  console.log(r.ok ? 'OK    featured image swapped on #' + idArg : 'FAIL  ' + r.status);
})();
