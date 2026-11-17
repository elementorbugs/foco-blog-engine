// "Diary" carousel format (2026-11-17), from itskateydixon's launch-diary carousel (viral-lab/references/
// instagram-itskateydixon-Df1T-ipHQCZ). Adi's feedback on v1: "not really authentic, dirty it up; the handwriting isn't
// clear; cut her out and stick her on with an arrow". So the page is handmade, not designed: crumpled paper, a coffee
// ring, rough torn tape, a marker highlight behind the key word, ballpoint handwriting (Kalam, legible), slight tilts,
// and the person as a cut-out sticker (white outline) with a hand-drawn arrow + note.
//
// A slide is an ordered stack of blocks, vertically centred inside TikTok's safe band (y 180-1500), so the IG 4:5 crop
// keeps everything. In head/big/body text, *word* = the highlighted word.
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
import { BODY, EMOJI } from "../Composition";
import { StepCard } from "./MoreCarousels";

const SERIF = "Literata", PEN = "Kalam";
const fontHandle = delayRender("diary fonts");
Promise.all([
  new FontFace(SERIF, `url(${staticFile("fonts/Literata-400.woff2")})`, { weight: "400" }).load(),
  new FontFace(PEN, `url(${staticFile("fonts/Kalam-Regular.ttf")})`, { weight: "400" }).load(),
  new FontFace(PEN, `url(${staticFile("fonts/Kalam-Bold.ttf")})`, { weight: "700" }).load(),
]).then((faces) => {
  faces.forEach((f) => document.fonts.add(f));
  continueRender(fontHandle);
});

const P = {
  paper: "#F2EBDF",
  ink: "#1E1626",
  body: "#3A3040",
  marker: "rgba(196,170,255,0.85)", // lilac highlighter behind the key word
  pen: "#2340A8", // ballpoint blue
  starPink: "#F28DB2",
  starBlue: "#4A6FE0",
  tapePink: "rgba(244,175,200,0.72)",
  tapeBlue: "rgba(165,192,238,0.72)",
};

export type DiaryBlock =
  | { t: "head"; text: string; size?: number }
  | { t: "big"; text: string; size?: number }
  | { t: "body"; text: string; size?: number; bold?: boolean }
  | { t: "script"; text: string; size?: number }
  | { t: "quote"; text: string }
  | { t: "photo"; src?: string; w?: number; h?: number; rotate?: number }
  // the person cut out as a sticker; file = transparent PNG (path relative to foco-video/, build.js copies it);
  // note = handwritten label with a hand-drawn arrow pointing at her
  | { t: "cutout"; file: string; h?: number; note?: string; side?: "left" | "right"; rotate?: number }
  | { t: "badges" }
  // FOCO's first-step card, taped onto the page like a screenshot
  | { t: "foco"; step: string; min: number }
  // free scrapbook collage: every item placed at x/y (px) inside an 830 x h box, so no slide has dead space
  | { t: "collage"; h: number; items: CollageItem[] };

export type CollageItem =
  | { k: "photo"; file: string; x: number; y: number; w: number; h: number; rot?: number; tape?: "pink" | "blue" }
  | { k: "cutout"; file: string; x: number; y: number; h: number; rot?: number }
  | { k: "note"; text: string; x: number; y: number; size?: number; rot?: number; w?: number }
  | { k: "arrow"; x: number; y: number; w?: number; rot?: number; flip?: boolean }
  | { k: "sticky"; text: string; x: number; y: number; w?: number; rot?: number }
  | { k: "notif"; from: string; text: string; x: number; y: number; w?: number; rot?: number }
  | { k: "focostep"; step: string; min: number; x: number; y: number; scale?: number; rot?: number };

