// audit-score.js — computes spec compliance per article
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '.audit-cache');
const meta = JSON.parse(fs.readFileSync(path.join(cacheDir, 'audit-meta.json'), 'utf8'));

const BANNED = [
  /\bdelve\b/i, /\bnavigate\b/i, /\bleverage\b/i, /\bmoreover\b/i, /\bfurthermore\b/i,
  /\bseamlessly\b/i, /\bdive deep\b/i, /\brobust\b/i, /\bcutting-edge\b/i,
  /\brevolutionary\b/i, /\btransformative\b/i, /\bharness\b/i, /\bembark\b/i,
  /\bin conclusion\b/i, /\bgame-changer\b/i, /\bgame changer\b/i,
  /\bunleash\b/i, /in today's fast-paced world/i
];

const EDITORIAL = [
  /\[PERSONAL EXPERIENCE\]/i, /\[UNIQUE INSIGHT\]/i, /\[ORIGINAL DATA\]/i,
  /\[IMAGE:[^\]]*\]/i, /\[CHART:[^\]]*\]/i, /\[CITATION:[^\]]*\]/i
];

function strip(html) { return html.replace(/<[^>]+>/g, ' '); }

function countParagraphsOver3Sentences(html) {
  // crude: extract <p>...</p>, count sentences
  let count = 0;
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (const m of matches) {
    const text = m.replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim();
    if (!text) continue;
    // count sentence-enders not preceded by digits (avoid "3.5") — rough
    const ends = (text.match(/[.!?](?=\s|$)/g) || []).length;
    if (ends >= 4) count++;
  }
  return count;
}

function countLinks(html) {
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  let internal = 0, external = 0;
  for (const l of links) {
    if (!l) continue;
    if (l.startsWith('#') || l.startsWith('mailto:')) continue;
    if (/tryfoco\.com/i.test(l) || (l.startsWith('/') && !l.startsWith('//'))) {
      internal++;
    } else if (/^https?:\/\//i.test(l) && !/schema\.org/i.test(l)) {
      external++;
    }
  }
  return { internal, external };
}

const rows = [];
for (const m of meta) {
  if (m.error) continue;
  const html = fs.readFileSync(path.join(cacheDir, `${m.id}.html`), 'utf8');
  const lower = html.toLowerCase();

  const hasTLDR = /class=["'][^"']*foco-tldr/i.test(html);
  const hasKeyTakeaways = /key takeaways?/i.test(strip(html));
  const hasFAQH2 = /<h2[^>]*>[^<]*\b(faq|frequently asked|common questions)\b[^<]*<\/h2>/i.test(html);
  const links = countLinks(html);
  const has3Ext = links.external >= 3;
  const has4Int = links.internal >= 4;

  const bannedHits = [];
  const text = strip(html);
  for (const r of BANNED) { if (r.test(text)) bannedHits.push(r.source); }
  const cleanLang = bannedHits.length === 0;

  const longParas = countParagraphsOver3Sentences(html);
  const noLongParas = longParas === 0;

  const editorialHits = EDITORIAL.filter(r => r.test(html));
  const noEditorial = editorialHits.length === 0;

  const score =
    (hasTLDR?1:0) + (hasKeyTakeaways?1:0) + (hasFAQH2?1:0) +
    (has3Ext?1:0) + (has4Int?1:0) +
    (cleanLang?1:0) + (noLongParas?1:0) + (noEditorial?1:0);

  rows.push({
    id: m.id, slug: m.slug, status: m.status, wc: m.wc,
    score, hasTLDR, hasKeyTakeaways, hasFAQH2,
    extLinks: links.external, intLinks: links.internal,
    bannedHits: bannedHits.slice(0, 5), longParas,
    editorialHits: editorialHits.map(r => r.source)
  });
}

fs.writeFileSync(path.join(cacheDir, 'audit-scores.json'), JSON.stringify(rows, null, 2));

// print compact table
console.log('\nID    SLUG                                    STAT     WC   SC  TLDR KT FAQ  EX  IN  CLN LNG ED');
for (const r of rows) {
  const slug = (r.slug || '').padEnd(38).slice(0,38);
  const stat = (r.status || '').padEnd(7).slice(0,7);
  console.log(
    `${String(r.id).padEnd(5)} ${slug} ${stat} ${String(r.wc).padStart(4)}  ${r.score}/8 ` +
    ` ${r.hasTLDR?'Y':'.'}    ${r.hasKeyTakeaways?'Y':'.'}  ${r.hasFAQH2?'Y':'.'}    ` +
    `${String(r.extLinks).padStart(2)}  ${String(r.intLinks).padStart(2)}   ${r.bannedHits.length===0?'Y':'.'}   ${r.longParas===0?'Y':String(r.longParas)}  ${r.editorialHits.length===0?'Y':'.'}`
  );
  if (r.bannedHits.length) console.log(`        banned: ${r.bannedHits.join(', ')}`);
}
