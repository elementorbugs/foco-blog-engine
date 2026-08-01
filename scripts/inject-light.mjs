#!/usr/bin/env node
/**
 * inject-light.mjs — push light-articles.css into blog posts.
 *
 * The light-article CSS lives inside each post's content (Customizer
 * custom_css is not REST-writable and the theme is classic), wrapped in
 *   <!-- wp:html --><!--foco-light-start--><style>…</style><!--foco-light-end--><!-- /wp:html -->
 * so it can be replaced idempotently.
 *
 * Usage:
 *   node scripts/inject-light.mjs                 # dry run, every published post
 *   node scripts/inject-light.mjs --live          # write
 *   node scripts/inject-light.mjs body-doubling-adhd --live
 *   node scripts/inject-light.mjs --only-dark     # only posts holding a dark island
 *   node scripts/inject-light.mjs --drafts --live # drafts too, so they don't
 *                                                 # ship a stale block on publish
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = process.argv.includes('--live');
const ONLY_DARK = process.argv.includes('--only-dark');
const DRAFTS = process.argv.includes('--drafts');
const SLUGS = process.argv.slice(2).filter(a => !a.startsWith('--'));

const START = '<!--foco-light-start-->';
const END = '<!--foco-light-end-->';
// the standalone chart patch, now folded into light-articles.css
const LEGACY_CHART_FIX = /<!-- wp:html --><style>\/\*foco-chart-fix\*\/[\s\S]*?<\/style><!-- \/wp:html -->\s*/g;

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
let HOST = env.WP_HOST.replace(/\/$/, '');
if (!/^https?:\/\//.test(HOST)) HOST = 'https://' + HOST;
const AUTH = 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64');

async function wp(endpoint, opt = {}) {
  const r = await fetch(`${HOST}/wp-json/wp/v2/${endpoint}`, {
    ...opt,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...(opt.headers || {}) },
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${body.slice(0, 200)}`);
  return JSON.parse(body);
}

/** wpautop() injects <br/> into multiline <style>, so the CSS must be one line. */
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{};:,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

const CSS = minify(fs.readFileSync(path.join(ROOT, 'light-articles.css'), 'utf8'));
const BLOCK = `<!-- wp:html -->${START}<style>${CSS}</style>${END}<!-- /wp:html -->`;

/** dark components that depend on the DARK ISLANDS rules */
const DARK_ISLAND = /foco-bd-tool|foco-bd-dump-tool|foco-chart|foco-dark/;

async function allPosts() {
  // drafts carry the block too: publishing one with a stale block re-ships the bug
  const status = DRAFTS ? 'publish,draft,pending,future,private' : 'publish';
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await wp(`posts?per_page=100&page=${page}&status=${status}&context=edit&_fields=id,slug,status,content`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

const posts = (await allPosts())
  .filter(p => (SLUGS.length ? SLUGS.includes(p.slug) : true))
  .filter(p => (ONLY_DARK ? DARK_ISLAND.test(p.content.raw) : true));

if (SLUGS.length && posts.length !== SLUGS.length) {
  const found = posts.map(p => p.slug);
  console.error('not found:', SLUGS.filter(s => !found.includes(s)).join(', '));
}

console.log(`${LIVE ? 'WRITING' : 'DRY RUN'} — css ${CSS.length}b — ${posts.length} post(s)\n`);

let changed = 0, skipped = 0;
for (const p of posts) {
  const before = p.content.raw;
  let after = before;

  const i = after.indexOf(START), j = after.indexOf(END);
  if (i === -1 || j === -1) {
    // no light block yet: append one
    after = after.trimEnd() + '\n' + BLOCK;
  } else {
    // replace the whole wp:html wrapper so we never nest blocks
    const openTag = after.lastIndexOf('<!-- wp:html -->', i);
    const closeTag = after.indexOf('<!-- /wp:html -->', j);
    const from = openTag === -1 ? i : openTag;
    const to = closeTag === -1 ? j + END.length : closeTag + '<!-- /wp:html -->'.length;
    after = after.slice(0, from) + BLOCK + after.slice(to);
  }

  after = after.replace(LEGACY_CHART_FIX, '');

  if (after === before) { skipped++; continue; }
  changed++;
  const droppedFix = LEGACY_CHART_FIX.test(before);
  LEGACY_CHART_FIX.lastIndex = 0;
  console.log(`  ${(p.status && p.status !== 'publish' ? p.status + ' ' : '')}${p.slug} (#${p.id})  ${before.length} -> ${after.length}b${droppedFix ? '  [dropped legacy chart-fix]' : ''}`);

  if (LIVE) {
    await wp(`posts/${p.id}`, { method: 'POST', body: JSON.stringify({ content: after }) });
  }
}

console.log(`\n${changed} changed, ${skipped} already current.`);
if (!LIVE && changed) console.log('re-run with --live to write.');
if (LIVE && changed) console.log('now purge Varnish (Cloudways -> Manage Services) and re-run scripts/audit-contrast.js.');
