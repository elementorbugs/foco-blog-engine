// TikTok photo carousel (1080x1920): "Tasks I avoided for WEEKS vs how long they actually took".
// Format modeled on the Flowfy budget-app carousel: lifestyle photo + TikTok-style text bubbles + an in-app card.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BODY, BODY_STACK, HEAD } from "../Composition";

const LILAC_BG = "#EFE7FF";
const LILAC_TEXT = "#6D28D9";
const DONE_BG = "#DCFCE7";
const DONE_TEXT = "#15803D";

type Step = { text: string; min: number };
type Slide = { photo: string; title?: string; label: string; comment: string; steps?: Step[]; took?: string };

export const SLIDES: Slide[] = [
  { photo: "hook", label: "Tasks I avoided for WEEKS", comment: "vs how long they actually took 🫠" },
  { photo: "email", label: "Reply to ONE email", comment: "avoided: 3 weeks 😭", title: "Reply to Dana's email", steps: [{ text: "Open the email", min: 1 }, { text: "Write 2 sentences", min: 2 }, { text: "Hit send", min: 1 }], took: "actually took: 4 min" },
  { photo: "laundry", label: "Fold the laundry", comment: "avoided: 9 days (lived out of the pile 💀)", title: "Fold the laundry", steps: [{ text: "Fold just the shirts", min: 5 }, { text: "Pair the socks", min: 4 }, { text: "Put it all away", min: 3 }], took: "actually took: 12 min" },
  { photo: "call", label: "Call the dentist", comment: "avoided: 2 months 📵", title: "Book a dentist checkup", steps: [{ text: "Find the number", min: 1 }, { text: "Say \"I need a checkup\"", min: 1 }, { text: "Take any open slot", min: 1 }], took: "actually took: 3 min" },
  { photo: "dishes", label: "Do the dishes", comment: "avoided: 4 days 🫣", title: "Do the dishes", steps: [{ text: "Run hot water", min: 1 }, { text: "Just the cups first", min: 4 }, { text: "Then everything else", min: 10 }], took: "actually took: 15 min" },
  { photo: "papers", label: "Renew my license online", comment: "avoided: since spring 🙃", title: "Renew my license", steps: [{ text: "Find the website", min: 2 }, { text: "Photo of my ID", min: 3 }, { text: "Fill out the form", min: 15 }], took: "actually took: 20 min" },
  { photo: "desk", label: "Clean my desk", comment: "avoided: honestly forever", title: "Clean my desk", steps: [{ text: "Trash into one bag", min: 3 }, { text: "Cups to the kitchen", min: 2 }, { text: "Stack the papers", min: 5 }], took: "actually took: 10 min" },
  { photo: "final", label: "btw the app that breaks it into tiny steps is called FOCO 💜", comment: "(purple blob icon)" },
];

// TikTok "classic" text style: each line hugs its own rounded background
export const Bubble: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number }> = ({ children, bg = LILAC_BG, color = LILAC_TEXT, size = 50 }) => (
  <div style={{ textAlign: "center", lineHeight: 1.55 }}>
    <span style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: size, color, background: bg, padding: "6px 22px", borderRadius: 18, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
      {typeof children === "string" ? noOrphan(children) : children}
    </span>
  </div>
);

// Glue the last two words (e.g. "real 😌", "3 weeks") so a wrapped bubble never ends with a lone word or emoji
const noOrphan = (t: string) =>
  t
    // keep emoji runs ("✨🧹") together: word joiner between consecutive emoji
    .replace(/(\p{Extended_Pictographic}️?)(?=\p{Extended_Pictographic})/gu, "$1⁠")
    .replace(/ (\S+ \S+)$/, (_, tail: string) => " " + tail.replace(" ", " "));

