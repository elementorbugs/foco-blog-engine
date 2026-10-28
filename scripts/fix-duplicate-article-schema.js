// Site-wide schema dedupe (2026-10-20). create-post.js used to inject, on every post:
//   - a standalone Article block, duplicating RankMath's BlogPosting (second article entity, frozen dates)
//   - a standalone Organization block with no @id, i.e. a second anonymous "FOCO" next to RankMath's #organization
// This removes the Article block and gives the Organization block RankMath's @id so the two merge.
// Safety: only touches a post whose LIVE page already carries a RankMath BlogPosting/Article node in its @graph.
//   node scripts/fix-duplicate-article-schema.js          # dry run
//   node scripts/fix-duplicate-article-schema.js --live
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const env = {};
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const LIVE = process.argv.includes('--live');
const ORG_ID = 'https://www.tryfoco.com/#organization';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LD = /\n*(<!-- wp:html -->)?<script type="application\/ld\+json">(\{[\s\S]*?)<\/script>(<!-- \/wp:html -->)?/g;

function fix(content) {
  let removed = 0, orgs = 0;
  const out = content.replace(LD, (m, a, json, b) => {
    let o; try { o = JSON.parse(json); } catch (e) { return m; }
    if (o['@type'] === 'Article') { removed++; return ''; }
    if (o['@type'] === 'Organization' && o['@id'] !== ORG_ID) {
      orgs++;
      const { '@context': ctx, '@type': t, ...rest } = o;
      const lead = m.match(/^\n*/)[0];
      return lead + (a || '') + '<script type="application/ld+json">' + JSON.stringify({ '@context': ctx, '@type': t, '@id': ORG_ID, ...rest }) + '</script>' + (b || '');
    }
    return m;
  });
  return { out, removed, orgs };
}

function brokenCount(c) {
  let n = 0;
  for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { n++; } }
  return n;
}

async function rankMathHasArticle(link) {
  const h = await (await fetch(link + (link.includes('?') ? '&' : '?') + 'nc=' + Date.now())).text();
  for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*class="rank-math-schema[^"]*"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { if ((JSON.parse(m[1])['@graph'] || []).some(n => ['BlogPosting', 'Article', 'NewsArticle'].includes(n['@type']))) return true; } catch (e) {}
  }
  return false;
}

(async () => {
  const posts = [];
  for (let p = 1; ; p++) {
    const r = await fetch(BASE + `/wp-json/wp/v2/posts?status=publish&per_page=100&page=${p}&context=edit&_fields=id,slug,link,content`, { headers: { Authorization: AUTH } });
    if (!r.ok) break; const j = await r.json(); if (!j.length) break; posts.push(...j);
  }
  let changed = 0, skipped = 0; const broken = [];
  for (const p of posts) {
    const { out, removed, orgs } = fix(p.content.raw);
    if (!removed && !orgs) continue;
    if (removed && !(await rankMathHasArticle(p.link))) { console.log(`SKIP ${p.id} ${p.slug}: no RankMath article node live`); skipped++; continue; }
    // pre-existing broken blocks are reported, not fixed here; we must not ADD any
    if (brokenCount(out) > brokenCount(p.content.raw)) throw new Error('broke a schema block in ' + p.id);
    if (brokenCount(p.content.raw)) broken.push(p.id + ' ' + p.slug);
    changed++;
    if (!LIVE) { console.log(`DRY ${p.id} ${p.slug}: -${removed} Article, ${orgs} Organization @id`); continue; }
    fs.writeFileSync(path.join(ROOT, '.audit-cache', 'backups', `${p.id}-pre-schema-dedupe-${Date.now()}.html`), p.content.raw);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${p.id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: out }) });
    console.log(`${r.status} ${p.id} ${p.slug}: -${removed} Article, ${orgs} Organization @id`);
    await sleep(600);
  }
  if (broken.length) console.log('\nposts with a pre-existing broken ld+json block:\n  ' + broken.join('\n  '));
  console.log(`\n${posts.length} posts | ${changed} ${LIVE ? 'updated' : 'would change'} | ${skipped} skipped`);
})();
