// FOCO TikTok carousel builder. One spec file per carousel: carousels/<slug>.json
//
//   node carousel/build.js <slug> photos   fetch 6 Pexels candidates per slide (slide.query)
//                                          -> carousel/work/<slug>/sheet.jpg (each slide = 6x2 block, picks 1-12)
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
  const text = JSON.stringify(spec);
  const captions = ["tiktok", "instagram"].map((p) => (spec[p] && spec[p].caption) || "").join("\n");
  const problems = [];
  if (/—/.test(text)) problems.push("em dash (—) found");
  if (/pexels|photos?:/i.test(captions)) problems.push("caption contains a photo credit");
  if (/\bfree\b/i.test(captions)) problems.push('caption says "free" (FOCO AI breakdown is paid)');
  if (!spec.tiktok || !spec.instagram) problems.push("spec needs tiktok + instagram caption blocks (see SKILL.md > Captions)");
  for (const p of ["tiktok", "instagram"]) {
    const tags = (spec[p] && spec[p].hashtags) || [];
    if (tags.length < 3 || tags.length > 5) problems.push(`${p}: use 3-5 hashtags (has ${tags.length})`);
  }
  if (/not a calendar/i.test(text)) problems.push("FOCO HAS a built-in calendar");
  const last = spec.slides[spec.slides.length - 1];
  if (!last.layout.startsWith("final")) problems.push("last slide must be final-card or final-phone");
  if (problems.length) {
    console.error("spec problems:\n - " + problems.join("\n - "));
    process.exit(1);
  }
}

const pexels = async (key, query, page = 1, perPage = 12) => {
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=${perPage}&page=${page}`, { headers: { Authorization: key } });
  return (await res.json()).photos || [];
};

// Same-shoot mode: Pexels has no "same model" search, but photographers upload whole shoots (one model, one home,
// many scenes). Search every person slide deep, then keep the one photographer who covers the most person slides.
async function sameShootPool(key) {
  const personSlides = spec.slides.filter((s) => s.query && s.person);
  const extra = (spec.shootQueries || ["at home", "bedroom", "apartment morning"]).map((x) => `${spec.narrator} ${x}`);
  const byPhotog = new Map();
  const add = (p, slideId) => {
    const e = byPhotog.get(p.photographer_id) || { name: p.photographer, slides: new Set(), photos: new Map() };
    if (slideId) e.slides.add(slideId);
    if (!e.photos.has(p.id)) e.photos.set(p.id, { ...p, slideId });
    byPhotog.set(p.photographer_id, e);
  };
  for (const s of personSlides) for (let page = 1; page <= 3; page++) (await pexels(key, `${spec.narrator} ${s.query}`, page, 80)).forEach((p) => add(p, s.id));
  for (const q of extra) for (let page = 1; page <= 2; page++) (await pexels(key, q, page, 80)).forEach((p) => add(p, null));
  // A big studio shoots many models, so narrow to one shoot: a shoot is uploaded in one batch, so its photo IDs sit
  // close together. Split each photographer's photos at ID gaps > SHOOT_GAP and rank those shoots instead.
  const SHOOT_GAP = spec.shootGap || 3000;
  const shoots = [];
  for (const e of byPhotog.values()) {
    const sorted = [...e.photos.values()].sort((a, b) => a.id - b.id);
    let cur = [];
    for (const p of sorted) {
      if (cur.length && p.id - cur[cur.length - 1].id > SHOOT_GAP) (shoots.push({ name: e.name, photos: cur }), (cur = []));
      cur.push(p);
    }
    if (cur.length) shoots.push({ name: e.name, photos: cur });
  }
  shoots.forEach((sh) => (sh.slides = new Set(sh.photos.map((p) => p.slideId).filter(Boolean))));
  shoots.sort((a, b) => b.slides.size - a.slides.size || b.photos.length - a.photos.length);
  console.log("shoots covering the most person slides:");
  shoots.slice(0, 6).forEach((sh, i) => console.log(`  #${i} ${sh.name} ids ${sh.photos[0].id}-${sh.photos[sh.photos.length - 1].id}: ${sh.slides.size}/${personSlides.length} slides, ${sh.photos.length} photos`));
  const chosen = shoots[spec.shootIndex || 0];
  console.log(`using shoot #${spec.shootIndex || 0} (${chosen.name}); set "shootIndex" in the spec to pick another`);
  return chosen.photos;
}

async function photos() {
  const key = process.env.PEXELS_KEY || fs.readFileSync("C:/Users/USER/remindher-blog/.pexels-key", "utf8").trim();
  const shoot = spec.sameShoot && spec.narrator ? await sameShootPool(key) : null;
  const rows = [];
  for (const s of spec.slides) {
    if (!s.query) continue;
    // One narrator per carousel: slides that show a person (or their hands/body) search for the same look
    const q = s.person && spec.narrator ? `${spec.narrator} ${s.query}` : s.query;
    // In same-shoot mode person slides pick only from the chosen photographer: their hits for this slide first,
    // then the rest of the shoot (any scene of the same model can work)
    const found = s.person && shoot
      ? [...shoot.filter((p) => p.slideId === s.id), ...shoot.filter((p) => p.slideId !== s.id)].slice(0, 12)
      : await pexels(key, q);
    for (let i = 0; i < found.length; i++) {
      const img = await fetch(found[i].src.large2x);
      fs.writeFileSync(path.join(work, `${s.id}-${i + 1}.jpg`), Buffer.from(await img.arrayBuffer()));
    }
    // 12 candidates per slide as a 6x2 grid (picks numbered left-to-right, top row first), padded when fewer
    const inputs = found.flatMap((_, i) => ["-i", path.join(work, `${s.id}-${i + 1}.jpg`)]);
    const scale = found.map((_, i) => `[${i}]scale=170:250:force_original_aspect_ratio=increase,crop=170:250,setsar=1[v${i}]`).join(";");
    const layout = found.map((_, i) => `${(i % 6) * 170}_${Math.floor(i / 6) * 250}`).join("|");
    const grid = found.length > 1 ? `${found.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${found.length}:layout=${layout}:fill=black,pad=1020:500:0:0:black` : "[v0]pad=1020:500:0:0:black";
    ff([...inputs, "-filter_complex", `${scale};${grid}`, path.join(work, `row-${s.id}.jpg`)]);
    rows.push(path.join(work, `row-${s.id}.jpg`));
    console.log(`${s.id}: ${found.length} candidates ("${q}")`);
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

  // One ready-to-paste caption per platform (TikTok: search keywords up front; Instagram: hook in first 125 chars + alt text)
  const block = (p) => `${spec[p].caption.trim()}\n\n${spec[p].hashtags.join(" ")}\n`;
  fs.writeFileSync(path.join(out, "caption-tiktok.txt"), block("tiktok"));
  const alt = spec.instagram.altText ? `\nALT TEXT (Instagram > Advanced settings > Accessibility):\n${spec.instagram.altText}\n` : "";
  fs.writeFileSync(path.join(out, "caption-instagram.txt"), block("instagram") + alt);
  fs.rmSync(path.join(out, "caption.txt"), { force: true });
  console.log("done:", out);
}

(cmd === "photos" ? photos() : render()).catch((e) => {
  console.error(e);
  process.exit(1);
});
