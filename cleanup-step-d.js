// Step (ד) — safe cleanup of off-spec / duplicate articles.
// Order:
//   1. For each keeper article (10 mine + 27 engine), find any link to a source slug.
//   2. Rewrite href to the redirect target (or unwrap the <a> if no good target).
//   3. After all keepers are clean, trash the source articles.
// All source articles get moved to trash (status=trash) — reversible 30 days.
// No force-delete, no destructive ops on engine canonicals.

const fs = require('fs');
const https = require('https');

const c = fs.readFileSync('.env', 'utf8');
const e = (k) => { const m = c.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; };
const auth = Buffer.from(e('WP_USER') + ':' + e('WP_APP_PASSWORD')).toString('base64');
const HOST = e('WP_HOST');

function req(method, path, body) {
  return new Promise((res, rej) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, port: 443, path, method, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, response => {
      let d = ''; response.on('data', x => d += x);
      response.on('end', () => { try { res({ s: response.statusCode, b: JSON.parse(d) }); } catch { res({ s: response.statusCode, b: d }); } });
    });
    r.on('error', rej);
    if (payload) r.write(payload);
    r.end();
  });
}

// Sources to trash, with redirect target for incoming links.
// target=null means "unwrap the link" (keep anchor text, drop href).
const SOURCES = {
  // MERGE → keeper
  318: { slug: 'adhd-and-rsd',                         target: '/adhd-and-rejection-sensitive-dysphoria/' },
  322: { slug: 'how-to-cope-with-rsd',                 target: '/adhd-and-rejection-sensitive-dysphoria/' },
  363: { slug: 'adhd-predominantly-inattentive',       target: '/adhd-inattentive-presentation/' },
  371: { slug: 'adhd-in-adult-symptoms',               target: '/adhd-symptoms-women/' },
  397: { slug: 'task-breakdown-for-adhd',              target: '/ai-task-breakdown/' },
  413: { slug: 'task-breakdown-structure',             target: '/ai-task-breakdown/' },
  417: { slug: 'benefits-of-task-breakdown',           target: '/ai-task-breakdown/' },
  442: { slug: 'adhd-symptoms-overview',               target: '/adhd-symptoms-women/' },
  479: { slug: 'adhd-types-overview',                  target: '/adhd-inattentive-presentation/' },
  // DELETE outright
  250: { slug: 'adhd-or-bipolar',                      target: null },
  332: { slug: 'audhd-vs-adhd',                        target: '/adhd-vs-autism/' },              // engine 243
  340: { slug: 'best-career-for-people-with-adhd',     target: null },                            // P5 not built
  344: { slug: 'adhd-icd-10',                          target: '/adhd-diagnostic-codes/' },       // engine 227
  393: { slug: 'task-breakdown',                       target: '/ai-task-breakdown/' },
  434: { slug: 'adhd-test',                            target: null },
  438: { slug: 'therapy-for-adhd',                     target: null },
  484: { slug: 'executive-function-adhd-overview',     target: '/adhd-executive-function/' },     // engine P2 152
};

const SOURCE_SLUGS = Object.fromEntries(Object.entries(SOURCES).map(([id, s]) => [s.slug, { id: +id, target: s.target }]));

// Surviving articles (keepers) to scan + clean.
const SURVIVORS = [
  // 10 mine keepers
  314, 336, 348, 375, 379, 401, 452, 457, 463, 474,
  // 27 engine articles
  42, 47, 52, 60, 65, 112, 152, 158, 164, 170, 176, 182, 187, 200, 206, 212, 217, 222, 227, 232, 237, 239, 241, 243, 245, 247, 249,
];

// Replace a link to a source slug. If target=null OR target=self-slug, unwrap (drop <a>, keep text).
// For unwrap-cases inside <li>...</li> (Related lists), drop the entire <li> instead of leaving text.
function rewriteLink(html, ownSlug) {
  let modified = html;
  let counts = {};
  for (const [slug, { target }] of Object.entries(SOURCE_SLUGS)) {
    const slugEsc = slug.replace(/-/g, '\\-');
    const linkRe = new RegExp(`<a\\s+href="/${slugEsc}/"([^>]*)>([^<]*)</a>`, 'g');
    const matches = [...modified.matchAll(linkRe)];
    if (matches.length === 0) continue;
    counts[slug] = matches.length;
    const targetSlug = target ? target.replace(/^\/|\/$/g, '') : null;
    const shouldUnwrap = target === null || targetSlug === ownSlug;
    if (shouldUnwrap) {
      // First pass: drop full <li><a ...>text</a></li>  patterns (Related lists)
      const liRe = new RegExp(`<li>\\s*<a\\s+href="/${slugEsc}/"[^>]*>[^<]*</a>\\s*</li>\\s*\\n?`, 'g');
      modified = modified.replace(liRe, '');
      // Second pass: unwrap remaining inline <a>text</a>
      modified = modified.replace(linkRe, '$2');
    } else {
      modified = modified.replace(linkRe, (_, attrs, text) => `<a href="${target}"${attrs}>${text}</a>`);
    }
  }
  // Clean up empty <li></li> left behind (e.g., Related list items where href was the whole content)
  // Only remove an <li> that is now truly empty (no text)
  modified = modified.replace(/<li>\s*<\/li>/g, '');
  return { modified, counts };
}

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  const skipTrash = process.argv.includes('--skip-trash');
  console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE ===');

  // Phase 1+2: scan + rewrite all survivors
  const linkChanges = {}; // id → { slug: count, ... }
  for (const id of SURVIVORS) {
    const r = await req('GET', `/wp-json/wp/v2/posts/${id}?context=edit&_fields=content,slug,status`);
    if (r.s !== 200) { console.log(`${id}: fetch fail ${r.s}`); continue; }
    const html = r.b.content.raw;
    const { modified, counts } = rewriteLink(html, r.b.slug);
    if (Object.keys(counts).length === 0) continue;
    linkChanges[id] = { slug: r.b.slug, counts };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`${id} ${r.b.slug}: ${total} link(s) rewritten — ${Object.entries(counts).map(([s, n]) => s + ':' + n).join(', ')}`);
    if (!dryRun) {
      const upd = await req('POST', `/wp-json/wp/v2/posts/${id}`, { content: modified });
      if (upd.s !== 200) console.log(`  ✗ push fail ${upd.s}`);
    }
  }

  console.log(`\n=== Phase 1+2 summary ===`);
  console.log(`${Object.keys(linkChanges).length} survivor articles touched`);

  // Phase 3: trash all sources
  if (skipTrash) { console.log('\n--skip-trash flag — leaving sources in place'); return; }
  console.log(`\n=== Phase 3: trash sources ===`);
  for (const [id, { slug }] of Object.entries(SOURCES)) {
    if (dryRun) { console.log(`${id} ${slug}: would trash`); continue; }
    const t = await req('DELETE', `/wp-json/wp/v2/posts/${id}`);
    if (t.s === 200) {
      console.log(`${id} ${slug}: ✓ trashed (status=${t.b.status || '?'})`);
    } else {
      console.log(`${id} ${slug}: ✗ ${t.s} ${typeof t.b === 'string' ? t.b.slice(0, 100) : ''}`);
    }
  }
  console.log(`\nDone. ${Object.keys(SOURCES).length} sources trashed (reversible). ${Object.keys(linkChanges).length} survivors updated.`);
  fs.writeFileSync('.audit-cache/cleanup-report.json', JSON.stringify({ linkChanges, sources: SOURCES }, null, 2));
  console.log('Report: .audit-cache/cleanup-report.json');
})();
