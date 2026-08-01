// Retargets #42 from "adhd task paralysis" (1,000/mo) to "adhd paralysis" (12,100/mo).
// The exact string "adhd paralysis" appeared 0 times on the page before this ran.
// No new URLs. The survey (#2768) keeps its Dataset identity and is not touched.
//   node retarget-42-adhd-paralysis.js
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

const NEW_TITLE = 'ADHD Paralysis: Why You Freeze and How to Break It'; // 49 chars

// New section covering the sub-terms that have volume and no owner:
// adhd decision paralysis (390), adhd analysis paralysis (320).
const TYPES = `<h2 id="types-of-adhd-paralysis">What are the different types of ADHD paralysis?</h2>

<p>ADHD paralysis is an umbrella term, and people usually mean one of three things by it.</p>

<p>They share a mechanism, which is an overloaded executive system refusing to produce an output, but they stall at different points.</p>

<h3>Task paralysis</h3>

<p>You know exactly what the task is, it matters to you, and your body still will not begin it.</p>

<p>The block sits at initiation, after the decision is already made. This is the version most of this article is about.</p>

<h3>Decision paralysis</h3>

<p>The stall happens one step earlier, at choosing. Several options are open, none is clearly best, and picking one feels heavier than it should.</p>

<p>This is why a long to-do list can leave you doing nothing at all. The list is not the work, it is fifteen unmade decisions in a row.</p>

<p>The fix is to remove the choice rather than get better at making it. Decide the night before, cut the list to three, or pick badly on purpose and move.</p>

<h3>Analysis paralysis</h3>

<p>You have started, but on the research rather than the work. More reading feels like progress while the actual task stays untouched.</p>

<p>It is the most disguised of the three, because it looks productive from the outside and often feels productive from the inside.</p>

<p>A time cap is the usual way out. Give the research a fixed twenty minutes, then start with whatever you have.</p>

`;

const EDITS = [
  // 1. body H2 text: capture "what is adhd paralysis" (720) + "adhd paralysis meaning" (320)
  { find: '<h2 id="what-is-adhd-task-paralysis">What is ADHD task paralysis?</h2>',
    to:   '<h2 id="what-is-adhd-task-paralysis">What is ADHD paralysis?</h2>' },
  // 2. keep the TOC entry in sync with the heading it points at
  { find: '<a href="#what-is-adhd-task-paralysis">What is ADHD task paralysis?</a>',
    to:   '<a href="#what-is-adhd-task-paralysis">What is ADHD paralysis?</a>' },
  // 3. the head term has to exist in the answer box
  { find: "that has a name. It's <strong>task paralysis</strong>",
    to:   "that has a name. It's <strong>ADHD paralysis</strong>, often called task paralysis" },
];

const get = async () => {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/42?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return { content: p.content.raw !== undefined ? p.content.raw : p.content.rendered, title: p.title.raw || p.title.rendered };
};

(async () => {
  let { content, title } = await get();
  const before = (content.replace(/<[^>]+>/g, ' ').match(/adhd paralysis/gi) || []).length;
  console.log('before: title "' + title + '"');
  console.log('before: "adhd paralysis" appears ' + before + 'x in body');

  let next = content, applied = 0;
  for (const e of EDITS) {
    if (next.includes(e.to)) { console.log('SKIP  already applied: ' + e.to.slice(0, 46)); continue; }
    const n = next.split(e.find).length - 1;
    if (n !== 1) { console.error('FAIL  guard x' + n + ': ' + e.find.slice(0, 60)); continue; }
    next = next.replace(e.find, e.to);
    applied++;
  }

  // 4. insert the types section before the procrastination comparison
  if (!next.includes('types-of-adhd-paralysis')) {
    const marker = '<h2 id="how-is-task-paralysis-different-from-procrastination">';
    const n = next.split(marker).length - 1;
    if (n !== 1) { console.error('FAIL  insertion marker x' + n); }
    else {
      next = next.replace(marker, TYPES + marker);
      // add it to the TOC too
      const tocAnchor = '<li><a href="#how-is-task-paralysis-different-from-procrastination">';
      if (next.split(tocAnchor).length - 1 === 1) {
        next = next.replace(tocAnchor, '<li><a href="#types-of-adhd-paralysis">What are the different types of ADHD paralysis?</a></li>\n  ' + tocAnchor);
      }
      applied++;
    }
  } else console.log('SKIP  types section already present');

  if (!applied) { console.log('nothing to do'); return; }
  if ((next.match(/—/g) || []).length) { console.error('ABORT em dash introduced'); process.exit(1); }

  let done = false;
  for (let a = 1; a <= 3 && !done; a++) {
    const r = await fetch(BASE + '/wp-json/wp/v2/posts/42', {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next, title: NEW_TITLE }),
    });
    if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
    await sleep(3000);
    const fresh = await get();
    if (fresh.content.includes('types-of-adhd-paralysis') && fresh.title === NEW_TITLE) done = true;
    else console.error('  not persisted, retry ' + a);
  }
  if (!done) { console.error('FAIL  did not persist'); process.exit(1); }

  // 5. RankMath focus keyword
  const rm = await fetch(BASE + '/wp-json/rankmath/v1/updateMeta', {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectID: 42, objectType: 'post', meta: { rank_math_focus_keyword: 'adhd paralysis' } }),
  });
  console.log('RankMath focus keyword: HTTP ' + rm.status);

  const after = await get();
  const n2 = (after.content.replace(/<[^>]+>/g, ' ').match(/adhd paralysis/gi) || []).length;
  console.log('\nafter : title "' + after.title + '" (' + after.title.length + ' chars)');
  console.log('after : "adhd paralysis" appears ' + n2 + 'x in body');
  console.log('OK    ' + applied + ' edit(s) applied');
})();
