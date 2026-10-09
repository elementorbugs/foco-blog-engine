// FOCO feature demos built from real screen recordings (public/demo-clips/*.mp4, 384x832).
// One template, several cuts: each cut is a list of source segments (seconds in the recording)
// with a playback rate, a caption, an optional camera push and tap markers.
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BODY, Background, C, HAND, HEAD } from "../Composition";
import VO_DUR from "./demo-vo.json";

export const CLIP_FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, from: number, damping = 14) => spring({ frame: frame - from, fps: CLIP_FPS, config: { damping } });

type Tap = { t: number; x: number; y: number }; // t = seconds in the source recording
type Cover = { x: number; y: number; w: number; h: number; color: string; text?: string };
type Seg = {
  from: number;
  to: number;
  rate: number;
  caption?: React.ReactNode;
  cam?: { s: number; y: number }; // phone zoom + focus point (fraction of screen height)
  taps?: Tap[];
  ding?: boolean;
  patch?: string; // color behind the recorder's REC watermark
  covers?: Cover[];
  vo?: string; // key in demo-vo.json; the segment slows down if the line needs more time
  card?: { title: string; sub: string }; // "step done" card under the phone; consecutive equal cards merge
  marks?: Mark[]; // orange outlines that point at proof on screen (date, time...)
  chips?: { t: number; items: string[] }; // floating stickers that pop out of the phone
  clip?: string; // overrides the cut's recording, so one cut can mix recordings
  stage?: number; // index into cut.stages, lights up the stage bar
  confetti?: boolean;
  // Full-screen real-life footage instead of the phone; from/to are seconds in this file.
  // pos = horizontal crop focus (0..1); timer = floating FOCO focus timer counting down from this many seconds
  broll?: { src: string; pos: number; timer?: number };
};
// t = source seconds when it appears; spot = dim everything else on the screen
type Mark = { t: number; x: number; y: number; w: number; h: number; spot?: boolean };
// Optional pre-roll before the phone: "sticky" = a handwritten note that gets photographed,
// "chaos" = task words flying around a stressed mascot, then sucked away
type Intro = { kind?: "sticky" | "chaos" | "days"; title: string; items: string[]; frames: number; vo?: string; bg?: string };
// Optional beat between intro and phone: several recordings play side by side in small phones
type MPart = { clip: string; from: number; to: number; label: string; patches: { until: number; color: string }[]; cover?: { until: number; c: Cover } };
type Montage = { frames: number; vo?: string; parts: MPart[] };
export type Cut = {
  id: string;
  clip: string;
  hook: [string, string];
  segs: Seg[];
  musicFrom?: number;
  cta?: [string, string]; // end card headline, second line ends in the orange word
  ctaVo?: string;
  intro?: Intro;
  stages?: string[]; // stage bar under the caption (Type · Say · Snap ...)
  montage?: Montage;
  bg?: string; // blurred real-life footage looping behind the phone
};

const hl = (s: string) => <span style={{ color: C.celebrate }}>{s}</span>;
const NAVY = "rgb(12,14,22)";
const VO = VO_DUR as Record<string, number>;

const STEP1 = { title: "Clear all dishes into the sink", sub: "Step 1 of 5 · done" };

const TEXT_NAME_COVER: Cover = { x: 0.12, y: 0.4, w: 0.76, h: 0.07, color: NAVY, text: "Good morning!" };

const DISHES = "video/task-breakdown/broll-smaller.mp4"; // stock footage: woman washing dishes, 10s

