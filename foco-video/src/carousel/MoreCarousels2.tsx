// Carousels 4-5, same Flowfy-style format:
//  "morning": my ADHD morning, the plan vs what actually happened
//  "lazy":    things that look lazy but are really a starting problem
import React from "react";
import { AbsoluteFill } from "remotion";
import { BODY } from "../Composition";
import { Bubble, FocoCard, Photo } from "./Carousel";

type PairSlide = { photo: string; top: string; bottom: string };
type Ending = { photo: string; lines: string[]; title: string; steps: { text: string; min: number }[]; ask: string };
type Set = { hook: { photo: string; title: string; sub: string; tag: string }; topLabel: string; bottomLabel: string; slides: PairSlide[]; ending: Ending };

export type PairSetId = "morning" | "lazy" | "say" | "tax";
export const SETS: Record<PairSetId, Set> = {
  morning: {
    hook: { photo: "hook4", title: "My ADHD morning:", sub: "the plan vs what actually happened ☀️", tag: "(it's every day btw)" },
    topLabel: "THE PLAN", bottomLabel: "REALITY",
    slides: [
      { photo: "alarm", top: "6:30 wake up, no snooze", bottom: "snoozed 7 times. negotiated with myself each time ⏰" },
      { photo: "phonebed", top: "7:00 journal + gratitude", bottom: "\"quickly\" checked one notification. it's 7:50 📱" },
      { photo: "coffee", top: "7:15 mindful coffee", bottom: "made coffee. found it cold at 11am ☕" },
      { photo: "mirror", top: "7:30 outfit picked the night before", bottom: "tried on 4 outfits. went back to #1 👗" },
      { photo: "keys", top: "7:55 leave calmly", bottom: "8:10 where are my keys. 8:14 they were in my hand 🔑" },
      { photo: "late", top: "arrive early ✨", bottom: "arrived \"on time\" (sprinting) 🏃‍♀️" },
    ],
    ending: {
      photo: "hook4", lines: ["tomorrow's plan: way smaller steps", "FOCO breaks my mornings down for me 💜"],
      title: "Get out the door", steps: [{ text: "Phone across the room", min: 1 }, { text: "Keys in my shoe tonight", min: 1 }, { text: "Coffee to-go cup ready", min: 2 }],
      ask: "which part is YOUR morning? 👇",
    },
  },
  lazy: {
    hook: { photo: "hook5", title: "Things that look lazy", sub: "but are actually a starting problem", tag: "(not a character flaw 💜)" },
    topLabel: "LOOKS LIKE", bottomLabel: "WHAT'S REALLY GOING ON",
    slides: [
      { photo: "soak", top: "leaving the pan to \"soak\" for 3 days", bottom: "scrub, rinse, dry, put away = too many steps to start 🍳" },
      { photo: "mail", top: "unopened mail for weeks", bottom: "opening it means 5 new decisions I can't face yet ✉️" },
      { photo: "chair", top: "the chair of clothes", bottom: "every item = its own tiny \"where does this go\" decision 🪑" },
      { photo: "texts", top: "read your text, never replied", bottom: "waiting to reply \"properly\". the perfect moment never comes 💬" },
      { photo: "suitcase", top: "suitcase still packed 3 weeks after the trip", bottom: "no obvious first step, so I never start 🧳" },
      { photo: "bottles", top: "water bottles collecting on my desk", bottom: "each trip to the kitchen is one more task to start 🫙" },
    ],
    ending: {
      photo: "hook5", lines: ["what helps me: a smaller first step,", "not more willpower. FOCO finds it for me 💜"],
      title: "Unpack the suitcase", steps: [{ text: "Dirty clothes to the hamper", min: 3 }, { text: "Toiletries back to the bathroom", min: 2 }, { text: "Zip it, slide under the bed", min: 1 }],
      ask: "which one is you? 👇 (mine is the chair)",
    },
  },
  say: {
    hook: { photo: "hook6", title: "What people say", sub: "vs what my ADHD brain hears 🧠", tag: "(said with love, mostly)" },
    topLabel: "THEY SAY", bottomLabel: "MY BRAIN HEARS",
    slides: [
      { photo: "sayStart", top: "\"just start!\"", bottom: "start WHERE?? there are like 40 steps 🫠" },
      { photo: "sayFive", top: "\"it'll only take 5 minutes\"", bottom: "then why does it feel like climbing a mountain ⛰️" },
      { photo: "sayWrite", top: "\"just write it down\"", bottom: "wrote it down. on 6 different sticky notes. lost all 6 📝" },
      { photo: "sayEarlier", top: "\"why didn't you do it earlier?\"", bottom: "I was thinking about doing it the WHOLE time 😵‍💫" },
      { photo: "sayPressure", top: "\"you work so well under pressure\"", bottom: "a deadline is the only thing that gets me moving ⏳" },
      { photo: "sayPlanner", top: "\"have you tried a planner?\"", bottom: "I own 6 planners. all started in January 📒" },
    ],
    ending: {
      photo: "hook6", lines: ["what actually helps me: the first step,", "already broken down. FOCO does that 💜"],
      title: "Start the project", steps: [{ text: "Open a blank doc", min: 1 }, { text: "Write the title only", min: 1 }, { text: "List 3 messy bullet points", min: 3 }],
      ask: "what's the one YOU hear the most? 👇",
    },
  },
  tax: {
    hook: { photo: "hook7", title: "ADHD tax:", sub: "5-minute tasks I avoided and what they cost me 💸", tag: "(this hurt to write)" },
    topLabel: "THE TASK I AVOIDED", bottomLabel: "WHAT IT COST ME",
    slides: [
      { photo: "taxPackage", top: "return the package", bottom: "missed the return window. kept a $60 jacket I hate 📦" },
      { photo: "taxParking", top: "renew the parking permit", bottom: "$75 ticket. then a late fee on the ticket 🅿️" },
      { photo: "taxTrial", top: "cancel the free trial", bottom: "charged for a full year of an app I opened once 💳" },
      { photo: "taxLibrary", top: "return 3 library books", bottom: "late fees > the price of buying them 📚" },
      { photo: "taxFridge", top: "cook the groceries I bought", bottom: "threw out $40 of vegetables. again 🥬" },
      { photo: "taxBill", top: "set up autopay", bottom: "late fee on a bill I had the money for 🙃" },
    ],
    ending: {
      photo: "hook7", lines: ["the 5-minute tasks are the expensive ones.", "now FOCO breaks them down before they cost me 💜"],
      title: "Cancel the free trial", steps: [{ text: "Open Settings > Subscriptions", min: 1 }, { text: "Tap the app", min: 1 }, { text: "Hit Cancel", min: 1 }],
      ask: "what's YOUR most expensive ADHD tax? 👇",
    },
  },
};

