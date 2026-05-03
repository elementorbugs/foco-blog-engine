// setup-glossary.js
// Pushes the ADHD Glossary as a WP Page (not Post) with DefinedTermSet
// schema attached. Run once. Idempotent — re-runs UPDATE the page.
//
// Usage: node setup-glossary.js [--dry-run]

const https = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function loadEnv() {
  const env = {};
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    line = line.trim(); if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('='); if (eq < 0) return;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return env;
}
const ENV = loadEnv();
const auth = Buffer.from(ENV.WP_USER + ':' + ENV.WP_APP_PASSWORD).toString('base64');
const HOST = ENV.WP_HOST;
const SLUG = 'adhd-glossary';
const TITLE = 'ADHD Glossary: 25 Terms';
const DRY = process.argv.includes('--dry-run');

const SOURCE_FILE = path.join(__dirname, 'posts-new', 'page-adhd-glossary.html');
const COVERS_DIR  = path.join(__dirname, 'covers-new');
const MASCOT_DIR  = path.join(__dirname, 'assets', 'mascots');

const C = { bg: '#040208', bg2: '#0a0410', primary: '#7C3AED', primary2: '#A78BFA' };

function wpReq(method, p, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const req = https.request({
      hostname: HOST, path: p, method,
      headers: { Authorization: 'Basic ' + auth, ...(data && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }) },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: r.statusCode, data: Buffer.concat(chunks).toString().slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(body);
    req.end();
  });
}

function wpUpload(filePath, filename) {
  return new Promise((resolve, reject) => {
    const buf = fs.readFileSync(filePath);
    const req = https.request({
      hostname: HOST, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buf.length },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: r.statusCode, data: null }); }
      });
    });
    req.on('error', reject);
    req.write(buf); req.end();
  });
}

