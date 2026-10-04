// Data-driven TikTok carousel slide. One JSON spec (carousels/<slug>.json) describes a whole carousel;
// carousel/build.js renders each slide through this component. Layouts reuse the hand-built carousels' pieces.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
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
    case "final-phone":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} blur />
          <AbsoluteFill style={{ background: "rgba(20,10,34,0.25)" }} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            {s.lines.map((l) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Bubble size={48}>{l}</Bubble>
              </div>
            ))}
          </div>
          {s.layout === "final-card" ? (
            <div style={{ position: "absolute", top: 580, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <FocoCard title={s.title} steps={s.steps} />
            </div>
          ) : (
            <div style={{ position: "absolute", top: 500, left: "50%", transform: "translateX(-50%) rotate(-3deg)", width: 370, height: 800, borderRadius: 60, overflow: "hidden", border: "12px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
              <Img src={staticFile(`apps/foco-${s.screenshot ?? 3}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          )}
          <div style={{ position: "absolute", top: s.layout === "final-card" ? 1340 : 1350, left: SAFE.left, right: SAFE.rightLow }}>
            <Bubble bg="#FFFFFF" color={DARK} size={48}>{s.ask}</Bubble>
          </div>
        </AbsoluteFill>
      );
  }
};
