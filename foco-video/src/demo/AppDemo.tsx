// FOCO app demo (9:16): hook, then real app screenshots inside one phone, then CTA.
// Screens live in public/demo/ (iPhone screenshots, 1179x2556). Tap/zoom points are
// fractions of the screenshot (x, y), so they survive any phone size.
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { BODY, Background, C, HEAD } from "../Composition";

export const DEMO_FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, from: number, damping = 14) => spring({ frame: frame - from, fps: DEMO_FPS, config: { damping } });

type Pt = { x: number; y: number };
type Screen = {
  file: string;
  dur: number;
  caption: React.ReactNode;
  tap?: Pt & { at: number };
  zoom?: Pt & { to: number };
  check?: boolean; // animate step 1 completing (steps screen only)
};

const hl = (s: string) => <span style={{ color: C.celebrate }}>{s}</span>;

const SCREENS: Screen[] = [
  { file: "chat", dur: 120, caption: <>Tell it what you're {hl("avoiding")}</>, tap: { x: 0.45, y: 0.82, at: 70 } },
  { file: "voice", dur: 105, caption: <>Or just {hl("say it")}</>, tap: { x: 0.5, y: 0.8375, at: 40 } },
  { file: "plan", dur: 165, caption: <>It breaks it into {hl("tiny steps")}</> },
  { file: "focus", dur: 165, caption: <>Then stays {hl("with you")} while you do it</>, tap: { x: 0.5, y: 0.859, at: 120 } },
  { file: "steps", dur: 150, caption: <>One {hl("tiny win")} at a time</>, check: true },
  { file: "today", dur: 120, caption: <>No rigid schedule. {hl("Just today.")}</> },
  { file: "menu", dur: 120, caption: <>Stuck again? {hl("Split it smaller")}</>, tap: { x: 0.33, y: 0.81, at: 55 } },
];

const HOOK = 165;
const X = 10; // crossfade between screens
const STARTS: number[] = [];
{
  let t = HOOK;
  for (const s of SCREENS) {
    STARTS.push(t);
    t += s.dur;
  }
}
const DEMO_END = STARTS[STARTS.length - 1] + SCREENS[SCREENS.length - 1].dur;
const CTA = 165;
export const DEMO_TOTAL = DEMO_END + CTA;

// Phone geometry (1080x1920 canvas)
const SCREEN_W = 700;
const SCREEN_H = Math.round((SCREEN_W * 2556) / 1179);
const BEZEL = 18;
const PHONE_TOP = 330;

// ───────────────────────── Hook ─────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const a = pop(f, 6);
  const strike = interpolate(f, [52, 66], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const b = pop(f, 78, 12);
  const out = interpolate(f, [HOOK - 12, HOOK], [1, 0], clamp);
  const m = pop(f, 84, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out, padding: 80 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 92, lineHeight: 1.12, textAlign: "center", color: C.muted, opacity: a * interpolate(f, [66, 80], [1, 0.35], clamp), transform: `translateY(${(1 - a) * 40}px)`, position: "relative" }}>
        Your planner assumes
        <br />
        you can <span style={{ position: "relative", display: "inline-block" }}>
          start.
          <span style={{ position: "absolute", left: -6, right: -6, top: "54%", height: 12, borderRadius: 6, background: C.celebrate, transform: `scaleX(${strike})`, transformOrigin: "left" }} />
        </span>
      </div>
      <Img src={staticFile("mascots/foco_state_2_alignment.png")} style={{ width: 380, height: 380, marginTop: 50, transform: `scale(${m}) translateY(${(1 - m) * 60}px)`, opacity: m }} />
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 108, lineHeight: 1.08, textAlign: "center", marginTop: 30, opacity: b, transform: `scale(${0.85 + b * 0.15})` }}>
        FOCO starts
        <br />
        <span style={{ color: C.primary2 }}>with you.</span>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Phone demo ─────────────────────────
const Ripple: React.FC<{ p: Pt; at: number }> = ({ p, at }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < -12 || t > 30) return null;
  const finger = interpolate(t, [-12, 0, 18, 30], [0, 1, 1, 0], clamp);
  const press = interpolate(t, [-4, 0, 6], [1, 0.82, 1], clamp);
  const ring = interpolate(t, [0, 24], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: p.x * SCREEN_W, top: p.y * SCREEN_H, width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -90 * ring, top: -90 * ring, width: 180 * ring, height: 180 * ring, borderRadius: 999, border: `5px solid ${C.primary2}`, opacity: 1 - ring }} />
      <div style={{ position: "absolute", left: -38, top: -38, width: 76, height: 76, borderRadius: 999, background: "rgba(255,255,255,0.55)", boxShadow: "0 0 30px rgba(167,139,250,0.9)", opacity: finger, transform: `scale(${press})` }} />
    </div>
  );
};

