#!/usr/bin/env node
// regenerate-covers.js - re-render a post's cover and update its featured_media,
// WITHOUT touching post content. Surgical alternative to a full create-post.js re-run.
//
// Usage:
//   node regenerate-covers.js "slug=Title Line\nSecond Line" ["slug2=..."] ...
//   node regenerate-covers.js --dry-run "slug=..."   (render PNG locally, no upload)
//
// The title may contain a literal "\n" (two chars, as the shell passes it inside
// double quotes); it is normalized to a real line break - same fix as create-post.js.

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

// ── env ──────────────────────────────────────────────────────────────────────
const ENV = {};
for (const f of [path.join(__dirname, '.env'), path.join(__dirname, '..', '.foco-config', 'wp-creds.env')]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && ENV[m[1]] === undefined) ENV[m[1]] = m[2];
  }
}
const WP_HOST = process.env.WP_HOST || ENV.WP_HOST || 'tryfoco.com';
const WP_USER = process.env.WP_USER || ENV.WP_USER;
const WP_PASS = process.env.WP_APP_PASSWORD || ENV.WP_APP_PASSWORD || ENV.WP_PASS;
if (!WP_USER || !WP_PASS) { console.error('WP_USER + WP_APP_PASSWORD required in .env'); process.exit(1); }
const auth = Buffer.from(WP_USER + ':' + WP_PASS).toString('base64');

// ── cover styling (mirrors create-post.js) ───────────────────────────────────
const C = { bg: '#040208', bg2: '#0a0410', primary: '#7C3AED', primary2: '#A78BFA', text: '#FFFFFF' };
const MASCOT_DIR = path.join(__dirname, 'assets', 'mascots');
const DEFAULT_MASCOT = 'foco_state_1_presence';
const COVERS_DIR = path.join(__dirname, 'covers-new');
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

function coverHtml(title, mascotPath) {
  const mascotUri = 'file:///' + mascotPath.replace(/\\/g, '/');
  // Normalize literal backslash-n (shell-passed) into a real newline before split.
  const titleHtml = title.replace(/\\n/g, '\n').split('\n').map(l => `<span>${l}</span>`).join('<br>');
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
<div class="title-wrap"><div class="title">${titleHtml}</div></div>
<div class="brand"><span class="logo-mark">F</span><span class="logo-text">FOCO</span></div>
</div></body></html>`;
}

// ── WP helpers ────────────────────────────────────────────────────────────────
function wpReq(method, p, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request({ hostname: WP_HOST, path: p, method, headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, data: d }); } });
    });
    r.on('error', reject); if (payload) r.write(payload); r.end();
  });
}
function wpUpload(filePath, filename) {
  return new Promise((resolve, reject) => {
    const buf = fs.readFileSync(filePath);
    const r = https.request({
      hostname: WP_HOST, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buf.length },
    }, res => { let c = []; res.on('data', d => c.push(d)); res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(c).toString()) }); } catch { resolve({ status: res.statusCode, data: Buffer.concat(c).toString().slice(0, 300) }); } }); });
    r.on('error', reject); r.write(buf); r.end();
  });
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  const dryRun = process.argv.includes('--dry-run');
  const pairs = process.argv.slice(2).filter(a => !a.startsWith('--')).map(a => {
    const i = a.indexOf('='); return { slug: a.slice(0, i).trim(), title: a.slice(i + 1) };
  });
  if (!pairs.length) { console.error('Provide at least one "slug=Title\\nLine" argument.'); process.exit(1); }

  const browser = await chromium.launch();
  for (const { slug, title } of pairs) {
    // Find the post by slug (any status) to get its id.
    const found = await wpReq('GET', `/wp-json/wp/v2/posts?slug=${slug}&status=publish,future,draft&context=edit&_fields=id,slug`);
    const post = Array.isArray(found.data) && found.data[0];
    if (!post) { console.log(`✗ ${slug}: not found in WP, skipping`); continue; }

    const mascotPath = path.join(MASCOT_DIR, DEFAULT_MASCOT + '.png');
    const htmlPath = path.join(COVERS_DIR, `cover-${slug}.html`);
    const pngPath = path.join(COVERS_DIR, `cover-${slug}.png`);
    fs.writeFileSync(htmlPath, coverHtml(title, mascotPath));

    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto('file:///' + htmlPath.replace(/\\/g, '/'));
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: pngPath, type: 'png' });
    await ctx.close();
    const kb = (fs.statSync(pngPath).size / 1024).toFixed(0);

    if (dryRun) { console.log(`• ${slug}: rendered ${pngPath} (${kb}KB) | lines: "${title.replace(/\\n/g, ' / ')}" [dry-run, no upload]`); continue; }

    const up = await wpUpload(pngPath, `cover-${slug}.png`);
    if (up.status !== 201) { console.log(`✗ ${slug}: upload failed (${up.status})`); continue; }
    const mediaId = up.data.id;
    // Set alt text including the title, then attach as featured image.
    await wpReq('POST', `/wp-json/wp/v2/media/${mediaId}`, { alt_text: title.replace(/\\n/g, ' ') + ' - FOCO' });
    const set = await wpReq('POST', `/wp-json/wp/v2/posts/${post.id}`, { featured_media: mediaId });
    console.log(`✓ ${slug} (post #${post.id}): cover ${kb}KB, media #${mediaId}, featured_media ${set.status === 200 ? 'set' : 'FAILED(' + set.status + ')'} | lines: "${title.replace(/\\n/g, ' / ')}"`);
  }
  await browser.close();
})();
