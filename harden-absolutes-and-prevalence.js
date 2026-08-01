// Tier 2 (absolutes) and Tier 3 ("most ADHD adults") from the audit, plus the
// dopamine-as-single-cause phrasing that survived the first pass.
//
// Each replacement is exact-string, so where a sentence also appears inside the
// FAQPage or DefinedTermSet JSON-LD it is updated there in the same operation
// and the schema stays in sync with the visible text.
//
//   node harden-absolutes-and-prevalence.js          dry run
//   node harden-absolutes-and-prevalence.js --live
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

const PAGES = [
  { type: 'posts', id: 42, slug: 'adhd-task-paralysis', edits: [
    [`which is why "just try harder" never works for paralysis`,
     `which is why "just try harder" rarely helps with paralysis`],
    [`That's why "just try harder" never works. Trying harder doesn't fix wiring.`,
     `That's why "just try harder" rarely helps. Effort is not the ingredient that is missing.`],
    [`this is closely tied to how the ADHD brain handles dopamine, the chemical behind reward and motivation.`,
     `this is often linked to how the ADHD brain handles reward and motivation, though that is one factor among several rather than the whole explanation.`],
    [`Your brain is doing exactly what an ADHD brain does when there's not enough dopamine in the system.`,
     `Your brain is doing what ADHD brains commonly do with a task that offers little immediate reward.`],
    [`externalized, low-friction, and dopamine-aware`,
     `externalized, low-friction, and built around reward`],
    [`ADHD working memory is unreliable.`,
     `Working memory is one of the functions ADHD most often strains.`],
    [`Most ADHD task paralysis is uncomfortable but workable with the right tools.`,
     `Task paralysis is usually uncomfortable but workable with the right tools.`],
    [`Physical movement signals to your nervous system that you're shifting modes.`,
     `Moving your body is a common way to signal to yourself that you are changing modes.`],
  ]},

  { type: 'posts', id: 52, slug: 'procrastination-vs-paralysis', edits: [
    [`If "just try harder" never works for you, you're probably dealing with paralysis, not procrastination.`,
     `If "just try harder" rarely works for you, you're probably dealing with paralysis, not procrastination.`],
    [`If you're frozen and "just try harder" never works, you have a brain that needs a different starting line.`,
     `If you're frozen and "just try harder" rarely helps, you have a brain that needs a different starting line.`],
    [`The mechanism is dopamine. To start a non-urgent task, your brain needs to generate enough dopamine to make starting feel possible.`,
     `Reward processing is part of the mechanism. Starting a task that offers no immediate reward appears to take more internal push than starting one that does.`],
    [`Paralysis breaks because urgency floods the brain with stress-driven dopamine, temporarily overriding the deficit.`,
     `Paralysis breaks because urgency supplies from outside the pressure that was missing, which is why the relief is real but does not last.`],
    [`Building dopamine into the start, not just the finish`,
     `Building reward into the start, not just the finish`],
    [`Medication, when appropriate (acts directly on the dopamine system)`,
     `Medication, which is a conversation for you and a qualified clinician`],
    [`Most ADHD adults experience paralysis far more than they realize.`,
     `Many people with ADHD experience paralysis far more often than they realise.`],
    [`the techniques in the next section will help you in a way that procrastination advice never has.`,
     `the techniques in the next section are likely to help in a way that ordinary procrastination advice has not.`],
  ]},

  { type: 'posts', id: 65, slug: 'body-doubling-adhd', edits: [
    [`Co-regulation of the nervous system.`,
     `Co-regulation: one possible explanation.`],
    [`does something for your nervous system that you can't reliably do for yourself. That isn't weakness. That's how your brain is wired to work.`,
     `seems to supply something you cannot reliably supply for yourself. That isn't weakness. It is worth using rather than arguing with.`],
    [`Most ADHD adults assume they need a friend who "gets it" to make this work.`,
     `Many people assume they need a friend who "gets it" to make this work.`],
    [`Most ADHD adults who try it consistently call it the most underrated tool they've found.`,
     `Many people who try it consistently describe it as the most underrated tool they have found.`],
  ]},

  { type: 'pages', id: 106, slug: 'adhd-glossary', edits: [
    [`It's why "just try harder" never works.`,
     `It's why "just try harder" rarely helps.`],
    [`When one person's nervous system synchronizes with another's, leading to calmer focus and easier action. It's the mechanism behind why body doubling works.`,
     `A proposed process in which people attune to each other physiologically, leading to calmer focus and easier action. It is one explanation offered for why body doubling helps, not a settled one.`],
    [`It's the moment most ADHD adults Google for help - and the central problem FOCO solves.`,
     `It's the moment many people search for help, and the central problem FOCO is built around.`],
    [`It's the closest thing to a reliable unlock most ADHD adults find.`,
     `Many people describe it as the closest thing to a reliable unlock they have found.`],
    [`The reduced availability of dopamine in ADHD brains, particularly in regions responsible for motivation and reward.`,
     `A commonly used shorthand for differences in how the ADHD brain handles reward and motivation.`],
  ]},

  { type: 'posts', id: 112, slug: 'adhd-task-initiation-research', edits: [
    [`The single most cited finding in ADHD neuroscience:`,
     `One of the most cited lines of research in ADHD neuroscience:`],
    [`Shrink the first action until it's small enough that the dopamine deficit doesn't block it.`,
     `Shrink the first action until it is small enough that the usual barrier to starting does not apply.`],
    [`The dopamine deficit can't block what's small enough not to need much dopamine.`,
     `A barrier to starting has little to work on when the first step needs almost no momentum.`],
    [`The neurological case for task initiation deficit comes from three converging lines of research: dopamine system imaging, structural brain studies, and the development of executive function frameworks.`,
     `The case for task initiation deficit draws on three lines of research: dopamine system imaging, structural brain studies, and the development of executive function frameworks. None of them is conclusive on its own.`],
    [`task initiation deficit is a measurable neurological pattern, deeply tied to dopamine and prefrontal function, and most dramatically expressed in ADHD.`,
     `task initiation is a distinct executive function that can be impaired independently of effort or intelligence, and that this is most visible in ADHD. It is a descriptive term, not a formal diagnosis.`],
  ]},

  { type: 'posts', id: 170, slug: 'time-blindness-adhd', edits: [
    [`The dopamine system that powers time perception is the same one that's underpowered in ADHD.`,
     `The reward and attention systems involved in tracking time overlap with the ones ADHD affects.`],
    [`Brain regions responsible for tracking duration - particularly the cerebellum, basal ganglia, and prefrontal cortex - show reduced activation in ADHD adults during time-estimation tasks. This is well-documented in cognitive neuroscience research.`,
     `Imaging studies of duration tracking have reported differences in activation in ADHD adults during time-estimation tasks, in regions including the cerebellum, basal ganglia and prefrontal cortex. Findings vary between studies.`],
    [`Most ADHD adults don't recognize it as time blindness - they experience it as a series of "personality flaws" until they get the right framework.`,
     `Many people don't recognise it as time blindness. They experience it as a series of "personality flaws" until they get the right framework.`],
    [`The fix is the same general principle that helps most ADHD struggles:`,
     `The approach is the same general principle that helps with many ADHD difficulties:`],
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
  let applied = 0, missing = 0, failed = 0;

  for (const page of PAGES) {
    console.log('\n/' + page.slug + '/');
    let c = await get(page.type, page.id);
    const before = c;

    for (const [find, to] of page.edits) {
      if (c.includes(to)) { console.log('  = already: ' + to.slice(0, 62)); continue; }
      const n = c.split(find).length - 1;
      if (!n) { console.error('  ? NOT FOUND: ' + find.slice(0, 72)); missing++; continue; }
      c = c.split(find).join(to);
      // x2 means it also lived in the JSON-LD and is now in sync there too
      console.log('  ~ ' + (n > 1 ? 'x' + n + ' ' : '   ') + find.slice(0, 68));
      applied += n;
    }
    if (c === before) continue;

    const bad = [];
    if ((c.match(/—/g) || []).length) bad.push('em dash');
    for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { bad.push('JSON-LD'); }
    }
    if (bad.length) { console.error('  ABORT ' + bad.join(', ')); failed++; continue; }

    if (!LIVE) continue;
    const marker = page.edits.find(([f]) => before.includes(f));
    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/' + page.type + '/' + page.id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: c }),
      });
      if (!r.ok) { console.error('    POST ' + r.status); await sleep(2000); continue; }
      await sleep(2500);
      if ((await get(page.type, page.id)).includes(marker[1])) done = true;
      else console.error('    not persisted, retry ' + a);
    }
    console.log(done ? '  OK saved' : '  FAIL did not persist');
    if (!done) failed++;
  }

  console.log('\n' + applied + ' replacement(s), ' + missing + ' not found, ' + failed + ' failed');
  if (!LIVE) console.log('Dry run. Re-run with --live to apply.');
})();
