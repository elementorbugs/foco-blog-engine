import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { BgAurora, Camera, Captions, Carry, Entrance, Grain, Headline, Music, SceneFrame, SoundCues, Vignette, Voiceover, cueBefore, fonts, onWord, sceneById, springs, wordFrame } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";
import { Burst } from "./Burst";
import { PhoneVideo } from "./PhoneVideo";
import { TaskChip } from "./TaskChip";

const palette = { bg: "#040208", ink: "#FFFFFF", hero: "#7C3AED", accent: "#A78BFA", dim: "#B8B0CC", win: "#FB923C", winLight: "#FDE68A" };

const CLIPS = {
  snap: { key: "assets/user/a-918c70eb-snap.mp4", len: 19 },
  say: { key: "assets/user/a-fb8ee0ab-say.mp4", len: 7 },
  type: { key: "assets/user/a-18754b64-type.mp4", len: 9.2 },
  split: { key: "assets/user/a-edb410a7-split.mp4", len: 9.5 },
  focus: { key: "assets/user/a-bd7cebf6-focus.mp4", len: 16 },
  done: { key: "assets/user/a-bac8bcf1-done.mp4", len: 5.5 },
};
const ICON = "assets/user/a-75c2c850-foco-icon.png";
const APP_STORE = "assets/user/a-3157030f-app-store.png";
const GOOGLE_PLAY = "assets/user/a-20e23b4b-google-play.png";
const MUSIC = "assets/lib/music-bright-startup/track.mp3";
const SFX = {
  whoosh: "assets/lib/sfx-ui-soft-whoosh/clip.mp3",
  pop: "assets/lib/sfx-ui-bubble-pop/clip.mp3",
  chime: "assets/lib/sfx-ui-success-chime/clip.mp3",
  shimmer: "assets/lib/sfx-ui-sparkle-shimmer/clip.mp3",
  shutter: "assets/lib/sfx-ui-camera-shutter/clip.mp3",
  impact: "assets/lib/sfx-ui-soft-impact/clip.mp3",
  riser: "assets/lib/sfx-ui-riser-short/clip.mp3",
  tap: "assets/lib/sfx-ui-glass-tap/clip.mp3",
};

// Phone box height for a given width fraction on 9:16 (the phone is 1:2).
const ph = (w: number) => w * (1080 / 1920) * 2;

// The tasks crowding the head in the hook: names from the real recordings, plus three everyday ones.
const HOOK_CHIPS = [
  { label: "Call dentist", x: 0.3, y: 0.25, rot: -5 },
  { label: "Clean the kitchen", x: 0.68, y: 0.31, rot: 4 },
  { label: "Reply to important emails", x: 0.45, y: 0.4, rot: -3 },
  { label: "Text mom back", x: 0.22, y: 0.47, rot: 6 },
  { label: "Pay the electricity bill", x: 0.64, y: 0.51, rot: -4 },
  { label: "Buy groceries for dinner", x: 0.36, y: 0.59, rot: 3 },
  { label: "Taxes", x: 0.82, y: 0.62, rot: 8 },
  { label: "Book a doctor's appointment", x: 0.56, y: 0.68, rot: -2 },
  { label: "Finish presentation", x: 0.3, y: 0.76, rot: 5 },
  { label: "Laundry", x: 0.76, y: 0.79, rot: -6 },
];
const DOTS = [palette.accent, palette.hero, "#C4B5FD"];

