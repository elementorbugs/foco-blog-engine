// Render a Story carousel spec as an animated video: node carousel/video.js <slug> [--music <key>]
// -> out/tiktok-<slug>/video.mp4 (1080x1920, 30fps, story transitions, sound effects, a soft music bed, -14 LUFS)
//
// Music (Adi, 2026-11-18: "the same music every time gets old fast"): every video gets a DIFFERENT track from the
// CC BY 4.0 library in factory/music.json (Kevin MacLeod), never one of the last 5 used (carousels/music-used.json).
// The pick is saved into the spec so re-renders keep it, and the CREDIT LINE is required by the license: it is written
// to out/.../music-credit.txt and send.js --video adds it to both captions.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
if (!slug) { console.error("usage: node carousel/video.js <slug> [--music <key>]"); process.exit(1); }
const specFile = path.join(ROOT, "carousels", `${slug}.json`);
const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
const bad = spec.slides.filter((s) => s.layout !== "story").map((s) => s.id);
if (bad.length) { console.error(`video needs "story" slides only (not: ${bad.join(", ")})`); process.exit(1); }

// ---- music pick ----
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "factory", "music.json"), "utf8"));
const MOODS = ["lofi", "warm", "calm", "piano", "upbeat"]; // diary stories: no "quirky"/comedy tracks
const usedFile = path.join(ROOT, "carousels", "music-used.json");
const used = fs.existsSync(usedFile) ? JSON.parse(fs.readFileSync(usedFile, "utf8")) : [];
const forced = process.argv.includes("--music") ? process.argv[process.argv.indexOf("--music") + 1] : null;
let track = CATALOG.find((m) => m.key === (forced || spec.musicKey));
if (!track) {
  const recent = used.filter((u) => u.slug !== slug).slice(-5).map((u) => u.key);
  const pool = CATALOG.filter((m) => MOODS.includes(m.mood) && !recent.includes(m.key));
  let h = 0; for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  track = pool[h % pool.length];
}
spec.music = track.file;
spec.musicKey = track.key;
spec.musicCredit = track.credit;
spec.musicVolume = spec.musicVolume ?? 0.24;
fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));
fs.writeFileSync(usedFile, JSON.stringify([...used.filter((u) => u.slug !== slug), { slug, key: track.key, date: new Date().toISOString().slice(0, 10) }], null, 2));
console.log(`music: ${track.title} (${track.mood})`);

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
  // loudness to the social-video standard (-14 LUFS, like TikTok/Reels) without changing the music/SFX balance
  const FFMPEG = require("ffmpeg-static"), tmp = file.replace(".mp4", "-raw.mp4");
  fs.renameSync(file, tmp);
  require("child_process").execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", tmp, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", file]);
  fs.unlinkSync(tmp);
  fs.writeFileSync(path.join(out, "music-credit.txt"), `🎵 Music: ${track.credit}`);
  console.log(`\nvideo: ${file} (${(composition.durationInFrames / 30).toFixed(1)}s)`);
})();
