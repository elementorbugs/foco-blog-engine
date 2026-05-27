#!/usr/bin/env node
// gsc-refresh.js — detects post position regressions and writes a refresh queue.
//
// Compares two 28-day windows (prior vs recent) for each page and flags ones
// that lost ≥40% of their position rank AND had ≥30 impressions in the prior
// window (locked thresholds — see memory/project_gsc_engine_upgrade.md).
//
// Works on day 1 with no historical snapshots — the two windows are pulled
// from GSC in one shot. As historical snapshots accumulate, we could improve
// this by detecting trend, not just delta. For v1, window-vs-window is fine.
//
// Output:
//   keyword-research/gsc-refresh-queue.json
//     { generated_at, comparison, thresholds, queue: [{slug, ...}], skipped: {...} }
//
// The queue is consumed by daily-generate.js (later iteration) or by manual
// review for now. Each entry includes enough context to feed create-post.js
// for a rewrite.
//
// Usage:
//   node gsc-refresh.js                 # default windows, write queue
//   node gsc-refresh.js --verbose       # print findings to stdout

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getAccessToken, getEncodedProperty, getProperty } = require('./gsc-auth');

// ─── locked thresholds (memory/project_gsc_engine_upgrade.md) ───────────────
const POS_DROP_PCT = 0.40;            // ≥40% position rank loss = regression
const MIN_PRIOR_IMPR = 30;            // baseline floor (avoid low-volume noise)
const WINDOW_DAYS = 28;
const VERBOSE = process.argv.includes('--verbose');

// ─── paths ───────────────────────────────────────────────────────────────────
const OUT_PATH = path.join(__dirname, 'keyword-research', 'gsc-refresh-queue.json');

function fmtDate(d) { return d.toISOString().slice(0, 10); }

// Resolve the two windows: end of recent = 3 days ago (GSC data lag), each
// window is WINDOW_DAYS long, no gap between them.
function resolveWindows() {
  const recentEnd = new Date(); recentEnd.setUTCDate(recentEnd.getUTCDate() - 3);
  const recentStart = new Date(recentEnd); recentStart.setUTCDate(recentStart.getUTCDate() - WINDOW_DAYS + 1);
  const priorEnd = new Date(recentStart); priorEnd.setUTCDate(priorEnd.getUTCDate() - 1);
  const priorStart = new Date(priorEnd); priorStart.setUTCDate(priorStart.getUTCDate() - WINDOW_DAYS + 1);
  return {
    recent: { startDate: fmtDate(recentStart), endDate: fmtDate(recentEnd) },
    prior: { startDate: fmtDate(priorStart), endDate: fmtDate(priorEnd) },
  };
}

// ─── GSC page query ──────────────────────────────────────────────────────────
async function queryPages({ startDate, endDate, label }) {
  const token = await getAccessToken();
  const body = JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 5000 });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/webmasters/v3/sites/${getEncodedProperty()}/searchAnalytics/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`[${label}] HTTP ${res.statusCode}: ${text}`));
        }
        const rows = (JSON.parse(text).rows || []).map(r => ({
          page: r.keys[0],
          clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
        }));
        console.log(`  [${label}] ${startDate} → ${endDate}: ${rows.length} pages`);
        resolve(rows);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  const { recent, prior } = resolveWindows();
  console.log(`▶ GSC refresh detection for ${getProperty()}`);
  console.log(`  prior  window: ${prior.startDate} → ${prior.endDate}`);
  console.log(`  recent window: ${recent.startDate} → ${recent.endDate}`);
  console.log('');

  const [priorRows, recentRows] = await Promise.all([
    queryPages({ ...prior, label: 'prior ' }),
    queryPages({ ...recent, label: 'recent' }),
  ]);

  const priorByPage = new Map(priorRows.map(r => [r.page, r]));
  const queue = [];
  const skipped = { newPage: 0, lowImpr: 0, healthy: 0, improved: 0 };

  for (const r of recentRows) {
    const p = priorByPage.get(r.page);
    if (!p) { skipped.newPage++; continue; }                  // didn't exist in prior window
    if (p.impressions < MIN_PRIOR_IMPR) { skipped.lowImpr++; continue; }

    // Position is "rank" — LOWER is BETTER. A 40% position drop means the
    // numeric rank value got 40% worse (e.g. 5 → 7, which is +40%).
    const posChange = (r.position - p.position) / p.position;
    if (posChange < POS_DROP_PCT) {
      if (posChange < 0) skipped.improved++;
      else skipped.healthy++;
      continue;
    }

    const slug = r.page.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '') || '(homepage)';
    queue.push({
      page: r.page,
      slug,
      prior:  { position: round1(p.position), impressions: p.impressions, clicks: p.clicks, ctr: round3(p.ctr) },
      recent: { position: round1(r.position), impressions: r.impressions, clicks: r.clicks, ctr: round3(r.ctr) },
      posChangePct: round2(posChange),                        // e.g. 0.55 = position got 55% worse
      imprChangePct: round2((r.impressions - p.impressions) / Math.max(p.impressions, 1)),
      reason: 'position-regression',
    });
  }

  queue.sort((a, b) => b.prior.impressions - a.prior.impressions);

  const output = {
    generated_at: new Date().toISOString(),
    comparison: { prior, recent },
    thresholds: { posDropPct: POS_DROP_PCT, minPriorImpr: MIN_PRIOR_IMPR },
    counts: {
      pagesEvaluated: recentRows.length,
      queued: queue.length,
      skipped,
    },
    queue,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  console.log('');
  console.log(`✓ ${queue.length} page(s) queued for refresh`);
  console.log(`  skipped — new:${skipped.newPage}, low-impr:${skipped.lowImpr}, healthy:${skipped.healthy}, improved:${skipped.improved}`);
  console.log(`  → keyword-research/gsc-refresh-queue.json`);

  if (VERBOSE && queue.length) {
    console.log('\n  Refresh queue (sorted by prior impressions):');
    for (const q of queue) {
      console.log(`    ${q.slug}`);
      console.log(`      pos: ${q.prior.position} → ${q.recent.position} (+${(q.posChangePct*100).toFixed(0)}% worse)`);
      console.log(`      impr: ${q.prior.impressions} → ${q.recent.impressions} (${q.imprChangePct >= 0 ? '+' : ''}${(q.imprChangePct*100).toFixed(0)}%)`);
    }
  }
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }

main().catch(e => { console.error('✗', e.message); process.exit(1); });
