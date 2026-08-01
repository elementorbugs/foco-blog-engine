// Links the weekly/daily planner format pages into the planner cluster.
//   node link-planner-formats.js            -> cross-link the two new posts only (safe while drafts)
//   node link-planner-formats.js --inbound  -> ALSO add inbound links from published posts (run AFTER publishing)
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const HOST = env.WP_HOST.replace(/\/$/, '');
const BASE = HOST.startsWith('http') ? HOST : 'https://' + HOST;
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const W = 'https://www.tryfoco.com/adhd-weekly-planner/';
const D = 'https://www.tryfoco.com/adhd-daily-planner/';
const A = (u, t) => '<a href="' + u + '">' + t + '</a>';

// mode: 'wrap'   -> replace `find` with `add` (find must occur exactly once)
// mode: 'after'  -> insert `add` right after the </p> that follows `find`
const PATCHES = [
  { id: 4100, tag: 'weekly -> daily', mode: 'wrap', core: true,
    find: 'switch to a single day at a time with the ADHD daily planner.',
    add:  'switch to a single day at a time with the ' + A(D, 'ADHD daily planner') + '.' },

  { id: 858, tag: 'adhd-planner -> both', mode: 'after', inbound: true,
    find: 'Print a few copies, keep them where you already look, and use the placement',
    add: '<p>If you want a specific format rather than the general one-page sheet, there is a printable ' + A(W, 'ADHD weekly planner') + ' with three lines per day, and a one-page ' + A(D, 'ADHD daily planner') + ' for the days that have already gone sideways.</p>' },

  { id: 762, tag: 'best-adhd-planner -> both', mode: 'after', inbound: true,
    find: 'Most ADHD adults have bought 3-5 planners they stopped using within 2 weeks.',
    add: '<p>If you would rather print a sheet than buy a book, the free ' + A(W, 'ADHD weekly planner') + ' and ' + A(D, 'ADHD daily planner') + ' templates cover both formats at no cost.</p>' },

  { id: 780, tag: 'cleaning -> weekly', mode: 'after', inbound: true,
    find: 'The format of the planner matters as much as the task breakdown.',
    add: '<p>For planning outside the cleaning routine, the same one-page approach is in the printable ' + A(W, 'ADHD weekly planner') + '.</p>' },

  { id: 3332, tag: 'abandoning -> daily', mode: 'after', inbound: true,
    find: 'switching from a digital tool to a paper one usually buys a few good weeks',
    add: '<p>If paper is the next thing you try, start with a sheet that has a hard cap instead of blank pages, like the printable ' + A(D, 'ADHD daily planner') + '.</p>' },

  { id: 1924, tag: 'meal -> weekly', mode: 'after', inbound: true,
    find: 'Pick your meals for the week in one sitting, then stop deciding.',
    add: '<p>The same decide-once approach covers the rest of the week in the printable ' + A(W, 'ADHD weekly planner') + '.</p>' },
];

const doInbound = process.argv.includes('--inbound');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getContent(id) {
  const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + id + '?context=edit&_=' + Math.floor(Math.random() * 1e9), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const j = await r.json();
  return j.content.raw !== undefined ? j.content.raw : j.content.rendered;
}

(async () => {
  let ok = 0, skipped = 0, failed = 0;
  for (const p of PATCHES) {
    if (p.inbound && !doInbound) { console.log('SKIP  ' + p.id + '  ' + p.tag + '  (needs --inbound, run after publish)'); skipped++; continue; }

    let content = await getContent(p.id);

    if (content.includes(p.add)) { console.log('OK    ' + p.id + '  ' + p.tag + '  (already present)'); ok++; continue; }

    const n = content.split(p.find).length - 1;
    if (n !== 1) { console.error('FAIL  ' + p.id + '  ' + p.tag + '  guard appears ' + n + ' times, expected 1'); failed++; continue; }

    let next;
    if (p.mode === 'wrap') {
      next = content.replace(p.find, p.add);
    } else {
      const i = content.indexOf(p.find);
      const close = content.indexOf('</p>', i);
      if (close < 0) { console.error('FAIL  ' + p.id + '  no closing </p> after guard'); failed++; continue; }
      next = content.slice(0, close + 4) + '\n\n' + p.add + content.slice(close + 4);
    }

    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/posts/' + p.id, {
        method: 'POST',
        headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: next }),
      });
      if (!r.ok) { console.error('  POST ' + r.status + ' (attempt ' + attempt + ')'); await sleep(2000); continue; }
      await sleep(3000);
      const fresh = await getContent(p.id);
      if (fresh.includes(p.add)) done = true;
      else console.error('  not persisted, retrying (attempt ' + attempt + ')');
    }

    if (done) { console.log('OK    ' + p.id + '  ' + p.tag); ok++; }
    else { console.error('FAIL  ' + p.id + '  ' + p.tag + '  did not persist after 3 attempts'); failed++; }
  }
  console.log('\n' + ok + ' patched, ' + skipped + ' skipped, ' + failed + ' failed');
  if (!doInbound) console.log('Run again with --inbound once /adhd-weekly-planner/ and /adhd-daily-planner/ are published.');
})();
