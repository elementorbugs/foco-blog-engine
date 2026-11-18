// "Story" style = "made on a phone" carousel slide (Adi, 2026-11-18: the scrapbook still looked too clean/designed).
// What people really make in 2 minutes on their phone: the real photo full-bleed, native TikTok/Instagram text
// (white with black stroke, or text on a white/black box), Instagram-pen scribbles (circles, arrows, underlines),
// the iPhone cut-out sticker, crooked screenshots. No paper, no stars, no tape.
//
// The same slide renders as a still (carousel) or animated (StoryVideo): pass `t` = local frame and each item
// enters in array order (schedule()), so the video plays the story the way a person would build the story.
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, spring, staticFile } from "remotion";
import { EMOJI } from "../Composition";
import { StepsCard } from "./Diary";

const NATIVE = "Montserrat", PEN = "Kalam";
const h = delayRender("story fonts");
Promise.all([
  new FontFace(NATIVE, `url(${staticFile("fonts/Montserrat.ttf")})`, { weight: "100 900" }).load(),
  new FontFace(PEN, `url(${staticFile("fonts/Kalam-Bold.ttf")})`, { weight: "700" }).load(),
]).then((f) => { f.forEach((x) => document.fonts.add(x)); continueRender(h); });

type Pt = [number, number];
export type StoryItem =
  | { k: "bg"; file: string; pos?: string; zoom?: number; blur?: number; dim?: number }
  // TikTok/IG text. stroke = white + black outline (TikTok classic), box = black text on white boxes per line,
  // dark = white text on black boxes
  | { k: "txt"; text: string; x: number; y: number; w?: number; size?: number; style?: "stroke" | "box" | "dark"; align?: "left" | "center" | "right"; rot?: number }
  // words written with the Instagram pen (handwriting), always with a dark outline so it reads on any photo
  | { k: "hand"; text: string; x: number; y: number; w?: number; size?: number; color?: string; rot?: number }
  | { k: "circle"; cx: number; cy: number; rx: number; ry: number; rot?: number; color?: string; seed?: number }
  | { k: "arrow"; from: Pt; to: Pt; bend?: number; color?: string }
  | { k: "under"; from: Pt; to: Pt; color?: string }
  | { k: "cutout"; file: string; x: number; y: number; h: number; rot?: number }
  | { k: "shot"; file: string; x: number; y: number; w: number; rot?: number }
  | { k: "notif"; from: string; text: string; x: number; y: number; w?: number; rot?: number }
  | { k: "focosteps"; steps: { text: string; min: number }[]; x: number; y: number; w?: number; rot?: number; lit?: number }
  | { k: "badges"; x: number; y: number };

export const FPS = 30;
// how long each kind takes to "arrive" before the next item starts (frames), and its sound
const STEP: Record<StoryItem["k"], number> = { bg: 4, txt: 10, hand: 12, circle: 10, arrow: 7, under: 7, cutout: 10, shot: 10, notif: 14, focosteps: 28, badges: 10 };
export const SFX: Partial<Record<StoryItem["k"], string>> = { txt: "explainer-sfx/pop.wav", hand: "explainer-sfx/pop-soft.wav", circle: "explainer-sfx/pop-soft.wav", cutout: "explainer-sfx/thud.wav", shot: "explainer-sfx/thud.wav", notif: "sfx/ding.wav", focosteps: "explainer-sfx/check.wav", badges: "explainer-sfx/pop.wav" };

const words = (it: StoryItem) => ("text" in it && it.text ? it.text.split(/\s+/).length : 0);
// start frame of every item + total slide length (enter sequence + time to read)
export const schedule = (blocks: StoryItem[]) => {
  let t = 4;
  const starts = blocks.map((b) => { const s = t; t += STEP[b.k]; return s; });
  const read = blocks.reduce((n, b) => n + words(b), 0);
  return { starts, dur: Math.round(Math.max(t + 26, t + 10 + read * 4.2)) };
};

