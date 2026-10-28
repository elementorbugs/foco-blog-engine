// Captions (.srt) + YouTube chapters for a Versus video, from the same timeline makeVersus() builds
// (src/versus/Versus.tsx: GAP 0.35s, pre/post padding per beat, 30 fps). Keep the two in sync if the timeline changes.
// Usage: node scripts/versus-srt.js <dir> <round-count> <out.srt>     e.g. node scripts/versus-srt.js finch-habitica 5 out/finch-vs-habitica.srt
const fs = require('fs'), path = require('path');
const [dir, nRounds, out] = process.argv.slice(2);
const base = path.join(__dirname, '..', 'src', 'versus', dir);
const LINES = JSON.parse(fs.readFileSync(path.join(base, 'vo-lines.json'), 'utf8')).lines;
const DUR = JSON.parse(fs.readFileSync(path.join(base, 'vo.json'), 'utf8'));
const FPS = 30, GAP = 0.35, s2f = s => Math.round(s * FPS);

const defs = [{ vo: 'h1', pre: 0.3 }, { vo: 'h2' }, { vo: 'h3' }, { vo: 'h4', post: 0.3 }];
for (let n = 1; n <= +nRounds; n++) {
  const keys = Object.keys(LINES).filter(k => k.startsWith(`r${n}`) && k.length === 3).sort();
  keys.forEach((k, i) => defs.push({ vo: k, pre: i === 0 ? 0.2 : 0, post: i === 0 ? 0.2 : i === keys.length - 1 ? 0.5 : 0, round: n }));
}
defs.push({ vo: 'sc', post: 0.4 }, { vo: 'b1', pre: 0.3 }, { vo: 'b2', post: 0.3 }, { vo: 'f1' }, { vo: 'f2' }, { vo: 'f3', post: 0.3 }, { vo: 'o1' }, { vo: 'o2', post: 1.6 });

let at = 0; const beats = [];
for (const d of defs) {
  const len = s2f((d.pre || 0) + DUR[d.vo] + GAP + (d.post || 0));
  beats.push({ ...d, start: (at + s2f(d.pre || 0)) / FPS, end: (at + s2f(d.pre || 0)) / FPS + DUR[d.vo], at: at / FPS });
  at += len;
}
const ts = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
fs.writeFileSync(out, beats.map((b, i) => `${i + 1}\n${ts(b.start)} --> ${ts(b.end)}\n${LINES[b.vo]}\n`).join('\n'));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const first = k => beats.find(b => b.vo === k).at;
console.log('total', mmss(at / FPS));
console.log(`0:00 hook`);
for (let n = 1; n <= +nRounds; n++) console.log(`${mmss(first(`r${n}a`))} Round ${n}: ${LINES[`r${n}a`].replace(/^Round \w+\.\s*/, '').replace(/\.$/, '')}`);
console.log(`${mmss(first('sc'))} The score`, `\n${mmss(first('b1'))} Bonus round`, `\n${mmss(first('f1'))} FOCO`, `\n${mmss(first('o1'))} Which one should you pick?`);
