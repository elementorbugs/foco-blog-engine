// Two more TikTok carousels in the same Flowfy-style format as Carousel.tsx.
//  "instead": things I did instead of the ONE task (clock ticks forward each slide)
//  "tiny":    tiny first steps that get me unstuck
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BODY, HEAD } from "../Composition";
import { Bubble, FocoCard, Photo } from "./Carousel";

type InsteadSlide = { photo: string; time: string; label: string; comment: string };
export const INSTEAD: InsteadSlide[] = [
  { photo: "hook2", time: "10:00 am", label: "Things I did today instead of", comment: "the ONE task I had to do 🙃" },
  { photo: "fridge", time: "10:15 am", label: "Checked the fridge", comment: "4 times. nothing new appeared 🧀" },
  { photo: "plants", time: "11:40 am", label: "Talked to my plants", comment: "they're thriving. I am not 🌿" },
  { photo: "spices", time: "1:30 pm", label: "Reorganized the spice rack", comment: "alphabetically. then by color 🌈" },
  { photo: "youtube", time: "4:00 pm", label: "Watched a video about productivity", comment: "felt very productive 🤓" },
  { photo: "scroll", time: "9:30 pm", label: "Researched octopuses", comment: "for 2 hours?? they have 3 hearts btw 🐙" },
  { photo: "clock", time: "11:12 pm", label: "The task: send ONE invoice", comment: "how long it took once I started: 4 min 💀" },
];

type TinySlide = { photo: string; label: string; step?: string; min?: number };
export const TINY: TinySlide[] = [
  { photo: "hook3", label: "Tiny first steps that actually get me unstuck" },
  { photo: "clean", label: "Can't clean the whole room?", step: "Pick up 5 things. Just 5.", min: 2 },
  { photo: "study", label: "Can't start studying?", step: "Open the book to the right page. That's it.", min: 1 },
  { photo: "gym", label: "Can't make yourself work out?", step: "Put your shoes on. Nothing else yet.", min: 1 },
  { photo: "inbox", label: "Inbox at 2,000 unread?", step: "Answer the newest one only.", min: 3 },
  { photo: "cook", label: "Too tired to cook?", step: "Take out one pan. Let it sit there.", min: 1 },
  { photo: "shower", label: "Can't get in the shower?", step: "Turn the water on. Let it warm up.", min: 1 },
];

export const TimeChip: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#fff", background: "rgba(10,4,16,0.72)", padding: "10px 28px", borderRadius: 999 }}>🕐 {time}</div>
  </div>
);

const FinalWrap: React.FC<{ photo: string; children: React.ReactNode }> = ({ photo, children }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Photo name={photo} blur />
    <AbsoluteFill style={{ background: "rgba(20,10,34,0.25)" }} />
    {children}
  </AbsoluteFill>
);

export const InsteadSlideView: React.FC<{ index: number }> = ({ index }) => {
  if (index === INSTEAD.length) {
    return (
      <FinalWrap photo="clock">
        <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
          <Bubble size={50}>now I just ask FOCO for step 1 💜</Bubble>
          <div style={{ height: 12 }} />
          <Bubble size={42}>(the app with the purple blob icon)</Bubble>
        </div>
        <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <FocoCard title="Send the invoice" steps={[{ text: "Open last month's invoice", min: 1 }, { text: "Change date + amount", min: 2 }, { text: "Hit send", min: 1 }]} />
        </div>
        <div style={{ position: "absolute", top: 1330, left: 60, right: 60 }}>
          <Bubble bg="#FFFFFF" color="#160F22" size={46}>be honest, what did YOU do today instead? 👇</Bubble>
        </div>
      </FinalWrap>
    );
  }
  const s = INSTEAD[index];
  const hook = index === 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo name={s.photo} />
      <TimeChip time={s.time} />
      <div style={{ position: "absolute", top: hook ? 640 : 1180, left: 60, right: 60 }}>
        <Bubble size={hook ? 62 : 56}>{s.label}</Bubble>
        <div style={{ height: 14 }} />
        <Bubble size={hook ? 56 : 46}>{s.comment}</Bubble>
        {hook ? (
          <>
            <div style={{ height: 14 }} />
            <Bubble size={40} bg="#FFFFFF" color="#160F22">(ADHD edition)</Bubble>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const StepCard: React.FC<{ step: string; min: number }> = ({ step, min }) => (
  <div style={{ width: 800, borderRadius: 40, padding: "30px 36px", background: "#130A22", border: "2px solid rgba(167,139,250,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Img src={staticFile("apps/foco-icon.png")} style={{ width: 46, height: 46, borderRadius: 12 }} />
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: "#A78BFA" }}>YOUR FIRST STEP</div>
    </div>
    <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 22, padding: "22px 22px", borderRadius: 24, background: "rgba(124,58,237,0.18)", border: "2px solid #A78BFA" }}>
      <div style={{ width: 60, height: 60, borderRadius: 999, background: "#7C3AED", color: "#fff", fontFamily: HEAD, fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</div>
      <div style={{ flex: 1, fontFamily: BODY, fontWeight: 700, fontSize: 42, lineHeight: 1.2, color: "#fff" }}>{step}</div>
      <div style={{ width: 84, padding: "8px 0", borderRadius: 16, background: "rgba(167,139,250,0.22)", border: "2px solid #A78BFA", textAlign: "center", fontFamily: BODY, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>
        <div style={{ fontSize: 34 }}>{min}</div>
        <div style={{ fontSize: 20, color: "#D6D0E4" }}>min</div>
      </div>
    </div>
    <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: "#B8B0CC" }}>that's it. the rest gets easier once you're moving.</div>
  </div>
);

export const TinySlideView: React.FC<{ index: number }> = ({ index }) => {
  if (index === TINY.length) {
    return (
      <FinalWrap photo="hook3">
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <Bubble size={50}>when I can't even think of step 1,</Bubble>
          <div style={{ height: 8 }} />
          <Bubble size={50}>FOCO breaks it down for me 💜</Bubble>
        </div>
        <div style={{ position: "absolute", top: 560, left: "50%", transform: "translateX(-50%) rotate(-3deg)", width: 470, height: 1020, borderRadius: 60, overflow: "hidden", border: "12px solid #0d0a14", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
          <Img src={staticFile("apps/foco-3.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        </div>
        <div style={{ position: "absolute", bottom: 210, left: 60, right: 60 }}>
          <Bubble bg="#FFFFFF" color="#160F22" size={46}>save this for your next frozen day 📌</Bubble>
        </div>
      </FinalWrap>
    );
  }
  const s = TINY[index];
  if (!s.step) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <Photo name={s.photo} />
        <div style={{ position: "absolute", top: 260, left: 60, right: 60 }}>
          <Bubble size={64}>{s.label}</Bubble>
          <div style={{ height: 14 }} />
          <Bubble size={44} bg="#FFFFFF" color="#160F22">(for ADHD brains that freeze 🧊)</Bubble>
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo name={s.photo} />
      <div style={{ position: "absolute", top: 260, left: 60, right: 60 }}>
        <Bubble size={58}>{s.label}</Bubble>
      </div>
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <StepCard step={s.step} min={s.min!} />
      </div>
    </AbsoluteFill>
  );
};
