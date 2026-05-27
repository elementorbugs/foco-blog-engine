#!/usr/bin/env node
// gsc-analyze.js — reads the three gsc-raw-*.json files and produces
// keyword-research/gsc-overlay.json, the file daily-generate.js → pickKeywords()
// merges on top of master-plan.json scores.
//
// What the overlay surfaces:
//
//   boosts            — keyword → { multiplier, reason } for striking-distance,
//                       content-gap, and transactional candidates. Picker
//                       multiplies the master-plan score by this.
//
//   gscOnlyCandidates — GSC queries the picker has NO candidate for at all
//                       (real content gaps Ubersuggest never surfaced).
//                       Picker can promote these into its own candidate pool.
//
//   ctrOpportunities  — existing pages with way-below-expected CTR. NOT a new
//                       post — these route to a title/snippet rewrite, not
//                       to create-post.js.
//
//   cannibalization   — single query split across 2+ pages. Flag for manual
//                       consolidation; picker won't auto-fix.
//
// Settings (multipliers, position bands, thresholds) live at the top so they
// match the locked decisions in memory/project_gsc_engine_upgrade.md.
//
// Usage:
//   node gsc-analyze.js              # consume gsc-raw-*.json, write gsc-overlay.json
//   node gsc-analyze.js --verbose    # also print top findings to stdout

const fs = require('fs');
const path = require('path');

// ─── locked settings (see memory/project_gsc_engine_upgrade.md) ─────────────
const STRIKING_POS_MIN = 8;          // pos 8-20 = "almost page 1"
const STRIKING_POS_MAX = 20;
const STRIKING_MIN_IMPR = 5;         // floor so noise doesn't get boosted
const STRIKING_MULTIPLIER = 5.0;     // aggressive — early-stage site

const GAP_MIN_IMPR = 3;              // very low floor; tryfoco.com is small
const GAP_MULTIPLIER = 2.0;

const TRANSACTIONAL_MULTIPLIER = 1.5;

// Cannibalization: same query, 2+ pages, both with this many impr
const CANNIBAL_MIN_IMPR_PER_PAGE = 3;

// Expected CTR by SERP position (rough industry average — used only as a
// "way below expected" signal, not an absolute target).
const EXPECTED_CTR_BY_POS = {
  1: 0.30, 2: 0.15, 3: 0.10, 4: 0.07, 5: 0.06,
  6: 0.045, 7: 0.035, 8: 0.028, 9: 0.022, 10: 0.018,
};
const CTR_OPPORTUNITY_RATIO = 0.30;  // actual < 30% of expected = flag
const CTR_OPPORTUNITY_MIN_IMPR = 50;

// Transactional intent — straight from PDF Template 2, lightly trimmed.
const TRANSACTIONAL_PATTERNS = [
  { type: 'comparison',  re: /\b(vs|versus|compared to|alternative|alternatives to|better than)\b/i },
  { type: 'best-top',    re: /\b(best|top \d+|top app|top tool|top software)\b/i },
  { type: 'price',       re: /\b(price|pricing|cost|how much|fee|cheap|affordable|free trial|discount|coupon|deal)\b/i },
  { type: 'review',      re: /\b(review|reviews|worth it|honest review|pros and cons|is it good)\b/i },
  { type: 'purchase',    re: /\b(buy|purchase|order|subscribe|sign up)\b/i },
];

const VERBOSE = process.argv.includes('--verbose');

// ─── paths ───────────────────────────────────────────────────────────────────
const KW_DIR = path.join(__dirname, 'keyword-research');
const FILES = {
  queries:   path.join(KW_DIR, 'gsc-raw-queries.json'),
  pages:     path.join(KW_DIR, 'gsc-raw-pages.json'),
  queryPage: path.join(KW_DIR, 'gsc-raw-query-page.json'),
  master:    path.join(KW_DIR, 'master-plan.json'),
  overlay:   path.join(KW_DIR, 'gsc-overlay.json'),
};

function requireFile(p, label) {
  if (!fs.existsSync(p)) throw new Error(`Missing ${label}: ${p}. Run gsc-pull.js first.`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normKw(s) {
  return String(s).toLowerCase().trim().replace(/\s+/g, ' ');
}

// Same slugify rule daily-generate.js uses, so overlay keys match candidate keys.
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/-$/, '');
}

// ─── master-plan candidate set ───────────────────────────────────────────────
// Build a Set of normalized keywords already in master-plan.json so we can
// tell which GSC queries are "extra" (gsc-only candidates / real content gaps).
function loadMasterPlanKeywords() {
  if (!fs.existsSync(FILES.master)) {
    console.warn('  ⚠ master-plan.json not found; treating all GSC queries as gsc-only.');
    return { covered: new Set(), allKnown: new Set() };
  }
  const plan = JSON.parse(fs.readFileSync(FILES.master, 'utf8'));
  const allKnown = new Set();
  const covered = new Set();  // covered: true => already has a post in WP
  for (const cluster of plan.clusters || []) {
    for (const k of cluster.items || []) {
      const n = normKw(k.keyword);
      allKnown.add(n);
      if (k.covered) covered.add(n);
    }
  }
  return { covered, allKnown };
}

