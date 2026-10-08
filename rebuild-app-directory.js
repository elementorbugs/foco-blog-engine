#!/usr/bin/env node
// rebuild-app-directory.js - rebuilds the tabbed app directory on /best-adhd-app/ from app-directory.json.
//
//   node rebuild-app-directory.js               # dry run: prints what would be rendered
//   node rebuild-app-directory.js --live        # rewrites the directory block in the host post
//   node rebuild-app-directory.js --discover --live   # also pick up new published vs/alternative/review posts
//   node rebuild-app-directory.js --add=<slug> --cat=<category> [--title="..."] [--desc="..."] [--live]
//
// Only published posts are rendered (drafts stay in the JSON and appear once live).
// Only posts ABOUT APPS belong in the directory: no printables, general guides or coaches.
// create-post.js calls addCard() + rebuild() automatically after publishing an app post.

const https = require('https');
const fs = require('fs');
const path = require('path');

const DIR_FILE = path.join(__dirname, 'app-directory.json');
const START = '<div class="foco-appdex" id="foco-appdex">';
const END = '</div><!-- /wp:html -->';

function loadEnv() {
  const env = { ...process.env };
  const p = path.join(__dirname, '.env');
  if (fs.existsSync(p)) fs.readFileSync(p, 'utf8').split('\n').forEach(line => {
    line = line.trim(); if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('='); if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return env;
}
const ENV = loadEnv();
const WP_HOST = ENV.WP_HOST || 'tryfoco.com';
const auth = Buffer.from(ENV.WP_USER + ':' + ENV.WP_APP_PASSWORD).toString('base64');
const SITE = 'https://www.tryfoco.com';

function wpReq(method, p, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const req = https.request({ hostname: WP_HOST, path: p, method, headers: { Authorization: 'Basic ' + auth, ...(data && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }) } }, r => {
      const chunks = []; r.on('data', d => chunks.push(d));
      r.on('end', () => { const t = Buffer.concat(chunks).toString(); try { resolve({ status: r.statusCode, data: JSON.parse(t) }); } catch (e) { resolve({ status: r.statusCode, data: t.slice(0, 300) }); } });
    });
    req.on('error', reject); req.end(body);
  });
}

// Styles and behaviour of the directory. Light-article safe (see tasks/lessons.md):
// colours carry !important, and the script has no "&" because WordPress rewrites it to &#038;.
const CSS = '.foco-appdex{margin:28px 0 36px;width:min(1160px,calc(100vw - 48px));position:relative;left:50%;transform:translateX(-50%)}.foco-appdex .fa-h{margin:0 0 10px}.foco-appdex .fa-intro{margin:0 0 18px}.foco-appdex .fa-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}.foco-appdex .fa-tab{appearance:none;border:1px solid #D9CCF5 !important;background:#fff !important;color:#3B2A63 !important;font:600 14px/1 Inter,system-ui,sans-serif;padding:10px 14px;border-radius:999px;cursor:pointer}.foco-appdex .fa-tab:hover{border-color:#6D28D9 !important}.foco-appdex .fa-tab[aria-selected="true"]{background:#6D28D9 !important;border-color:#6D28D9 !important;color:#fff !important}.foco-appdex .fa-count{font-size:13px;color:#5B5170 !important;margin:0 0 14px}.foco-appdex .fa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.foco-appdex a.fa-card{display:flex;flex-direction:column;background:#fff !important;background-image:none !important;border:1px solid #E7E0F5 !important;border-radius:16px;overflow:hidden;text-decoration:none !important;box-shadow:none;padding:0 !important;transition:transform .15s,box-shadow .15s}.foco-appdex a.fa-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(76,29,149,.12)}.foco-appdex a.fa-card[hidden]{display:none !important}.foco-appdex img.fa-img{display:block !important;width:100% !important;max-width:none !important;height:auto;aspect-ratio:1200/630;object-fit:cover;margin:0 !important;border-radius:0 !important;border:0 !important;box-shadow:none !important}.foco-appdex .fa-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}.foco-appdex .fa-stats{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;padding:0;list-style:none}.foco-appdex .fa-stat{background:#F5F0FF !important;border:1px solid #E7E0F5 !important;border-radius:12px;padding:10px 14px;font:500 13px/1.2 Inter,system-ui,sans-serif;color:#4B4360 !important}.foco-appdex .fa-stat b{display:block;font:800 20px/1.1 Inter,system-ui,sans-serif;color:#160F22 !important}.foco-appdex .fa-icons{display:flex;align-items:center;gap:4px;margin:0 0 2px}.foco-appdex img.fa-ico{display:block !important;width:26px !important;height:26px !important;max-width:none !important;margin:0 !important;border-radius:7px !important;border:1px solid rgba(22,15,34,.08) !important;box-shadow:none !important}.foco-appdex .fa-more-ico{font:600 12px/1 Inter,system-ui,sans-serif;color:#5B5170 !important;margin-left:2px}.foco-appdex .fa-tag{font:700 11px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6D28D9 !important}.foco-appdex .fa-title{font:700 16px/1.3 Inter,system-ui,sans-serif;color:#160F22 !important;margin:0}.foco-appdex .fa-desc{font-size:14px;line-height:1.45;color:#4B4360 !important;margin:0}.foco-appdex .fa-more{margin-top:auto;font:600 13px/1 Inter,system-ui,sans-serif;color:#6D28D9 !important}@media (max-width:560px){.foco-appdex .fa-stat{padding:8px 10px;font-size:12px}.foco-appdex .fa-stat b{font-size:17px}.foco-appdex img.fa-ico{width:22px !important;height:22px !important;border-radius:6px !important}.foco-appdex .fa-grid{grid-template-columns:1fr;gap:10px}.foco-appdex a.fa-card{flex-direction:row;align-items:stretch}.foco-appdex img.fa-img{width:96px !important;min-width:96px;aspect-ratio:auto;height:100% !important;object-fit:cover;object-position:8% center}.foco-appdex .fa-body{padding:10px 12px;gap:4px}.foco-appdex .fa-title{font-size:15px}.foco-appdex .fa-desc{font-size:13px}.foco-appdex .fa-more{display:none}.foco-appdex .fa-tab{padding:8px 12px;font-size:13px}}';
const JS = '(function(){var root=document.getElementById("foco-appdex");if(!root){return;}var tabs=root.querySelectorAll(".fa-tab");var cards=root.querySelectorAll(".fa-card");var count=root.querySelector(".fa-count");function show(cat){var n=0;cards.forEach(function(c){var on=cat==="all"||c.getAttribute("data-cats").split(" ").indexOf(cat)>-1;c.hidden=!on;if(on){n++;}});tabs.forEach(function(t){t.setAttribute("aria-selected",t.getAttribute("data-cat")===cat?"true":"false");});count.textContent=n+" guides";}tabs.forEach(function(t){t.addEventListener("click",function(){show(t.getAttribute("data-cat"));});});show("all");})();';