// ───────────────────────── The cuts ─────────────────────────
export const CUTS: Cut[] = [
  {
    id: "DemoUGC",
    clip: "voice",
    musicFrom: 150,
    hook: ["POV: ADHD +", "dirty dishes"],
    cta: ["Brain does this too?", "Try FOCO."],
    ctaVo: "u8",
    bg: DISHES,
    intro: { kind: "days", title: "the dishes:", items: ["Day 1", "Day 2", "Day 3"], frames: 135, vo: "u1", bg: DISHES },
    segs: [
      { from: 17.3, to: 19.6, rate: 1, vo: "u2", patch: "rgb(17,21,34)", caption: <>So I told FOCO: {hl("clean the kitchen")}</> },
      { from: 22.0, to: 28.5, rate: 2.2, caption: <>It became a {hl("task")}</>, cam: { s: 1.4, y: 0.7 } },
      { from: 38.0, to: 48.5, rate: 1.7, vo: "u3", caption: <>One tap. {hl("Tiny steps.")}</>, taps: [{ t: 40.0, x: 0.3, y: 0.34 }, { t: 42.4, x: 0.3, y: 0.81 }] },
      { from: 53.0, to: 55.8, rate: 1, vo: "u4", caption: <>Step 1? {hl("I can do that.")}</>, cam: { s: 1.3, y: 0.3 } },
      { from: 64.0, to: 69.9, rate: 1.6, vo: "u5", caption: <>Music on. {hl("Start.")}</>, cam: { s: 1.12, y: 0.6 }, taps: [{ t: 67.4, x: 0.2, y: 0.71 }, { t: 68.6, x: 0.47, y: 0.574 }, { t: 69.6, x: 0.5, y: 0.75 }] },
      { from: 74.0, to: 79.0, rate: 3.2, caption: <>FOCO counts me in...</> },
      { from: 0.5, to: 9.5, rate: 1, vo: "u6", caption: <>...and I {hl("actually did it")}</>, broll: { src: DISHES, pos: 0.38, timer: 180 } },
      { from: 85.0, to: 88.6, rate: 1, vo: "u7", caption: <>{hl("Step 1 done.")} Day 3, over.</>, cam: { s: 1.12, y: 0.36 }, ding: true, confetti: true, card: STEP1 },
    ],
  },
  {
    id: "DemoBrain",
    clip: "scan",
    musicFrom: 100,
    hook: ["My ADHD brain at 9 AM:", "FOCO, take it."],
    cta: ["Get it out of your head.", "Into FOCO."],
    ctaVo: "b10",
    intro: {
      kind: "chaos",
      title: "",
      items: ["Call dentist!", "Reply to emails", "Kitchen is a mess", "Pay the bill", "Groceries??", "Presentation MONDAY", "Book doctor", "Laundry", "Text mom back", "Taxes!!", "Gym?", "Renew passport"],
      frames: 240,
      vo: "b1",
    },
    montage: {
      frames: 165,
      vo: "b2",
      parts: [
        { clip: "text", from: 2.0, to: 10.6, label: "TYPE", patches: [{ until: 8.0, color: "rgb(41,40,47)" }, { until: 99, color: NAVY }], cover: { until: 8.0, c: TEXT_NAME_COVER } },
        { clip: "voice", from: 17.3, to: 28.5, label: "SAY", patches: [{ until: 19.7, color: "rgb(17,21,34)" }, { until: 99, color: NAVY }] },
        { clip: "scan", from: 11.0, to: 24.3, label: "SNAP", patches: [{ until: 11.9, color: NAVY }, { until: 17.9, color: "#000" }, { until: 99, color: NAVY }] },
      ],
    },
    segs: [
      {
        clip: "text", from: 18.5, to: 20.6, rate: 1, vo: "b3", caption: <>Straight into {hl("your calendar")}</>, cam: { s: 1.3, y: 0.3 },
        marks: [{ t: 18.8, x: 0.45, y: 0.168, w: 0.105, h: 0.072 }, { t: 19.4, x: 0.255, y: 0.362, w: 0.24, h: 0.024 }],
      },
      { clip: "scan", from: 28.2, to: 31.0, rate: 1.2, vo: "b4", caption: <>One {hl("calm")} list</> },
      { clip: "scan", from: 31.0, to: 35.4, rate: 1.2, vo: "b5", caption: <>The scary one? {hl("Pick it.")}</>, marks: [{ t: 31.3, x: 0.035, y: 0.625, w: 0.93, h: 0.085, spot: true }], taps: [{ t: 35.1, x: 0.4, y: 0.665 }] },
      { clip: "scan", from: 35.6, to: 38.8, rate: 1.3, vo: "b6", caption: <>{hl("AI")} cuts it down</>, cam: { s: 1.15, y: 0.7 }, marks: [{ t: 36.0, x: 0.04, y: 0.79, w: 0.92, h: 0.05, spot: true }], taps: [{ t: 38.6, x: 0.35, y: 0.815 }] },
      {
        clip: "scan", from: 44.0, to: 49.5, rate: 1.6, vo: "b7", caption: <>Suddenly, {hl("doable")}</>, cam: { s: 1.25, y: 0.45 },
        chips: { t: 44.6, items: ["Open your email inbox", "Flag the 3 most urgent", "Draft the first reply", "Send quick responses", "Close the email tab"] },
      },
      { clip: "scan", from: 72.0, to: 77.6, rate: 1.5, vo: "b8", caption: <>FOCO {hl("sits with you")}</>, cam: { s: 1.12, y: 0.6 }, taps: [{ t: 72.2, x: 0.2, y: 0.758 }, { t: 74.4, x: 0.29, y: 0.574 }, { t: 77.3, x: 0.5, y: 0.75 }] },
      { clip: "scan", from: 82.0, to: 89.0, rate: 3.5, caption: <>Just {hl("step 1")}</>, cam: { s: 1.15, y: 0.42 } },
      { clip: "scan", from: 95.0, to: 97.6, rate: 0.9, vo: "b9", caption: <>{hl("Done.")}</>, cam: { s: 1.12, y: 0.36 }, ding: true, confetti: true, card: { title: "Open your email", sub: "Step 1 of 5 · done" } },
    ],
  },
  {
    id: "DemoCapture",
    clip: "text",
    musicFrom: 20,
    hook: ["ADHD brain full of tasks?", "Type. Say. Snap."],
    cta: ["Type it. Say it. Snap it.", "FOCO plans it."],
    ctaVo: "m11",
    stages: ["Type", "Say", "Snap", "Plan", "Split", "Focus"],
    segs: [
      { clip: "text", stage: 0, from: 2.0, to: 8.0, rate: 1.6, vo: "m1", caption: <>{hl("Type it")}, like a text</>, patch: "rgb(41,40,47)", covers: [TEXT_NAME_COVER] },
      { clip: "text", stage: 0, from: 8.0, to: 10.6, rate: 1.3, caption: <>FOCO {hl("gets it")}</>, cam: { s: 1.25, y: 0.3 } },
      { clip: "voice", stage: 1, from: 17.3, to: 19.6, rate: 1, vo: "m2", patch: "rgb(17,21,34)", caption: <>Or {hl("say it")}</> },
      { clip: "voice", stage: 1, from: 22.0, to: 28.5, rate: 1.6, vo: "m3", caption: <>It becomes a {hl("task")}</>, cam: { s: 1.4, y: 0.7 } },
      { clip: "scan", stage: 2, from: 11.0, to: 17.8, rate: 2, vo: "m4", patch: "#000", caption: <>Or {hl("snap")} any list</>, taps: [{ t: 11.3, x: 0.5, y: 0.7 }, { t: 15.3, x: 0.5, y: 0.91 }, { t: 17.3, x: 0.85, y: 0.873 }] },
      {
        clip: "scan", stage: 2, from: 18.0, to: 24.3, rate: 1.5, vo: "m5", caption: <>Every task, {hl("found")}</>, cam: { s: 1.2, y: 0.4 },
        chips: { t: 21.0, items: ["Finish presentation", "Reply to important emails", "Book a doctor's appointment", "Pay the electricity bill", "Buy groceries for dinner"] },
      },
      {
        clip: "text", stage: 3, from: 18.5, to: 20.6, rate: 1, vo: "m6", caption: <>In your calendar. {hl("At your time.")}</>, cam: { s: 1.3, y: 0.3 },
        marks: [{ t: 18.8, x: 0.45, y: 0.168, w: 0.105, h: 0.072 }, { t: 19.4, x: 0.255, y: 0.362, w: 0.24, h: 0.024 }],
      },
      { clip: "scan", stage: 3, from: 27.5, to: 31.0, rate: 1, vo: "m7", caption: <>All of it, {hl("ready for your day")}</> },
      {
        clip: "scan", stage: 4, from: 31.0, to: 35.4, rate: 1, vo: "m8", caption: <>Too big? {hl("Pick it")}</>,
        marks: [{ t: 31.4, x: 0.035, y: 0.625, w: 0.93, h: 0.085, spot: true }], taps: [{ t: 35.1, x: 0.4, y: 0.665 }],
      },
      {
        clip: "scan", stage: 4, from: 35.6, to: 38.8, rate: 1.2, vo: "m9", caption: <>Let {hl("AI split it")}</>, cam: { s: 1.15, y: 0.7 },
        marks: [{ t: 36.2, x: 0.04, y: 0.79, w: 0.92, h: 0.05, spot: true }], taps: [{ t: 38.6, x: 0.35, y: 0.815 }],
      },
      {
        clip: "scan", stage: 4, from: 44.0, to: 49.5, rate: 1.4, vo: "m10", caption: <>{hl("Tiny steps")} you can start</>, cam: { s: 1.25, y: 0.45 },
        chips: { t: 45.0, items: ["Open your email inbox", "Flag the 3 most urgent", "Draft the first reply", "Send quick responses", "Close the email tab"] },
      },
      { clip: "scan", stage: 5, from: 70.0, to: 77.6, rate: 1.6, vo: "f1", caption: <>Focus on {hl("step 1")}. Pick a sound.</>, cam: { s: 1.12, y: 0.6 }, taps: [{ t: 72.2, x: 0.2, y: 0.758 }, { t: 74.4, x: 0.29, y: 0.574 }, { t: 77.3, x: 0.5, y: 0.75 }] },
      { clip: "scan", stage: 5, from: 79.0, to: 87.0, rate: 3, vo: "c8", caption: <>FOCO {hl("counts you in")}...</> },
      { clip: "scan", stage: 5, from: 87.0, to: 89.5, rate: 1, caption: <>...and {hl("stays with you")}</>, cam: { s: 1.2, y: 0.4 } },
      { clip: "scan", stage: 5, from: 95.0, to: 97.6, rate: 1, vo: "f2", caption: <>{hl("Step 1 done!")}</>, cam: { s: 1.12, y: 0.36 }, ding: true, card: { title: "Open your email", sub: "Step 1 of 5 · done" } },
    ],
  },
  {
    id: "DemoVoice",
    clip: "voice",
    hook: ["ADHD and can't start the dishes?", "Watch this."],
    cta: ["Can't start?", "Start with FOCO"],
    ctaVo: "v11",
    segs: [
      // 7.5-13.3 and 17.3-19.6 skip the failed first try ("Hold the mic and speak clearly" warning at 14-17s)
      { from: 7.5, to: 13.3, rate: 1.4, patch: "rgb(17,21,34)", vo: "v1", caption: <>Can't start? {hl("Say it out loud.")}</> },
      { from: 17.3, to: 19.6, rate: 1, patch: "rgb(17,21,34)", vo: "v2", caption: <>Hold the mic. {hl("Say it.")}</> },
      { from: 20.0, to: 28.5, rate: 1.4, vo: "v3", caption: <>FOCO turns it into a {hl("task")}</>, cam: { s: 1.25, y: 0.62 } },
      { from: 38.0, to: 48.5, rate: 1.5, vo: "v4", caption: <>One tap. {hl("AI splits it")} into steps.</>, taps: [{ t: 40.0, x: 0.3, y: 0.34 }, { t: 42.4, x: 0.3, y: 0.81 }] },
      { from: 53.0, to: 55.8, rate: 1, vo: "v5", caption: <>Step 1 is {hl("tiny on purpose")}</>, cam: { s: 1.3, y: 0.3 } },
      { from: 64.0, to: 69.9, rate: 1.3, vo: "v6", caption: <>Pick the step. {hl("Pick your music.")}</>, cam: { s: 1.12, y: 0.6 }, taps: [{ t: 67.4, x: 0.2, y: 0.71 }, { t: 68.6, x: 0.47, y: 0.574 }, { t: 69.6, x: 0.5, y: 0.75 }] },
      { from: 72.0, to: 79.0, rate: 2.5, vo: "v7", caption: <>FOCO counts you in...</> },
      { from: 79.0, to: 82.2, rate: 1, vo: "v8", caption: <>...and {hl("stays with you")}</>, cam: { s: 1.2, y: 0.4 } },
      { from: 85.0, to: 88.6, rate: 1, vo: "v9", caption: <>{hl("You did it!")}</>, cam: { s: 1.12, y: 0.36 }, ding: true, card: STEP1 },
      { from: 94.06, to: 94.8, rate: 0.25, vo: "v10", caption: <>Checked off. {hl("4 steps to go.")}</>, cam: { s: 1.3, y: 0.4 }, card: STEP1 },
    ],
  },
  {
    id: "DemoSchedule",
    clip: "text",
    musicFrom: 60,
    hook: ["ADHD and nothing makes it to your calendar?", "Just text it."],
    cta: ["Say when.", "FOCO schedules it."],
    ctaVo: "s5",
    segs: [
      {
        from: 2.0, to: 8.0, rate: 1.6, vo: "s1", caption: <>Type it {hl("like a text")}</>, patch: "rgb(41,40,47)",
        covers: [{ x: 0.12, y: 0.4, w: 0.76, h: 0.07, color: NAVY, text: "Good morning!" }],
      },
      { from: 8.0, to: 10.6, rate: 1, vo: "s2", caption: <>FOCO {hl("gets it")}</>, cam: { s: 1.25, y: 0.3 } },
      {
        from: 11.4, to: 15.4, rate: 1, vo: "s3", caption: <>Tomorrow. Morning. {hl("7 AM.")}</>, cam: { s: 1.28, y: 0.42 },
        marks: [
          { t: 11.8, x: 0.64, y: 0.356, w: 0.29, h: 0.036 },
          { t: 12.6, x: 0.69, y: 0.29, w: 0.24, h: 0.037 },
          { t: 13.4, x: 0.08, y: 0.584, w: 0.38, h: 0.031 },
        ],
      },
      { from: 16.0, to: 17.4, rate: 1, caption: <>{hl("Added")} in one tap</>, cam: { s: 1.25, y: 0.3 } },
      {
        from: 18.5, to: 20.6, rate: 1, vo: "s4", caption: <>On your calendar. {hl("Thursday, 7 AM.")}</>, cam: { s: 1.3, y: 0.3 },
        card: { title: "Call dentist", sub: "Scheduled · Thu Oct 8 · 7:00 AM" },
        marks: [
          { t: 18.8, x: 0.45, y: 0.168, w: 0.105, h: 0.072 },
          { t: 19.4, x: 0.255, y: 0.362, w: 0.24, h: 0.024 },
        ],
      },
    ],
  },
  {
    id: "DemoScan",
    clip: "scan",
    musicFrom: 40,
    hook: ["Your to-do list lives on sticky notes?", "Snap it."],
    cta: ["Messy list?", "First step, done."],
    ctaVo: "c10",
    // Same five tasks FOCO pulls out of the photo in the recording
    intro: {
      title: "TO DO!!",
      items: ["Finish presentation (Mon!)", "Reply to emails", "Book doctor", "Pay electricity", "Groceries for dinner"],
      frames: 150,
      vo: "c1",
    },
    segs: [
      { from: 10.0, to: 17.8, rate: 1.8, vo: "c2", caption: <>Snap any list. {hl("Paper, notes, a screen.")}</>, patch: "#000", taps: [{ t: 11.3, x: 0.5, y: 0.7 }, { t: 15.3, x: 0.5, y: 0.91 }, { t: 17.3, x: 0.85, y: 0.873 }] },
      {
        from: 18.0, to: 24.3, rate: 1.3, vo: "c3", caption: <>FOCO {hl("finds every task")}</>, cam: { s: 1.2, y: 0.4 },
        chips: { t: 21.0, items: ["Finish presentation", "Reply to important emails", "Book a doctor's appointment", "Pay the electricity bill", "Buy groceries for dinner"] },
      },
      { from: 24.3, to: 31.0, rate: 1.5, vo: "c4", caption: <>{hl("5 tasks.")} One tap. In your day.</>, taps: [{ t: 24.5, x: 0.5, y: 0.82 }] },
      // The key beat: pick ONE of the five, it's too big, AI splits it
      {
        from: 31.0, to: 35.4, rate: 1, vo: "p1", caption: <>Pick {hl("ONE")} to start</>,
        marks: [{ t: 31.6, x: 0.035, y: 0.625, w: 0.93, h: 0.085, spot: true }], taps: [{ t: 35.1, x: 0.4, y: 0.665 }],
      },
      {
        from: 35.6, to: 38.8, rate: 1, vo: "p2", caption: <>Too big? {hl("Let AI split it")}</>, cam: { s: 1.15, y: 0.7 },
        marks: [{ t: 36.4, x: 0.04, y: 0.79, w: 0.92, h: 0.05, spot: true }], taps: [{ t: 38.6, x: 0.35, y: 0.815 }],
      },
      {
        from: 38.8, to: 42.0, rate: 1, vo: "p3", caption: <>{hl("AI")} is breaking it down...</>, cam: { s: 1.3, y: 0.22 },
        marks: [{ t: 39.1, x: 0.04, y: 0.16, w: 0.92, h: 0.075, spot: true }],
      },
      {
        from: 44.0, to: 49.5, rate: 1.2, vo: "p4", caption: <>1 big task. {hl("5 tiny steps.")}</>, cam: { s: 1.25, y: 0.45 },
        chips: { t: 45.0, items: ["Open your email inbox", "Flag the 3 most urgent", "Draft the first reply", "Send quick responses", "Close the email tab"] },
      },
      { from: 70.0, to: 77.6, rate: 1.6, vo: "c7", caption: <>Pick step 1. {hl("Pick a sound.")}</>, cam: { s: 1.12, y: 0.6 }, taps: [{ t: 72.2, x: 0.2, y: 0.758 }, { t: 74.4, x: 0.29, y: 0.574 }, { t: 77.3, x: 0.5, y: 0.75 }] },
      { from: 79.0, to: 87.0, rate: 3, vo: "c8", caption: <>FOCO counts you in...</> },
      { from: 87.0, to: 89.5, rate: 1, caption: <>...and {hl("stays with you")}</>, cam: { s: 1.2, y: 0.4 } },
      { from: 95.0, to: 97.6, rate: 1, vo: "c9", caption: <>{hl("Step 1 done!")}</>, cam: { s: 1.12, y: 0.36 }, ding: true, card: { title: "Open your email and check title", sub: "Step 1 of 5 · done" } },
    ],
  },
  {
    id: "DemoDrift",
    clip: "scan",
    musicFrom: 80,
    hook: ["ADHD brain wanders mid-task?", "FOCO notices."],
    segs: [
      { from: 77.0, to: 87.0, rate: 3.2, taps: [{ t: 77.3, x: 0.5, y: 0.75 }] },
      { from: 87.0, to: 90.7, rate: 1, caption: <>You're focused. Then your {hl("mind drifts")}...</>, cam: { s: 1.15, y: 0.42 } },
      { from: 90.75, to: 91.65, rate: 0.3, caption: <>FOCO {hl("notices")} and pauses</>, cam: { s: 1.22, y: 0.32 }, taps: [{ t: 91.5, x: 0.5, y: 0.755 }] },
      { from: 91.65, to: 93.6, rate: 1, caption: <>One tap and {hl("you're back")}</>, cam: { s: 1.15, y: 0.42 } },
      { from: 95.0, to: 97.6, rate: 1, caption: <>{hl("Done.")} Even on a scattered day.</>, cam: { s: 1.15, y: 0.4 }, ding: true },
    ],
  },
  {
    id: "DemoText",
    clip: "text",
    musicFrom: 120,
    hook: ["Planner apps feel like paperwork?", "Just text it."],
    segs: [
      {
        from: 2.0, to: 8.0, rate: 1.6, caption: <>Type it {hl("like a text")}</>, patch: "rgb(41,40,47)",
        covers: [{ x: 0.12, y: 0.4, w: 0.76, h: 0.07, color: NAVY, text: "Good morning!" }],
      },
      { from: 8.0, to: 10.6, rate: 1, caption: <>FOCO gets the {hl("task and the time")}</>, cam: { s: 1.25, y: 0.3 } },
      { from: 16.0, to: 17.4, rate: 1, caption: <>{hl("Added")} to your day</>, cam: { s: 1.25, y: 0.3 } },
      { from: 18.5, to: 20.6, rate: 1, caption: <>Tomorrow morning. {hl("Up next.")}</>, cam: { s: 1.2, y: 0.3 }, ding: true },
    ],
  },
];

// ───────────────────────── Timing ─────────────────────────
const HOOK = 80; // hook text sits on top while the first segment plays
const XF = 5; // crossfade frames between segments
const VO_LEAD = 4; // frames between a segment start and its voice line
const VO_PAD = 0.35; // seconds of air after a line before the next segment
// A segment with a voice line slows down (never speeds up) until the line fits
const rateOf = (s: Seg) => (s.vo ? Math.min(s.rate, (s.to - s.from) / (VO[s.vo] + VO_PAD + VO_LEAD / CLIP_FPS)) : s.rate);
const segLen = (s: Seg) => Math.round(((s.to - s.from) / rateOf(s)) * CLIP_FPS);
const ctaLen = (cut: Cut) => Math.max(150, cut.ctaVo ? Math.round((VO[cut.ctaVo] + 1.2) * CLIP_FPS) + 10 : 0);
const starts = (cut: Cut) => {
  const out: number[] = [];
  let t = 0;
  for (const s of cut.segs) {
    out.push(t);
    t += segLen(s);
  }
  return { out, end: t };
};
export const cutTotal = (cut: Cut) => (cut.intro?.frames ?? 0) + (cut.montage?.frames ?? 0) + starts(cut).end + ctaLen(cut);

// Phone geometry on the 1080x1920 canvas
const SW = 700;
const SH = Math.round((SW * 832) / 384);
const BEZ = 18;
const TOP = 360;
const FOCUS_Y = 1180; // where a zoomed-in focus point lands on the canvas

// ───────────────────────── Pieces ─────────────────────────
const Ripple: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < -8 || t > 26) return null;
  const finger = interpolate(t, [-8, 0, 14, 26], [0, 1, 1, 0], clamp);
  const press = interpolate(t, [-3, 0, 5], [1, 0.8, 1], clamp);
  const ring = interpolate(t, [0, 20], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x * SW, top: y * SH }}>
      <div style={{ position: "absolute", left: -80 * ring, top: -80 * ring, width: 160 * ring, height: 160 * ring, borderRadius: 999, border: `5px solid ${C.primary2}`, opacity: 1 - ring }} />
      <div style={{ position: "absolute", left: -34, top: -34, width: 68, height: 68, borderRadius: 999, background: "rgba(255,255,255,0.5)", boxShadow: "0 0 26px rgba(167,139,250,0.9)", opacity: finger, transform: `scale(${press})` }} />
    </div>
  );
};

