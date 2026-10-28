// Deploys the redesigned /adhd-tools/ hub (page #1138). Same pattern as tools/visual-timer: one standalone document,
// served by a Code Snippet instead of the theme. It reuses the visual timer's stylesheet, header, footer and badges.
//   node tools/adhd-tools/deploy.js            build + push the snippet (the page keeps its status)
//   node tools/adhd-tools/deploy.js --build    only write tools/adhd-tools/preview.html (no network)
// Rollback: wp-admin -> Snippets -> deactivate "FOCO tools page" and the old page content shows again.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SITE = path.resolve(DIR, '../..');
const VT = path.join(SITE, 'tools', 'visual-timer');
const PAGE_ID = 1138;
const SNIPPET_NAME = 'FOCO tools page';
const BUILD_ONLY = process.argv.includes('--build');

const env = {};
fs.readFileSync(path.join(SITE, '.env'), 'utf8').split(/\r?\n/).forEach((l) => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); });
const BASE = 'https://' + (env.WP_HOST || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const wp = async (method, route, body) => { const r = await fetch(BASE + route, { method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => null) }; };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (s) => s.replace(/<[^>]+>/g, '');

const PRINTABLES = [
  ['adhd-cleaning-planner', 'Cleaning planner kit'], ['adhd-weekly-planner', 'Weekly planner'], ['adhd-daily-planner', 'Daily planner'], ['adhd-habit-tracker-printable', 'Habit tracker'],
  ['adhd-meal-planner', 'Meal planner'], ['adhd-visual-schedule', 'Visual schedule'], ['adhd-task-paralysis-reset-checklist', 'Task paralysis reset checklist'], ['adhd-dopamine-menu', 'Dopamine menu'],
];
const FAQ = [
  ['Are these ADHD tools really free?', 'Yes. The visual timer, the body doubling room, the brain dump and the printables are free, with no sign-up and no ads. The FOCO app is the only paid product.'],
  ['Do I need to create an account?', 'No. Open a tool and use it. The timer remembers your settings in your own browser and nothing is stored on a server.'],
  ['Do they work on my phone?', 'Yes. Every tool works in a phone browser. For the timer, turn on Keep screen awake in its settings so the screen does not dim.'],
  ['Which tool should I start with?', 'If a task will not start, try the <a href="https://www.tryfoco.com/visual-timer/5-minute/">5-minute visual timer</a>. If your head is too full, start with the <a href="https://www.tryfoco.com/adhd-brain-dump/">brain dump</a>.'],
  ['What is the difference between these tools and the FOCO app?', 'The free tools each do one job in your browser. FOCO is an iPhone and Android app that breaks a stuck task into timed steps, puts it in your calendar and stays with you while you focus.'],
];

function build() {
  const vtHtml = fs.readFileSync(path.join(VT, 'index.html'), 'utf8');
  const header = vtHtml.match(/<header class="vt-bar">[\s\S]*?<\/header>/)[0];
  const footer = vtHtml.match(/<footer class="vt-foot">[\s\S]*?<\/footer>/)[0];
  const badges = vtHtml.match(/<div class="vt-stores">([\s\S]*?)<\/div>\s*<p class="vt-cta-small">/)[1];
  const imgs = JSON.parse(fs.readFileSync(path.join(SITE, 'tools', 'printables.json'), 'utf8'));
  const shelf = PRINTABLES.map(([slug, label]) => '<a href="https://www.tryfoco.com/' + slug + '/"><img src="' + imgs[slug].img + '" alt="' + esc(label) + ' printable for ADHD" width="768" height="403" loading="lazy"><span>' + esc(label) + '</span><small>Free PDF</small></a>').join('');
  const faq = FAQ.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + a + '</p></details>').join('');
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': 'https://www.tryfoco.com/adhd-tools/#page', name: 'Free ADHD Tools', url: 'https://www.tryfoco.com/adhd-tools/', description: 'Free browser tools and printables for ADHD: a visual timer, a live body doubling room, a brain dump sorter and printable planners.', publisher: { '@id': 'https://www.tryfoco.com/#organization' },
      mainEntity: { '@type': 'ItemList', itemListElement: [['Visual Timer', 'visual-timer'], ['Body doubling room', 'body-doubling'], ['Brain dump', 'adhd-brain-dump'], ...PRINTABLES.map(([s, l]) => [l, s])].map(([n, s], i) => ({ '@type': 'ListItem', position: i + 1, name: n, url: 'https://www.tryfoco.com/' + s + '/' })) } },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tryfoco.com/' }, { '@type': 'ListItem', position: 2, name: 'Free ADHD Tools', item: 'https://www.tryfoco.com/adhd-tools/' }] },
  ] };
  const gtag = '<script async src="https://www.googletagmanager.com/gtag/js?id=GT-KFLGFL83"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","GT-KFLGFL83");</script>';
  let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')
    .replace('__HEADER__', () => header).replace('__FOOTER__', () => footer).replace('__BADGES__', () => badges)
    .replace('__PRINTABLES__', () => shelf).replace('__FAQ__', () => faq).replace('__SCHEMA__', () => JSON.stringify(schema));
  html = html.replace('<link rel="stylesheet" href="../visual-timer/timer.css">', () => '<style>' + fs.readFileSync(path.join(VT, 'timer.css'), 'utf8') + '</style>');
  html = html.replace('<link rel="stylesheet" href="tools.css">', () => '<style>' + fs.readFileSync(path.join(DIR, 'tools.css'), 'utf8') + '</style>\n' + gtag);
  html = html.replace(' aria-current="page"', '').replace('<a href="https://www.tryfoco.com/adhd-tools/">Free ADHD Tools</a>', '<a href="https://www.tryfoco.com/adhd-tools/" aria-current="page">Free ADHD Tools</a>');
  if (/__[A-Z]+__/.test(html)) throw new Error('unfilled placeholder');
  if (/—/.test(html)) throw new Error('em dash');
  if (html.includes('FOCOTOOLS')) throw new Error('heredoc marker inside the document');
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) throw new Error('needs exactly one h1');
  return html;
}

