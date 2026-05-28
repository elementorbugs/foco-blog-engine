// One-off: regenerate specific posts with new voice + charts + Pexels diversity.
// Reuses functions from daily-generate.js by importing it.
// Usage: node regen-posts.js

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Load env (same resolution chain as daily-generate.js)
const envSources = {};
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
    if (m) envSources[m[1]] = m[2];
  }
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.foco-config', 'wp-creds.env'));
const E = (k, ...aliases) => {
  for (const key of [k, ...aliases]) {
    if (process.env[key]) return process.env[key];
    if (envSources[key]) return envSources[key];
  }
  return null;
};
const WP_HOST = (E('WP_HOST', 'WP_URL') || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const WP_USER = E('WP_USER');
const WP_APP_PASSWORD = E('WP_APP_PASSWORD', 'WP_PASS');
const ANTHROPIC_API_KEY = E('ANTHROPIC_API_KEY');
const PEXELS_KEY = E('PEXELS_KEY') || (fs.existsSync(path.join(__dirname, '.pexels-key')) ? fs.readFileSync(path.join(__dirname, '.pexels-key'), 'utf8').trim() : null);
const AUTH = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');

function req(host, method, p, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const opts = { hostname: host, port: 443, path: p, method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}
const wpReq = (m, p, b) => req(WP_HOST, m, p, { Authorization: 'Basic ' + AUTH }, b);

// ─── Reuse daily-generate.js logic by reading + executing parts ──────────────
// Cleaner: reimport the functions. Since daily-generate.js is an IIFE we can't
// require it. So inline the parts we need (kept in sync via copy).

// Load the system prompt fresh from daily-generate.js to ensure latest voice
function getSystemPrompt() {
  const dgFile = fs.readFileSync(path.join(__dirname, 'daily-generate.js'), 'utf8');
  const m = dgFile.match(/const system = `([\s\S]+?)`;\n/);
  if (!m) throw new Error('Could not extract system prompt from daily-generate.js');
  return m[1];
}

async function generateArticle({ keyword, slug, cluster }) {
  const system = getSystemPrompt();
  const user = `Keyword: "${keyword}"\nCluster: ${cluster}\nSlug: ${slug}\n\nWrite the complete article now. ~2,800 words.`;
  const r = await req('api.anthropic.com', 'POST', '/v1/messages', {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }, { model: 'claude-sonnet-4-5', max_tokens: 8192, system, messages: [{ role: 'user', content: user }] });
  if (r.status !== 200 || !r.body.content || !r.body.content[0]) throw new Error('Anthropic: ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 300));
  let html = r.body.content[0].text || '';
  html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  const h1Idx = html.indexOf('<h1');
  if (h1Idx > 0) html = html.slice(h1Idx);
  return html;
}

// Strip existing foco-img figures (so we don't duplicate when re-injecting)
function stripImages(html) {
  return html.replace(/<!-- wp:html -->\s*<figure class="foco-img"[\s\S]*?<\/figure>\s*<!-- \/wp:html -->\s*\n?/g, '');
}

// Pexels query helpers (copied from daily-generate.js)
function pexelsQueryFor(keyword, h2Text) {
  let cleaned = h2Text.replace(/^(what|why|how|when|who|do|does|is|are|the|a|an)\b\s+/gi, '').replace(/[?:.!,]/g, '').trim();
  const visualHints = [];
  if (/work|career|office|meeting/i.test(h2Text)) visualHints.push('workplace');
  else if (/sleep|rest|tired|exhaust/i.test(h2Text)) visualHints.push('bedroom morning');
  else if (/medic|drug|pill|prescrib|dose/i.test(h2Text)) visualHints.push('hands holding');
  else if (/test|diagnos|evaluat|appointment|psychiatr/i.test(h2Text)) visualHints.push('therapist office calm');
  else if (/focus|task|start|do/i.test(h2Text)) visualHints.push('desk laptop');
  else if (/cook|kitchen|meal|food/i.test(h2Text)) visualHints.push('kitchen prep');
  else if (/clean|tidy|home/i.test(h2Text)) visualHints.push('bright apartment');
  else if (/relat|partner|friend|social/i.test(h2Text)) visualHints.push('two people talking');
  else if (/kid|child|parent|family/i.test(h2Text)) visualHints.push('parent child home');
  else visualHints.push('person thoughtful');
  const contentWords = cleaned.split(/\s+/).slice(0, 3).join(' ');
  return `${contentWords} ${visualHints.join(' ')}`.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
}

function pexelsSearch(query) {
  return new Promise((res, rej) => {
    https.get({
      hostname: 'api.pexels.com', port: 443,
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      headers: { Authorization: PEXELS_KEY },
    }, (r) => {
      let d = ''; r.on('data', x => d += x);
      r.on('end', () => { try { res(JSON.parse(d)); } catch { rej(new Error('Pexels parse')); } });
    }).on('error', rej);
  });
}
function downloadFile(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) return res(downloadFile(r.headers.location));
      const chunks = []; r.on('data', c => chunks.push(c)); r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
}
async function uploadToWp(buffer, filename, contentType) {
  return new Promise((res, rej) => {
    const opts = {
      hostname: WP_HOST, port: 443, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: { Authorization: 'Basic ' + AUTH, 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length },
    };
    const r = https.request(opts, (response) => {
      let d = ''; response.on('data', x => d += x);
      response.on('end', () => { try { res({ status: response.statusCode, body: JSON.parse(d) }); } catch { res({ status: response.statusCode, body: d }); } });
    });
    r.on('error', rej); r.write(buffer); r.end();
  });
}

async function injectPexelsImages(postId, keyword) {
  if (!PEXELS_KEY) return { ok: false, msg: 'no PEXELS_KEY' };
  const post = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content,slug`);
  if (post.status !== 200) return { ok: false, msg: 'fetch fail' };
  let html = post.body.content.raw;
  const h2Re = /<h2[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h2>/g;
  const h2s = [...html.matchAll(h2Re)].slice(0, 5);
  if (h2s.length === 0) return { ok: false, msg: 'no h2 anchors' };
  const picked = h2s.length <= 3 ? h2s : [h2s[0], h2s[Math.floor(h2s.length / 2)], h2s[h2s.length - 1]];
  const usedPhotoIds = new Set(); const usedPhotographers = new Set();
  let inserted = 0; const slug = post.body.slug;
  for (const h2 of picked) {
    const h2Tag = h2[0]; const h2Text = h2[2];
    const query = pexelsQueryFor(keyword, h2Text);
    try {
      const pex = await pexelsSearch(query);
      if (!pex.photos || pex.photos.length === 0) continue;
      const candidates = pex.photos.filter(p => !usedPhotoIds.has(p.id) && !usedPhotographers.has(p.photographer));
      const pool = candidates.length > 0 ? candidates : pex.photos;
      const photo = pool[Math.floor(Math.random() * Math.min(5, pool.length))];
      usedPhotoIds.add(photo.id); usedPhotographers.add(photo.photographer);
      const imgUrl = photo.src.large;
      const imgBuf = await downloadFile(imgUrl);
      const photographer = (photo.photographer || 'Pexels').replace(/[^a-zA-Z0-9 ]/g, '');
      const ext = imgUrl.match(/\.(jpe?g|png|webp)/i) ? imgUrl.match(/\.(jpe?g|png|webp)/i)[0] : '.jpg';
      const fname = `${slug}-${photo.id}${ext}`;
      const up = await uploadToWp(imgBuf, fname, 'image/jpeg');
      if (up.status !== 201) continue;
      const mediaUrl = up.body.source_url;
      const cleaned = h2Text.replace(/^(what|why|how|when|who|do|does|is|are)\b\s+/gi, '').replace(/[?:.!,]/g, '').trim();
      const altText = `Person reflecting on ${cleaned.toLowerCase()}`.slice(0, 120);
      const figure = `\n<!-- wp:html --><figure class="foco-img" style="margin:28px 0"><img src="${mediaUrl}" alt="${altText.replace(/"/g, '&quot;')}" loading="lazy" style="width:100%;height:auto;border-radius:14px;display:block;border:1px solid rgba(167,139,250,0.18)"/><figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">Photo: ${photographer} via Pexels</figcaption></figure><!-- /wp:html -->\n`;
      html = html.replace(h2Tag, h2Tag + figure);
      inserted++;
    } catch (e) { /* skip this image */ }
  }
  if (inserted === 0) return { ok: false, msg: 'no images inserted' };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, msg: `${inserted} images` };
}

async function renderCharts(postId) {
  let K; try { K = require('./chart-kit'); } catch (e) { return { ok: false, msg: 'no chart-kit' }; }
  const post = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content`);
  if (post.status !== 200) return { ok: false, msg: 'fetch fail' };
  let html = post.body.content.raw;
  const re = /<!--\s*FOCO_CHART:(\w+)\s*([\s\S]*?)-->/g;
  const matches = [...html.matchAll(re)];
  if (matches.length === 0) return { ok: true, msg: '0 chart markers' };
  let rendered = 0;
  for (const m of matches) {
    const type = m[1]; const jsonRaw = m[2].trim();
    let spec;
    try { spec = JSON.parse(jsonRaw); }
    catch (e) {
      const cleaned = jsonRaw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      try { spec = JSON.parse(cleaned); } catch (e2) { continue; }
    }
    if (typeof K[type] !== 'function') continue;
    try {
      const chartHtml = K[type](spec);
      html = html.replace(m[0], `<!-- wp:html -->${chartHtml}<!-- /wp:html -->`);
      rendered++;
    } catch (e) { /* skip */ }
  }
  if (rendered === 0) return { ok: true, msg: `0/${matches.length} rendered` };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, msg: `${rendered}/${matches.length} rendered` };
}

