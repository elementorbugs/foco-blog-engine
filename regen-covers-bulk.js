// Regenerates every cover whose title was mangled by the old 4-word slice.
// Reuses create-post.js's live deriveCoverTitle / coverFontSize / coverHtml and
// its slug-map mascot selection, so covers stay identical to what the pipeline
// would produce today.
//   node regen-covers-bulk.js            dry run, lists what would change
//   node regen-covers-bulk.js --live     render, upload, swap featured images
//   node regen-covers-bulk.js --live --only=slug1,slug2
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const COVERS_DIR = path.join(__dirname, 'covers-new');
const MASCOT_DIR = path.join(__dirname, 'assets', 'mascots');
const SLUG_MAP_PATH = path.join(__dirname, 'slug-map.json');
const DEFAULT_MASCOT = 'foco_state_1_presence';
const PILLAR_MASCOT = {
  'adhd-task-paralysis': 'foco_state_6_pause',
  'adhd-executive-function': 'foco_state_1_presence',
  'how-to-focus-with-adhd': 'foco_state_3_focus',
  'adhd-for-students': 'foco_state_3_focus',
  'adhd-at-work': 'foco_state_2_alignment',
  'adhd-task-breakdown-apps': 'foco_state_5_completion',
};
const C = { bg: '#040208', bg2: '#0a0410', primary: '#7C3AED', primary2: '#A78BFA' };

const src = fs.readFileSync(path.join(__dirname, 'create-post.js'), 'utf8');
eval(src.match(/function deriveCoverTitle[\s\S]*?\n}/)[0]);
eval(src.match(/function coverFontSize[\s\S]*?\n}/)[0]);
eval(src.match(/function coverHtml[\s\S]*?\n}\n/)[0]);

// the pre-fix behaviour, used only to detect which covers are stale
const oldDerive = h1 => {
  const b = (h1.split(':')[0] || h1).trim();
  const w = b.split(/\s+/).slice(0, 4);
  if (w.length <= 2) return w.join(' ');
  const h = Math.ceil(w.length / 2);
  return w.slice(0, h).join(' ') + '\n' + w.slice(h).join(' ');
};

const slugMap = fs.existsSync(SLUG_MAP_PATH) ? JSON.parse(fs.readFileSync(SLUG_MAP_PATH, 'utf8')) : { pillars: {}, spokes: {} };
function mascotFor(slug) {
  if (slugMap.pillars && slugMap.pillars[slug]) return slugMap.pillars[slug].mascot || DEFAULT_MASCOT;
  if (slugMap.spokes && slugMap.spokes[slug]) return PILLAR_MASCOT[slugMap.spokes[slug].pillar] || DEFAULT_MASCOT;
  return DEFAULT_MASCOT;
}

const LIVE = process.argv.includes('--live');
const onlyArg = (process.argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '');
const ONLY = onlyArg ? onlyArg.split(',').map(s => s.trim()).filter(Boolean) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Source filenames do not always match the live slug: page-feature-brain-dump.html
// is published at /adhd-brain-dump/, page-resources.html at /adhd-resources/.
// Try the literal slug first, then the adhd- prefixed form.
function slugCandidates(slug) {
  const c = [slug];
  const stripped = slug.replace(/^feature-/, '');
  if (!stripped.startsWith('adhd-')) c.push('adhd-' + stripped);
  return [...new Set(c)];
}

async function findBySlug(slug) {
  for (const cand of slugCandidates(slug)) {
    for (const type of ['posts', 'pages']) {
      const r = await fetch(BASE + '/wp-json/wp/v2/' + type + '?slug=' + cand + '&status=publish,draft&_fields=id,slug,featured_media', { headers: { Authorization: AUTH } });
      if (!r.ok) continue;
      const j = await r.json();
      if (Array.isArray(j) && j.length) return { type, ...j[0], slug: cand };
    }
  }
  return null;
}

(async () => {
  const jobs = [];
  for (const f of fs.readdirSync('posts-new').filter(x => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join('posts-new', f), 'utf8');
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!m) continue;
    const h1 = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").trim();
    const slug = f.replace(/^(post|page)-/, '').replace(/\.html$/, '');
    const next = deriveCoverTitle(h1);
    if (oldDerive(h1) === next) continue;              // cover already correct
    if (ONLY && !ONLY.includes(slug)) continue;
    jobs.push({ slug, h1, title: next, size: coverFontSize(next) });
  }

  console.log((LIVE ? 'LIVE' : 'DRY RUN') + ' - ' + jobs.length + ' cover(s) to regenerate\n');
  if (!LIVE) {
    jobs.forEach(j => console.log('  @' + String(j.size).padStart(2) + 'px  ' + j.slug + '\n            ' + JSON.stringify(j.title)));
    console.log('\nRe-run with --live to apply.');
    return;
  }

  const browser = await chromium.launch();
  let ok = 0, skip = 0, fail = 0;

  for (const j of jobs) {
    const target = await findBySlug(j.slug);
    if (!target) { console.log('SKIP  ' + j.slug + '  (not published on the site)'); skip++; continue; }

    const mascotPath = path.join(MASCOT_DIR, mascotFor(j.slug) + '.png');
    if (!fs.existsSync(mascotPath)) { console.error('FAIL  ' + j.slug + '  mascot missing: ' + mascotFor(j.slug)); fail++; continue; }

    const htmlPath = path.join(COVERS_DIR, 'cover-' + j.slug + '.html');
    const pngPath = path.join(COVERS_DIR, 'cover-' + j.slug + '.png');
    fs.writeFileSync(htmlPath, coverHtml(j.title, mascotPath));

    const pg = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await pg.goto('file:///' + htmlPath.split(path.sep).join('/'));
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: pngPath, type: 'png' });
    await pg.close();

    const up = await fetch(BASE + '/wp-json/wp/v2/media', {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="cover-' + j.slug + '-v2.png"' },
      body: fs.readFileSync(pngPath),
    });
    const media = await up.json();
    if (!up.ok) { console.error('FAIL  ' + j.slug + '  upload ' + up.status); fail++; continue; }

    await fetch(BASE + '/wp-json/wp/v2/media/' + media.id, {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt_text: j.h1.split(/\s*[:—–]\s*/)[0].trim() }),
    });
    const sw = await fetch(BASE + '/wp-json/wp/v2/' + target.type + '/' + target.id, {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_media: media.id }),
    });
    if (!sw.ok) { console.error('FAIL  ' + j.slug + '  swap ' + sw.status); fail++; continue; }

    await sleep(400);
    console.log('OK    ' + String(j.size).padStart(2) + 'px  ' + target.type + '/' + target.id + '  ' + j.slug + '  ' + JSON.stringify(j.title));
    ok++;
  }

  await browser.close();
  console.log('\n' + ok + ' regenerated, ' + skip + ' skipped, ' + fail + ' failed');
})();
