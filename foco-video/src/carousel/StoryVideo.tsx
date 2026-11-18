// Animated "Story" carousel (Adi, 2026-11-18): the same Story slides as the carousel, but every item enters in order
// (text pops word by word, the pen draws itself, the sticker slaps on, the mail drops in, FOCO's steps light up),
// each entrance has a light sound effect, and a soft music bed runs under it (a different library track per video,
// picked by carousel/video.js).
//
// Transitions are part of HER story, never a technical swipe (Adi: "the transitions feel technical, not part of her
// story"). Per slide `enter`:
//   cut   (default) a new story tapped in: hard cut + quick zoom settle
//   time  a time jump in her day: the clock ("10:35") pops big over a blur, then the moment plays
//   buzz  her phone buzzes: the frame shakes (use for a message / notification slide)
//   flash a camera shutter (use when she snaps a photo / scans)
//   focus a focus pull: blur clears to sharp (use when she starts working)
import React from "react";
import { AbsoluteFill, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { StorySlide, SFX, schedule, type StoryItem } from "./Story";

type Enter = "cut" | "time" | "buzz" | "flash" | "focus";
type VSlide = { id: string; blocks: StoryItem[]; enter?: Enter; time?: string };
type VSpec = { slug: string; slides: VSlide[]; music?: string; musicVolume?: number };

const PRE: Record<Enter, number> = { cut: 0, time: 16, buzz: 0, flash: 0, focus: 0 }; // frames before the slide's own items
const ENTER_SFX: Partial<Record<Enter, string>> = { time: "explainer-sfx/key.wav", flash: "sfx/mouse-click.wav", buzz: "explainer-sfx/thud.wav" };

export const timeline = (spec: VSpec) => {
  let at = 0;
  return spec.slides.map((s) => {
    const pre = PRE[s.enter ?? "cut"];
    const { starts, dur } = schedule(s.blocks);
    const r = { at, dur: dur + pre, pre, starts };
    at += r.dur;
    return r;
  });
};
export const storyFrames = (spec: VSpec) => {
  const tl = timeline(spec), last = tl[tl.length - 1];
  return last ? last.at + last.dur : 30;
};

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const SlideIn: React.FC<{ s: VSlide; lf: number; pre: number; slug: string }> = ({ s, lf, pre, slug }) => {
  const enter = s.enter ?? "cut";
  let transform = "", filter = "", overlay: React.ReactNode = null;
  if (enter === "cut") transform = `scale(${1.06 - 0.06 * ease(lf / 6)})`;
  if (enter === "buzz" && lf < 16) transform = `translateX(${Math.sin(lf * 2.6) * 16 * (1 - lf / 16)}px) rotate(${Math.sin(lf * 2.1) * 0.6 * (1 - lf / 16)}deg)`;
  if (enter === "focus") filter = `blur(${Math.max(0, 22 * (1 - ease(lf / 14)))}px)`;
  if (enter === "flash" && lf < 7) overlay = <AbsoluteFill style={{ background: `rgba(255,255,255,${1 - lf / 7})` }} />;
  if (enter === "time") {
    // her clock jumps: the new moment sits blurred behind a big time stamp, then comes into focus
    filter = `blur(${Math.max(0, 18 * (1 - ease((lf - pre + 4) / 10)))}px)`;
    const sIn = spring({ frame: lf, fps: 30, config: { damping: 10, stiffness: 180 } }), out = Math.min(1, Math.max(0, (lf - pre + 2) / 6));
    overlay = out < 1 ? (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `rgba(0,0,0,${0.35 * (1 - out)})` }}>
        <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 190, color: "#fff", WebkitTextStroke: "26px #000", paintOrder: "stroke fill", transform: `scale(${(0.5 + 0.5 * sIn) * (1 + out * 0.3)})`, opacity: 1 - out } as React.CSSProperties}>{s.time}</div>
      </AbsoluteFill>
    ) : null;
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform, filter }}>
        <StorySlide slug={slug} blocks={s.blocks} t={lf - pre} />
      </AbsoluteFill>
      {overlay}
    </AbsoluteFill>
  );
};

export const StoryVideo: React.FC<{ spec: VSpec }> = ({ spec }) => {
  const f = useCurrentFrame(), tl = timeline(spec), total = storyFrames(spec);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {spec.slides.map((s, i) => {
        const { at, dur, pre } = tl[i], lf = f - at;
        if (lf < 0 || lf >= dur) return null;
        return <SlideIn key={s.id} s={s} lf={lf} pre={pre} slug={spec.slug} />;
      })}
      {spec.music !== "none" ? (
        <Audio src={staticFile(spec.music ?? "factory/musiclib/wholesome.mp3")} loop volume={(fr: number) => (spec.musicVolume ?? 0.24) * Math.min(1, fr / 20) * Math.min(1, Math.max(0, (total - fr) / 40))} />
      ) : null}
      {spec.slides.map((s, i) => (
        <React.Fragment key={`a${i}`}>
          {ENTER_SFX[s.enter ?? "cut"] ? <Sequence from={tl[i].at} durationInFrames={30}><Audio src={staticFile(ENTER_SFX[s.enter ?? "cut"]!)} volume={0.35} /></Sequence> : null}
          {s.blocks.map((b, j) => (SFX[b.k] ? (
            <Sequence key={j} from={tl[i].at + tl[i].pre + tl[i].starts[j]} durationInFrames={30}><Audio src={staticFile(SFX[b.k]!)} volume={b.k === "notif" ? 0.6 : 0.3} /></Sequence>
          ) : null))}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
