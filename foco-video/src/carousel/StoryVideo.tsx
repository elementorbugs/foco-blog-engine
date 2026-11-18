// Animated "Story" carousel (Adi, 2026-11-18): the same Story slides as the carousel, but every item enters in order
// (text pops word by word, the pen draws itself, the sticker slaps on, the mail drops in, FOCO's steps light up),
// slides change with a carousel-like swipe, and each entrance has a light sound effect. Music is added on upload.
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { StorySlide, SFX, schedule, type StoryItem } from "./Story";

export const TRANS = 9;
type VSpec = { slug: string; slides: { id: string; blocks: StoryItem[] }[] };

export const timeline = (spec: VSpec) => {
  let at = 0;
  return spec.slides.map((s) => {
    const { starts, dur } = schedule(s.blocks);
    const r = { at, dur, starts };
    at += dur - TRANS;
    return r;
  });
};
export const storyFrames = (spec: VSpec) => {
  const tl = timeline(spec), last = tl[tl.length - 1];
  return last ? last.at + last.dur : 30;
};

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export const StoryVideo: React.FC<{ spec: VSpec }> = ({ spec }) => {
  const f = useCurrentFrame(), tl = timeline(spec), n = spec.slides.length;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {spec.slides.map((s, i) => {
        const { at, dur } = tl[i], lf = f - at;
        if (lf < 0 || lf >= dur) return null;
        let x = 0, sc = 1;
        if (i > 0 && lf < TRANS) x = 1080 * (1 - ease(lf / TRANS));
        if (i < n - 1 && lf > dur - TRANS) { const e = ease((lf - (dur - TRANS)) / TRANS); x = -1080 * e; sc = 1 - 0.05 * e; }
        return (
          <AbsoluteFill key={s.id} style={{ transform: `translateX(${x}px) scale(${sc})` }}>
            <StorySlide slug={spec.slug} blocks={s.blocks} t={lf} />
          </AbsoluteFill>
        );
      })}
      {spec.slides.map((s, i) => (
        <React.Fragment key={`a${i}`}>
          {i > 0 ? <Sequence from={tl[i].at} durationInFrames={20}><Audio src={staticFile("explainer-sfx/swipe.wav")} volume={0.35} /></Sequence> : null}
          {s.blocks.map((b, j) => (SFX[b.k] ? (
            <Sequence key={j} from={tl[i].at + tl[i].starts[j]} durationInFrames={30}><Audio src={staticFile(SFX[b.k]!)} volume={b.k === "notif" ? 0.6 : 0.3} /></Sequence>
          ) : null))}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
