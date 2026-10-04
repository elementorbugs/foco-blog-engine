import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

export const C = {
  bg: "#040208",
  bg2: "#0a0410",
  primary: "#7C3AED",
  primary2: "#A78BFA",
  celebrate: "#FB923C",
  text: "#FFFFFF",
  muted: "#D6D0E4",
  green: "#4ADE80",
};

export const HEAD = "Sora";
export const BODY = "Poppins";
// Bundled color emoji so slides look the same on Adi's PC and in cloud sessions (system emoji differ per OS)
export const EMOJI = "Noto Color Emoji";
export const BODY_STACK = `${BODY}, "${EMOJI}"`;

// Load local brand fonts before the first frame renders
const fontHandle = delayRender("fonts");
Promise.all([
  new FontFace(HEAD, `url(${staticFile("fonts/Sora-ExtraBold.ttf")})`, { weight: "800" }).load(),
  new FontFace(BODY, `url(${staticFile("fonts/Poppins-Bold.ttf")})`, { weight: "700" }).load(),
  new FontFace(BODY, `url(${staticFile("fonts/Poppins-ExtraBold.ttf")})`, { weight: "800" }).load(),
  new FontFace(EMOJI, `url(${staticFile("fonts/NotoColorEmoji.woff2")})`).load(),
]).then((faces) => {
  faces.forEach((f) => document.fonts.add(f));
  continueRender(fontHandle);
});

// Screenshots + icons come from the App Store (scripts/fetch-app-images.js).
// benefits[i] appears together with shots[i].
type App = {
  rank: number;
  id: string;
  name: string;
  question: React.ReactNode;
  color: string;
  shots: number[];
  benefits: string[];
  duration: number;
};

const APPS: App[] = [
  { rank: 5, id: "sunsama", name: "Sunsama", question: "Need a calm plan every morning?", color: "#FBBF24", shots: [3, 4], benefits: ["Review your plan every morning", "Drag tasks onto your calendar"], duration: 180 },
  { rank: 4, id: "inflow", name: "Inflow", question: "Just diagnosed with ADHD?", color: "#4ADE80", shots: [2, 4], benefits: ["5-minute daily ADHD lessons", "Learn coping strategies"], duration: 180 },
  { rank: 3, id: "morgen", name: "Morgen", question: "Your day is full of meetings?", color: "#60A5FA", shots: [2, 6], benefits: ["All your calendars in one place", "Fits tasks between meetings"], duration: 180 },
  { rank: 2, id: "tiimo", name: "Tiimo", question: "You think in pictures, not lists?", color: "#F472B6", shots: [3, 6], benefits: ["Colorful visual day plan", "A timer that shows time passing"], duration: 180 },
];

const FOCO: App = {
  rank: 1,
  id: "foco",
  name: "FOCO",
  question: (
    <>
      Can't even <span style={{ color: C.celebrate }}>start</span> the task?
    </>
  ),
  color: C.celebrate,
  shots: [3, 4, 6],
  benefits: ["Breaks any task into tiny steps", "One timer. One task.", "Calm focus sounds, like someone works with you"],
  duration: 300,
};

// Sunsama + Morgen ship 9:16 screenshots, the rest are taller (iPhone 6.7")
const WIDE_SHOTS = ["sunsama", "morgen"];

const HOOK = 150;
const CTA = 150;
const T = 12; // transition frames
const SHOT_START = 30; // first screenshot + benefit appear here

const useIn = (delay: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

export const Background: React.FC<{ glow?: string }> = ({ glow = "rgba(124, 58, 237, 0.35)" }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 60;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg} 0%, ${C.bg2} 35%, #1a0a2e 70%, #2d1257 100%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${75 + drift / 20}% ${18 + drift / 30}%, ${glow} 0%, transparent 55%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 15% 85%, rgba(167, 139, 250, 0.18) 0%, transparent 50%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: `linear-gradient(90deg, ${C.primary}, ${C.primary2}, ${C.celebrate})` }} />
    </AbsoluteFill>
  );
};

