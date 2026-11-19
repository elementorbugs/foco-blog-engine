// Redesign the download boxes on /get-foco/ (page 1152) and fix the pricing claims on it.
// Usage: node homepage-preview/get-foco-redesign.js [--dry]   (backs up the live content first)
const fs = require('fs'), https = require('https');
for (const l of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = 'Basic ' + Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const DRY = process.argv.includes('--dry');
function rq(method, path, body, headers) { return new Promise((res, rej) => { const q = https.request({ hostname: WP_HOST, path, method, headers: Object.assign({ Authorization: auth }, headers || {}) }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res({ s: r.statusCode, j: JSON.parse(d) }) } catch (e) { res({ s: r.statusCode, j: d.slice(0, 300) }) } }) }); q.on('error', rej); if (body) q.write(body); q.end(); }); }
async function upload(file, name, type) { const b = fs.readFileSync(file); const r = await rq('POST', '/wp-json/wp/v2/media', b, { 'Content-Type': type, 'Content-Disposition': 'attachment; filename="' + name + '"', 'Content-Length': b.length }); if (r.s >= 300) throw new Error('upload ' + r.s); return r.j.source_url; }

(async () => {
  const g = await rq('GET', '/wp-json/wp/v2/pages/1152?context=edit');
  let s = g.j.content.raw;
  fs.writeFileSync('homepage-backup/get-foco-1152-2026-11-19-pre-redesign.html', s);

  // official App Store badge SVG from the homepage, Google Play badge image already in the media library
  const home = fs.readFileSync('homepage-backup/page-4760-2026-11-19-pre-night.html', 'utf8');
  const apple = home.match(/<svg class="badge" viewBox="0 0 119\.66407 40"[\s\S]*?<\/svg>/)[0].replace('class="badge"', 'class="b-img"');
  const gplay = '<img class="b-img" src="https://www.tryfoco.com/wp-content/uploads/2026/10/foco-badge-google-play.png" alt="Get it on Google Play" width="568" height="172">';
  const MURL = process.env.MASCOT_URL || (DRY ? 'MASCOT' : await upload('C:/Users/USER/AppData/Local/Temp/claude/d9ac8dfd3e24d6bd/064f2bbd-5bfe-4fd3-b7a6-91aba9d55a93/scratchpad/foco-home/a/alignment.webp', 'foco-alignment.webp', 'image/webp'));

  const CSS = '.foco-get{position:relative;overflow:hidden;margin:8px 0 34px;padding:40px 40px;border-radius:26px;background:radial-gradient(70% 90% at 85% 40%,rgba(124,58,237,.42),transparent 70%),radial-gradient(60% 80% at 0% 100%,rgba(167,139,250,.14),transparent 70%),#0b0912;border:1px solid rgba(167,139,250,.3);box-shadow:0 30px 80px -30px rgba(76,29,149,.6);display:grid;grid-template-columns:1.25fr .75fr;gap:24px;align-items:center}'
    + '.foco-get h2.g-t{color:#fff!important;font-size:30px!important;line-height:1.2!important;margin:0 0 12px!important;font-weight:600!important}.foco-get h2.g-t span{color:#A78BFA!important}'
    + '.foco-get p.g-s{color:#d4d4d8!important;font-size:16.5px!important;line-height:1.6!important;margin:0 0 24px!important;max-width:30em}'
    + '.foco-get .g-b{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}.foco-get .g-b a{display:block;border:0!important;text-decoration:none!important;transition:transform .2s}.foco-get .g-b a:hover{transform:translateY(-2px)}'
    + '.foco-get .b-img{height:50px!important;width:auto!important;display:block!important;margin:0!important}'
    + '.foco-get p.g-r{color:#a1a1aa!important;font-size:14px!important;margin:0!important}.foco-get p.g-r b{color:#fff!important}.foco-get p.g-r .st{color:#A78BFA}'
    + '.foco-get .g-art{position:relative;display:flex;justify-content:center}.foco-get .g-art::before{content:"";position:absolute;left:50%;bottom:4%;width:80%;height:18%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(196,181,253,.5),transparent)}'
    + '.foco-get .g-art img{position:relative;width:min(220px,100%)!important;height:auto!important;margin:0!important;animation:fgFloat 6s ease-in-out infinite;filter:drop-shadow(0 20px 40px rgba(124,58,237,.55))}'
    + '@keyframes fgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}'
    + '@media(max-width:760px){.foco-get{grid-template-columns:1fr;padding:30px 22px;text-align:left}.foco-get .g-art{order:-1}.foco-get .g-art img{width:150px!important}.foco-get h2.g-t{font-size:25px!important}.foco-get .b-img{height:46px!important}}'
    + '@media(prefers-reduced-motion:reduce){.foco-get .g-art img{animation:none}}';

  const box = (title, sub) => '<div class="foco-get"><div><h2 class="g-t">' + title + '</h2><p class="g-s">' + sub + '</p>'
    + '<div class="g-b"><a href="https://apps.apple.com/app/id6762489184" aria-label="Download on the App Store">' + apple + '</a>'
    + '<a href="https://play.google.com/store/apps/details?id=com.adiben.foco">' + gplay + '</a></div>'
    + '<p class="g-r"><span class="st">★</span> <b>4.4</b> on Google Play · <b>7-day free trial</b> on the yearly plan</p></div>'
    + '<div class="g-art"><img src="' + MURL + '" alt="The FOCO companion, smiling" width="588" height="620" loading="lazy"></div></div>';

  const TOP = box('Turn one stuck task into <span>five tiny first steps.</span>', 'Say the task you keep putting off. FOCO plans the first steps, puts them in your day, and stays with you while you start.');
  const BOTTOM = box('Stop planning the task. <span>Start the first step.</span>', 'Download FOCO on iPhone, iPad or Android and try the yearly plan free for 7 days.');

  // replace the two old hero boxes (first and last foco-dl-hero blocks)
  const heroRe = /<div class="foco-dl"><div class="foco-dl-hero"[^>]*>[\s\S]*?class="foco-dl-trust">[\s\S]*?<\/p><\/div><\/div>/g;
  const found = s.match(heroRe) || [];
  if (found.length !== 2 && !s.includes('class="foco-get"')) throw new Error('expected 2 hero boxes, found ' + found.length);
  let n = 0; s = s.replace(heroRe, () => (n++ === 0 ? TOP : BOTTOM));
  // style: add our CSS to the first <style> of the page (idempotent)
  s = s.replace(/\/\*fg\*\/[\s\S]*?\/\*\/fg\*\//, '');
  const CSSB = CSS.replace(/\.foco-get/g, 'html body div.foco-get.foco-get').replace(/html body div\.foco-get\.foco-get\{/, 'html body div.foco-get.foco-get{');
  s = s.replace('<style>.foco-dl *{box-sizing:border-box}', '<style>.foco-dl *{box-sizing:border-box}/*fg*/' + CSSB + '/*/fg*/');

  // honest pricing copy (FOCO has no free tier: free download, then $59/yr with a 7-day trial or $9/mo)
  const fixes = [
    ['Download it free on iPhone or Android and turn any stuck task into five tiny first steps you can actually start.', 'Download it on iPhone or Android, try the yearly plan free for 7 days, and turn any stuck task into five tiny first steps you can actually start.'],
    ['iOS 13 or later, which covers the iPhone 6s and newer plus most iPads still getting updates. Free to install.', 'iOS 13 or later, which covers the iPhone 6s and newer plus most iPads still getting updates. Free download, 7-day free trial on the yearly plan.'],
    ['Available on Google Play. Free to install, with an optional paid upgrade for the full workflow.', 'Available on Google Play. Free download, 7-day free trial on the yearly plan, then $59/year or $9/month.'],
  ];
  for (const [a, b] of fixes) { if (s.includes(a)) s = s.replace(a, b); }

  if (DRY) { fs.writeFileSync('.tmp/hp/get-foco-new.html', s); console.log('dry ok'); return; }
  const body = JSON.stringify({ content: s });
  const p = await rq('POST', '/wp-json/wp/v2/pages/1152', body, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  console.log('update', p.s, p.j.status, MURL);
})().catch(e => { console.error(e.message); process.exit(1); });