const DISCLAIMER = '<!-- wp:html --><div class="foco-disclaimer" style="margin:32px 0;padding:20px;background:rgba(167,139,250,0.06);border-left:3px solid #A78BFA;border-radius:8px;font-size:14px;color:#B8B0CC;line-height:1.6"><strong>Note.</strong> This article describes a pattern observed in many ADHD adults. It is not a substitute for clinical evaluation. If symptoms are significantly affecting your daily life, please consult a clinician with experience in adult ADHD.</div><!-- /wp:html -->';

function howToSchema(keyword) {
  return {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `How to apply: ${keyword}`,
    description: `A practical procedure for ADHD adults working through ${keyword}.`,
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Understand the mechanism', text: 'Read the neuroscience section to know what is actually happening in the ADHD brain.' },
      { '@type': 'HowToStep', position: 2, name: 'Recognize the pattern', text: 'Identify which of the patterns described matches your specific experience.' },
      { '@type': 'HowToStep', position: 3, name: 'Try one strategy', text: 'Pick one practical strategy from the article and use it for 7 days.' },
      { '@type': 'HowToStep', position: 4, name: 'Adjust based on results', text: 'Track what worked. Adjust or try a different strategy if needed.' },
    ],
  };
}

async function postProcess(postId) {
  const r = await wpReq('GET', `/wp-json/wp/v2/posts/${postId}?context=edit&_fields=content,title`);
  if (r.status !== 200) return { ok: false };
  let html = r.body.content.raw;
  let changes = [];
  if (!html.includes('foco-disclaimer')) {
    const refsMatch = html.match(/<h2[^>]*>References<\/h2>/);
    if (refsMatch) { html = html.replace(refsMatch[0], DISCLAIMER + '\n\n' + refsMatch[0]); changes.push('disclaimer'); }
  }
  if (!html.includes('"HowTo"')) {
    html = html + `\n\n<!-- wp:html --><script type="application/ld+json">${JSON.stringify(howToSchema(r.body.title.rendered))}</script><!-- /wp:html -->`;
    changes.push('HowTo');
  }
  if (changes.length === 0) return { ok: true, changes: [] };
  const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${postId}`, { content: html });
  return { ok: upd.status === 200, changes };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
const TARGETS = [
  { id: 777, slug: 'psychiatrist-for-adhd-diagnosis', keyword: 'psychiatrist for adhd diagnosis', cluster: 'Treatment' },
  { id: 780, slug: 'adhd-cleaning-planner',          keyword: 'adhd cleaning planner',          cluster: 'Tools/Products' },
];

(async () => {
  for (const t of TARGETS) {
    console.log(`\n━━━ Regenerating post ${t.id} (${t.slug}) ━━━`);
    try {
      console.log('  [1] Generating new HTML via Anthropic API (with new voice spec)...');
      const html = await generateArticle(t);
      console.log(`  [1] Got ${html.length} chars`);

      console.log('  [2] Replacing WP content...');
      const upd = await wpReq('POST', `/wp-json/wp/v2/posts/${t.id}`, { content: html });
      if (upd.status !== 200) throw new Error('WP update fail ' + upd.status);
      console.log(`  [2] ✓`);

      // No need to strip — we just replaced content fully

      console.log('  [3] Injecting Pexels images...');
      const px = await injectPexelsImages(t.id, t.keyword);
      console.log(`  [3] ${px.msg}`);

      console.log('  [4] Rendering chart markers...');
      const ch = await renderCharts(t.id);
      console.log(`  [4] ${ch.msg}`);

      console.log('  [5] Post-process (disclaimer + HowTo)...');
      const pp = await postProcess(t.id);
      console.log(`  [5] ${pp.changes ? pp.changes.join(', ') || 'no changes' : 'ok'}`);

      console.log(`  ✓ Post ${t.id} regenerated`);
    } catch (e) {
      console.error(`  ✗ Post ${t.id} failed: ${e.message}`);
    }
  }
  console.log('\n━━━ Done ━━━');
})();
