// "Made on a phone" carousel slide (Adi, 2026-11-18: the scrapbook still looked too clean/designed).
// What people really make in 2 minutes on their phone: the real photo full-bleed, native TikTok/Instagram text
// (white with black stroke, or text on a white box), Instagram-pen scribbles (circles, arrows, underlines),
// the iPhone cut-out sticker, crooked screenshots. No paper, no stars, no tape.
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
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
  | { k: "bg"; file: string; pos?: string; zoom?: number }
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
  | { k: "focosteps"; steps: { text: string; min: number }[]; x: number; y: number; w?: number; rot?: number; lit?: number }
  | { k: "badges"; x: number; y: number };

const src = (slug: string, file: string) => staticFile(`carousel/${slug}/${file.split("/").pop()}`);
const rnd = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const PENW = 12;

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

const Stroke: React.FC<{ d: string; color?: string }> = ({ d, color = "#FFFFFF" }) => (
  <svg style={{ position: "absolute", inset: 0, width: 1080, height: 1920, overflow: "visible" }}>
    <path d={d} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={PENW + 6} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={PENW} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Item: React.FC<{ it: StoryItem; slug: string }> = ({ it, slug }) => {
  switch (it.k) {
    case "bg":
      return <Img src={src(slug, it.file)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", objectPosition: it.pos ?? "center", transform: `scale(${it.zoom ?? 1})`, filter: "saturate(1.05) contrast(1.03)" }} />;
    case "txt": {
      const size = it.size ?? 54, style = it.style ?? "stroke";
      const base: React.CSSProperties = { position: "absolute", left: it.x, top: it.y, width: it.w ?? 940, textAlign: it.align ?? "left", transform: `rotate(${it.rot ?? 0}deg)`, transformOrigin: "left top", fontFamily: `${NATIVE}, "${EMOJI}"`, fontWeight: 700, fontSize: size, lineHeight: 1.32, textWrap: "balance" } as React.CSSProperties;
      if (style === "stroke")
        return <div style={{ ...base, color: "#fff", WebkitTextStroke: `${size * 0.16}px #000`, paintOrder: "stroke fill", textShadow: "0 2px 6px rgba(0,0,0,0.25)" } as React.CSSProperties}>{it.text}</div>;
      const dark = style === "dark";
      return (
        <div style={base}>
          <span style={{ background: dark ? "#000" : "#fff", color: dark ? "#fff" : "#000", padding: `${size * 0.1}px ${size * 0.28}px`, borderRadius: size * 0.22, WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone", lineHeight: 1.5 } as React.CSSProperties}>{it.text}</span>
        </div>
      );
    }
    case "hand":
      return <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w ?? 500, transform: `rotate(${it.rot ?? -4}deg)`, fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: it.size ?? 64, lineHeight: 1.05, color: it.color ?? "#fff", WebkitTextStroke: "9px rgba(0,0,0,0.75)", paintOrder: "stroke fill", textShadow: "0 3px 10px rgba(0,0,0,0.35)" } as React.CSSProperties}>{it.text}</div>;
    case "circle":
      return <div style={{ position: "absolute", inset: 0, transform: `rotate(${it.rot ?? 0}deg)`, transformOrigin: `${it.cx}px ${it.cy}px` }}><Stroke d={circlePath(it.cx, it.cy, it.rx, it.ry, it.seed)} color={it.color} /></div>;
    case "arrow":
      return <Stroke d={arrowPath(it.from, it.to, it.bend)} color={it.color} />;
    case "under":
      return <Stroke d={`M${it.from[0]} ${it.from[1]} Q${(it.from[0] + it.to[0]) / 2} ${it.from[1] + 14} ${it.to[0]} ${it.to[1]}`} color={it.color} />;
    case "cutout":
      // iPhone "lift subject" sticker: thick white outline + soft shadow
      return <Img src={src(slug, it.file)} style={{ position: "absolute", left: it.x, top: it.y, height: it.h, transform: `rotate(${it.rot ?? 0}deg)`, filter: "drop-shadow(7px 0 0 #fff) drop-shadow(-7px 0 0 #fff) drop-shadow(0 7px 0 #fff) drop-shadow(0 -7px 0 #fff) drop-shadow(0 16px 22px rgba(0,0,0,0.35))" }} />;
    case "shot":
      return <Img src={src(slug, it.file)} style={{ position: "absolute", left: it.x, top: it.y, width: it.w, borderRadius: 26, transform: `rotate(${it.rot ?? 0}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }} />;
    case "focosteps":
      return <StepsCard steps={it.steps} x={it.x} y={it.y} w={it.w} rot={it.rot} lit={it.lit} tape={false} />;
    case "badges":
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, display: "flex", gap: 20, alignItems: "center", padding: 18, borderRadius: 28, background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}>
          <Img src={staticFile("apps/foco-icon.png")} style={{ width: 90, height: 90, borderRadius: 22 }} />
          <Img src={staticFile("badges/app-store.svg")} style={{ height: 72 }} />
          <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 72 }} />
        </div>
      );
  }
};

export const StorySlide: React.FC<{ slug: string; blocks: StoryItem[] }> = ({ slug, blocks }) => (
  <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
    {blocks.map((it, i) => <Item key={i} it={it} slug={slug} />)}
  </AbsoluteFill>
);
