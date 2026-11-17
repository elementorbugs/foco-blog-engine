// "Founder diary" carousel format (2026-11-17), from itskateydixon's launch-diary carousel (viral-lab/references/
// instagram-itskateydixon-Df1T-ipHQCZ): cream paper, real phone photos as taped polaroids, a bold sans headline with
// ONE highlighted word, serif body text, blue handwritten asides, scattered star stickers. Faceless version for FOCO
// (Adi doesn't appear on camera): photos are hands, desk, phone, notebook, screen. Reads like a person, not an ad.
//
// A slide is an ordered stack of blocks, vertically centred inside TikTok's safe band (y 180-1500), so the IG 4:5 crop
// keeps everything. In head/big text, *word* = the highlighted word.
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
import { BODY, EMOJI } from "../Composition";
import { StepCard } from "./MoreCarousels";

const SERIF = "Literata", SCRIPT = "Dancing Script";
const fontHandle = delayRender("diary fonts");
Promise.all([
  new FontFace(SERIF, `url(${staticFile("fonts/Literata-400.woff2")})`, { weight: "400" }).load(),
  new FontFace(SERIF, `url(${staticFile("fonts/Literata-400i.woff2")})`, { style: "italic", weight: "400" }).load(),
  new FontFace(SCRIPT, `url(${staticFile("fonts/DancingScript.ttf")})`, { weight: "400 700" }).load(),
]).then((faces) => {
  faces.forEach((f) => document.fonts.add(f));
  continueRender(fontHandle);
});

const P = {
  paper: "#F4EEE4",
  ink: "#1E1626",
  body: "#3A3040",
  hl: "#6D28D9", // the one highlighted word (FOCO purple instead of the reference's dark red)
  script: "#3D5AC2", // handwritten aside
  starPink: "#F28DB2",
  starBlue: "#4A6FE0",
  tapePink: "rgba(244,170,200,0.75)",
  tapeBlue: "rgba(160,190,240,0.75)",
};

export type DiaryBlock =
  | { t: "head"; text: string; size?: number }
  | { t: "big"; text: string; size?: number }
  | { t: "body"; text: string; size?: number; bold?: boolean }
  | { t: "script"; text: string; size?: number }
  | { t: "quote"; text: string }
  | { t: "photo"; src?: string; w?: number; h?: number; rotate?: number }
  | { t: "badges" }
  // FOCO's first-step card, taped onto the page like a screenshot
  | { t: "foco"; step: string; min: number };

// *word* -> highlighted span
const Hl: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((part, i) =>
      part.startsWith("*") ? <span key={i} style={{ color: P.hl }}>{part.slice(1, -1)}</span> : <React.Fragment key={i}>{part}</React.Fragment>,
    )}
  </>
);

const Tape: React.FC<{ color: string; rotate: number }> = ({ color, rotate }) => (
  <div style={{ position: "absolute", top: -22, left: "50%", width: 120, height: 40, marginLeft: -60, background: color, transform: `rotate(${rotate}deg)`, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }} />
);

const Polaroid: React.FC<{ src: string; w: number; h: number; rotate: number; tape: string }> = ({ src, w, h, rotate, tape }) => (
  <div style={{ position: "relative", padding: "18px 18px 22px", background: "#FFFFFF", transform: `rotate(${rotate}deg)`, boxShadow: "0 14px 30px rgba(40,25,30,0.18), 0 2px 4px rgba(40,25,30,0.10)" }}>
    <Img src={staticFile(src)} style={{ display: "block", width: w, height: h, objectFit: "cover", filter: "saturate(0.92) contrast(0.96) sepia(0.06)" }} />
    <Tape color={tape} rotate={-rotate * 1.5 - 2} />
  </div>
);

const Star: React.FC<{ x: number; y: number; size: number; color: string }> = ({ x, y, size, color }) => (
  <svg style={{ position: "absolute", left: x, top: y, width: size, height: size }} viewBox="0 0 24 24">
    <path d="M12 0 C12.6 7.8 16.2 11.4 24 12 C16.2 12.6 12.6 16.2 12 24 C11.4 16.2 7.8 12.6 0 12 C7.8 11.4 11.4 7.8 12 0 Z" fill={color} />
  </svg>
);

// a few stars per slide, placed in the margins (never over text), varied by slide index
const STAR_SETS: [number, number, number, "p" | "b"][][] = [
  [[50, 980, 46, "b"], [930, 330, 54, "p"], [960, 1180, 44, "b"], [90, 1320, 40, "p"]],
  [[930, 260, 50, "b"], [70, 700, 44, "p"], [950, 980, 40, "p"], [110, 1400, 52, "b"]],
  [[80, 300, 52, "p"], [940, 620, 44, "b"], [60, 1100, 40, "b"], [920, 1380, 50, "p"]],
  [[940, 240, 44, "p"], [60, 560, 52, "b"], [960, 1250, 46, "b"], [80, 1420, 38, "p"]],
];

const Block: React.FC<{ b: DiaryBlock; i: number; slideId: string; slug: string }> = ({ b, i, slideId, slug }) => {
  switch (b.t) {
    case "head":
      return <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: b.size ?? 76, lineHeight: 1.08, letterSpacing: -1.5, color: P.ink, textAlign: "center", textTransform: "lowercase" }}><Hl text={b.text} /></div>;
    case "big":
      return <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: b.size ?? 120, lineHeight: 1.0, letterSpacing: -3, color: P.ink, textAlign: "center" }}><Hl text={b.text} /></div>;
    case "body":
      return <div style={{ fontFamily: `${SERIF}, "${EMOJI}"`, fontWeight: 400, fontSize: b.size ?? 46, lineHeight: 1.36, color: P.body, textAlign: "center", padding: "0 20px", ...(b.bold ? { fontFamily: BODY, fontWeight: 800, color: P.ink } : {}) }}><Hl text={b.text} /></div>;
    case "script":
      return <div style={{ fontFamily: SCRIPT, fontWeight: 500, fontSize: b.size ?? 74, lineHeight: 1.1, color: P.script, textAlign: "center", transform: "rotate(-3deg)" }}>{b.text}</div>;
    case "quote":
      return (
        <div style={{ position: "relative", margin: "0 30px", padding: "44px 44px 40px", background: "#FFFFFF", transform: "rotate(-1deg)", boxShadow: "0 12px 26px rgba(40,25,30,0.14)" }}>
          <div style={{ fontFamily: SERIF, fontSize: 50, lineHeight: 1.32, color: P.ink, textAlign: "center" }}>{b.text}</div>
          <Tape color={P.tapePink} rotate={2} />
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
    case "foco":
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <div style={{ position: "relative", transform: "rotate(-1.5deg) scale(0.98)" }}>
            <StepCard step={b.step} min={b.min} />
            <Tape color={P.tapeBlue} rotate={3} />
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
  return (
    <AbsoluteFill style={{ background: P.paper }}>
      {/* paper grain */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22, mixBlendMode: "multiply" }}>
        <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.40  0 0 0 0.35 0" /></filter>
        <rect width="100%" height="100%" filter="url(#paper)" />
      </svg>
      {stars.map(([x, y, s, c], k) => <Star key={k} x={x} y={y} size={s} color={c === "p" ? P.starPink : P.starBlue} />)}
      <div style={{ position: "absolute", top: 190, bottom: 420, left: 100, right: 150, display: "flex", flexDirection: "column", justifyContent: "center", gap: gap ?? 34 }}>
        {blocks.map((b, i) => <Block key={i} b={b} i={i} slideId={id} slug={slug} />)}
      </div>
    </AbsoluteFill>
  );
};
