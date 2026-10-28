// Deploys the FOCO visual timer: the hub tryfoco.com/visual-timer/ plus one child page per preset length
// (/visual-timer/5-minute/ ...), all served by ONE Code Snippet (same pattern as tools/body-doubling-room/deploy).
//   node tools/visual-timer/deploy/deploy.js            media + build + pages (new ones as draft) + snippet
//   node tools/visual-timer/deploy/deploy.js --build    only rebuild the snippet file and deploy/preview-*.html (no network)
//   node tools/visual-timer/deploy/deploy.js --publish  same as default, but publish every page
// How it fits together: index.html marks the regions that differ per page (<!--VT:NAME-->...<!--/VT:NAME-->).
// The build folds the tool into one document, cuts those regions out as {{VT:NAME}} tokens, and the snippet fills
// them per page with PHP strtr(). The FAQ is rendered as static HTML and as FAQPage schema from the same source.
// Rollback: wp-admin -> Snippets -> deactivate "FOCO visual timer", set the pages to draft.
const fs = require('fs');
const path = require('path');

const TOOL = path.resolve(__dirname, '..');
const SITE = path.resolve(TOOL, '../..');
const MAP_FILE = path.join(__dirname, 'media-map.json');
const SNIPPET_FILE = path.join(__dirname, 'timer-snippet.php');
const SLUG = 'visual-timer';
const HUB = 'https://www.tryfoco.com/visual-timer/';
const SNIPPET_NAME = 'FOCO visual timer';
const PRESETS = require('../presets.js');
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