// Countdown dots at the top: 5 4 3 2 1, current one highlighted
const Countdown: React.FC<{ active: number }> = ({ active }) => (
  <div style={{ position: "absolute", top: 80, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
    {[5, 4, 3, 2, 1].map((n) => (
      <div
        key={n}
        style={{
          width: 76, height: 76, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: HEAD, fontWeight: 800, fontSize: 36,
          background: n === active ? (n === 1 ? C.celebrate : C.primary) : n < active ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.25)",
          color: n === active ? "#fff" : n < active ? "rgba(255,255,255,0.35)" : C.primary2,
          border: n === active ? "none" : "2px solid rgba(167,139,250,0.3)",
          transform: n === active ? "scale(1.18)" : "none",
        }}
      >
        {n}
      </div>
    ))}
  </div>
);

export const Check: React.FC<{ color: string; size?: number }> = ({ color, size = 56 }) => (
  <div style={{ width: size, height: size, borderRadius: 999, background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
      <path d="M4 12.5 L10 18 L20 6" fill="none" stroke="#0a0410" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const q = useIn(0);
  const qOut = interpolate(frame, [55, 68], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = useIn(68);
  const s = useIn(90);
  const m = useIn(6, 10);
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", color: C.text, padding: "0 70px", paddingBottom: 520 }}>
        {frame < 70 ? (
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 112, lineHeight: 1.1, opacity: q * qOut, transform: `scale(${0.85 + q * 0.15})` }}>
            Quit every
            <br />
            <span style={{ color: C.celebrate }}>planner app</span>
            <br />
            you tried?
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 132, lineHeight: 1.04, opacity: t, transform: `scale(${0.8 + t * 0.2})` }}>
              5 BEST
              <br />
              <span style={{ color: C.primary2 }}>ADHD PLANNER</span>
              <br />
              APPS
            </div>
            <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 56, color: C.muted, opacity: s, lineHeight: 1.3 }}>
              and who each one is for
            </div>
          </div>
        )}
      </AbsoluteFill>
      <Img
        src={staticFile(frame < 70 ? "mascots/foco_state_6_pause.png" : "mascots/foco_state_1_presence.png")}
        style={{ position: "absolute", bottom: 90, left: "50%", width: 480, transform: `translateX(-50%) translateY(${(1 - m) * 300 + Math.sin(frame / 10) * 12}px)`, opacity: m }}
      />
    </AbsoluteFill>
  );
};

