// Embed a FOCO YouTube video in a live WP post: iframe right after the answer box (.foco-tldr), VideoObject schema with
// chapter Clips next to the Article schema, Article dateModified bumped. Base = live content (wp-fetch-post.js).
// Idempotent (skips if the video is already embedded). Dry run by default.
//
// Usage: node scripts/add-youtube-to-post.js <config.json> [--live]
// config: { "slug", "postId", "videoId", "title", "caption", "description", "uploadDate", "durationSec",
//           "chapters": [["name", startSec], ...] }
const fs = require("fs");
const path = require("path");

const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const LIVE = process.argv.includes("--live");
const env = {};
fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n").forEach((line) => {
  line = line.trim();
  const eq = line.indexOf("=");
  if (line && !line.startsWith("#") && eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});
const host = env.WP_HOST || "tryfoco.com";
const auth = Buffer.from(env.WP_USER + ":" + env.WP_APP_PASSWORD).toString("base64");

let html = fs.readFileSync(path.join(__dirname, "..", ".audit-cache", `live-${cfg.slug}.html`), "utf8");
if (html.includes(`youtube.com/embed/${cfg.videoId}`)) {
  console.log("already embedded, nothing to do");
  process.exit(0);
}
fs.writeFileSync(path.join(__dirname, "..", ".audit-cache", `backup-${cfg.slug}-${new Date().toISOString().slice(0, 10)}.html`), html);

const watch = `https://www.youtube.com/watch?v=${cfg.videoId}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const embed = `<!-- wp:html -->
<figure style="margin:28px 0">
<iframe width="100%" height="360" style="border-radius:14px;border:1px solid rgba(167,139,250,0.18);aspect-ratio:16/9;height:auto" src="https://www.youtube.com/embed/${cfg.videoId}" title="${esc(cfg.title)}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
<figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">${esc(cfg.caption)}</figcaption>
</figure>
<!-- /wp:html -->`;

const ch = cfg.chapters || [];
const schema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: cfg.title,
  description: cfg.description,
  thumbnailUrl: [`https://i.ytimg.com/vi/${cfg.videoId}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${cfg.videoId}/hqdefault.jpg`],
  uploadDate: cfg.uploadDate,
  duration: `PT${Math.floor(cfg.durationSec / 60)}M${cfg.durationSec % 60}S`,
  embedUrl: `https://www.youtube.com/embed/${cfg.videoId}`,
  url: watch,
  publisher: { "@type": "Organization", name: "FOCO", logo: { "@type": "ImageObject", url: "https://tryfoco.com/wp-content/uploads/2026/05/foco-logo-mark.png" } },
  hasPart: ch.map(([name, start], i) => ({ "@type": "Clip", name, startOffset: start, endOffset: i + 1 < ch.length ? ch[i + 1][1] : cfg.durationSec, url: `${watch}&t=${start}s` })),
};
const schemaBlock = `<!-- wp:html --><script type="application/ld+json">${JSON.stringify(schema)}</script><!-- /wp:html -->`;
if (/—/.test(embed + schemaBlock)) throw new Error("em dash in new content");

// Right after the answer box, so readers who prefer watching see it first (Adi, 2026-10-22: "why is the video at
// the bottom?"); posts without an answer box fall back to after Key Takeaways.
const box = html.indexOf('<div class="foco-tldr">') >= 0 ? html.indexOf('<div class="foco-tldr">') : html.indexOf('<div class="foco-key-takeaways">');
const boxEnd = html.indexOf("</div>", box);
if (box < 0) throw new Error("neither an answer box nor a Key Takeaways box found");
html = html.slice(0, boxEnd + 6) + "\n\n" + embed + html.slice(boxEnd + 6);

// Posts no longer carry our own Article block (RankMath's BlogPosting is the article entity, and its
// dateModified moves on every save), so the VideoObject goes before the first ld+json block, or at the end.
const firstLd = html.indexOf('<!-- wp:html --><script type="application/ld+json">');
html = firstLd < 0 ? html + "\n\n" + schemaBlock : html.slice(0, firstLd) + schemaBlock + "\n" + html.slice(firstLd);

for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]); // throws if any block is broken
const out = path.join(__dirname, "..", ".audit-cache", `new-${cfg.slug}.html`);
fs.writeFileSync(out, html);
console.log("built", out, "chars", html.length, "(schema blocks valid)");
if (!LIVE) {
  console.log("dry run, pass --live to push");
  process.exit(0);
}
(async () => {
  const res = await fetch(`https://${host}/wp-json/wp/v2/posts/${cfg.postId}`, { method: "POST", headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" }, body: JSON.stringify({ content: html }) });
  const j = await res.json();
  console.log("push", res.status, j.status, j.link, "modified", j.modified);
})();