// ---------- 1. images -> media library (the logo is shared with the body doubling room) ----------
const KNOWN = { 'img/foco-logo.png': 'https://www.tryfoco.com/wp-content/uploads/2026/10/foco-room-foco-logo.png' };
async function uploadMedia() {
  const map = Object.assign({}, KNOWN, fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {});
  for (const rel of ['img/og-visual-timer.png', 'img/foco-focus.png', 'img/foco-done.png']) {
    if (map[rel]) continue;
    const fname = 'foco-' + path.basename(rel);
    const up = await wp('POST', '/wp-json/wp/v2/media', fs.readFileSync(path.join(TOOL, rel)), { 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="' + fname + '"' });
    if (up.status !== 201) throw new Error('upload failed for ' + rel + ': ' + up.status + ' ' + up.text.slice(0, 200));
    await wp('POST', '/wp-json/wp/v2/media/' + up.json.id, { alt_text: rel.includes('og-') ? "FOCO's visual timer: a purple wedge shrinking around a dark centre" : 'The FOCO character' });
    map[rel] = up.json.source_url;
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1));
  return map;
}

// ---------- 2. fold the tool into one document ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => s.replace(/<[^>]+>/g, '');
function readFaq() {
  const window = {};
  new Function('window', 'module', fs.readFileSync(path.join(TOOL, 'faq.js'), 'utf8'))(window, undefined);
  return window.VT_FAQ;
}
function faqItems(faq) {
  return faq.map((qa, i) => '<h3 class="vt-faq-h"><button class="vt-faq-q" type="button" aria-expanded="' + (i === 0) + '" aria-controls="vt-faq-a' + i + '" id="vt-faq-q' + i + '">' + esc(qa[0]) + '</button></h3><div class="vt-faq-a" id="vt-faq-a' + i + '" role="region" aria-labelledby="vt-faq-q' + i + '"><p>' + qa[1] + '</p></div>').join('');
}
const faqSchema = (faq) => faq.map((qa) => ({ '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: plain(qa[1]) } }));
function buildHub(map) {
  let html = fs.readFileSync(path.join(TOOL, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(TOOL, 'timer.css'), 'utf8');
  const js = fs.readFileSync(path.join(TOOL, 'timer.js'), 'utf8');
  const faq = readFaq();
  const gtag = '<script async src="https://www.googletagmanager.com/gtag/js?id=GT-KFLGFL83"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","GT-KFLGFL83");</script>';
  html = html.replace('<link rel="stylesheet" href="timer.css">', () => '<style>' + css + '</style>\n' + gtag);
  html = html.replace('<script src="faq.js"></script>', '');
  html = html.replace('<script src="timer.js" defer></script>', () => '<script>' + js + '</script>');
  html = html.replace('<div id="vt-faq-items"></div>', () => '<div id="vt-faq-items">' + faqItems(faq) + '</div>');
  html = html.replace('"mainEntity":"__FAQ__"', () => '"mainEntity":' + JSON.stringify(faqSchema(faq)));
  html = html.replace(/(src|href|content|data-done)="(img\/[^"]+)"/g, (m, attr, p) => (map[p] ? attr + '="' + map[p] + '"' : m));
  if (/="img\//.test(html)) throw new Error('unmapped image path left in the document');
  return html;
}

// ---------- 3. per-preset regions ----------
function presetVars(p, hubVars, ogImage) {
  const url = HUB + p.slug + '/';
  const name = p.m + ' Minute Visual Timer';
  const title = name + ': Free Online Countdown | FOCO';
  const desc = 'A free ' + p.m + ' minute visual timer: the colour shrinks as the time passes. ' + p.uses[0] + ', and more. Full screen, sounds, no sign-up.';
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': url + '#app', name: 'FOCO ' + name, url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in the browser)', browserRequirements: 'Requires JavaScript', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: plain(p.lede), publisher: { '@id': 'https://www.tryfoco.com/#organization' } },
    { '@type': 'FAQPage', mainEntity: faqSchema(p.faq) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tryfoco.com/' },
      { '@type': 'ListItem', position: 2, name: 'Visual Timer', item: HUB },
      { '@type': 'ListItem', position: 3, name, item: url }] },
  ] };
  const head = '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n<meta name="robots" content="index, follow, max-image-preview:large">\n<link rel="canonical" href="' + url + '">\n'
    + '<meta property="og:type" content="website">\n<meta property="og:site_name" content="FOCO">\n<meta property="og:title" content="' + esc(name) + '">\n<meta property="og:description" content="' + esc(plain(p.lede)) + '">\n<meta property="og:url" content="' + url + '">\n'
    + '<meta property="og:image" content="' + ogImage + '">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(name) + '">\n<meta name="twitter:image" content="' + ogImage + '">\n'
    + '<link rel="icon" id="fav" href="https://www.tryfoco.com/wp-content/uploads/2026/05/cropped-App-Icon-scaled-1-32x32.png" sizes="32x32">\n<script type="application/ld+json">' + JSON.stringify(schema) + '</script>';
  const intro = '<span class="vt-eyebrow">Free ADHD tool</span>\n      <h1 id="vt-h1"><span class="vt-line">' + p.m + ' minute</span> <span class="vt-line vt-accent">visual timer.</span></h1>\n      <p class="vt-lede">' + p.lede + '</p>';
  const others = PRESETS.filter((o) => o.m !== p.m).map((o) => '<a href="' + HUB + o.slug + '/">' + o.label + '</a>').join('') + '<a href="' + HUB + '">Any length</a>';
  const body = p.body.map(([h2, ps], i) => '\n    <h2 id="vt-b' + i + '">' + esc(h2) + '</h2>\n' + ps.map((t) => '    <p>' + t + '</p>').join('\n')).join('\n');
  const dock = '';
  const read = '<section class="vt-read" aria-labelledby="vt-good-h">\n  <div class="vt-wrap vt-read-in">\n  <div class="vt-read-col">\n    <h2 id="vt-good-h">What is a ' + p.label.replace(/s$/, '') + ' timer good for?</h2>\n    <ul class="vt-uses">' + p.uses.map((u) => '<li>' + u + '</li>').join('') + '</ul>' + body
    + '\n\n    <h2 id="vt-len-h">Other visual timer lengths</h2>\n    <p class="vt-lengths">' + others + '</p>\n  </div>\n  ' + dock + '\n  </div>\n</section>';
  return { '{{VT:HEAD}}': head, '{{VT:INTRO}}': intro, '{{VT:READ}}': read, '{{VT:FAQ}}': '<div id="vt-faq-items">' + faqItems(p.faq) + '</div>', '{{VT:PRESET}}': '<script>window.VT_PRESET = ' + p.m + ';</script>' };
}
function split(hub) {
  const vars = {};
  const tpl = hub.replace(/<!--VT:(\w+)-->([\s\S]*?)<!--\/VT:\1-->/g, (m, name, inner) => { vars['{{VT:' + name + '}}'] = inner; return '{{VT:' + name + '}}'; });
  if (Object.keys(vars).length !== 5) throw new Error('expected 5 regions, found ' + Object.keys(vars).length);
  return { tpl, vars };
}
const fill = (tpl, vars) => tpl.replace(/\{\{VT:\w+\}\}/g, (k) => vars[k]);
function check(html, label) {
  if (/—/.test(html)) throw new Error(label + ': em dash');
  if (/\{\{VT:/.test(html)) throw new Error(label + ': unfilled region');
  JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) throw new Error(label + ': needs exactly one h1');
}
function snippetCode(tpl, pages) {
  if (tpl.includes('FOCOVT') || JSON.stringify(pages).includes('FOCOVTDATA')) throw new Error('heredoc marker found inside the document');
  return `// FOCO visual timer: serves the standalone timer for the hub (/${SLUG}/) and its preset pages instead of the theme.
// Generated by tools/visual-timer/deploy/deploy.js. Deactivate this snippet to roll back.
add_action('template_redirect', function () {
\tif (!is_page()) { return; }
\t$pages = json_decode(<<<'FOCOVTDATA'
${JSON.stringify(pages)}
FOCOVTDATA, true);
\t$id = (string) get_queried_object_id();
\tif (!isset($pages[$id])) { return; }
\t$tpl = <<<'FOCOVT'
${tpl}
FOCOVT;
\tstatus_header(200);
\theader('Content-Type: text/html; charset=utf-8');
\t$html = strtr($tpl, $pages[$id]);
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

// ---------- 4. pages and their SEO fields (RankMath feeds the sitemap; the document carries its own head) ----------
async function ensurePage(slug, title, parent, meta) {
  const found = await wp('GET', '/wp-json/wp/v2/pages?slug=' + slug + (parent ? '&parent=' + parent : '') + '&status=any&_fields=id,status,link');
  const content = '<!-- wp:paragraph --><p>Served by the "FOCO visual timer" Code Snippet. Edit tools/visual-timer in the repo, then run deploy.js.</p><!-- /wp:paragraph -->';
  const body = { title, slug, content, comment_status: 'closed', ping_status: 'closed', parent: parent || 0 };
  if (PUBLISH) body.status = 'publish';
  let res;
  if (found.json && found.json[0]) res = await wp('POST', '/wp-json/wp/v2/pages/' + found.json[0].id, body);
  else res = await wp('POST', '/wp-json/wp/v2/pages', { ...body, status: PUBLISH ? 'publish' : 'draft' });
  if (res.status >= 300) throw new Error('page failed (' + slug + '): ' + res.status + ' ' + res.text.slice(0, 200));
  await wp('POST', '/wp-json/rankmath/v1/updateMeta', { objectID: res.json.id, objectType: 'post', meta });
  console.log('page: #' + res.json.id + ' ' + res.json.status + ' ' + res.json.link);
  return res.json;
}
async function pushSnippet(code) {
  const list = await wp('GET', '/wp-json/code-snippets/v1/snippets');
  const existing = (list.json || []).find((s) => s.name === SNIPPET_NAME);
  const body = { name: SNIPPET_NAME, desc: 'Serves tryfoco.com/' + SLUG + '/ and its preset pages (the visual timer tool) instead of the theme. Source: tools/visual-timer. Deactivate to roll back.', scope: 'front-end', active: true, code };
  const res = await wp(existing ? 'PUT' : 'POST', '/wp-json/code-snippets/v1/snippets' + (existing ? '/' + existing.id : ''), body);
  console.log('snippet: HTTP ' + res.status + ' | id ' + (res.json && res.json.id) + ' | active ' + (res.json && res.json.active) + ' | code_error ' + JSON.stringify(res.json && res.json.code_error) + ' | ' + Math.round(code.length / 1024) + ' KB');
  if (res.status >= 300 || (res.json && res.json.code_error)) throw new Error('snippet failed');
}

(async () => {
  const map = BUILD_ONLY ? Object.assign({}, KNOWN, { 'img/foco-focus.png': '../img/foco-focus.png', 'img/foco-done.png': '../img/foco-done.png' }, fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {}) : await uploadMedia();
  const { tpl, vars: hubVars } = split(buildHub(map));
  const og = map['img/og-visual-timer.png'];
  const docs = { hub: hubVars };
  for (const p of PRESETS) docs[p.slug] = presetVars(p, hubVars, og);
  for (const [k, v] of Object.entries(docs)) check(fill(tpl, v), k);
  if (BUILD_ONLY) {
    for (const k of ['hub', '5-minute']) fs.writeFileSync(path.join(__dirname, 'preview-' + k + '.html'), fill(tpl, docs[k]));
    fs.writeFileSync(SNIPPET_FILE, '<?php\n' + snippetCode(tpl, { 0: hubVars }));
    console.log('built ' + (Object.keys(docs).length) + ' documents; previews in deploy/preview-hub.html and preview-5-minute.html');
    return;
  }
  const hub = await ensurePage(SLUG, 'Visual Timer: Free Online Countdown You Can See', 0, {
    rank_math_focus_keyword: 'visual timer,online visual timer,visual timer adhd,adhd visual timer',
    rank_math_title: 'Visual Timer: Free Online Countdown You Can See | FOCO',
    rank_math_description: 'A free visual timer: the colour shrinks as time passes. Presets, full screen, halfway cues and brown noise, made for focus and ADHD. No sign-up.',
  });
  const pages = { [hub.id]: hubVars };
  for (const p of PRESETS) {
    const name = p.m + ' Minute Visual Timer';
    const page = await ensurePage(p.slug, name + ': Free Online Countdown', hub.id, {
      rank_math_focus_keyword: p.m + ' minute visual timer,' + p.m + ' minute timer',
      rank_math_title: name + ': Free Online Countdown | FOCO',
      rank_math_description: plain(p.lede).slice(0, 158),
    });
    pages[page.id] = docs[p.slug];
  }
  const code = snippetCode(tpl, pages);
  fs.writeFileSync(SNIPPET_FILE, '<?php\n' + code);
  await pushSnippet(code);
  console.log('\nDone. ' + Object.keys(pages).length + ' pages served.');
})().catch((e) => { console.error('DEPLOY FAILED:', e.message); process.exit(1); });
