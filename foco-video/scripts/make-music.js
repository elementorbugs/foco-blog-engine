// Synthesizes an original, royalty-free background track for the video -> public/music.wav
// Usage: node scripts/make-music.js [seconds]
const fs = require("fs");
const path = require("path");

const SR = 44100;
const DUR = Number(process.argv[2] || 27);
const BPM = Number(process.env.BPM || 110);
const BEAT = 60 / BPM;
const N = Math.floor(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (i, l, r = l) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

// vi-IV-I-V in C: Am F C G, one bar (4 beats) each
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const BASS = [45, 41, 36, 43];
const BAR = BEAT * 4;
const DROP = Number(process.env.DROP || 17.5); // arp brightens from here

// Warm pad: detuned triangles with slow attack per bar
for (let t0 = 0, b = 0; t0 < DUR; t0 += BAR, b++) {
  const ch = CHORDS[b % 4];
  const s0 = Math.floor(t0 * SR), len = Math.floor(BAR * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.4) * Math.min(1, (BAR - t) / 0.3);
    let vl = 0, vr = 0;
    for (const m of ch) {
      const f = midi(m + 12);
      const tri = (x) => 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1;
      vl += tri(f * 0.998 * (t0 + t));
      vr += tri(f * 1.002 * (t0 + t));
    }
    add(s0 + k, vl * 0.035 * env, vr * 0.035 * env);
  }
}

// Bass: sine with soft pluck on beats 1 and 3 (+ syncopation)
for (let t0 = 0, b = 0; t0 < DUR; t0 += BAR, b++) {
  const f = midi(BASS[b % 4]);
  for (const off of [0, 1.5, 2, 3.5]) {
    const st = t0 + off * BEAT, len = BEAT * 0.9;
    for (let k = 0; k < len * SR; k++) {
      const t = k / SR;
      const env = Math.exp(-t * 3) * Math.min(1, t / 0.005);
      add(Math.floor(st * SR) + k, Math.sin(2 * Math.PI * f * t) * 0.22 * env);
    }
  }
}

// Plucky arpeggio in 8ths, brighter after the drop
for (let t0 = 0, b = 0; t0 < DUR; t0 += BAR, b++) {
  const ch = CHORDS[b % 4];
  const pattern = [0, 1, 2, 1, 2, 0, 1, 2];
  pattern.forEach((p, j) => {
    const st = t0 + j * BEAT / 2;
    const bright = st >= DROP;
    const f = midi(ch[p] + (bright ? 24 : 12));
    const pan = j % 2 ? 0.7 : 1.3;
    for (let k = 0; k < 0.35 * SR; k++) {
      const t = k / SR;
      const env = Math.exp(-t * 9) * Math.min(1, t / 0.003);
      const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * (bright ? 0.07 : 0.05) * env;
      add(Math.floor(st * SR) + k, v * pan, v * (2 - pan));
    }
  });
}

// Drums (start after a 1-bar intro)
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (let st = BAR; st < DUR; st += BEAT) {
  const beatInBar = Math.round((st / BEAT) % 4);
  if (beatInBar === 0 || beatInBar === 2) {
    for (let k = 0; k < 0.3 * SR; k++) {
      const t = k / SR;
      const f = 50 + 90 * Math.exp(-t * 30);
      add(Math.floor(st * SR) + k, Math.sin(2 * Math.PI * f * t) * 0.45 * Math.exp(-t * 9));
    }
  } else {
    let lp = 0;
    for (let k = 0; k < 0.2 * SR; k++) {
      const t = k / SR;
      lp += (noise() - lp) * 0.35;
      add(Math.floor(st * SR) + k, lp * 0.16 * Math.exp(-t * 18));
    }
  }
  for (const h of [0, 0.5]) {
    const hs = st + h * BEAT;
    let prev = 0;
    for (let k = 0; k < 0.05 * SR; k++) {
      const n = noise(), hp = n - prev; prev = n;
      add(Math.floor(hs * SR) + k, hp * 0.035 * Math.exp(-k / SR * 60), hp * 0.045 * Math.exp(-k / SR * 60));
    }
  }
}

// Master: fade in/out + soft clip, write 16-bit stereo WAV
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.5) * Math.min(1, (DUR - t) / 2);
  const c = (x) => Math.tanh(x * g * 1.2) * 32000;
  buf.writeInt16LE(Math.round(c(L[i])), 44 + i * 4);
  buf.writeInt16LE(Math.round(c(R[i])), 46 + i * 4);
}
const out = path.join(__dirname, "..", "public", process.env.OUT || "music.wav");
fs.writeFileSync(out, buf);
console.log("wrote", out, DUR + "s");