(async () => {
  const html = build();
  fs.writeFileSync(path.join(DIR, 'preview.html'), html);
  if (BUILD_ONLY) { console.log('built preview.html (' + Math.round(html.length / 1024) + ' KB)'); return; }
  const code = "// FOCO tools page: serves the redesigned /adhd-tools/ (page " + PAGE_ID + ") instead of the theme.\n// Generated by tools/adhd-tools/deploy.js. Deactivate this snippet to roll back.\nadd_action('template_redirect', function () {\n\tif (!is_page(" + PAGE_ID + ")) { return; }\n\tstatus_header(200);\n\theader('Content-Type: text/html; charset=utf-8');\n\techo <<<'FOCOTOOLS'\n" + html + "\nFOCOTOOLS;\n\texit;\n}, 1);\n";
  const list = await wp('GET', '/wp-json/code-snippets/v1/snippets');
  const existing = (list.json || []).find((s) => s.name === SNIPPET_NAME);
  const res = await wp(existing ? 'PUT' : 'POST', '/wp-json/code-snippets/v1/snippets' + (existing ? '/' + existing.id : ''), { name: SNIPPET_NAME, desc: 'Serves the redesigned /adhd-tools/ instead of the theme. Source: tools/adhd-tools. Deactivate to roll back.', scope: 'front-end', active: true, code });
  console.log('snippet: HTTP ' + res.status + ' | id ' + (res.json && res.json.id) + ' | code_error ' + JSON.stringify(res.json && res.json.code_error) + ' | ' + Math.round(code.length / 1024) + ' KB');
  if (res.status >= 300 || (res.json && res.json.code_error)) process.exit(1);
  // saving the page makes Breeze purge its Varnish copy, so the new snippet output shows right away
  const page = await wp('GET', '/wp-json/wp/v2/pages/' + PAGE_ID + '?context=edit');
  await wp('POST', '/wp-json/wp/v2/pages/' + PAGE_ID, { content: page.json.content.raw });
  await wp('POST', '/wp-json/rankmath/v1/updateMeta', { objectID: PAGE_ID, objectType: 'post', meta: { rank_math_title: 'Free ADHD Tools: Visual Timer, Body Doubling, Printables | FOCO', rank_math_description: 'Free ADHD tools that work in your browser: a visual timer, a live body doubling room, a brain dump sorter and printable planners. No sign-up.' } });
  console.log('Done. https://www.tryfoco.com/adhd-tools/');
})().catch((e) => { console.error('DEPLOY FAILED:', e.message); process.exit(1); });
