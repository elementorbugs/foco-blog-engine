// "Stuck to started" (9:16, ~26 s, no voice): five people frozen in the same moment, the FOCO mascot screen, the real
// app (AI splitting -> steps -> focus -> done), the same kind of faces relieved, end card with store badges.
// Footage: Adi's own promo clips (Desktop/פוקו), recut by hand into public/reels/ (top half only, so none of their
// burned-in captions show). App: homepage hero-loop recording. Type is the store screenshots' Poppins ExtraBold.
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BODY } from "../Composition";

const PURPLE = "#A78BFA";
const NIGHT = "#05030A";

type Shot = { src: string; dur: number };
// frames at 30 fps
const STUCK: Shot[] = [{ src: "s1", dur: 54 }, { src: "s2", dur: 48 }, { src: "s3", dur: 36 }, { src: "s4", dur: 36 }, { src: "s5", dur: 36 }];
const MASCOT = 66;
const APP = 270;
const RELIEF: Shot[] = [{ src: "r1", dur: 39 }, { src: "r2", dur: 39 }, { src: "r3", dur: 39 }];
const END = 120;

const sum = (a: Shot[]) => a.reduce((t, s) => t + s.dur, 0);
const T_STUCK = 0, T_MASCOT = sum(STUCK), T_APP = T_MASCOT + MASCOT, T_RELIEF = T_APP + APP, T_END = T_RELIEF + sum(RELIEF);
export const STS_TOTAL = T_END + END;

// A line of type: words rise in one after another; words wrapped in *...* are purple.
const Line: React.FC<{ text: string; size?: number; at?: number; y: number }> = ({ text, size = 112, at = 0, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: -2, color: "#fff", textShadow: "0 6px 40px rgba(0,0,0,.55)" }}>
      {words.map((w, i) => {
        const hot = w.startsWith("*");
        const s = spring({ frame: f - at - i * 3, fps, config: { damping: 18, stiffness: 180 } });
        return (
          <span key={i} style={{ display: "inline-block", marginRight: size * 0.24, opacity: s, transform: `translateY(${(1 - s) * 40}px)`, color: hot ? PURPLE : "#fff" }}>
            {w.replace(/\*/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// Full-frame footage with a slow push, plus a dark floor so the type reads.
const Footage: React.FC<{ src: string; dur: number }> = ({ src, dur }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, dur], [1.04, 1.12]);
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Video src={staticFile(`reels/${src}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,3,10,0) 45%, rgba(5,3,10,.75) 78%, rgba(5,3,10,.92) 100%)" }} />
    </AbsoluteFill>
  );
};

const seq = (shots: Shot[], from: number) => {
  let t = from;
  return shots.map((s) => { const el = <Sequence key={s.src} from={t} durationInFrames={s.dur}><Footage src={s.src} dur={s.dur} /></Sequence>; t += s.dur; return el; });
};

const Glow: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 40%, rgba(124,58,237,.35), transparent 65%), ${NIGHT}` }} />
);

const MascotScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Glow />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, height: 900, transform: `scale(${0.7 + s * 0.3})`, opacity: s, WebkitMaskImage: "radial-gradient(ellipse 42% 46% at 50% 50%, #000 62%, transparent 100%)" }}>
        <Video src={staticFile("reels/mascot.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "screen" }} />
      </div>
      <Line text="Meet *FOCO.*" size={150} at={10} y={1330} />
      
    </AbsoluteFill>
  );
};

const AppScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 110 } });
  const W = 640, H = Math.round(W * 818 / 420);
  // hero-loop: AI split menu 0-2 s, steps 2-10 s, focus timer 10-12 s, "You did it" 12-15 s; played at 1.65x
  const label = f < 175 ? ["Big task?", "*Tiny* steps."] : f < 218 ? ["One step.", "Full *focus.*"] : ["And it's", "*done.*"];
  const key = f < 175 ? 0 : f < 218 ? 175 : 218;
  return (
    <AbsoluteFill>
      <Glow />
      <Sequence from={key} layout="none"><Line text={label[0]} size={104} y={150} /><Line text={label[1]} size={104} at={6} y={265} /></Sequence>
      <div style={{ position: "absolute", left: (1080 - W - 28) / 2, top: 470, padding: 14, borderRadius: 74, background: "linear-gradient(150deg,#55555f,#1a1a20 30%,#0c0c10 60%,#3a3a44)", boxShadow: "0 0 160px rgba(124,58,237,.45), 0 60px 120px rgba(0,0,0,.7)", transform: `translateY(${(1 - s) * 260}px)`, opacity: s }}>
        <div style={{ width: W, height: H, borderRadius: 60, overflow: "hidden", background: "#0b0a14" }}>
          <Video src={staticFile("reels/app.mp4")} muted playbackRate={1.65} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 120 } });
  const b = spring({ frame: f - 22, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <AbsoluteFill>
      <Glow />
      <Img src={staticFile("apps/foco-icon.png")} style={{ position: "absolute", left: 540 - 170, top: 420, width: 340, height: 340, borderRadius: 80, boxShadow: "0 0 140px rgba(124,58,237,.7)", transform: `scale(${s})` }} />
      <Line text="*FOCO*" size={170} at={8} y={830} />
      <Line text="The ADHD planner for when you can't start." size={58} at={16} y={1050} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1320, display: "flex", justifyContent: "center", gap: 28, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>
        <Img src={staticFile("reels/badge-app-store.svg")} style={{ height: 110 }} />
        <Img src={staticFile("reels/badge-google-play.png")} style={{ height: 110 }} />
      </div>
    </AbsoluteFill>
  );
};

export const StuckToStarted: React.FC = () => {
  const f = useCurrentFrame();
  const musicVol = interpolate(f, [0, 8, STS_TOTAL - 30, STS_TOTAL], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear });
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Audio src={staticFile("music/dreamscape.mp3")} volume={musicVol} />
      {seq(STUCK, T_STUCK)}
      <Sequence from={0} durationInFrames={54}><Line text="You know *exactly*" size={96} at={6} y={1430} /><Line text="what to do." size={96} at={14} y={1545} /></Sequence>
      <Sequence from={54} durationInFrames={48}><Line text="You still" size={96} y={1430} /><Line text="*can't start.*" size={96} at={4} y={1545} /></Sequence>
      <Sequence from={102} durationInFrames={108}><Line text="Not lazy." size={96} y={1430} /><Line text="*Stuck.*" at={40} y={1545} size={120} /></Sequence>
      <Sequence from={T_MASCOT} durationInFrames={MASCOT}><MascotScene /></Sequence>
      <Sequence from={T_APP} durationInFrames={APP}><AppScene /></Sequence>
      {seq(RELIEF, T_RELIEF)}
      <Sequence from={T_RELIEF} durationInFrames={sum(RELIEF)}><Line text="From stuck" size={96} y={1430} /><Line text="to *started.*" size={96} at={8} y={1545} /></Sequence>
      <Sequence from={T_END} durationInFrames={END}><EndCard /></Sequence>
    </AbsoluteFill>
  );
};