const MarkBox: React.FC<{ m: Mark; at: number }> = ({ m, at }) => {
  const f = useCurrentFrame();
  const q = pop(f, at, 12);
  const pulse = 1 + Math.sin((f - at) / 6) * 0.025;
  if (f < at) return null;
  const pad = 8;
  return (
    <div
      style={{
        position: "absolute", left: m.x * SW - pad, top: m.y * SH - pad, width: m.w * SW + pad * 2, height: m.h * SH + pad * 2,
        borderRadius: 22, border: `5px solid ${C.celebrate}`,
        boxShadow: `0 0 28px ${C.celebrate}, inset 0 0 18px rgba(251,146,60,0.35)${m.spot ? `, 0 0 0 2400px rgba(4,2,8,${0.62 * q})` : ""}`,
        opacity: m.spot ? 1 : q, transform: `scale(${(m.spot ? 1.15 - q * 0.15 : 1.4 - q * 0.4) * pulse})`,
      }}
    />
  );
};

const SegLayer: React.FC<{ cut: Cut; s: Seg; first: boolean }> = ({ cut, s, first }) => {
  const f = useCurrentFrame();
  const fade = first ? 1 : interpolate(f, [0, XF], [0, 1], clamp);
  const rate = rateOf(s);
  const toFrame = (t: number) => Math.round(((t - s.from) / rate) * CLIP_FPS) + (first ? 0 : XF);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Video
        src={staticFile(`demo-clips/${s.clip ?? cut.clip}.mp4`)}
        trimBefore={Math.round(s.from * CLIP_FPS) - (first ? 0 : Math.round(XF * rate))}
        playbackRate={rate}
        muted
        style={{ width: SW, height: SH }}
      />
      <div style={{ position: "absolute", left: 0.84 * SW, top: 0.962 * SH, width: 0.16 * SW, height: 0.038 * SH, background: s.patch ?? NAVY }} />
      {(s.covers ?? []).map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x * SW, top: c.y * SH, width: c.w * SW, height: c.h * SH, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 700, fontSize: 30, color: "#fff" }}>
          {c.text}
        </div>
      ))}
      {(s.taps ?? []).map((t, i) => (
        <Ripple key={i} x={t.x} y={t.y} at={toFrame(t.t)} />
      ))}
      {(s.marks ?? []).map((m, i) => (
        <MarkBox key={`m${i}`} m={m} at={toFrame(m.t)} />
      ))}
    </AbsoluteFill>
  );
};

