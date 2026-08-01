#!/usr/bin/env node
/**
 * gap-scan.js - cannibalization pre-check for a planned post.
 *
 * Scans the FULL BODY TEXT of every published post (never titles) for the
 * concept you are about to write about, and separately checks the H2/H3
 * skeleton for a heading that already answers your target query.
 *
 * A heading is a keyword claim: if a live post has an H3 asking your exact
 * target question, that post competes with the new one. Fix is to trim the
 * existing heading to one sentence + link out, not to drop the new post.
 *
 * Usage:
 *   node scripts/gap-scan.js "wall of awful" "brendan mahan"
 *   node scripts/gap-scan.js "demand avoidance" --query "what is pda in adults"
 *   node scripts/gap-scan.js "reward system" --drafts
 *
 * Flags:
 *   --query "..."   target search query; reports headings that overlap it heavily
 *   --drafts        include drafts (they cannibalize the moment they publish)
 *   --json          machine-readable output
 */
const fs = require('fs');
const path = require('path');

const ENV = path.join(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const AUTH = 'Basic ' + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString('base64');
const BASE = `https://${env.WP_HOST}/wp-json/wp/v2`;

const argv = process.argv.slice(2);
const flags = { drafts: false, json: false, query: null };
const terms = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--drafts') flags.drafts = true;
  else if (argv[i] === '--json') flags.json = true;
  else if (argv[i] === '--query') flags.query = argv[++i];
  else terms.push(argv[i]);
}
if (!terms.length) {
  console.error('Give at least one concept term. Example:\n  node scripts/gap-scan.js "wall of awful" "brendan mahan"');
  process.exit(1);
}

const STOP = new Set(['a', 'an', 'the', 'is', 'are', 'do', 'does', 'did', 'i', 'my', 'me', 'you', 'your', 'it', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'with', 'what', 'why', 'how', 'when', 'can', 'cant', 'not', 'but', 'that', 'this', 'be', 'am', 'if', 'so', 'at', 'as', 'from', 'about', 'work', 'works']);
const words = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

async function get(url) {
  const r = await fetch(url, { headers: { Authorization: AUTH } });
  if (!r.ok) throw new Error(`${r.status} on ${url}`);
  return r.json();
}

async function fetchPosts(status) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await get(`${BASE}/posts?status=${status}&per_page=100&page=${page}&context=edit&_fields=id,slug,status,content`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

(async () => {
  const posts = await fetchPosts('publish');
  if (flags.drafts) posts.push(...await fetchPosts('draft'));

  const report = { scanned: posts.length, terms, concept: [], headingCollisions: [] };
  const qWords = flags.query ? words(flags.query) : null;

  for (const post of posts) {
    const raw = post.content.raw || post.content.rendered || '';
    const text = strip(raw);

    let hits = 0;
    const matched = new Set();
    for (const t of terms) {
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const m = text.match(re);
      if (m) { hits += m.length; matched.add(m[0].toLowerCase()); }
    }

    const headings = [...raw.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)]
      .map(m => ({ level: +m[1], text: strip(m[2]).trim() }));

    if (hits) {
      report.concept.push({
        id: post.id, slug: post.slug, status: post.status, hits,
        matched: [...matched],
        headingsWithTerm: headings.filter(h => terms.some(t => new RegExp(t, 'i').test(h.text))).map(h => `h${h.level}: ${h.text}`),
      });
    }

    if (qWords && qWords.length) {
      for (const h of headings) {
        const hw = words(h.text);
        if (!hw.length) continue;
        const shared = qWords.filter(w => hw.includes(w)).length;
        const ratio = shared / qWords.length;
        if (ratio >= 0.6) {
          report.headingCollisions.push({
            id: post.id, slug: post.slug, status: post.status,
            heading: `h${h.level}: ${h.text}`, overlap: Math.round(ratio * 100),
          });
        }
      }
    }
  }

  report.concept.sort((a, b) => b.hits - a.hits);
  report.headingCollisions.sort((a, b) => b.overlap - a.overlap);

  if (flags.json) { console.log(JSON.stringify(report, null, 2)); return; }

  console.log(`\nscanned ${report.scanned} posts${flags.drafts ? ' (publish + draft)' : ' (publish only)'}`);
  console.log(`terms: ${terms.map(t => `"${t}"`).join(', ')}\n`);

  const total = report.concept.reduce((s, c) => s + c.hits, 0);
  if (!total) {
    console.log('CONCEPT COVERAGE: 0 mentions anywhere. Clean gap.\n');
  } else {
    console.log(`CONCEPT COVERAGE: ${total} mentions across ${report.concept.length} posts`);
    for (const c of report.concept) {
      const tag = c.status === 'draft' ? ' [DRAFT]' : '';
      console.log(`  ${String(c.hits).padStart(3)}x  #${c.id} /${c.slug}/${tag}   [${c.matched.join(' | ')}]`);
      c.headingsWithTerm.forEach(h => console.log(`         ${h}   <-- heading claims this term`));
    }
    console.log('');
  }

  if (qWords) {
    if (!report.headingCollisions.length) {
      console.log(`HEADING COLLISIONS for "${flags.query}": none.\n`);
    } else {
      console.log(`HEADING COLLISIONS for "${flags.query}":`);
      for (const c of report.headingCollisions) {
        const tag = c.status === 'draft' ? ' [DRAFT]' : '';
        console.log(`  ${c.overlap}%  #${c.id} /${c.slug}/${tag}\n        ${c.heading}`);
      }
      console.log('\n  Fix: trim the existing heading to one sentence + a link to the new post.');
      console.log('  Do not drop the new post over a heading collision.\n');
    }
  }

  console.log('Reminder: lexical overlap is not the cannibalization test. The test is GSC,');
  console.log('2 to 4 weeks out: two pages swapping positions on one query, both stuck');
  console.log('mid-page, and the wrong one winning. All three at once.\n');
})();
