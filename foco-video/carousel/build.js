// FOCO TikTok carousel builder. One spec file per carousel: carousels/<slug>.json
//
//   node carousel/build.js <slug> photos   fetch 6 Pexels candidates per slide (slide.query)
//                                          -> carousel/work/<slug>/sheet.jpg (row = slide, col = pick 1-6)
//   node carousel/build.js <slug> render   copy each slide's chosen photo (slide.pick, or slide.photo = another
//                                          slide's id), render 1080x1920 PNGs + preview.jpg + caption.txt
//                                          -> out/tiktok-<slug>/
//
// Pexels key: $PEXELS_KEY, else C:/Users/USER/remindher-blog/.pexels-key. (Not stored in the FOCO repo on
// purpose: a .pexels-key there switches on Pexels images in create-post.js.)
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
// bundled ffmpeg, so this also runs in cloud sessions that have no system ffmpeg
const FFMPEG = require("ffmpeg-static");

const ROOT = path.join(__dirname, "..");
const [slug, cmd] = process.argv.slice(2);
if (!slug || !["photos", "render"].includes(cmd)) {
  console.error("usage: node carousel/build.js <slug> photos|render");
  process.exit(1);
}
const specPath = path.join(ROOT, "carousels", `${slug}.json`);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const work = path.join(__dirname, "work", slug);
fs.mkdirSync(work, { recursive: true });

const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args]);

// House rules that are easy to break by accident
function lint() {
  const text = JSON.stringify(spec) + (spec.caption || "");
  const problems = [];
  if (/—/.test(text)) problems.push("em dash (—) found");
  if (/pexels|photos?:/i.test(spec.caption || "")) problems.push("caption contains a photo credit");
  if (/not a calendar/i.test(text)) problems.push("FOCO HAS a built-in calendar");
  const last = spec.slides[spec.slides.length - 1];
  if (!last.layout.startsWith("final")) problems.push("last slide must be final-card or final-phone");
  if (problems.length) {
    console.error("spec problems:\n - " + problems.join("\n - "));
    process.exit(1);
  }
}

async function photos() {
  const key = process.env.PEXELS_KEY || fs.readFileSync("C:/Users/USER/remindher-blog/.pexels-key", "utf8").trim();
  const rows = [];
  for (const s of spec.slides) {
    if (!s.query) continue;
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(s.query)}&orientation=portrait&per_page=6`, { headers: { Authorization: key } });
    const { photos: found } = await res.json();
    for (let i = 0; i < found.length; i++) {
      const img = await fetch(found[i].src.large2x);
      fs.writeFileSync(path.join(work, `${s.id}-${i + 1}.jpg`), Buffer.from(await img.arrayBuffer()));
    }
    // row of thumbnails, padded to 6 columns
    const inputs = found.flatMap((_, i) => ["-i", path.join(work, `${s.id}-${i + 1}.jpg`)]);
    const scale = found.map((_, i) => `[${i}]scale=170:250:force_original_aspect_ratio=increase,crop=170:250,setsar=1[v${i}]`).join(";");
    const stack = found.length > 1 ? `${found.map((_, i) => `[v${i}]`).join("")}hstack=inputs=${found.length},pad=1020:250:0:0:black` : "[v0]pad=1020:250:0:0:black";
    ff([...inputs, "-filter_complex", `${scale};${stack}`, path.join(work, `row-${s.id}.jpg`)]);
    rows.push(path.join(work, `row-${s.id}.jpg`));
    console.log(`${s.id}: ${found.length} candidates ("${s.query}")`);
  }
  ff([...rows.flatMap((r) => ["-i", r]), "-filter_complex", rows.length > 1 ? `vstack=inputs=${rows.length}` : "null", path.join(work, "sheet.jpg")]);
  console.log("contact sheet:", path.join(work, "sheet.jpg"));
}

async function render() {
  lint();
  const pub = path.join(ROOT, "public", "carousel", slug);
  fs.mkdirSync(pub, { recursive: true });
  for (const s of spec.slides) {
    if (s.photo) continue; // reuses another slide's photo
    if (!s.pick) throw new Error(`slide ${s.id} has no "pick"`);
    fs.copyFileSync(path.join(work, `${s.id}-${s.pick}.jpg`), path.join(pub, `${s.id}.jpg`));
  }

  const { bundle } = require("@remotion/bundler");
  const { selectComposition, renderStill } = require("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  const out = path.join(ROOT, "out", `tiktok-${slug}`);
  fs.mkdirSync(out, { recursive: true });
  for (let index = 0; index < spec.slides.length; index++) {
    const inputProps = { spec, index };
    const composition = await selectComposition({ serveUrl, id: "SpecSlide", inputProps });
    await renderStill({ composition, serveUrl, output: path.join(out, `slide-${index + 1}.png`), inputProps });
    console.log(`slide ${index + 1}/${spec.slides.length}`);
  }

  const n = spec.slides.length;
  const cols = 4;
  const layout = spec.slides.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join("|");
  const scale = spec.slides.map((_, i) => `[${i}]scale=270:480[v${i}]`).join(";");
  ff([...spec.slides.flatMap((_, i) => ["-i", path.join(out, `slide-${i + 1}.png`)]), "-filter_complex", `${scale};${spec.slides.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${n}:layout=${layout}:fill=black`, path.join(out, "preview.jpg")]);

  // Same grid with TikTok's overlay zones shaded red: readable text must not sit in red
  const shade = "drawbox=x=0:y=0:w=1080:h=180:color=red@0.35:t=fill,drawbox=x=0:y=1500:w=1080:h=420:color=red@0.35:t=fill,drawbox=x=950:y=850:w=130:h=650:color=red@0.35:t=fill";
  const scaleSafe = spec.slides.map((_, i) => `[${i}]${shade},scale=270:480[v${i}]`).join(";");
  ff([...spec.slides.flatMap((_, i) => ["-i", path.join(out, `slide-${i + 1}.png`)]), "-filter_complex", `${scaleSafe};${spec.slides.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${n}:layout=${layout}:fill=black`, path.join(ROOT, "carousel", "work", slug, "safezones.jpg")]);

  fs.writeFileSync(path.join(out, "caption.txt"), `${spec.caption}\n\n${spec.hashtags.join(" ")}\n`);
  console.log("done:", out);
}

(cmd === "photos" ? photos() : render()).catch((e) => {
  console.error(e);
  process.exit(1);
});
