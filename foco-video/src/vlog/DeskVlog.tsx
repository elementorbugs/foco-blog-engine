// Desk vlog v2 (2026-10-29), after Adi found the cafe vlog "too calm, the message doesn't land, the phone looks
// weird": a real story in 7 shots (stuck -> scrolling -> tell FOCO -> tap Start Focus -> timer on the stand next to
// the monitor -> typing -> done), TikTok-style text on every shot, faster cuts, upbeat bed. The FOCO screens are
// real screenshots + a drawn timer for the same "Write mail" task, composited into the stock phones by
// viral-lab/tools/phone-composite.py (public/vlog/comp/*.mp4; a finger really presses Start Focus).
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BODY } from "../Composition";

type Shot = { clip: string; from: number; dur: number; text: string[]; textAt?: number[]; textY?: number };
const SHOTS: Shot[] = [
  { clip: "vlog/stuck.mp4", from: 1, dur: 2.2, text: ["me with ADHD:", "\"I'll start the email in 5 min\""] },
  { clip: "vlog/scroll.mp4", from: 4, dur: 1.8, text: ["3 hours later 🙃"] },
  { clip: "vlog/comp/handlaptop.mp4", from: 0, dur: 2.6, text: ["so I told FOCO the task", "it gave me 4 tiny steps"], textAt: [0, 1.2] },
  { clip: "vlog/comp/handphone.mp4", from: 0, dur: 3.4, text: ["step 1 is so small", "I can't say no to it"], textY: 1270 },
  { clip: "vlog/comp/standmonitor.mp4", from: 0, dur: 2.6, text: ["timer on, rain sounds on 🎧"] },
  { clip: "vlog/typing.mp4", from: 2, dur: 2.0, text: ["and I'm actually doing it 😮‍💨"] },
  { clip: "vlog/working.mp4", from: 2, dur: 2.8, text: ["one tiny step at a time", "FOCO 💜 link in bio"], textAt: [0, 1.0] },
];
const starts = SHOTS.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + SHOTS[i - 1].dur : 0], []);
export const DESK_TOTAL = Math.round((starts[starts.length - 1] + SHOTS[SHOTS.length - 1].dur) * 30);

const GRADE = "saturate(0.95) contrast(1.02) sepia(0.06) brightness(1.02)";

// TikTok-native text: white Poppins with a dark outline, each line pops in
const Line: React.FC<{ text: string; at: number; y: number; size: number }> = ({ text, at, y, size }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 260 } });
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 150, top: y, textAlign: "center", fontFamily: `${BODY}, "Noto Color Emoji"`, fontWeight: 800, fontSize: size, lineHeight: 1.15, color: "#fff", WebkitTextStroke: "6px #111", paintOrder: "stroke", textShadow: "0 4px 18px rgba(0,0,0,0.45)", transform: `scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 1.5) }}>{text}</div>
  );
};

export const DeskVlog: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vol = interpolate(f, [0, 8, DESK_TOTAL - 24, DESK_TOTAL], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("music.wav")} volume={vol} />
      {SHOTS.map((s, i) => {
        const dur = Math.round(s.dur * fps);
        return (
          <Sequence key={i} from={Math.round(starts[i] * fps)} durationInFrames={dur}>
            <Zoom dur={dur}>
              <Video src={staticFile(s.clip)} trimBefore={Math.round(s.from * fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }} />
            </Zoom>
            {s.text.map((t, j) => (
              <Line key={j} text={t} at={Math.round((s.textAt?.[j] ?? 0) * fps) + (s.textAt ? 0 : j * 8)} y={(s.textY ?? 380) + j * 100} size={j === 0 && s.text.length > 1 ? 66 : 60} />
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// a slow 4% push-in keeps every shot moving
const Zoom: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `scale(${1 + 0.04 * (f / dur)})` }}>{children}</AbsoluteFill>;
};