// ─── existing-page detection ─────────────────────────────────────────────────
// Build the set of page slugs the site already has, so gap detection can tell
// "we already have a page that ranks for this" from "no page exists at all".
function loadExistingSlugs(pagesRaw) {
  const slugs = new Set();
  for (const r of pagesRaw.rows) {
    const p = r.page.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '');
    if (p && !p.includes('/')) slugs.add(p);          // top-level slug
    else if (p.includes('/')) slugs.add(p.split('/').pop()); // last segment
  }
  return slugs;
}

// ─── transactional classifier ────────────────────────────────────────────────
function classifyTransactional(query) {
  for (const { type, re } of TRANSACTIONAL_PATTERNS) {
    if (re.test(query)) return type;
  }
  return null;
}

// ─── main ────────────────────────────────────────────────────────────────────
function main() {
  const queriesRaw = requireFile(FILES.queries, 'gsc-raw-queries.json');
  const pagesRaw = requireFile(FILES.pages, 'gsc-raw-pages.json');
  const qpRaw = requireFile(FILES.queryPage, 'gsc-raw-query-page.json');
  const { covered, allKnown } = loadMasterPlanKeywords();
  const existingSlugs = loadExistingSlugs(pagesRaw);

  // Build query → [{page, impressions, position}] map from the query+page data.
  // Used for both cannibalization detection and "which page is Google serving".
  const queryToPages = new Map();
  for (const r of qpRaw.rows) {
    const q = normKw(r.query);
    if (!queryToPages.has(q)) queryToPages.set(q, []);
    queryToPages.get(q).push({ page: r.page, impressions: r.impressions, position: r.position, clicks: r.clicks });
  }

  // ─── classify every GSC query ──────────────────────────────────────────────
  const boosts = {};               // keyword → {multiplier, reason, ...}
  const gscOnlyCandidates = [];    // {keyword, impressions, position, multiplier, reason}
  const transactionalBoosts = [];

  for (const r of queriesRaw.rows) {
    const kw = normKw(r.query);
    if (covered.has(kw)) continue;        // already in WP, skip
    if (kw.startsWith('(') || kw.startsWith('"') || kw.length > 100) continue; // junk

    const currentPages = queryToPages.get(kw) || [];
    const topPage = currentPages.sort((a,b) => b.impressions - a.impressions)[0];

    // Striking distance: pos 8-20 with enough impressions
    if (r.position >= STRIKING_POS_MIN && r.position <= STRIKING_POS_MAX && r.impressions >= STRIKING_MIN_IMPR) {
      boosts[kw] = {
        multiplier: STRIKING_MULTIPLIER,
        reason: 'striking-distance',
        position: round1(r.position),
        impressions: r.impressions,
        clicks: r.clicks,
        currentPage: topPage ? topPage.page : null,
      };
    }
    // Content gap: GSC sees the query but it's not in master-plan AND no clear page targets it
    else if (!allKnown.has(kw) && r.impressions >= GAP_MIN_IMPR) {
      const entry = {
        keyword: kw,
        slug: slugify(kw),
        impressions: r.impressions,
        clicks: r.clicks,
        position: round1(r.position),
        currentPage: topPage ? topPage.page : null,
        multiplier: GAP_MULTIPLIER,
        reason: 'content-gap',
      };
      gscOnlyCandidates.push(entry);
      boosts[kw] = { multiplier: GAP_MULTIPLIER, reason: 'content-gap', ...entry };
    }

    // Transactional intent — stacks ON TOP of striking/gap boost.
    const intent = classifyTransactional(kw);
    if (intent && r.impressions >= GAP_MIN_IMPR) {
      const existing = boosts[kw];
      const baseMult = existing ? existing.multiplier : 1.0;
      const stackedMult = baseMult * TRANSACTIONAL_MULTIPLIER;
      boosts[kw] = {
        ...(existing || {}),
        multiplier: stackedMult,
        reason: existing ? `${existing.reason}+transactional-${intent}` : `transactional-${intent}`,
        intent,
        position: round1(r.position),
        impressions: r.impressions,
        clicks: r.clicks,
      };
      transactionalBoosts.push({ keyword: kw, intent, impressions: r.impressions, position: round1(r.position) });
    }
  }

  // ─── CTR opportunities (existing pages, not new posts) ────────────────────
  const ctrOpportunities = [];
  for (const r of pagesRaw.rows) {
    if (r.impressions < CTR_OPPORTUNITY_MIN_IMPR) continue;
    const pos = Math.round(r.position);
    const expected = EXPECTED_CTR_BY_POS[pos];
    if (!expected) continue;  // pos > 10 — fixing CTR won't matter if you're on page 2
    if (r.ctr >= expected * CTR_OPPORTUNITY_RATIO) continue;

    // What queries land on this page? Top 5 by impressions.
    const topQueries = qpRaw.rows
      .filter(qp => qp.page === r.page)
      .sort((a,b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map(qp => ({ query: qp.query, impressions: qp.impressions, position: round1(qp.position) }));

    ctrOpportunities.push({
      page: r.page,
      slug: r.page.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '') || '(homepage)',
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: round3(r.ctr),
      position: round1(r.position),
      expectedCtr: expected,
      ratio: round2(r.ctr / expected),
      topQueries,
    });
  }
  ctrOpportunities.sort((a,b) => b.impressions - a.impressions);

  // ─── cannibalization ──────────────────────────────────────────────────────
  const cannibalization = [];
  for (const [query, pages] of queryToPages.entries()) {
    const significant = pages.filter(p => p.impressions >= CANNIBAL_MIN_IMPR_PER_PAGE);
    if (significant.length < 2) continue;
    cannibalization.push({
      query,
      pages: significant
        .sort((a,b) => b.impressions - a.impressions)
        .map(p => ({ page: p.page, impressions: p.impressions, clicks: p.clicks, position: round1(p.position) })),
    });
  }
  cannibalization.sort((a,b) => sumImpr(b.pages) - sumImpr(a.pages));

  // ─── write overlay ────────────────────────────────────────────────────────
  const totals = {
    queries: queriesRaw.rows.length,
    pages: pagesRaw.rows.length,
    clicks: queriesRaw.rows.reduce((s,r) => s + r.clicks, 0),
    impressions: queriesRaw.rows.reduce((s,r) => s + r.impressions, 0),
  };

  const overlay = {
    generated_at: new Date().toISOString(),
    window: { startDate: queriesRaw.startDate, endDate: queriesRaw.endDate },
    totals,
    settings: {
      strikingPos: [STRIKING_POS_MIN, STRIKING_POS_MAX],
      strikingMinImpr: STRIKING_MIN_IMPR,
      strikingMultiplier: STRIKING_MULTIPLIER,
      gapMinImpr: GAP_MIN_IMPR,
      gapMultiplier: GAP_MULTIPLIER,
      transactionalMultiplier: TRANSACTIONAL_MULTIPLIER,
    },
    counts: {
      boosts: Object.keys(boosts).length,
      gscOnlyCandidates: gscOnlyCandidates.length,
      ctrOpportunities: ctrOpportunities.length,
      cannibalization: cannibalization.length,
      transactionalBoosts: transactionalBoosts.length,
    },
    boosts,
    gscOnlyCandidates: gscOnlyCandidates.sort((a,b) => b.impressions - a.impressions),
    ctrOpportunities,
    cannibalization,
  };

  fs.writeFileSync(FILES.overlay, JSON.stringify(overlay, null, 2));

  // ─── report ───────────────────────────────────────────────────────────────
  console.log(`▶ GSC overlay generated for ${overlay.window.startDate} → ${overlay.window.endDate}`);
  console.log(`  ${overlay.counts.boosts} keyword boost(s)`);
  console.log(`  ${overlay.counts.gscOnlyCandidates} gsc-only candidate(s)`);
  console.log(`  ${overlay.counts.ctrOpportunities} CTR opportunit(ies)`);
  console.log(`  ${overlay.counts.cannibalization} cannibalization case(s)`);
  console.log(`  → keyword-research/gsc-overlay.json`);

  if (VERBOSE) {
    if (Object.keys(boosts).length) {
      console.log('\n  Top boosted keywords:');
      Object.entries(boosts)
        .sort(([,a],[,b]) => b.impressions - a.impressions)
        .slice(0, 10)
        .forEach(([kw, b]) => console.log(`    ${b.multiplier}× [${b.reason}] ${kw} — pos ${b.position}, ${b.impressions} impr`));
    }
    if (ctrOpportunities.length) {
      console.log('\n  Top CTR opportunities:');
      ctrOpportunities.slice(0, 5).forEach(o =>
        console.log(`    ${o.slug} — pos ${o.position}, ${o.impressions} impr, CTR ${(o.ctr*100).toFixed(2)}% vs expected ${(o.expectedCtr*100).toFixed(1)}%`)
      );
    }
    if (cannibalization.length) {
      console.log('\n  Cannibalization:');
      cannibalization.slice(0, 5).forEach(c =>
        console.log(`    "${c.query}" → ${c.pages.length} pages competing (${c.pages.map(p => p.page.replace('https://tryfoco.com','')+'@'+p.position).join(', ')})`)
      );
    }
  }
}

// ─── tiny helpers ────────────────────────────────────────────────────────────
function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }
function sumImpr(arr) { return arr.reduce((s,p) => s + p.impressions, 0); }

try { main(); }
catch (e) { console.error('✗', e.message); process.exit(1); }
