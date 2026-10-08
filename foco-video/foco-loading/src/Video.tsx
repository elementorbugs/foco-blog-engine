import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { BgAurora, Carry, Entrance, Grain, Headline, Music, SceneFrame, SoundCues, Vignette, cueBefore, fonts, sceneById, springs } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";
import { Burst } from "./Burst";
import { PhoneVideo } from "./PhoneVideo";
import { TaskChip } from "./TaskChip";

// Concept: ADHD task paralysis as a loading bar stuck at 0%. FOCO is the start button; the bar is the hero carried through every shot.
const palette = { bg: "#040208", stuckWash: "#2a2638", ink: "#FFFFFF", hero: "#7C3AED", accent: "#A78BFA", dim: "#8c84a0", win: "#FB923C", winLight: "#FDE68A" };

const A = {
  say: "assets/user/a-d5b7fcae-a-fb8ee0ab-say.mp4",
  split: "assets/user/a-c3869088-a-edb410a7-split.mp4",
  focus: "assets/user/a-9607d46d-a-bd7cebf6-focus.mp4",
  icon: "assets/user/a-004a5f5d-a-75c2c850-foco-icon.png",
  appStore: "assets/user/a-e6fd7716-a-3157030f-app-store.png",
  googlePlay: "assets/user/a-c6001135-a-20e23b4b-google-play.png",
  mascot: "assets/user/a-497595d5-foco_state_2_alignment.png",
};
const MUSIC = "assets/lib/music-viral-dance-pop/track.mp3";
const SFX = {
  glitch: "assets/lib/cinematic-glitches-glitch/clip.mp3",
  swell: "assets/lib/quantum-motion-whooshes-flow-whoosh-reverse/clip.mp3",
  impact: "assets/lib/sfx-ui-soft-impact/clip.mp3",
  click: "assets/lib/youtube-picks-interface-mouse-click/clip.mp3",
  chime: "assets/lib/sfx-ui-success-chime/clip.mp3",
  pop: "assets/lib/sfx-ui-bubble-pop/clip.mp3",
  drop: "assets/lib/sfx-ui-bass-drop/clip.mp3",
};
const SWELL = 66; // reverse whoosh is 2.3s; its peak sits a little before the end

const ph = (w: number) => w * (1080 / 1920) * 2;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Interpolate a value across absolute-frame keys
const track = (frame: number, keys: [number, number][]) =>
  interpolate(frame, keys.map((k) => k[0]), keys.map((k) => k[1]), clamp);

