// Render a long video: node videos/render.js <slug> [--still=frame,frame,...] [--music]
//   --music   (re)generate an original background track matching the length -> public/video/<slug>/music.wav
//   --still   only render preview stills (half size) to videos/<slug>/work/still-<frame>.png
// Output: out/video-<slug>.mp4, loudness-normalized for YouTube (-14 LUFS).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const FFMPEG = require("ffmpeg-static");

const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
const stillArg = process.argv.find((a) => a.startsWith("--still="));
const dir = path.join(__dirname, slug);
const script = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
const vo = JSON.parse(fs.readFileSync(path.join(dir, "vo.json"), "utf8"));

(async () => {
  const seconds = (0.4 + vo.reduce((s, v) => s + v.duration + 0.5, 0)) + 3;
  if (process.argv.includes("--music") || !fs.existsSync(path.join(ROOT, "public", "video", slug, "music.wav"))) {
    execFileSync("node", [path.join(ROOT, "scripts", "make-music.js"), String(Math.ceil(seconds))], {
      env: { ...process.env, BPM: "84", DROP: String(Math.round(seconds * 0.7)), OUT: `video/${slug}/music.wav` },
      stdio: "inherit",
    });
  }
  script.music = `video/${slug}/music.wav`;
  const inputProps = { script, vo };

  const { bundle } = require("@remotion/bundler");
  const { selectComposition, renderFrames, renderStill } = require("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  const composition = await selectComposition({ serveUrl, id: "LongVideo", inputProps });

  if (stillArg) {
    for (const f of stillArg.split("=")[1].split(",").map(Number)) {
      await renderStill({ composition, serveUrl, frame: f, scale: 0.5, inputProps, output: path.join(dir, "work", `still-${f}.png`) });
      console.log("still", f);
    }
    return;
  }

  // Windows Smart App Control blocks Remotion's bundled ffmpeg (unsigned DLLs), so renderMedia can't stitch or mix.
  // Render JPEG frames instead, then encode + mix audio with ffmpeg-static, which Windows allows.
  const frames = path.join(dir, "work", "frames");
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  await renderFrames({ composition, serveUrl, inputProps, outputDir: frames, imageFormat: "jpeg", jpegQuality: 92, concurrency: 6, onStart: () => {}, onFrameUpdate: (n) => process.stdout.write(`\rframes ${n}/${composition.durationInFrames}`) });
  const first = fs.readdirSync(frames).filter((f) => f.endsWith(".jpeg")).sort()[0];
  const m = first.match(/^(.*?)(\d+)\.jpeg$/);
  const pattern = path.join(frames, `${m[1]}%0${m[2].length}d.jpeg`);

  // Audio timeline mirrors LongVideo: scenes start at 0.4s, each lasts its VO + 0.5s gap; whoosh on every cut
  const inputs = ["-framerate", "30", "-start_number", String(parseInt(m[2], 10)), "-i", pattern, "-i", path.join(ROOT, "public", script.music)];
  const filters = ["[1:a]volume=0.12[m]"];
  const labels = ["[m]"];
  let t = 0.4;
  vo.forEach((v, i) => {
    const ms = Math.round(t * 1000);
    inputs.push("-i", path.join(ROOT, "public", "video", slug, "vo", `${v.id}.wav`));
    filters.push(`[${inputs.filter((x) => x === "-i").length - 1}:a]adelay=${ms}|${ms}[v${i}]`);
    labels.push(`[v${i}]`);
    if (i > 0) {
      inputs.push("-i", path.join(ROOT, "public", "sfx", "whoosh.wav"));
      filters.push(`[${inputs.filter((x) => x === "-i").length - 1}:a]adelay=${ms}|${ms},volume=0.3[w${i}]`);
      labels.push(`[w${i}]`);
    }
    t += v.duration + 0.5;
  });
  const dur = (composition.durationInFrames / 30).toFixed(3);
  filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${dur},loudnorm=I=-14:TP=-1.5:LRA=11[a]`);
  const out = path.join(ROOT, "out", `video-${slug}.mp4`);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-t", dur, "-movflags", "+faststart", out]);
  console.log("\ndone:", out);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
