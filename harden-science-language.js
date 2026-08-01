// Tier 1 and Tier 4 of tasks/science-language-audit-2026-08-01.md.
//
// Rule applied: a sentence may state a mechanism only if it is marked as one
// explanation among several. Invented numbers go. Treatment-efficacy claims go.
// The claim usually survives; the certainty does not.
//
//   node harden-science-language.js          dry run
//   node harden-science-language.js --live
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

const SURVEY = 'https://www.tryfoco.com/adhd-execution-paralysis-survey/';

const EDITS = [
  { type: 'posts', id: 52, slug: 'procrastination-vs-paralysis', edits: [
    ['Dopamine launch failure', 'Activation barrier', 'chart label: named a mechanism as if settled'],
    [`This is why "just try harder" never works for paralysis. Trying harder is itself a dopamine-driven action. If the dopamine isn't there, there's nothing to try with.`,
     `This is why "just try harder" rarely helps with paralysis. Effort is not the ingredient that is missing, so adding more of it does not move the block.`,
     'removed neurochemistry metaphor stated as fact'],
    [`The ADHD brain doesn't produce or use dopamine the same way. When the dopamine signal doesn't fire, your body doesn't move - even though you want it to.`,
     `Reward processing appears to work differently in ADHD, and it is one of several factors researchers point to. Whether you start can depend on executive function demands, how the task is rewarded, emotional load, and how many decisions sit in front of the first action.`,
     'single-cause dopamine claim -> multi-factor, hedged'],
  ]},

  { type: 'posts', id: 65, slug: 'body-doubling-adhd', edits: [
    [`It works for ADHD because another person's presence anchors your nervous system.`,
     `One common explanation is that another person's presence supplies external regulation that is hard to generate alone.`,
     'mechanism stated as fact -> one explanation'],
    [`When you're around a calm, focused person, your nervous system slowly synchronizes with theirs. This is well-documented in research on co-regulation - humans are wired to attune to each other physiologically.`,
     `One model for this is co-regulation, the idea that people attune to each other physiologically. It is a plausible explanation rather than a settled one, and the research on body doubling specifically is thin. What is consistent is what people report: in <a href="${SURVEY}">FOCO's survey of 194 adults with ADHD</a>, 87% rated working alongside someone as helpful or life-changing.`,
     '"well-documented" -> named model + the actual evidence we have'],
  ]},

  { type: 'pages', id: 106, slug: 'adhd-glossary', edits: [
    [`It adds up to thousands of dollars a year for most ADHD adults.`,
     `Many people describe it adding up substantially over a year.`,
     'unsourced dollar figure + "most"'],
    [`Documented in brain imaging studies. It's the biological reason boring tasks feel impossible to start.`,
     `Imaging studies have reported differences in dopamine markers in ADHD, though findings vary between studies. It is one of several factors that may make low-interest tasks harder to begin.`,
     '"documented in brain imaging studies" named no study; "the biological reason" was single-cause'],
    [`It's the clinical name for what most ADHD adults experience as task paralysis.`,
     `It is the term researchers use for what many people experience as task paralysis. It is not a formal diagnosis.`,
     '"clinical name" implied a diagnostic entity'],
    [`For ADHD specifically, it works because it bypasses the dopamine launch your brain can't generate on demand.`,
     `For ADHD specifically, it helps because it shrinks the first action, which is where starting most often stalls.`,
     'removed "dopamine launch"'],
  ]},

  { type: 'posts', id: 112, slug: 'adhd-task-initiation-research', edits: [
    [`Brain imaging consistently shows reduced dopamine receptor markers in ADHD adults, one biological factor behind why starting feels so hard.`,
     `Brain imaging studies have reported differences in dopamine markers in ADHD adults, one of several factors researchers associate with difficulty starting. Effect sizes vary between studies.`,
     '"consistently shows" overstated a contested literature'],
    [`In the brain regions responsible for motivation and reward, dopamine receptor density is measurably reduced in ADHD adults. The launch signal is genuinely weaker - not absent, but quieter.`,
     `Studies of the brain regions associated with motivation and reward have reported lower dopamine receptor availability in ADHD adults. Findings are not uniform, and the relationship between a marker and a behaviour is not one to one.`,
     '"measurably reduced" + "genuinely weaker" -> reported, with the caveat'],
    [`Medication isn't a cure, and it isn't always appropriate. But the evidence that it directly improves task initiation - by raising the dopamine signal closer to typical levels - is among the strongest in adult psychiatry. Best outcomes generally combine medication with behavioral and structural interventions.`,
     `Medication is a decision for you and a qualified clinician, and it sits outside what this article covers. What follows is the structural side: what changes when the first action is small enough to begin.`,
     'treatment-efficacy claim removed (YMYL)'],
  ]},

  { type: 'posts', id: 170, slug: 'time-blindness-adhd', edits: [
    [`Most ADHD adults underestimate durations by 50-100%; learn to multiply your initial estimate by 1.5x.`,
     `Underestimating duration is one of the most commonly reported ADHD difficulties. A practical habit is to add half again to whatever your first estimate was.`,
     'the 50-100% figure had no source anywhere'],
    [`Yes - modestly. Stimulant medication acts on the dopamine system that powers time perception, and most ADHD adults notice improved time awareness on medication compared to off it.`,
     `That is a question for a qualified clinician and sits outside what this article covers. What is available right now is making time visible outside your head, which is what the rest of this article is about.`,
     'treatment-efficacy claim removed (YMYL)'],
    [`Sleep deprivation impairs the same dopamine systems that ADHD already underpowers.`,
     `Sleep loss affects the same executive functions that ADHD already strains.`,
     'removed unsourced neuro mechanism'],
    [`Time perception in ADHD is heavily mediated by interest and dopamine.`,
     `Time perception in ADHD appears closely tied to interest and engagement.`,
     'hedged'],
  ]},
];

const get = async (t, id) => {
  const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

(async () => {
  let applied = 0, skipped = 0, missing = 0, failed = 0;

  for (const page of EDITS) {
    console.log('\n/' + page.slug + '/');
    let c = await get(page.type, page.id);
    const before = c;

    for (const [find, to, label] of page.edits) {
      if (c.includes(to)) { console.log('  = already applied: ' + label); skipped++; continue; }
      const n = c.split(find).length - 1;
      if (n === 0) { console.error('  ? NOT FOUND: ' + label); missing++; continue; }
      c = c.split(find).join(to);
      console.log('  ~ ' + (n > 1 ? 'x' + n + ' ' : '') + label);
      applied += n;
    }
    if (c === before) continue;

    if ((c.match(/—/g) || []).length) { console.error('  ABORT em dash introduced'); failed++; continue; }
    let bad = false;
    for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { bad = true; }
    }
    if (bad) { console.error('  ABORT would break JSON-LD'); failed++; continue; }

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
      if (page.edits.every(([, to]) => f.includes(to) || !before.includes(page.edits[0][0]))) done = true;
      else if (f.includes(page.edits[0][1])) done = true;
      else console.error('    not persisted, retry ' + a);
    }
    console.log(done ? '  OK saved' : '  FAIL did not persist');
    if (!done) failed++;
  }

  console.log('\n' + applied + ' replacement(s), ' + skipped + ' already done, ' + missing + ' not found, ' + failed + ' failed');
  if (!LIVE) console.log('Dry run. Re-run with --live to apply.');
  else console.log('Next: node repair-faq-schema.js 170 --force  (a FAQ answer changed)');
})();