const src = (slug: string, file: string) => staticFile(`carousel/${slug}/${file.split("/").pop()}`);
const rnd = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const PENW = 12;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// hand-drawn ellipse: wobbly radius, starts and overshoots like a real pen loop
const circlePath = (cx: number, cy: number, rx: number, ry: number, seed = 3) => {
  const r = rnd(seed), pts: Pt[] = [], a0 = -2.2, n = 46;
  for (let i = 0; i <= n; i++) {
    const t = a0 + (i / n) * (Math.PI * 2 + 0.55), k = 1 + (r() - 0.5) * 0.05 + (i / n) * 0.06;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
};
const arrowPath = (a: Pt, b: Pt, bend = 0.25) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const c: Pt = [mx - dy * bend, my + dx * bend];
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0]), L = 46;
  const h1: Pt = [b[0] - L * Math.cos(ang - 0.5), b[1] - L * Math.sin(ang - 0.5)];
  const h2: Pt = [b[0] - L * Math.cos(ang + 0.5), b[1] - L * Math.sin(ang + 0.5)];
  return `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]} M${h1[0]} ${h1[1]} L${b[0]} ${b[1]} L${h2[0]} ${h2[1]}`;
};

// p = how much of the stroke is drawn (0..1), so pen marks draw themselves in the video
const Stroke: React.FC<{ d: string; color?: string; p?: number }> = ({ d, color = "#FFFFFF", p = 1 }) => {
  const dash = p >= 1 ? {} : { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p };
  return (
    <svg style={{ position: "absolute", inset: 0, width: 1080, height: 1920, overflow: "visible" }}>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={PENW + 6} strokeLinecap="round" strokeLinejoin="round" {...dash} />
      <path d={d} fill="none" stroke={color} strokeWidth={PENW} strokeLinecap="round" strokeLinejoin="round" {...dash} />
    </svg>
  );
};

