// Last of the treatment-efficacy content: stimulant response-rate statistics
// ("70-80%", attributed to NIMH) on /adhd-and-dopamine/ and
// /adhd-executive-function/. Same YMYL rule as the rest.
//   node strip-response-rates.js          dry run
//   node strip-response-rates.js --live
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LIVE = process.argv.includes('--live');

const NEUTRAL = 'Medication is a decision for you and a qualified clinician, and it sits outside what this article covers. What is within reach here is the structural side: making the first action small enough, and concrete enough, to begin.';

// matches "response rates of 70-80%" and the en-dash variant "70–80%"
const CLAIM = /response rates?[^<]{0,40}\d{2}\s*[-–]\s*\d{2}\s*%|\d{2}\s*[-–]\s*\d{2}\s*%[^<]{0,30}first-line stimulants|stimulant medication is the most direct intervention/i;

const get = async id => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return { c: p.content.raw !== undefined ? p.content.raw : p.content.rendered, slug: p.slug };
};

(async () => {
  for (const id of [247, 152]) {
    let { c, slug } = await get(id);
    const before = c;
    let n = 0, seen = 0;

    // Replace the whole paragraph. Collapse consecutive replacements so the same
    // neutral line does not appear twice in a row.
    c = c.replace(/<p([^>]*)>([\s\S]*?)<\/p>/g, (m, attr, inner) => {
      if (!CLAIM.test(inner)) return m;
      n++;
      if (seen++) return ''; // already said it once in this post
      return '<p' + attr + '>' + NEUTRAL + '</p>';
    });
    // and the same sentences where they sit inside FAQ JSON-LD answers
    c = c.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, o, json, cl) => {
      let obj; try { obj = JSON.parse(json); } catch (e) { return m; }
      if (obj['@type'] !== 'FAQPage' || !Array.isArray(obj.mainEntity)) return m;
      let hit = false;
      for (const q of obj.mainEntity) {
        const t = q.acceptedAnswer && q.acceptedAnswer.text;
        if (typeof t === 'string' && CLAIM.test(t)) {
          q.acceptedAnswer.text = t.split(/(?<=[.!?])\s+/).filter(s => !CLAIM.test(s)).join(' ').trim() || NEUTRAL;
          hit = true; n++;
        }
      }
      return hit ? o + JSON.stringify(obj) + cl : m;
    });

    if (c === before) { console.log('=     /' + slug + '/  nothing matched'); continue; }

    let bad = false;
    for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { bad = true; }
    }
    if (bad) { console.error('ABORT /' + slug + '/  JSON-LD'); continue; }

    if (!LIVE) { console.log('WOULD /' + slug + '/  x' + n); continue; }
    let ok = false;
    for (let a = 1; a <= 3 && !ok; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: c }),
      });
      if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
      await sleep(2200);
      if (!CLAIM.test((await get(id)).c)) ok = true;
      else console.error('  retry ' + a);
    }
    console.log((ok ? 'OK    ' : 'FAIL  ') + '/' + slug + '/  x' + n);
  }
  if (!LIVE) console.log('\nDry run. Re-run with --live to apply.');
})();
