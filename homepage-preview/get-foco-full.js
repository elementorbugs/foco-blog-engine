// Full redesign of /get-foco/ (page 1152) in the homepage's night language. Keeps every heading, the FAQ text
// and the honest pricing copy; rebuilds the layout as one designed block. Backs up the live content first.
// Usage: node homepage-preview/get-foco-full.js [--dry]
const fs = require('fs'), https = require('https');
for (const l of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = 'Basic ' + Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const DRY = process.argv.includes('--dry');
function rq(method, path, body, headers) { return new Promise((res, rej) => { const q = https.request({ hostname: WP_HOST, path, method, headers: Object.assign({ Authorization: auth }, headers || {}) }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res({ s: r.statusCode, j: JSON.parse(d) }) } catch (e) { res({ s: r.statusCode, j: d.slice(0, 300) }) } }) }); q.on('error', rej); if (body) q.write(body); q.end(); }); }
async function upload(file, name, type) { const b = fs.readFileSync(file); const r = await rq('POST', '/wp-json/wp/v2/media', b, { 'Content-Type': type, 'Content-Disposition': 'attachment; filename="' + name + '"', 'Content-Length': b.length }); if (r.s >= 300) throw new Error('upload ' + r.s); return r.j.source_url; }
const ICON_CACHE = 'homepage-preview/get-foco-icons.json';

