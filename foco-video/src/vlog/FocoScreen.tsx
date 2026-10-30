// Phone-screen videos for the desk vlog (1179x2556, the real screenshot size). Rendered on their own, then
// composited into the stock phones by viral-lab/tools/phone-composite.py. One task end to end ("Write mail",
// the task in the real screenshots apps/foco-7 + foco-8), so the timer is drawn in FOCO's focus-screen look
// instead of reusing the kitchen recording.
// kind: "steps" = the real Sessions list; "tap" = real focus start, a tap on Start Focus at `tapAt`, then the timer;
// "timer" = the timer already running (picks up at `elapsed` seconds).
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY } from "../Composition";

export const SCREEN_W = 1179, SCREEN_H = 2556;
const STEP = "Write a clear subject line and concise body";
const MIN = 8;

// the timer screen in FOCO's focus look; step/min default to the "Write mail" task of the real screenshots
export const Timer: React.FC<{ elapsed: number; step?: string; min?: number }> = ({ elapsed, step = STEP, min = MIN }) => {
  const MIN = min, STEP = step;
  const left = Math.max(0, MIN * 60 - elapsed);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(Math.floor(left % 60)).padStart(2, "0");
  const R = 330, L = 2 * Math.PI * R, p = elapsed / (MIN * 60);
  return (
    <AbsoluteFill style={{ background: "#0b0910", fontFamily: BODY, color: "#fff", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 150, left: 70, padding: "14px 30px", borderRadius: 40, background: "rgba(34,197,94,0.14)", color: "#4ade80", fontWeight: 700, fontSize: 38, letterSpacing: 3 }}>● FOCUSING</div>
      <div style={{ position: "absolute", top: 150, right: 70, fontSize: 52, color: "#8b83a3" }}>♫</div>
      <svg width={800} height={800} viewBox="0 0 800 800" style={{ position: "absolute", top: 520 }}>
        <circle cx={400} cy={400} r={R} fill="none" stroke="#1f2a24" strokeWidth={18} />
        <circle cx={400} cy={400} r={R} fill="none" stroke="#34d399" strokeWidth={18} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * p} transform="rotate(-90 400 400)" />
      </svg>
      <Img src={staticFile("mascots-hd/focus.png")} style={{ position: "absolute", top: 700, width: 440, height: 440, objectFit: "contain" }} />
      <div style={{ position: "absolute", top: 1420, fontWeight: 800, fontSize: 210, letterSpacing: 4, fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
      <div style={{ position: "absolute", top: 1690, fontWeight: 700, fontSize: 42, color: "#8b83a3" }}>remaining</div>
      <div style={{ position: "absolute", top: 1780, left: 120, right: 120, textAlign: "center", fontWeight: 700, fontSize: 50, lineHeight: 1.3, color: "#d8d2e6" }}>{STEP}</div>
      <div style={{ position: "absolute", top: 2010, display: "flex", gap: 40 }}>
        <div style={{ width: 380, padding: "38px 0", borderRadius: 60, background: "#1a1626", textAlign: "center", fontWeight: 700, fontSize: 46 }}>Pause</div>
        <div style={{ width: 380, padding: "38px 0", borderRadius: 60, background: "#7C3AED", textAlign: "center", fontWeight: 700, fontSize: 46 }}>Done</div>
      </div>
      <div style={{ position: "absolute", top: 2220, fontWeight: 600, fontSize: 36, color: "#6d6680" }}>🌧️ Rainy sounds playing</div>
    </AbsoluteFill>
  );
};

export const FocoScreen: React.FC<{ kind: "steps" | "tap" | "timer"; tapAt?: number; elapsed?: number }> = ({ kind, tapAt = 1.3, elapsed = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (kind === "steps") return <Img src={staticFile("apps/foco-7.png")} style={{ width: SCREEN_W, height: SCREEN_H }} />;
  if (kind === "timer") return <Timer elapsed={elapsed + t} />;
  const tap = Math.round(tapAt * fps);
  if (f < tap + 6) {
    // the Start Focus button dims on the press, like a real tap
    const press = interpolate(f, [tap - 2, tap, tap + 6], [0, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <AbsoluteFill>
        <Img src={staticFile("apps/foco-8.png")} style={{ width: SCREEN_W, height: SCREEN_H }} />
        <div style={{ position: "absolute", left: 50, top: 1945, width: 1080, height: 158, borderRadius: 90, background: `rgba(0,0,0,${press * 0.3})` }} />
      </AbsoluteFill>
    );
  }
  const s = spring({ frame: f - tap - 6, fps, config: { damping: 200 }, durationInFrames: 10 });
  return <AbsoluteFill style={{ opacity: s }}><Timer elapsed={t - tapAt} /></AbsoluteFill>;
};
