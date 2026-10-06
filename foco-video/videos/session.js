// Body-double "work with me" session video, composed entirely in ffmpeg (fast for 1h+, unaffected by the
// Windows block on Remotion's ffmpeg). Format agreed with Adi (2026-10-06): ONE 60-minute focus timer; after
// 30 minutes the timer pauses for a real 5-minute break (screen says so, break countdown), then continues.
// Soft music only. FOCO speaks rarely: intro, break start, back from break, two short "still here" cheers, end.
//
//   node videos/session.js <slug> [--preview]     (--preview: same structure, compressed to ~4 minutes)
// Needs: public/video/<slug>/broll-a.mp4, broll-b.mp4 (videos/broll.js)
//        vo/{intro,break,back,cheer,outro}.wav (tts/lines.mjs from videos/<slug>/voice.json)
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const FFMPEG = require("ffmpeg-static");

const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
const PREVIEW = process.argv.includes("--preview");
const pub = `public/video/${slug}`; // ffmpeg runs with cwd = foco-video, so filter paths stay colon-free
const work = path.join(__dirname, slug, "work");
fs.mkdirSync(work, { recursive: true });
const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });
const wavSec = (f) => { const b = fs.readFileSync(path.join(ROOT, f)); return b.readUInt32LE(40) / b.readUInt32LE(28); };

// ── timeline ──────────────────────────────────────────────────────────────────
const FOCUS = PREVIEW ? 120 : 60 * 60; // total focus time on the main timer
const HALF = FOCUS / 2;
const BREAK = PREVIEW ? 30 : 5 * 60;
const INTRO = Math.ceil(wavSec(`${pub}/vo/intro.wav`)) + 3;
const OUTRO = Math.ceil(wavSec(`${pub}/vo/outro.wav`)) + 5;
const phases = [
  { kind: "intro", dur: INTRO },
  { kind: "work", dur: HALF, focusBefore: 0 },
  { kind: "break", dur: BREAK },
  { kind: "work", dur: HALF, focusBefore: HALF },
  { kind: "outro", dur: OUTRO },
];
let t = 0;
for (const p of phases) ((p.start = t), (t += p.dur), (p.end = t));
const TOTAL = t;
const [intro, work1, brk, work2, outro] = phases;

// voice cues: when FOCO speaks (sparingly)
const cues = [
  { line: "intro", at: intro.start + 1 },
  { line: "cheer", at: work1.start + HALF / 2 }, // 15 min in
  { line: "break", at: brk.start + 0.5 },
  { line: "back", at: work2.start + 0.5 },
  { line: "cheer", at: work2.start + HALF / 2 }, // 45 min in
  { line: "outro", at: outro.start + 1 },
];

// ── 1. background: two clips from one shoot, crossfaded, warm grade, looped to full length ──
ff(["-i", `${pub}/broll-a.mp4`, "-i", `${pub}/broll-b.mp4`, "-filter_complex",
  "[0:v]trim=0:15,setpts=PTS-STARTPTS[a];[1:v]trim=0:16,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=1:offset=14,eq=brightness=-0.06:saturation=0.9[v]",
  "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", path.join(work, "bg-loop.mp4")]);

// ── 2. overlays (drawtext reads text files; avoids escaping) ──
const txt = (name, s) => (fs.writeFileSync(path.join(work, `${name}.txt`), s), `videos/${slug}/work/${name}.txt`);
const BOLD = "public/fonts/Poppins-ExtraBold.ttf"; // Sora is a variable font; drawtext renders its thin default
const POP = "public/fonts/Poppins-Bold.ttf";
const f = [];
const shadow = "shadowcolor=black@0.55:shadowx=0:shadowy=4";
const on = (a, b) => `enable='between(t,${a},${b})'`;
const mmss = (expr) => `%{eif\\:floor(${expr}/60)\\:d\\:2}\\:%{eif\\:mod(${expr},60)\\:d\\:2}`;
const label = (name, text, color, a, b) => f.push(`drawtext=fontfile=${POP}:textfile=${txt(name, text)}:fontsize=34:fontcolor=white:box=1:boxcolor=${color}@0.85:boxborderw=14:x=110:y=80:${on(a, b)}`);
const card = (p, name, head, sub) => {
  f.push(`drawbox=x=0:y=0:w=iw:h=ih:color=0x0A0410@0.55:t=fill:${on(p.start, p.end)}`);
  f.push(`drawtext=fontfile=${BOLD}:textfile=${txt(`head-${name}`, head)}:fontsize=86:fontcolor=white:x=(w-text_w)/2:y=h*0.62:${shadow}:${on(p.start, p.end)}`);
  if (sub) f.push(`drawtext=fontfile=${POP}:textfile=${txt(`sub-${name}`, sub)}:fontsize=44:fontcolor=0xD6D0E4:x=(w-text_w)/2:y=h*0.62+120:${on(p.start, p.end)}`);
};
const pills = (doneHalves, a, b) => [0, 1].forEach((k) => f.push(`drawbox=x=${112 + k * 70}:y=375:w=56:h=14:color=${k < doneHalves ? "0xA78BFA" : "white@0.25"}:t=fill:${on(a, b)}`));

