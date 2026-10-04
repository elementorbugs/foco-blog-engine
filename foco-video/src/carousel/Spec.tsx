// Data-driven TikTok carousel slide. One JSON spec (carousels/<slug>.json) describes a whole carousel;
// carousel/build.js renders each slide through this component. Layouts reuse the hand-built carousels' pieces.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BODY, HEAD } from "../Composition";
import { Bubble, FocoCard, Photo } from "./Carousel";
import { StepCard, TimeChip } from "./MoreCarousels";
import { Tag } from "./MoreCarousels2";

type Step = { text: string; min: number };
export type SpecSlide =
  | { layout: "hook"; id: string; lines: string[]; tag?: string }
  | { layout: "pair"; id: string; topLabel: string; top: string; bottomLabel: string; bottom: string }
  | { layout: "card"; id: string; label: string; comment?: string; title: string; steps: Step[]; result?: string }
  | { layout: "step"; id: string; label: string; step: string; min: number }
  | { layout: "caption"; id: string; label: string; comment?: string; time?: string }
  | { layout: "final-card"; id: string; lines: string[]; title: string; steps: Step[]; ask: string }
  | { layout: "final-phone"; id: string; lines: string[]; screenshot?: number; ask: string };

export type Spec = { slug: string; slides: (SpecSlide & { query?: string; pick?: number; photo?: string })[] };

const DARK = "#160F22";

// TikTok overlays (approx., 1080x1920): tabs + photo dots on top (0-180), username/caption/sound at the
// bottom (1500+), like/comment/share rail on the right (x 950+, y 850-1500). Keep readable text out of them.
export const SAFE = { top: 180, bottom: 1500, railX: 950, railTop: 850, left: 90, rightLow: 160 };

// Celebrating mascot sticker, final slide only (see SKILL.md > FOCO mascot)
const Mascot: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <Img src={staticFile("mascots/foco_state_5_completion.png")} style={{ position: "absolute", filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.45))", ...style }} />
);

// "Download FOCO PLANNER" panel with the official store badges; sits between the ask and TikTok's bottom overlay.
// The "LINK IN BIO" pill straddles its top edge (TikTok bios hold the store link; captions can't).
const DownloadCTA: React.FC = () => (
  <>
  <div style={{ position: "absolute", top: 1212, left: SAFE.left, width: SAFE.railX - SAFE.left - 10, display: "flex", justifyContent: "center", zIndex: 2 }}>
    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 3, color: "#FFFFFF", background: "#FB923C", padding: "8px 28px", borderRadius: 999, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>🔗 LINK IN BIO</div>
  </div>
  <div style={{ position: "absolute", top: 1255, left: SAFE.left, width: SAFE.railX - SAFE.left - 10, padding: "34px 30px 22px", borderRadius: 34, background: "#FFFFFF", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <Img src={staticFile("apps/foco-icon.png")} style={{ width: 92, height: 92, borderRadius: 22 }} />
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: "#7C3AED" }}>DOWNLOAD</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 44, lineHeight: 1.02, color: DARK }}>FOCO<br />PLANNER</div>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
      <Img src={staticFile("badges/app-store.svg")} style={{ height: 70 }} />
      <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 70 }} />
    </div>
  </div>
  </>
);

export const SpecSlideView: React.FC<{ spec: Spec; index: number }> = ({ spec, index }) => {
  const s = spec.slides[index];
  // finals may reuse another slide's photo (blurred)
  const photo = `${spec.slug}/${("photo" in s && s.photo) || s.id}`;

  switch (s.layout) {
    case "hook":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 640, left: 60, right: 60 }}>
            {s.lines.map((l, i) => (
              <div key={l} style={{ marginBottom: 14 }}>
                <Bubble size={i === 0 ? 64 : 54}>{l}</Bubble>
              </div>
            ))}
            {s.tag ? <Bubble size={40} bg="#FFFFFF" color={DARK}>{s.tag}</Bubble> : null}
          </div>
        </AbsoluteFill>
      );
    case "pair":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 230, left: 60, right: 60 }}>
            <Tag bg="#7C3AED">{s.topLabel}</Tag>
            <Bubble size={54}>{s.top}</Bubble>
          </div>
          <div style={{ position: "absolute", top: 1200, left: SAFE.left, right: SAFE.rightLow }}>
            <Tag bg="#FB923C">{s.bottomLabel}</Tag>
            <Bubble size={48} bg="#FFFFFF" color={DARK}>{s.bottom}</Bubble>
          </div>
        </AbsoluteFill>
      );
    case "card":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 250, left: 60, right: 60 }}>
            <Bubble size={56}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <FocoCard title={s.title} steps={s.steps} />
          </div>
          {s.result ? (
            <div style={{ position: "absolute", top: 1330, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={52}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    case "step":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 260, left: 60, right: 60 }}>
            <Bubble size={58}>{s.label}</Bubble>
          </div>
          <div style={{ position: "absolute", top: 1040, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <StepCard step={s.step} min={s.min} />
          </div>
        </AbsoluteFill>
      );
    case "caption":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          {s.time ? <TimeChip time={s.time} /> : null}
          <div style={{ position: "absolute", top: 1180, left: SAFE.left, right: SAFE.rightLow }}>
            <Bubble size={56}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 14 }} />
                <Bubble size={46}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
        </AbsoluteFill>
      );
    case "final-card":
    case "final-phone": {
      // Everything below the headline bubbles flows from where they end; the ask + CTA stay pinned above TikTok's bottom overlay
      // ~34 chars fit on one 48px bubble line; count wrapped lines, not array items
      const rows = s.lines.reduce((n, l) => n + Math.ceil(l.length / 34), 0);
      const below = 200 + rows * 82 + 24;
      const phoneH = 1080 - below;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} blur />
          <AbsoluteFill style={{ background: "rgba(20,10,34,0.25)" }} />
          <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
            {s.lines.map((l) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Bubble size={48}>{l}</Bubble>
              </div>
            ))}
          </div>
          {s.layout === "final-card" ? (
            <>
              <div style={{ position: "absolute", top: Math.max(400, below), left: 0, right: 0, display: "flex", justifyContent: "center", transform: "scale(0.86)", transformOrigin: "top center" }}>
                <FocoCard title={s.title} steps={s.steps} />
              </div>
              <Mascot style={{ left: 770, top: Math.max(400, below) - 70, height: 210 }} />
            </>
          ) : (
            <>
              <div style={{ position: "absolute", top: below, left: 170, transform: "rotate(-3deg)", width: Math.round(phoneH / 2.17), height: phoneH, borderRadius: 54, overflow: "hidden", border: "11px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
                <Img src={staticFile(`apps/foco-${s.screenshot ?? 3}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              </div>
              <Mascot style={{ left: 170 + Math.round(phoneH / 2.17) + 50, top: below + phoneH * 0.32, height: 330 }} />
            </>
          )}
          <div style={{ position: "absolute", top: 1105, left: SAFE.left, right: SAFE.rightLow }}>
            <Bubble bg="#FFFFFF" color={DARK} size={46}>{s.ask}</Bubble>
          </div>
          <DownloadCTA />
        </AbsoluteFill>
      );
    }
  }
};
