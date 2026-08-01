// Pins one canonical description of FOCO across the site and removes the wording
// that contradicts it.
//
// Two problems this fixes:
//   1. The Organization schema description (on 76 pages) disagreed with the
//      homepage and with the positioning hierarchy. AI engines read schema first.
//   2. Four pages call FOCO a "body-doubling room" while two others say it is
//      "not a room of strangers". FOCO's body doubling is an AI character. "Room"
//      implies other people, and the same page lists real Discord/Zoom rooms two
//      paragraphs later, so the word is doing two jobs at once.
//
//   node standardize-foco-identity.js          dry run
//   node standardize-foco-identity.js --live
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

// Primary category: ADHD focus companion. Secondary: ADHD planner app.
// Problem: task paralysis / task initiation. Mechanism: AI task breakdown plus
// guided focus. Differentiator: one subtask at a time.
const CANON = 'FOCO is an AI-powered ADHD focus companion that helps adults overcome task paralysis by breaking overwhelming tasks into small, actionable steps and guiding them through focused work, one subtask at a time.';

// "room" -> language that keeps the AI character explicit. Order matters:
// longest first, so a shorter pattern cannot eat a longer one.
const ROOM = [
  ['FOCO body-doubling room at the top of this page gives you a focus session plus a timer',
   'FOCO body doubling session at the top of this page gives you a focus session plus a timer'],
  ['FOCO body-doubling room at the top of this page is built exactly for this',
   'FOCO body doubling session at the top of this page is built exactly for this'],
  ['FOCO builds this into a free body-doubling room, so you can start a focused session in seconds',
   'FOCO builds this into a free guided focus session with an on-screen AI companion, so you can begin in seconds'],
  ['<h2 class="foco-bd-title">ADHD Body Doubling Room</h2>',
   '<h2 class="foco-bd-title">ADHD Body Doubling Session</h2>'],
  ['FOCO body-doubling room: The free body-doubling room pairs a focus session with a built-in timer',
   'FOCO body doubling session: the free session pairs an AI focus companion with a built-in timer'],
  ['Option 2: Use a free body-doubling room.', 'Option 2: Use a free guided session.'],
  ['FOCO has a body-doubling room built for exactly this',
   'FOCO has a free guided body doubling session built for exactly this'],
  ['free body-doubling room', 'free body doubling session'],
  ['body-doubling room', 'body doubling session'],
];

const get = async (t, id) => {
  const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

const push = async (t, id, content, check) => {
  for (let a = 1; a <= 3; a++) {
    const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '/' + id, {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!r.ok) { console.error('    POST ' + r.status); await sleep(2000); continue; }
    await sleep(2200);
    if (check(await get(t, id))) return true;
    console.error('    not persisted, retry ' + a);
  }
  return false;
};

(async () => {
  const all = [];
  for (const t of ['posts', 'pages']) {
    for (let p = 1; p <= 3; p++) {
      const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '?per_page=100&page=' + p + '&status=publish&_fields=id,slug', { headers: { Authorization: AUTH } });
      if (!r.ok) break;
      const j = await r.json();
      if (!j.length) break;
      j.forEach(x => all.push({ t, id: x.id, slug: x.slug }));
      if (j.length < 100) break;
    }
  }
  console.log('scanning ' + all.length + ' published URLs\n');

  let schemaN = 0, roomN = 0, fail = 0;
  for (const x of all) {
    let c = await get(x.t, x.id);
    const before = c;
    const notes = [];

    // 1. Organization schema description. Parse the block rather than pattern
    //    match it: older posts nest logo as an ImageObject, so any regex bounded
    //    by "no closing brace" silently skips them (it found 5 of 76).
    c = c.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, open, json, close) => {
      let obj;
      try { obj = JSON.parse(json); } catch (e) { return m; }
      if (obj['@type'] !== 'Organization' || typeof obj.description !== 'string') return m;
      if (obj.description === CANON) return m;
      obj.description = CANON;
      notes.push('schema');
      return open + JSON.stringify(obj) + close;
    });

    // 2. the "room" wording
    for (const [from, to] of ROOM) {
      if (c.includes(from)) { c = c.split(from).join(to); notes.push('room'); }
    }

    if (c === before) continue;
    const kinds = [...new Set(notes)];
    if (kinds.includes('schema')) schemaN++;
    if (kinds.includes('room')) roomN++;

    // never ship broken JSON-LD
    let bad = false;
    for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { bad = true; }
    }
    if (bad) { console.error('SKIP  /' + x.slug + '/  edit would break JSON-LD'); fail++; continue; }

    if (!LIVE) { console.log('WOULD  /' + x.slug + '/  [' + kinds.join('+') + ']'); continue; }
    const ok = await push(x.t, x.id, c, f => (!kinds.includes('schema') || f.includes(CANON)) && (!kinds.includes('room') || !/body-doubling room|Body Doubling Room/.test(f)));
    if (ok) console.log('OK    /' + x.slug + '/  [' + kinds.join('+') + ']');
    else { console.error('FAIL  /' + x.slug + '/'); fail++; }
  }

  console.log('\nschema description updated: ' + schemaN + ' page(s)');
  console.log('"room" wording fixed:       ' + roomN + ' page(s)');
  if (fail) console.log('failures: ' + fail);
  if (!LIVE) console.log('\nDry run. Re-run with --live to apply.');
})();
