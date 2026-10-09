// B-roll for long videos from Pexels Videos (free, same key as photos).
//   node videos/broll.js <slug> candidates   -> videos/<slug>/broll-sheet.jpg (row = broll scene, col = pick 1-8)
//   node videos/broll.js <slug> fetch        -> downloads each scene's "pick" to public/video/<slug>/broll-<sceneId>.mp4
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const FFMPEG = require("ffmpeg-static");

const [slug, cmd] = process.argv.slice(2);
const dir = path.join(__dirname, slug);
const scriptPath = path.join(dir, "script.json");
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
const pub = path.join(__dirname, "..", "public", "video", slug);
const work = path.join(dir, "work");
fs.mkdirSync(pub, { recursive: true });
fs.mkdirSync(work, { recursive: true });
const key = process.env.PEXELS_KEY || fs.readFileSync("C:/Users/USER/remindher-blog/.pexels-key", "utf8").trim();
const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args]);
const scenes = script.scenes.filter((s) => s.visual && s.visual.type === "broll");

async function candidates() {
  const rows = [];
  for (const s of scenes) {
    const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(s.visual.query)}&orientation=landscape&per_page=8&size=medium`, { headers: { Authorization: key } });
    const { videos } = await res.json();
    const ids = [];
    for (let i = 0; i < videos.length; i++) {
      const img = await fetch(videos[i].image);
      fs.writeFileSync(path.join(work, `${s.id}-${i + 1}.jpg`), Buffer.from(await img.arrayBuffer()));
      ids.push(videos[i].id);
    }
    s.visual.candidates = ids; // pick N -> candidates[N-1]
    const inputs = videos.flatMap((_, i) => ["-i", path.join(work, `${s.id}-${i + 1}.jpg`)]);
    const scale = videos.map((_, i) => `[${i}]scale=240:135:force_original_aspect_ratio=increase,crop=240:135,setsar=1[v${i}]`).join(";");
    ff([...inputs, "-filter_complex", `${scale};${videos.map((_, i) => `[v${i}]`).join("")}hstack=inputs=${videos.length},pad=1920:135:0:0:black`, path.join(work, `row-${s.id}.jpg`)]);
    rows.push(path.join(work, `row-${s.id}.jpg`));
    console.log(`${s.id}: ${videos.length} clips ("${s.visual.query}")`);
  }
  ff([...rows.flatMap((r) => ["-i", r]), "-filter_complex", rows.length > 1 ? `vstack=inputs=${rows.length}` : "null", path.join(dir, "broll-sheet.jpg")]);
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log("sheet:", path.join(dir, "broll-sheet.jpg"));
}

async function fetchPicks() {
  for (const s of scenes) {
    const id = s.visual.candidates[(s.visual.pick || 1) - 1];
    const res = await fetch(`https://api.pexels.com/videos/videos/${id}`, { headers: { Authorization: key } });
    const v = await res.json();
    // 1080p (or closest) keeps quality without huge files
    const file = v.video_files.filter((f) => f.file_type === "video/mp4" && f.width >= 1280).sort((a, b) => Math.abs(a.width - 1920) - Math.abs(b.width - 1920))[0];
    const raw = path.join(work, `${s.id}-raw.mp4`);
    fs.writeFileSync(raw, Buffer.from(await (await fetch(file.link)).arrayBuffer()));
    // normalize: 1920x1080, 30fps, H.264 (Chrome decodes it reliably)
    // silent AAC track: Remotion's compositor ffprobe crashes on video-only MP4s on Windows
    ff(["-i", raw, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-shortest", "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30", "-c:v", "libx264", "-crf", "23", "-preset", "veryfast", "-c:a", "aac", path.join(pub, `broll-${s.id}.mp4`)]);
    s.visual.clipSec = v.duration; // LongVideo loops clips shorter than the scene
    console.log(`${s.id}: pexels video ${id} (${file.width}x${file.height}, ${v.duration}s)`);
  }
}

(cmd === "fetch" ? fetchPicks().then(() => fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2))) : candidates()).catch((e) => {
  console.error(e);
  process.exit(1);
});
