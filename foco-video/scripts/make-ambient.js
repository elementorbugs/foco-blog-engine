// Calm ambient bed for long focus sessions: slow-evolving warm pads, no drums, no melody, soft noise floor.
// Usage: OUT=video/<slug>/ambient.wav node scripts/make-ambient.js <seconds>   -> public/<OUT>
const fs = require("fs");
const path = require("path");

const SR = 44100;
const DUR = Number(process.argv[2] || 120);
const N = Math.floor(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Gentle major-seventh / suspended voicings, one every 12 s, crossfading over 6 s
const CHORDS = [[48, 55, 59, 64], [45, 52, 57, 60], [41, 48, 55, 57], [43, 50, 55, 59], [48, 52, 55, 62], [41, 45, 52, 57]];
const SEG = 12;
const FADE = 6;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

for (let c = 0; c * SEG < DUR + SEG; c++) {
  const chord = CHORDS[c % CHORDS.length];
  const t0 = c * SEG - FADE / 2;
  const len = SEG + FADE;
  const detune = chord.map(() => [0.997 + rnd() * 0.002, 1.001 + rnd() * 0.002]);
  for (let k = 0; k < len * SR; k++) {
    const i = Math.floor(t0 * SR) + k;
    if (i < 0 || i >= N) continue;
    const t = k / SR;
    const env = Math.min(1, t / FADE) * Math.min(1, (len - t) / FADE); // slow swell in and out
    const tt = i / SR;
    const breathe = 0.85 + 0.15 * Math.sin(2 * Math.PI * tt / 23); // very slow movement
    let l = 0, r = 0;
    chord.forEach((m, j) => {
      const fq = midi(m);
      // soft tone: fundamental + a little 2nd harmonic, no bright partials
      l += Math.sin(2 * Math.PI * fq * detune[j][0] * tt) + 0.18 * Math.sin(4 * Math.PI * fq * detune[j][0] * tt);
      r += Math.sin(2 * Math.PI * fq * detune[j][1] * tt) + 0.18 * Math.sin(4 * Math.PI * fq * detune[j][1] * tt);
    });
    L[i] += l * 0.045 * env * breathe;
    R[i] += r * 0.045 * env * breathe;
  }
}

// one-pole low-pass for warmth + a faint brown-noise floor ("room tone")
let pl = 0, pr = 0, b = 0;
const a = 0.08;
for (let i = 0; i < N; i++) {
  b = (b + (rnd() * 2 - 1) * 0.02) * 0.995;
  pl += a * (L[i] - pl);
  pr += a * (R[i] - pr);
  L[i] = pl + b * 0.25;
  R[i] = pr + b * 0.25;
}

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / SR / 3) * Math.min(1, (DUR - i / SR) / 3);
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * g * 2.2) * 30000), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * g * 2.2) * 30000), 46 + i * 4);
}
const out = path.join(__dirname, "..", "public", process.env.OUT || "ambient.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("wrote", out, DUR + "s");
