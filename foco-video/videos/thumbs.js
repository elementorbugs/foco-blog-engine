// YouTube thumbnails A/B for a long video: node videos/thumbs.js <slug>
// Text comes from videos/<slug>/script.json "thumb" ({ aLines, aPill, bLines, mascot }); needs public/video/<slug>/thumb-bg.jpg.
const path = require("path");
const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
const script = require(path.join(__dirname, slug, "script.json"));

(async () => {
  const { bundle } = require("@remotion/bundler");
  const { selectComposition, renderStill } = require("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  for (const variant of ["A", "B"]) {
    const inputProps = { slug, variant, ...(script.thumb || {}) };
    const composition = await selectComposition({ serveUrl, id: `VideoThumb${variant}`, inputProps });
    const output = path.join(ROOT, "out", `video-${slug}-thumb-${variant}.png`);
    await renderStill({ composition, serveUrl, inputProps, output });
    console.log(output);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
