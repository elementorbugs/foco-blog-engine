// Data-driven TikTok carousel slide. One JSON spec (carousels/<slug>.json) describes a whole carousel;
// carousel/build.js renders each slide through this component. Layouts reuse the hand-built carousels' pieces.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BODY, EMOJI, HAND, HEAD } from "../Composition";
import { Bubble, FocoCard, Photo } from "./Carousel";
import { StepCard, TimeChip } from "./MoreCarousels";
import { Tag } from "./MoreCarousels2";

type Step = { text: string; min: number };
// "life" slide inset: a real screenshot/creative (image + optional crop) or a drawn FOCO screen with this carousel's task
type Inset =
  | { image: string; crop?: [number, number]; aspect: number }
  | { ui: "breakdown"; title: string; steps: Step[] }
  | { ui: "focus"; stepNo: number; stepTotal: number; step: string; min: number; sound: string }
  | { ui: "calendar"; title: string; min: number; category: string };
export type SpecSlide =
  | { layout: "hook"; id: string; lines: string[]; tag?: string; textTop?: number }
  | { layout: "pair"; id: string; topLabel: string; top: string; bottomLabel: string; bottom: string }
  | { layout: "card"; id: string; label: string; comment?: string; title: string; steps: Step[]; result?: string }
  | { layout: "step"; id: string; label: string; step: string; min: number }
  | { layout: "caption"; id: string; label: string; comment?: string; time?: string }
  | { layout: "focus"; id: string; label: string; comment?: string; stepNo: number; stepTotal: number; step: string; min: number; sound: string; result?: string }
  | { layout: "life"; id: string; label: string; comment?: string; chip?: string; side?: "left" | "right"; inset: Inset }
  | { layout: "scan"; id: string; label: string; comment?: string; items: string[]; result?: string }
  | { layout: "calendar"; id: string; label: string; comment?: string; title: string; min: number; category: string; result?: string }
  | { layout: "inputs"; id: string; label: string; comment?: string; result?: string }
  | { layout: "phone"; id: string; label: string; comment?: string; screenshot?: number; image?: string; result?: string; crop?: [number, number]; aspect?: number }
  | { layout: "final-card"; id: string; lines: string[]; title: string; steps: Step[]; ask: string }
  | { layout: "final-phone"; id: string; lines: string[]; screenshot?: number; image?: string; aspect?: number; ask: string };

// sticker: one big emoji per slide, TikTok-sticker style; stickerPos overrides the per-layout default [x, y]
type SlideExtras = { query?: string; pick?: number; photo?: string; sticker?: string; stickerPos?: [number, number] };
export type Spec = { slug: string; slides: (SpecSlide & SlideExtras)[] };

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