const camAt = (cut: Cut, f: number) => {
  const { out } = starts(cut);
  let i = 0;
  while (i + 1 < out.length && f >= out[i + 1]) i++;
  const cur = cut.segs[i].cam ?? { s: 1, y: 0.5 };
  const prev = i > 0 ? cut.segs[i - 1].cam ?? { s: 1, y: 0.5 } : cur;
  const k = interpolate(f - out[i], [0, 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return { s: prev.s + (cur.s - prev.s) * k, y: prev.y + (cur.y - prev.y) * k };
};

const Phone: React.FC<{ cut: Cut; len: number }> = ({ cut, len }) => {
  const f = useCurrentFrame();
  const { out } = starts(cut);
  const enter = pop(f, 0, 16);
  const exit = interpolate(f, [len - 12, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cam = camAt(cut, f);
  const natural = TOP + cam.y * SH;
  const push = Math.min(1, (cam.s - 1) / 0.25);
  const ty = (FOCUS_Y - natural) * push;
  return (
    <div
      style={{
        position: "absolute", left: (1080 - SW) / 2 - BEZ, top: TOP - BEZ, width: SW + BEZ * 2, height: SH + BEZ * 2,
        borderRadius: 92, padding: BEZ, background: "linear-gradient(160deg,#3a2466,#140a24)",
        boxShadow: "0 40px 120px rgba(124,58,237,0.45), inset 0 0 0 2px rgba(167,139,250,0.45)",
        transformOrigin: `50% ${((cam.y * SH + BEZ) / (SH + BEZ * 2)) * 100}%`,
        transform: `translateY(${(1 - enter) * 1000 + exit * 1100 + ty}px) scale(${cam.s})`,
      }}
    >
      <div style={{ position: "relative", width: SW, height: SH, borderRadius: 76, overflow: "hidden", background: NAVY }}>
        {cut.segs.map((s, i) => (
          <Sequence key={i} from={out[i] - (i === 0 ? 0 : XF)} durationInFrames={segLen(s) + (i === 0 ? 0 : XF)} layout="none">
            {s.broll ? null : <SegLayer cut={cut} s={s} first={i === 0} />}
          </Sequence>
        ))}
      </div>
    </div>
  );
};

const TopShade: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 560, background: "linear-gradient(180deg, rgba(4,2,8,0.92) 0%, rgba(4,2,8,0.75) 55%, rgba(4,2,8,0) 100%)" }} />
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const q = pop(f, 0, 16);
  return (
    <div style={{ position: "absolute", top: 110, left: 60, right: 60, textAlign: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 68, lineHeight: 1.12, opacity: q, transform: `translateY(${(1 - q) * 26}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
      {children}
    </div>
  );
};

const Hook: React.FC<{ hook: [string, string]; len: number }> = ({ hook, len }) => {
  const f = useCurrentFrame();
  const a = pop(f, 2, 15);
  const b = pop(f, 20, 11);
  const out = interpolate(f, [len - 8, len], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 80, left: 50, right: 50, textAlign: "center", opacity: out, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, lineHeight: 1.12, color: C.muted, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>{hook[0]}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 104, lineHeight: 1.05, marginTop: 14, color: C.celebrate, opacity: b, transform: `scale(${0.8 + b * 0.2})` }}>{hook[1]}</div>
    </div>
  );
};

// The mascot PNG brought to life in code: hop (celebrate), tremble (stressed), breathe (calm), float (idle)
const AliveMascot: React.FC<{ src: string; size: number; mode: "celebrate" | "stressed" | "calm" | "idle"; style?: React.CSSProperties }> = ({ src, size, mode, style }) => {
  const f = useCurrentFrame();
  // REMOTION_STATIC_MASCOT=1 at render time restores the pre-animation cuts (plain still mascot)
  if (process.env.REMOTION_STATIC_MASCOT === "1") return <Img src={staticFile(src)} style={{ width: size, height: size, ...style }} />;
  let y = 0;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let x = 0;
  let glow = 0.5 + Math.sin(f / 12) * 0.2;
  if (mode === "celebrate") {
    const T = 22;
    const p = (f % T) / T;
    y = -Math.sin(p * Math.PI) * size * 0.16;
    const land = p < 0.12 ? 1 - p / 0.12 : p > 0.9 ? (p - 0.9) / 0.1 : 0; // squash near the ground
    sy = 1 - land * 0.12 + Math.sin(p * Math.PI) * 0.05;
    sx = 1 + land * 0.1 - Math.sin(p * Math.PI) * 0.03;
    rot = Math.sin((f / T) * Math.PI) * 6;
    glow = 0.7 + Math.sin(p * Math.PI) * 0.3;
  } else if (mode === "stressed") {
    x = (random(`sx${Math.floor(f / 2)}`) - 0.5) * 10;
    y = (random(`sy${Math.floor(f / 2)}`) - 0.5) * 6;
    sy = 1 + Math.sin(f / 3) * 0.015;
    rot = Math.sin(f / 4) * 2;
  } else if (mode === "calm") {
    const b = Math.sin((f / 75) * Math.PI * 2);
    sy = 1 + b * 0.04;
    sx = 1 - b * 0.02;
    y = -b * size * 0.02;
    glow = 0.55 + b * 0.35;
  } else {
    y = Math.sin(f / 18) * size * 0.03;
    sy = 1 + Math.sin(f / 18) * 0.02;
  }
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <Img
        src={staticFile(src)}
        style={{
          width: size, height: size, transformOrigin: "50% 92%",
          transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
          filter: `drop-shadow(0 0 ${size * 0.08 * glow}px rgba(167,139,250,${glow}))`,
        }}
      />
      {mode === "celebrate"
        ? Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 + f / 30;
            const ph = ((f + i * 7) % 40) / 40;
            const r = size * (0.45 + ph * 0.25);
            return (
              <div key={i} style={{ position: "absolute", left: size / 2 + Math.cos(a) * r - 9, top: size * 0.45 + Math.sin(a) * r - 9, width: 18, height: 18, background: i % 2 ? C.celebrate : "#fff", clipPath: "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)", opacity: Math.sin(ph * Math.PI), transform: `scale(${0.6 + ph})` }} />
            );
          })
        : null}
    </div>
  );
};

// "Step done" card under the phone: names the step so the win is unmistakable
const DoneCard: React.FC<{ title: string; sub: string; len: number }> = ({ title, sub, len }) => {
  const f = useCurrentFrame();
  const q = pop(f, 4, 13);
  const check = pop(f, 14, 9);
  const out = interpolate(f, [len - 8, len], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", left: 70, right: 70, top: 1470, padding: "34px 40px", borderRadius: 40,
        background: "rgba(16,12,30,0.94)", border: `3px solid ${C.green}`, boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(74,222,128,0.25)",
        display: "flex", alignItems: "center", gap: 34, opacity: q * out, transform: `translateY(${(1 - q) * 80}px)`,
      }}
    >
      <div style={{ width: 104, height: 104, flex: "none", borderRadius: 999, background: C.green, color: "#052e12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 800, fontFamily: BODY, transform: `scale(${check})` }}>✓</div>
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.green, letterSpacing: 2, textTransform: "uppercase" }}>{sub}</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 50, lineHeight: 1.15, marginTop: 6 }}>{title}</div>
      </div>
    </div>
  );
};

const Cta: React.FC<{ line?: [string, string] }> = ({ line }) => {
  const f = useCurrentFrame();
  const m = pop(f, 4, 10);
  const t = pop(f, 20);
  const s = pop(f, 36);
  const b = pop(f, 52);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 70 }}>
      <div style={{ transform: `scale(${m})` }}>
        <AliveMascot src="mascots/foco_state_5_completion.png" size={440} mode="celebrate" />
      </div>
      <Img src={staticFile("foco-logo.png")} style={{ height: 116, marginTop: 26, opacity: t, transform: `scale(${0.8 + t * 0.2})` }} />
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 74, lineHeight: 1.12, textAlign: "center", marginTop: 36, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
        {line ? (
          <>
            {line[0]}
            <br />
            {hl(line[1])}
          </>
        ) : (
          <>
            The ADHD planner
            <br />
            that helps you {hl("start")}
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 28, marginTop: 64, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        <Img src={staticFile("badges/app-store.png")} style={{ height: 108 }} />
        <Img src={staticFile("badges/google-play-cropped.png")} style={{ height: 108 }} />
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.muted, marginTop: 32, opacity: b }}>Free to download</div>
    </AbsoluteFill>
  );
};

// Stage bar under the caption: which part of the flow we're in
const Stages: React.FC<{ cut: Cut; showFrom: number }> = ({ cut, showFrom }) => {
  const f = useCurrentFrame();
  const { out } = starts(cut);
  let i = 0;
  while (i + 1 < out.length && f >= out[i + 1]) i++;
  const cur = cut.segs[i].stage ?? 0;
  const q = f < showFrom ? 0 : pop(f, showFrom, 16);
  return (
    <div style={{ position: "absolute", top: 292, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, opacity: q }}>
      {cut.stages!.map((s, k) => {
        const on = k === cur;
        const done = k < cur;
        return (
          <div
            key={s}
            style={{
              padding: "10px 18px", borderRadius: 999, fontFamily: HEAD, fontWeight: 800, fontSize: cut.stages!.length > 5 ? 27 : 30,
              background: on ? C.celebrate : done ? "rgba(124,58,237,0.55)" : "rgba(255,255,255,0.08)",
              color: on ? "#1a0b02" : done ? "#fff" : "rgba(255,255,255,0.45)",
              border: on ? "none" : "2px solid rgba(167,139,250,0.35)",
              transform: `scale(${on ? 1.12 : 1})`, boxShadow: on ? `0 0 26px ${C.celebrate}` : "none",
            }}
          >
            {done ? "✓ " : ""}
            {s}
          </div>
        );
      })}
    </div>
  );
};

// Stickers that pop out of the phone, alternating left/right down the screen
const Chips: React.FC<{ items: string[]; len: number }> = ({ items, len }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [len - 10, len], [1, 0], clamp);
  return (
    <>
      {items.map((it, i) => {
        const q = pop(f, i * 6, 11);
        const left = i % 2 === 0;
        return (
          <div
            key={it}
            style={{
              position: "absolute", top: 600 + i * 165, [left ? "left" : "right"]: 34, maxWidth: 600,
              padding: "20px 30px", borderRadius: 999, background: "linear-gradient(135deg,#7C3AED,#5B21B6)",
              border: `3px solid ${C.primary2}`, boxShadow: "0 18px 50px rgba(0,0,0,0.55), 0 0 30px rgba(124,58,237,0.6)",
              fontFamily: HEAD, fontWeight: 800, fontSize: 38, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 16,
              opacity: q * out, transform: `translateX(${(1 - q) * (left ? 240 : -240)}px) scale(${0.6 + q * 0.4}) rotate(${left ? -3 : 3}deg)`,
            }}
          >
            <span style={{ width: 44, height: 44, borderRadius: 999, background: C.celebrate, color: "#1a0b02", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{i + 1}</span>
            {it}
          </div>
        );
      })}
    </>
  );
};

// Pre-roll: a handwritten sticky note, framed by a viewfinder, photographed, then pulled into the phone
const StickyIntro: React.FC<{ intro: Intro }> = ({ intro }) => {
  const f = useCurrentFrame();
  const N = intro.frames;
  const flashAt = N - 34;
  const drop = pop(f, 0, 13);
  const finder = interpolate(f, [flashAt - 40, flashAt - 24], [0, 1], clamp);
  const flash = interpolate(f, [flashAt, flashAt + 2, flashAt + 14], [0, 1, 0], clamp);
  const suck = interpolate(f, [flashAt + 8, N], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const wob = Math.sin(f / 18) * 1.2;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", left: 190, top: 640, width: 700, padding: "50px 56px 64px", background: "linear-gradient(170deg,#FEF08A,#FDE047)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.55)", borderRadius: 6, color: "#3b2f0b",
          transformOrigin: "50% 0%",
          transform: `translateY(${(1 - drop) * -900 - suck * 520}px) rotate(${-4 + wob + suck * 8}deg) scale(${1 - suck * 0.75})`,
          opacity: 1 - suck * 0.9,
        }}
      >
        <div style={{ position: "absolute", top: -26, left: 260, width: 180, height: 56, background: "rgba(255,255,255,0.55)", transform: "rotate(3deg)" }} />
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 84, lineHeight: 1, textDecoration: "underline", textDecorationThickness: 4 }}>{intro.title}</div>
        {intro.items.map((it, i) => (
          <div key={it} style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, lineHeight: 1.18, marginTop: 14, transform: `rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`, opacity: interpolate(f, [8 + i * 5, 14 + i * 5], [0, 1], clamp) }}>
            ☐ {it}
          </div>
        ))}
      </div>
      {/* camera viewfinder corners */}
      {[0, 1, 2, 3].map((k) => {
        const right = k % 2 === 1;
        const bottom = k > 1;
        return (
          <div
            key={k}
            style={{
              position: "absolute", width: 110, height: 110, opacity: finder * (1 - suck),
              left: right ? undefined : 120 - (1 - finder) * 60, right: right ? 120 - (1 - finder) * 60 : undefined,
              top: bottom ? undefined : 540 - (1 - finder) * 60, bottom: bottom ? 260 - (1 - finder) * 60 : undefined,
              borderColor: "#fff", borderStyle: "solid", borderWidth: 0,
              [bottom ? "borderBottomWidth" : "borderTopWidth"]: 9, [right ? "borderRightWidth" : "borderLeftWidth"]: 9,
              borderRadius: 14,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// Pre-roll: task words swarm a stressed mascot, then get sucked down into FOCO
const ChaosIntro: React.FC<{ intro: Intro }> = ({ intro }) => {
  const f = useCurrentFrame();
  const N = intro.frames;
  const suck = interpolate(f, [N - 34, N - 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const m = pop(f, 4, 12);
  const shake = suck > 0 ? 0 : Math.sin(f * 1.9) * 5 * interpolate(f, [30, 120], [0.3, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 58%, rgba(239,68,68,${0.18 * (1 - suck)}) 0%, transparent 55%)` }} />
      {intro.items.map((w, i) => {
        const r = (k: number) => random(`${w}-${k}`);
        const born = 6 + i * 9;
        const q = pop(f, born, 10);
        // 2 columns x 6 rows: three rows above the mascot, three below, so words never stack on each other
        const row = Math.floor(i / 2);
        const bx = (i % 2 === 0 ? 300 : 780) + (r(1) - 0.5) * 60;
        const by = [560, 700, 840, 1490, 1630, 1770][row % 6] + (r(2) - 0.5) * 30;
        const dx = Math.sin(f / (14 + r(3) * 10) + r(4) * 6) * 40;
        const dy = Math.cos(f / (16 + r(5) * 10) + r(6) * 6) * 30;
        const x = bx + dx + (540 - bx - dx) * suck;
        const y = by + dy + (1880 - by - dy) * suck;
        return (
          <div
            key={w}
            style={{
              position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${(r(7) - 0.5) * 24}deg) scale(${q * (1 - suck * 0.85)})`,
              fontFamily: i % 3 === 0 ? HAND : HEAD, fontWeight: 800, fontSize: i % 3 === 0 ? 70 : 46, whiteSpace: "nowrap",
              color: i % 4 === 0 ? "#fca5a5" : i % 4 === 1 ? C.celebrate : "#fff", opacity: q * (1 - suck * 0.6),
              textShadow: "0 6px 20px rgba(0,0,0,0.7)",
            }}
          >
            {w}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 540 - 220, top: 1020, transform: `translateX(${shake}px) scale(${m * (1 - suck)})` }}>
        <AliveMascot src="mascots/foco_state_6_pause.png" size={440} mode="stressed" />
      </div>
    </AbsoluteFill>
  );
};

// A small phone playing one recording; used three at a time in the montage
const MiniPhone: React.FC<{ part: MPart; len: number; w: number; active: number }> = ({ part, len, w, active }) => {
  const f = useCurrentFrame();
  const h = Math.round((w * 832) / 384);
  const rate = (part.to - part.from) / (len / CLIP_FPS);
  const t = part.from + (f / CLIP_FPS) * rate;
  const patch = part.patches.find((p) => t < p.until)?.color ?? NAVY;
  const bz = 10;
  return (
    <div style={{ position: "relative", width: w + bz * 2, height: h + bz * 2, padding: bz, borderRadius: 48, background: "linear-gradient(160deg,#3a2466,#140a24)", boxShadow: `0 30px 80px rgba(124,58,237,${0.25 + active * 0.4}), inset 0 0 0 2px rgba(167,139,250,${0.3 + active * 0.5})` }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: 40, overflow: "hidden", background: NAVY }}>
        <Video src={staticFile(`demo-clips/${part.clip}.mp4`)} trimBefore={Math.round(part.from * CLIP_FPS)} playbackRate={rate} muted style={{ width: w, height: h }} />
        <div style={{ position: "absolute", left: 0.84 * w, top: 0.962 * h, width: 0.16 * w, height: 0.038 * h, background: patch }} />
        {part.cover && t < part.cover.until ? (
          <div style={{ position: "absolute", left: part.cover.c.x * w, top: part.cover.c.y * h, width: part.cover.c.w * w, height: part.cover.c.h * h, background: part.cover.c.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 700, fontSize: 14, color: "#fff" }}>
            {part.cover.c.text}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Three recordings side by side; each one takes the spotlight in turn
const MontageView: React.FC<{ m: Montage }> = ({ m }) => {
  const f = useCurrentFrame();
  const n = m.parts.length;
  const slot = m.frames / n;
  const cur = Math.min(n - 1, Math.floor(f / slot));
  const enter = pop(f, 0, 14);
  const out = interpolate(f, [m.frames - 10, m.frames], [1, 0], clamp);
  const W = 300;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", top: 120, left: 40, right: 40, textAlign: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 72, lineHeight: 1.1, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
        Dump it {hl("any way")}
      </div>
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26 }}>
        {m.parts.map((p, i) => {
          const on = i === cur;
          const a = spring({ frame: f - i * slot, fps: CLIP_FPS, config: { damping: 14 } });
          const k = on ? 1 : 0;
          return (
            <div key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: (0.45 + 0.55 * Math.max(k, i < cur ? 0.6 : 0)) * enter, transform: `translateY(${(1 - enter) * 600}px) scale(${0.92 + 0.12 * k * a})` }}>
              <MiniPhone part={p} len={m.frames} w={W} active={k} />
              <div style={{ padding: "12px 34px", borderRadius: 999, fontFamily: HEAD, fontWeight: 800, fontSize: 40, background: on ? C.celebrate : "rgba(255,255,255,0.08)", color: on ? "#1a0b02" : "rgba(255,255,255,0.6)", boxShadow: on ? `0 0 30px ${C.celebrate}` : "none" }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Confetti: React.FC = () => {
  const f = useCurrentFrame();
  const cols = [C.celebrate, C.primary2, C.primary, "#fff", C.green];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 70 }).map((_, i) => {
        const r = (k: number) => random(`cf-${i}-${k}`);
        const t = f / CLIP_FPS;
        const vx = (r(1) - 0.5) * 1400;
        const vy = -900 - r(2) * 900;
        const x = 540 + vx * t;
        const y = 1250 + vy * t + 1500 * t * t;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 28, borderRadius: 4, background: cols[i % cols.length], transform: `rotate(${f * (8 + r(3) * 14)}deg)`, opacity: interpolate(f, [0, 50, 70], [1, 1, 0], clamp) }} />
        );
      })}
    </AbsoluteFill>
  );
};

// 16:9 footage filling the 9:16 frame (the media Video ignores objectFit, so size + offset it by hand)
const FILL_W = Math.round((1920 * 16) / 9);
const FillVideo: React.FC<{ src: string; from?: number; rate?: number; pos: number; loop?: boolean }> = ({ src, from = 0, rate = 1, pos, loop }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: Math.min(0, Math.max(1080 - FILL_W, 540 - FILL_W * pos)), width: FILL_W, height: 1920 }}>
      <Video src={staticFile(src)} trimBefore={Math.round(from * CLIP_FPS)} playbackRate={rate} loop={loop} muted style={{ width: FILL_W, height: 1920 }} />
    </div>
  </AbsoluteFill>
);

// Real-life footage cropped to 9:16, with an optional floating FOCO timer and a TikTok-style caption
const BrollFull: React.FC<{ s: Seg; len: number }> = ({ s, len }) => {
  const f = useCurrentFrame();
  const b = s.broll!;
  const fade = interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], clamp);
  const q = pop(f, 10, 13);
  const left = b.timer !== undefined ? Math.max(0, b.timer - Math.floor((f / CLIP_FPS) * 1)) : 0;
  const cap = pop(f, 4, 15);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <FillVideo src={b.src} from={s.from} rate={s.rate} pos={b.pos} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)" }} />
      {b.timer !== undefined ? (
        <div style={{ position: "absolute", top: 230, right: 50, display: "flex", alignItems: "center", gap: 18, padding: "16px 30px 16px 16px", borderRadius: 999, background: "rgba(10,6,20,0.82)", border: `3px solid ${C.green}`, boxShadow: "0 18px 50px rgba(0,0,0,0.5)", transform: `scale(${q})`, transformOrigin: "100% 50%" }}>
          <AliveMascot src="mascots/foco_state_3_focus.png" size={96} mode="calm" />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.green, letterSpacing: 2 }}>● FOCUSING WITH FOCO</div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      ) : null}
      {s.caption ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1380, textAlign: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 76, lineHeight: 1.1, color: "#fff", WebkitTextStroke: "3px rgba(0,0,0,0.85)", textShadow: "0 6px 24px rgba(0,0,0,0.9)", opacity: cap, transform: `scale(${0.85 + cap * 0.15})` }}>
          {s.caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Blurred footage behind the phone (the "where this happens" layer)
const BlurBg: React.FC<{ src: string; len: number }> = ({ src, len }) => {
  const rate = 10 / (len / CLIP_FPS) > 1 ? 1 : 0.6;
  return (
    <AbsoluteFill style={{ filter: "blur(22px) brightness(0.42) saturate(1.2)", transform: "scale(1.1)" }}>
      <FillVideo src={src} rate={rate} pos={0.4} loop />
    </AbsoluteFill>
  );
};

// Pre-roll: "Day 1 / Day 2 / Day 3" flips over the blurred mess
const DaysIntro: React.FC<{ intro: Intro }> = ({ intro }) => {
  const f = useCurrentFrame();
  const per = Math.floor((intro.frames - 20) / intro.items.length);
  const cur = Math.min(intro.items.length - 1, Math.floor(f / per));
  const q = pop(f - cur * per, 0, 9);
  const last = cur === intro.items.length - 1;
  return (
    <AbsoluteFill>
      {intro.bg ? <BlurBg src={intro.bg} len={intro.frames} /> : null}
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 90, color: C.muted }}>{intro.title}</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 230, lineHeight: 1, marginTop: 10, color: last ? "#fca5a5" : "#fff", transform: `scale(${q}) rotate(${last ? -4 : 0}deg)`, textShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
          {intro.items[cur]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Composition ─────────────────────────
export const ClipDemo: React.FC<{ id: string }> = ({ id }) => {
  const cut = CUTS.find((c) => c.id === id)!;
  const f = useCurrentFrame();
  const I = cut.intro?.frames ?? 0;
  const M = cut.montage?.frames ?? 0;
  const P = I + M; // phone part starts after the intro and the montage
  const { out, end } = starts(cut); // local to the phone part
  const total = P + end + ctaLen(cut);
  // Voice lines on the global timeline; music ducks under them
  const vo = [
    ...(cut.intro?.vo ? [{ key: cut.intro.vo, at: 10 }] : []),
    ...(cut.montage?.vo ? [{ key: cut.montage.vo, at: I + 6 }] : []),
    ...cut.segs.flatMap((s, i) => (s.vo ? [{ key: s.vo, at: P + out[i] + VO_LEAD }] : [])),
    ...(cut.ctaVo ? [{ key: cut.ctaVo, at: P + end + 24 }] : []),
  ];
  const talking = vo.some((v) => f >= v.at - 6 && f <= v.at + VO[v.key] * CLIP_FPS + 6);
  const bed = vo.length ? (talking ? 0.13 : 0.4) : 0.5;
  const music = Math.min(bed, interpolate(f, [0, 15, total - 35, total], [0, 1, 1, 0], clamp));
  // Merge consecutive segments that show the same "done" card into one appearance
  const cards: { title: string; sub: string; from: number; len: number }[] = [];
  cut.segs.forEach((s, i) => {
    if (!s.card) return;
    const last = cards[cards.length - 1];
    if (last && last.title === s.card.title && last.from + last.len === out[i]) last.len += segLen(s);
    else cards.push({ ...s.card, from: out[i], len: segLen(s) });
  });
  const chipAt = (s: Seg, i: number) => out[i] + Math.round(((s.chips!.t - s.from) / rateOf(s)) * CLIP_FPS);
  const sfx: { file: string; at: number; vol: number }[] = [
    { file: "whoosh", at: 0, vol: 0.5 },
    { file: "switch", at: 20, vol: 0.45 },
    ...(cut.intro && cut.intro.kind !== "chaos" ? [{ file: "mouse-click", at: I - 34, vol: 0.9 }, { file: "whoosh", at: I - 26, vol: 0.6 }] : []),
    ...(cut.intro?.kind === "chaos" ? [{ file: "whoosh", at: I - 34, vol: 0.8 }, ...cut.intro.items.map((_, k) => ({ file: "switch", at: 6 + k * 9, vol: 0.18 }))] : []),
    ...(cut.montage ? cut.montage.parts.map((_, k) => ({ file: "page-turn", at: I + Math.round((k * M) / cut.montage!.parts.length), vol: 0.45 })) : []),
    ...cut.segs.flatMap((s, i) => (s.confetti ? [{ file: "whoosh", at: P + out[i] + 2, vol: 0.5 }] : [])),
    ...cut.segs.flatMap((s, i) => [
      ...(s.taps ?? []).map((t) => ({ file: "mouse-click", at: P + out[i] + Math.round(((t.t - s.from) / rateOf(s)) * CLIP_FPS), vol: 0.55 })),
      ...(s.ding ? [{ file: "ding", at: P + out[i] + 6, vol: 0.6 }] : []),
      ...(s.chips ? s.chips.items.map((_, k) => ({ file: "switch", at: P + chipAt(s, i) + k * 6, vol: 0.35 })) : []),
    ]),
    { file: "whoosh", at: P + end - 10, vol: 0.6 },
  ];
  const hookIn = cut.intro ? 0 : HOOK; // with an intro, the hook rides on the intro instead of the phone
  return (
    <AbsoluteFill style={{ color: C.text, fontFamily: BODY }}>
      <Background />
      {cut.intro ? (
        <Sequence durationInFrames={I}>
          {cut.intro.kind === "chaos" ? <ChaosIntro intro={cut.intro} /> : cut.intro.kind === "days" ? <DaysIntro intro={cut.intro} /> : <StickyIntro intro={cut.intro} />}
          <Sequence durationInFrames={I - 30} layout="none">
            <Hook hook={cut.hook} len={I - 30} />
          </Sequence>
        </Sequence>
      ) : null}
      {cut.montage ? (
        <Sequence from={I} durationInFrames={M}>
          <MontageView m={cut.montage} />
        </Sequence>
      ) : null}
      <Sequence from={P} durationInFrames={end}>
        {cut.bg ? <BlurBg src={cut.bg} len={end} /> : null}
        <Phone cut={cut} len={end} />
        <TopShade />
        {cut.segs.map((s, i) =>
          s.broll ? (
            <Sequence key={`broll${i}`} from={out[i]} durationInFrames={segLen(s)} layout="none">
              <BrollFull s={s} len={segLen(s)} />
            </Sequence>
          ) : null,
        )}
        {cut.stages ? <Stages cut={cut} showFrom={cut.intro ? 0 : HOOK} /> : null}
        {cut.intro ? null : (
          <Sequence durationInFrames={HOOK} layout="none">
            <Hook hook={cut.hook} len={HOOK} />
          </Sequence>
        )}
        {cut.segs.map((s, i) =>
          s.chips ? (
            <Sequence key={`chips${i}`} from={chipAt(s, i)} durationInFrames={out[i] + segLen(s) - chipAt(s, i)} layout="none">
              <Chips items={s.chips.items} len={out[i] + segLen(s) - chipAt(s, i)} />
            </Sequence>
          ) : null,
        )}
        {cut.segs.map((s, i) => {
          if (!s.caption || s.broll) return null;
          const from = Math.max(out[i], hookIn);
          const until = out[i] + segLen(s);
          if (until - from < 20) return null;
          return (
            <Sequence key={i} from={from} durationInFrames={until - from} layout="none">
              <Caption>{s.caption}</Caption>
            </Sequence>
          );
        })}
        {cards.map((c, i) => (
          <Sequence key={`card${i}`} from={c.from} durationInFrames={c.len} layout="none">
            <DoneCard title={c.title} sub={c.sub} len={c.len} />
          </Sequence>
        ))}
        {cut.segs.map((s, i) =>
          s.confetti ? (
            <Sequence key={`cf${i}`} from={out[i] + 4} durationInFrames={80} layout="none">
              <Confetti />
            </Sequence>
          ) : null,
        )}
      </Sequence>
      <Sequence from={P + end}>
        <Cta line={cut.cta} />
      </Sequence>
      <Audio src={staticFile("music/dreamscape.mp3")} trimBefore={(cut.musicFrom ?? 0) * CLIP_FPS} volume={music} />
      {vo.map((v) => (
        <Sequence key={v.key} from={v.at} durationInFrames={Math.ceil(VO[v.key] * CLIP_FPS) + 10} layout="none">
          <Audio src={staticFile(`demo-vo/${v.key}.wav`)} volume={1} />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={60} layout="none">
          <Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
