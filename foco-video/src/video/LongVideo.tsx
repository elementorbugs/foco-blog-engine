// Script-driven long YouTube video (1920x1080). One script per video in videos/<slug>/script.json;
// voice + word timings in videos/<slug>/vo.json (tts/generate.mjs + tts/analyze.py with VIDEO=<slug>).
// Rendered by videos/render.js, which passes { script, vo } as input props.
import React from "react";
import { AbsoluteFill, Img, Loop, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BODY_STACK, Background, C, HEAD } from "../Composition";
import { Big, Captions, Chip, Mascot, type Scene as VoScene } from "../explainer/Explainer";

export const FPS = 30;
const GAP = 0.5; // breath between scenes (s)
const END_HOLD = 60;

type Beat = { at: string; text?: string; shot?: number };
type Visual =
  | { type: "broll"; query: string; pick?: number; clipSec?: number; overlay?: Beat[] }
  | { type: "bullets"; title: string; note?: string; items: Beat[] }
  | { type: "steps"; title: string; steps: Beat[] }
  | { type: "phones"; items: Beat[] }
  | { type: "cta"; lines: string[] };
type ScriptScene = { id: string; mascot: number; text: string; visual: Visual };
export type VideoScript = { slug: string; title: string; music?: string; scenes: ScriptScene[] };
export type VideoProps = { script: VideoScript; vo: VoScene[] };

const ORANGE = C.celebrate;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, from: number, damping = 14) => spring({ frame: frame - from, fps: FPS, config: { damping } });
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

// Scene-local frame where `phrase` starts being spoken
const atIn = (vo: VoScene, phrase: string) => {
  const words = vo.words.map((w) => norm(w.text));
  const p = phrase.split(" ").map(norm).filter(Boolean);
  for (let i = 0; i + p.length <= words.length; i++) if (p.every((w, k) => words[i + k] === w)) return Math.round(vo.words[i].start * FPS);
  throw new Error(`phrase not found in ${vo.id}: ${phrase}`);
};

export const totalFrames = (vo: VoScene[]) => Math.round((0.4 + vo.reduce((s, v) => s + v.duration + GAP, 0)) * FPS) + END_HOLD;

const Item: React.FC<{ from: number; children: React.ReactNode; active?: boolean }> = ({ from, children, active }) => {
  const frame = useCurrentFrame();
  const s = pop(frame, from);
  return (
    <div style={{ opacity: s, transform: `translateX(${(1 - s) * 80}px)`, display: "flex", alignItems: "center", gap: 24, padding: "22px 30px", borderRadius: 24, background: active ? "rgba(124,58,237,0.28)" : "rgba(255,255,255,0.06)", border: `2px solid ${active ? C.primary2 : "rgba(167,139,250,0.25)"}`, fontFamily: BODY_STACK, fontWeight: 700, fontSize: 46, color: C.text }}>
      {children}
    </div>
  );
};

