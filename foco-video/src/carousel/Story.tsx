// "Story" style = "made on a phone" carousel slide (Adi, 2026-11-18: the scrapbook still looked too clean/designed).
// What people really make in 2 minutes on their phone: the real photo full-bleed, native TikTok/Instagram text
// (white with black stroke, or text on a white/black box), Instagram-pen scribbles (circles, arrows, underlines),
// the iPhone cut-out sticker, crooked screenshots. No paper, no stars, no tape.
//
// The same slide renders as a still (carousel) or animated (StoryVideo): pass `t` = local frame and each item
// enters in array order (schedule()), so the video plays the story the way a person would build the story.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { EMOJI } from "../Composition";
import { StepsCard } from "./Diary";

const NATIVE = "Montserrat", PEN = "Kalam", IGSERIF = "Instrument Serif", IGSANS = "Inter";
const h = delayRender("story fonts");
Promise.all([
  new FontFace(NATIVE, `url(${staticFile("fonts/Montserrat.ttf")})`, { weight: "100 900" }).load(),
  new FontFace(PEN, `url(${staticFile("fonts/Kalam-Bold.ttf")})`, { weight: "700" }).load(),
  new FontFace(IGSERIF, `url(${staticFile("fonts/InstrumentSerif.ttf")})`).load(),
  new FontFace(IGSERIF, `url(${staticFile("fonts/InstrumentSerif-Italic.ttf")})`, { style: "italic" }).load(),
  new FontFace(IGSANS, `url(${staticFile("fonts/Inter.ttf")})`, { weight: "100 900" }).load(),
]).then((f) => { f.forEach((x) => document.fonts.add(x)); continueRender(h); });

type Pt = [number, number];
export type StoryItem =
  | { k: "bg"; file: string; pos?: string; zoom?: number; blur?: number; dim?: number }
  // REAL footage as the background (Adi, 2026-11-18: a still "doesn't move, not authentic"). Pre-crop to 1080x1920.
  // Always drawn under the text; a later vid in the same slide is a hard cut, so text (a list) survives the cut.
  | { k: "vid"; file: string; from?: number; dim?: number }
  // TikTok/IG text. stroke = white + black outline (TikTok classic), box = black text on white boxes per line,
  // dark = white text on black boxes. serif / ig = what real mom reels use (Adi, 2026-11-18: the bold stroke text
  // "doesn't create interest", reads like an ad): Instagram's thin editorial serif for the label, small thin sans for
  // the lines, no stroke, no box, just a soft shadow, and it simply appears (a 4-frame fade), like typing it in IG.
  | { k: "txt"; text: string; x: number; y: number; w?: number; size?: number; style?: "stroke" | "box" | "dark" | "serif" | "ig"; italic?: boolean; align?: "left" | "center" | "right"; rot?: number; color?: string }
  // words written with the Instagram pen (handwriting), always with a dark outline so it reads on any photo
  | { k: "hand"; text: string; x: number; y: number; w?: number; size?: number; color?: string; rot?: number }
  | { k: "circle"; cx: number; cy: number; rx: number; ry: number; rot?: number; color?: string; seed?: number }
  | { k: "arrow"; from: Pt; to: Pt; bend?: number; color?: string }
  | { k: "under"; from: Pt; to: Pt; color?: string }
  | { k: "cutout"; file: string; x: number; y: number; h: number; rot?: number }
  | { k: "shot"; file: string; x: number; y: number; w: number; rot?: number }
  | { k: "notif"; from: string; text: string; x: number; y: number; w?: number; rot?: number }
  | { k: "focosteps"; steps: { text: string; min: number }[]; x: number; y: number; w?: number; rot?: number; lit?: number }
  | { k: "badges"; x: number; y: number }
  // FOCO's scanner over a photo of a paper list/planner: purple corners, a sweeping scan line, "N tasks found"
  | { k: "scan"; x: number; y: number; w: number; h: number; found?: string }
  // copy of the real FOCO day view ("It all lands in your day"): what she snapped/said is in her day 1 second later
  | { k: "daycal"; x: number; y: number; w?: number; day: string; date: string; sections: { name: string; tasks: { icon: string; title: string; meta: string; hl?: boolean; done?: boolean }[] }[] }
  // the OFFICIAL FOCO character (public/mascots-hd) as a sticker; only when she starts / finishes, never in the pain part
  | { k: "mascot"; state: "focus" | "completion" | "alignment" | "presence"; x: number; y: number; h: number; rot?: number }
  // feature recap chips for the last slide (say it / snap it / start)
  | { k: "recap"; x: number; y: number; items: { icon: string; text: string }[] }
  // animated download end card (Adi, 2026-11-18): brand ground, FOCO icon drops in with a sparkle burst, the title pops
  // letter by letter, the tagline wipes in, both OFFICIAL store badges spring up and a shine sweeps across them
  | { k: "endcard"; title: string; sub: string };