const esc = s => String(s).replace(/&(?!#?\w+;)/g, 'and').replace(/</g, '').replace(/>/g, '').replace(/"/g, '&quot;');

function readDir() { return JSON.parse(fs.readFileSync(DIR_FILE, 'utf8')); }
function writeDir(d) { fs.writeFileSync(DIR_FILE, JSON.stringify(d, null, 2) + '\n'); }

// Category from the slug's words, then from the title; null when it has to be chosen by hand.
// "x-vs-y", "x-versus-y", "x-y-comparison", "X vs. Y" -> compare; "x-alternative(s)" -> alternatives;
// "x-review" -> reviews. A roundup like "reviews-of-adhd-apps" stays null on purpose.
const AUTO_RULES = [
  ['compare', w => w.includes('vs') || w.includes('versus') || w.includes('comparison') || w.includes('compared'), /\b(vs\.?|versus)\s/i],
  ['alternatives', w => w.some(x => x === 'alternative' || x === 'alternatives'), /\balternatives?\b/i],
  ['reviews', w => w[w.length - 1] === 'review' || (w.includes('review') && /^\d{4}$/.test(w[w.length - 1])), /\breview\b(?!s)/i],
];
function autoCategory(slug, title = '') {
  const words = String(slug).toLowerCase().split('-').filter(Boolean);
  for (const [cat, test] of AUTO_RULES) if (test(words)) return cat;
  for (const [cat, , re] of AUTO_RULES) if (re.test(title)) return cat;
  return null;
}

// Adds or updates a card. Returns the card. Throws on an unknown category.
function addCard({ slug, cat, title, desc }) {
  const dir = readDir();
  if (!dir.categories[cat]) throw new Error(`unknown category "${cat}" (use: ${Object.keys(dir.categories).join(', ')})`);
  const existing = dir.cards.find(c => c.slug === slug);
  const card = { slug, title: title || (existing && existing.title) || slug, desc: desc || (existing && existing.desc) || '', cat };
  if (existing) Object.assign(existing, card);
  else {
    // keep cards grouped by category, in category order
    const order = Object.keys(dir.categories);
    let at = dir.cards.length;
    for (let i = dir.cards.length - 1; i >= 0; i--) if (order.indexOf(dir.cards[i].cat) <= order.indexOf(cat)) { at = i + 1; break; } else at = i;
    dir.cards.splice(at, 0, card);
  }
  writeDir(dir);
  return card;
}

async function featuredImage(post) {
  if (post.featured_media) {
    const m = await wpReq('GET', `/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url,media_details`);
    const s = m.data && m.data.media_details && m.data.media_details.sizes;
    const url = (s && (s.medium_large || s.medium) || {}).source_url || (m.data && m.data.source_url);
    if (url) return url;
  }
  return null;
}

// Renders the directory and (when live) writes it into the host post.
async function rebuild({ live = false, quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const dir = readDir();
  const slugs = dir.cards.map(c => c.slug);
  const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dup.length) throw new Error('duplicate cards: ' + dup.join(', '));

  const rendered = [], skipped = [];
  for (const card of dir.cards) {
    const r = await wpReq('GET', `/wp-json/wp/v2/posts?slug=${encodeURIComponent(card.slug)}&status=publish&_fields=id,status,featured_media,title`);
    const post = Array.isArray(r.data) && r.data[0];
    if (!post) { skipped.push(card.slug + ' (not published)'); continue; }
    const img = await featuredImage(post);
    if (!img) { skipped.push(card.slug + ' (no featured image)'); continue; }
    rendered.push({ ...card, img });
  }

  // The directory spans 1160px. Widen the title, meta line and TL;DR of the host post to match,
  // so the top of the page shares one left edge. Scoped to the host post only; body text keeps its reading width.
  const p = `body.postid-${dir.hostPostId}`;
  const HERO_CSS = `${p} .blog-single .wrap>h1,${p} .blog-single .wrap>.post-meta,${p} .blog-single .foco-tldr{width:min(1160px,calc(100vw - 48px));max-width:none;position:relative;left:50%;transform:translateX(-50%);box-sizing:border-box}`;
  // App icons: card.apps if set, otherwise the apps named in the card title.
  const appKeys = Object.keys(dir.apps || {});
  const appsOf = c => c.apps || appKeys
    .map(k => [k, c.title.search(new RegExp('\\b' + dir.apps[k].name.replace(/\s+/g, '\\s+') + '\\b', 'i'))])
    .filter(([, at]) => at > -1).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  const icons = c => {
    const ks = appsOf(c).filter(k => dir.apps[k]); if (!ks.length) return '';
    const shown = ks.slice(0, 5).map(k => `<img class="fa-ico" src="${dir.apps[k].icon}" alt="${esc(dir.apps[k].name)} app icon" title="${esc(dir.apps[k].name)}" width="26" height="26" loading="lazy"/>`).join('');
    return `<span class="fa-icons">${shown}${ks.length > 5 ? `<span class="fa-more-ico">+${ks.length - 5}</span>` : ''}</span>`;
  };
  const covered = new Set(rendered.flatMap(appsOf));
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const stats = `<ul class="fa-stats"><li class="fa-stat"><b>${rendered.length}</b>app guides</li><li class="fa-stat"><b>${covered.size}+</b>apps covered</li><li class="fa-stat"><b>${Object.keys(dir.categories).length}</b>categories</li><li class="fa-stat"><b>${updated}</b>last updated</li></ul>`;
  const cats = Object.entries(dir.categories);
  const tabs = [['all', 'All'], ...cats].map(([k, l], i) => `<button type="button" class="fa-tab" role="tab" data-cat="${k}" aria-selected="${i === 0}">${l}</button>`).join('');
  const cards = rendered.map(c => `<a class="fa-card" href="${SITE}/${c.slug}/" data-cats="${c.cat}"><img class="fa-img" src="${c.img}" alt="${esc(c.title)}" loading="lazy" width="768" height="403"/><span class="fa-body">${icons(c)}<span class="fa-tag">${dir.categories[c.cat]}</span><span class="fa-title">${esc(c.title)}</span><span class="fa-desc">${esc(c.desc)}</span><span class="fa-more">Read the guide →</span></span></a>`).join('');
  const block = `${START}<style>${CSS}${HERO_CSS}</style><h2 id="adhd-app-index" class="fa-h">Browse every ADHD app guide</h2><p class="fa-intro">Reviews, comparisons and alternatives, plus guides by problem. Each card opens the full guide.</p>${stats}<div class="fa-tabs" role="tablist" aria-label="Filter ADHD app guides">${tabs}</div><p class="fa-count">${rendered.length} guides</p><div class="fa-grid">${cards}</div><script>${JS}</script></div>`;
  if (/&&/.test(block)) throw new Error('"&&" in block would break on WordPress');

  const counts = {}; rendered.forEach(c => counts[c.cat] = (counts[c.cat] || 0) + 1);
  log(`  directory: ${rendered.length} card(s) ${JSON.stringify(counts)}`);
  skipped.forEach(s => log('  skipped: ' + s));
  if (!live) return { rendered: rendered.length, skipped, pushed: false };

  const host = await wpReq('GET', `/wp-json/wp/v2/posts/${dir.hostPostId}?context=edit&_fields=content`);
  const raw = host.data && host.data.content && host.data.content.raw;
  if (!raw) throw new Error('could not read host post ' + dir.hostPostId);
  const s = raw.indexOf(START), e = raw.indexOf(END, s);
  if (s < 0 || e < 0) throw new Error('directory block not found in host post');
  let next = raw.slice(0, s) + block + raw.slice(e + '</div>'.length);
  next = next.replace(/<h2 id="adhd-app-index">[^<]*<\/h2>\s*<p>[^<]*<\/p>\s*(?=<!-- wp:html --><div class="foco-appdex")/, '');
  if (next === raw) { log('  no change'); return { rendered: rendered.length, skipped, pushed: false }; }
  const bk = path.join(__dirname, '.audit-cache', 'backups');
  if (fs.existsSync(bk)) fs.writeFileSync(path.join(bk, `${dir.hostSlug}-${dir.hostPostId}-pre-directory-${Date.now()}.html`), raw);
  const u = await wpReq('POST', `/wp-json/wp/v2/posts/${dir.hostPostId}`, { content: next });
  if (u.status !== 200) throw new Error('push failed: ' + u.status);
  log(`  pushed to /${dir.hostSlug}/`);
  return { rendered: rendered.length, skipped, pushed: true };
}

// Finds published posts that auto-match a category (vs / alternative / review) but have no card yet,
// so posts published by hand in wp-admin still reach the directory. Returns the added cards.
async function discover({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const dir = readDir();
  const known = new Set(dir.cards.map(c => c.slug).concat(dir.ignore || [], [dir.hostSlug]));
  // Only posts filed under the app category are candidates, so a concept post like
  // "procrastination-vs-paralysis" can never be mistaken for an app comparison.
  const catRes = await wpReq('GET', `/wp-json/wp/v2/categories?slug=${encodeURIComponent(dir.discoverCategory || 'app-reviews-comparisons')}&_fields=id`);
  const catId = Array.isArray(catRes.data) && catRes.data[0] && catRes.data[0].id;
  if (!catId) throw new Error('discover: app category not found');
  const added = [];
  for (let page = 1; page < 10; page++) {
    const r = await wpReq('GET', `/wp-json/wp/v2/posts?status=publish&categories=${catId}&per_page=100&page=${page}&_fields=slug,title,excerpt`);
    if (!Array.isArray(r.data) || !r.data.length) break;
    for (const p of r.data) {
      if (known.has(p.slug)) continue;
      const title = p.title.rendered.replace(/&#8217;/g, "'").replace(/&amp;/g, 'and').replace(/<[^>]+>/g, '');
      const cat = autoCategory(p.slug, title);
      if (!cat) continue;
      const ex = (p.excerpt && p.excerpt.rendered || '').replace(/<[^>]+>/g, ' ').replace(/&#8217;/g, "'").replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
      const first = ex.split(/(?<=[.!?])\s/)[0] || '';
      const desc = first.length > 95 ? first.slice(0, 95).replace(/\s\S*$/, '') + '...' : first;
      added.push(addCard({ slug: p.slug, cat, title: title.replace(/\s*\((19|20)\d\d\)\s*/, ' ').trim(), desc }));
      log(`  discovered: ${p.slug} -> ${cat}`);
    }
    if (r.data.length < 100) break;
  }
  if (!added.length) log('  discover: nothing new');
  return added;
}

module.exports = { addCard, autoCategory, rebuild, readDir, discover };

if (require.main === module) {
  const args = process.argv.slice(2);
  const arg = n => { const m = args.find(a => a.startsWith('--' + n + '=')); return m ? m.slice(n.length + 3) : null; };
  (async () => {
    const add = arg('add');
    if (add) {
      const cat = arg('cat') || autoCategory(add);
      if (!cat) throw new Error(`no category for "${add}": pass --cat=<${Object.keys(readDir().categories).join('|')}>`);
      const c = addCard({ slug: add, cat, title: arg('title'), desc: arg('desc') });
      console.log(`  card: ${c.slug} -> ${c.cat}`);
    }
    if (args.includes('--discover')) await discover();
    await rebuild({ live: args.includes('--live') });
  })().catch(e => { console.error('❌', e.message); process.exit(1); });
}
