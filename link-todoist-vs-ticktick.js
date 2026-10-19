// Inbound links to the new /todoist-vs-ticktick/ post (published 2026-10-19), anchor "Todoist vs TickTick".
// todoist-alternatives: its FAQ "Is TickTick better than Todoist for ADHD?" answered the new post's exact query, so it
// is trimmed to one sentence that links out (visible answer and FAQPage schema kept identical), plus the
// "Comparing more options?" line. Also: ticktick-alternative (its Todoist section), tiimo-vs-todoist, tiimo-vs-ticktick
// and ticktick-vs-structured ("Comparing more options?").
// GET -> guarded edit -> POST -> verify, with backups.
//   node link-todoist-vs-ticktick.js
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
const URL = 'https://www.tryfoco.com/todoist-vs-ticktick/';
const A = `<a href="${URL}">Todoist vs TickTick</a>`;
const OLD_ANSWER = 'TickTick adds a focus timer and habit tracker and costs less per year. Both are still lists, so neither breaks a stuck task into steps.';
const NEW_ANSWER_TEXT = 'TickTick adds a focus timer and habit tracker and costs less per year; our full Todoist vs TickTick comparison goes deeper.';
const NEW_ANSWER_HTML = `TickTick adds a focus timer and habit tracker and costs less per year; our full ${A} comparison goes deeper.`;
const SEE = '<p>Comparing more options? See ';

const PLAN = {
  4392: [ // todoist-alternatives
    [`<p>${OLD_ANSWER}</p>`, `<p>${NEW_ANSWER_HTML}</p>`],
    [`"text":"${OLD_ANSWER}"`, `"text":"${NEW_ANSWER_TEXT}"`],
    [`${SEE}<a href="https://www.tryfoco.com/ticktick-alternative/">TickTick alternatives</a>,`,
     `${SEE}${A}, <a href="https://www.tryfoco.com/ticktick-alternative/">TickTick alternatives</a>,`],
  ],
  4430: [ // ticktick-alternative
    ["One \"Today\" view, capture as things come up, and skip due dates that aren't real.</p>",
     `One "Today" view, capture as things come up, and skip due dates that aren't real.</p>\n<p>Torn between the two? Our ${A} comparison goes through them side by side.</p>`],
  ],
  4929: [ // tiimo-vs-todoist
    [`${SEE}<a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>,`,
     `${SEE}${A}, <a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>,`],
  ],
  4916: [ // tiimo-vs-ticktick
    [`${SEE}<a href="https://www.tryfoco.com/tiimo-vs-structured/">Tiimo vs Structured</a>,`,
     `${SEE}${A}, <a href="https://www.tryfoco.com/tiimo-vs-structured/">Tiimo vs Structured</a>,`],
  ],
  4939: [ // ticktick-vs-structured
    [`${SEE}<a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>,`,
     `${SEE}${A}, <a href="https://www.tryfoco.com/tiimo-vs-ticktick/">Tiimo vs TickTick</a>,`],
  ],
};

const get = async id => (await (await fetch(BASE + `/wp-json/wp/v2/posts/${id}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } })).json()).content.raw;

(async () => {
  for (const [id, edits] of Object.entries(PLAN)) {
    const live = await get(id); let next = live, n = 0;
    for (const [find, to] of edits) {
      if (next.includes(to)) { console.log(`${id}: SKIP already: ${to.slice(0, 50)}`); continue; }
      const c = next.split(find).length - 1;
      if (c !== 1) { console.error(`${id}: ABORT guard x${c}: ${find.slice(0, 60)}`); process.exit(1); }
      next = next.replace(find, () => to); n++;
    }
    if (!n) continue;
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-tvt2-link-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${id}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(id);
    console.log(`${id}: HTTP ${r.status} | ${n} edit(s) | links to new post: ${fresh.includes(URL)}`);
  }
})();