export const FPS = 30;
// how long each kind takes to "arrive" before the next item starts (frames), and its sound
const STEP: Record<StoryItem["k"], number> = { bg: 4, vid: 0, txt: 10, hand: 12, circle: 10, arrow: 7, under: 7, cutout: 10, shot: 10, notif: 14, focosteps: 28, badges: 10, scan: 30, daycal: 26, mascot: 10, recap: 12, endcard: 60 };
export const SFX: Partial<Record<StoryItem["k"], string>> = { txt: "explainer-sfx/pop.wav", hand: "explainer-sfx/pop-soft.wav", circle: "explainer-sfx/pop-soft.wav", cutout: "explainer-sfx/thud.wav", shot: "explainer-sfx/thud.wav", notif: "sfx/ding.wav", focosteps: "explainer-sfx/check.wav", badges: "explainer-sfx/pop.wav", scan: "sfx/mouse-click.wav", daycal: "explainer-sfx/pop-soft.wav", mascot: "explainer-sfx/pop.wav", recap: "explainer-sfx/pop-soft.wav", endcard: "sfx/whoosh.wav" };

const words = (it: StoryItem) => ("text" in it && it.text ? it.text.split(/\s+/).length : 0);
const fr = (a: number) => (a === Infinity ? 999 : a);
// start frame of every item + total slide length (enter sequence + time to read)
export const schedule = (blocks: StoryItem[]) => {
  let t = 4;
  // optional per-item `wait` (frames): extra pause before the next item, e.g. a list that lands one line per beat
  const starts = blocks.map((b) => { const s = t; t += STEP[b.k] + ((b as { wait?: number }).wait ?? 0); return s; });
  const read = blocks.reduce((n, b) => n + words(b), 0);
  return { starts, dur: Math.round(Math.max(t + 22, t + 8 + read * 3.5)) };
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
const Item: React.FC<{ it: StoryItem; slug: string; a: number; slideT: number; dur: number; lead?: boolean }> = ({ it, slug, a, slideT, dur, lead }) => {
  if (a < 0 && it.k !== "bg" && it.k !== "vid") return null; // the photo is already there during a time-jump / transition
  const sp = (damping = 12, delay = 0) => (a === Infinity ? 1 : spring({ frame: a - delay, fps: FPS, config: { damping, stiffness: 170, mass: 0.8 } }));
  const lin = (n: number) => (a === Infinity ? 1 : ease(a / n));
  switch (it.k) {
    case "vid": {
      if (a === Infinity) return null;
      // the slide's opening footage covers the few lead-in frames too (no black flash before the hook)
      if (a < 0 && !(lead && slideT >= 0 && slideT < 6)) return null;
      return <VidBg file={src(slug, it.file)} from={it.from ?? 0} a={Math.max(0, a)} dim={it.dim} />;
    }
    case "bg": {
      // slow push-in over the whole slide (Ken Burns)
      const z = (it.zoom ?? 1) * (slideT === Infinity ? 1 : 1 + 0.07 * (Math.max(0, slideT) / dur));
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
      if (style === "serif" || style === "ig") {
        const serif = style === "serif";
        return (
          <div style={{ ...base, fontFamily: serif ? `"${IGSERIF}", "${EMOJI}"` : `"${IGSANS}", "${EMOJI}"`, fontWeight: serif ? 400 : 500, fontStyle: it.italic ? "italic" : "normal", letterSpacing: serif ? "-0.01em" : "-0.005em", lineHeight: serif ? 1.05 : 1.3, color: it.color ?? "#fff", opacity: lin(4), textShadow: "0 1px 3px rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.35)" } as React.CSSProperties}>{it.text}</div>
        );
      }
      if (style === "stroke") {
        // TikTok text: each word pops in
        const ws = it.text.split(" ");
        return (
          <div style={{ ...base, color: it.color ?? "#fff", WebkitTextStroke: `${size * 0.16}px #000`, paintOrder: "stroke fill", textShadow: "0 2px 6px rgba(0,0,0,0.25)" } as React.CSSProperties}>
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
    case "scan": {
      // shutter flash, corners snap in, a scan line sweeps the page, then "N tasks found"
      const c = sp(14), sweep = a === Infinity ? 1 : Math.min(1, Math.max(0, (a - 6) / 18));
      const flash = a === Infinity ? 0 : Math.max(0, 1 - a / 5);
      const L = 90, W = 12, col = "#A78BFA";
      const corner = (st: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, ...st }} />;
      return (
        <>
          {flash ? <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${0.85 * flash})` }} /> : null}
          <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, transform: `scale(${1.08 - 0.08 * c})`, opacity: Math.min(1, c * 2) }}>
            {corner({ left: 0, top: 0, borderLeft: `${W}px solid ${col}`, borderTop: `${W}px solid ${col}`, borderTopLeftRadius: 26 })}
            {corner({ right: 0, top: 0, borderRight: `${W}px solid ${col}`, borderTop: `${W}px solid ${col}`, borderTopRightRadius: 26 })}
            {corner({ left: 0, bottom: 0, borderLeft: `${W}px solid ${col}`, borderBottom: `${W}px solid ${col}`, borderBottomLeftRadius: 26 })}
            {corner({ right: 0, bottom: 0, borderRight: `${W}px solid ${col}`, borderBottom: `${W}px solid ${col}`, borderBottomRightRadius: 26 })}
            {sweep < 1 ? <div style={{ position: "absolute", left: 20, right: 20, top: `${sweep * 100}%`, height: 10, borderRadius: 5, background: col, boxShadow: "0 0 30px 10px rgba(167,139,250,0.6)" }} /> : null}
            {sweep >= 1 && it.found ? (
              <div style={{ position: "absolute", left: "50%", top: -34, transform: "translateX(-50%)", whiteSpace: "nowrap", padding: "12px 26px", borderRadius: 40, background: "#7C3AED", color: "#fff", fontFamily: NATIVE, fontWeight: 700, fontSize: 34, boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>✓ {it.found}</div>
            ) : null}
          </div>
        </>
      );
    }
    case "daycal": {
      const s = sp(13);
      let row = 0;
      const rowIn = () => { const r = row++; return a === Infinity ? 1 : Math.min(1, Math.max(0, (a - 8 - r * 3) / 6)); };
      const glow = a === Infinity ? 0.6 : Math.max(0, Math.sin((a - 24) / 6)) * Math.min(1, Math.max(0, (a - 24) / 6));
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w ?? 900, padding: "34px 30px 26px", borderRadius: 44, background: "#0B0B14", border: "2px solid rgba(167,139,250,0.25)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", fontFamily: NATIVE, color: "#fff", transform: `translateY(${(1 - s) * 260}px)`, opacity: Math.min(1, s * 1.6) }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 54, fontWeight: 800 }}>{it.day}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: "#A78BFA" }}>{it.date} ›</div>
            </div>
            <div style={{ width: 76, height: 76, borderRadius: 20, background: "#8B7CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 400 }}>+</div>
          </div>
          {it.sections.map((sec, i) => (
            <div key={i}>
              <div style={{ marginTop: 26, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#8E88A3" }}>{sec.name} <span style={{ color: "#A78BFA" }}>{sec.tasks.length}</span></div>
              {sec.tasks.map((t, j) => {
                const r = rowIn();
                return (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14, padding: "20px 24px", borderRadius: 26, background: t.hl ? "rgba(124,58,237,0.22)" : "#1B1C30", border: t.hl ? "2px solid #8B5CF6" : "2px solid transparent", boxShadow: t.hl ? `0 0 ${30 * glow}px rgba(139,92,246,${0.85 * glow})` : undefined, opacity: r, transform: `translateX(${(1 - r) * 50}px)` }}>
                    <div style={{ width: 58, height: 58, borderRadius: 29, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontFamily: `"${EMOJI}"` }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 34, fontWeight: 700, color: t.done ? "rgba(255,255,255,0.45)" : "#fff", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: "#8E88A3" }}>{t.meta}</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 24, border: `3px solid ${t.done ? "#7C3AED" : "rgba(255,255,255,0.45)"}`, background: t.done ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>{t.done ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    case "mascot": {
      const s = sp(8), bob = a === Infinity ? 0 : Math.sin(a / 11) * 7;
      return <Img src={staticFile(`mascots-hd/${it.state}.png`)} style={{ position: "absolute", left: it.x, top: it.y, height: it.h, opacity: Math.min(1, s * 2), transformOrigin: "50% 90%", transform: `translateY(${bob}px) rotate(${(it.rot ?? 0) + (1 - s) * -14}deg) scale(${0.4 + 0.6 * s})`, filter: "drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(0 14px 20px rgba(0,0,0,0.35))" }} />;
    }
    case "recap":
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, display: "flex", gap: 16, fontFamily: `${NATIVE}, "${EMOJI}"` }}>
          {it.items.map((r, i) => {
            const s = a === Infinity ? 1 : spring({ frame: a - i * 4, fps: FPS, config: { damping: 11, stiffness: 170 } });
            return <div key={i} style={{ padding: "16px 26px", borderRadius: 40, background: "#fff", color: "#111", fontSize: 38, fontWeight: 700, transform: `scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 2), boxShadow: "0 10px 24px rgba(0,0,0,0.3)" }}>{r.icon} {r.text}</div>;
          })}
        </div>
      );
    case "endcard": {
      const t = fr(a);
      const spr = (d: number, damping = 11, stiffness = 160) => spring({ frame: t - d, fps: FPS, config: { damping, stiffness, mass: 0.8 } });
      const icon = spr(0, 9, 140), glow = 0.55 + 0.45 * Math.sin(t / 7);
      const letters = it.title.split("");
      const wipe = Math.min(1, Math.max(0, (t - 26) / 14));
      const bA = spr(34, 12), bG = spr(40, 12);
      const shine = ((t - 52) % 54) / 54; // sweeps every ~1.8 s once the badges land
      const sparks = Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2 + 0.3, p = Math.min(1, Math.max(0, (t - 6) / 22)), d = 120 + 260 * ease(p);
        return { x: 540 + Math.cos(ang) * d, y: 590 + Math.sin(ang) * d * 0.85, o: p > 0 && p < 1 ? 1 - p : 0, r: i % 3 === 0 ? 12 : 7, c: i % 2 ? "#FB923C" : "#A78BFA" };
      });
      const Badge: React.FC<{ file: string; s: number; from: number }> = ({ file, s: b, from }) => (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, transform: `translateY(${(1 - b) * 260}px) translateX(${(1 - b) * from}px) scale(${0.7 + 0.3 * b})`, opacity: Math.min(1, b * 2), boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}>
          <Img src={staticFile(file)} style={{ height: 120, display: "block" }} />
          {t > 52 ? <div style={{ position: "absolute", top: -20, bottom: -20, width: 90, left: `${-30 + shine * 160}%`, background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "skewX(-18deg)" }} /> : null}
        </div>
      );
      return (
        <AbsoluteFill style={{ background: "linear-gradient(160deg, #040208 0%, #0a0410 35%, #1a0a2e 65%, #2d1257 100%)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 540 - 520, top: 590 - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, rgba(124,58,237,${0.45 * glow}) 0%, rgba(124,58,237,0) 62%)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 8, background: "linear-gradient(90deg, #7C3AED, #A78BFA, #7C3AED)" }} />
          {sparks.map((p, i) => <div key={i} style={{ position: "absolute", left: p.x - p.r, top: p.y - p.r, width: p.r * 2, height: p.r * 2, borderRadius: "50%", background: p.c, opacity: p.o, boxShadow: `0 0 14px ${p.c}` }} />)}
          <Img src={staticFile("apps/foco-icon.png")} style={{ position: "absolute", left: 540 - 140, top: 450, width: 280, height: 280, borderRadius: 64, transform: `translateY(${(1 - icon) * -420}px) scale(${0.4 + 0.6 * icon}) rotate(${(1 - icon) * -14}deg)`, boxShadow: `0 0 ${50 + 40 * glow}px rgba(167,139,250,${0.7 * glow})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontFamily: NATIVE, fontWeight: 900, fontSize: 84, color: "#fff", letterSpacing: 2, whiteSpace: "pre" }}>
            {letters.map((ch, i) => { const l = spr(14 + i * 1.3, 10, 200); return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - l) * 60}px) scale(${0.3 + 0.7 * l})`, opacity: Math.min(1, l * 2) }}>{ch === " " ? " " : ch}</span>; })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 915, textAlign: "center", fontFamily: NATIVE, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: "#A78BFA", clipPath: `inset(0 ${(1 - wipe) * 50}% 0 ${(1 - wipe) * 50}%)` }}>{it.sub}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", gap: 26 }}>
            <Badge file="badges/app-store.svg" s={bA} from={-120} />
            <Badge file="badges/google-play-cropped.png" s={bG} from={120} />
          </div>
        </AbsoluteFill>
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