// A phone camera mid-scan of a handwritten paper to-do list (the "Scan it" capture), drawn so the list matches the
// carousel's tasks exactly. Paper + spiral + Caveat handwriting inside a viewfinder with purple scan corners.
const ScanPhone: React.FC<{ items: string[] }> = ({ items }) => {
  const corner = (pos: React.CSSProperties, rot: number) => (
    <div style={{ position: "absolute", width: 70, height: 70, borderTop: "8px solid #A78BFA", borderLeft: "8px solid #A78BFA", borderTopLeftRadius: 22, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 0 10px #7C3AED)", ...pos }} />
  );
  return (
    <div style={{ width: 560, height: 1060, borderRadius: 70, background: "#0d0a14", padding: 16, boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", background: "linear-gradient(160deg, #6b4a2f, #4a321f)" }}>
        <div style={{ position: "absolute", top: 34, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#FFFFFF", background: "rgba(245,158,11,0.95)", padding: "8px 26px", borderRadius: 999 }}><span style={{ fontFamily: `"${EMOJI}"` }}>📷</span> Scan it</div>
        </div>
        {/* the paper */}
        <div style={{ position: "absolute", top: 140, left: 60, width: 410, height: 640, background: "#F6EEDD", borderRadius: 14, transform: "rotate(-3deg)", boxShadow: "0 18px 40px rgba(0,0,0,0.45)", backgroundImage: "repeating-linear-gradient(transparent 0 58px, rgba(120,140,180,0.35) 58px 60px)", backgroundPosition: "0 40px" }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: -14, top: 40 + i * 56, width: 30, height: 14, borderRadius: 8, border: "4px solid #C9A24A" }} />
          ))}
          <div style={{ position: "absolute", top: 50, left: 54, fontFamily: HAND, fontWeight: 600, fontSize: 64, color: "#1d1b2a", textDecoration: "underline" }}>To do:</div>
          {items.map((t, i) => (
            <div key={t} style={{ position: "absolute", top: 170 + i * 118, left: 50, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 40, height: 40, border: "4px solid #1d1b2a", borderRadius: 4, flexShrink: 0 }} />
              <div style={{ fontFamily: HAND, fontWeight: 600, fontSize: 58, color: "#1d1b2a", whiteSpace: "nowrap" }}>{t}</div>
            </div>
          ))}
        </div>
        {corner({ top: 110, left: 30 }, 0)}
        {corner({ top: 110, right: 30 }, 90)}
        {corner({ top: 760, right: 30 }, 180)}
        {corner({ top: 760, left: 30 }, 270)}
        {/* shutter */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 190, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: 999, border: "8px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 90, height: 90, borderRadius: 999, background: "#FFFFFF" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// FOCO's Sessions (calendar) day view with ONE task, drawn so the task name/minutes match the rest of the carousel
// exactly, plus the optional one-tap AI breakdown button (it is a choice, never automatic).
const CalendarCard: React.FC<{ title: string; min: number; category: string }> = ({ title, min, category }) => (
  <div style={{ width: 860, borderRadius: 40, padding: "32px 32px 36px", background: "#0B0A16", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 64, color: "#FFFFFF", lineHeight: 1 }}>Sunday</div>
    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: "#B8B0CC", marginTop: 8 }}>JUN 2026</div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
      {["M 22", "T 23", "W 24", "T 25", "F 26", "S 27", "S 28"].map((d, i) => (
        <div key={d + i} style={{ width: 96, padding: "12px 0", borderRadius: 20, textAlign: "center", background: i === 6 ? "#7C3AED" : "transparent", fontFamily: BODY, color: i === 6 ? "#FFFFFF" : "#7d738f" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{d.split(" ")[0]}</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{d.split(" ")[1]}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 26, padding: "14px 24px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.12)", fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#D6D0E4" }}>ANYTIME (1)</div>
    <div style={{ marginTop: 18, padding: "26px 26px", borderRadius: 28, background: "rgba(255,255,255,0.05)", border: "2px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: 54, height: 54, borderRadius: 999, border: "4px solid #7C3AED", flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: "#FFFFFF", lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 30, color: "#B8B0CC", marginTop: 6 }}>{min} min · {category}</div>
      </div>
    </div>
    <div style={{ marginTop: 22, padding: "24px 20px", borderRadius: 24, border: "3px dashed #A78BFA", textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 2, color: "#C4B5FD", background: "rgba(124,58,237,0.15)" }}>
      <span style={{ fontFamily: `"${EMOJI}"` }}>✨</span> MAKE SUBTASKS USING FOCO <span style={{ fontFamily: `"${EMOJI}"` }}>👆</span>
    </div>
    <div style={{ marginTop: 12, textAlign: "center", fontFamily: BODY, fontWeight: 600, fontSize: 28, color: "#7d738f" }}>optional: only if you tap it</div>
  </div>
);

// FOCO's three ways to capture a task (the app's "Chat it / Speak it / Scan it" cards, same colors), drawn large
// so the input options read on a phone instead of shrinking a full screenshot.
const INPUTS = [
  { icon: "🎙️", title: "Speak it", sub: "say it out loud, FOCO gets it", bg: "#2563EB" },
  { icon: "📷", title: "Scan it", sub: "snap a note or a list", bg: "#F59E0B" },
  { icon: "💬", title: "Chat it", sub: "type your task or idea", bg: "#7C3AED" },
];
const InputOptions: React.FC = () => (
  <div style={{ width: 860, borderRadius: 40, padding: "30px 30px 34px", background: "#130A22", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
      <Img src={staticFile("apps/foco-icon.png")} style={{ width: 46, height: 46, borderRadius: 12 }} />
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#A78BFA" }}>WHAT'S ON YOUR MIND?</div>
    </div>
    {INPUTS.map((o) => (
      <div key={o.title} style={{ display: "flex", alignItems: "center", gap: 28, padding: "22px 24px", marginTop: 14, borderRadius: 28, background: "rgba(255,255,255,0.05)", border: "2px solid rgba(167,139,250,0.18)" }}>
        <div style={{ width: 110, height: 110, borderRadius: 999, background: o.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: `"${EMOJI}"`, fontSize: 58, flexShrink: 0, boxShadow: `0 0 30px ${o.bg}88` }}>{o.icon}</div>
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: "#FFFFFF", lineHeight: 1.1 }}>{o.title}</div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 34, color: "#D6D0E4", marginTop: 4 }}>{o.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

// Mimics FOCO's focus mode: one step on screen, a timer, and the ambient sound playing (real sound names:
// Silence, Study, Jazzy, Chill, Rainy). Shows the "one step at a time, with music" benefit instead of claiming it.
const FocusCard: React.FC<{ stepNo: number; stepTotal: number; step: string; min: number; sound: string }> = ({ stepNo, stepTotal, step, min, sound }) => (
  <div style={{ width: 780, borderRadius: 40, padding: "30px 36px 34px", background: "#130A22", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Img src={staticFile("apps/foco-icon.png")} style={{ width: 46, height: 46, borderRadius: 12 }} />
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#A78BFA" }}>FOCUS MODE</div>
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: "#D6D0E4", padding: "6px 16px", borderRadius: 999, border: "2px solid rgba(167,139,250,0.35)" }}>step {stepNo} of {stepTotal}</div>
    </div>
    <div style={{ marginTop: 26, fontFamily: HEAD, fontWeight: 800, fontSize: 46, lineHeight: 1.15, color: "#FFFFFF" }}>{step}</div>
    <div style={{ position: "relative", width: 250, height: 250, margin: "28px auto 0" }}>
      <svg width="250" height="250" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" strokeDasharray="190 276" transform="rotate(-90 50 50)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("mascots/foco_state_3_focus.png")} style={{ height: 150 }} />
      </div>
    </div>
    <div style={{ marginTop: 10, fontFamily: HEAD, fontWeight: 800, fontSize: 60, color: "#FFFFFF" }}>{String(min).padStart(2, "0")}:00</div>
    <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, background: "rgba(124,58,237,0.25)", border: "2px solid #A78BFA" }}>
      <svg width="30" height="30" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="3" fill="#fff" /><circle cx="18" cy="16" r="3" fill="#fff" /></svg>
      <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: "#FFFFFF" }}>{sound} sounds playing</span>
    </div>
  </div>
);

// Defaults keep the sticker inside the safe band and clear of the bubbles/cards for each layout
const STICKER_POS: Record<string, [number, number]> = {
  hook: [800, 470], pair: [790, 880], caption: [790, 880], step: [800, 880], card: [820, 470],
  focus: [40, 430], phone: [800, 900], inputs: [820, 300], calendar: [820, 300], scan: [800, 900], life: [800, 1150], "final-card": [80, 330], "final-phone": [700, 1000],
};
const Sticker: React.FC<{ emoji: string; pos: [number, number] }> = ({ emoji, pos }) => (
  <div style={{ position: "absolute", left: pos[0], top: pos[1], fontFamily: `"${EMOJI}"`, fontSize: 130, lineHeight: 1, transform: "rotate(12deg)", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.35))", zIndex: 5 }}>
    {emoji}
  </div>
);

export const SpecSlideView: React.FC<{ spec: Spec; index: number }> = (props) => {
  const s = props.spec.slides[props.index];
  return (
    <AbsoluteFill>
      <SlideBody {...props} />
      {s.sticker ? <Sticker emoji={s.sticker} pos={s.stickerPos ?? STICKER_POS[s.layout]} /> : null}
    </AbsoluteFill>
  );
};

const SlideBody: React.FC<{ spec: Spec; index: number }> = ({ spec, index }) => {
  const s = spec.slides[index];
  // finals may reuse another slide's photo (blurred)
  const photo = `${spec.slug}/${("photo" in s && s.photo) || s.id}`;

  switch (s.layout) {
    case "hook":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          {/* textTop moves the hook bubbles off a face (keep the block above SAFE.bottom) */}
          <div style={{ position: "absolute", top: s.textTop ?? 640, left: 60, right: 60 }}>
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
          {/* anchored from the bottom so wrapped lines grow upward, never into TikTok's bottom overlay */}
          <div style={{ position: "absolute", bottom: 1920 - SAFE.bottom + 20, left: SAFE.left, right: SAFE.rightLow }}>
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
    case "focus": {
      // card starts below however many lines the label + comment wrap to (~30 / ~36 chars per line)
      const cardTop = 220 + Math.ceil(s.label.length / 30) * 84 + (s.comment ? 12 + Math.ceil(s.comment.length / 36) * 72 : 0) + 34;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top: cardTop, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <FocusCard stepNo={s.stepNo} stepTotal={s.stepTotal} step={s.step} min={s.min} sound={s.sound} />
          </div>
          {s.result ? (
            <div style={{ position: "absolute", top: 1380, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={48}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    }
    case "scan":
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} blur />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", justifyContent: "center", transform: "rotate(2deg)" }}>
            <ScanPhone items={s.items} />
          </div>
          {s.result ? (
            <div style={{ position: "absolute", top: 1400, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={46}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    case "life": {
      // A real-life moment (full-bleed photo) + how FOCO handles it (screenshot or drawn screen inset beside it)
      const top = 220 + Math.ceil(s.label.length / 30) * 84 + (s.comment ? 12 + Math.ceil(s.comment.length / 36) * 72 : 0) + 30;
      const maxH = 1440 - top - (s.chip ? 90 : 0);
      const ins = s.inset;
      const side = s.side ?? "left";
      let box: React.ReactNode;
      let w = 560;
      let h = 0;
      if ("image" in ins) {
        const [y0, y1] = ins.crop ?? [0, 1];
        w = Math.min(700, Math.round(maxH / (ins.aspect * (y1 - y0))));
        h = Math.round(w * ins.aspect * (y1 - y0));
        box = <Img src={staticFile(ins.image)} style={{ position: "absolute", left: 0, top: -Math.round(w * ins.aspect * y0), width: w, height: Math.round(w * ins.aspect) }} />;
      } else {
        // drawn screens are 780-860 wide; scale them into the inset width
        const inner = ins.ui === "breakdown" ? <FocoCard title={ins.title} steps={ins.steps} /> : ins.ui === "focus" ? <FocusCard stepNo={ins.stepNo} stepTotal={ins.stepTotal} step={ins.step} min={ins.min} sound={ins.sound} /> : <CalendarCard title={ins.title} min={ins.min} category={ins.category} />;
        const base = ins.ui === "calendar" ? 860 : 780;
        w = 720;
        // zoom (not transform) so the scaled screen also shrinks its layout box; Remotion renders in Chromium
        box = <div style={{ zoom: w / base, width: base }}>{inner}</div>;
      }
      // right-side insets stop at x 950 so the screen's text stays clear of TikTok's like/comment rail
      const left = side === "left" ? 60 : 1080 - 130 - w;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top, left, width: w, transform: `rotate(${side === "left" ? -2 : 2}deg)` }}>
            <div style={{ position: "relative", width: w, height: h || undefined, borderRadius: 34, overflow: "hidden", border: "6px solid #FFFFFF", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", background: "#0B0A16" }}>{box}</div>
            {s.chip ? (
              <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
                <Bubble bg="#DCFCE7" color="#15803D" size={40}>{s.chip}</Bubble>
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      );
    }
    case "calendar": {
      const top = 220 + Math.ceil(s.label.length / 30) * 84 + (s.comment ? 12 + Math.ceil(s.comment.length / 36) * 72 : 0) + 40;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <CalendarCard title={s.title} min={s.min} category={s.category} />
          </div>
          {s.result ? (
            <div style={{ position: "absolute", top: 1380, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={48}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    }
    case "inputs": {
      const top = 220 + Math.ceil(s.label.length / 30) * 84 + (s.comment ? 12 + Math.ceil(s.comment.length / 36) * 72 : 0) + 40;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <InputOptions />
          </div>
          {s.result ? (
            <div style={{ position: "absolute", top: 1380, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={48}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    }
    case "phone": {
      // a real FOCO App Store screenshot mid-carousel, so the in-app process (capture, calendar, sounds) is shown, not claimed
      const top = 220 + Math.ceil(s.label.length / 30) * 84 + (s.comment ? 12 + Math.ceil(s.comment.length / 36) * 72 : 0) + 30;
      const phoneH = (s.result ? 1350 : 1460) - top;
      return (
        <AbsoluteFill style={{ background: "#000" }}>
          <Photo name={photo} />
          <AbsoluteFill style={{ background: "rgba(20,10,34,0.18)" }} />
          <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
            <Bubble size={54}>{s.label}</Bubble>
            {s.comment ? (
              <>
                <div style={{ height: 12 }} />
                <Bubble size={44}>{s.comment}</Bubble>
              </>
            ) : null}
          </div>
          {s.crop ? (
            // crop: [y0, y1] = the vertical slice of a raw phone screen (0-1) to show large, so its text stays readable
            (() => {
              const [y0, y1] = s.crop;
              const aspect = s.aspect ?? 2.167;
              const w = Math.min(880, Math.round(phoneH / ((y1 - y0) * aspect)));
              const h = Math.round(w * aspect * (y1 - y0));
              return (
                <div style={{ position: "absolute", top, left: (1080 - w) / 2, width: w, height: h, borderRadius: 36, overflow: "hidden", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
                  <Img src={staticFile(s.image ?? `apps/foco-${s.screenshot}.png`)} style={{ position: "absolute", left: 0, top: -Math.round(w * aspect * y0), width: w, height: Math.round(w * aspect) }} />
                </div>
              );
            })()
          ) : (
          <div style={{ position: "absolute", top, left: (1080 - Math.round(phoneH / 2.17)) / 2, transform: "rotate(-2deg)", width: Math.round(phoneH / 2.17), height: phoneH, borderRadius: 54, overflow: "hidden", border: "11px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
            <Img src={staticFile(s.image ?? `apps/foco-${s.screenshot}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          )}
          {s.result ? (
            <div style={{ position: "absolute", top: 1380, left: SAFE.left, right: SAFE.rightLow }}>
              <Bubble bg="#DCFCE7" color="#15803D" size={48}>{s.result}</Bubble>
            </div>
          ) : null}
        </AbsoluteFill>
      );
    }
    case "final-card":
    case "final-phone": {
      // Everything below the headline bubbles flows from where they end; the ask + CTA stay pinned above TikTok's bottom overlay
      // ~34 chars fit on one 48px bubble line; count wrapped lines, not array items
      const rows = s.lines.reduce((n, l) => n + Math.ceil(l.length / 34), 0);
      const below = 200 + rows * 82 + 24;
      // the ask is bottom-anchored and grows upward, so a 2-line ask shrinks the proof above it
      const askExtra = (Math.ceil(s.ask.length / 30) - 1) * 70;
      const phoneH = 1080 - below - askExtra;
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
              <div style={{ position: "absolute", top: Math.max(400, below), left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${askExtra ? 0.8 : 0.86})`, transformOrigin: "top center" }}>
                <FocoCard title={s.title} steps={s.steps} />
              </div>
              <Mascot style={{ left: 770, top: Math.max(400, below) - 70, height: 210 }} />
            </>
          ) : (
            <>
              {s.image ? (
                // a creative (e.g. snap-list-to-day) shown whole as a white-framed card, keeping its own aspect
                <div style={{ position: "absolute", top: below, left: 110, transform: "rotate(-3deg)", width: Math.round(phoneH / (s.aspect ?? 1.756)), height: phoneH, borderRadius: 34, overflow: "hidden", border: "6px solid #FFFFFF", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
                  <Img src={staticFile(s.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
              <div style={{ position: "absolute", top: below, left: 170, transform: "rotate(-3deg)", width: Math.round(phoneH / 2.17), height: phoneH, borderRadius: 54, overflow: "hidden", border: "11px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
                <Img src={staticFile(`apps/foco-${s.screenshot ?? 3}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              </div>
              )}
              <Mascot style={{ left: (s.image ? 110 + Math.round(phoneH / (s.aspect ?? 1.756)) : 170 + Math.round(phoneH / 2.17)) + 50, top: below + phoneH * 0.32, height: 330 }} />
            </>
          )}
          <div style={{ position: "absolute", bottom: 1920 - 1190, left: SAFE.left, right: SAFE.rightLow }}>
            <Bubble bg="#FFFFFF" color={DARK} size={46}>{s.ask}</Bubble>
          </div>
          <DownloadCTA />
        </AbsoluteFill>
      );
    }
  }
};

// Instagram 4:5 (1080x1350): IG crops 9:16 carousel images, cutting the top text. Every readable element already
// sits inside TikTok's safe band (y 180-1500), so render the same 1920px slide and show exactly that band.
export const IG_OFFSET = 140;
export const SpecSlideIG: React.FC<{ spec: Spec; index: number }> = (props) => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
    <div style={{ position: "absolute", left: 0, top: -IG_OFFSET, width: 1080, height: 1920 }}>
      <SpecSlideView {...props} />
    </div>
  </AbsoluteFill>
);
