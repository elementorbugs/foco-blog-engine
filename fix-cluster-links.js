// Fix-up script for drug cluster (336, 348, 452, 474):
// (1) 474: replace dead /adhd-treatment-non-stimulant/ link → /adhd-medication-non-stimulant/
// (2) 452: replace dead /adhd-treatment-non-stimulant/ link → /adhd-and-ritalin/
// (3) Drug cluster cross-links: each article gains links to its 3 siblings via Related articles
// All edits idempotent (uses string find-replace; skips if already applied).

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

const RELATED_LINKS = {
  336: { // stimulants overview — siblings: 452 non-stim, 474 ritalin (348 already linked)
    add: [
      '<li><a href="/adhd-medication-non-stimulant/">Non-Stimulant ADHD Medication: A Complete Adult Guide</a></li>',
      '<li><a href="/adhd-and-ritalin/">ADHD and Ritalin: How It Works, What It Fixes, and What It Doesn\'t</a></li>',
    ],
  },
  348: { // wellbutrin — siblings: 452 non-stim, 474 ritalin (336 already linked)
    add: [
      '<li><a href="/adhd-medication-non-stimulant/">Non-Stimulant ADHD Medication: A Complete Adult Guide</a></li>',
      '<li><a href="/adhd-and-ritalin/">ADHD and Ritalin: How It Works, What It Fixes, and What It Doesn\'t</a></li>',
    ],
  },
  452: { // non-stim — needs to drop dead 367 link AND add 474
    deadLink: '<li><a href="/adhd-treatment-non-stimulant/">ADHD Treatment Non-Stimulant: A Complete Guide to the Alternatives</a></li>',
    add: [
      '<li><a href="/adhd-and-ritalin/">ADHD and Ritalin: How It Works, What It Fixes, and What It Doesn\'t</a></li>',
    ],
  },
  474: { // ritalin — has NO Related section; needs full insert
    needsSection: true,
    add: [
      '<li><a href="/stimulant-medication-for-adhd/">Stimulant Medication for ADHD: How It Works, What to Expect, and What It Doesn\'t Fix</a></li>',
      '<li><a href="/wellbutrin-for-adhd/">Wellbutrin for ADHD: How It Works, Who It Helps, and What to Expect</a></li>',
      '<li><a href="/adhd-medication-non-stimulant/">Non-Stimulant ADHD Medication: A Complete Adult Guide</a></li>',
    ],
  },
};

async function processPost(id, html) {
  const cfg = RELATED_LINKS[id];
  let modified = html;
  let changes = 0;

  // (1) Fix dead /adhd-treatment-non-stimulant/ → /adhd-medication-non-stimulant/ in body
  // (only if not already replaced and link exists)
  if (modified.includes('/adhd-treatment-non-stimulant/')) {
    // Drop the entire LI line if it matches dead 367 in Related list
    if (cfg.deadLink && modified.includes(cfg.deadLink)) {
      modified = modified.replace(cfg.deadLink + '\n', '').replace(cfg.deadLink, '');
      changes++;
      console.log(`  ${id}: removed dead 367 link from Related`);
    }
    // For inline body links pointing to the trashed 367 slug — redirect to 452's slug
    const beforeCount = (modified.match(/\/adhd-treatment-non-stimulant\//g) || []).length;
    modified = modified.replace(/\/adhd-treatment-non-stimulant\//g, '/adhd-medication-non-stimulant/');
    const afterCount = (modified.match(/\/adhd-treatment-non-stimulant\//g) || []).length;
    if (beforeCount > afterCount) {
      changes += (beforeCount - afterCount);
      console.log(`  ${id}: redirected ${beforeCount - afterCount} body link(s) /adhd-treatment-non-stimulant/ → /adhd-medication-non-stimulant/`);
    }
  }

  // (2) Insert missing Related-articles links (or whole section if absent)
  if (cfg.needsSection) {
    // 474 has no Related section — insert one before References
    if (!modified.includes('<h2>Related articles</h2>') && !modified.includes('<h2 id="related"')) {
      const linksHtml = cfg.add.join('\n');
      const block = `<h2>Related articles</h2>\n<ul>\n${linksHtml}\n</ul>\n\n`;
      // Insert before <h2>References</h2>
      if (modified.includes('<h2>References</h2>')) {
        modified = modified.replace('<h2>References</h2>', block + '<h2>References</h2>');
        changes++;
        console.log(`  ${id}: inserted Related articles section with ${cfg.add.length} links`);
      } else {
        console.log(`  ${id}: ⚠ no <h2>References</h2> anchor — Related section not inserted`);
      }
    } else {
      console.log(`  ${id}: Related section already present — skipping section insert`);
    }
  } else if (cfg.add) {
    // Append missing links to existing Related list
    for (const linkLi of cfg.add) {
      if (!modified.includes(linkLi)) {
        // Locate Related list end (first </ul> after the Related h2)
        const relatedIdx = modified.indexOf('<h2>Related articles</h2>');
        if (relatedIdx === -1) {
          console.log(`  ${id}: ⚠ no Related section found, can't append`);
          continue;
        }
        const ulCloseIdx = modified.indexOf('</ul>', relatedIdx);
        if (ulCloseIdx === -1) continue;
        modified = modified.slice(0, ulCloseIdx) + linkLi + '\n' + modified.slice(ulCloseIdx);
        changes++;
        const slug = linkLi.match(/href="(\/[^"]+\/)"/)?.[1] || '?';
        console.log(`  ${id}: added Related link ${slug}`);
      }
    }
  }

  return { modified, changes };
}

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE ===');
  for (const id of [336, 348, 452, 474]) {
    console.log(`\n→ Post ${id}`);
    const r = await req('GET', `/wp-json/wp/v2/posts/${id}?context=edit&_fields=content,slug`);
    if (r.s !== 200) { console.log(`  fetch fail ${r.s}`); continue; }
    const { modified, changes } = await processPost(id, r.b.content.raw);
    if (changes === 0) { console.log(`  no changes`); continue; }
    if (dryRun) { console.log(`  would push (${changes} changes)`); continue; }
    const upd = await req('POST', `/wp-json/wp/v2/posts/${id}`, { content: modified });
    console.log(`  ${upd.s === 200 ? '✓ pushed' : '✗ push failed ' + upd.s}`);
  }
})();