// *word* -> ink text with a rough marker stroke behind it
const Hl: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((part, i) =>
      part.startsWith("*") ? (
        <span key={i} style={{ position: "relative", whiteSpace: "nowrap" }}>
          <span style={{ position: "absolute", left: -8, right: -10, top: "38%", bottom: "2%", background: P.marker, transform: "rotate(-1.6deg) skewX(-8deg)", borderRadius: "3px 10px 5px 12px", zIndex: 0 }} />
          <span style={{ position: "relative", zIndex: 1 }}>{part.slice(1, -1)}</span>
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

// masking tape with torn ends
const Tape: React.FC<{ color: string; rotate: number; style?: React.CSSProperties }> = ({ color, rotate, style }) => (
  <div style={{ position: "absolute", top: -24, left: "50%", width: 150, height: 44, marginLeft: -75, background: color, transform: `rotate(${rotate}deg)`, clipPath: "polygon(3% 0, 97% 4%, 100% 22%, 96% 45%, 99% 70%, 97% 100%, 2% 96%, 0 74%, 4% 52%, 0 28%)", ...style }} />
);

const Polaroid: React.FC<{ src: string; w: number; h: number; rotate: number; tape: string }> = ({ src, w, h, rotate, tape }) => (
  <div style={{ position: "relative", padding: "16px 16px 20px", background: "#FBF8F2", transform: `rotate(${rotate}deg)`, boxShadow: "0 12px 26px rgba(40,25,30,0.20), 0 2px 4px rgba(40,25,30,0.12)" }}>
    <Img src={staticFile(src)} style={{ display: "block", width: w, height: h, objectFit: "cover", filter: "saturate(0.9) contrast(0.95) sepia(0.08)" }} />
    <Tape color={tape} rotate={-rotate * 1.5 - 3} />
  </div>
);

// white sticker outline around a transparent PNG
const STICKER = "drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(0 14px 18px rgba(40,25,30,0.28))";

// hand-drawn curved arrow (points down-right toward the sticker when side = "left")
const Arrow: React.FC<{ flip: boolean; w?: number }> = ({ flip, w = 190 }) => (
  <svg width={w} height={(w * 150) / 190} viewBox="0 0 190 150" style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}>
    <path d="M10 18 C 70 0, 140 30, 160 112" fill="none" stroke={P.pen} strokeWidth={11} strokeLinecap="round" />
    <path d="M128 92 L 161 120 L 182 82" fill="none" stroke={P.pen} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const fileSrc = (slug: string, file: string) => staticFile(`carousel/${slug}/${file.split("/").pop()}`);

const Item: React.FC<{ it: CollageItem; slug: string; n: number }> = ({ it, slug, n }) => {
  const pos: React.CSSProperties = { position: "absolute", left: it.x, top: it.y, transform: `rotate(${it.rot ?? 0}deg)` };
  switch (it.k) {
    case "photo":
      return (
        <div style={{ ...pos, padding: "14px 14px 18px", background: "#FBF8F2", boxShadow: "0 12px 26px rgba(40,25,30,0.22), 0 2px 4px rgba(40,25,30,0.12)" }}>
          <Img src={fileSrc(slug, it.file)} style={{ display: "block", width: it.w, height: it.h, objectFit: "cover", filter: "saturate(0.9) contrast(0.95) sepia(0.08)" }} />
          <Tape color={it.tape === "blue" || (!it.tape && n % 2) ? P.tapeBlue : P.tapePink} rotate={-(it.rot ?? 0) * 1.4 - 3} />
        </div>
      );
    case "cutout":
      return <Img src={fileSrc(slug, it.file)} style={{ ...pos, height: it.h, filter: STICKER }} />;
    case "note":
      return <div style={{ ...pos, width: it.w ?? 320, fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: it.size ?? 54, lineHeight: 1.05, color: P.pen }}>{it.text}</div>;
    case "arrow":
      return <div style={pos}><Arrow flip={!!it.flip} w={it.w ?? 170} /></div>;
    case "sticky":
      return (
        <div style={{ ...pos, width: it.w ?? 280, padding: "26px 22px 30px", background: "#FFE97A", boxShadow: "0 10px 20px rgba(40,25,30,0.18)", fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: 46, lineHeight: 1.08, color: "#2B2233" }}>
          {it.text}
          <Tape color={P.tapeBlue} rotate={-4} style={{ width: 110, marginLeft: -55, top: -20 }} />
        </div>
      );
    case "notif":
      // iOS-style mail notification, drawn (not a screenshot): the message she's been dreading
      return (
        <div style={{ ...pos, width: it.w ?? 760, padding: "22px 26px", borderRadius: 30, background: "rgba(250,250,252,0.97)", boxShadow: "0 18px 40px rgba(20,10,30,0.28)", fontFamily: `${BODY}, "${EMOJI}"` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, fontWeight: 700, color: "#8A8494", letterSpacing: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "linear-gradient(#5AB0FF,#1E6FF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✉️</div>
            <span style={{ flex: 1 }}>MAIL</span><span>now</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, color: "#16121C" }}>{it.from}</div>
          <div style={{ marginTop: 2, fontSize: 34, fontWeight: 700, lineHeight: 1.25, color: "#3A3443" }}>{it.text}</div>
        </div>
      );
    case "focostep":
      return (
        <div style={{ ...pos, transformOrigin: "top left", transform: `rotate(${it.rot ?? -1.5}deg) scale(${it.scale ?? 0.9})` }}>
          <StepCard step={it.step} min={it.min} />
          <Tape color={P.tapeBlue} rotate={4} />
        </div>
      );
  }
};

const Star: React.FC<{ x: number; y: number; size: number; color: string }> = ({ x, y, size, color }) => (
  <svg style={{ position: "absolute", left: x, top: y, width: size, height: size }} viewBox="0 0 24 24">
    <path d="M12 0 C12.6 7.8 16.2 11.4 24 12 C16.2 12.6 12.6 16.2 12 24 C11.4 16.2 7.8 12.6 0 12 C7.8 11.4 11.4 7.8 12 0 Z" fill={color} />
  </svg>
);

// a few stars + one coffee ring per slide, in the margins, varied by slide index
const STAR_SETS: [number, number, number, "p" | "b"][][] = [
  [[50, 980, 42, "b"], [930, 330, 48, "p"], [90, 1320, 36, "p"]],
  [[930, 260, 46, "b"], [70, 700, 40, "p"], [110, 1400, 46, "b"]],
  [[80, 300, 46, "p"], [940, 620, 40, "b"], [920, 1380, 44, "p"]],
  [[940, 240, 40, "p"], [60, 560, 46, "b"], [80, 1420, 36, "p"]],
];
const RINGS: [number, number, number][] = [[880, 1330, 230], [-80, 210, 250], [860, 140, 220], [-60, 1250, 240]];

const Block: React.FC<{ b: DiaryBlock; i: number; slideId: string; slug: string }> = ({ b, i, slideId, slug }) => {
  const tilt = i % 2 ? 0.8 : -0.9;
  switch (b.t) {
    case "head":
      return <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: b.size ?? 76, lineHeight: 1.1, letterSpacing: -1.5, color: P.ink, textAlign: "center", textTransform: "lowercase", transform: `rotate(${tilt}deg)` }}><Hl text={b.text} /></div>;
    case "big":
      return <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: b.size ?? 120, lineHeight: 1.02, letterSpacing: -3, color: P.ink, textAlign: "center", transform: `rotate(${tilt}deg)` }}><Hl text={b.text} /></div>;
    case "body":
      return <div style={{ fontFamily: `${SERIF}, "${EMOJI}"`, fontWeight: 400, fontSize: b.size ?? 46, lineHeight: 1.36, color: P.body, textAlign: "center", padding: "0 20px", ...(b.bold ? { fontFamily: `${BODY}, "${EMOJI}"`, fontWeight: 800, color: P.ink } : {}) }}><Hl text={b.text} /></div>;
    case "script":
      return <div style={{ fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: b.size ?? 64, lineHeight: 1.12, color: P.pen, textAlign: "center", transform: `rotate(${i % 2 ? 2 : -2.5}deg)` }}>{b.text}</div>;
    case "quote":
      return (
        <div style={{ position: "relative", margin: "0 30px", padding: "44px 44px 40px", background: "#FBF8F2", transform: "rotate(-1.2deg)", boxShadow: "0 10px 22px rgba(40,25,30,0.16)" }}>
          <div style={{ fontFamily: `${SERIF}, "${EMOJI}"`, fontSize: 50, lineHeight: 1.32, color: P.ink, textAlign: "center" }}>{b.text}</div>
          <Tape color={P.tapePink} rotate={3} />
        </div>
      );
    case "photo": {
      const rot = b.rotate ?? (i % 2 ? 2.5 : -2.5);
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <Polaroid src={`carousel/${slug}/${b.src ?? slideId}.jpg`} w={b.w ?? 620} h={b.h ?? 620} rotate={rot} tape={i % 2 ? P.tapeBlue : P.tapePink} />
        </div>
      );
    }
    case "cutout": {
      const left = (b.side ?? "left") === "left";
      const img = <Img src={staticFile(`carousel/${slug}/${b.file.split("/").pop()}`)} style={{ height: b.h ?? 640, filter: STICKER, transform: `rotate(${b.rotate ?? (left ? 2 : -2)}deg)` }} />;
      const note = b.note ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: left ? "flex-start" : "flex-end", marginTop: 10, width: 300, flexShrink: 0 }}>
          <div style={{ fontFamily: `${PEN}, "${EMOJI}"`, fontWeight: 700, fontSize: 52, lineHeight: 1.08, color: P.pen, transform: `rotate(${left ? -5 : 5}deg)`, textAlign: left ? "left" : "right" }}>{b.note}</div>
          <div style={{ marginTop: 6, alignSelf: left ? "flex-end" : "flex-start" }}><Arrow flip={!left} /></div>
        </div>
      ) : null;
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 0, padding: "10px 0" }}>
          {left ? note : null}
          {img}
          {left ? null : note}
        </div>
      );
    }
    case "collage":
      return (
        <div style={{ position: "relative", width: 830, height: b.h, alignSelf: "center" }}>
          {b.items.map((it, n) => <Item key={n} it={it} slug={slug} n={n} />)}
        </div>
      );
    case "foco":
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <div style={{ position: "relative", transform: "rotate(-1.5deg) scale(0.98)" }}>
            <StepCard step={b.step} min={b.min} />
            <Tape color={P.tapeBlue} rotate={4} />
          </div>
        </div>
      );
    case "badges":
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
          <Img src={staticFile("apps/foco-icon.png")} style={{ width: 96, height: 96, borderRadius: 24, boxShadow: "0 8px 18px rgba(76,29,149,0.25)" }} />
          <Img src={staticFile("badges/app-store.svg")} style={{ height: 76 }} />
          <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 76 }} />
        </div>
      );
  }
};

