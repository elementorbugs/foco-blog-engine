// Prepares draft #2528 (/gifted-and-adhd/) for publication.
//
// Three jobs:
//   1. Add the section that answers the actual query: you did well at school and
//      still had it. The draft had 7 school-words in 3,777.
//   2. Strip the medication / treatment-outcome content. `adhd late diagnosis` and
//      `high functioning adhd symptoms` are blocked as YMYL, so a post that stays
//      on recognition is publishable but one that makes treatment claims is not.
//   3. Cite the 194-person survey with a stat no other post uses.
//
//   node publish-2528-gifted.js          dry run, writes the diff to scratchpad
//   node publish-2528-gifted.js --live
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

const ID = 2528;
const LIVE = process.argv.includes('--live');
const NEW_TITLE = 'Gifted and ADHD: Why Being Smart Hides It for Years'; // 50 chars
const SURVEY = 'https://www.tryfoco.com/adhd-execution-paralysis-survey/';

// ---------------------------------------------------------------- new content

const SCHOOL = `<h2 id="did-well-in-school">Can You Have Had Undiagnosed ADHD and Still Have Done Well in School?</h2>

<p>Yes. It is one of the most common reasons inattentive ADHD goes unnamed for decades, and a report card is weak evidence in either direction.</p>

<p>School is scaffolding. Someone else decides what you do, when you do it, and how long it takes. Deadlines are short and frequent, the timetable is fixed, and an adult notices within days when something is not handed in. That external structure does exactly the job executive function does internally, which means a brain that cannot reliably generate its own structure can look completely fine inside it.</p>

<h3>Referrals follow disruption, not difficulty</h3>

<p>Children get referred for assessment when their behaviour interrupts a classroom. A child who daydreams, loses things and goes quiet does not generate a complaint. She generates "so bright, if only she applied herself" and "careless mistakes", which get read as personality rather than as symptoms.</p>

<p>This is a large part of why inattentive presentations, and girls in particular, were historically under-identified. The early clinical picture of ADHD was built largely from studies of hyperactive boys, and the quiet version of the profile did not match it. <a href="https://www.tryfoco.com/adhd-symptoms-women/">ADHD in women</a> is still routinely recognised decades later than it is in men for the same reason.</p>

<h3>The same grade can cost wildly different amounts</h3>

<p>Two students with an identical mark have not necessarily done the same amount of work. If yours took three times the hours, or a total-panic all-nighter every time, or an elaborate scaffolding of reminders that your friends did not seem to need, the outcome looked the same from the outside while the experience did not.</p>

<p>Academic success measures output. It says nothing about what the output cost. That gap is invisible on a transcript, which is why "but I did well at school" is not the disqualifier people treat it as.</p>

<h3>Interest carried some subjects, panic carried the rest</h3>

<p>ADHD attention responds to interest, novelty, challenge and urgency rather than to importance. The subjects that genuinely engaged you could pull real hyperfocus and produce excellent work. The ones that did not still got done, badly, the night before, and the deadline adrenaline worked because school tasks are small enough that one night is usually enough.</p>

<p>That strategy has a shelf life. It stops working the moment a task is larger than a single night of panic, which is exactly the pattern described in the next section.</p>

`;

const STRUCTURE = `<h2 id="build-external-structure">Building External Structure When You Never Had To Before</h2>

<p>There is a specific disadvantage that comes with having compensated successfully for a long time: you never built the systems, because you never needed them.</p>

<p>People who struggled visibly and early tend to accumulate scaffolding along the way. Calendars they actually check, a fixed place where things live, a habit of writing down what was just said. If intelligence covered the gap for you until your late twenties, you arrive at the point of needing those systems with no practice at running them, and often with a quiet contempt for them. A checklist feels insulting when you can hold an entire research paper in your head.</p>

<p>That contempt is the first thing to drop. The system is not a comment on your intelligence. It exists because working memory and time perception are not intelligence, and no amount of reasoning ability lends you more of either.</p>

<p>Three things matter more than the specific tool you pick:</p>

<p><strong>Make it stupider than feels necessary.</strong> The system has to work on your worst day, not your best one. If it requires setup, sorting, or a decision about where something goes, it will be abandoned within a fortnight. One list. One place. One timer.</p>

<p><strong>Externalise before you organise.</strong> Getting everything out of your head is a separate action from deciding what to do about it, and attempting both at once is what makes the process feel unbearable. Do the <a href="https://www.tryfoco.com/adhd-brain-dump/">brain dump</a> first and sort afterwards, and expect the dump to be ugly.</p>

<p><strong>Expect to rebuild it several times a year.</strong> Novelty is part of what makes any system work for an ADHD brain, so systems go stale on a predictable schedule. Replacing one that has stopped working is maintenance, not failure. Treating it as failure is the single most common route to concluding that nothing works for you.</p>

`;

