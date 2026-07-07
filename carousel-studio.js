#!/usr/bin/env node
/**
 * FOCO Carousel Studio  —  localhost:3040
 *
 * Turns a blog post, a web link, or a topic into a FOCO-branded Instagram
 * carousel. AI writes the copy in a chosen TONE; slides render in one of 3
 * on-brand color THEMES (1080x1350) via Playwright. Hands you caption + tags.
 *
 * Reads ANTHROPIC_API_KEY + WP creds from .env (same as the other scripts).
 * Run:  node carousel-studio.js   then open http://localhost:3040
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ─── env ──────────────────────────────────────────────────────────────────────
const envSources = {};
function loadEnvFile(p) { if (!fs.existsSync(p)) return; for (const line of fs.readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/); if (m) envSources[m[1]] = m[2]; } }
loadEnvFile(path.join(__dirname, '.env'));
const E = (k) => process.env[k] || envSources[k] || null;
const ANTHROPIC_API_KEY = E('ANTHROPIC_API_KEY');
const WP_HOST = (E('WP_HOST') || 'www.tryfoco.com').replace(/^https?:\/\//, '');
const WP_USER = E('WP_USER'), WP_PASS = E('WP_APP_PASSWORD');
const WP_AUTH = WP_USER && WP_PASS ? 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64') : null;

const PORT = 3040;
const OUT_DIR = path.join(__dirname, 'carousel-out');
const MASCOT_DIR = path.join(__dirname, 'assets', 'mascots');
const MODEL = 'claude-sonnet-4-5';
if (!ANTHROPIC_API_KEY) console.warn('⚠  ANTHROPIC_API_KEY missing in .env — Generate will error until you add it.');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Anthropic ─────────────────────────────────────────────────────────────────
function anthropicRequest(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const r = https.request({ hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } },
      (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } }); });
    r.on('error', reject); r.write(payload); r.end();
  });
}
function extractJson(text) { const s = text.indexOf('{'); if (s < 0) throw new Error('No JSON in model output'); let depth = 0; for (let i = s; i < text.length; i++) { if (text[i] === '{') depth++; else if (text[i] === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(s, i + 1)); } } throw new Error('Unbalanced JSON'); }

// ─── fetch helpers (WP posts + any web URL for inspiration) ─────────────────────
function httpGet(urlStr, redirects = 0) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(urlStr); } catch { return reject(new Error('Bad URL')); }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.get({ hostname: u.hostname, path: u.pathname + u.search, port: u.port || (u.protocol === 'http:' ? 80 : 443), headers: { 'User-Agent': 'Mozilla/5.0 FOCO-Carousel', Accept: 'text/html' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 4) { res.resume(); return resolve(httpGet(new URL(res.headers.location, u).href, redirects + 1)); }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    req.on('error', reject); req.setTimeout(15000, () => { req.destroy(); reject(new Error('URL timed out')); });
  });
}
function htmlToText(html) {
  const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000);
  return { title, text: body };
}
function wpGet(pathname) { return new Promise((resolve, reject) => { https.get({ hostname: WP_HOST, path: pathname, headers: WP_AUTH ? { Authorization: WP_AUTH } : {} }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } }); }).on('error', reject); }); }
const PEXELS_KEY = (() => { const f = path.join(__dirname, '.pexels-key'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : null; })();
function pexelsSearch(query, n, page) {
  if (!PEXELS_KEY) return Promise.resolve([]);
  return new Promise((resolve) => {
    https.get({ hostname: 'api.pexels.com', path: `/v1/search?query=${encodeURIComponent(query)}&per_page=${n}&page=${page || 1}&orientation=portrait&size=large`, headers: { Authorization: PEXELS_KEY } },
      (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { const j = JSON.parse(d); resolve((j.photos || []).map(p => p.src.portrait || p.src.large)); } catch { resolve([]); } }); }).on('error', () => resolve([]));
  });
}
function downloadImage(url) {
  return new Promise((resolve) => { try { https.get(new URL(url), (r) => { const c = []; r.on('data', x => c.push(x)); r.on('end', () => resolve('data:' + (r.headers['content-type'] || 'image/jpeg') + ';base64,' + Buffer.concat(c).toString('base64'))); }).on('error', () => resolve('')); } catch { resolve(''); } });
}
let postCache = null;
async function listPosts() {
  if (postCache) return postCache;
  const out = [];
  for (let p = 1; p <= 3; p++) { const arr = await wpGet(`/wp-json/wp/v2/posts?status=publish&per_page=100&page=${p}&_fields=id,slug,title`); if (!Array.isArray(arr) || !arr.length) break; out.push(...arr.map(x => ({ slug: x.slug, title: (x.title && x.title.rendered || x.slug).replace(/&#0?39;/g, "'").replace(/&amp;/g, '&') }))); if (arr.length < 100) break; }
  postCache = out.sort((a, b) => a.title.localeCompare(b.title)); return postCache;
}
async function postText(slug) { const arr = await wpGet(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=title,content`); if (!Array.isArray(arr) || !arr.length) return null; return htmlToText(`<title>${arr[0].title.rendered}</title>` + arr[0].content.rendered); }

// ─── tones ──────────────────────────────────────────────────────────────────────
const TONES = {
  emotional: 'EMOTIONAL & VALIDATING. Lead with feeling. Name the emotional weight (shame, relief, exhaustion, being seen). Warm, tender, first-person-friendly. Make them feel understood before anything else.',
  informational: 'INFORMATIONAL & CLEAR. Teach one clean idea per slide. Grounded, calm, genuinely useful. Confident and plain. No fluff.',
  motivational: 'MOTIVATIONAL & ENERGIZING. Build momentum and hope. Empowering, forward-moving, never hustle-culture or toxic positivity. Short and punchy.',
  story: 'STORY-DRIVEN. Tell one small, relatable scenario that builds slide to slide. Specific, human, a little cinematic. Second person ("you").',
  mythbust: 'MYTH-BUSTING. Each slide flips a common misconception into the real, kinder truth. Confident, myth vs fact framing.',
};

// ─── generation ─────────────────────────────────────────────────────────────────
function buildPrompt({ mode, topic, slideCount, source, tone }) {
  let brief;
  if (mode === 'post') brief = `Condense this FOCO blog post into a carousel. Keep the sharpest, most shareable ideas.\n\nTITLE: ${source.title}\n\nARTICLE:\n${source.text}`;
  else if (mode === 'url') brief = `Use this web content as INSPIRATION only. Take its angle or idea and make it FOCO's own, in FOCO's voice. Do NOT copy its wording, and never promote another app or brand it mentions.\n\nSOURCE TITLE: ${source.title}\n\nSOURCE CONTENT:\n${source.text}`;
  else brief = `Create a fresh carousel on this topic: "${topic}"`;
  const toneLine = TONES[tone] || TONES.informational;
  return `You are FOCO's social writer. FOCO is an ADHD focus companion app: it turns any task into one tiny first step you can actually start, with an AI body-doubling character in focus mode that stays present while you work. Audience: adults with ADHD.

Write an Instagram carousel with 1 hook slide, ${slideCount} value slides, and 1 CTA slide.

TONE FOR THIS CAROUSEL: ${toneLine}

VOICE (always): ADHD-native, anti-shame, plain-spoken. Frame ADHD struggles as neurology, never character flaws or willpower.

HARD RULES:
- NEVER use em dashes. Use commas, periods, or a normal hyphen.
- FOCO's body doubling is an AI character, NEVER real people or a live co-working room.
- No fabricated stats or percentages. No medical, diagnosis, or medication claims.
- Do not use: delve, leverage, unleash, game-changer, seamless, robust, dive deep, navigate, elevate, revolutionary.
- Punchy for mobile: hook headline <= 7 words; each slide headline <= 6 words; each slide body <= 22 words; short sentences.
- You MAY wrap ONE key word/phrase per headline in *asterisks* to highlight it in the accent color. Use it on the hook and the CTA at least.

CONTENT SHAPE:
- hook: a scroll-stopping line that names a real, specific ADHD pain (validating, not clickbait).
- value slides: one concrete idea each, matching the tone above.
- cta: tie to FOCO's core (start with one tiny step, plus the AI body-doubling companion) and invite them to try FOCO free on Google Play.
- caption: 2 to 4 short lines for the Instagram post, ending in a soft invite. No hashtags in the caption.
- hashtags: 12 to 15 relevant tags, mixing broad (#adhd) and niche (#adhdadults #taskparalysis). Lowercase, no spaces.
- topicLabel: 1 to 3 words in UPPERCASE for the slide eyebrow.
- For EACH value slide, add photoQuery: a short, literal, VISUAL scene to search stock photos, matching that slide's specific point. Describe a real photographable moment, ideally a PERSON with an emotion or action, plus setting (e.g. "young woman staring at phone stressed", "tired person slumped at laptop late night", "woman rubbing eyes at messy desk", "hands hovering over keyboard hesitant"). Be concrete and shootable. NEVER use abstract terms like "anxiety", "executive dysfunction", "overwhelm" as the query. 3 to 6 words.

${brief}

Return ONLY valid JSON, no prose:
{"topicLabel":"","hook":{"headline":"","subline":""},"slides":[{"headline":"","body":"","photoQuery":""}],"cta":{"headline":"","body":""},"caption":"","hashtags":[""]}`;
}
async function generate(input) {
  let source = null;
  if (input.mode === 'post') { source = await postText(input.slug); if (!source) throw new Error('Post not found'); }
  else if (input.mode === 'url') { source = htmlToText(await httpGet(input.url)); if (!source.text) throw new Error('Could not read that URL'); }
  const r = await anthropicRequest({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content: buildPrompt({ ...input, source }) }] });
  if (r.status !== 200) throw new Error('Anthropic ' + r.status + ': ' + JSON.stringify(r.body).slice(0, 300));
  return extractJson((r.body.content && r.body.content[0] && r.body.content[0].text) || '');
}

// Rewrite ONE slide, keeping it coherent with (and distinct from) the rest.
async function regenSlide({ kind, index, tone, carousel }) {
  const toneLine = TONES[tone] || TONES.informational;
  const target = kind === 'hook' ? 'the HOOK slide' : kind === 'cta' ? 'the CTA slide' : `value slide number ${index + 1}`;
  const shape = kind === 'hook' ? '{"headline":"","subline":""}' : kind === 'cta' ? '{"headline":"","body":""}' : '{"headline":"","body":"","photoQuery":""}';
  const ctx = `topicLabel: ${carousel.topicLabel}\nHOOK: ${carousel.hook.headline} | ${carousel.hook.subline}\n${carousel.slides.map((s, i) => `SLIDE ${i + 1}: ${s.headline} | ${s.body}`).join('\n')}\nCTA: ${carousel.cta.headline} | ${carousel.cta.body}`;
  const prompt = `You are FOCO's social writer (ADHD focus companion app: one tiny first step + an AI body-doubling character). Audience: adults with ADHD.
TONE: ${toneLine}
Rewrite ONLY ${target} with a fresh, different angle. Keep it coherent with the rest and do NOT repeat ideas already covered by other slides.
RULES: never use em dashes; body doubling is an AI character (never real people); no fabricated stats or medical claims; headline <= 6 words (hook <= 7); body <= 22 words; you may wrap one key phrase in *asterisks*. For a value slide, also include photoQuery: a concrete, shootable stock-photo scene (a person plus emotion plus setting, 3 to 6 words), never abstract.

CURRENT CAROUSEL:
${ctx}

Return ONLY JSON for the rewritten ${target}: ${shape}`;
  const r = await anthropicRequest({ model: MODEL, max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
  if (r.status !== 200) throw new Error('Anthropic ' + r.status);
  return extractJson((r.body.content && r.body.content[0] && r.body.content[0].text) || '');
}

// ─── THEMES (3 on-brand FOCO palettes) ──────────────────────────────────────────
const THEMES = {
  midnight: { name: 'Midnight', bg: 'linear-gradient(158deg,#050208 0%,#0a0410 38%,#180a30 72%,#2d1257 100%)', glowTop: 'rgba(124,58,237,.34)', glowBot: 'rgba(167,139,250,.16)', accent: '#A78BFA', hl: '#A78BFA', idx: '#7C3AED', text: '#FFFFFF', muted: '#B8B0CC', pillBg: '#7C3AED', pillText: '#FFFFFF', dot: '#A78BFA', mascotHook: 6, mascotCta: 2 },
  ultraviolet: { name: 'Ultraviolet', bg: 'linear-gradient(158deg,#0a0416 0%,#1a0a34 34%,#3b1580 70%,#6d28d9 100%)', glowTop: 'rgba(180,150,255,.42)', glowBot: 'rgba(124,58,237,.30)', accent: '#E2D3FF', hl: '#E7B9FF', idx: '#C9A6FF', text: '#FFFFFF', muted: '#CBC0E6', pillBg: 'linear-gradient(90deg,#7C3AED,#A78BFA)', pillText: '#FFFFFF', dot: '#E2D3FF', mascotHook: 3, mascotCta: 5 },
  charcoal: { name: 'Charcoal', bg: 'linear-gradient(158deg,#1b1a20 0%,#232129 47%,#2b2734 100%)', glowTop: 'rgba(167,139,250,.20)', glowBot: 'rgba(124,58,237,.13)', accent: '#C7B8FF', hl: '#A78BFA', idx: '#8B5CF6', text: '#DDD1FF', muted: '#B4A8D6', pillBg: '#7C3AED', pillText: '#FFFFFF', dot: '#C7B8FF', mascotHook: 6, mascotCta: 2 },
};

const MASCOTS = { 1: '1_presence', 2: '2_alignment', 3: '3_focus', 4: '4_drift', 5: '5_completion', 6: '6_pause' };
const _mascotCache = {};
function mascotUri(state) { if (_mascotCache[state]) return _mascotCache[state]; const f = path.join(MASCOT_DIR, `foco_state_${MASCOTS[state] || '1_presence'}.png`); const uri = fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : ''; _mascotCache[state] = uri; return uri; }
// RULE: always use the real FOCO logo image, never render "FOCO" as text.
const LOGO_URI = (() => { const f = path.join(__dirname, 'assets', 'foco-logo.png'); return fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : ''; })();
// Brand font: Fredoka (matches the FOCO logo wordmark). Embedded so renders are consistent.
const FONT_FREDOKA = (() => { const f = path.join(__dirname, 'assets', 'fonts', 'Fredoka.ttf'); return fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : ''; })();

function slideCss(t) {
  return `
@font-face{font-family:'Fredoka';src:url(data:font/ttf;base64,${FONT_FREDOKA}) format('truetype');font-weight:300 700;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Fredoka','Segoe UI',-apple-system,sans-serif;color:${t.text}}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:${t.bg};padding:96px 92px;display:flex;flex-direction:column}
.slide::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 62% 46% at 82% 8%,${t.glowTop},transparent 60%);pointer-events:none}
.slide::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 55% 40% at 12% 96%,${t.glowBot},transparent 60%);pointer-events:none}
.top-accent{position:absolute;top:0;left:0;width:100%;height:8px;background:linear-gradient(90deg,${t.idx},${t.accent},${t.idx});box-shadow:0 0 26px ${t.glowTop}}
.head{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2}
.brand-logo{height:58px;width:auto;display:block;filter:drop-shadow(0 2px 12px rgba(0,0,0,.45))}
.dots{display:flex;gap:10px}
.dot{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.22)}
.dot.on{background:${t.dot};box-shadow:0 0 14px ${t.dot}}
.body-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2}
.eyebrow{display:inline-flex;align-self:flex-start;align-items:center;gap:14px;font-size:26px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${t.accent};background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);padding:14px 26px;border-radius:999px;margin-bottom:40px}
.eyebrow::before{content:"";width:12px;height:12px;border-radius:50%;background:${t.accent};box-shadow:0 0 12px ${t.accent}}
h1{font-size:106px;font-weight:900;line-height:1.0;letter-spacing:-.035em;color:${t.text}}
.hl{color:${t.hl}}
.sub{margin-top:42px;font-size:40px;line-height:1.4;color:${t.muted};max-width:22ch;font-weight:500}
.idx{font-size:154px;font-weight:900;line-height:1;color:${t.idx};letter-spacing:-.04em;margin-bottom:6px}
h2{font-size:80px;font-weight:800;line-height:1.04;letter-spacing:-.025em;color:${t.text}}
.vbody{margin-top:34px;font-size:44px;line-height:1.42;color:${t.muted};max-width:24ch;font-weight:500}
.wm{position:absolute;top:-70px;right:-20px;font-size:660px;font-weight:900;line-height:.8;color:${t.idx};opacity:.09;z-index:0;letter-spacing:-.05em}
.kicker{display:flex;align-items:center;gap:20px;font-size:30px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${t.accent};margin-bottom:28px}
.kbar{width:66px;height:8px;border-radius:4px;background:${t.accent}}
.hcard{align-self:flex-start;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.28);border-radius:26px;padding:40px 42px 34px;position:relative;max-width:90%}
.hcard h2{font-size:66px}
.numbadge{position:absolute;top:-32px;left:36px;background:${t.idx};color:#fff;font-size:32px;font-weight:900;padding:8px 22px;border-radius:14px}
.photobg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}
.photo-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(107deg,rgba(7,3,12,.95) 0%,rgba(7,3,12,.82) 40%,rgba(7,3,12,.34) 72%,rgba(7,3,12,0) 100%),linear-gradient(0deg,rgba(9,4,18,.92) 0%,rgba(9,4,18,0) 36%),radial-gradient(ellipse 60% 40% at 84% 12%,rgba(124,58,237,.42),transparent 58%)}
.photo-scrim~.body-wrap h2,.photo-scrim~.body-wrap .vbody,.photo-scrim~.body-wrap .eyebrow{text-shadow:0 2px 22px rgba(0,0,0,.55)}
.mascot{position:absolute;z-index:1;pointer-events:none;filter:drop-shadow(0 40px 60px ${t.glowTop})}
.foot{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;font-size:30px;color:${t.muted};font-weight:600}
.handle{color:${t.text}}
.swipe{color:${t.accent};font-weight:800}
.cta-cap{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.cta-eyebrow{font-size:30px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${t.muted}}
.cta-big{font-size:58px;font-weight:900;color:${t.accent};letter-spacing:-.02em}
.cta-small{font-size:36px;font-weight:700;color:${t.text};margin-top:6px}
.badges{display:flex;flex-direction:column;gap:18px}
.store-badge{display:inline-flex;align-self:flex-start;align-items:center;gap:20px;padding:0 34px;height:104px;min-width:430px;background:linear-gradient(180deg,#1a1a1c,#050507);border:1px solid rgba(255,255,255,.16);border-radius:22px;text-decoration:none}
.store-icon{width:46px;height:46px;flex-shrink:0}
.bt{display:flex;flex-direction:column;gap:3px;line-height:1;color:#fff}
.bs{font-size:18px;font-weight:500;color:rgba(255,255,255,.85);letter-spacing:.06em}
.bb{font-size:32px;font-weight:700;letter-spacing:-.01em;color:#fff}`;
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function hl(s) { return esc(s).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>'); }
function dots(i, total, t) { let h = '<div class="dots">'; for (let k = 0; k < total; k++) h += `<div class="dot${k === i ? ' on' : ''}"></div>`; return h + '</div>'; }
function header(i, total, t) { return `<div class="head"><img class="brand-logo" src="${LOGO_URI}">${dots(i, total, t)}</div>`; }

const LAYOUTS = { number: 0, watermark: 1, kicker: 2, card: 3 };
function slideDoc(kind, data, i, total, t, layout) {
  let inner;
  if (kind === 'hook') inner = `${header(i, total, t)}
    <div class="body-wrap"><span class="eyebrow">${esc(data.topicLabel || 'FOCO')}</span><h1>${hl(data.hook.headline)}</h1>${data.hook.subline ? `<div class="sub">${esc(data.hook.subline)}</div>` : ''}</div>
    <img class="mascot" src="${mascotUri(t.mascotHook)}" style="width:360px;right:70px;bottom:150px">
    <div class="foot"><span class="handle">@foco.adhd</span><span class="swipe">swipe →</span></div>`;
  else if (kind === 'cta') inner = `${header(i, total, t)}
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="gp-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00E3FF"/><stop offset="33%" stop-color="#00F076"/><stop offset="66%" stop-color="#FFE000"/><stop offset="100%" stop-color="#FF3A44"/></linearGradient></defs></svg>
    <div class="body-wrap"><h2 style="font-size:82px">${hl(data.cta.headline)}</h2><div class="vbody" style="font-size:44px;margin-bottom:34px">${esc(data.cta.body)}</div>
    <div class="cta-eyebrow" style="margin-bottom:18px">FOCO app now on</div>
    <div class="badges">
      <a class="store-badge"><svg class="store-icon" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg><span class="bt"><span class="bs">Download on the</span><span class="bb">App Store</span></span></a>
      <a class="store-badge"><svg class="store-icon" viewBox="0 0 24 24"><path d="M3.5 2.5v19l15-9.5z" fill="url(#gp-grad)"/></svg><span class="bt"><span class="bs">GET IT ON</span><span class="bb">Google Play</span></span></a>
    </div>
    <div class="cta-small" style="margin-top:24px">🔗 Link in bio</div></div>
    <img class="mascot" src="${mascotUri(t.mascotCta)}" style="width:270px;right:52px;bottom:110px">
    <div class="foot"><span class="handle">@foco.adhd</span><span>tryfoco.com</span></div>`;
  else {
    const nn = String(data.n).padStart(2, '0'), H = hl(data.headline), B = esc(data.body);
    const vp = [3, 1, 4, 5][(data.n - 1) % 4];
    const masc = `<img class="mascot" src="${mascotUri(vp)}" style="width:184px;right:66px;bottom:150px;opacity:.95">`;
    const foot = `<div class="foot"><span class="handle">@foco.adhd</span><span>${data.n} / ${total - 2}</span></div>`;
    let bw;
    if (layout === 'photo') {
      bw = `<div class="photobg"${data.photo ? ` style="background-image:url('${data.photo}')"` : ''}></div><div class="photo-scrim"></div><div class="body-wrap"><span class="eyebrow" style="margin-bottom:26px">Point ${nn}</span><h2>${H}</h2><div class="vbody" style="color:#F1ECFB">${B}</div></div>`;
    } else {
      const L = LAYOUTS[layout] !== undefined ? LAYOUTS[layout] : 0; // uniform across the whole carousel
      if (L === 0) bw = `<div class="body-wrap"><div class="idx">${nn}</div><h2>${H}</h2><div class="vbody">${B}</div></div>${masc}`;
      else if (L === 1) bw = `<div class="wm">${nn}</div><div class="body-wrap"><h2>${H}</h2><div class="vbody">${B}</div></div>${masc}`;
      else if (L === 2) bw = `<div class="body-wrap"><div class="kicker"><span class="kbar"></span>Point ${nn}</div><h2>${H}</h2><div class="vbody">${B}</div></div>${masc}`;
      else bw = `<div class="body-wrap"><div class="hcard"><span class="numbadge">${nn}</span><h2>${H}</h2></div><div class="vbody" style="margin-top:34px">${B}</div></div>${masc}`;
    }
    inner = `${header(i, total, t)}${bw}${foot}`;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${slideCss(t)}</style></head><body><div class="slide"><div class="top-accent"></div>${inner}</div></body></html>`;
}

function buildSlideList(fields) {
  const list = [{ kind: 'hook', data: { topicLabel: fields.topicLabel, hook: fields.hook } }];
  fields.slides.forEach((s, k) => list.push({ kind: 'value', data: { n: k + 1, headline: s.headline, body: s.body, photoQuery: s.photoQuery } }));
  list.push({ kind: 'cta', data: { cta: fields.cta } });
  return list;
}
// Minimal ZIP (store method) so "Download all" is a single file — browsers block
// multiple auto-downloads from one click.
const _crcT = (() => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = _crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(entries) {
  const parts = [], central = []; let off = 0;
  for (const e of entries) {
    const nm = Buffer.from(e.name, 'utf8'), data = e.data, crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    parts.push(lh, nm, data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, nm);
    off += 30 + nm.length + data.length;
  }
  const cen = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10); eocd.writeUInt32LE(cen.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cen, eocd]);
}

async function render(fields) {
  const t = THEMES[fields.theme] || THEMES.midnight;
  const slides = buildSlideList(fields);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(OUT_DIR, stamp); fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  const files = [], zipEntries = [];
  const layout = fields.layout || 'number';
  let resolvedPhotos = null;
  if (layout === 'photo') {
    const vs = slides.filter(s => s.kind === 'value');
    const provided = Array.isArray(fields.slidePhotos) ? fields.slidePhotos : []; // per-slide (data URI) — highest priority
    const upl = Array.isArray(fields.uploads) ? fields.uploads : [];              // bulk uploads, in order
    const pgN = fields.photoPage || 1;
    for (let k = 0; k < vs.length; k++) {
      if (provided[k] && provided[k].length) { vs[k].data.photo = provided[k]; continue; }   // per-slide override wins
      if (upl[k] && upl[k].length) { vs[k].data.photo = upl[k]; continue; }
      if (fields.mainImage) { vs[k].data.photo = fields.mainImage; continue; }               // main image = default for all slides
      // else fetch a photo that matches THIS slide's own AI-written visual query (global box overrides)
      const q = fields.photoQuery || vs[k].data.photoQuery || fields.topicLabel || 'adhd lifestyle';
      let urls = await pexelsSearch(q, 10, pgN);
      if (!urls.length) urls = await pexelsSearch(q, 10, 1);
      let photo = '';
      const start = (pgN - 1) % Math.max(1, urls.length); // offset by photoPage so swaps differ
      for (let j = 0; j < urls.length; j++) { const d = await downloadImage(urls[(start + j) % urls.length]); if (d) { photo = d; break; } }
      vs[k].data.photo = photo;
    }
    resolvedPhotos = vs.map(s => s.data.photo);
  }
  for (let i = 0; i < slides.length; i++) { await pg.setContent(slideDoc(slides[i].kind, slides[i].data, i, slides.length, t, layout), { waitUntil: 'networkidle' }); await pg.waitForTimeout(120); const name = `slide-${String(i + 1).padStart(2, '0')}.png`; const abs = path.join(dir, name); await pg.screenshot({ path: abs, type: 'png' }); files.push(`/out/${stamp}/${name}`); zipEntries.push({ name, data: fs.readFileSync(abs) }); }
  await browser.close();
  const cap = (fields.caption || '') + '\n\n' + (fields.hashtags || []).join(' ');
  fs.writeFileSync(path.join(dir, 'caption.txt'), cap);
  zipEntries.push({ name: 'caption.txt', data: Buffer.from(cap, 'utf8') });
  fs.writeFileSync(path.join(dir, 'carousel.zip'), makeZip(zipEntries));
  return { stamp, files, zip: `/out/${stamp}/carousel.zip`, photos: resolvedPhotos };
}

// ─── server ──────────────────────────────────────────────────────────────────────
function readBody(req) { return new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => r(b)); }); }
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function serveFile(res, file, type) { fs.readFile(file, (e, d) => { if (e) { res.writeHead(404); res.end('not found'); } else { res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store, must-revalidate' }); res.end(d); } }); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/') return serveFile(res, path.join(__dirname, 'carousel-studio-ui.html'), 'text/html');
    if (url.pathname === '/posts') return json(res, 200, await listPosts());
    if (url.pathname === '/themes') return json(res, 200, Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, { name: v.name, bg: v.bg, accent: v.accent, idx: v.idx }])));
    if (url.pathname.startsWith('/out/')) { const p = path.join(OUT_DIR, url.pathname.slice(5)); return serveFile(res, p, p.endsWith('.zip') ? 'application/zip' : 'image/png'); }
    if (url.pathname === '/generate' && req.method === 'POST') return json(res, 200, await generate(JSON.parse(await readBody(req) || '{}')));
    if (url.pathname === '/regen-slide' && req.method === 'POST') return json(res, 200, await regenSlide(JSON.parse(await readBody(req) || '{}')));
    if (url.pathname === '/render' && req.method === 'POST') return json(res, 200, await render(JSON.parse(await readBody(req) || '{}')));
    res.writeHead(404); res.end('not found');
  } catch (e) { json(res, 500, { error: e.message }); }
});
server.listen(PORT, () => console.log(`\n🎠  FOCO Carousel Studio  →  http://localhost:${PORT}\n`));
