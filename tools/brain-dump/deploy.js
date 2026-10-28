// Deploys the brain dump tool into /adhd-brain-dump/ (post 1019). Source of truth: tool.html, tool.css, tool.js here.
//   node tools/brain-dump/deploy.js            build + swap the tool block in the live post (backup first)
//   node tools/brain-dump/deploy.js --build    only write tools/brain-dump/preview.html (no network)
// It GETs the live post, replaces only the tool's <!-- wp:html --> block (old or new version), and fixes the
// intro lines that describe the tool. Re-runs are safe.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SITE = path.resolve(DIR, '../..');
const POST_ID = 1019;
const BUILD_ONLY = process.argv.includes('--build');

const env = {};
fs.readFileSync(path.join(SITE, '.env'), 'utf8').split(/\r?\n/).forEach((l) => { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); });
const BASE = 'https://' + (env.WP_HOST || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const wp = async (method, route, body) => { const r = await fetch(BASE + route, { method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => null) }; };

const SCHEMA = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'FOCO ADHD Brain Dump Tool', applicationCategory: 'ProductivityApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'A free, browser-based brain dump tool for ADHD adults. Type everything in your head, sort it into Now, This Week, Someday and Trash, then start the top item with a 5-minute visual timer. No signup, no AI, nothing leaves your device.', creator: { '@id': 'https://www.tryfoco.com/#organization' } };

function build() {
  const css = fs.readFileSync(path.join(DIR, 'tool.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}');
  const html = fs.readFileSync(path.join(DIR, 'tool.html'), 'utf8').replace(/\s*\n\s*/g, '');
  const js = fs.readFileSync(path.join(DIR, 'tool.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(' ');
  if (/&&/.test(js)) throw new Error('"&&" in tool.js: WordPress turns it into entities');
  if (/(^|[^:'"])\/\/[^\n]/.test(js.replace(/https?:\/\/[^'"\s]+/g, ''))) throw new Error('line comment in tool.js would swallow the rest of the joined script');
  const block = '<!-- wp:html --><style id="fbd-style">' + css + '</style>' + html + '<script>' + js + '</script><script type="application/ld+json">' + JSON.stringify(SCHEMA) + '</script><!-- /wp:html -->';
  if (/—/.test(block)) throw new Error('em dash');
  return block;
}

const INTRO = [
  ['Type everything in your head, then click Auto-Categorize.', 'Type everything in your head, one thought per line, then tap Sort.'],
  ['Drag any item that landed in the wrong bucket. Pick one Now item and go start it.', 'Move anything that landed in the wrong bucket with the arrows beside it. Then press Start on the item at the top: it opens a 5-minute visual timer with that task.'],
  ['sorts your dump into Now, This Week, Someday, and Trash.', 'sorts your dump into Now, This Week, Someday, and Trash, then starts the first item with a timer.'],
];

(async () => {
  const block = build();
  const preview = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brain dump preview</title><style>body{margin:0;padding:24px 16px;background:#F7F4FC;font-family:system-ui}main{max-width:760px;margin:0 auto}</style></head><body><main>' + block + '</main></body></html>';
  fs.writeFileSync(path.join(DIR, 'preview.html'), preview);
  if (BUILD_ONLY) { console.log('built preview.html (' + Math.round(block.length / 1024) + ' KB block)'); return; }

  const post = await wp('GET', '/wp-json/wp/v2/posts/' + POST_ID + '?context=edit&_fields=content');
  const raw = post.json && post.json.content && post.json.content.raw;
  if (!raw) throw new Error('could not read post ' + POST_ID + ' (HTTP ' + post.status + ')');
  const mark = raw.search(/<style id="(fbd-style|foco-bd-dump-style)">/);
  if (mark < 0) throw new Error('tool block not found in post ' + POST_ID);
  const s = raw.lastIndexOf('<!-- wp:html -->', mark);
  const e = raw.indexOf('<!-- /wp:html -->', mark) + '<!-- /wp:html -->'.length;
  let next = raw.slice(0, s) + block + raw.slice(e);
  INTRO.forEach(([a, b]) => { next = next.split(a).join(b); });
  if (next === raw) { console.log('no change'); return; }
  const bk = path.join(SITE, '.audit-cache', 'backups');
  fs.mkdirSync(bk, { recursive: true });
  fs.writeFileSync(path.join(bk, 'adhd-brain-dump-' + POST_ID + '-pre-tool-' + Date.now() + '.html'), raw);
  const u = await wp('POST', '/wp-json/wp/v2/posts/' + POST_ID, { content: next });
  if (u.status !== 200) throw new Error('push failed: HTTP ' + u.status);
  console.log('Done. https://www.tryfoco.com/adhd-brain-dump/');
})().catch((err) => { console.error('DEPLOY FAILED:', err.message); process.exit(1); });