// The hero: one loading bar, its label and percentage, moving and filling across the whole film.
const LoadingBar: React.FC<{ fill: number; x: number; y: number; w: number; h: number; label: string; labelOpacity: number; color: string; glow: number; glitch: number }> = ({ fill, x, y, w, h, label, labelOpacity, color, glow, glitch }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const jx = glitch > 0 && frame % 7 < 2 ? (frame % 2 ? 1 : -1) * width * 0.012 * glitch : 0;
  const bw = width * w;
  const bh = Math.max(4, height * h);
  const pct = Math.round(fill * 100);
  const fs = Math.max(width * 0.035, bh * 0.55);
  return (
    <div style={{ position: "absolute", left: width * x - bw / 2 + jx, top: height * y - bh / 2, width: bw }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: bh * 0.35, opacity: labelOpacity, fontFamily: fonts.display, color: palette.ink }}>
        <span style={{ fontSize: fs * 0.62, fontWeight: 700, color: palette.dim }}>{label}</span>
        <span style={{ fontSize: fs, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: fill >= 1 ? palette.win : palette.ink, textShadow: glitch > 0 && frame % 7 < 2 ? `${width * 0.006}px 0 #ff2bd6, -${width * 0.006}px 0 #22d3ee` : "none" }}>{pct}%</span>
      </div>
      <div style={{ height: bh, borderRadius: bh, background: "rgba(255,255,255,0.08)", border: `${Math.max(2, bh * 0.06)}px solid rgba(167,139,250,0.35)`, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(fill * 100, 0)}%`, height: "100%", borderRadius: bh, background: color, boxShadow: `0 0 ${width * 0.05 * glow}px ${color}` }} />
      </div>
    </div>
  );
};

const Spinner: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = width * size;
  return (
    <div style={{ position: "absolute", left: width * x - s / 2, top: height * y - s / 2, width: s, height: s, borderRadius: "50%", border: `${s * 0.12}px solid rgba(255,255,255,0.12)`, borderTopColor: palette.dim, transform: `rotate(${frame * 14}deg)` }} />
  );
};

// A clock that rolls up fast to "2h 47m later" while the bar stays at 0%.
const RollingClock: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const m = Math.round(interpolate(frame, [0, 22], [0, 167], clamp));
  const shake = frame < 24 ? Math.sin(frame * 2.3) * width * 0.004 : 0;
  return (
    <div style={{ position: "absolute", top: height * 0.28, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, transform: `translateX(${shake}px)` }}>
      <div style={{ fontSize: width * 0.16, fontWeight: 800, color: palette.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
        {Math.floor(m / 60)}h {String(m % 60).padStart(2, "0")}m
      </div>
      <div style={{ fontSize: width * 0.06, fontWeight: 700, color: palette.dim, marginTop: height * 0.005 }}>later...</div>
    </div>
  );
};

// "Your brain isn't lazy." with the last word struck through.
const NotLazy: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame: frame - 2, fps, config: springs.snappy });
  const strike = interpolate(frame, [20, 30], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top: height * 0.36, left: width * 0.08, right: width * 0.08, textAlign: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.115, lineHeight: 1.05, color: palette.ink, opacity: q, transform: `translateY(${(1 - q) * height * 0.03}px)` }}>
      Your brain
      <br />
      isn't{" "}
      <span style={{ position: "relative", display: "inline-block", color: strike > 0.5 ? palette.dim : palette.ink }}>
        lazy.
        <span style={{ position: "absolute", left: "-4%", right: "-4%", top: "52%", height: width * 0.018, borderRadius: width * 0.01, background: palette.win, transform: `scaleX(${strike})`, transformOrigin: "left" }} />
      </span>
    </div>
  );
};

// The START button: rises in, then the mascot presses it.
const StartButton: React.FC<{ riseAt: number; pressAt: number }> = ({ riseAt, pressAt }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const up = spring({ frame: frame - riseAt, fps, config: springs.snappy });
  const press = interpolate(frame, [pressAt - 2, pressAt, pressAt + 5], [1, 0.86, 1], clamp);
  const lit = interpolate(frame, [pressAt, pressAt + 4], [0, 1], clamp);
  const s = width * 0.42;
  return (
    <div style={{ position: "absolute", left: width * 0.5 - s / 2, top: height * 0.62 - s / 2, width: s, height: s, transform: `translateY(${(1 - up) * height * 0.3}px) scale(${press})`, opacity: up }}>
      <div style={{ position: "absolute", inset: -s * 0.18, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(124,58,237,${0.25 + lit * 0.5}), transparent)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: lit > 0 ? `linear-gradient(160deg, ${palette.accent}, ${palette.hero})` : "linear-gradient(160deg,#3b3550,#1d1a28)", border: `${s * 0.035}px solid ${lit > 0 ? "#fff" : "rgba(167,139,250,0.55)"}`, boxShadow: `0 ${s * 0.06}px 0 #120c1f, 0 0 ${s * 0.4 * lit}px ${palette.hero}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: s * 0.2, color: "#fff", letterSpacing: s * 0.01 }}>
        START
      </div>
    </div>
  );
};

const Mascot: React.FC<{ src: string; inAt: number; pressAt: number }> = ({ src, inAt, pressAt }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame: frame - inAt, fps, config: springs.smooth });
  const lean = interpolate(frame, [pressAt - 8, pressAt, pressAt + 10], [0, 1, 0.2], clamp);
  const hop = frame > pressAt + 6 ? Math.abs(Math.sin((frame - pressAt) / 5)) * height * 0.012 : 0;
  const s = width * 0.42;
  return (
    <Img
      src={src}
      style={{ position: "absolute", left: width * 0.5 - s / 2, top: height * 0.24 - hop, width: s, height: s, opacity: q, transform: `translateY(${(1 - q) * -height * 0.1 + lean * height * 0.05}px) rotate(${lean * 6}deg) scale(${1 + lean * 0.06})`, transformOrigin: "50% 90%" }}
    />
  );
};

const Flash: React.FC<{ at: number; color?: string }> = ({ at, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + 9], [0, 0.85, 0], clamp);
  return <AbsoluteFill style={{ background: color, opacity: o }} />;
};

const Line: React.FC<{ text: string; y: number; keyword?: string; color?: string }> = ({ text, y, keyword, color = palette.accent }) => {
  const { width, height } = useVideoConfig();
  const parts = keyword ? text.split(keyword) : [text];
  return (
    <div style={{ position: "absolute", top: height * y, left: width * 0.06, right: width * 0.06, textAlign: "center" }}>
      <Entrance delay={4} breathe={false}>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.085, color: palette.ink, letterSpacing: -1 }}>
          {keyword ? (
            <>
              {parts[0]}
              <span style={{ color }}>{keyword}</span>
              {parts[1]}
            </>
          ) : (
            text
          )}
        </div>
      </Entrance>
    </div>
  );
};

