// Sparse, soft lo-fi piano: a few slow notes over long reverb, lots of space, no drums, no fixed melody loop.
// Usage: OUT=video/<slug>/piano.wav node scripts/make-piano.js <seconds>
const fs = require("fs");
const path = require("path");

const SR = 44100;
const DUR = Number(process.argv[2] || 60);
const N = Math.floor(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Pentatonic-ish palette over slow chords: nothing can clash, so random choices stay calm
const CHORDS = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76];
const note = (t, m, vel, pan) => {
  const f = midi(m);
  const s0 = Math.floor(t * SR);
  const len = Math.floor(SR * 5);
  for (let k = 0; k < len && s0 + k < N; k++) {
    const tt = k / SR;
    const env = Math.min(1, tt / 0.01) * Math.exp(-tt * 0.9);
    const v = (Math.sin(2 * Math.PI * f * tt) + 0.35 * Math.sin(4 * Math.PI * f * tt) * Math.exp(-tt * 2) + 0.12 * Math.sin(6 * Math.PI * f * tt) * Math.exp(-tt * 3)) * env * vel;
    L[s0 + k] += v * (1 - pan);
    R[s0 + k] += v * pan;
  }
};
for (let bar = 0, t = 0.5; t < DUR - 4; bar++, t += 8) {
  const ch = CHORDS[bar % CHORDS.length];
  ch.forEach((m, i) => note(t + i * 0.06, m, 0.10, 0.4 + i * 0.1)); // soft rolled chord
  const count = 2 + Math.floor(rnd() * 3); // 2-4 gentle notes per 8 s
  for (let n = 0; n < count; n++) note(t + 1.5 + rnd() * 5.5, SCALE[Math.floor(rnd() * SCALE.length)], 0.07 + rnd() * 0.04, 0.3 + rnd() * 0.4);
}
// simple stereo feedback-delay "room" + low-pass for warmth
const D = [Math.floor(SR * 0.37), Math.floor(SR * 0.53)];
for (let i = 0; i < N; i++) {
  if (i >= D[0]) L[i] += R[i - D[0]] * 0.35;
  if (i >= D[1]) R[i] += L[i - D[1]] * 0.35;
}
let pl = 0, pr = 0;
for (let i = 0; i < N; i++) ((pl += 0.25 * (L[i] - pl)), (pr += 0.25 * (R[i] - pr)), (L[i] = pl), (R[i] = pr));

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / SR / 2) * Math.min(1, (DUR - i / SR) / 3);
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * g * 1.6) * 30000), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * g * 1.6) * 30000), 46 + i * 4);
}
const out = path.join(__dirname, "..", "public", process.env.OUT || "piano.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("wrote", out);
