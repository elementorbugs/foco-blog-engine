// Distributes the FOCO Research Vol 1 findings (n=194) across the posts where each
// stat is genuinely relevant. One DISTINCT stat per post, no repeats, always
// attributed and linked. Purpose is information gain on the receiving posts and
// entity-building for FOCO Research, not lifting the survey's own ranking.
//   node cite-survey-across-site.js            dry run
//   node cite-survey-across-site.js --live
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

const SURVEY = 'https://www.tryfoco.com/adhd-execution-paralysis-survey/';
const cite = body => '<p>In <a href="' + SURVEY + '">FOCO\'s 2026 survey of 194 adults with ADHD</a>, ' + body + '</p>';

// slug -> a DISTINCT finding that belongs on that page
const MAP = {
  'body-doubling-adhd':                     cite('87% rated working alongside someone as helpful or life-changing, the highest-rated intervention in the whole study.'),
  'adhd-activation':                        cite('80% said they freeze in front of a task they know they need to do five or more times a day.'),
  'task-breakdown':                         cite('78% rated breaking tasks into small steps as helpful or life-changing.'),
  'foco-start-method':                      cite('76% said the help they wanted most was someone breaking down the first step for them.'),
  'task-initiation-strategies-for-adults':  cite('73% said the first thing they feel when a task comes to mind is "I do not know where to start."'),
  'emotional-regulation-adhd':              cite('75% named guilt as the main emotion attached to their procrastination, rather than indifference.'),
  'wall-of-awful-adhd':                     cite('95% named a self-directed emotion as the feeling attached to procrastination, which is what makes the wall build in the first place.'),
  'adhd-imposter-syndrome':                 cite('20% named frustration at knowing exactly what to do and still not doing it as their main feeling.'),
  'adhd-brain-dump':                        cite('68% said their main strategy for mental overload is trying to hold everything in their head, with no external system at all.'),
  'working-memory-adhd':                    cite('25% write notes on their phone and then forget the notes, which is a working memory problem wearing a productivity costume.'),
  'time-blindness-adhd':                    cite('61% named misjudging how long things take as their single biggest time thief.'),
  'pomodoro-for-adhd':                      cite('64% rated a visual timer as helpful or life-changing.'),
  'why-you-keep-abandoning-adhd-planner-apps': cite('only 8% said they rely on apps or planners, because the ones they had stopped being opened.'),
  'how-to-focus-with-adhd':                 cite('22% named switching between tasks as their biggest time thief, second only to misjudging duration.'),
  'adhd-fidget-toys':                       cite('12% named background noise and distractions as their biggest time thief.'),
  '25-minute-timer-adhd':                   cite('61% said a ten-minute task can feel like an hour-long project, which is often why it never gets started.'),
};

const LIVE = process.argv.includes('--live');

async function find(slug) {
  for (const type of ['posts', 'pages']) {
    const r = await fetch(BASE + '/wp-json/wp/v2/' + type + '?slug=' + slug + '&status=publish&_fields=id,slug', { headers: { Authorization: AUTH } });
    if (!r.ok) continue;
    const j = await r.json();
    if (Array.isArray(j) && j.length) return { type, id: j[0].id };
  }
  return null;
}
async function get(type, id) {
  const r = await fetch(BASE + '/wp-json/wp/v2/' + type + '/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
}

// Documented safe insertion point: immediately before "The Bottom Line", else the FAQ.
function insertionIndex(c) {
  for (const re of [/<h2[^>]*>\s*The Bottom Line\s*<\/h2>/i, /<h2[^>]*>\s*The bottom line\s*<\/h2>/i, /<h2[^>]*id="faq"[^>]*>/i, /<h2[^>]*>\s*FAQ\s*<\/h2>/i]) {
    const m = c.match(re);
    if (m) return c.indexOf(m[0]);
  }
  return -1;
}

(async () => {
  let ok = 0, skip = 0, fail = 0;
  for (const [slug, para] of Object.entries(MAP)) {
    const t = await find(slug);
    if (!t) { console.log('SKIP  /' + slug + '/  not found'); skip++; continue; }
    const c = await get(t.type, t.id);
    if (c.includes('adhd-execution-paralysis-survey')) { console.log('SKIP  /' + slug + '/  already cites the survey'); skip++; continue; }
    const i = insertionIndex(c);
    if (i < 0) { console.error('FAIL  /' + slug + '/  no Bottom Line or FAQ anchor'); fail++; continue; }

    const stat = (para.match(/\b\d+%/) || ['?'])[0];
    if (!LIVE) { console.log('WOULD  ' + stat.padStart(4) + '  /' + slug + '/  (' + t.type + '/' + t.id + ')'); ok++; continue; }

    const next = c.slice(0, i) + para + '\n\n' + c.slice(i);
    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/' + t.type + '/' + t.id, {
        method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: next }),
      });
      if (!r.ok) { console.error('  POST ' + r.status); await sleep(2000); continue; }
      await sleep(2500);
      if ((await get(t.type, t.id)).includes('adhd-execution-paralysis-survey')) done = true;
      else console.error('  not persisted, retry ' + a);
    }
    if (done) { console.log('OK    ' + stat.padStart(4) + '  /' + slug + '/'); ok++; }
    else { console.error('FAIL  /' + slug + '/  did not persist'); fail++; }
  }
  console.log('\n' + ok + (LIVE ? ' cited' : ' would be cited') + ', ' + skip + ' skipped, ' + fail + ' failed');
  if (!LIVE) console.log('Re-run with --live to apply.');
})();