(async () => {
  const g = await rq('GET', '/wp-json/wp/v2/pages/1152?context=edit');
  const raw = g.j.content.raw;
  fs.writeFileSync('homepage-backup/get-foco-1152-2026-11-19-pre-full.html', raw);
  if (raw.includes('foco-dl gfx') && !process.argv.includes('--force')) { console.log('already redesigned (use --force to rebuild from the backup source)'); }
  const src = raw.includes('foco-dl gfx') ? fs.readFileSync('homepage-backup/get-foco-1152-2026-11-19-pre-fullredesign.html', 'utf8') : raw;

  // pieces kept from the current page
  const boxes = src.match(/<div class="foco-get">[\s\S]*?<div class="g-art"><img[^>]*><\/div><\/div>/g);
  if (!boxes || boxes.length !== 2) throw new Error('download boxes not found: ' + (boxes || []).length);
  const fgCss = (src.match(/\/\*fg\*\/([\s\S]*?)\/\*\/fg\*\//) || [])[1] || '';
  const tldr = (src.match(/<div class="foco-tldr">\s*([\s\S]*?)\s*<\/div>/) || [])[1].trim();
  const faqPart = src.slice(src.indexOf('<h2>FAQ</h2>'), src.lastIndexOf('<!-- wp:html -->'));
  const faqs = [...faqPart.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(m => [m[1].trim(), m[2].trim()]);
  if (faqs.length < 5) throw new Error('faq parse ' + faqs.length);

  let icons = fs.existsSync(ICON_CACHE) ? JSON.parse(fs.readFileSync(ICON_CACHE, 'utf8')) : null;
  if (!icons) {
    icons = {};
    for (const n of ['check', 'cal', 'music', 'mic']) icons['ic-' + n] = DRY ? 'icon-' + n + '.png' : await upload('.tmp/hp/livepv/icon-' + n + '.png', 'foco-icon-' + n + '.png', 'image/png');
    if (!DRY) fs.writeFileSync(ICON_CACHE, JSON.stringify(icons));
  }
  const U = 'https://www.tryfoco.com/wp-content/uploads/';
  const SHOTS = [
    [U + '2026/10/foco-home-shot-today.jpg', 'FOCO day view: tasks sorted into anytime, morning and afternoon', 'Your day, sorted. Every task gets a slot and a reminder.'],
    [U + '2026/11/foco-home-shot-steps-email2.jpg', 'FOCO breaks Reply to important emails into five timed steps', 'Any stuck task becomes five steps, each with a time estimate.'],
    [U + '2026/10/foco-home-shot-focus.jpg', 'FOCO focus mode with the companion and soundscapes', 'Focus mode: a timer, a soundscape and the companion beside you.'],
  ];
  const FEATS = [
    [icons['ic-check'], 'Task breakdown', 'One stuck task in, five tiny first steps out, each with a time estimate. No project setup, no tagging.'],
    [icons['ic-cal'], 'A calendar that waits', 'Tasks land in your day by morning, afternoon or anytime, with reminders. Miss one and it moves on with you.'],
    [icons['ic-music'], 'Focus mode', 'Timers from 10 to 90 minutes, soundscapes, and an AI body-doubling companion that stays present while you work.'],
    [icons['ic-mic'], 'Voice capture', 'Speak the task when typing is the block. FOCO transcribes it and runs it through breakdown in seconds.'],
  ];

  const P = 'html body.page-id-1152 .blog-single .gfx.gfx';
  const css = [
    // page goes night
    'html:has(body.page-id-1152),html body.page-id-1152,html body.page-id-1152 .foco-app{background:#0b0912!important}',
    'html body.page-id-1152 .blog-single{background:radial-gradient(900px 600px at 85% 0%,rgba(124,58,237,.32),transparent 70%),radial-gradient(800px 700px at 0% 35%,rgba(124,58,237,.18),transparent 70%),radial-gradient(900px 700px at 100% 65%,rgba(167,139,250,.14),transparent 70%),radial-gradient(900px 700px at 20% 95%,rgba(124,58,237,.22),transparent 70%),linear-gradient(180deg,#0b0912,#120a24 40%,#0d0a18 70%,#0b0912)!important}',
    'html body.page-id-1152 .blog-single h1{color:#fff!important}',
    'html body.page-id-1152 .blog-single .wrap>article,html body.page-id-1152 .blog-single article{background:transparent!important;box-shadow:none!important;border:0!important}',
    P + '{color:#d4d4d8}',
    P + ' h2{color:#fff!important;font-size:clamp(26px,3vw,34px)!important;line-height:1.2!important;margin:72px 0 10px!important;font-weight:600!important}',
    P + ' h2 span{color:#A78BFA!important}',
    P + ' p.lead2{color:#a1a1aa!important;font-size:16.5px!important;margin:0 0 26px!important}',
    P + ' a{color:#c4b5fd!important}',
    // tldr
    P + ' .g-tldr{margin:0 0 8px;padding:22px 24px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.22);border-left:3px solid #7C3AED;color:#e4e4e7!important;font-size:16.5px;line-height:1.7}',
    // phones
    P + ' .g-phones{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:end;margin-top:8px}',
    P + ' .g-ph{margin:0;text-align:center}',
    P + ' .g-ph .fr{position:relative;width:min(210px,100%);margin:0 auto;padding:7px;border-radius:34px;background:linear-gradient(145deg,#6a6a76,#22222a 16%,#0b0b0f 50%,#2a2a32 84%,#77778a);box-shadow:inset 0 0 0 1.5px #34343e,0 40px 70px -30px rgba(0,0,0,.95),0 0 80px -16px rgba(124,58,237,.6);transition:transform .4s cubic-bezier(.2,.7,.2,1)}',
    P + ' .g-ph .fr img{display:block;width:100%!important;height:auto!important;aspect-ratio:520/1128;object-fit:cover;object-position:top;border-radius:28px;margin:0!important}',
    P + ' .g-ph:nth-child(1) .fr{transform:rotate(-5deg) translateY(10px)}' + P + ' .g-ph:nth-child(3) .fr{transform:rotate(5deg) translateY(10px)}' + P + ' .g-ph:nth-child(2) .fr{transform:translateY(-18px)}',
    P + ' .g-ph:hover .fr{transform:translateY(-26px) rotate(0)!important}',
    P + ' .g-ph figcaption{color:#a1a1aa!important;font-size:14px;line-height:1.5;margin-top:22px}',
    // features
    P + ' .g-feat{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    P + ' .g-card{position:relative;isolation:isolate;display:flex;gap:16px;align-items:flex-start;padding:22px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.18);transition:border-color .3s,box-shadow .3s,transform .3s}',
    P + ' .g-card:hover{border-color:rgba(167,139,250,.5);box-shadow:0 0 50px -14px rgba(124,58,237,.7);transform:translateY(-3px)}',
    P + ' .g-card img{flex:none;width:60px!important;height:60px!important;object-fit:contain;margin:0!important;filter:drop-shadow(0 6px 18px rgba(124,58,237,.45))}',
    P + ' .g-card h3{color:#fff!important;font-size:18px!important;margin:4px 0 6px!important;font-weight:600!important}',
    P + ' .g-card p{color:#a1a1aa!important;font-size:15px!important;line-height:1.6!important;margin:0!important}',
    P + ' .g-more{margin-top:18px!important;color:#d4d4d8!important}',
    // platforms
    P + ' .g-req{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    P + ' .g-req>div{padding:22px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.18)}',
    P + ' .g-req strong{display:block;color:#fff!important;font-size:18px;margin-bottom:6px}',
    P + ' .g-req span{display:block;color:#a1a1aa;font-size:15px;line-height:1.6;margin-bottom:16px}',
    P + ' .g-req .b-img{height:44px!important;width:auto!important;display:block!important;margin:0!important}',
    P + ' .g-req a{display:inline-block;border:0!important;transition:transform .2s}' + P + ' .g-req a:hover{transform:translateY(-2px)}',
    // free tools
    P + ' .g-links{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}',
    P + ' .g-link{display:flex;flex-direction:column;gap:8px;padding:22px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.18);text-decoration:none!important;transition:border-color .3s,box-shadow .3s,transform .3s}',
    P + ' .g-link:hover{border-color:rgba(167,139,250,.5);box-shadow:0 0 50px -14px rgba(124,58,237,.7);transform:translateY(-3px)}',
    P + ' .g-link b{color:#fff;font-size:17px}' + P + ' .g-link span{color:#a1a1aa;font-size:14.5px;line-height:1.55}' + P + ' .g-link i{font-style:normal;color:#A78BFA;font-weight:600;font-size:14px;margin-top:auto}',
    // socials
    P + ' .g-soc{display:flex;flex-wrap:wrap;gap:10px}',
    P + ' .g-soc a{padding:12px 18px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(167,139,250,.22);color:#fff!important;text-decoration:none!important;font-weight:600;font-size:15px;transition:background .2s,border-color .2s}',
    P + ' .g-soc a:hover{background:rgba(124,58,237,.25);border-color:rgba(167,139,250,.6)}',
    // faq
    P + ' .g-faq{display:grid;gap:10px}',
    P + ' .g-faq details{border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.18);padding:0 20px;transition:border-color .3s}',
    P + ' .g-faq details[open]{border-color:rgba(167,139,250,.45)}',
    P + ' .g-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0}',
    P + ' .g-faq summary::-webkit-details-marker{display:none}',
    P + ' .g-faq summary h3{color:#fff!important;font-size:16.5px!important;margin:0!important;font-weight:600!important}',
    P + ' .g-faq summary::after{content:"+";color:#A78BFA;font-size:24px;line-height:1;transition:transform .25s}',
    P + ' .g-faq details[open] summary::after{transform:rotate(45deg)}',
    P + ' .g-faq details p{color:#a1a1aa!important;font-size:15px!important;line-height:1.65!important;margin:0 0 18px!important}',
    P + ' .foco-get{margin-top:72px}',
    '@media(max-width:760px){' + P + ' .g-phones{grid-template-columns:repeat(3,1fr);gap:8px}' + P + ' .g-ph figcaption{font-size:12px;margin-top:14px}' + P + ' .g-ph .fr{padding:4px;border-radius:20px}' + P + ' .g-ph .fr img{border-radius:16px}'
      + P + ' .g-feat,' + P + ' .g-req,' + P + ' .g-links{grid-template-columns:1fr}' + P + ' h2{margin-top:56px!important}}',
  ].join('');

  const home = fs.readFileSync('homepage-backup/page-4760-2026-11-19-pre-night.html', 'utf8');
  const apple = home.match(/<svg class="badge" viewBox="0 0 119\.66407 40"[\s\S]*?<\/svg>/)[0].replace('class="badge"', 'class="b-img"');
  const gplay = '<img class="b-img" src="' + U + '2026/10/foco-badge-google-play.png" alt="Get it on Google Play" width="568" height="172">';
  const esc = s => s;

  const html = '<!-- wp:html --><style>.foco-dl *{box-sizing:border-box}/*fg*/' + fgCss + '/*/fg*/' + css + '</style><div class="foco-dl gfx">'
    + boxes[0]
    + '<div class="g-tldr">' + tldr + '</div>'
    + '<h2>What the app <span>actually looks like</span></h2><p class="lead2">Real screens from the app, nothing mocked up.</p>'
    + '<div class="g-phones">' + SHOTS.map(s => '<figure class="g-ph"><div class="fr"><img src="' + s[0] + '" alt="' + s[1] + '" width="520" height="1128" loading="lazy"></div><figcaption>' + s[2] + '</figcaption></figure>').join('') + '</div>'
    + '<h2>What FOCO <span>does for you</span></h2><p class="lead2">FOCO is built for one moment specifically: when you know what to do and cannot start.</p>'
    + '<div class="g-feat">' + FEATS.map(f => '<div class="g-card"><img src="' + f[0] + '" alt="" width="64" height="64" loading="lazy"><div><h3>' + f[1] + '</h3><p>' + f[2] + '</p></div></div>').join('') + '</div>'
    + '<p class="g-more">One tap. Five steps out. Real momentum. That\'s the whole product. <a href="https://tryfoco.com/features/">See all six features →</a></p>'
    + '<h2>What you need <span>to run it</span></h2>'
    + '<div class="g-req"><div><strong>iPhone and iPad</strong><span>iOS 13 or later, which covers the iPhone 6s and newer plus most iPads still getting updates. Free download, 7-day free trial on the yearly plan.</span><a href="https://apps.apple.com/app/id6762489184" aria-label="Download on the App Store">' + apple + '</a></div>'
    + '<div><strong>Android</strong><span>Available on Google Play. Free download, 7-day free trial on the yearly plan, then $59/year or $9/month.</span><a href="https://play.google.com/store/apps/details?id=com.adiben.foco">' + gplay + '</a></div></div>'
    + '<h2>Free tools you can <span>use right now</span></h2><p class="lead2">FOCO is more than the app. The website hosts a library of free tools and ADHD content you can use without an account.</p>'
    + '<div class="g-links"><a class="g-link" href="https://tryfoco.com/adhd-tools/"><b>Free focus tools</b><span>Focus timers, brain dump tool and a body doubling session. All in your browser, no signup.</span><i>See all free tools →</i></a>'
    + '<a class="g-link" href="https://tryfoco.com/adhd-resources/"><b>The ADHD content library</b><span>Six pillar guides, glossary, original research, real stories. Free, no email gate.</span><i>Browse the library →</i></a>'
    + '<a class="g-link" href="https://tryfoco.com/founders/"><b>The founder story</b><span>Why FOCO exists and who\'s behind it, written in first person by Adi, the founder.</span><i>Read the story →</i></a></div>'
    + '<h2>Follow the build <span>in public</span></h2><p class="lead2">Updates, behind-the-scenes and ADHD content. Pick whichever platform you actually use.</p>'
    + '<div class="g-soc"><a href="https://www.instagram.com/foco.adhd/" target="_blank" rel="noopener">Instagram · @foco.adhd</a><a href="https://www.tiktok.com/@foco.adhd" target="_blank" rel="noopener">TikTok · @foco.adhd</a><a href="https://www.youtube.com/@FOCO-ADHDCOMPANION" target="_blank" rel="noopener">YouTube · @FOCO-ADHDCOMPANION</a></div>'
    + '<h2>Questions, <span>answered</span></h2>'
    + '<div class="g-faq">' + faqs.map((f, i) => '<details' + (i === 0 ? ' open' : '') + '><summary><h3>' + esc(f[0]) + '</h3></summary><p>' + f[1] + '</p></details>').join('') + '</div>'
    + boxes[1]
    + '</div><!-- /wp:html -->';

  fs.writeFileSync('.tmp/hp/get-foco-full.html', html);
  if (DRY) { console.log('dry ok', faqs.length, 'faqs'); return; }
  const body = JSON.stringify({ content: html });
  const p = await rq('POST', '/wp-json/wp/v2/pages/1152', body, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  console.log('update', p.s, p.j.status);
})().catch(e => { console.error(e.message); process.exit(1); });