const HookChips: React.FC<{ freezeAt: number; suckAt: number; to: { x: number; y: number } }> = ({ freezeAt, suckAt, to }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (frame > suckAt + 40) return null;
  const q = spring({ frame: frame - suckAt, fps, config: springs.snappy });
  const jt = Math.min(frame, freezeAt);
  const dimmed = interpolate(frame, [freezeAt, freezeAt + 8], [1, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      {HOOK_CHIPS.map((c, i) => {
        const p = spring({ frame: frame - i * 5, fps, config: springs.smooth });
        if (frame < i * 5) return null;
        const jx = Math.sin(jt / 6 + i * 1.7) * width * 0.012;
        const jy = Math.cos(jt / 7 + i) * height * 0.006;
        const x0 = interpolate(p, [0, 1], [0.5, c.x]) * width + jx;
        const y0 = interpolate(p, [0, 1], [0.52, c.y]) * height + jy;
        const x = interpolate(q, [0, 1], [x0, to.x * width]);
        const y = interpolate(q, [0, 1], [y0, to.y * height]);
        const scale = interpolate(p, [0, 1], [0.3, 1]) * (1 - q);
        return (
          <div key={c.label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${c.rot * (1 - q)}deg) scale(${scale})`, opacity: Math.min(1, p * 2) * (i < 3 ? 1 : dimmed) * (1 - q) }}>
            <TaskChip label={c.label} dot={DOTS[i % 3]} size={0.075} font={fonts.display} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const PulseRings: React.FC<{ at: number; x: number; y: number; color: string; size: number }> = ({ at, x, y, color, size }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (frame < at) return null;
  return (
    <AbsoluteFill>
      {[0, 1, 2].map((k) => {
        const t = ((frame - at + k * 18) % 54) / 54;
        const r = width * size * (0.9 + t * 0.6);
        return <div key={k} style={{ position: "absolute", left: width * x - r / 2, top: height * y - r / 2, width: r, height: r, borderRadius: "50%", border: `${width * 0.006}px solid ${color}`, opacity: (1 - t) * 0.6 }} />;
      })}
    </AbsoluteFill>
  );
};

const Label: React.FC<{ text: string; x: number; y: number; delay: number; color: string }> = ({ text, x, y, delay, color }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: width * x, top: height * y, transform: "translate(-50%, -50%)" }}>
      <Entrance delay={delay} breathe={false}>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.075, color, letterSpacing: -1 }}>{text}</div>
      </Entrance>
    </div>
  );
};

const PhoneAt: React.FC<{ x: number; y: number; w: number; delay: number; children: React.ReactNode }> = ({ x, y, w, delay, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: width * (x - w / 2), top: height * (y - ph(w) / 2), width: width * w, height: height * ph(w) }}>
      <Entrance delay={delay} breathe={false} style={{ width: "100%", height: "100%" }}>{children}</Entrance>
    </div>
  );
};

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const { width, height } = useVideoConfig();
  const hook = sceneById(manifest, "hook");
  const capture = sceneById(manifest, "capture");
  const organize = sceneById(manifest, "organize");
  const split = sceneById(manifest, "split");
  const focus = sceneById(manifest, "focus");
  const done = sceneById(manifest, "done");
  const cta = sceneById(manifest, "cta");

  const snapAt = capture.startFrame + wordFrame(capture, "snap");
  const sayAt = onWord(capture, "say");
  const typeAt = onWord(capture, "type");
  const doneAt = done.startFrame + wordFrame(done, "done");
  const doableAt = wordFrame(cta, "doable");
  const exitAt = wordFrame(cta, "can't");
  const tinyAt = split.startFrame + wordFrame(split, "tiny");

  const W = 0.5;
  const phoneKeys = [
    { frame: 0, x: 0.5, y: 0.52, width: 0.44, height: ph(0.44), opacity: 1 },
    { frame: 22, x: 0.5, y: 0.52, width: W, height: ph(W) },
    { frame: snapAt, x: 0.18, y: 0.56, width: 0.3, height: ph(0.3) },
    { frame: organize.startFrame + 6, x: 0.5, y: 0.5, width: W, height: ph(W) },
    { frame: doneAt, x: 0.5, y: 0.5, width: 0.56, height: ph(0.56) },
    { frame: cta.startFrame + 24, x: 0.5, y: 0.33, width: 0.3, height: ph(0.3) },
    { frame: cta.startFrame + exitAt + 4, x: 0.5, y: 0.33, width: 0.3, height: ph(0.3), opacity: 1 },
    { frame: cta.startFrame + exitAt + 16, x: 0.5, y: 0.33, width: 0.24, height: ph(0.24), opacity: 0 },
  ];

  const CTA_CHIPS = ["Clean the kitchen", "Reply to important emails", "Pay the electricity bill", "Call dentist"];

  const cues = [
    { at: 0, sound: "whoosh", volume: 0.25 },
    { at: 5, sound: "pop", volume: 0.2 },
    { at: 15, sound: "pop", volume: 0.16 },
    { at: 25, sound: "pop", volume: 0.13 },
    { at: 35, sound: "pop", volume: 0.11 },
    { at: hook.startFrame + wordFrame(hook, "start"), sound: "impact", volume: 0.3 },
    { at: capture.startFrame + wordFrame(capture, "out") - 4, sound: "whoosh", volume: 0.25 },
    { at: snapAt, sound: "shutter", volume: 0.28 },
    { at: capture.startFrame + wordFrame(capture, "say"), sound: "pop", volume: 0.22 },
    { at: capture.startFrame + wordFrame(capture, "type"), sound: "tap", volume: 0.22 },
    { at: organize.startFrame - 4, sound: "whoosh", volume: 0.22 },
    { at: organize.startFrame + wordFrame(organize, "every"), sound: "pop", volume: 0.24 },
    { at: organize.startFrame + wordFrame(organize, "day"), sound: "chime", volume: 0.2 },
    { at: split.startFrame + wordFrame(split, "tap"), sound: "tap", volume: 0.26 },
    { at: split.startFrame + wordFrame(split, "ai"), sound: "shimmer", volume: 0.28 },
    { at: tinyAt, sound: "pop", volume: 0.22 },
    { at: focus.startFrame + wordFrame(focus, "step"), sound: "tap", volume: 0.22 },
    { at: focus.startFrame + wordFrame(focus, "stays"), sound: "impact", volume: 0.2 },
    { at: doneAt, sound: "chime", volume: 0.3 },
    { at: doneAt, sound: "impact", volume: 0.28 },
    ...CTA_CHIPS.map((_, i) => ({ at: cta.startFrame + doableAt - 15 + i * 7, sound: "tap", volume: 0.16 - i * 0.02 })),
    { at: cueBefore(cta.startFrame + wordFrame(cta, "foco"), 60), sound: "riser", volume: 0.22 },
    { at: cta.startFrame + wordFrame(cta, "foco"), sound: "impact", volume: 0.3 },
    { at: cta.startFrame + wordFrame(cta, "iphone"), sound: "pop", volume: 0.22 },
    { at: cta.startFrame + wordFrame(cta, "android"), sound: "pop", volume: 0.2 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      <BgAurora bg={palette.bg} hero={palette.hero} intensity={0.75} />
      <Camera keys={[{ frame: 0 }]} drift={0.004} punches={[{ frame: tinyAt, x: 0.5, y: 0.6, amount: 0.12, hold: 24 }, { frame: doneAt, x: 0.5, y: 0.45, amount: 0.08, hold: 10 }]}>
        {/* Behind the phone */}
        <Sequence from={focus.startFrame} durationInFrames={focus.durationFrames}>
          <PulseRings at={wordFrame(focus, "stays") - 2} x={0.5} y={0.5} color={palette.accent} size={0.62} />
        </Sequence>
        <Sequence from={done.startFrame - 2} durationInFrames={done.durationFrames + 40}>
          <Burst at={wordFrame(done, "done") + 2} x={0.5} y={0.5} color={palette.win} accent={palette.winLight} radius={0.62} />
        </Sequence>

        {/* The second and third phones of the capture scene */}
        <SceneFrame from={capture.startFrame} durationInFrames={capture.durationFrames}>
          <PhoneAt x={0.5} y={0.56} w={0.3} delay={sayAt}>
            <PhoneVideo src={urls[CLIPS.say.key]} playAt={sayAt + 4} rate={1.5} lengthSec={CLIPS.say.len} glow={palette.hero} glowStrength={0.35} />
          </PhoneAt>
          <PhoneAt x={0.82} y={0.56} w={0.3} delay={typeAt}>
            <PhoneVideo src={urls[CLIPS.type.key]} playAt={typeAt + 2} rate={2} lengthSec={CLIPS.type.len} glow={palette.hero} glowStrength={0.35} />
          </PhoneAt>
          <Label text="Snap" x={0.18} y={0.33} delay={onWord(capture, "snap")} color={palette.ink} />
          <Label text="Say" x={0.5} y={0.33} delay={sayAt} color={palette.ink} />
          <Label text="Type" x={0.82} y={0.33} delay={typeAt} color={palette.ink} />
        </SceneFrame>

        {/* The one phone carried through the film */}
        <Carry keys={phoneKeys}>
          {() => (
            <AbsoluteFill>
              <Sequence from={0} durationInFrames={snapAt}>
                <PhoneVideo src={urls[CLIPS.type.key]} playAt={100000} lengthSec={CLIPS.type.len} glow={palette.hero} />
              </Sequence>
              <Sequence from={snapAt} durationInFrames={organize.startFrame - snapAt}>
                <PhoneVideo src={urls[CLIPS.snap.key]} rate={1.4} lengthSec={CLIPS.snap.len} glow={palette.hero} glowStrength={0.4} />
              </Sequence>
              <Sequence from={organize.startFrame} durationInFrames={organize.durationFrames}>
                <PhoneVideo src={urls[CLIPS.snap.key]} trimSec={6.5} rate={2.5} lengthSec={CLIPS.snap.len} glow={palette.hero} />
              </Sequence>
              <Sequence from={split.startFrame} durationInFrames={split.durationFrames}>
                <PhoneVideo src={urls[CLIPS.split.key]} rate={1.8} lengthSec={CLIPS.split.len} glow={palette.hero} />
              </Sequence>
              <Sequence from={focus.startFrame} durationInFrames={focus.durationFrames}>
                <PhoneVideo src={urls[CLIPS.focus.key]} rate={3.2} lengthSec={CLIPS.focus.len} glow={palette.hero} />
              </Sequence>
              <Sequence from={done.startFrame} durationInFrames={manifest.totalFrames - done.startFrame}>
                <PhoneVideo src={urls[CLIPS.done.key]} lengthSec={CLIPS.done.len} glow={palette.win} glowStrength={0.45} />
              </Sequence>
            </AbsoluteFill>
          )}
        </Carry>

        {/* The tasks spilling out of the phone, then pulled back in */}
        <HookChips freezeAt={onWord(hook, "start") + 3} suckAt={capture.startFrame + onWord(capture, "out")} to={{ x: 0.5, y: 0.52 }} />

        {/* Headlines in front */}
        <SceneFrame from={hook.startFrame} durationInFrames={hook.durationFrames}>
          <Headline text="Can't start?" keyword="start" emphasis="highlight" hero={palette.hero} font={fonts.display} maxSize={0.13} y={0.11} delay={onWord(hook, "start")} />
        </SceneFrame>
        <SceneFrame from={organize.startFrame} durationInFrames={organize.durationFrames}>
          <Headline text="5 tasks found" keyword="5" hero={palette.accent} font={fonts.display} maxSize={0.11} y={0.11} delay={onWord(organize, "every")} />
        </SceneFrame>
        <SceneFrame from={split.startFrame} durationInFrames={split.durationFrames}>
          <Headline text="Tiny steps" keyword="tiny" emphasis="highlight" hero={palette.hero} font={fonts.display} maxSize={0.12} y={0.11} delay={onWord(split, "tiny")} />
        </SceneFrame>
        <SceneFrame from={focus.startFrame} durationInFrames={focus.durationFrames}>
          <Headline text="Step one" keyword="one" hero={palette.accent} font={fonts.display} maxSize={0.12} y={0.11} delay={onWord(focus, "step")} />
        </SceneFrame>
        <SceneFrame from={done.startFrame} durationInFrames={done.durationFrames}>
          <Headline text="Done." keyword="done" hero={palette.win} font={fonts.display} maxSize={0.14} y={0.1} delay={onWord(done, "done")} />
        </SceneFrame>
        <SceneFrame from={cta.startFrame} durationInFrames={cta.durationFrames}>
          {CTA_CHIPS.map((label, i) => (
            <div key={label} style={{ position: "absolute", left: width * 0.5, top: height * (0.565 + i * 0.058), transform: "translate(-50%, -50%)" }}>
              <Entrance delay={6 + i * 5} exitAt={exitAt + i * 2} breathe={false}>
                <TaskChip label={label} dot={palette.accent} checkAt={doableAt - 16 + i * 7} size={0.065} font={fonts.display} />
              </Entrance>
            </div>
          ))}
          <Sequence from={onWord(cta, "can't")} durationInFrames={onWord(cta, "start", { nth: 2 }) - onWord(cta, "can't")}>
            <Headline text="Can't start?" keyword="start" emphasis="highlight" hero={palette.hero} font={fonts.display} maxSize={0.13} y={0.3} />
          </Sequence>
          <Sequence from={onWord(cta, "start", { nth: 2 })}>
            <Headline text="Start with FOCO" keyword="foco" hero={palette.accent} font={fonts.display} maxSize={0.12} y={0.24} />
          </Sequence>
          <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.37, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04 }}>
            <Entrance delay={onWord(cta, "foco")} breathe={false}>
              <Img src={urls[ICON]} style={{ width: width * 0.2, height: width * 0.2, borderRadius: width * 0.045, boxShadow: `0 0 ${width * 0.08}px ${palette.hero}` }} />
            </Entrance>
            <Entrance delay={onWord(cta, "foco") + 4} breathe={false}>
              <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.15, color: palette.ink, letterSpacing: width * 0.006 }}>FOCO</div>
            </Entrance>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.56, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04 }}>
            <Entrance delay={onWord(cta, "iphone")} breathe={false}>
              <Img src={urls[APP_STORE]} style={{ height: width * 0.13 }} />
            </Entrance>
            <Entrance delay={onWord(cta, "android")} breathe={false}>
              <Img src={urls[GOOGLE_PLAY]} style={{ height: width * 0.13 * (250 / 250) * 1.0, marginTop: 0 }} />
            </Entrance>
          </div>
        </SceneFrame>
      </Camera>

      {/* Voice and captions stay steady, outside the camera */}
      {manifest.scenes.map((s) => (
        <SceneFrame key={s.id} from={s.startFrame} durationInFrames={s.durationFrames} enter="cut" exit="cut">
          <Captions words={s.words} group={manifest.captions} mode="pop" highlight={palette.hero} face={fonts.display} bottom={0.1} />
          {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
        </SceneFrame>
      ))}

      <SoundCues cues={cues} sounds={{ whoosh: urls[SFX.whoosh], pop: urls[SFX.pop], chime: urls[SFX.chime], shimmer: urls[SFX.shimmer], shutter: urls[SFX.shutter], impact: urls[SFX.impact], riser: urls[SFX.riser], tap: urls[SFX.tap] }} />
      {manifest.music ? <Music src={urls[MUSIC]} /> : null}
      <Grain blend="overlay" opacity={0.05} />
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};
