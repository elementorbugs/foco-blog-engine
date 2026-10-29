// Silent "study vlog" in the hachanndayy/Tiimo style (viral-lab refs, 434K plays): cozy real footage, soft music,
// one typewriter line, the app's timer on a phone lying on the table, no voice. Built 2026-10-29 from free Pexels
// clips (public/vlog/, credits.json) because Adi had no footage yet; the FOCO phone is composited onto the top-down
// table shot and follows the camera drift measured by phase correlation (public/vlog/table-track.json).
// Swap in Adi's own clips later: same SHOTS list, his files.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";
import { Audio, Video } from "@remotion/media";
import TRACK from "../../public/vlog/table-track.json";

const ROUND = "Fredoka";
const fontHandle = delayRender("vlog font");
new FontFace(ROUND, `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" }).load().then((f) => { document.fonts.add(f); continueRender(fontHandle); });

export const VLOG_FPS = 30;
type Screen = { from: number; until?: number; then?: number }; // FOCO recording (demo-clips/voice.mp4) seconds
type Shot = { clip: string; from: number; dur: number; phone?: { x: number; y: number; rot: number; screen: Screen } };

// ~2.5s per shot like the reference; the phone shots carry FOCO (focus start -> timer, then "You did it!")
const SHOTS: Shot[] = [
  { clip: "cafe", from: 1, dur: 2.6 },
  { clip: "rain", from: 3, dur: 2.4 },
  { clip: "write", from: 2, dur: 2.4 },
  { clip: "table", from: 0.5, dur: 3.2, phone: { x: 260, y: 1060, rot: -11, screen: { from: 68.2, until: 1.4, then: 79.0 } } },
  { clip: "latte", from: 2, dur: 2.2 },
  { clip: "type", from: 3, dur: 2.4 },
  { clip: "table", from: 4.2, dur: 2.6, phone: { x: 520, y: 1100, rot: 7, screen: { from: 85.0 } } },
  { clip: "pour", from: 1, dur: 2.8 },
];
const starts = SHOTS.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + SHOTS[i - 1].dur : 0], []);
export const VLOG_TOTAL = Math.round((starts[starts.length - 1] + SHOTS[SHOTS.length - 1].dur) * VLOG_FPS);

const GRADE = "sepia(0.14) saturate(0.92) contrast(0.95) brightness(1.03)";

// a phone lying flat on the table, seen from above, playing the real FOCO recording
const TablePhone: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = shot.phone!;
  const tr = (TRACK as { fps: number; track: number[][] });
  const i = Math.min(tr.track.length - 1, Math.round((shot.from + f / fps) * tr.fps));
  const [dx, dy] = tr.track[i];
  const W = 300, H = Math.round(W * 2.16), B = 11;
  const cut = p.screen.until !== undefined ? Math.round(p.screen.until * fps) : null;
  return (
    <div style={{ position: "absolute", left: p.x + dx, top: p.y + dy, width: W, height: H, transform: `rotate(${p.rot}deg)`, borderRadius: 46, background: "linear-gradient(135deg,#3a3740,#121116 40%,#1d1b22)", padding: B, boxShadow: "18px 26px 40px rgba(60,40,20,0.35), 4px 6px 10px rgba(60,40,20,0.3), inset 0 0 0 2px rgba(255,255,255,0.12)" }}>
      <div style={{ position: "relative", width: W - B * 2, height: H - B * 2, borderRadius: 36, overflow: "hidden", background: "#000" }}>
        <Sequence durationInFrames={cut ?? 100000} layout="none">
          <Video src={staticFile("demo-clips/voice.mp4")} trimBefore={Math.round(p.screen.from * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        {cut !== null && (
          <Sequence from={cut} layout="none">
            <Video src={staticFile("demo-clips/voice.mp4")} trimBefore={Math.round(p.screen.then! * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        )}
        {/* glass: a soft diagonal reflection so the screen sits in the room's light */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.10), transparent 35%, transparent 70%, rgba(255,255,255,0.05))" }} />
      </div>
    </div>
  );
};

// typewriter text, one character every `cps` frames, white with a soft shadow (the reference's "Study vlog")
const Type: React.FC<{ text: string; at: number; size: number; y: number; cps?: number }> = ({ text, at, size, y, cps = 2 }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / cps)));
  if (n === 0) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 160, top: y, textAlign: "center", fontFamily: `${ROUND}, "Noto Color Emoji"`, fontWeight: 600, fontSize: size, lineHeight: 1.2, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>{text.slice(0, n)}</div>
  );
};

export const CafeVlog: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vol = interpolate(f, [0, 15, VLOG_TOTAL - 30, VLOG_TOTAL], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const endAt = Math.round(starts[7] * fps);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("music/dreamscape.mp3")} volume={vol} />
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={Math.round(starts[i] * fps)} durationInFrames={Math.round(s.dur * fps)}>
          <AbsoluteFill style={{ filter: GRADE }}>
            <Video src={staticFile(`vlog/${s.clip}.mp4`)} trimBefore={Math.round(s.from * 25)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {s.phone && <TablePhone shot={s} />}
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "rgba(255,170,90,0.05)", mixBlendMode: "soft-light" }} />
        </Sequence>
      ))}
      <Sequence durationInFrames={Math.round(starts[2] * fps)}>
        <Type text="study vlog," at={6} size={84} y={700} />
        <Type text="but my ADHD brain only has to do step one" at={30} size={52} y={810} cps={1.5} />
      </Sequence>
      <Sequence from={Math.round(starts[3] * fps)} durationInFrames={Math.round(SHOTS[3].dur * fps)}>
        <Type text="step 1 of 3 ☕" at={10} size={50} y={560} />
      </Sequence>
      <Sequence from={endAt}>
        <Type text="one tiny step at a time 💜" at={12} size={60} y={760} />
      </Sequence>
    </AbsoluteFill>
  );
};
