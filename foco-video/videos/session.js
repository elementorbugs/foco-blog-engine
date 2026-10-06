// Body-double "work with me" session video, composed entirely in ffmpeg (fast for 1h+, unaffected by the
// Windows block on Remotion's ffmpeg): looping b-roll, big countdown timer, session dots, gentle phrases,
// break cards with the mascot, FOCO's voice at each phase, rain + soft music.
//
//   node videos/session.js <slug> [--preview]     (--preview: 3-minute version to check the look)
// Needs: public/video/<slug>/broll-a.mp4, broll-b.mp4 (videos/broll.js), vo/{intro,work,break,outro}.wav (tts/lines.mjs)
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
const WORK = PREVIEW ? 60 : 25 * 60;
const BREAK = PREVIEW ? 30 : 5 * 60;
const ROUNDS = 2;
const INTRO = Math.ceil(wavSec(`${pub}/vo/intro.wav`)) + 3;
const OUTRO = Math.ceil(wavSec(`${pub}/vo/outro.wav`)) + 6;
const phases = [{ kind: "intro", dur: INTRO }];
for (let r = 1; r <= ROUNDS; r++) {
  phases.push({ kind: "work", dur: WORK, round: r });
  if (r < ROUNDS) phases.push({ kind: "break", dur: BREAK, round: r });
}
phases.push({ kind: "outro", dur: OUTRO });
let t = 0;
for (const p of phases) ((p.start = t), (t += p.dur), (p.end = t));
const TOTAL = t;

const PHRASES = [
  "One step is enough.", "Still here? That counts.", "Stuck? Start again with one tiny step.", "Done is better than perfect.",
  "You don't have to feel ready to start.", "Just the next small thing.", "Messy progress is still progress.", "Breathe. Unclench your jaw. Keep going.",
];

// ── 1. background: two clips from one shoot, crossfaded, warm grade, looped to full length ──
const loop = path.join(work, "bg-loop.mp4");
ff(["-i", `${pub}/broll-a.mp4`, "-i", `${pub}/broll-b.mp4`, "-filter_complex",
  "[0:v]trim=0:15,setpts=PTS-STARTPTS[a];[1:v]trim=0:16,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=1:offset=14,eq=brightness=-0.06:saturation=0.9[v]",
  "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", path.join(work, "bg-loop.mp4")]);

// ── 2. overlay text files (drawtext reads them; avoids escaping) ──
const txt = (name, s) => (fs.writeFileSync(path.join(work, `${name}.txt`), s), `videos/${slug}/work/${name}.txt`);
const SORA = "public/fonts/Poppins-ExtraBold.ttf"; // Sora is a variable font and drawtext renders its thin default
const POP = "public/fonts/Poppins-Bold.ttf";
const f = [];
const shadow = "shadowcolor=black@0.55:shadowx=0:shadowy=4";
const on = (a, b) => `enable='between(t,${a},${b})'`;

for (const p of phases) {
  // dark card layer first, so the break timer drawn after it stays bright
  if (p.kind !== "work") f.push(`drawbox=x=0:y=0:w=iw:h=ih:color=0x0A0410@0.55:t=fill:${on(p.start, p.end)}`);
  if (p.kind === "work" || p.kind === "break") {
    const label = p.kind === "work" ? `FOCUS  ${p.round} of ${ROUNDS}` : "BREAK";
    f.push(`drawtext=fontfile=${POP}:textfile=${txt(`label-${p.kind}-${p.round}`, label)}:fontsize=34:fontcolor=white:box=1:boxcolor=${p.kind === "work" ? "0x7C3AED" : "0xFB923C"}@0.85:boxborderw=14:x=110:y=80:${on(p.start, p.end)}`);
    // countdown mm:ss (ceil so it shows 25:00 at the start and 00:01 at the end)
    const rem = `(${p.end}-t)`;
    f.push(`drawtext=fontfile=${SORA}:text='%{eif\\:floor(ceil(${rem})/60)\\:d\\:2}\\:%{eif\\:mod(ceil(${rem}),60)\\:d\\:2}':fontsize=170:fontcolor=white:x=104:y=150:${shadow}:${on(p.start, p.end - 0.01)}`);
    // session progress pills: filled = done or current
    for (let k = 1; k <= ROUNDS; k++) {
      const filled = k < p.round || (k === p.round && p.kind === "work") || (p.kind === "break" && k <= p.round);
      f.push(`drawbox=x=${112 + (k - 1) * 70}:y=375:w=56:h=14:color=${filled ? "0xA78BFA" : "white@0.25"}:t=fill:${on(p.start, p.end)}`);
    }
  }
  if (p.kind === "work") {
    // a gentle phrase every few minutes, faded in and out over 10 s windows
    const every = PREVIEW ? 25 : 240;
    for (let s = p.start + (PREVIEW ? 12 : 120), k = 0; s + 10 < p.end - 5; s += every, k++) {
      const ph = PHRASES[(p.round * 3 + k) % PHRASES.length];
      const a = `if(lt(t,${s}+1),t-${s},if(gt(t,${s}+9),${s}+10-t,1))`;
      f.push(`drawtext=fontfile=${POP}:textfile=${txt(`ph-${p.round}-${k}`, ph)}:fontsize=58:fontcolor=white:alpha='${a}':box=1:boxcolor=0x7C3AED@0.55:boxborderw=26:x=(w-text_w)/2:y=h-250:${shadow}:${on(s, s + 10)}`);
    }
  }
  if (p.kind === "break" || p.kind === "intro" || p.kind === "outro") {
    const head = { intro: "Let's start with ONE step", break: "Water break. Stretch. Breathe.", outro: "We did it. It counts." }[p.kind];
    const sub = { intro: "Write your first tiny step down", break: "Back in a few minutes", outro: "See you next session" }[p.kind];
    f.push(`drawtext=fontfile=${SORA}:textfile=${txt(`head-${p.kind}`, head)}:fontsize=86:fontcolor=white:x=(w-text_w)/2:y=h*0.62:${shadow}:${on(p.start, p.end)}`);
    f.push(`drawtext=fontfile=${POP}:textfile=${txt(`sub-${p.kind}`, sub)}:fontsize=44:fontcolor=0xD6D0E4:x=(w-text_w)/2:y=h*0.62+120:${on(p.start, p.end)}`);
  }
}
// FOCO corner tag, always on
f.push(`drawtext=fontfile=${POP}:textfile=${txt("tag", "FOCO  ·  body double with me  ·  link in bio")}:fontsize=30:fontcolor=white@0.85:x=w-text_w-60:y=h-70:${shadow}`);

