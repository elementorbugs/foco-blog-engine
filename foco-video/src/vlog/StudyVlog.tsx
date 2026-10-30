// Study vlog v3 (2026-10-30), the hachanndayy/Tiimo format Adi asked for: ONE person (same hands, cream sweater, gold
// ring), ONE cosy cafe table, a phone that is part of the work. Stills from Arcads nano-banana (free daily allowance,
// public/vlog/ai/01-06.png, every phone drawn with a blank white screen), FOCO's real screen recording ("Finish research
// paper" -> 1-min steps -> Start Focus, from Adi's "task planner app for adhd" ad) and drawn timer/done screens are
// mapped into the phones with matrix3d (corners + white-pixel masks from phones.json, so the tapping finger stays in
// front). Slow handheld drift + push-in on every still, soft typewriter text, upbeat lofi bed.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";
import { Audio, Video } from "@remotion/media";
import PHONES from "../../public/vlog/ai/phones.json";
import { Timer } from "./FocoScreen";

const ROUND = "Fredoka";
const fontHandle = delayRender("study vlog font");
new FontFace(ROUND, `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" }).load().then((f) => { document.fonts.add(f); continueRender(fontHandle); });

const TASK = "Finish research paper";
type Screen = { kind: "off" } | { kind: "rec"; from: number } | { kind: "timer"; step: string; elapsed: number } | { kind: "done" };
type Shot = { img: string; dur: number; screens: Screen[]; text: string[]; textAt?: number[]; drift: [number, number] };

const SHOTS: Shot[] = [
  { img: "01", dur: 2.6, screens: [{ kind: "off" }], text: ["study vlog ☕", "with an ADHD brain"], textAt: [0.2, 1.0], drift: [-1, 1] },
  { img: "02", dur: 3.0, screens: [{ kind: "rec", from: 0.45 }], text: ["this paper felt too big to start", "so FOCO split it into 1-min steps"], textAt: [0.15, 1.5], drift: [1, -1] },
  { img: "03", dur: 2.6, screens: [{ kind: "rec", from: 1.75 }], text: ["step 1: just open the doc"], drift: [-1, -1] },
  { img: "04", dur: 2.6, screens: [{ kind: "timer", step: "Open your document", elapsed: 4 }], text: ["timer on, rain sounds on 🎧"], drift: [1, 1] },
  { img: "05", dur: 2.6, screens: [{ kind: "timer", step: "Skim the paper", elapsed: 12 }, { kind: "off" }], text: ["...then I just kept going"], drift: [-1, 1] },
  { img: "06", dur: 3.0, screens: [{ kind: "done" }], text: ["one tiny step at a time 💜", "FOCO"], textAt: [0.2, 1.1], drift: [1, -1] },
];
const starts = SHOTS.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + SHOTS[i - 1].dur : 0], []);
export const STUDY_TOTAL = Math.round((starts[starts.length - 1] + SHOTS[SHOTS.length - 1].dur) * 30);

const P = PHONES as unknown as { screen: [number, number]; phones: Record<string, { mask: string; matrix: string }[]> };
const [SW, SH] = P.screen;
const IMG_H = Math.round(1080 * 2752 / 1536);

const Done: React.FC = () => (
  <AbsoluteFill style={{ background: "#00020f", alignItems: "center", fontFamily: "Poppins", color: "#fff" }}>
    <div style={{ position: "absolute", top: 260, fontWeight: 800, fontSize: 92 }}>You did it! 🎉</div>
    <div style={{ position: "absolute", top: 400, fontWeight: 600, fontSize: 40, color: "#b8b0cc" }}>That's one focused step forward</div>
    <Img src={staticFile("mascots-hd/completion.png")} style={{ position: "absolute", top: 560, width: 560, height: 560, objectFit: "contain" }} />
    <div style={{ position: "absolute", top: 1180, fontWeight: 700, fontSize: 48 }}>{TASK}</div>
    <div style={{ position: "absolute", top: 1260, fontWeight: 600, fontSize: 38, color: "#b8b0cc" }}>2 of 5 steps done</div>
    <div style={{ position: "absolute", top: 1560, width: 820, padding: "40px 0", borderRadius: 60, background: "#7C3AED", textAlign: "center", fontWeight: 700, fontSize: 46 }}>Next step</div>
  </AbsoluteFill>
);

const ScreenView: React.FC<{ s: Screen }> = ({ s }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (s.kind === "off") return <AbsoluteFill style={{ background: "linear-gradient(150deg,#16141c,#050507 60%)" }} />;
  if (s.kind === "done") return <Done />;
  if (s.kind === "timer") return <div style={{ width: 1179, height: 2556, transform: `scale(${SW / 1179})`, transformOrigin: "0 0" }}><Timer elapsed={s.elapsed + f / fps} step={s.step} min={1} /></div>;
  // the real recording is 9:16, the phone ~9:19.5: fit the width, the app's own background fills above and below
  return (
    <AbsoluteFill style={{ background: "#00020f", justifyContent: "center" }}>
      <Video src={staticFile("vlog/ai/focorec.mp4")} trimBefore={Math.round(s.from * fps)} muted style={{ width: SW, height: SW * 16 / 9 }} />
    </AbsoluteFill>
  );
};

// one still, its phones filled, a slow push-in with a little handheld sway so it reads as filmed
const Still: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = shot.dur * fps, t = f / fps;
  const z = interpolate(f, [0, dur], [1.04, 1.11]);
  const dx = shot.drift[0] * interpolate(f, [0, dur], [0, 26]) + Math.sin(t * 1.7) * 3;
  const dy = shot.drift[1] * interpolate(f, [0, dur], [0, 18]) + Math.cos(t * 1.3) * 3;
  const rot = Math.sin(t * 0.9) * 0.25;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: (1920 - IMG_H) / 2, width: 1080, height: IMG_H, transform: `translate(${dx}px, ${dy}px) scale(${z}) rotate(${rot}deg)`, filter: "sepia(0.08) saturate(0.97) contrast(0.98)" }}>
        <Img src={staticFile(`vlog/ai/${shot.img}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        {P.phones[shot.img].map((ph, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile(ph.mask)})`, maskImage: `url(${staticFile(ph.mask)})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, overflow: "hidden", transformOrigin: "0 0", transform: ph.matrix, filter: "brightness(0.93)" }}>
              <ScreenView s={shot.screens[i]} />
              {/* glass: soft window reflection so the screen sits in the room's light */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.10), transparent 30%, transparent 75%, rgba(255,255,255,0.05))" }} />
            </div>
          </div>
        ))}
      </div>
      {/* fine grain ties the stills and the screens together */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1, mixBlendMode: "overlay" }}>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2)} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

// soft typewriter text, white with a gentle shadow (the reference's "Study vlog")
const Type: React.FC<{ text: string; at: number; y: number; size: number }> = ({ text, at, y, size }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / 1.3)));
  if (n === 0) return null;
  return <div style={{ position: "absolute", left: 80, right: 160, top: y, textAlign: "center", fontFamily: `${ROUND}, "Noto Color Emoji"`, fontWeight: 600, fontSize: size, lineHeight: 1.2, color: "#fff", WebkitTextStroke: "2px rgba(40,25,15,0.55)", paintOrder: "stroke", textShadow: "0 3px 16px rgba(40,25,15,0.6)" }}>{text.slice(0, n)}</div>;
};

export const StudyVlog: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vol = interpolate(f, [0, 10, STUDY_TOTAL - 24, STUDY_TOTAL], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("music.wav")} volume={vol} />
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={Math.round(starts[i] * fps)} durationInFrames={Math.round(s.dur * fps)}>
          <Still shot={s} />
          {s.text.map((t, j) => (
            <Type key={j} text={t} at={Math.round((s.textAt?.[j] ?? 0.15) * fps)} y={300 + j * 92} size={j === 0 ? 62 : 52} />
          ))}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
