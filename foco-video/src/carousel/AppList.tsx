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

// themes: "beige" = the reference's look; "lavender" = the FOCO-tinted list; "dark" = FOCO's own #1 slide
type Theme = { paper: string; grid: string; ink: string; soft: string; accent: string; chip: string; chipBorder: string; shadow: string; bezel: string };
const THEMES: Record<string, Theme> = {
  beige: { paper: "#efe6da", grid: "rgba(150,125,100,0.16)", ink: "#5b4636", soft: "#8a735f", accent: "#8a735f", chip: "#fffaf3", chipBorder: "#d9c9b6", shadow: "rgba(91,70,54,0.28)", bezel: "#1c1714" },
  lavender: { paper: "#f4f0fb", grid: "rgba(124,58,237,0.10)", ink: "#2a1a4a", soft: "#7a6a99", accent: "#7C3AED", chip: "#ffffff", chipBorder: "#dcd0f5", shadow: "rgba(76,29,149,0.22)", bezel: "#17122a" },
  dark: { paper: "#0a0410", grid: "rgba(167,139,250,0.10)", ink: "#ffffff", soft: "#B8B0CC", accent: "#A78BFA", chip: "#1a1230", chipBorder: "rgba(167,139,250,0.4)", shadow: "rgba(124,58,237,0.45)", bezel: "#000000" },
};
export type ThemeName = keyof typeof THEMES;

// a store screenshot shown inside the phone; crop = [x0, y0, x1, y1] fractions of the source (drops store captions)
export type Shot = { src: string; size: [number, number]; crop?: [number, number, number, number] };
// rank + question: countdown lists ("#3 · you think in pictures?") show them in place of the platforms line
export type AppInfo = { name: string; icon: string; platforms?: string; question?: string; rank?: number; bullets: string[]; shot: Shot; theme?: ThemeName };

const PhoneShot: React.FC<{ shot: Shot; w: number; x: number; y: number; th: Theme }> = ({ shot, w, x, y, th }) => {
  const h = Math.round(w * 2.08), pad = 12, W = w - pad * 2, H = h - pad * 2;
  const [iw, ih] = shot.size;
  const [x0, y0, x1, y1] = shot.crop ?? [0, 0, 1, 1];
  const cw = (x1 - x0) * iw, ch = (y1 - y0) * ih;
  const k = Math.max(W / cw, H / ch);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: w * 0.16, background: th.bezel, padding: pad, boxShadow: `0 30px 60px ${th.shadow}` }}>
      <div style={{ position: "relative", width: W, height: H, borderRadius: w * 0.135, overflow: "hidden", background: "#000" }}>
        <Img src={staticFile(shot.src)} style={{ position: "absolute", width: iw * k, height: ih * k, left: -x0 * iw * k + (W - cw * k) / 2, top: -y0 * ih * k + (H - ch * k) / 2 }} />
      </div>
    </div>
  );
};

const Paper: React.FC<{ th: Theme; glow?: boolean; children: React.ReactNode }> = ({ th, glow, children }) => (
  <AbsoluteFill style={{ background: th.paper, backgroundImage: `linear-gradient(${th.grid} 2px, transparent 2px), linear-gradient(90deg, ${th.grid} 2px, transparent 2px)`, backgroundSize: "44px 44px" }}>
    {glow && <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 80% 25%, rgba(124,58,237,0.35), transparent 70%)" }} />}
    {children}
  </AbsoluteFill>
);

// compact = the FOCO slide, which also carries the ask + download panel below (y 1150+)
export const AppSlide: React.FC<{ app: AppInfo; compact?: boolean; ask?: string }> = ({ app, compact, ask }) => {
  const th = THEMES[app.theme ?? "beige"];
  const win = app.rank === 1;
  return (
    <Paper th={th} glow={app.theme === "dark"}>
      <div style={{ position: "absolute", left: 90, top: 230, display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ position: "relative" }}>
          <Img src={staticFile(app.icon)} style={{ width: 160, height: 160, borderRadius: 38, boxShadow: `0 10px 24px ${th.shadow}` }} />
          {app.rank && <div style={{ position: "absolute", left: -26, top: -26, width: 78, height: 78, borderRadius: 39, background: win ? "#FB923C" : th.accent, color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(0,0,0,0.25)" }}>#{app.rank}</div>}
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 78, color: th.ink, lineHeight: 1.05 }}>{app.name}</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: app.question ? 40 : 42, color: app.question ? th.accent : th.soft, marginTop: 6, maxWidth: 640 }}>{app.question ?? app.platforms}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: compact ? 540 : 580, width: 470 }}>
        {app.bullets.map((b) => (
          <div key={b} style={{ display: "flex", gap: 16, marginBottom: compact ? 30 : 44, fontFamily: `${ROUND}, "${EMOJI}"`, fontWeight: 500, fontSize: compact ? 40 : 50, lineHeight: 1.3, color: th.ink }}>
            <span style={{ color: th.accent }}>•</span>
            <span>{b}</span>
          </div>
        ))}
        {ask && <div style={{ marginTop: 16, display: "inline-block", padding: "14px 26px", borderRadius: 999, background: th.chip, border: `3px solid ${th.chipBorder}`, fontFamily: `${ROUND}, "${EMOJI}"`, fontWeight: 600, fontSize: 38, color: th.ink }}>{ask}</div>}
      </div>
      <PhoneShot shot={app.shot} w={compact ? 330 : 440} x={compact ? 610 : 600} y={compact ? 480 : 540} th={th} />
    </Paper>
  );
};

// cover: real photo + title + icons; the last tile is a "+1" teaser so FOCO stays out of the hook
export const AppListCover: React.FC<{ photo: string; title: string; sub: string; icons: string[]; top?: number; teaser?: string }> = ({ photo, title, sub, icons, top = 640, teaser = "+1" }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Photo name={photo} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(30,20,12,0.38) 50%, rgba(0,0,0,0) 75%)" }} />
    <div style={{ position: "absolute", left: 90, right: 150, top, color: "#fff", textShadow: "0 3px 18px rgba(0,0,0,0.45)" }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 104, lineHeight: 1.02 }}>{title}</div>
      <div style={{ fontFamily: ROUND, fontWeight: 500, fontSize: 46, marginTop: 22, opacity: 0.95 }}>{sub}</div>
      <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
        {icons.map((i) => <Img key={i} src={staticFile(i)} style={{ width: 118, height: 118, borderRadius: 28, boxShadow: "0 10px 24px rgba(0,0,0,0.35)" }} />)}
        <div style={{ width: 118, height: 118, borderRadius: 28, background: "rgba(255,255,255,0.22)", border: "3px dashed rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 800, fontSize: 44, color: "#fff" }}>{teaser}</div>
      </div>
    </div>
  </AbsoluteFill>
);
