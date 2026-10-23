// Builds /features/ (page 1157) from features-page/index.html on top of the homepage design system.
// Usage: node features-page/build.js            -> writes features-page/preview.html + page-content.html only
//        node features-page/build.js --live     -> also backs up the live content and pushes page 1157
// Shared CSS (tokens, hero, feature rows, phone frames, faq, final CTA) is read from homepage-preview/index.html,
// so a homepage design change carries over on the next build.
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.join(__dirname, '..');
const PAGE_ID = 1157;
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const req = (m, p, o) => new Promise(r => { const b = o ? JSON.stringify(o) : ''; const q = https.request({ hostname: WP_HOST, path: p, method: m, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { r({ s: x.statusCode, j: JSON.parse(d) }); } catch (e) { r({ s: x.statusCode, j: d.slice(0, 200) }); } }); }); q.end(b); });

const hp = fs.readFileSync(path.join(ROOT, 'homepage-preview/index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'homepage-preview/media-map.json'), 'utf8'));
const appStoreSvg = hp.match(/<svg class="badge"[\s\S]*?<\/svg>/)[0];
const rawCss = hp.match(/<style>([\s\S]*?)<\/style>/)[1] + '\n' + src.match(/<style>([\s\S]*?)<\/style>/)[1];
let body = src.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<!--[\s\S]*?-->/g, '');
body = body.split(/<img class="badge" src="assets\/badge-app-store.svg"[^>]*>/).join(appStoreSvg);
for (const [k, v] of Object.entries(media)) body = body.split(k).join(v);
if (/assets\//.test(body)) throw new Error('unmapped asset path');
if (/—/.test(body)) throw new Error('em dash in body');

// local preview: unscoped CSS, same body
fs.writeFileSync(path.join(__dirname, 'preview.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@500;600;700&display=swap" rel="stylesheet"><style>${rawCss}</style></head><body>${body}</body></html>`);

// scope CSS under .fh and make every declaration !important so theme rules can't recolor or resize it (same as the homepage build)
let css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
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
css += '.fh h1,.fh h2,.fh h3,.fh p,.fh li,.fh summary{color:var(--ink) !important}.fh .sub,.fh .feature p,.fh .demo-card p,.fh details p,.fh .ftile p,.fh .tool p{color:var(--muted) !important}.fh .dark h2,.fh .dark h3,.fh .dark li{color:#fff !important}.fh .dark p,.fh .dark .sub{color:#C9C1DA !important}.fh .final h2{color:#fff !important}.fh .final .sub{color:#E7E0F5 !important}.fh details a,.fh .ftile .go{color:var(--primary-d) !important}';
css += '.fh{color:var(--ink) !important;background:var(--bg) !important;width:100vw !important;margin-left:calc(50% - 50vw) !important;font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif !important;line-height:1.55 !important}.fh [id]{scroll-margin-top:96px}';
// prefix every rule with .blog-single article: (0,3,x) outranks snippet #12's light-page rules (0,2,2) in case they
// reach this page again (a stale cached copy, or 1157 dropping out of EXCLUDE in build-light-pages-snippet.js)
css = css.replace(/(^|[{},])\s*\.fh\b/g, (m, p) => p + '.blog-single article .fh');
body = body.replace(/style="([^"]*)"/g, (a, d) => 'style="' + important(d) + '"');

const id = PAGE_ID;
const pageCss = `body.page-id-${id}{overflow-x:hidden !important}body.page-id-${id} .blog-single>.wrap{max-width:none !important;padding-left:0 !important;padding-right:0 !important}body.page-id-${id} .blog-single>.wrap>h1{display:none !important}body.page-id-${id} .foco-app,html:has(body.page-id-${id}){background:#FAF8FD !important}body.page-id-${id} .blog-single{background:#FAF8FD !important;padding-bottom:0 !important;padding-top:70px !important;max-width:none !important;width:100% !important}body.page-id-${id} .blog-single>.wrap>article{margin:0 !important;padding:0 !important;max-width:none !important}body.page-id-${id} .foco-app .foco-nav,body.page-id-${id} .foco-app .foco-nav.scrolled{background:rgba(250,248,253,.9) !important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid #E7E0F5 !important;padding:12px 0 !important}body.page-id-${id} .foco-app .foco-nav .nav-links a{color:#3B2A63 !important}body.page-id-${id} .foco-app .foco-nav .nav-links a:hover{color:#6D28D9 !important}body.page-id-${id} .foco-app .foco-nav.open .nav-links a{color:#fff !important}body.page-id-${id} .foco-app .foco-nav-toggle{background:#fff !important;border-color:#E7E0F5 !important}body.page-id-${id} .foco-app .foco-nav-toggle span{background:#1E1733 !important}.fh .hero{position:relative !important}.fh .hero::before{display:none !important}.fh .hero-visual{order:2 !important;min-height:0 !important}`;
const block = `<!-- wp:html --><div class="fh"><style>${(css + pageCss).replace(/\s*\n\s*/g, ' ')}</style>${body.replace(/\s*\n\s*/g, ' ')}</div><!-- /wp:html -->`;
if (/&&/.test(block)) throw new Error('&& in block');
fs.writeFileSync(path.join(__dirname, 'page-content.html'), block);
console.log('page', id, '| content', block.length, 'chars | preview: features-page/preview.html');

(async () => {
  if (!process.argv.includes('--live')) return;
  const prev = (await req('GET', `/wp-json/wp/v2/pages/${id}?context=edit&_fields=content`)).j;
  if (!prev.content) throw new Error('could not read current content');
  const bk = path.join(ROOT, '.audit-cache', 'backups');
  fs.mkdirSync(bk, { recursive: true });
  const bkFile = path.join(bk, `features-${id}-${Date.now()}.html`);
  fs.writeFileSync(bkFile, prev.content.raw);
  console.log('backup', bkFile);
  const u = await req('POST', `/wp-json/wp/v2/pages/${id}`, { content: block });
  console.log('features page updated', u.s);
  const m = await req('POST', '/wp-json/rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_description: 'What the FOCO ADHD app does: AI task breakdown, voice and photo capture, a built-in calendar, focus mode with an AI companion, and progress stats.' } });
  console.log('meta description', m.s);
})();
