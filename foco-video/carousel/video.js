// Render a Story carousel spec as an animated video: node carousel/video.js <slug>
// -> out/tiktok-<slug>/video.mp4 (1080x1920, 30fps, sound effects; add music on upload)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
if (!slug) { console.error("usage: node carousel/video.js <slug>"); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "carousels", `${slug}.json`), "utf8"));
const bad = spec.slides.filter((s) => s.layout !== "story").map((s) => s.id);
if (bad.length) { console.error(`video needs "story" slides only (not: ${bad.join(", ")})`); process.exit(1); }
(async () => {
  const pub = path.join(ROOT, "public", "carousel", slug);
  fs.mkdirSync(pub, { recursive: true });
  for (const s of spec.slides) for (const b of s.blocks) if (b.file) fs.copyFileSync(path.join(ROOT, b.file), path.join(pub, path.basename(b.file)));
  const { bundle } = require("@remotion/bundler");
  const { selectComposition, renderMedia } = require("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  const inputProps = { spec };
  const composition = await selectComposition({ serveUrl, id: "StoryVideo", inputProps });
  const out = path.join(ROOT, "out", `tiktok-${slug}`);
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, "video.mp4");
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: file, inputProps, concurrency: 4, onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%`) });
  console.log(`\nvideo: ${file} (${(composition.durationInFrames / 30).toFixed(1)}s)`);
})();
