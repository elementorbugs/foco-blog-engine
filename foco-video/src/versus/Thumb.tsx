// YouTube thumbnails (1280x720) for the Versus videos (defaults: Tiimo vs Structured), three ideas for Test & Compare:
// A = the two icons + VS, B = tied scoreboard (curiosity), C = the stuck freelancer between the apps (a face).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, HEAD } from "../Composition";
import { Cut, Hypno } from "../unstuck/UnstuckRank";

export const T: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = "#fff", children, style }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 0.95, color, letterSpacing: -2, WebkitTextStroke: "3px #0a0410", paintOrder: "stroke fill", textShadow: "0 8px 0 #0a0410, 0 14px 40px rgba(0,0,0,0.6)", ...style }}>
    {children}
  </div>
);
export const AppIcon: React.FC<{ id: string; size: number; glow: string; style?: React.CSSProperties }> = ({ id, size, glow, style }) => (
  <Img src={staticFile(`apps/${id}-icon.png`)} style={{ position: "absolute", width: size, height: size, borderRadius: size * 0.23, boxShadow: `0 0 70px ${glow}, 0 30px 60px rgba(0,0,0,0.6)`, ...style }} />
);
const Vs: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <T size={size} color={C.celebrate} style={{ position: "absolute", fontStyle: "italic", transform: "rotate(-8deg)", textShadow: "0 0 50px rgba(251,146,60,0.8), 0 8px 0 #0a0410", ...style }}>VS</T>
);

type ThumbApp = { id: string; name: string; glow: string; color: string };
const TIIMO: ThumbApp = { id: "tiimo", name: "TIIMO", glow: "rgba(196,181,253,0.8)", color: "#C4B5FD" };
export const STRUCTURED: ThumbApp = { id: "structured", name: "STRUCTURED", glow: "rgba(251,113,133,0.8)", color: "#FB7185" };
export const GOBLIN: ThumbApp = { id: "goblin", name: "GOBLIN TOOLS", glow: "rgba(74,222,128,0.8)", color: "#4ADE80" };
export const TICKTICK: ThumbApp = { id: "ticktick", name: "TICKTICK", glow: "rgba(96,165,250,0.8)", color: "#60A5FA" };
export const TODOIST: ThumbApp = { id: "todoist", name: "TODOIST", glow: "rgba(248,113,113,0.8)", color: "#F87171" };
export const FINCH: ThumbApp = { id: "finch", name: "FINCH", glow: "rgba(125,211,252,0.8)", color: "#7DD3FC" };
export const HABITICA: ThumbApp = { id: "habitica", name: "HABITICA", glow: "rgba(167,139,250,0.8)", color: "#A78BFA" };
export const CHATGPT: ThumbApp = { id: "chatgpt", name: "CHATGPT", glow: "rgba(94,234,212,0.8)", color: "#5EEAD4" };
export { TIIMO };
export const VsThumb: React.FC<{ variant: "A" | "B" | "C"; l?: ThumbApp; r?: ThumbApp; score?: [number, number]; scoreText?: string }> = ({ variant, l = TIIMO, r = STRUCTURED, score = [3, 2], scoreText = "CLOSE CALL" }) => (
  <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: -320, top: -180, width: 1920, height: 1080, transform: "scale(1)" }}>
      <Hypno t={40} />
    </div>
    {variant === "A" && (
      <>
        <AppIcon id={l.id} size={360} glow={l.glow} style={{ left: 70, top: 200, transform: "rotate(-6deg)" }} />
        <AppIcon id={r.id} size={360} glow={r.glow} style={{ right: 70, top: 200, transform: "rotate(6deg)" }} />
        <Vs size={190} style={{ left: 505, top: 260 }} />
        <T size={92} style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center" }}>WHICH ONE?</T>
      </>
    )}
    {variant === "B" && (
      <>
        <div style={{ position: "absolute", left: 90, right: 90, top: 210, height: 300, borderRadius: 160, background: "rgba(10,4,16,0.9)", border: "5px solid rgba(167,139,250,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 50px" }}>
          <Img src={staticFile(`apps/${l.id}-icon.png`)} style={{ width: 210, height: 210, borderRadius: 48 }} />
          <T size={230} color={l.color}>{score[0]}</T>
          <T size={150} color="rgba(214,208,228,0.7)">:</T>
          <T size={230} color={r.color}>{score[1]}</T>
          <Img src={staticFile(`apps/${r.id}-icon.png`)} style={{ width: 210, height: 210, borderRadius: 48 }} />
        </div>
        <T size={110} color={C.celebrate} style={{ position: "absolute", left: 0, right: 0, top: 545, textAlign: "center" }}>{scoreText}</T>
        <T size={64} style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>{l.name} vs {r.name}</T>
      </>
    )}
    {variant === "C" && (
      <>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 720, WebkitMaskImage: "radial-gradient(ellipse 22% 62% at 50% 60%, black 70%, transparent 100%)" }}>
          <Cut n="s0-4" h={800} cx={640} cy={420} pad={90} />
        </div>
        <AppIcon id={l.id} size={230} glow={l.glow} style={{ left: 50, top: 260, transform: "rotate(-8deg)" }} />
        <AppIcon id={r.id} size={230} glow={r.glow} style={{ right: 50, top: 260, transform: "rotate(8deg)" }} />
        <T size={88} style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center" }}>WHICH ONE <span style={{ color: C.celebrate }}>FIXES</span> THIS?</T>
      </>
    )}
  </AbsoluteFill>
);
