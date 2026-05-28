// Publishes WP Pages (post_type=page) from posts-new/page-*.html
// Idempotent: checks for existing page by slug, updates if found, creates if not.
// Sets RankMath focus keyword + meta description in the same write.
//
// Usage:  node publish-pages.js              # processes the PAGES array below
//         node publish-pages.js --dry        # logs what it would do without pushing

const fs = require('fs');
const https = require('https');
const path = require('path');

const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const host = env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const auth = Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const DRY = process.argv.includes('--dry');

const PAGES = [
  {
    file: 'page-founders.html',
    slug: 'founders',
    title: 'The Founder Story — Why FOCO Exists',
    metaDesc: "FOCO founder Adi Ben Elyahu's real story — solo founder, mental freeze, no diagnosis, built the tool he needed for the moment right before you begin.",
    focusKeyword: 'foco founders',
    status: 'publish',
  },
  // SKIP: /about/ already exists (#283) with substantial user-written founder bio.
  // Do not overwrite. User will decide separately whether to merge or replace.
  // {
  //   file: 'page-about.html',
  //   slug: 'about',
  //   ...
  // },
  {
    file: 'page-contact.html',
    slug: 'contact',
    title: 'Contact FOCO',
    metaDesc: 'Reach FOCO at support@tryfoco.com — one inbox for support, press, partnerships, story submissions. Real human reading it. Reply within 2 business days.',
    focusKeyword: 'contact foco',
    status: 'publish',
  },
  {
    file: 'page-editorial-policy.html',
    slug: 'editorial-policy',
    title: 'FOCO Editorial Policy — How We Write About ADHD',
    metaDesc: 'How FOCO researches and writes ADHD content. Lived experience first, peer-reviewed sources, no AI slop, no shame loops. Every claim cited.',
    focusKeyword: 'editorial policy',
    status: 'publish',
  },
  {
    file: 'page-privacy.html',
    slug: 'privacy',
    title: 'Privacy Policy',
    metaDesc: "FOCO's privacy policy. We do not sell your data. App content stays on your device by default. GDPR + CCPA compliant. Contact support@tryfoco.com.",
    focusKeyword: 'privacy policy',
    status: 'draft', // lawyer review first
  },
  {
    file: 'page-terms.html',
    slug: 'terms',
    title: 'Terms of Service',
    metaDesc: 'FOCO terms of service. Use FOCO responsibly. Service provided as-is, not a medical device. Israel law governs disputes.',
    focusKeyword: 'terms of service',
    status: 'draft', // lawyer review first
  },
];

function wpRequest(method, p, body) {
  return new Promise((res, rej) => {
    const opts = {
      hostname: host,
      path: p,
      method,
      headers: {
        Authorization: 'Basic ' + auth,
        Accept: 'application/json',
        'User-Agent': 'foco-publish-pages/1.0',
      },
    };
    let payload;
    if (body) {
      payload = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json; charset=utf-8';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const r = https.request(opts, (response) => {
      let d = '';
      response.on('data', (c) => (d += c));
      response.on('end', () => {
        try {
          res({ status: response.statusCode, body: JSON.parse(d) });
        } catch {
          res({ status: response.statusCode, body: d.slice(0, 500) });
        }
      });
    });
    r.on('error', rej);
    if (payload) r.write(payload);
    r.end();
  });
}

async function findPageBySlug(slug) {
  const r = await wpRequest('GET', `/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=any&_fields=id,slug,status,link`);
  if (r.status === 200 && Array.isArray(r.body) && r.body.length > 0) return r.body[0];
  return null;
}

async function setRankMathMeta(postId, focusKeyword, description, title) {
  const meta = {
    objectID: postId,
    objectType: 'post',
    meta: {
      rank_math_focus_keyword: focusKeyword,
      rank_math_description: description,
      rank_math_title: title + ' %sep% %sitename%',
    },
  };
  const r = await wpRequest('POST', '/wp-json/rankmath/v1/updateMeta', meta);
  return r;
}

async function processPage(cfg) {
  console.log(`\n=== ${cfg.slug} (${cfg.status}) ===`);
  const filePath = path.join(__dirname, 'posts-new', cfg.file);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP: file not found at ${filePath}`);
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`  source: ${cfg.file} (${content.length} chars)`);

  const existing = await findPageBySlug(cfg.slug);
  const body = {
    title: cfg.title,
    slug: cfg.slug,
    content,
    status: cfg.status,
    comment_status: 'closed',
    ping_status: 'closed',
  };

  if (DRY) {
    console.log(`  [DRY] would ${existing ? 'UPDATE #' + existing.id : 'CREATE'} page with status=${cfg.status}`);
    return null;
  }

  let result;
  if (existing) {
    console.log(`  found existing page #${existing.id} (status=${existing.status}) — updating`);
    result = await wpRequest('POST', `/wp-json/wp/v2/pages/${existing.id}`, body);
  } else {
    console.log(`  no existing page — creating`);
    result = await wpRequest('POST', '/wp-json/wp/v2/pages', body);
  }

  if (result.status !== 200 && result.status !== 201) {
    console.log(`  ERROR: HTTP ${result.status}`);
    console.log(`  body: ${typeof result.body === 'string' ? result.body : JSON.stringify(result.body).slice(0, 300)}`);
    return null;
  }

  const pageId = result.body.id;
  const pageLink = result.body.link;
  console.log(`  PUSHED: #${pageId} | status=${result.body.status} | ${pageLink}`);

  // Set RankMath meta
  const meta = await setRankMathMeta(pageId, cfg.focusKeyword, cfg.metaDesc, cfg.title);
  if (meta.status === 200) {
    console.log(`  RankMath meta set ✓`);
  } else {
    console.log(`  RankMath meta WARN: HTTP ${meta.status}`);
  }
  return { id: pageId, link: pageLink, status: result.body.status };
}

(async () => {
  console.log(`Host: ${host} | DRY=${DRY} | ${PAGES.length} pages to process`);
  const results = [];
  for (const cfg of PAGES) {
    try {
      const r = await processPage(cfg);
      if (r) results.push({ slug: cfg.slug, ...r });
    } catch (e) {
      console.log(`  EXCEPTION on ${cfg.slug}: ${e.message}`);
    }
  }
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`  ${r.status.padEnd(10)} #${r.id}  ${r.link}`);
  }
})();