const NEW_FAQ = `<h3>Why is a boring task harder than a genuinely difficult one?</h3>
<p>Because difficulty and activation are separate problems. A hard task in a field you care about supplies its own novelty and challenge, which is what an ADHD brain uses to reach the threshold for starting.</p>
<p>An easy, dull, low-stakes task supplies none of that, so there is nothing to push against. This is why the same person can build something complex over a weekend and leave a two-minute form untouched for a month. It is not a contradiction, it is one mechanism producing both results.</p>

`;

const TAKEAWAY_NEW = '<li>Doing well at school rules nothing out: school supplies the external structure that executive function normally provides, so the gap only becomes visible once that scaffolding disappears</li>';

const CITATION = '<p>In <a href="' + SURVEY + '">FOCO\'s 2026 survey of 194 adults with ADHD</a>, only 14% said the help they most wanted was gentle reminders, which is the one thing most productivity tools are built to deliver. Being told what to do was almost never the missing piece.</p>\n\n';

// ------------------------------------------------------------------- plumbing

const get = async () => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + ID + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return { c: p.content.raw !== undefined ? p.content.raw : p.content.rendered, t: p.title.raw || p.title.rendered, st: p.status };
};

// Cut everything from `from` up to (not including) `to`. Both must appear once.
function excise(c, from, to, label) {
  const a = c.indexOf(from);
  if (a < 0) throw new Error('excise: start not found for ' + label);
  if (c.indexOf(from, a + 1) >= 0) throw new Error('excise: start not unique for ' + label);
  const b = c.indexOf(to, a);
  if (b < 0) throw new Error('excise: end not found for ' + label);
  return { out: c.slice(0, a) + c.slice(b), removed: c.slice(a, b) };
}

function swap(c, find, to, label) {
  const n = c.split(find).length - 1;
  if (n !== 1) throw new Error('swap x' + n + ' for ' + label);
  return c.replace(find, to);
}

