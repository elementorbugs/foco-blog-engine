// Deploys the FOCO body doubling room to tryfoco.com/body-doubling/.
//   node tools/body-doubling-room/deploy/deploy.js            media + build + page (draft) + snippet
//   node tools/body-doubling-room/deploy/deploy.js --build    only rebuild the snippet file (no network)
//   node tools/body-doubling-room/deploy/deploy.js --publish  same as default, but publish the page
// How it works: images go to the WordPress media library (deploy/media-map.json remembers them), the
// room (HTML + CSS + JS + config) is folded into one standalone document, and a Code Snippet serves that
// document for the "body-doubling" page instead of the theme. Rollback: wp-admin -> Snippets -> deactivate
// "FOCO body doubling room", and set the page back to draft.
const fs = require('fs');
const path = require('path');

const ROOM = path.resolve(__dirname, '..');
const SITE = path.resolve(ROOM, '../..');
const MAP_FILE = path.join(__dirname, 'media-map.json');
const SNIPPET_FILE = path.join(__dirname, 'room-snippet.php');
const SLUG = 'body-doubling';
const SNIPPET_NAME = 'FOCO body doubling room';
const args = process.argv.slice(2);
const BUILD_ONLY = args.includes('--build');
const PUBLISH = args.includes('--publish');

const env = {};
fs.readFileSync(path.join(SITE, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, '');
});
const BASE = 'https://' + (env.WP_HOST || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

async function wp(method, route, body, headers = {}) {
  const res = await fetch(BASE + route, {
    method, headers: { Authorization: AUTH, ...(body && !(body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, json, text };
}

// ---------- 1. images -> media library ----------
function localImages() {
  const out = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(path.join(ROOM, dir))) {
      const rel = dir + '/' + f;
      if (fs.statSync(path.join(ROOM, rel)).isDirectory()) walk(rel);
      else if (/\.(png|jpe?g)$/i.test(f)) out.push(rel);
    }
  })('img');
  return out;
}
async function uploadMedia() {
  const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
  for (const rel of localImages()) {
    if (map[rel]) continue;
    const fname = 'foco-room-' + rel.replace(/^img\//, '').replace(/\//g, '-');
    const slug = fname.replace(/\.[a-z]+$/i, '').toLowerCase();
    const found = await wp('GET', '/wp-json/wp/v2/media?slug=' + encodeURIComponent(slug) + '&_fields=id,source_url');
    if (found.status === 200 && found.json && found.json[0]) { map[rel] = found.json[0].source_url; continue; }
    const type = /\.png$/i.test(rel) ? 'image/png' : 'image/jpeg';
    const up = await wp('POST', '/wp-json/wp/v2/media', fs.readFileSync(path.join(ROOM, rel)), { 'Content-Type': type, 'Content-Disposition': 'attachment; filename="' + fname + '"' });
    if (up.status !== 201) throw new Error('upload failed for ' + rel + ': ' + up.status + ' ' + up.text.slice(0, 200));
    map[rel] = up.json.source_url;
    console.log('  uploaded', rel, '->', map[rel]);
    fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1));
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1));
  console.log('media: ' + Object.keys(map).length + ' images mapped');
  return map;
}

