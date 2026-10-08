import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { fonts, springs } from "reelkit/kit";

export type TaskChipProps = {
  label?: string;
  // Colour of the round marker on the left (and of the tick when checked).
  dot?: string;
  // Frame (in this component's clock) at which the tick draws in and the label strikes through; never when omitted.
  checkAt?: number;
  // Height of the chip as a fraction of the frame width.
  size?: number;
  ink?: string;
  surface?: string;
  stroke?: string;
  font?: string;
};

// A to-do item as a rounded pill: a round marker and a label. At checkAt the marker fills, a tick draws in and the label strikes through and dims. Use it for tasks floating around a scene, piling up, or being checked off.
export const TaskChip: React.FC<TaskChipProps> = ({ label = "Task", dot = "#A78BFA", checkAt, size = 0.075, ink = "#ffffff", surface = "rgba(20,12,34,0.88)", stroke = "rgba(167,139,250,0.4)", font = fonts.display }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const h = width * size;
  const c = checkAt === undefined ? 0 : spring({ frame: frame - checkAt, fps, config: springs.snappy });
  const tick = checkAt === undefined ? 0 : interpolate(frame - checkAt, [2, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = h * 0.3;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: h * 0.24, height: h, padding: `0 ${h * 0.38}px 0 ${h * 0.22}px`, borderRadius: h, background: surface, border: `${Math.max(1, h * 0.03)}px solid ${stroke}`, boxShadow: `0 ${h * 0.15}px ${h * 0.4}px rgba(0,0,0,0.45)`, whiteSpace: "nowrap" }}>
      <svg width={r * 2} height={r * 2} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <circle cx="10" cy="10" r="8.5" fill={dot} fillOpacity={c} stroke={dot} strokeWidth="2" />
        <path d="M5.5 10.5 L8.7 13.5 L14.5 7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
      </svg>
      <span style={{ position: "relative", fontFamily: font, fontWeight: 700, fontSize: h * 0.4, color: ink, opacity: 1 - c * 0.4 }}>
        {label}
        <span style={{ position: "absolute", left: 0, top: "52%", height: Math.max(2, h * 0.04), width: `${tick * 100}%`, background: ink, opacity: 0.8 }} />
      </span>
    </div>
  );
};