card(intro, "intro", "60 minutes. One step at a time.", "Write down your first tiny step");
for (const p of [work1, work2]) {
  label(`label-${p.start}`, "FOCUS", "0x7C3AED", p.start, p.end);
  // one 60:00 timer across both halves: remaining = FOCUS - focus done before - time into this half
  const rem = `ceil(${FOCUS - p.focusBefore}-(t-${p.start}))`;
  f.push(`drawtext=fontfile=${BOLD}:text='${mmss(rem)}':fontsize=170:fontcolor=white:x=104:y=150:${shadow}:${on(p.start, p.end - 0.01)}`);
  pills(p === work1 ? 1 : 2, p.start, p.end);
}
// break: main timer frozen at 30:00 (dimmed), "timer paused", break countdown in the middle
card(brk, "break", "Break time. Timer paused.", "Water. Stretch. Look away from the screen.");
label("label-break", "BREAK", "0xFB923C", brk.start, brk.end);
f.push(`drawtext=fontfile=${BOLD}:textfile=${txt("frozen", mmss0(FOCUS - HALF))}:fontsize=170:fontcolor=white@0.35:x=104:y=150:${on(brk.start, brk.end)}`);
pills(1, brk.start, brk.end);
f.push(`drawtext=fontfile=${BOLD}:text='back in ${mmss(`ceil(${brk.end}-t)`)}':fontsize=64:fontcolor=0xFB923C:x=(w-text_w)/2:y=h*0.62-120:${shadow}:${on(brk.start, brk.end - 0.01)}`);
card(outro, "outro", "That's a full hour. You did it.", "See you next session");
// FOCO corner tag, always on
f.push(`drawtext=fontfile=${POP}:textfile=${txt("tag", "FOCO  ·  body double with me  ·  link in bio")}:fontsize=30:fontcolor=white@0.85:x=w-text_w-60:y=h-70:${shadow}`);

function mmss0(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

// mascot on the intro / break / outro cards (above the dark layer)
const mascots = [
  [intro, "foco_state_1_presence.png"],
  [brk, "foco_state_5_completion.png"],
  [outro, "foco_state_2_alignment.png"],
];

// ── 3. audio: soft music + FOCO's few lines + a soft chime at the break and when focus ends ──
execFileSync("node", [path.join(ROOT, "scripts", "make-music.js"), String(Math.min(TOTAL, 600))], { cwd: ROOT, env: { ...process.env, BPM: "70", DROP: "100000", OUT: `video/${slug}/music.wav` }, stdio: "ignore" });
const inputs = ["-stream_loop", "-1", "-i", path.join(work, "bg-loop.mp4")];
mascots.forEach(([, png]) => inputs.push("-i", `public/mascots/${png}`));
const nIn = () => inputs.filter((x) => x === "-i").length;
inputs.push("-stream_loop", "-1", "-i", `${pub}/music.wav`);
const musicIdx = nIn() - 1;
cues.forEach((c) => (inputs.push("-i", `${pub}/vo/${c.line}.wav`), (c.idx = nIn() - 1)));
const chimes = [brk.start, work2.start, outro.start];
chimes.forEach(() => inputs.push("-i", "public/sfx/ding.wav"));
const chimeStart = nIn() - chimes.length;

const g = [];
g.push(`[0:v]${f.join(",")},trim=0:${TOTAL},setpts=PTS-STARTPTS[vt]`);
let v = "[vt]";
mascots.forEach(([p], i) => {
  g.push(`[${i + 1}:v]scale=-1:300[m${i}]`);
  const outLabel = i === mascots.length - 1 ? "[vout]" : `[vm${i}]`;
  // break card has the "back in" countdown above the headline, so the mascot sits higher there
  const y = p === brk ? "H*0.62-470" : "H*0.62-330";
  g.push(`${v}[m${i}]overlay=x=(W-w)/2:y=${y}:enable='between(t,${p.start},${p.end})'${outLabel}`);
  v = `[vm${i}]`;
});
g.push(`[${musicIdx}:a]volume=0.40,atrim=0:${TOTAL},afade=t=in:d=3,afade=t=out:st=${TOTAL - 5}:d=5[mus]`);
const mix = ["[mus]"];
cues.forEach((c, i) => {
  const ms = Math.round(c.at * 1000);
  g.push(`[${c.idx}:a]adelay=${ms}|${ms},volume=1.4[vo${i}]`);
  mix.push(`[vo${i}]`);
});
chimes.forEach((at, i) => {
  const ms = Math.round(at * 1000);
  g.push(`[${chimeStart + i}:a]adelay=${ms}|${ms},volume=0.20[ch${i}]`);
  mix.push(`[ch${i}]`);
});
g.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0:duration=longest,atrim=0:${TOTAL},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);

const graph = path.join(work, "graph.txt");
fs.writeFileSync(graph, g.join(";\n"));
const out = path.join(ROOT, "out", `session-${slug}${PREVIEW ? "-preview" : ""}.mp4`);
console.log(`rendering ${Math.round(TOTAL / 60)} min (${phases.map((p) => `${p.kind}:${p.dur}s`).join(" ")})`);
ff([...inputs, "-filter_complex_script", graph, "-map", "[vout]", "-map", "[aout]", "-t", String(TOTAL), "-c:v", "libx264", "-crf", "22", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
console.log("done:", out);
