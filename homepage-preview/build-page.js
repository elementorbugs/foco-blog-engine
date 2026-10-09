// Builds the homepage from homepage-preview/index.html into a WP page.
// Usage: node homepage-preview/build-page.js <.env> <index.html> <media-map.json> [--push] [--live]
//   --push           -> writes the draft page /home-draft/ (noindex), for review
//   --push --live    -> writes the live front page (page_on_front), keeps its title and indexing
// The live homepage is page 4760, whose slug is still "home-preview": never look pages up by that slug.
const fs = require('fs'), https = require('https');
for (const l of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const req = (m, p, o) => new Promise(r => { const b = o ? JSON.stringify(o) : ''; const q = https.request({ hostname: WP_HOST, path: p, method: m, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { r({ s: x.statusCode, j: JSON.parse(d) }); } catch (e) { r({ s: x.statusCode, j: d.slice(0, 200) }); } }); }); q.end(b); });

const html = fs.readFileSync(process.argv[3], 'utf8');
const media = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
let css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

// strip preview-only chrome (the real site has its own nav and footer)
body = body.replace(/<nav class="nav">[\s\S]*?<\/nav>/, '').replace(/<footer>[\s\S]*?<\/footer>/, '').replace(/<div class="pv-note">[\s\S]*?<\/div>/, '');
for (const [k, v] of Object.entries(media)) body = body.split(k).join(v);
if (/assets\//.test(body)) throw new Error('unmapped asset path');

// scope CSS under .fh and make every declaration !important so theme rules can't recolor or resize it
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
const scopeSel = sel => sel.split(',').map(s => {
  s = s.trim();
  if (s === ':root' || s === 'body') return '.fh';
  if (s === 'html') return null;
  if (s === '*') return '.fh *';
  return '.fh ' + s;
}).filter(Boolean).join(',');
const important = decls => decls.split(';').map(d => d.trim()).filter(Boolean).map(d => /^--/.test(d) || /!important$/.test(d) ? d : d + ' !important').join(';');
function scope(block) {
  let out = '', i = 0;
  while (i < block.length) {
    const open = block.indexOf('{', i); if (open < 0) break;
    const head = block.slice(i, open).trim();
    if (head.startsWith('@media')) {
      let depth = 1, j = open + 1; while (depth && j < block.length) { if (block[j] === '{') depth++; else if (block[j] === '}') depth--; j++; }
      out += head + '{' + scope(block.slice(open + 1, j - 1)) + '}'; i = j; continue;
    }
    const close = block.indexOf('}', open);
    const sel = scopeSel(head); const decls = block.slice(open + 1, close);
    if (sel) out += sel + '{' + (sel === '.fh' ? decls.trim() : important(decls)) + '}';
    i = close + 1;
  }
  return out;
}
css = scope(css);
// .fh base: own colors + full-bleed breakout out of the 820px page column
css += '.fh h1,.fh h2,.fh h3,.fh p,.fh li,.fh summary{color:var(--ink) !important}.fh .sub,.fh .vig p,.fh .feature p,.fh .demo-card p,.fh .stat p,.fh details p,.fh .quote .who{color:var(--muted) !important}.fh .quote p{color:var(--ink-2) !important}.fh .dark h2,.fh .dark h3,.fh .dark li{color:#fff !important}.fh .dark p,.fh .dark .sub{color:#C9C1DA !important}.fh .final h2{color:#fff !important}.fh .final .sub{color:#E7E0F5 !important}.fh .plan.best,.fh .plan.best li,.fh .plan.best div{color:#fff !important}.fh .plan.best ul li{color:#E7E0F5 !important}';
css += '.fh{color:var(--ink) !important;background:var(--bg) !important;width:100vw !important;margin-left:calc(50% - 50vw) !important;font-family:Inter,system-ui,sans-serif !important;line-height:1.55 !important}';
// inline styles -> !important too, so they still beat the class rules above
body = body.replace(/style="([^"]*)"/g, (a, d) => 'style="' + important(d) + '"');

(async () => {
  const live = process.argv.includes('--live');
  const frontId = Number((await req('GET', '/wp-json/wp/v2/settings')).j.page_on_front);
  if (!frontId) throw new Error('could not read page_on_front');
  let page;
  if (live) page = { id: frontId };
  else {
    page = (await req('GET', '/wp-json/wp/v2/pages?slug=home-draft&status=any&_fields=id,status,link')).j[0];
    if (!page) page = (await req('POST', '/wp-json/wp/v2/pages', { title: 'FOCO Home Draft', slug: 'home-draft', status: 'draft', content: '' })).j;
    if (page.id === frontId) throw new Error('draft target is the live front page');
  }
  const id = page.id;
  const pageCss = `body.page-id-${id}{overflow-x:hidden !important}body.page-id-${id} .blog-single>.wrap{max-width:none !important;padding-left:0 !important;padding-right:0 !important}body.page-id-${id} .blog-single>.wrap>h1{display:none !important}body.page-id-${id} .foco-app,html:has(body.page-id-${id}){background:#FAF8FD !important}body.page-id-${id} .blog-single{background:#FAF8FD !important;padding-bottom:0 !important;padding-top:70px !important;max-width:none !important;width:100% !important}body.page-id-${id} .blog-single>.wrap>article{margin:0 !important;padding:0 !important}body.page-id-${id} .foco-app .foco-nav,body.page-id-${id} .foco-app .foco-nav.scrolled{background:rgba(250,248,253,.9) !important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid #E7E0F5 !important;padding:12px 0 !important}body.page-id-${id} .foco-app .foco-nav .nav-links a{color:#3B2A63 !important}body.page-id-${id} .foco-app .foco-nav .nav-links a:hover{color:#6D28D9 !important}body.page-id-${id} .foco-app .foco-nav.open .nav-links a{color:#fff !important}body.page-id-${id} .foco-app .foco-nav-toggle{background:#fff !important;border-color:#E7E0F5 !important}body.page-id-${id} .foco-app .foco-nav-toggle span{background:#1E1733 !important}.fh .hero{position:relative !important}.fh .hero::before{display:none !important}.fh .hero-visual{order:2 !important;min-height:0 !important}`;
  const block = `<!-- wp:html --><div class="fh"><style>${(css + pageCss).replace(/\s*\n\s*/g, ' ')}</style>${body.replace(/\s*\n\s*/g, ' ')}</div><!-- /wp:html -->`;
  if (/&&/.test(block)) throw new Error('&& in block');
  fs.writeFileSync(__dirname + '/hp-page-content.html', block);
  console.log('page', id, '| content', block.length, 'chars');
  if (!process.argv.includes('--push')) return;
  if (live) {
    const prev = (await req('GET', `/wp-json/wp/v2/pages/${id}?context=edit&_fields=content`)).j;
    const bk = require('path').join(__dirname, '..', '.audit-cache', 'backups');
    if (fs.existsSync(bk) && prev.content) fs.writeFileSync(require('path').join(bk, `homepage-${id}-${Date.now()}.html`), prev.content.raw);
    const u = await req('POST', `/wp-json/wp/v2/pages/${id}`, { content: block });
    console.log('live homepage updated', u.s);
    return;
  }
  const u = await req('POST', `/wp-json/wp/v2/pages/${id}`, { content: block, status: 'publish', title: 'FOCO Home Draft' });
  console.log('draft page', u.s, u.j.link);
  const m = await req('POST', '/wp-json/rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'nofollow'] } });
  console.log('noindex', m.s);
})();