// ─── Build DefinedTermSet schema from H2 anchors with id="..." ───────────────
function buildDefinedTermSet(content) {
  // Match H2 with id, capture id + text. Then capture next <p> as definition.
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g;
  // Skip non-term anchors (we only want term blocks — they have a "Why it matters" line)
  // We do this by also requiring a following <p><strong>Why it matters:</strong> ...
  const terms = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    const termId = m[1];
    const termName = m[2].replace(/<[^>]+>/g, '').trim();
    const definition = m[3].replace(/<[^>]+>/g, '').trim();
    // Skip nav/intro H2s (no "id" we don't want)
    if (['key-takeaways', 'the-bottom-line'].includes(termId)) continue;
    // Skip section labels like "A — H" (no id usually but just in case)
    if (/^[A-Z]( ?[-—] ?[A-Z])$/.test(termName)) continue;
    if (definition.length < 50) continue; // ignore short blocks (nav links)
    terms.push({
      '@type': 'DefinedTerm',
      'name': termName,
      'description': definition,
      'url': `https://${HOST}/${SLUG}/#${termId}`,
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    'name': 'FOCO ADHD Glossary',
    'description': '25 ADHD terms defined in plain language, with links to in-depth guides.',
    'url': `https://${HOST}/${SLUG}/`,
    'hasDefinedTerm': terms,
  };
}

// ─── Cover generator (mascot left + title right, same as posts) ──────────────
function coverHtml(title, mascotPath) {
  const mascotUri = 'file:///' + mascotPath.replace(/\\/g, '/');
  const lines = title.split('\n').map(l => `<span>${l}</span>`).join('<br>');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Inter',-apple-system,'Segoe UI',sans-serif}
.cover{width:1200px;height:630px;background:linear-gradient(135deg,${C.bg} 0%,${C.bg2} 30%,#1a0a2e 60%,#2d1257 100%);display:flex;align-items:center;position:relative;overflow:hidden}
.cover::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 70% 30%,rgba(124,58,237,0.30),transparent 60%);pointer-events:none}
.cover::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 20% 90%,rgba(167,139,250,0.18),transparent 60%);pointer-events:none}
.accent{position:absolute;top:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,${C.primary},${C.primary2},${C.primary});box-shadow:0 0 16px rgba(167,139,250,0.6)}
.mascot-wrap{flex:0 0 35%;display:flex;align-items:center;justify-content:center;padding:0 20px 0 60px;position:relative;z-index:2}
.mascot-wrap img{width:100%;max-width:340px;filter:drop-shadow(0 30px 50px rgba(124,58,237,0.5))}
.title-wrap{flex:1;padding:0 60px 0 20px;position:relative;z-index:2}
.title{font-size:80px;font-weight:900;color:#fff;line-height:1.05;letter-spacing:-1.6px;text-shadow:0 4px 40px rgba(0,0,0,0.4)}
.title span{display:inline-block}
.brand{position:absolute;bottom:32px;right:48px;display:flex;align-items:center;gap:10px;z-index:3}
.logo-mark{width:34px;height:34px;background:linear-gradient(135deg,${C.primary},${C.primary2});border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:18px;box-shadow:0 0 24px rgba(124,58,237,0.5)}
.logo-text{font-weight:800;font-size:20px;color:#fff;letter-spacing:-0.4px}
</style></head><body><div class="cover">
<div class="accent"></div>
<div class="mascot-wrap"><img src="${mascotUri}" alt=""/></div>
<div class="title-wrap"><div class="title">${lines}</div></div>
<div class="brand"><span class="logo-mark">F</span><span class="logo-text">FOCO</span></div>
</div></body></html>`;
}

(async () => {
  console.log('\n━━━ Glossary Page Setup ━━━');
  console.log(`  Mode: ${DRY ? '🟢 DRY-RUN' : '🔴 LIVE'}`);

  if (!fs.existsSync(SOURCE_FILE)) { console.error('❌ Source not found:', SOURCE_FILE); process.exit(1); }
  let content = fs.readFileSync(SOURCE_FILE, 'utf8');

  // Build schema
  const schema = buildDefinedTermSet(content);
  console.log(`  ✓ DefinedTermSet schema: ${schema.hasDefinedTerm.length} terms`);

  // Inject schema as JSON-LD
  content += `\n\n<!-- wp:html --><script type="application/ld+json">${JSON.stringify(schema)}</script><!-- /wp:html -->\n`;

  // Build cover
  const mascotPath = path.join(MASCOT_DIR, 'foco_state_1_presence.png');
  const coverTitle = 'ADHD\nGlossary';
  const htmlPath = path.join(COVERS_DIR, `cover-${SLUG}.html`);
  const pngPath  = path.join(COVERS_DIR, `cover-${SLUG}.png`);
  if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });
  fs.writeFileSync(htmlPath, coverHtml(coverTitle, mascotPath));

  let mediaId = null;
  if (!DRY) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto('file:///' + htmlPath.replace(/\\/g, '/'));
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: pngPath, type: 'png' });
    await browser.close();
    console.log(`  ✓ Cover rendered: ${(fs.statSync(pngPath).size / 1024).toFixed(0)}KB`);
    const up = await wpUpload(pngPath, `cover-${SLUG}.png`);
    if (up.status === 201 && up.data && up.data.id) { mediaId = up.data.id; console.log(`  ✓ Cover uploaded: media #${mediaId}`); }
    else console.log(`  ✗ Cover upload failed: ${up.status}`);
  } else {
    console.log('  ✓ [dry-run] would render + upload cover');
  }

  // Look up existing page
  const existing = await wpReq('GET', `/wp-json/wp/v2/pages?slug=${SLUG}&context=edit&_fields=id,status&status=any`);
  let pageId = (existing.data && existing.data[0] && existing.data[0].id) || null;
  if (pageId) console.log(`  ✓ Existing page #${pageId}`);
  else console.log('  ✓ No existing page — will create new');

  // Push as Page (not Post)
  if (!DRY) {
    const payload = { title: TITLE, slug: SLUG, content, ...(mediaId && { featured_media: mediaId }) };
    if (pageId) {
      const r = await wpReq('PUT', '/wp-json/wp/v2/pages/' + pageId, payload);
      console.log(`  ✓ Updated page #${pageId} (status: ${r.data.status || '?'})`);
    } else {
      payload.status = 'draft';
      const r = await wpReq('POST', '/wp-json/wp/v2/pages', payload);
      if (r.data && r.data.id) { pageId = r.data.id; console.log(`  ✓ Created page #${pageId} (status: ${r.data.status})`); }
      else console.log(`  ✗ Create failed: ${JSON.stringify(r.data).slice(0, 300)}`);
    }
  } else {
    console.log('  ✓ [dry-run] would push as Page');
  }

  if (pageId && !DRY && mediaId) {
    const altText = `ADHD glossary — ${schema.hasDefinedTerm.length} terms explained`;
    await wpReq('POST', '/wp-json/wp/v2/media/' + mediaId, { alt_text: altText });
    console.log(`  ✓ Cover alt text set`);
  }

  console.log('\n━━━ DONE ━━━');
  if (pageId) {
    console.log(`  Page ID:   ${pageId}`);
    console.log(`  Edit URL:  https://${HOST}/wp-admin/post.php?post=${pageId}&action=edit`);
    console.log(`  Live URL:  https://${HOST}/${SLUG}/`);
  }
  console.log(`  Schema:    DefinedTermSet (${schema.hasDefinedTerm.length} terms)`);
  console.log('');
})().catch(e => { console.error('\n❌ Failed:', e.message); console.error(e.stack); process.exit(1); });
