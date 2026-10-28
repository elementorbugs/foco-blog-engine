// Swaps the old focus-timer widget in the minute-timer ADHD posts for the new visual timer, embedded in
// ?embed=1 mode and preset to the post's length (2026-10-28). Also points each post's visual-timer
// Key Takeaways link at its own preset page. GET -> backup -> guarded edit -> POST -> verify.
//   node embed-visual-timer.js [--dry]
// The embed resizes itself: the timer posts its height, the one-line listener below sets the iframe height.
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
const dry = process.argv.includes('--dry');
const POSTS = [{ id: 723, m: 5 }, { id: 699, m: 10 }, { id: 728, m: 15 }, { id: 737, m: 20 }, { id: 742, m: 25 }, { id: 747, m: 30 }];

const block = m => `<!-- wp:html --><div class="foco-vt-embed foco-dark" style="margin:32px 0"><iframe src="https://www.tryfoco.com/visual-timer/?embed=1&amp;min=${m}" title="${m} minute visual timer" loading="lazy" allow="screen-wake-lock; fullscreen" allowfullscreen style="width:100%;height:760px;border:0;border-radius:22px;display:block;background:#0a0410"></iframe></div><script>window.addEventListener('message',function(e){if(!/tryfoco\\.com$/.test(new URL(e.origin).hostname)||!e.data||!e.data.vtHeight)return;document.querySelectorAll('.foco-vt-embed iframe').forEach(function(f){if(f.contentWindow===e.source)f.style.height=(e.data.vtHeight+4)+'px'})});</script><!-- /wp:html -->`;

// same boundary logic as apply-timer-design.js: the one wp:html block that holds the old widget
function swapBlock(html, replacement) {
  const at = html.indexOf('foco-timer-wrap');
  if (at === -1) return null;
  const start = html.lastIndexOf('<!-- wp:html -->', at);
  const endTag = '<!-- /wp:html -->';
  const end = html.indexOf(endTag, at);
  if (start === -1 || end === -1) return null;
  const rest = html.slice(end + endTag.length);
  if (rest.includes('foco-timer-wrap')) return null;
  return html.slice(0, start) + replacement + rest;
}

const api = (p, opt = {}) => fetch(BASE + p, { ...opt, headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...(opt.headers || {}) } });
const get = async id => (await api(`/wp-json/wp/v2/posts/${id}?context=edit&_=${Math.random()}`)).json();

(async () => {
  fs.mkdirSync(path.join(__dirname, '.audit-cache', 'backups'), { recursive: true });
  for (const { id, m } of POSTS) {
    const post = await get(id);
    if (!post || !post.content) { console.log(`#${id}: NOT FOUND`); continue; }
    let body = post.content.raw;
    if (body.includes('foco-vt-embed')) { console.log(`#${id} (${post.status}): SKIP already embedded`); continue; }
    const swapped = swapBlock(body, block(m));
    if (!swapped) { console.log(`#${id}: SKIP old widget block not found exactly once`); continue; }
    body = swapped;
    const hub = '<a href="https://www.tryfoco.com/visual-timer/">visual timer</a>: the colour shrinks';
    if (body.split(hub).length === 2) body = body.replace(hub, `<a href="https://www.tryfoco.com/visual-timer/${m}-minute/">${m} minute visual timer</a>: the colour shrinks`);
    if (dry) { console.log(`#${id} ${post.slug} (${post.status}): would embed ${m} min`); continue; }
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${id}-pre-vt-embed-${Date.now()}.html`), post.content.raw);
    const r = await api(`/wp-json/wp/v2/posts/${id}`, { method: 'POST', body: JSON.stringify({ content: body }) });
    await new Promise(res => setTimeout(res, 2000));
    const fresh = (await get(id)).content.raw;
    console.log(`#${id} ${post.slug}: HTTP ${r.status} | embedded: ${fresh.includes('foco-vt-embed')} | old widget gone: ${!fresh.includes('foco-timer-wrap')} | preset link: ${fresh.includes('/visual-timer/' + m + '-minute/')}`);
  }
})();
