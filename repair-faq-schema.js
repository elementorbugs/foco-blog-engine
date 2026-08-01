// Rebuilds a post's FAQPage JSON-LD from its visible FAQ block.
// Fixes the known corruption where markup leaks into a JSON string literal.
//   node repair-faq-schema.js <postId> [<postId> ...]
//   node repair-faq-schema.js --scan          (check every published + draft post, no writes)
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const clean = s => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#8217;|&#039;|&apos;/g, "'")
  .replace(/&#8220;|&#8221;|&quot;/g, '"')
  .replace(/&#8211;|&#8212;/g, '-')
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function buildFaq(content) {
  const m = content.match(/<h2[^>]*>\s*FAQ[\s\S]*?(?=<h2[\s>]|$)/i);
  if (!m) return null;
  const pairs = [];
  for (const q of m[0].matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[\s>]|$)/gi)) {
    const question = clean(q[1]);
    const answer = clean(q[2]);
    if (question && answer) pairs.push({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } });
  }
  if (!pairs.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: pairs };
}

async function get(id) {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return { post: p, content: p.content.raw !== undefined ? p.content.raw : p.content.rendered };
}

function badBlocks(content) {
  const bad = [];
  for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { bad.push({ raw: m[0], body: m[1], err: e.message }); }
  }
  return bad;
}

(async () => {
  if (process.argv.includes('--scan')) {
    let all = [];
    for (const st of ['publish', 'draft']) {
      for (let pg = 1; pg <= 3; pg++) {
        const r = await fetch(BASE + '/wp-json/wp/v2/posts?status=' + st + '&per_page=100&page=' + pg + '&_fields=id,slug,status,content', { headers: { Authorization: AUTH } });
        if (!r.ok) break;
        const j = await r.json();
        if (!j.length) break;
        all = all.concat(j);
      }
    }
    let broken = 0;
    for (const p of all) {
      const bad = badBlocks(p.content.rendered);
      if (bad.length) { broken++; console.log('BROKEN  ' + p.id + '  [' + p.status + ']  /' + p.slug + '/  -> ' + bad[0].err); }
    }
    console.log('\nscanned ' + all.length + ' posts, ' + broken + ' with invalid JSON-LD');
    return;
  }

  const ids = process.argv.slice(2).filter(a => /^\d+$/.test(a));
  if (!ids.length) { console.error('Usage: node repair-faq-schema.js <postId> [...]  |  --scan'); process.exit(1); }

  // --force also rebuilds VALID-but-stale FAQPage blocks, i.e. when the visible
  // H3/P text has been edited since the schema was generated. Google requires the
  // schema to match what the reader sees, so a stale block is a rich-result risk
  // even though it parses cleanly.
  const force = process.argv.includes('--force');

  for (const id of ids) {
    let { content } = await get(id);
    const bad = badBlocks(content);
    const faq = buildFaq(content);

    if (!bad.length && !force) { console.log('OK    ' + id + '  all JSON-LD already valid (use --force to resync from visible FAQ)'); continue; }
    if (!faq) { console.error('FAIL  ' + id + '  no FAQ block found to rebuild from'); continue; }

    let next = content;
    for (const b of bad) {
      if (!/FAQPage/.test(b.body)) { console.error('WARN  ' + id + '  broken non-FAQ block left alone: ' + b.err); continue; }
      next = next.replace(b.raw, '<script type="application/ld+json">' + JSON.stringify(faq) + '</script>');
    }

    if (force) {
      let stale = 0;
      next = next.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
        if (!/"FAQPage"/.test(body)) return m;
        const rebuilt = '<script type="application/ld+json">' + JSON.stringify(faq) + '</script>';
        if (m !== rebuilt) stale++;
        return rebuilt;
      });
      if (!stale && !bad.length) { console.log('OK    ' + id + '  FAQPage already matches the visible FAQ'); continue; }
    }

    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: next }),
      });
      if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
      await sleep(3000);
      const fresh = await get(id);
      if (badBlocks(fresh.content).length === 0) done = true;
      else console.error('  still invalid, retry ' + a);
    }
    console.log((done ? 'OK    ' : 'FAIL  ') + id + '  FAQPage rebuilt (' + faq.mainEntity.length + ' Q&A)');
  }
})();