// Real App Store screenshot, crossfading between shots with a slow zoom
const Screens: React.FC<{ app: App; starts: number[] }> = ({ app, starts }) => {
  const frame = useCurrentFrame();
  const enter = useIn(SHOT_START - 8, 13);
  return (
    <div
      style={{
        position: "relative", width: 470, height: Math.round(470 * (WIDE_SHOTS.includes(app.id) ? 1.778 : 2.173)), borderRadius: 46, overflow: "hidden", flexShrink: 0,
        border: `5px solid ${app.color}`, boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${app.color}55`, background: "#000",
        opacity: enter, transform: `translateY(${(1 - enter) * 120}px) rotate(${(1 - enter) * -6}deg)`,
      }}
    >
      {app.shots.map((s, i) => {
        const next = starts[i + 1] ?? 100000;
        const op = interpolate(frame, [starts[i] - 8, starts[i], next - 8, next], [i === 0 ? 1 : 0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const zoom = interpolate(frame, [starts[i], starts[i] + 120], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <Img
            key={s}
            src={staticFile(`apps/${app.id}-${s}.png`)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: op, transform: `scale(${zoom})`, transformOrigin: "top center" }}
          />
        );
      })}
    </div>
  );
};

const AppScene: React.FC<{ app: App }> = ({ app }) => {
  const frame = useCurrentFrame();
  const q = useIn(0);
  const card = useIn(14, 12);
  const seg = (app.duration - SHOT_START - 10) / app.shots.length;
  const starts = app.shots.map((_, i) => Math.round(SHOT_START + i * seg));
  const bar = interpolate(frame, [0, app.duration], [0, 1], { extrapolateRight: "clamp" });
  const isFoco = app.rank === 1;
  return (
    <AbsoluteFill>
      <Background glow={isFoco ? "rgba(251, 146, 60, 0.30)" : undefined} />
      <Countdown active={app.rank} />
      <AbsoluteFill style={{ padding: "200px 60px 0", color: C.text }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 74, lineHeight: 1.12, textAlign: "center", opacity: q, transform: `translateY(${(1 - q) * 40}px)` }}>
          {app.question}
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 32, opacity: card, transform: `scale(${0.7 + card * 0.3})`, transformOrigin: "left center" }}>
          <Img src={staticFile(`apps/${app.id}-icon.png`)} style={{ width: 140, height: 140, borderRadius: 34, boxShadow: `0 0 50px ${app.color}66` }} />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: app.color }}>#{app.rank} · Try</div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 112, lineHeight: 1 }}>{app.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 50, display: "flex", gap: 30, alignItems: "flex-start" }}>
          <Screens app={app} starts={starts} />
          <div style={{ display: "flex", flexDirection: "column", gap: 26, paddingTop: 20 }}>
            {app.benefits.map((b, i) => {
              const s = spring({ frame: frame - starts[i] - 4, fps: 30, config: { damping: 14 } });
              const active = frame >= starts[i] && frame < (starts[i + 1] ?? Infinity);
              return (
                <div
                  key={b}
                  style={{
                    display: "flex", flexDirection: "column", gap: 16, opacity: s, transform: `translateX(${(1 - s) * 80}px)`,
                    fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.2, padding: "28px 28px", borderRadius: 28,
                    background: active ? "rgba(255,255,255,0.1)" : "rgba(10,4,16,0.75)",
                    border: `3px solid ${active ? app.color : "rgba(167,139,250,0.25)"}`,
                  }}
                >
                  <Check color={isFoco ? C.celebrate : C.green} />
                  {b}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 70, left: 90, right: 90, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 999, background: app.color }} />
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const m = useIn(0, 10);
  const a = useIn(10);
  const b = useIn(28);
  const c = useIn(44);
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, textAlign: "center", color: C.text }}>
        <Img src={staticFile("mascots/foco_state_2_alignment.png")} style={{ width: 540, opacity: m, transform: `scale(${0.6 + m * 0.4}) translateY(${Math.sin(frame / 10) * 12}px)` }} />
        <div style={{ marginTop: 40, fontFamily: HEAD, fontWeight: 800, fontSize: 108, lineHeight: 1.08, opacity: a, transform: `translateY(${(1 - a) * 50}px)`, padding: "0 70px" }}>
          Stuck on
          <br />
          <span style={{ color: C.primary2 }}>step one?</span>
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 56, color: C.muted, opacity: b, padding: "0 90px", lineHeight: 1.3 }}>
          Get FOCO on iPhone + Android
        </div>
        <div style={{ marginTop: 60, opacity: c, transform: `scale(${0.8 + c * 0.2})`, background: "#FFFFFF", borderRadius: 36, padding: "26px 50px", display: "flex", alignItems: "center", gap: 30, boxShadow: "0 0 80px rgba(124,58,237,0.6)" }}>
          <Img src={staticFile("foco-logo.png")} style={{ height: 90 }} />
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: C.primary }}>tryfoco.com</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ALL = [...APPS, FOCO];
export const TOTAL = HOOK + ALL.reduce((s, a) => s + a.duration, 0) + CTA - T * (ALL.length + 1);

// Frame where each slide transition begins (start of every overlap)
const CUTS = ALL.reduce<number[]>((acc, a, i) => acc.concat(i === 0 ? HOOK - T : acc[i - 1] + ALL[i - 1].duration - T), []);
const FOCO_START = CUTS[CUTS.length - 1];

export const BestPlannerApps: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Audio src={staticFile("music.wav")} volume={0.8} />
      {CUTS.map((f) => (
        <Sequence key={f} from={f} durationInFrames={30}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={FOCO_START + 16} durationInFrames={60}>
        <Audio src={staticFile("sfx/ding.wav")} volume={0.45} />
      </Sequence>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK}>
          <Hook />
        </TransitionSeries.Sequence>
        {ALL.map((app) => (
          <React.Fragment key={app.id}>
            <TransitionSeries.Transition presentation={slide({ direction: app.rank === 1 ? "from-bottom" : "from-right" })} timing={linearTiming({ durationInFrames: T })} />
            <TransitionSeries.Sequence durationInFrames={app.duration}>
              <AppScene app={app} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={CTA}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
