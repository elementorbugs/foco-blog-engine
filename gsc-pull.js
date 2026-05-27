#!/usr/bin/env node
// gsc-pull.js — fetches the three datasets daily-generate.js needs and writes
// them to keyword-research/gsc-raw-*.json:
//
//   1. queries   — keyword → clicks/impressions/CTR/position (rowLimit 25000)
//   2. pages     — page URL → clicks/impressions/CTR/position (rowLimit 5000)
//   3. queryPage — keyword + page → ... (rowLimit 25000)
//
// The third dataset is what enables cannibalization detection and "which page
// is Google actually serving for this query" analysis. Pulls all three in
// parallel. Default window is last 28 days (Google's data is 2-3 days stale,
// so anything shorter is noise-heavy).
//
// Usage:
//   node gsc-pull.js                 # last 28 days, default
//   node gsc-pull.js --days=90       # custom window
//   node gsc-pull.js --start=2026-01-01 --end=2026-03-31
//   node gsc-pull.js --since-last    # incremental: from last successful pull
//
// Idempotent — overwrites the three JSON files each run. Tracks last pull in
// keyword-research/gsc-pull-meta.json so --since-last works.

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getAccessToken, getEncodedProperty, getProperty } = require('./gsc-auth');

// ─── CLI args ────────────────────────────────────────────────────────────────
const arg = (n, fb) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : fb;
};
const flag = (n) => process.argv.includes(`--${n}`);

const DAYS = parseInt(arg('days', '28'), 10);
const SINCE_LAST = flag('since-last');
const CUSTOM_START = arg('start');
const CUSTOM_END = arg('end');

// ─── paths ───────────────────────────────────────────────────────────────────
const OUT_DIR = path.join(__dirname, 'keyword-research');
const META_PATH = path.join(OUT_DIR, 'gsc-pull-meta.json');
const FILES = {
  queries:   path.join(OUT_DIR, 'gsc-raw-queries.json'),
  pages:     path.join(OUT_DIR, 'gsc-raw-pages.json'),
  queryPage: path.join(OUT_DIR, 'gsc-raw-query-page.json'),
};

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function resolveDateWindow() {
  if (CUSTOM_START && CUSTOM_END) return { startDate: CUSTOM_START, endDate: CUSTOM_END };

  // GSC data is 2-3 days delayed. End date = 3 days ago to be safe.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);

  let start;
  if (SINCE_LAST && fs.existsSync(META_PATH)) {
    const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    if (meta.endDate) {
      start = new Date(meta.endDate + 'T00:00:00Z');
      start.setUTCDate(start.getUTCDate() + 1);
    }
  }
  if (!start) {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - DAYS + 1);
  }

  if (start >= end) {
    // Already pulled through this window. Use a tiny 1-day window to be a no-op
    // rather than fail. (Or caller can skip --since-last to force.)
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);
  }

  return { startDate: fmtDate(start), endDate: fmtDate(end) };
}

// ─── API call ────────────────────────────────────────────────────────────────
// Paginates with startRow if the response hits rowLimit.
async function queryAnalytics({ dimensions, startDate, endDate, rowLimit, label }) {
  const allRows = [];
  let startRow = 0;
  let token = await getAccessToken();
  let pageNum = 0;

  while (true) {
    pageNum++;
    const body = JSON.stringify({ startDate, endDate, dimensions, rowLimit, startRow });

    const resp = await new Promise((resolve, reject) => {
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
        res.on('end', () => resolve({
          status: res.statusCode,
          text: Buffer.concat(chunks).toString('utf8'),
        }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    // 401 → token expired mid-pagination. Refresh once and retry the same page.
    if (resp.status === 401) {
      token = await getAccessToken({ force: true });
      continue;
    }
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`[${label}] HTTP ${resp.status}: ${resp.text}`);
    }
    const json = JSON.parse(resp.text);
    const rows = json.rows || [];
    allRows.push(...rows);
    process.stdout.write(`  [${label}] page ${pageNum}: +${rows.length} rows (total ${allRows.length})\n`);

    if (rows.length < rowLimit) break;
    startRow += rowLimit;

    // Safety: GSC quota is generous but don't loop forever on a bad response.
    if (pageNum >= 20) {
      console.warn(`  [${label}] ⚠ hit 20-page cap (${allRows.length} rows). Increase if needed.`);
      break;
    }
  }

  return allRows;
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const window_ = resolveDateWindow();
  console.log(`▶ GSC pull for ${getProperty()}`);
  console.log(`  window: ${window_.startDate} → ${window_.endDate}`);
  console.log('');

  const t0 = Date.now();
  const [queries, pages, queryPage] = await Promise.all([
    queryAnalytics({ ...window_, dimensions: ['query'],         rowLimit: 25000, label: 'queries   ' }),
    queryAnalytics({ ...window_, dimensions: ['page'],          rowLimit: 5000,  label: 'pages     ' }),
    queryAnalytics({ ...window_, dimensions: ['query', 'page'], rowLimit: 25000, label: 'queryPage ' }),
  ]);

  // Normalize: keys[] → {query, page} fields so downstream doesn't have to
  // remember the dimension order.
  const normQueries = queries.map(r => ({
    query: r.keys[0],
    clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
  }));
  const normPages = pages.map(r => ({
    page: r.keys[0],
    clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
  }));
  const normQueryPage = queryPage.map(r => ({
    query: r.keys[0], page: r.keys[1],
    clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
  }));

  fs.writeFileSync(FILES.queries,   JSON.stringify({ ...window_, rows: normQueries },   null, 2));
  fs.writeFileSync(FILES.pages,     JSON.stringify({ ...window_, rows: normPages },     null, 2));
  fs.writeFileSync(FILES.queryPage, JSON.stringify({ ...window_, rows: normQueryPage }, null, 2));

  fs.writeFileSync(META_PATH, JSON.stringify({
    lastRun: new Date().toISOString(),
    startDate: window_.startDate,
    endDate: window_.endDate,
    counts: {
      queries: normQueries.length,
      pages: normPages.length,
      queryPage: normQueryPage.length,
    },
  }, null, 2));

  const totalClicks = normQueries.reduce((s, r) => s + r.clicks, 0);
  const totalImpr = normQueries.reduce((s, r) => s + r.impressions, 0);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('');
  console.log(`✓ Wrote ${normQueries.length} queries, ${normPages.length} pages, ${normQueryPage.length} query+page rows in ${elapsed}s`);
  console.log(`  totals: ${totalClicks} clicks, ${totalImpr} impressions over ${window_.startDate} → ${window_.endDate}`);
}

main().catch(e => {
  console.error('✗', e.message);
  process.exit(1);
});
