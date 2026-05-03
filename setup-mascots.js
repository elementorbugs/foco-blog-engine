// setup-mascots.js
// One-time uploader: pushes all 6 FOCO mascot states to WP media library
// and saves their URLs to mascot-urls.json. Used by create-post.js to
// inject mascot dividers inline in blog posts.
//
// Idempotent — re-run safely. If mascot-urls.json already has all 6, exits
// without re-uploading.
//
// Usage: node setup-mascots.js [--force]

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    line = line.trim(); if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('='); if (eq < 0) return;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return env;
}
const ENV = loadEnv();
const auth = Buffer.from(ENV.WP_USER + ':' + ENV.WP_APP_PASSWORD).toString('base64');
const HOST = ENV.WP_HOST;

const MASCOT_DIR = path.join(__dirname, 'assets', 'mascots');
const URL_MAP_PATH = path.join(__dirname, 'mascot-urls.json');
const FORCE = process.argv.includes('--force');

const MASCOTS = [
  'foco_state_1_presence',
  'foco_state_2_alignment',
  'foco_state_3_focus',
  'foco_state_4_drift',
  'foco_state_5_completion',
  'foco_state_6_pause',
];

function wpUploadPng(filePath, filename) {
  return new Promise((resolve) => {
    const buf = fs.readFileSync(filePath);
    const req = https.request({
      hostname: HOST, path: '/wp-json/wp/v2/media', method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buf.length },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: r.statusCode, data: null }); }
      });
    });
    req.on('error', () => resolve({ status: 0, data: null }));
    req.write(buf); req.end();
  });
}

function searchExistingMedia(filename) {
  return new Promise(resolve => {
    https.get({
      hostname: HOST, path: `/wp-json/wp/v2/media?search=${encodeURIComponent(filename)}&per_page=10`,
      headers: { Authorization: 'Basic ' + auth },
    }, r => {
      let chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const match = Array.isArray(data) ? data.find(m => m.slug && m.slug.includes(filename.replace('.png', ''))) : null;
          resolve(match);
        } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  console.log('\n━ FOCO Mascot Uploader ━\n');

  let urlMap = {};
  if (fs.existsSync(URL_MAP_PATH)) {
    urlMap = JSON.parse(fs.readFileSync(URL_MAP_PATH, 'utf8'));
    if (!FORCE && Object.keys(urlMap).length === MASCOTS.length) {
      console.log('  ✓ All 6 mascots already mapped. Use --force to re-upload.');
      console.log('  Current map:');
      Object.entries(urlMap).forEach(([k, v]) => console.log(`    ${k} → ${v.url}`));
      return;
    }
  }

  for (const name of MASCOTS) {
    const filename = name + '.png';
    const filePath = path.join(MASCOT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ Missing local file: ${filePath}`);
      continue;
    }

    if (urlMap[name] && !FORCE) {
      console.log(`  ✓ ${name} already in map`);
      continue;
    }

    // Check if already uploaded
    const existing = await searchExistingMedia(filename);
    if (existing && !FORCE) {
      urlMap[name] = { id: existing.id, url: existing.source_url };
      console.log(`  ✓ ${name} found in media library: #${existing.id}`);
      continue;
    }

    // Upload fresh
    const r = await wpUploadPng(filePath, filename);
    if (r.status === 201 && r.data && r.data.id) {
      urlMap[name] = { id: r.data.id, url: r.data.source_url };
      console.log(`  ↑ ${name} uploaded: #${r.data.id}`);
    } else {
      console.log(`  ✗ ${name} upload failed: ${r.status}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));
  console.log(`\n  Saved to mascot-urls.json (${Object.keys(urlMap).length} mascots)`);
})();