// mascot on intro / break / outro cards
const mascotFor = { intro: "foco_state_1_presence.png", break: "foco_state_5_completion.png", outro: "foco_state_2_alignment.png" };
const cards = phases.filter((p) => mascotFor[p.kind]);

// ── 3. audio: music + synthetic rain + FOCO voice at each phase + chime on phase change ──
fs.mkdirSync(path.join(ROOT, pub), { recursive: true });
execFileSync("node", [path.join(ROOT, "scripts", "make-music.js"), String(Math.min(TOTAL, 600))], { cwd: ROOT, env: { ...process.env, BPM: "70", DROP: "100000", OUT: `video/${slug}/music.wav` }, stdio: "ignore" });

const inputs = ["-stream_loop", "-1", "-i", path.join(work, "bg-loop.mp4")];
cards.forEach((p) => inputs.push("-i", `public/mascots/${mascotFor[p.kind]}`));
const nIn = () => inputs.filter((x) => x === "-i").length;
inputs.push("-stream_loop", "-1", "-i", `${pub}/music.wav`);
const musicIdx = nIn() - 1;
const voiceIdx = [];
for (const p of phases) {
  const line = p.kind === "work" && p.round > 1 ? "work" : p.kind === "work" ? null : p.kind;
  if (!line) continue;
  inputs.push("-i", `${pub}/vo/${line}.wav`);
  voiceIdx.push({ idx: nIn() - 1, at: p.start + 1 });
}
const chimes = phases.slice(1).map((p) => p.start);
chimes.forEach(() => inputs.push("-i", "public/sfx/ding.wav"));
const chimeStart = nIn() - chimes.length;

const g = [];
// text/boxes first, then the mascot on top so the dark card layer doesn't dim it
g.push(`[0:v]${f.join(",")},trim=0:${TOTAL},setpts=PTS-STARTPTS[vt]`);
let v = "[vt]";
cards.forEach((p, i) => {
  g.push(`[${i + 1}:v]scale=-1:300[m${i}]`);
  g.push(`${v}[m${i}]overlay=x=(W-w)/2:y=H*0.62-330:enable='between(t,${p.start},${p.end})'${i === cards.length - 1 ? "[vout]" : `[vm${i}]`}`);
  v = `[vm${i}]`;
});
g.push(`[${musicIdx}:a]volume=0.10,atrim=0:${TOTAL}[mus]`);
g.push(`anoisesrc=color=brown:amplitude=0.6:duration=${TOTAL},lowpass=f=900,volume=0.35[rain1]`);
g.push(`anoisesrc=color=pink:amplitude=0.2:duration=${TOTAL},highpass=f=2500,lowpass=f=7000,volume=0.10[rain2]`);
const mix = ["[mus]", "[rain1]", "[rain2]"];
voiceIdx.forEach(({ idx, at }, i) => {
  const ms = Math.round(at * 1000);
  g.push(`[${idx}:a]adelay=${ms}|${ms},volume=1.4[vo${i}]`);
  mix.push(`[vo${i}]`);
});
chimes.forEach((at, i) => {
  const ms = Math.round(at * 1000);
  g.push(`[${chimeStart + i}:a]adelay=${ms}|${ms},volume=0.35[ch${i}]`);
  mix.push(`[ch${i}]`);
});
g.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0:duration=longest,atrim=0:${TOTAL},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);

const graph = path.join(work, "graph.txt");
fs.writeFileSync(graph, g.join(";\n"));
const out = path.join(ROOT, "out", `session-${slug}${PREVIEW ? "-preview" : ""}.mp4`);
console.log(`rendering ${Math.round(TOTAL / 60)} min (${phases.map((p) => `${p.kind}${p.round || ""}:${p.dur}s`).join(" ")})`);
ff([...inputs, "-filter_complex_script", graph, "-map", "[vout]", "-map", "[aout]", "-t", String(TOTAL), "-c:v", "libx264", "-crf", "22", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
console.log("done:", out);