// Mimics FOCO's real "Let's break it down" screen
export const FocoCard: React.FC<{ title: string; steps: Step[] }> = ({ title, steps }) => {
  const total = steps.reduce((s, x) => s + x.min, 0);
  return (
    <div style={{ width: 780, borderRadius: 40, padding: "34px 36px 30px", background: "#130A22", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("apps/foco-icon.png")} style={{ width: 46, height: 46, borderRadius: 12 }} />
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#A78BFA" }}>YOUR PLAN</div>
      </div>
      <div style={{ marginTop: 14, fontFamily: HEAD, fontWeight: 800, fontSize: 46, color: "#fff" }}>Let's break it down</div>
      <div style={{ marginTop: 4, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: "#B8B0CC" }}>{title}</div>
      <div style={{ marginTop: 18, display: "inline-block", fontFamily: BODY, fontWeight: 700, fontSize: 26, color: "#D6D0E4", padding: "8px 18px", borderRadius: 12, border: "2px solid rgba(167,139,250,0.3)" }}>
        {total} min total · {steps.length} steps
      </div>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        {steps.map((s, i) => (
          <div key={s.text} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 18px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "#7C3AED", color: "#fff", fontFamily: HEAD, fontWeight: 800, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: "#fff" }}>{s.text}</div>
            <div style={{ width: 74, padding: "6px 0", borderRadius: 14, background: "rgba(167,139,250,0.22)", border: "2px solid #A78BFA", textAlign: "center", fontFamily: BODY, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>
              <div style={{ fontSize: 30 }}>{s.min}</div>
              <div style={{ fontSize: 18, color: "#D6D0E4" }}>min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// "Phone photo" look: slightly warm, softer saturation/contrast, film grain and a light vignette, so stock photos
// read like casual iPhone shots and the slides share one look.
export const Photo: React.FC<{ name: string; blur?: boolean }> = ({ name, blur }) => (
  <>
    <Img src={staticFile(`carousel/${name}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: blur ? "blur(18px) brightness(0.85)" : "saturate(0.88) contrast(0.94) sepia(0.12) brightness(1.03)", transform: blur ? "scale(1.1)" : "none" }} />
    {blur ? null : (
      <>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16, mixBlendMode: "overlay" }}>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.22) 100%)" }} />
      </>
    )}
  </>
);

const FinalSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <AbsoluteFill>
    <Photo name="desk" blur />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,10,34,0.35), rgba(20,10,34,0.15))" }} />
    <div style={{ position: "absolute", top: 230, left: 70, right: 70 }}>
      <Bubble size={50}>{slide.label}</Bubble>
      <div style={{ height: 14 }} />
      <Bubble size={42}>{slide.comment}</Bubble>
    </div>
    <div style={{ position: "absolute", top: 610, left: "50%", transform: "translateX(-50%) rotate(-3deg)", width: 470, height: 1020, borderRadius: 60, overflow: "hidden", border: "12px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
      <Img src={staticFile("apps/foco-3.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    </div>
    <div style={{ position: "absolute", bottom: 300, left: 70, right: 70 }}>
      <Bubble bg="#FFFFFF" color="#160F22" size={48}>what are YOU avoiding rn? 👇</Bubble>
    </div>
  </AbsoluteFill>
);

export const CarouselSlide: React.FC<{ index: number }> = ({ index }) => {
  const slide = SLIDES[index];
  if (slide.photo === "final") return <FinalSlide slide={slide} />;
  const isHook = !slide.steps;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo name={slide.photo} />
      {isHook ? (
        <div style={{ position: "absolute", top: 620, left: 60, right: 60 }}>
          <Bubble size={64}>{slide.label}</Bubble>
          <div style={{ height: 16 }} />
          <Bubble size={54}>{slide.comment}</Bubble>
          <div style={{ height: 16 }} />
          <Bubble size={40} bg="#FFFFFF" color="#160F22">(ADHD edition)</Bubble>
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", top: 250, left: 60, right: 60 }}>
            <Bubble size={56}>{slide.label}</Bubble>
            <div style={{ height: 12 }} />
            <Bubble size={44}>{slide.comment}</Bubble>
          </div>
          <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <FocoCard title={slide.title!} steps={slide.steps!} />
          </div>
          <div style={{ position: "absolute", top: 1330, left: 60, right: 60 }}>
            <Bubble bg={DONE_BG} color={DONE_TEXT} size={52}>{slide.took} ✅</Bubble>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
