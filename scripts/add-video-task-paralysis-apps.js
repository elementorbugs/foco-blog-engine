// Adds the "5 apps for ADHD task paralysis" YouTube review (IwVmTjUvaks) to /best-apps-for-adhd-task-paralysis/:
// embed after Key Takeaways + VideoObject schema with key-moment Clips + Article dateModified bump.
// Base = live WP content fetched by scripts/wp-fetch-post.js. Idempotent (skips if already embedded).
// Usage: node scripts/add-video-task-paralysis-apps.js [--live]
const fs = require('fs');
const path = require('path');

const SLUG = 'best-apps-for-adhd-task-paralysis';
const POST_ID = 4315;
const VID = 'IwVmTjUvaks';
const LIVE = process.argv.includes('--live');
const NOW = new Date().toISOString();

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const eq = line.indexOf('=');
  if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});
const host = env.WP_HOST || 'tryfoco.com';
const auth = Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const base = path.join(__dirname, '..', '.audit-cache', `live-${SLUG}.html`);
let html = fs.readFileSync(base, 'utf8');
if (html.includes(`youtube.com/embed/${VID}`)) { console.log('already embedded, nothing to do'); process.exit(0); }

const watch = `https://www.youtube.com/watch?v=${VID}`;
const chapters = [
  ['Why to-do apps fail at task paralysis', 0, 32],
  ['How we evaluated the apps', 32, 71],
  ['1. FOCO', 71, 120],
  ['2. Goblin Tools', 120, 158],
  ['3. Inflow', 158, 199],
  ['4. Finch', 199, 240],
  ['5. Habitica', 240, 285],
];

const embed = `<!-- wp:html -->
<figure style="margin:28px 0">
<iframe width="100%" height="360" style="border-radius:14px;border:1px solid rgba(167,139,250,0.18);aspect-ratio:16/9" src="https://www.youtube.com/embed/${VID}" title="5 Best Apps for ADHD Task Paralysis, Ranked" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
<figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">Video: the top 5 apps for ADHD task paralysis, ranked in under 5 minutes</figcaption>
</figure>
<!-- /wp:html -->`;

const videoSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: '5 Best Apps for ADHD Task Paralysis, Ranked',
  description: "We rank 5 apps for ADHD task paralysis (FOCO, Goblin Tools, Inflow, Finch, Habitica) by one test: what happens in the first 60 seconds after you open the app while you're frozen on a task.",
  thumbnailUrl: [`https://i.ytimg.com/vi/${VID}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${VID}/hqdefault.jpg`],
  uploadDate: '2026-10-02T04:29:36-07:00',
  duration: 'PT4M45S',
  embedUrl: `https://www.youtube.com/embed/${VID}`,
  url: watch,
  publisher: { '@type': 'Organization', name: 'FOCO', logo: { '@type': 'ImageObject', url: 'https://tryfoco.com/wp-content/uploads/2026/05/foco-logo-mark.png' } },
  hasPart: chapters.map(([name, start, end]) => ({ '@type': 'Clip', name, startOffset: start, endOffset: end, url: `${watch}&t=${start}s` })),
};
const schemaBlock = `<!-- wp:html --><script type="application/ld+json">${JSON.stringify(videoSchema)}</script><!-- /wp:html -->`;

// 1. Embed right after the Key Takeaways box
const ktStart = html.indexOf('<div class="foco-key-takeaways">');
const ktEnd = html.indexOf('</div>', ktStart);
if (ktStart < 0 || ktEnd < 0) throw new Error('Key Takeaways box not found');
html = html.slice(0, ktEnd + 6) + '\n\n' + embed + html.slice(ktEnd + 6);

// 2. VideoObject schema next to the existing Article schema
const articleIdx = html.indexOf('<!-- wp:html --><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"');
if (articleIdx < 0) throw new Error('Article schema not found');
html = html.slice(0, articleIdx) + schemaBlock + '\n' + html.slice(articleIdx);

// 3. Freshness: bump Article dateModified
html = html.replace(/("@type":"Article"[^]*?"dateModified":")[^"]+(")/, `$1${NOW}$2`);

if (/—/.test(embed + schemaBlock)) throw new Error('em dash in new content');
const out = path.join(__dirname, '..', '.audit-cache', `new-${SLUG}.html`);
fs.writeFileSync(out, html);
console.log('built', out, 'chars', html.length);

if (!LIVE) { console.log('dry run, pass --live to push'); process.exit(0); }
(async () => {
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts/${POST_ID}`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: html }),
  });
  const j = await res.json();
  console.log('push', res.status, j.status, j.link, 'modified', j.modified);
})();