export const Tag: React.FC<{ children: React.ReactNode; bg: string }> = ({ children, bg }) => (
  <div style={{ textAlign: "center", marginBottom: 10 }}>
    <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: "#fff", background: bg, padding: "6px 18px", borderRadius: 12 }}>{children}</span>
  </div>
);

export const PairSlideView: React.FC<{ set: PairSetId; index: number }> = ({ set, index }) => {
  const S = SETS[set];
  if (index === 0) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <Photo name={S.hook.photo} />
        <div style={{ position: "absolute", top: 640, left: 60, right: 60 }}>
          <Bubble size={64}>{S.hook.title}</Bubble>
          <div style={{ height: 14 }} />
          <Bubble size={54}>{S.hook.sub}</Bubble>
          <div style={{ height: 14 }} />
          <Bubble size={40} bg="#FFFFFF" color="#160F22">{S.hook.tag}</Bubble>
        </div>
      </AbsoluteFill>
    );
  }
  if (index === S.slides.length + 1) {
    const E = S.ending;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <Photo name={E.photo} blur />
        <AbsoluteFill style={{ background: "rgba(20,10,34,0.25)" }} />
        <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
          {E.lines.map((l) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <Bubble size={48}>{l}</Bubble>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 580, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <FocoCard title={E.title} steps={E.steps} />
        </div>
        <div style={{ position: "absolute", top: 1340, left: 60, right: 60 }}>
          <Bubble bg="#FFFFFF" color="#160F22" size={48}>{E.ask}</Bubble>
        </div>
      </AbsoluteFill>
    );
  }
  const s = S.slides[index - 1];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo name={s.photo} />
      <div style={{ position: "absolute", top: 230, left: 60, right: 60 }}>
        <Tag bg="#7C3AED">{S.topLabel}</Tag>
        <Bubble size={54}>{s.top}</Bubble>
      </div>
      <div style={{ position: "absolute", top: 1200, left: 60, right: 60 }}>
        <Tag bg="#FB923C">{S.bottomLabel}</Tag>
        <Bubble size={48} bg="#FFFFFF" color="#160F22">{s.bottom}</Bubble>
      </div>
    </AbsoluteFill>
  );
};
