import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { ease } from "reelkit/kit";

export type BurstProps = {
  // Frame (in this component's clock) at which the burst fires.
  at?: number;
  // Centre of the burst as fractions of the frame.
  x?: number;
  y?: number;
  color?: string;
  accent?: string;
  // Reach of the rays as a fraction of the frame width.
  radius?: number;
  rays?: number;
  frames?: number;
};

// A celebration burst: a flash of light, an expanding ring and rays with dots that shoot out from one point and fade. Use it behind a win, a completed task or a reveal.
export const Burst: React.FC<BurstProps> = ({ at = 0, x = 0.5, y = 0.5, color = "#FB923C", accent = "#FDE68A", radius = 0.55, rays = 14, frames = 26 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame - at;
  if (t < 0 || t > frames + 40) return null;
  const p = interpolate(t, [0, frames], [0, 1], { extrapolateRight: "clamp", easing: ease.out });
  const fade = interpolate(t, [frames * 0.5, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(t, [0, 4, frames + 40], [0, 0.9, 0.35], { extrapolateRight: "clamp" });
  const R = width * radius;
  const cx = width * x, cy = height * y;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: "50%", background: `radial-gradient(closest-side, ${color}, transparent)`, opacity: glow }} />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={R * p * 0.9} fill="none" stroke={accent} strokeWidth={width * 0.008 * (1 - p) + 1} opacity={fade} />
        {Array.from({ length: rays }, (_, i) => {
          const a = (i / rays) * Math.PI * 2 + 0.2;
          const r0 = R * (0.25 + 0.55 * p), r1 = R * (0.3 + 0.75 * p);
          const c = i % 2 ? color : accent;
          return (
            <g key={i} opacity={fade}>
              <line x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={c} strokeWidth={width * 0.008} strokeLinecap="round" />
              <circle cx={cx + Math.cos(a + 0.13) * r1 * 0.92} cy={cy + Math.sin(a + 0.13) * r1 * 0.92} r={width * 0.007} fill={c} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
