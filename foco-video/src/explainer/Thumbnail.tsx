// YouTube thumbnails (1280x720) for the explainer. Three variants for YouTube "Test & Compare".
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BODY, C, HEAD } from "../Composition";

const ORANGE = C.celebrate;
const ICE = "#7DD3FC";
const ORDER = ["habitica", "finch", "inflow", "goblin", "foco"];

const Bg: React.FC<{ glow: string; glow2?: string }> = ({ glow, glow2 = "rgba(124,58,237,0.5)" }) => (
  <AbsoluteFill style={{ background: "linear-gradient(135deg, #040208 0%, #12062a 45%, #2d1257 100%)" }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 78% 45%, ${glow} 0%, transparent 52%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(circle at 10% 100%, ${glow2} 0%, transparent 45%)` }} />
  </AbsoluteFill>
);

// Thick outlined text that survives being shrunk to a phone-size thumbnail
const T: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = "#fff", children, style }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 0.95, color, letterSpacing: -2, WebkitTextStroke: "3px #0a0410", paintOrder: "stroke fill", textShadow: "0 8px 0 #0a0410, 0 14px 40px rgba(0,0,0,0.6)", ...style }}>
    {children}
  </div>
);

const Icon: React.FC<{ id: string; size: number; style?: React.CSSProperties }> = ({ id, size, style }) => (
  <Img src={staticFile(`apps/${id}-icon.png`)} style={{ width: size, height: size, borderRadius: size * 0.23, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", border: "4px solid #fff", ...style }} />
);

// A: "CAN'T START?" + frozen mascot
const ThumbA: React.FC = () => (
  <AbsoluteFill>
    <Bg glow="rgba(125,211,252,0.45)" />
    <div style={{ position: "absolute", left: 60, top: 70 }}>
      <div style={{ display: "inline-block", fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#0a0410", background: ORANGE, padding: "6px 22px", borderRadius: 14, transform: "rotate(-3deg)" }}>ADHD</div>
      <T size={170} style={{ marginTop: 18 }}>CAN'T</T>
      <T size={170} color={ORANGE}>START?</T>
    </div>
    <div style={{ position: "absolute", left: 66, bottom: 52, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: "#fff", marginRight: 6 }}>5 apps</div>
      {ORDER.map((id) => <Icon key={id} id={id} size={id === "foco" ? 104 : 74} style={id === "foco" ? { border: `5px solid ${ORANGE}` } : undefined} />)}
    </div>
    <Img src={staticFile("mascots/foco_state_6_pause.png")} style={{ position: "absolute", right: 30, top: 70, height: 560, filter: "drop-shadow(0 0 50px rgba(125,211,252,0.7)) saturate(0.85)" }} />
    {/* ice shards */}
    {[[960, 120, 40], [1190, 90, 30], [1230, 420, 46], [900, 470, 34]].map(([x, y, s], i) => (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, background: ICE, opacity: 0.85, transform: "rotate(45deg)", boxShadow: `0 0 30px ${ICE}` }} />
    ))}
  </AbsoluteFill>
);

// B: "#1 FIX" ranking reveal
const ThumbB: React.FC = () => (
  <AbsoluteFill>
    <Bg glow="rgba(251,146,60,0.5)" />
    <div style={{ position: "absolute", left: 60, top: 60 }}>
      <T size={110}>ADHD</T>
      <T size={110}>PARALYSIS?</T>
      <T size={150} color={ORANGE} style={{ marginTop: 14 }}>#1 FIX</T>
    </div>
    <div style={{ position: "absolute", left: 66, bottom: 50, display: "flex", gap: 16, alignItems: "flex-end" }}>
      {["habitica", "finch", "inflow", "goblin"].map((id, i) => (
        <div key={id} style={{ textAlign: "center" }}>
          <Icon id={id} size={78} style={{ filter: "grayscale(0.4)", opacity: 0.9 }} />
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: C.primary2, marginTop: 6 }}>#{5 - i}</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", right: 70, top: 110, textAlign: "center" }}>
      <div style={{ fontSize: 120, lineHeight: 1, marginBottom: -18 }}>👑</div>
      <Icon id="foco" size={330} style={{ border: `10px solid ${ORANGE}`, boxShadow: `0 0 90px ${ORANGE}` }} />
    </div>
  </AbsoluteFill>
);

// C: before/after mascot split
const ThumbC: React.FC = () => (
  <AbsoluteFill>
    <Bg glow="rgba(124,58,237,0.6)" />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(125,211,252,0.22) 0%, rgba(125,211,252,0.0) 50%, rgba(251,146,60,0.0) 50%, rgba(251,146,60,0.25) 100%)" }} />
    <div style={{ position: "absolute", left: 636, top: 40, bottom: 40, width: 8, borderRadius: 8, background: "#fff", boxShadow: "0 0 30px #fff" }} />
    <Img src={staticFile("mascots/foco_state_6_pause.png")} style={{ position: "absolute", left: 80, top: 210, height: 380, filter: "drop-shadow(0 0 40px rgba(125,211,252,0.8)) saturate(0.8)" }} />
    <Img src={staticFile("mascots/foco_state_5_completion.png")} style={{ position: "absolute", right: 70, top: 190, height: 400, filter: `drop-shadow(0 0 50px ${ORANGE})` }} />
    <T size={92} color={ICE} style={{ position: "absolute", left: 60, top: 50 }}>FROZEN</T>
    <T size={92} color={ORANGE} style={{ position: "absolute", right: 60, top: 50, textAlign: "right" }}>DONE</T>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 58, color: "#0a0410", background: "#fff", padding: "10px 34px", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        5 ADHD APPS <span style={{ color: C.primary }}>RANKED</span>
      </div>
    </div>
  </AbsoluteFill>
);

export const Thumbnail: React.FC<{ variant: "A" | "B" | "C" }> = ({ variant }) =>
  variant === "A" ? <ThumbA /> : variant === "B" ? <ThumbB /> : <ThumbC />;