// A step chip that slams in, checked
const Slam: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame, fps, config: { damping: 11, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: width * 0.5, top: height * 0.44, transform: `translate(-50%,-50%) scale(${1.5 - q * 0.5}) rotate(${(1 - q) * -6}deg)`, opacity: Math.min(1, q * 2) }}>
      <TaskChip label={label} dot={palette.win} checkAt={3} size={0.13} font={fonts.display} />
    </div>
  );
};

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const S = (id: string) => sceneById(manifest, id);
  const stuck = S("stuck"), clock = S("clock"), lazy = S("lazy"), button = S("button"), press = S("press"), say = S("say"), split = S("split");
  const step1 = S("step1"), step2 = S("step2"), step3 = S("step3"), focus = S("focus"), rest = S("rest"), started = S("started"), end = S("end");
  const pressAt = press.startFrame + 16; // the mascot hits the button
  const doneAt = started.startFrame + 4; // bar hits 100%

  // Bar fill: stuck at 0 until the press, then every FOCO step pushes it forward
  const fill = track(frame, [
    [0, 0], [pressAt, 0], [pressAt + 8, 0.05], [say.startFrame + 30, 0.1], [split.startFrame + 40, 0.2],
    [step1.startFrame + 4, 0.4], [step2.startFrame + 4, 0.6], [step3.startFrame + 4, 0.8], [focus.startFrame + 50, 0.95],
    [rest.startFrame + 10, 0.99], [doneAt - 2, 0.99], [doneAt, 1],
  ]);
  // Bar pose: big and central while stuck, a thin line under the headlines, above the phone in the product shots
  const k = (f: number, x: number, y: number, w: number, h: number): [number, number, number, number, number] => [f, x, y, w, h];
  const poses = [
    k(0, 0.5, 0.52, 0.84, 0.03), k(clock.startFrame, 0.5, 0.56, 0.84, 0.03), k(lazy.startFrame + 6, 0.5, 0.86, 0.7, 0.012),
    k(press.startFrame, 0.5, 0.88, 0.7, 0.012), k(say.startFrame + 6, 0.5, 0.11, 0.78, 0.016), k(step1.startFrame - 1, 0.5, 0.11, 0.78, 0.016), k(step1.startFrame + 3, 0.5, 0.6, 0.8, 0.026),
    k(focus.startFrame + 6, 0.5, 0.11, 0.78, 0.016), k(rest.startFrame + 4, 0.5, 0.5, 0.84, 0.036), k(started.startFrame, 0.5, 0.42, 0.84, 0.036),
    k(end.startFrame, 0.5, 0.42, 0.84, 0.036), k(end.startFrame + 10, 0.5, 0.2, 0.5, 0.01),
  ];
  const at = (i: 1 | 2 | 3 | 4) => track(frame, poses.map((p) => [p[0], p[i]]));
  const stuckPhase = frame < press.startFrame;
  const barColor = fill >= 1 ? `linear-gradient(90deg, ${palette.win}, ${palette.winLight})` : stuckPhase ? "#5d5670" : `linear-gradient(90deg, ${palette.hero}, ${palette.accent})`;
  const label = frame < say.startFrame ? "Starting: Clean the kitchen" : "Clean the kitchen";
  const labelOpacity = track(frame, [[0, 1], [lazy.startFrame, 1], [lazy.startFrame + 6, 0], [say.startFrame, 0], [say.startFrame + 8, 1], [end.startFrame, 1], [end.startFrame + 8, 0]]);
  const barOpacity = track(frame, [[0, 1], [end.startFrame + 6, 1], [end.startFrame + 14, 0]]);
  const glitch = frame < clock.startFrame + clock.durationFrames ? 1 : 0;
  const warm = track(frame, [[0, 0], [pressAt, 0], [pressAt + 10, 1]]);

  // One phone, carried from "say" through "focus"
  const phoneKeys = [
    { frame: say.startFrame, x: 0.5, y: 0.56, width: 0.58, height: ph(0.58), opacity: 0 },
    { frame: say.startFrame + 10, x: 0.5, y: 0.53, width: 0.58, height: ph(0.58), opacity: 1 },
    { frame: split.startFrame + 8, x: 0.5, y: 0.53, width: 0.6, height: ph(0.6), opacity: 1 },
    { frame: step1.startFrame, x: 0.5, y: 0.6, width: 0.4, height: ph(0.4), opacity: 0 },
    { frame: focus.startFrame, x: 0.5, y: 0.56, width: 0.4, height: ph(0.4), opacity: 0 },
    { frame: focus.startFrame + 10, x: 0.5, y: 0.53, width: 0.58, height: ph(0.58), opacity: 1 },
    { frame: rest.startFrame, x: 0.5, y: 0.53, width: 0.58, height: ph(0.58), opacity: 1 },
    { frame: rest.startFrame + 8, x: 0.5, y: 0.62, width: 0.4, height: ph(0.4), opacity: 0 },
  ];

  const sw = (f: number, v = 0.3) => ({ at: cueBefore(f, SWELL), sound: "swell", volume: v });
  const cues = [
    { at: 0, sound: "glitch", volume: 0.5 },
    { at: clock.startFrame, sound: "glitch", volume: 0.5 },
    { at: clock.startFrame + 23, sound: "impact", volume: 0.45 },
    { at: lazy.startFrame, sound: "impact", volume: 0.5 },
    { at: lazy.startFrame + 20, sound: "click", volume: 0.4 },
    { at: button.startFrame, sound: "impact", volume: 0.5 },
    { at: button.startFrame + 14, sound: "pop", volume: 0.45 },
    sw(pressAt, 0.3),
    { at: pressAt, sound: "click", volume: 0.5 },
    { at: pressAt, sound: "impact", volume: 0.6 },
    { at: say.startFrame, sound: "impact", volume: 0.5 },
    { at: split.startFrame, sound: "impact", volume: 0.5 },
    { at: split.startFrame + 40, sound: "pop", volume: 0.4 },
    { at: step1.startFrame, sound: "pop", volume: 0.5 },
    { at: step2.startFrame, sound: "pop", volume: 0.5 },
    { at: step3.startFrame, sound: "pop", volume: 0.5 },
    { at: step3.startFrame + 4, sound: "chime", volume: 0.4 },
    { at: focus.startFrame, sound: "impact", volume: 0.5 },
    sw(doneAt, 0.32),
    { at: doneAt, sound: "drop", volume: 0.6 },
    { at: doneAt, sound: "impact", volume: 0.55 },
    { at: end.startFrame, sound: "chime", volume: 0.5 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      {/* Ground: cold and grey while stuck, warm FOCO purple once started */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${palette.stuckWash}, ${palette.bg} 70%)`, opacity: 1 - warm }} />
      <AbsoluteFill style={{ opacity: warm }}>
        <BgAurora bg={palette.bg} hero={palette.hero} intensity={0.85} />
      </AbsoluteFill>

      {/* Stuck */}
      <SceneFrame from={stuck.startFrame} durationInFrames={stuck.durationFrames} enter="cut" exit="cut">
        <Spinner x={0.5} y={0.36} size={0.12} />
        <div style={{ position: "absolute", top: height * 0.64, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 700, fontSize: width * 0.055, color: palette.dim }}>Loading motivation...</div>
      </SceneFrame>
      <SceneFrame from={clock.startFrame} durationInFrames={clock.durationFrames} enter="cut" exit="cut">
        <RollingClock />
      </SceneFrame>
      <SceneFrame from={lazy.startFrame} durationInFrames={lazy.durationFrames} enter="cut" exit="cut">
        <NotLazy />
      </SceneFrame>
      <SceneFrame from={button.startFrame} durationInFrames={button.durationFrames + press.durationFrames} enter="cut" exit="cut">
        <Sequence durationInFrames={button.durationFrames}>
          <Headline text="It's missing a start button." keyword="start" emphasis="highlight" hero={palette.hero} font={fonts.display} maxSize={0.11} y={0.2} />
        </Sequence>
        <StartButton riseAt={10} pressAt={pressAt - button.startFrame} />
        <Mascot src={urls[A.mascot]} inAt={press.startFrame - button.startFrame} pressAt={pressAt - button.startFrame} />
        <Flash at={pressAt - button.startFrame} />
      </SceneFrame>

      {/* Product: the real recordings in one phone */}
      <Carry keys={phoneKeys}>
        {() => (
          <AbsoluteFill>
            <Sequence from={say.startFrame} durationInFrames={say.durationFrames}>
              <PhoneVideo src={urls[A.say]} trimSec={2} rate={1.6} lengthSec={7} glow={palette.hero} glowStrength={0.4} />
            </Sequence>
            <Sequence from={split.startFrame} durationInFrames={split.durationFrames + step1.durationFrames * 3}>
              <PhoneVideo src={urls[A.split]} rate={2.4} lengthSec={9.5} glow={palette.hero} glowStrength={0.4} />
            </Sequence>
            <Sequence from={focus.startFrame} durationInFrames={focus.durationFrames + rest.durationFrames}>
              <PhoneVideo src={urls[A.focus]} trimSec={1} rate={4.4} lengthSec={16} glow={palette.hero} glowStrength={0.4} />
            </Sequence>
          </AbsoluteFill>
        )}
      </Carry>
      <SceneFrame from={say.startFrame} durationInFrames={say.durationFrames} enter="cut" exit="cut">
        <Line text="Say it." keyword="Say" y={0.88} />
      </SceneFrame>
      <SceneFrame from={split.startFrame} durationInFrames={split.durationFrames} enter="cut" exit="cut">
        <Line text="AI splits it." keyword="AI" y={0.88} />
      </SceneFrame>
      {[
        [step1, "Clear all dishes into the sink"],
        [step2, "Load the dishwasher"],
        [step3, "Wipe the counters"],
      ].map(([s, l]) => {
        const sc = s as typeof step1;
        return (
          <SceneFrame key={sc.id} from={sc.startFrame} durationInFrames={sc.durationFrames} enter="cut" exit="cut">
            <Slam label={l as string} />
          </SceneFrame>
        );
      })}
      <SceneFrame from={focus.startFrame} durationInFrames={focus.durationFrames} enter="cut" exit="cut">
        <Line text="FOCO sits with you." keyword="FOCO" y={0.88} />
      </SceneFrame>

      {/* Started */}
      <Sequence from={started.startFrame - 2} durationInFrames={started.durationFrames + 30}>
        <Burst at={doneAt - started.startFrame + 2} x={0.5} y={0.42} color={palette.win} accent={palette.winLight} radius={0.7} />
      </Sequence>
      <SceneFrame from={started.startFrame} durationInFrames={started.durationFrames} enter="cut" exit="cut">
        <Sequence from={doneAt - started.startFrame}>
          <Headline text="Started." keyword="Started" hero={palette.win} font={fonts.display} maxSize={0.2} y={0.58} />
        </Sequence>
      </SceneFrame>

      {/* The bar itself, above everything */}
      <div style={{ opacity: barOpacity }}>
        <LoadingBar fill={fill} x={at(1)} y={at(2)} w={at(3)} h={at(4)} label={label} labelOpacity={labelOpacity} color={barColor} glow={stuckPhase ? 0 : 1} glitch={glitch} />
      </div>

      {/* End card */}
      <SceneFrame from={end.startFrame} durationInFrames={end.durationFrames} enter="cut" exit="cut">
        <div style={{ position: "absolute", top: height * 0.3, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04 }}>
          <Entrance delay={8} breathe={false}>
            <Img src={urls[A.icon]} style={{ width: width * 0.2, height: width * 0.2, borderRadius: width * 0.045, boxShadow: `0 0 ${width * 0.08}px ${palette.hero}` }} />
          </Entrance>
          <Entrance delay={12} breathe={false}>
            <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.15, color: palette.ink, letterSpacing: width * 0.006 }}>FOCO</div>
          </Entrance>
        </div>
        <Sequence from={20}>
          <Headline text="The start button for ADHD brains." keyword="start" hero={palette.accent} font={fonts.display} maxSize={0.085} y={0.56} />
        </Sequence>
        <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.72, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04 }}>
          <Entrance delay={34} breathe={false}>
            <Img src={urls[A.appStore]} style={{ height: width * 0.13 }} />
          </Entrance>
          <Entrance delay={38} breathe={false}>
            <Img src={urls[A.googlePlay]} style={{ height: width * 0.16 }} />
          </Entrance>
        </div>
        <Sequence from={44}>
          <div style={{ position: "absolute", top: height * 0.81, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 700, fontSize: width * 0.045, color: palette.dim }}>Free to download</div>
        </Sequence>
      </SceneFrame>

      <SoundCues cues={cues} sounds={{ glitch: urls[SFX.glitch], swell: urls[SFX.swell], impact: urls[SFX.impact], click: urls[SFX.click], chime: urls[SFX.chime], pop: urls[SFX.pop], drop: urls[SFX.drop] }} />
      {manifest.music ? <Music src={urls[MUSIC]} volume={0.42} dips={[{ from: rest.startFrame, to: doneAt, volume: 0.06 }]} /> : null}
      <Grain blend="overlay" opacity={0.06} />
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};
