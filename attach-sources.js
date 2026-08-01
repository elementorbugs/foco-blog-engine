// Final pass. Two jobs:
//
//   1. Four overstatements that survived Tier 2/3 ("measurably lower dopamine
//      activity", "the prefrontal cortex is where intent gets converted into
//      action", "organizes most ADHD research").
//   2. The audit's real structural finding: four of the six pages have no
//      References section, so every hedged research sentence on them reads as
//      unsourced even when the claim is fine. Adds a References block using only
//      sources already cited elsewhere on this site, and attaches an inline
//      citation to the imaging sentences.
//
//   node attach-sources.js          dry run
//   node attach-sources.js --live
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

// Every one of these already appears as a citation elsewhere on tryfoco.com.
// Nothing here is newly invented.
const SRC = {
  nimh:    ['https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd', 'National Institute of Mental Health. Attention-Deficit/Hyperactivity Disorder.'],
  cdc:     ['https://www.cdc.gov/adhd/about/index.html', 'CDC. About ADHD.'],
  barkley: ['https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf', 'Barkley RA. ADHD, Executive Function and Self-Regulation (factsheet).'],
  chadd:   ['https://chadd.org/about-adhd/overview/', 'CHADD. ADHD Overview.'],
  volkow:  ['https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2894421/', 'Volkow ND, et al. Evaluating dopamine reward pathway in ADHD. JAMA. 2009.'],
};
const refBlock = keys => '\n\n<h2>References</h2>\n<ul class="foco-references">\n'
  + keys.map(k => '<li><a href="' + SRC[k][0] + '" target="_blank" rel="noopener">' + SRC[k][1] + '</a></li>').join('\n')
  + '\n</ul>\n';

const CITE = (k, text) => '<a href="' + SRC[k][0] + '" target="_blank" rel="noopener">' + text + '</a>';

const PAGES = [
  { type: 'posts', id: 112, slug: 'adhd-task-initiation-research', refs: null, edits: [
    [`adults with ADHD have measurably lower dopamine activity in the brain regions responsible for motivation and reward.`,
     `studies have reported lower dopamine activity in the brain regions associated with motivation and reward in adults with ADHD, though the size of the difference varies between studies.`],
    [`The prefrontal cortex is where intent gets converted into action.`,
     `The prefrontal cortex is closely associated with converting intent into action.`],
    [`Three decades after Barkley published this framework, it still organizes most ADHD research.`,
     `Three decades on, ` + CITE('barkley', "Barkley's framework") + ` remains one of the most widely used ways of organising ADHD research.`],
    [`Three decades after Barkley's original paper, this framework still organizes most ADHD research.`,
     `Three decades on, this framework remains one of the most widely used ways of organising ADHD research.`],
    [`Brain imaging studies have reported differences in dopamine markers in ADHD adults, one of several factors researchers associate with difficulty starting.`,
     CITE('volkow', 'Brain imaging studies') + ` have reported differences in dopamine markers in ADHD adults, one of several factors researchers associate with difficulty starting.`],
  ]},

  { type: 'pages', id: 106, slug: 'adhd-glossary', refs: ['nimh', 'cdc', 'barkley', 'chadd', 'volkow'], edits: [
    [`Once you understand executive function, you understand that most ADHD struggles aren't moral failures.`,
     `Once you understand executive function, a lot of what gets read as a moral failure stops looking like one.`],
  ]},

  { type: 'posts', id: 52, slug: 'procrastination-vs-paralysis', refs: ['nimh', 'barkley', 'chadd', 'volkow'], edits: [] },
  { type: 'posts', id: 65, slug: 'body-doubling-adhd',           refs: ['nimh', 'barkley', 'chadd'],          edits: [] },
  { type: 'posts', id: 170, slug: 'time-blindness-adhd',         refs: ['nimh', 'barkley', 'chadd', 'volkow'], edits: [
    [`Imaging studies of duration tracking have reported differences in activation in ADHD adults during time-estimation tasks,`,
     CITE('volkow', 'Imaging studies') + ` of duration tracking have reported differences in activation in ADHD adults during time-estimation tasks,`],
  ]},
];

const get = async (t, id) => {
  const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

// References go after the prose and before the trailing schema blocks.
function insertRefs(c, block) {
  const m = c.match(/<!-- wp:html --><script type="application\/ld\+json">/);
  if (m) return c.slice(0, c.indexOf(m[0])) + block + '\n' + c.slice(c.indexOf(m[0]));
  const m2 = c.match(/<script type="application\/ld\+json">/);
  if (m2) return c.slice(0, c.indexOf(m2[0])) + block + '\n' + c.slice(c.indexOf(m2[0]));
  return c + block;
}

(async () => {
  let edits = 0, refsAdded = 0, missing = 0, failed = 0;

  for (const page of PAGES) {
    console.log('\n/' + page.slug + '/');
    let c = await get(page.type, page.id);
    const before = c;

    for (const [find, to] of page.edits) {
      if (c.includes(to)) { console.log('  = already applied'); continue; }
      const n = c.split(find).length - 1;
      if (!n) { console.error('  ? NOT FOUND: ' + find.slice(0, 70)); missing++; continue; }
      c = c.split(find).join(to);
      console.log('  ~ ' + (n > 1 ? 'x' + n + ' ' : '   ') + find.slice(0, 66));
      edits += n;
    }

    if (page.refs) {
      if (/<h2[^>]*>\s*References\s*<\/h2>/i.test(c)) console.log('  = References section already present');
      else { c = insertRefs(c, refBlock(page.refs)); refsAdded++; console.log('  + References section (' + page.refs.length + ' sources)'); }
    }

    if (c === before) continue;

    const bad = [];
    if ((c.match(/—/g) || []).length) bad.push('em dash');
    for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { bad.push('JSON-LD'); }
    }
    if (bad.length) { console.error('  ABORT ' + bad.join(', ')); failed++; continue; }

    if (!LIVE) continue;
    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/' + page.type + '/' + page.id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: c }),
      });
      if (!r.ok) { console.error('    POST ' + r.status); await sleep(2000); continue; }
      await sleep(2500);
      const f = await get(page.type, page.id);
      if (page.refs ? /<h2[^>]*>\s*References\s*<\/h2>/i.test(f) : f.includes(page.edits[0][1])) done = true;
      else console.error('    not persisted, retry ' + a);
    }
    console.log(done ? '  OK saved' : '  FAIL did not persist');
    if (!done) failed++;
  }

  console.log('\n' + edits + ' rewrite(s), ' + refsAdded + ' References section(s) added, ' + missing + ' not found, ' + failed + ' failed');
  if (!LIVE) console.log('Dry run. Re-run with --live to apply.');
})();