export const DiarySlide: React.FC<{ slug: string; id: string; index: number; blocks: DiaryBlock[]; gap?: number }> = ({ slug, id, index, blocks, gap }) => {
  const stars = STAR_SETS[index % STAR_SETS.length];
  const [rx, ry, rr] = RINGS[index % RINGS.length];
  return (
    <AbsoluteFill style={{ background: P.paper }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* crumpled paper: low-frequency noise lit from the top left */}
        <filter id={`crumple${index}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="4" seed={index * 7 + 3} result="n" />
          <feDiffuseLighting in="n" lightingColor="#fff" surfaceScale="3.2" result="l"><feDistantLight azimuth="225" elevation="52" /></feDiffuseLighting>
        </filter>
        <rect width="100%" height="100%" filter={`url(#crumple${index})`} style={{ mixBlendMode: "multiply" }} opacity={0.42} />
        {/* fine grain */}
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.35  0 0 0 0.32 0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" style={{ mixBlendMode: "multiply" }} opacity={0.5} />
        {/* coffee ring */}
        <filter id={`ring${index}`}><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={index + 11} result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="22" /></filter>
        <g filter={`url(#ring${index})`} opacity={0.5}>
          <circle cx={rx} cy={ry} r={rr / 2} fill="none" stroke="rgba(150,100,55,0.35)" strokeWidth={9} />
          <circle cx={rx + 6} cy={ry + 4} r={rr / 2 - 10} fill="none" stroke="rgba(150,100,55,0.16)" strokeWidth={16} />
        </g>
      </svg>
      {stars.map(([x, y, s, c], k) => <Star key={k} x={x} y={y} size={s} color={c === "p" ? P.starPink : P.starBlue} />)}
      <div style={{ position: "absolute", top: 190, bottom: 420, left: 100, right: 150, display: "flex", flexDirection: "column", justifyContent: "center", gap: gap ?? 34 }}>
        {blocks.map((b, i) => <Block key={i} b={b} i={i} slideId={id} slug={slug} />)}
      </div>
    </AbsoluteFill>
  );
};