// footage starts at its own entrance: a Sequence anchored at (now - a) so the clip's frame 0 = the item's start
const VidBg: React.FC<{ file: string; from: number; a: number; dim?: number }> = ({ file, from, a, dim }) => {
  const f = useCurrentFrame();
  return (
    <Sequence from={f - a} layout="none">
      <OffthreadVideo src={file} startFrom={Math.round(from * FPS)} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover" }} />
      {dim ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} /> : null}
    </Sequence>
  );
};

export const StorySlide: React.FC<{ slug: string; blocks: StoryItem[]; t?: number }> = ({ slug, blocks, t }) => {
  const { starts, dur } = schedule(blocks);
  const T = t ?? Infinity;
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      {/* footage first (under everything), then the rest in order */}
      {blocks.map((it, i) => (it.k === "vid" ? <Item key={i} it={it} slug={slug} a={T === Infinity ? Infinity : T - starts[i]} slideT={T} dur={dur} lead={i === blocks.findIndex((b) => b.k === "vid")} /> : null))}
      {blocks.map((it, i) => (it.k !== "vid" ? <Item key={i} it={it} slug={slug} a={T === Infinity ? Infinity : T - starts[i]} slideT={T} dur={dur} /> : null))}
    </AbsoluteFill>
  );
};

// keep interpolate imported for callers that animate transitions with the same easing
export { interpolate };