// ---------- 2. fold the room into one document ----------
function build(map) {
  let html = fs.readFileSync(path.join(ROOM, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOM, 'room.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOM, 'room.js'), 'utf8');
  let config = fs.readFileSync(path.join(ROOM, 'config.js'), 'utf8');
  config += '\nwindow.FOCO_ROOM_CONFIG.assets = ' + JSON.stringify(map) + ';\n';
  const gtag = '<script async src="https://www.googletagmanager.com/gtag/js?id=GT-KFLGFL83"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","GT-KFLGFL83");</script>';
  html = html.replace('<link rel="stylesheet" href="room.css">', '<style>' + css + '</style>\n' + gtag);
  html = html.replace('<script src="config.js"></script>', '<script>' + config + '</script>');
  html = html.replace('<script src="room.js" defer></script>', '<script>' + js + '</script>');
  // static image paths in the markup
  html = html.replace(/(src|href|content)="(img\/[^"]+)"/g, (m, attr, p) => (map[p] ? attr + '="' + map[p] + '"' : m));
  html = html.replace(/https:\/\/www\.tryfoco\.com\/body-doubling\/img\/og-room\.png/g, map['img/og-room.png'] || '$&');
  html = html.replace('<link rel="icon"', '<link rel="icon"'); // keep any icon as is
  if (!/rel="icon"/.test(html)) html = html.replace('</title>', '</title>\n<link rel="icon" href="https://www.tryfoco.com/wp-content/uploads/2026/05/cropped-App-Icon-scaled-1-32x32.png" sizes="32x32">');
  if (html.includes("FOCOROOM")) throw new Error('heredoc marker found inside the document');
  const leftovers = (html.match(/["'(]img\/[a-z0-9_\-/]+\.(png|jpe?g)/gi) || []).filter((s) => !map[s.slice(1)]);
  if (leftovers.length) console.warn('  unmapped image paths:', leftovers.slice(0, 5));
  return html;
}
function snippetCode(html, pageId) {
  return `// FOCO body doubling room: serves the standalone room for page ${pageId} (/${SLUG}/) instead of the theme.
// Generated by tools/body-doubling-room/deploy/deploy.js. Deactivate this snippet to roll back.
add_action('template_redirect', function () {
\tif (!is_page(${pageId})) { return; }
\tstatus_header(200);
\theader('Content-Type: text/html; charset=utf-8');
\t$html = <<<'FOCOROOM'
${html}
FOCOROOM;
\t// Cookie consent from the "FOCO cookie consent + accessibility" snippet: defaults before gtag, banner before </body>.
\tif (function_exists('foco_consent_head_html')) {
\t\t$html = str_replace('<script async src="https://www.googletagmanager.com/', foco_consent_head_html() . foco_consent_style_html() . '<script async src="https://www.googletagmanager.com/', $html);
\t\t$html = str_replace('</body>', foco_consent_banner_html() . '</body>', $html);
\t}
\techo $html;
\texit;
}, 1);
`;
}

// ---------- 3. the page and its SEO fields ----------
async function ensurePage() {
  const found = await wp('GET', '/wp-json/wp/v2/pages?slug=' + SLUG + '&status=any&_fields=id,status,link');
  const content = '<!-- wp:paragraph --><p>The FOCO body doubling room is served by the "FOCO body doubling room" Code Snippet. Edit tools/body-doubling-room in the repo, then run deploy.js.</p><!-- /wp:paragraph -->';
  const body = { title: 'Free Body Doubling App for ADHD: Live Focus Room', slug: SLUG, content, comment_status: 'closed', ping_status: 'closed' };
  if (PUBLISH) body.status = 'publish';
  let res;
  if (found.json && found.json[0]) res = await wp('POST', '/wp-json/wp/v2/pages/' + found.json[0].id, body);
  else res = await wp('POST', '/wp-json/wp/v2/pages', { ...body, status: PUBLISH ? 'publish' : 'draft' });
  if (res.status >= 300) throw new Error('page failed: ' + res.status + ' ' + res.text.slice(0, 200));
  const id = res.json.id;
  await wp('POST', '/wp-json/rankmath/v1/updateMeta', {
    objectID: id, objectType: 'post',
    meta: {
      rank_math_focus_keyword: 'body doubling app,free body doubling,virtual body doubling,body doubling online',
      rank_math_title: 'Free Body Doubling App for ADHD: Live Focus Room | FOCO',
      rank_math_description: 'Free body doubling app for ADHD, right in your browser. Join a live online focus room, pick 15 to 90 minutes and work next to real people. No camera, no sign up.',
    },
  });
  console.log('page: #' + id + ' status ' + res.json.status + ' ' + res.json.link);
  return res.json;
}
async function pushSnippet(code) {
  const list = await wp('GET', '/wp-json/code-snippets/v1/snippets');
  const existing = (list.json || []).find((s) => s.name === SNIPPET_NAME);
  const body = { name: SNIPPET_NAME, desc: 'Serves tryfoco.com/' + SLUG + '/ (the live body doubling room) instead of the theme. Source: tools/body-doubling-room. Deactivate to roll back.', scope: 'front-end', active: true, code };
  const res = await wp(existing ? 'PUT' : 'POST', '/wp-json/code-snippets/v1/snippets' + (existing ? '/' + existing.id : ''), body);
  console.log('snippet: HTTP ' + res.status + ' | id ' + (res.json && res.json.id) + ' | active ' + (res.json && res.json.active) + ' | code_error ' + JSON.stringify(res.json && res.json.code_error));
  if (res.status >= 300 || (res.json && res.json.code_error)) throw new Error('snippet failed');
}

(async () => {
  if (BUILD_ONLY) {
    const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
    fs.writeFileSync(SNIPPET_FILE, '<?php\n' + snippetCode(build(map), 0));
    console.log('built ' + SNIPPET_FILE);
    return;
  }
  const map = await uploadMedia();
  const page = await ensurePage();
  const code = snippetCode(build(map), page.id);
  fs.writeFileSync(SNIPPET_FILE, '<?php\n' + code);
  await pushSnippet(code);
  console.log('\nDone. ' + (page.status === 'publish' ? 'Live at ' + page.link : 'Draft preview (logged in): ' + BASE + '/?page_id=' + page.id + '&preview=true'));
})().catch((e) => { console.error('DEPLOY FAILED:', e.message); process.exit(1); });