// a = frames since this item started (Infinity = still image, fully shown)
const Item: React.FC<{ it: StoryItem; slug: string; a: number; slideT: number; dur: number }> = ({ it, slug, a, slideT, dur }) => {
  if (a < 0) return null;
  const sp = (damping = 12, delay = 0) => (a === Infinity ? 1 : spring({ frame: a - delay, fps: FPS, config: { damping, stiffness: 170, mass: 0.8 } }));
  const lin = (n: number) => (a === Infinity ? 1 : ease(a / n));
  switch (it.k) {
    case "bg": {
      // slow push-in over the whole slide (Ken Burns)
      const z = (it.zoom ?? 1) * (slideT === Infinity ? 1 : 1 + 0.07 * (slideT / dur));
      return (
        <>
          <Img src={src(slug, it.file)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", objectPosition: it.pos ?? "center", transform: `scale(${z})`, filter: `saturate(1.05) contrast(1.03)${it.blur ? ` blur(${it.blur}px)` : ""}` }} />
          {it.dim ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${it.dim})` }} /> : null}
        </>
      );
    }
    case "txt": {
      const size = it.size ?? 54, style = it.style ?? "stroke";
      const base: React.CSSProperties = { position: "absolute", left: it.x, top: it.y, width: it.w ?? 940, textAlign: it.align ?? "left", transform: `rotate(${it.rot ?? 0}deg)`, transformOrigin: "left top", fontFamily: `${NATIVE}, "${EMOJI}"`, fontWeight: 700, fontSize: size, lineHeight: 1.32, textWrap: "balance" } as React.CSSProperties;
      if (style === "stroke") {
        // TikTok text: each word pops in
        const ws = it.text.split(" ");
        return (
          <div style={{ ...base, color: "#fff", WebkitTextStroke: `${size * 0.16}px #000`, paintOrder: "stroke fill", textShadow: "0 2px 6px rgba(0,0,0,0.25)" } as React.CSSProperties}>
            {ws.map((w, i) => {
              const s = sp(11, i * 2.2);
              return <span key={i} style={{ display: "inline-block", transform: `scale(${0.55 + 0.45 * s}) translateY(${(1 - s) * 18}px)`, opacity: Math.min(1, s * 1.6), marginRight: "0.26em" }}>{w}</span>;
            })}
          </div>
        );
      }
      const dark = style === "dark", s = sp(13);
      return (
        <div style={{ ...base, opacity: Math.min(1, s * 1.5), transform: `${base.transform} translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})` }}>
          <span style={{ background: dark ? "#000" : "#fff", color: dark ? "#fff" : "#000", padding: `${size * 0.1}px ${size * 0.28}px`, borderRadius: size * 0.22, WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone", lineHeight: 1.5 } as React.CSSProperties}>{it.text}</span>
        </div>
      );
    }
    case "hand": {
      // the words get "written": a left-to-right wipe at handwriting speed
      const p = lin(Math.max(12, it.text.length * 0.9));
      return <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w ?? 500, transform: `rotate(${it.rot ?? -4}deg)`, clipPath: `inset(-20px ${100 - p * 100}% -20px -20px)`, fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: it.size ?? 64, lineHeight: 1.05, color: it.color ?? "#fff", WebkitTextStroke: "9px rgba(0,0,0,0.75)", paintOrder: "stroke fill", textShadow: "0 3px 10px rgba(0,0,0,0.35)" } as React.CSSProperties}>{it.text}</div>;
    }
    case "circle":
      return <div style={{ position: "absolute", inset: 0, transform: `rotate(${it.rot ?? 0}deg)`, transformOrigin: `${it.cx}px ${it.cy}px` }}><Stroke d={circlePath(it.cx, it.cy, it.rx, it.ry, it.seed)} color={it.color} p={lin(14)} /></div>;
    case "arrow":
      return <Stroke d={arrowPath(it.from, it.to, it.bend)} color={it.color} p={lin(10)} />;
    case "under":
      return <Stroke d={`M${it.from[0]} ${it.from[1]} Q${(it.from[0] + it.to[0]) / 2} ${it.from[1] + 14} ${it.to[0]} ${it.to[1]}`} color={it.color} p={lin(9)} />;
    case "cutout": {
      // iPhone "lift subject" sticker: slapped on with a bounce, then a tiny idle float
      const s = sp(9), bob = a === Infinity ? 0 : Math.sin(a / 14) * 4;
      return <Img src={src(slug, it.file)} style={{ position: "absolute", left: it.x, top: it.y, height: it.h, opacity: Math.min(1, s * 2), transformOrigin: "50% 80%", transform: `translateY(${bob}px) rotate(${(it.rot ?? 0) + (1 - s) * 10}deg) scale(${1.35 - 0.35 * s})`, filter: "drop-shadow(7px 0 0 #fff) drop-shadow(-7px 0 0 #fff) drop-shadow(0 7px 0 #fff) drop-shadow(0 -7px 0 #fff) drop-shadow(0 16px 22px rgba(0,0,0,0.35))" }} />;
    }
    case "shot": {
      const s = sp(12);
      return <Img src={src(slug, it.file)} style={{ position: "absolute", left: it.x, top: it.y, width: it.w, borderRadius: 26, opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 160}px) rotate(${(it.rot ?? 0) + (1 - s) * 9}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }} />;
    }
    case "notif": {
      // iOS banner drops from the top
      const s = sp(13);
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w ?? 900, padding: "24px 28px", borderRadius: 34, background: "rgba(245,245,248,0.96)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)", fontFamily: `${NATIVE}, "${EMOJI}"`, transform: `translateY(${(1 - s) * -420}px) rotate(${it.rot ?? 0}deg)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 600, color: "#8A8494" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(#5AB0FF,#1E6FF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✉️</div>
            <span style={{ flex: 1 }}>Mail</span><span>now</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 38, fontWeight: 800, color: "#111" }}>{it.from}</div>
          <div style={{ marginTop: 4, fontSize: 36, fontWeight: 600, lineHeight: 1.25, color: "#333" }}>{it.text}</div>
        </div>
      );
    }
    case "focosteps": {
      const s = sp(13);
      return (
        <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * 120}px)` }}>
          <StepsCard steps={it.steps} x={it.x} y={it.y} w={it.w} rot={it.rot} lit={it.lit} tape={false} reveal={a === Infinity ? undefined : a} />
        </div>
      );
    }
    case "badges": {
      const s = sp(10);
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, display: "flex", gap: 20, alignItems: "center", padding: 18, borderRadius: 28, background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.3)", transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 2) }}>
          <Img src={staticFile("apps/foco-icon.png")} style={{ width: 90, height: 90, borderRadius: 22 }} />
          <Img src={staticFile("badges/app-store.svg")} style={{ height: 72 }} />
          <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 72 }} />
        </div>
      );
    }
  }
};

export const StorySlide: React.FC<{ slug: string; blocks: StoryItem[]; t?: number }> = ({ slug, blocks, t }) => {
  const { starts, dur } = schedule(blocks);
  const T = t ?? Infinity;
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      {blocks.map((it, i) => <Item key={i} it={it} slug={slug} a={T === Infinity ? Infinity : T - starts[i]} slideT={T} dur={dur} />)}
    </AbsoluteFill>
  );
};

// keep interpolate imported for callers that animate transitions with the same easing
export { interpolate };