// Step 1 completes: circle fills, progress bar grows, counter flips to 1/5
const CheckAnim: React.FC = () => {
  const f = useCurrentFrame();
  const c = pop(f, 55, 11);
  const bar = interpolate(f, [62, 80], [0, 0.2], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cx = 0.855 * SCREEN_W;
  const cy = 0.5335 * SCREEN_H;
  const r = 0.028 * SCREEN_W;
  return (
    <>
      <div style={{ position: "absolute", left: 0.2145 * SCREEN_W, top: 0.4085 * SCREEN_H, height: 4, width: bar * (0.535 * SCREEN_W), background: C.primary2, borderRadius: 4, boxShadow: `0 0 12px ${C.primary2}` }} />
      <div style={{ position: "absolute", left: 0.69 * SCREEN_W, top: 0.413 * SCREEN_H, width: 0.06 * SCREEN_W, height: 0.02 * SCREEN_H, background: "#1b1f36", opacity: f >= 62 ? 1 : 0, display: "flex", alignItems: "center", justifyContent: "flex-end", fontFamily: BODY, fontWeight: 700, fontSize: 16, color: C.primary2 }}>1/5</div>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: 999, background: C.green, transform: `scale(${c})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#052e12", fontWeight: 800, fontSize: 26, fontFamily: BODY, boxShadow: `0 0 ${24 * c}px ${C.green}` }}>✓</div>
    </>
  );
};

const ScreenLayer: React.FC<{ s: Screen; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame(); // local to this screen's Sequence
  const fadeIn = i === 0 ? 1 : interpolate(f, [0, X], [0, 1], clamp);
  const z = s.zoom ? interpolate(f, [8, s.dur], [1, s.zoom.to], { ...clamp, easing: Easing.inOut(Easing.sin) }) : 1;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: s.zoom ? `${s.zoom.x * 100}% ${s.zoom.y * 100}%` : "50% 50%" }}>
        <Img src={staticFile(`demo/${s.file}.png`)} style={{ width: SCREEN_W, height: SCREEN_H }} />
        {s.check ? <CheckAnim /> : null}
        {s.tap ? <Ripple p={s.tap} at={s.tap.at} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const q = pop(f, 2, 15);
  return (
    <div style={{ position: "absolute", top: 120, left: 60, right: 60, textAlign: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 70, lineHeight: 1.1, opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
      {children}
    </div>
  );
};

const PhoneDemo: React.FC = () => {
  const f = useCurrentFrame(); // local, 0 = first screen
  const len = DEMO_END - HOOK;
  const enter = pop(f, 0, 16);
  const exit = interpolate(f, [len - 14, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const float = Math.sin(f / 28) * 6;
  return (
    <AbsoluteFill>
      {SCREENS.map((s, i) => (
        <Sequence key={s.file} from={STARTS[i] - HOOK} durationInFrames={s.dur} layout="none">
          <Caption>{s.caption}</Caption>
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute", left: (1080 - SCREEN_W) / 2 - BEZEL, top: PHONE_TOP - BEZEL,
          width: SCREEN_W + BEZEL * 2, height: SCREEN_H + BEZEL * 2, borderRadius: 96, padding: BEZEL,
          background: "linear-gradient(160deg,#3a2466,#140a24)",
          boxShadow: "0 40px 120px rgba(124,58,237,0.45), inset 0 0 0 2px rgba(167,139,250,0.45)",
          transform: `translateY(${(1 - enter) * 900 + exit * 1000 + float}px) rotate(${(1 - enter) * 6}deg)`,
        }}
      >
        <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 80, overflow: "hidden", background: "#0b0b16" }}>
          {SCREENS.map((s, i) => (
            <Sequence key={s.file} from={STARTS[i] - HOOK - (i === 0 ? 0 : X)} durationInFrames={s.dur + (i === 0 ? 0 : X)} layout="none">
              <ScreenLayer s={s} i={i} />
            </Sequence>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── CTA ─────────────────────────
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const m = pop(f, 4, 10);
  const t = pop(f, 22);
  const s = pop(f, 40);
  const b = pop(f, 58);
  const bob = Math.sin(f / 14) * 10;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 70 }}>
      <Img src={staticFile("mascots/foco_state_5_completion.png")} style={{ width: 460, height: 460, transform: `scale(${m}) translateY(${bob}px)` }} />
      <Img src={staticFile("foco-logo.png")} style={{ height: 120, marginTop: 30, opacity: t, transform: `scale(${0.8 + t * 0.2})` }} />
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 76, lineHeight: 1.12, textAlign: "center", marginTop: 40, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
        The ADHD planner
        <br />
        that helps you <span style={{ color: C.celebrate }}>start</span>
      </div>
      <div style={{ display: "flex", gap: 28, marginTop: 70, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        <Img src={staticFile("badges/app-store.png")} style={{ height: 110 }} />
        <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 110 }} />
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.muted, marginTop: 34, opacity: b }}>Free to download</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Root ─────────────────────────
const SFX: { file: string; at: number; vol: number }[] = [
  { file: "whoosh", at: 52, vol: 0.5 },
  { file: "switch", at: 84, vol: 0.5 },
  { file: "whoosh", at: HOOK - 4, vol: 0.6 },
  ...SCREENS.flatMap((s, i) => [
    ...(i > 0 ? [{ file: "page-turn", at: STARTS[i] - 4, vol: 0.35 }] : []),
    ...(s.tap ? [{ file: "mouse-click", at: STARTS[i] + s.tap.at, vol: 0.6 }] : []),
    ...(s.check ? [{ file: "ding", at: STARTS[i] + 55, vol: 0.6 }] : []),
  ]),
  { file: "whoosh", at: DEMO_END - 10, vol: 0.6 },
  { file: "ding", at: DEMO_END + 6, vol: 0.5 },
];

export const AppDemo: React.FC = () => {
  const f = useCurrentFrame();
  const music = interpolate(f, [0, 20, DEMO_TOTAL - 40, DEMO_TOTAL], [0, 0.55, 0.55, 0], clamp);
  return (
    <AbsoluteFill style={{ color: C.text, fontFamily: BODY }}>
      <Background />
      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>
      <Sequence from={HOOK} durationInFrames={DEMO_END - HOOK}>
        <PhoneDemo />
      </Sequence>
      <Sequence from={DEMO_END}>
        <Cta />
      </Sequence>
      <Audio src={staticFile("music/dreamscape.mp3")} volume={music} />
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={60} layout="none">
          <Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