(async () => {
  const before = await get();
  let c = before.c;
  console.log('#' + ID + '  "' + before.t + '"  [' + before.st + ']  ' + c.length + ' bytes\n');

  // 1. dead placeholder: an HTML comment the chart renderer never consumed, so it
  //    has been shipping as invisible dead weight with unsourced numbers in it.
  ({ out: c } = excise(c, '<!-- FOCO_CHART:statGrid', '-->', 'statGrid'));
  c = c.replace(/^-->\n?/m, '');
  console.log('- removed dead FOCO_CHART placeholder');

  // 2. the school section, ahead of the breaking-point section it sets up
  c = swap(c, '<h2 id="the-compensation-breaking-point">', SCHOOL + '<h2 id="the-compensation-breaking-point">', 'school insert');
  c = swap(c,
    '<li><a href="#the-compensation-breaking-point">',
    '<li><a href="#did-well-in-school">Can You Have Had Undiagnosed ADHD and Still Have Done Well in School?</a></li>\n<li><a href="#the-compensation-breaking-point">',
    'school TOC');
  console.log('+ added #did-well-in-school (4 blocks, 3 H3s)');

  // 3. medication paragraph inside "What Actually Helps"
  let removed;
  ({ out: c, removed } = excise(c,
    '<p><strong>Medication, if appropriate, prescribed by a qualified clinician.</strong>',
    '<p>FOCO combines several of these mechanisms in one flow:',
    'medication bullet'));
  console.log('- removed medication bullet (' + removed.length + ' bytes)');

  // 4. whole treatment-outcome section -> practical structure section
  ({ out: c, removed } = excise(c, '<h2 id="diagnosis-treatment-high-iq">', '<h2>FAQ</h2>', 'treatment section'));
  console.log('- removed "Diagnosis and Treatment Don\'t Erase Intelligence" (' + removed.length + ' bytes)');
  c = swap(c, '<h2>FAQ</h2>', STRUCTURE + '<h2>FAQ</h2>', 'structure insert');
  c = swap(c,
    '<li><a href="#diagnosis-treatment-high-iq">Diagnosis and Treatment Don\'t Erase Intelligence</a></li>',
    '<li><a href="#build-external-structure">Building External Structure When You Never Had To Before</a></li>',
    'structure TOC');
  console.log('+ added #build-external-structure');

  // 5. medication FAQ -> mechanism FAQ
  ({ out: c, removed } = excise(c,
    '<h3>Does ADHD medication dull creativity or intelligence in gifted adults?</h3>',
    '<h3>What\'s the difference between being "smart but lazy" and having ADHD?</h3>',
    'medication FAQ'));
  console.log('- removed medication FAQ (' + removed.length + ' bytes)');
  c = swap(c, '<h3>What\'s the difference between being "smart but lazy" and having ADHD?</h3>',
    NEW_FAQ + '<h3>What\'s the difference between being "smart but lazy" and having ADHD?</h3>', 'new FAQ');
  console.log('+ added boring-vs-difficult FAQ');

  // 6. key takeaway that referenced treatment
  c = swap(c, '<li>Diagnosis and treatment don\'t erase giftedness - they remove the ceiling that kept compensated intelligence from translating into consistent output</li>', TAKEAWAY_NEW, 'takeaway');
  console.log('~ rewrote key takeaway 6');

  // 7. survey citation, before The Bottom Line
  c = swap(c, '<h2>The Bottom Line</h2>', CITATION + '<h2>The Bottom Line</h2>', 'citation');
  console.log('+ cited the survey (14%, unused elsewhere)');

  // 8. bottom line still referenced diagnosis/treatment
  c = swap(c,
    'The compensation strategies that carried you this far eventually hit a ceiling when demands exceed working memory and initiation capacity. Seeking diagnosis and treatment doesn\'t erase your cognitive strengths - it removes the bottleneck that\'s been keeping intelligence from translating into output.',
    'The compensation strategies that carried you this far eventually hit a ceiling when demands exceed working memory and initiation capacity. Doing well at school never ruled it out, because school was supplying the structure. What replaces that structure is not more effort, it is a system dull enough to survive your worst day.',
    'bottom line');
  console.log('~ rewrote The Bottom Line');

  // 9. schema headline
  c = swap(c, '"headline":"Gifted and ADHD"', '"headline":"' + NEW_TITLE + '"', 'schema headline');

  // --------------------------------------------------------------- guardrails
  const fail = [];
  if ((c.match(/\u2014/g) || []).length) fail.push('em dash introduced');
  for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { fail.push('invalid JSON-LD: ' + e.message.slice(0, 60)); }
  }
  const txt = c.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  for (const bad of [/\bstimulant\b/i, /\bnon-stimulant\b/i, /\bpharmacological\b/i, /\bmedications? (?:for|are|can|may)\b/i, /\bprescrib/i, /\bdosage?\b/i, /\b\d+\s?mg\b/i]) {
    const m = txt.match(bad);
    if (m) fail.push('medical language survived: "' + m[0] + '"');
  }
  const schoolWords = (txt.match(/school|grade|exam|university|college|academic|transcript/gi) || []).length;
  const words = txt.trim().split(/\s+/).length;
  console.log('\nwords: ' + words + '   school-words: ' + schoolWords + ' (was 7)');
  console.log('h2s: ' + (c.match(/<h2/g) || []).length + '   h3s: ' + (c.match(/<h3/g) || []).length + '   body imgs: ' + (c.match(/<img /g) || []).length);

  if (fail.length) { console.error('\nABORT:\n  ' + fail.join('\n  ')); process.exit(1); }
  console.log('guardrails: clean');

  const SCRATCH = 'C:/Users/User/AppData/Local/Temp/claude/c--Users-User-design-foco/1993234d-0e54-4b58-801f-66e1b53ac493/scratchpad/';
  fs.writeFileSync(SCRATCH + '2528-new.html', c);
  console.log('wrote ' + SCRATCH + '2528-new.html');

  if (!LIVE) { console.log('\nDry run. Re-run with --live to apply (stays a draft).'); return; }

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + ID, {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: c, title: NEW_TITLE }),
    });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const f = await get();
    if (f.c.includes('did-well-in-school') && f.c.includes('build-external-structure') && !f.c.includes('diagnosis-treatment-high-iq') && f.t === NEW_TITLE) done = true;
    else console.error('  not persisted, retry ' + a);
  }
  if (!done) { console.error('FAIL  did not persist'); process.exit(1); }

  const rm = await fetch(BASE + '/wp-json/rankmath/v1/updateMeta', {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectID: ID, objectType: 'post', meta: {
      rank_math_focus_keyword: 'gifted and adhd',
      rank_math_title: NEW_TITLE + ' | FOCO',
    } }),
  });
  console.log('RankMath: HTTP ' + rm.status);
  console.log('\nOK  #' + ID + ' updated, still a draft. Next: FAQ schema resync, cover, publish.');
})();
