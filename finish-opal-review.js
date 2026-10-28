// Post-publish pass for /opal-app-review/ (2026-10-28), same flow as finish-brick-review.js:
//  drop the pipeline TOC, re-add the foco-img figures it strips, RankMath meta description, publish,
//  then inbound links from brick-app-review, how-to-focus-with-adhd, focus-friend-app-review.
//  Never re-run create-post.js on this post afterwards.
//   node finish-opal-review.js
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SLUG = 'opal-app-review';
const URL = `https://www.tryfoco.com/${SLUG}/`;
const A = t => `<a href="${URL}">${t}</a>`;
const META = 'Opal app review for 2026: what the free plan includes, Opal Pro pricing, Opal vs iPhone Screen Time and Brick, the downsides, and whether it helps ADHD.';

// figures from the local source file, each re-inserted after the line that ends just before it
const SRC = fs.readFileSync(path.join(__dirname, 'posts-new', `post-${SLUG}.html`), 'utf8');
const FIGS = [...SRC.matchAll(/<!-- wp:html -->\s*<figure class="foco-img"[\s\S]*?<\/figure>\s*<!-- \/wp:html -->/g)].map(m => {
  const before = SRC.slice(0, m.index).trimEnd(), anchor = before.slice(before.lastIndexOf('\n') + 1);
  return { html: m[0], anchor, src: m[0].match(/src="([^"]+)"/)[1] };
});

// [find, replace, expected occurrences] per slug
const PLAN = {
  'brick-app-review': [
    ['Opal has a free plan limited to one rule, and most reviews put Opal Pro at about $99.99 a year, so check its App Store page for current pricing.</p>',
     `Opal has a free plan limited to one rule, and Opal Pro costs $99.99 a year (more in our ${A('Opal app review')}).</p>`, 1],
  ],
  'how-to-focus-with-adhd': [
    ['Apps like Opal or ScreenZen can lock specific apps for set windows,',
     `Apps like ${A('Opal')} or ScreenZen can lock specific apps for set windows,`, 1],
  ],
  'focus-friend-app-review': [
    ['conflicts with other Screen Time apps such as Opal and Forest.',
     `conflicts with other Screen Time apps such as ${A('Opal')} and Forest.`, 1],
  ],
};

const api = (p, opt = {}) => fetch(BASE + p, { ...opt, headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...(opt.headers || {}) } });
const bySlug = async slug => (await (await api(`/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_=${Math.random()}`)).json())[0];
const save = async (post, fields, tag) => {
  fs.mkdirSync(path.join(__dirname, '.audit-cache', 'backups'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${post.id}-pre-${tag}-${Date.now()}.html`), post.content.raw);
  const r = await api(`/wp-json/wp/v2/posts/${post.id}`, { method: 'POST', body: JSON.stringify(fields) });
  await sleep(2500);
  return { status: r.status, fresh: await bySlug(post.slug) };
};

(async () => {
  // 1-2: the review itself
  const rev = await bySlug(SLUG);
  if (!rev) { console.error('review not found: run create-post.js first'); process.exit(1); }
  let next = rev.content.raw.replace(/\n?<h2>Table of Contents<\/h2>\s*<ol>[\s\S]*?<\/ol>\n?/, '\n');
  for (const f of FIGS) {
    if (next.includes(f.src)) continue;
    const c = next.split(f.anchor).length - 1;
    if (c !== 1) { console.error(`ABORT figure anchor x${c}: ${f.anchor.slice(0, 70)}`); process.exit(1); }
    next = next.replace(f.anchor, () => f.anchor + '\n' + f.html);
  }
  if (next !== rev.content.raw) {
    const { status, fresh } = await save(rev, { content: next }, 'opal-finish');
    const raw = fresh.content.raw;
    const got = FIGS.filter(f => raw.includes(f.src)).length;
    console.log(`${SLUG}: HTTP ${status} | TOC gone: ${!raw.includes('Table of Contents')} | figures: ${got}/${FIGS.length}`);
    if (got !== FIGS.length || raw.includes('Table of Contents')) { console.error('ABORT before publish: body not clean'); process.exit(1); }
  } else console.log(`${SLUG}: nothing to change`);

  // 3: meta description
  const rm = await api('/wp-json/rankmath/v1/updateMeta', { method: 'POST', body: JSON.stringify({ objectID: rev.id, objectType: 'post', meta: { rank_math_description: META } }) });
  console.log(`RankMath meta: HTTP ${rm.status} | ${META.length} chars`);

  // 4: publish
  if (rev.status !== 'publish') {
    const r = await api(`/wp-json/wp/v2/posts/${rev.id}`, { method: 'POST', body: JSON.stringify({ status: 'publish' }) });
    await sleep(2500);
    console.log(`publish: HTTP ${r.status} | status now ${(await bySlug(SLUG)).status}`);
  }

  // 5: inbound links
  for (const [slug, edits] of Object.entries(PLAN)) {
    const post = await bySlug(slug); let body = post.content.raw, n = 0;
    if (body.includes(URL)) { console.log(`${slug}: SKIP already links`); continue; }
    for (const [find, to, want] of edits) {
      const c = body.split(find).length - 1;
      if (c !== want) { console.error(`${slug}: ABORT guard x${c} (want ${want}): ${find.slice(0, 60)}`); process.exit(1); }
      body = body.split(find).join(to); n++;
    }
    if (!n) continue;
    const { status, fresh } = await save(post, { content: body }, 'opal-link');
    console.log(`${slug}: HTTP ${status} | verified: ${fresh.content.raw.includes(URL)}`);
  }
})();