const Broll: React.FC<{ slug: string; scene: ScriptScene & { visual: { type: "broll" } }; vo: VoScene }> = ({ slug, scene, vo }) => {
  const frame = useCurrentFrame();
  const v = scene.visual;
  const clipFrames = Math.max(1, Math.round((v.clipSec || 60) * FPS) - 2);
  const zoom = interpolate(frame, [0, vo.duration * FPS], [1.04, 1.12], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Loop durationInFrames={clipFrames}>
          <Video src={staticFile(`video/${slug}/broll-${scene.id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9) sepia(0.08)" }} />
        </Loop>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,2,8,0.15) 0%, rgba(4,2,8,0.1) 50%, rgba(4,2,8,0.75) 100%)" }} />
      {(v.overlay || []).map((o) => {
        const from = atIn(vo, o.at);
        const s = pop(frame, from, 12);
        return frame >= from ? (
          <div key={o.at} style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", opacity: s, transform: `scale(${0.8 + s * 0.2})` }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: o.text!.length > 24 ? 56 : 110, color: "#fff", background: "rgba(124,58,237,0.85)", padding: "18px 44px", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>{o.text}</div>
          </div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

const Bullets: React.FC<{ v: Extract<Visual, { type: "bullets" }> | Extract<Visual, { type: "steps" }>; vo: VoScene }> = ({ v, vo }) => {
  const frame = useCurrentFrame();
  const beats = v.type === "steps" ? v.steps : v.items;
  const starts = beats.map((b) => atIn(vo, b.at));
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const t = pop(frame, 0);
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ position: "absolute", left: 130, top: 110, width: 1200 }}>
        <div style={{ opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
          <Big size={v.type === "steps" ? 70 : 84}>{v.title}</Big>
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: v.type === "steps" ? 16 : 22 }}>
          {beats.map((b, i) => (
            <Item key={b.at} from={starts[i]} active={v.type === "steps" && i === current}>
              {v.type === "steps" ? (
                <div style={{ width: 58, height: 58, borderRadius: 999, background: i <= current ? C.primary : "rgba(255,255,255,0.1)", fontFamily: HEAD, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: 999, background: C.primary2, flexShrink: 0 }} />
              )}
              {b.text}
            </Item>
          ))}
        </div>
        {v.type === "bullets" && v.note ? (
          <div style={{ marginTop: 30, fontFamily: BODY_STACK, fontWeight: 700, fontSize: 30, color: C.muted, opacity: pop(frame, 20) }}>ⓘ {v.note}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Phones: React.FC<{ v: Extract<Visual, { type: "phones" }>; vo: VoScene }> = ({ v, vo }) => {
  const frame = useCurrentFrame();
  const starts = v.items.map((b) => atIn(vo, b.at));
  const t = pop(frame, 0);
  return (
    <AbsoluteFill>
      <Background glow="rgba(251,146,60,0.30)" />
      <div style={{ position: "absolute", left: 130, top: 120, display: "flex", alignItems: "center", gap: 28, opacity: t }}>
        <Img src={staticFile("apps/foco-icon.png")} style={{ width: 110, height: 110, borderRadius: 26 }} />
        <div>
          <Chip color={ORANGE}>YOUR BODY DOUBLE IN YOUR POCKET</Chip>
          <Big size={84}>FOCO</Big>
        </div>
      </div>
      <div style={{ position: "absolute", left: 130, top: 360, display: "flex", gap: 34 }}>
        {v.items.map((b, i) => {
          const s = pop(frame, starts[i], 13);
          const active = frame >= starts[i] && (i === v.items.length - 1 || frame < starts[i + 1]);
          return (
            <div key={b.at} style={{ width: 250, height: 540, borderRadius: 34, overflow: "hidden", border: `4px solid ${active ? ORANGE : "rgba(167,139,250,0.4)"}`, boxShadow: active ? "0 0 60px rgba(251,146,60,0.55)" : "0 20px 50px rgba(0,0,0,0.5)", opacity: frame >= starts[i] ? s : 0.18, transform: `translateY(${(1 - s) * 60 + (active ? -20 : 0)}px) scale(${active ? 1.06 : 1})` }}>
              <Img src={staticFile(`apps/foco-${b.shot}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ v: Extract<Visual, { type: "cta" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ position: "absolute", left: 130, top: 130 }}>
        <Chip color={ORANGE}>YOUR CHALLENGE TODAY</Chip>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
          {v.lines.map((l, i) => {
            const s = pop(frame, 20 + i * 40);
            return (
              <div key={l} style={{ opacity: s, transform: `translateX(${(1 - s) * 60}px)`, fontFamily: HEAD, fontWeight: 800, fontSize: 92, color: i === v.lines.length - 1 ? C.primary2 : C.text }}>
                <span style={{ fontFamily: BODY_STACK, fontWeight: 800 }}>{l}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 26, opacity: pop(frame, 160) }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 24, background: "#fff", borderRadius: 30, padding: "18px 34px" }}>
            <Img src={staticFile("foco-logo.png")} style={{ height: 70 }} />
            <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 38, color: C.primary }}>tryfoco.com</div>
          </div>
          <Img src={staticFile("badges/app-store.svg")} style={{ height: 76 }} />
          <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 76 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Mascot placement per visual type (stays clear of text and the captions strip)
const SPOT: Record<Visual["type"], { x: number; y: number; h: number }> = {
  broll: { x: 1640, y: 700, h: 230 },
  bullets: { x: 1420, y: 330, h: 480 },
  steps: { x: 1480, y: 380, h: 420 },
  phones: { x: 1530, y: 420, h: 380 },
  cta: { x: 1330, y: 260, h: 560 },
};

const SceneView: React.FC<{ slug: string; scene: ScriptScene; vo: VoScene; last: boolean }> = ({ slug, scene, vo, last }) => {
  const frame = useCurrentFrame();
  const len = Math.round((vo.duration + GAP) * FPS);
  const enter = interpolate(frame, [0, 10], [0, 1], clamp);
  const exit = last ? 1 : interpolate(frame, [len - 8, len], [1, 0], clamp);
  const v = scene.visual;
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, exit) }}>
      {v.type === "broll" ? <Broll slug={slug} scene={scene as never} vo={vo} /> : null}
      {v.type === "bullets" || v.type === "steps" ? <Bullets v={v} vo={vo} /> : null}
      {v.type === "phones" ? <Phones v={v} vo={vo} /> : null}
      {v.type === "cta" ? <Cta v={v} /> : null}
      <Mascot scene={vo} spot={SPOT[v.type]} />
      <Captions scene={vo} />
    </AbsoluteFill>
  );
};

export const LongVideo: React.FC<VideoProps> = ({ script, vo }) => {
  let t = 0.4;
  const starts = vo.map((v) => {
    const s = t;
    t += v.duration + GAP;
    return Math.round(s * FPS);
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      {script.music ? <Audio src={staticFile(script.music)} volume={0.12} /> : null}
      {script.scenes.map((sc, i) => {
        const v = vo[i];
        const from = starts[i];
        const last = i === script.scenes.length - 1;
        return (
          <React.Fragment key={sc.id}>
            <Sequence from={from} durationInFrames={Math.round((v.duration + GAP) * FPS) + (last ? END_HOLD : 0)}>
              <SceneView slug={script.slug} scene={sc} vo={v} last={last} />
            </Sequence>
            <Sequence from={from} durationInFrames={Math.round(v.duration * FPS) + 5}>
              <Audio src={staticFile(`video/${script.slug}/vo/${sc.id}.wav`)} />
            </Sequence>
            {i > 0 ? (
              <Sequence from={from} durationInFrames={30}>
                <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
