// "Cozy app list" carousel format (2026-10-29), from a saved-heavy TikTok photo post (sleepytofuuuu, 68K plays,
// 2.2K saves): cover = a real cozy desk photo + a soft italic-serif title + a row of app icons; then one app per
// slide on beige graph paper (icon, italic serif name, platforms, 3 lowercase bullets, the app's real screen in a
// phone). FOCO is the last app, with the download panel. No competitors in the list, never "all free".
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
import { BODY, EMOJI } from "../Composition";
import { Photo } from "./Carousel";

const SERIF = "Literata", ROUND = "Fredoka";
const fontHandle = delayRender("applist fonts");
Promise.all([
  new FontFace(SERIF, `url(${staticFile("fonts/Literata-400i.woff2")})`, { style: "italic", weight: "400" }).load(),
  new FontFace(ROUND, `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" }).load(),
]).then((faces) => {
  faces.forEach((f) => document.fonts.add(f));
  continueRender(fontHandle);
});

const INK = "#5b4636", SOFT = "#8a735f", PAPER = "#efe6da";

// a store screenshot shown inside the phone; crop = [x0, y0, x1, y1] fractions of the source (drops store captions)
export type Shot = { src: string; size: [number, number]; crop?: [number, number, number, number] };
export type AppInfo = { name: string; icon: string; platforms: string; bullets: string[]; shot: Shot };

const PhoneShot: React.FC<{ shot: Shot; w: number; x: number; y: number }> = ({ shot, w, x, y }) => {
  const h = Math.round(w * 2.08), pad = 12, W = w - pad * 2, H = h - pad * 2;
  const [iw, ih] = shot.size;
  const [x0, y0, x1, y1] = shot.crop ?? [0, 0, 1, 1];
  const cw = (x1 - x0) * iw, ch = (y1 - y0) * ih;
  const k = Math.max(W / cw, H / ch);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: w * 0.16, background: "#1c1714", padding: pad, boxShadow: "0 30px 60px rgba(91,70,54,0.28)" }}>
      <div style={{ position: "relative", width: W, height: H, borderRadius: w * 0.135, overflow: "hidden", background: "#000" }}>
        <Img src={staticFile(shot.src)} style={{ position: "absolute", width: iw * k, height: ih * k, left: -x0 * iw * k + (W - cw * k) / 2, top: -y0 * ih * k + (H - ch * k) / 2 }} />
      </div>
    </div>
  );
};

const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: PAPER, backgroundImage: "linear-gradient(rgba(150,125,100,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(150,125,100,0.16) 2px, transparent 2px)", backgroundSize: "44px 44px" }}>
    {children}
  </AbsoluteFill>
);

// compact = the FOCO slide, which also carries the ask + download panel below (y 1150+)
export const AppSlide: React.FC<{ app: AppInfo; compact?: boolean; ask?: string }> = ({ app, compact, ask }) => (
  <Paper>
    <div style={{ position: "absolute", left: 90, top: 230, display: "flex", alignItems: "center", gap: 34 }}>
      <Img src={staticFile(app.icon)} style={{ width: 160, height: 160, borderRadius: 38, boxShadow: "0 10px 24px rgba(91,70,54,0.22)" }} />
      <div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 78, color: INK, lineHeight: 1.05 }}>{app.name}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 42, color: SOFT, marginTop: 6 }}>{app.platforms}</div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 90, top: compact ? 520 : 560, width: compact ? 470 : 470 }}>
      {app.bullets.map((b) => (
        <div key={b} style={{ display: "flex", gap: 16, marginBottom: compact ? 30 : 44, fontFamily: `${ROUND}, "${EMOJI}"`, fontWeight: 500, fontSize: compact ? 40 : 50, lineHeight: 1.3, color: INK }}>
          <span style={{ color: SOFT }}>•</span>
          <span>{b}</span>
        </div>
      ))}
      {ask && <div style={{ marginTop: 16, display: "inline-block", padding: "14px 26px", borderRadius: 999, background: "#fffaf3", border: "3px solid #d9c9b6", fontFamily: `${ROUND}, "${EMOJI}"`, fontWeight: 600, fontSize: 38, color: INK }}>{ask}</div>}
    </div>
    <PhoneShot shot={app.shot} w={compact ? 330 : 440} x={compact ? 610 : 600} y={compact ? 480 : 520} />
  </Paper>
);

// cover: real photo + title + icons; the last tile is a "+1" teaser so FOCO stays out of the hook
export const AppListCover: React.FC<{ photo: string; title: string; sub: string; icons: string[]; top?: number }> = ({ photo, title, sub, icons, top = 640 }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Photo name={photo} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(30,20,12,0.38) 50%, rgba(0,0,0,0) 75%)" }} />
    <div style={{ position: "absolute", left: 90, right: 150, top, color: "#fff", textShadow: "0 3px 18px rgba(0,0,0,0.45)" }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 104, lineHeight: 1.02 }}>{title}</div>
      <div style={{ fontFamily: ROUND, fontWeight: 500, fontSize: 46, marginTop: 22, opacity: 0.95 }}>{sub}</div>
      <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
        {icons.map((i) => <Img key={i} src={staticFile(i)} style={{ width: 118, height: 118, borderRadius: 28, boxShadow: "0 10px 24px rgba(0,0,0,0.35)" }} />)}
        <div style={{ width: 118, height: 118, borderRadius: 28, background: "rgba(255,255,255,0.22)", border: "3px dashed rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 800, fontSize: 44, color: "#fff" }}>+1</div>
      </div>
    </div>
  </AbsoluteFill>
);
