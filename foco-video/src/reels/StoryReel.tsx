// "From stuck to started" (9:16, ~29 s, no voice): ONE woman's story, not a montage (lesson 2026-10-22).
// She stares at the task -> can't start -> an hour gone -> she just says it -> FOCO (real app: voice capture with the
// mascot listening, then AI steps) -> she's working -> she smiles. The mascot arrives through her phone, inside the app.
// Footage: Adi's "adhd best planner app.mp4" (Desktop/פוקו), recut into public/reels/h1-h6 (top 47% only, so none of
// its burned-in captions show). App: homepage say.mp4 + hero-loop.mp4 recordings. Type: Poppins ExtraBold.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BODY } from "../Composition";

const PURPLE = "#A78BFA";
const NIGHT = "#05030A";

// [clip, frames, line 1, line 2]  (words in *...* are purple)
const SHOTS: [string, number, string, string][] = [
  ["h1", 78, "You know *exactly*", "what to do."],
  ["h2", 54, "You just", "can't *start.*"],
  ["h3", 78, "An hour later.", "*Still nothing.*"],
  ["h4", 72, "So you", "just *say it.*"],
];
const APP1 = 150, APP2 = 150;
const AFTER: [string, number, string, string][] = [
  ["h5", 84, "One tiny step.", "*Then the next.*"],
  ["h6", 105, "From stuck", "to *started.*"],
];
const END = 105;
const total = (a: [string, number, string, string][]) => a.reduce((t, s) => t + s[1], 0);
const T_APP = total(SHOTS), T_AFTER = T_APP + APP1 + APP2, T_END = T_AFTER + total(AFTER);
export const STORY_TOTAL = T_END + END;

const Line: React.FC<{ text: string; size?: number; at?: number; y: number }> = ({ text, size = 96, at = 0, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: y, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: -2, color: "#fff", textShadow: "0 6px 40px rgba(0,0,0,.6)" }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: f - at - i * 3, fps, config: { damping: 18, stiffness: 180 } });
        return <span key={i} style={{ display: "inline-block", marginRight: size * 0.24, opacity: s, transform: `translateY(${(1 - s) * 36}px)`, color: w.includes("*") && !w.startsWith("*") ? "#fff" : w.startsWith("*") || /^[^*]*\*$/.test(w) ? PURPLE : "#fff" }}>{w.replace(/\*/g, "")}</span>;
      })}
    </div>
  );
};

// Her shot, full frame with a slow push and a dark floor for the type.
const Shot: React.FC<{ src: string; dur: number; l1: string; l2: string }> = ({ src, dur, l1, l2 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Video src={staticFile(`reels/${src}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(f, [0, dur], [1.03, 1.1])})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,3,10,0) 48%, rgba(5,3,10,.8) 80%, rgba(5,3,10,.94) 100%)" }} />
      <Line text={l1} at={4} y={1430} />
      <Line text={l2} at={12} y={1545} />
    </AbsoluteFill>
  );
};

// Her phone screen: the real app, over her own (blurred) shot so it stays her moment.
const Phone: React.FC<{ src: string; from?: number; rate: number; bg: string; l1: string; l2: string }> = ({ src, from = 0, rate, bg, l1, l2 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 110 } });
  const W = 660, H = Math.round(W * 702 / 360);
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Video src={staticFile(`reels/${bg}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(.45)", transform: "scale(1.15)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(900px 900px at 50% 55%, rgba(124,58,237,.35), transparent 65%)" }} />
      <Line text={l1} size={88} at={6} y={120} />
      <Line text={l2} size={88} at={14} y={225} />
      <div style={{ position: "absolute", left: (1080 - W - 28) / 2, top: 440, padding: 14, borderRadius: 76, background: "linear-gradient(150deg,#55555f,#1a1a20 30%,#0c0c10 60%,#3a3a44)", boxShadow: "0 0 160px rgba(124,58,237,.5), 0 60px 120px rgba(0,0,0,.7)", transform: `translateY(${(1 - s) * 300}px) scale(${0.9 + s * 0.1})`, opacity: s }}>
        <div style={{ width: W, height: H, borderRadius: 62, overflow: "hidden", background: "#0b0a14" }}>
          <Video src={staticFile(`reels/${src}.mp4`)} trimBefore={Math.round(from * 30)} playbackRate={rate} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 120 } });
  const b = spring({ frame: f - 20, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 40%, rgba(124,58,237,.35), transparent 65%), ${NIGHT}` }}>
      <Img src={staticFile("apps/foco-icon.png")} style={{ position: "absolute", left: 540 - 170, top: 430, width: 340, height: 340, borderRadius: 80, boxShadow: "0 0 140px rgba(124,58,237,.7)", transform: `scale(${s})` }} />
      <Line text="*FOCO*" size={170} at={6} y={830} />
      <Line text="The ADHD planner for when you can't start." size={58} at={14} y={1050} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1320, display: "flex", justifyContent: "center", gap: 28, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>
        <Img src={staticFile("reels/badge-app-store.svg")} style={{ height: 110 }} />
        <Img src={staticFile("reels/badge-google-play.png")} style={{ height: 110 }} />
      </div>
    </AbsoluteFill>
  );
};

export const StoryReel: React.FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 8, STORY_TOTAL - 30, STORY_TOTAL], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let t = 0;
  const shots = SHOTS.map(([src, d, l1, l2]) => { const el = <Sequence key={src} from={t} durationInFrames={d}><Shot src={src} dur={d} l1={l1} l2={l2} /></Sequence>; t += d; return el; });
  let u = T_AFTER;
  const after = AFTER.map(([src, d, l1, l2]) => { const el = <Sequence key={src} from={u} durationInFrames={d}><Shot src={src} dur={d} l1={l1} l2={l2} /></Sequence>; u += d; return el; });
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Audio src={staticFile("music/dreamscape.mp3")} volume={vol} />
      {shots}
      {/* say.mp4: FOCO's mascot listens, "Clean the kitchen" lands as a task. hero-loop from 2 s: AI adds the steps. */}
      <Sequence from={T_APP} durationInFrames={APP1}><Phone src="say" rate={1.4} bg="h4" l1="FOCO" l2="*listens...*" /></Sequence>
      <Sequence from={T_APP + APP1} durationInFrames={APP2}><Phone src="app" from={2} rate={1.6} bg="h4" l1="...and splits it into" l2="*tiny steps.*" /></Sequence>
      {after}
      <Sequence from={T_END} durationInFrames={END}><EndCard /></Sequence>
    </AbsoluteFill>
  );
};
