import React from "react";
import { AbsoluteFill, Freeze, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { Captions, ClipLayer, Grain, Headline, Music, SceneFrame, SoundCues, Vignette, Voiceover, cueBefore, fonts, onWord, sceneById, springs, wordFrame } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";
import { Burst } from "./Burst";
import { PhoneVideo } from "./PhoneVideo";
import { TaskChip } from "./TaskChip";

// A young freelancer frozen by task paralysis; FOCO's purple light splits the task and melts the frost.
const P = { bg: "#040208", ink: "#FFFFFF", hero: "#7C3AED", accent: "#A78BFA", glow: "#C4B5FD", dim: "#B8B0CC", win: "#FB923C", winLight: "#FDE68A", ice: "#BFE3FF", green: "#4ADE80" };
const A = {
  ask: "assets/user/a-65f121f7-ask.mp4",
  start: "assets/user/a-105fcb78-start.mp4",
  did: "assets/user/a-fdfca650-did.mp4",
  stuck: "assets/user/a-fe5eb2af-mstuck.mp4",
  typing: "assets/user/a-5d5ffbe6-mtyping.mp4",
  coffee: "assets/user/a-7e8fbf77-mrelief.mp4",
  icon: "assets/user/a-39740cca-a-75c2c850-foco-icon.png",
  appStore: "assets/user/a-f3753e44-a-3157030f-app-store.png",
  googlePlay: "assets/user/a-e3c4c0a3-a-20e23b4b-google-play.png",
};
const MUSIC = "assets/lib/music-cinematic-rise/track.mp3";
const SFX = {
  clock: "assets/lib/hollywood-essentials-tension-builders-tension-builders-clock-ticking/clip.mp3",
  crackle: "assets/lib/ultimate-social-content-foley-crackle/clip.mp3",
  whooshLight: "assets/lib/hollywood-essentials-fantasy-fantasy-whoosh-light/clip.mp3",
  shimmer: "assets/lib/sfx-ui-sparkle-shimmer/clip.mp3",
  glass: "assets/lib/hollywood-essentials-impacts-and-explosions-impacts-explosions-breaking-glass/clip.mp3",
  chime: "assets/lib/sfx-ui-success-chime/clip.mp3",
  impact: "assets/lib/sfx-ui-soft-impact/clip.mp3",
  click: "assets/lib/youtube-picks-interface-mouse-click/clip.mp3",
  shine: "assets/lib/hollywood-essentials-fantasy-fantasy-shine/clip.mp3",
};
const STEPS = ["Open your email and check titles", "Flag the 3 most urgent", "Draft the first reply", "Send quick responses", "Close the email tab"];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ph = (w: number) => w * (1080 / 1920) * 2;
const rnd = (n: number) => {
  const x = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return x - Math.floor(x);
};

// The room behind everything: the generated clip when it exists, a dim desk-lamp room when it doesn't
const Room: React.FC<{ src?: string; freezeAt?: number }> = ({ src, freezeAt }) => {
  if (!src) return <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 35%, #3a2a1c 0%, #140d0a 45%, #050305 80%)" }} />;
  const layer = <ClipLayer src={src} dim={0.12} />;
  return freezeAt === undefined ? layer : <Freeze frame={freezeAt}>{layer}</Freeze>;
};

// Ice creeping in from the edges; `hole` melts a circle of it from (hx, hy)
const Frost: React.FC<{ amount: number; hole?: number; hx?: number; hy?: number }> = ({ amount, hole = 0, hx = 0.5, hy = 0.55 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.001) return null;
  const mask = hole > 0 ? `radial-gradient(circle at ${hx * 100}% ${hy * 100}%, transparent ${hole * 140}%, black ${hole * 140 + 12}%)` : undefined;
  const flakes = Array.from({ length: 26 });
  return (
    <AbsoluteFill style={{ opacity: amount, WebkitMaskImage: mask, maskImage: mask, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 38%, rgba(191,227,255,0.35) 70%, rgba(220,240,255,0.85) 100%)` }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 160px 40px rgba(200,232,255,0.55)" }} />
      {flakes.map((_, i) => {
        const x = rnd(i) * 100;
        const y = rnd(i + 40) * 100;
        const edge = Math.min(x, 100 - x, y, 100 - y);
        if (edge > 22) return null;
        const s = 6 + rnd(i + 7) * 16;
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s, height: s, background: "rgba(255,255,255,0.85)", clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)", transform: `rotate(${frame * 0.5 + i * 20}deg)`, opacity: 0.7 }} />;
      })}
    </AbsoluteFill>
  );
};

const Clock: React.FC<{ from: number; to: number; frames: number; y: number }> = ({ from, to, frames, y }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const m = Math.round(interpolate(frame, [0, frames], [from, to], clamp));
  const q = spring({ frame, fps, config: springs.snappy });
  return (
    <div style={{ position: "absolute", top: height * y, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.2, color: P.ink, letterSpacing: -3, opacity: q, textShadow: "0 8px 40px rgba(0,0,0,0.7)", fontVariantNumeric: "tabular-nums" }}>
      {Math.floor(m / 60)}:{String(m % 60).padStart(2, "0")}
    </div>
  );
};

const Thoughts: React.FC<{ freezeAt: number }> = ({ freezeAt }) => {
  const live = useCurrentFrame();
  const frame = Math.min(live, freezeAt);
  const { width, height, fps } = useVideoConfig();
  const items = ["nap ends at 2:00", "47 unread emails", "just one more scroll"];
  return (
    <AbsoluteFill>
      {items.map((t, i) => {
        const q = spring({ frame: frame - i * 9, fps, config: springs.smooth });
        const y = 0.36 + i * 0.09;
        const drift = Math.sin(frame / 14 + i) * width * 0.02;
        return (
          <div key={t} style={{ position: "absolute", left: width * (i % 2 ? 0.58 : 0.42) + drift, top: height * y, transform: `translate(-50%,-50%) rotate(${(i - 1) * 4}deg) scale(${q})`, fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.06, whiteSpace: "nowrap", color: live >= freezeAt ? P.ice : P.ink, textShadow: live >= freezeAt ? `0 0 20px ${P.ice}` : "0 6px 24px rgba(0,0,0,0.8)" }}>
            {t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// The big task card that shatters into the step chips at `breakAt`
const Shatter: React.FC<{ breakAt: number; glowFirstAt: number }> = ({ breakAt, glowFirstAt }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const cardIn = spring({ frame: frame - 2, fps, config: springs.snappy });
  const broken = frame >= breakAt;
  const shards = Array.from({ length: 12 });
  const firstOn = frame >= glowFirstAt;
  return (
    <AbsoluteFill>
      {!broken ? (
        <div style={{ position: "absolute", left: width * 0.5, top: height * 0.32, transform: `translate(-50%,-50%) scale(${0.6 + cardIn * 0.4}) rotate(${Math.sin(frame / 2) * (frame > breakAt - 10 ? 2 : 0)}deg)`, opacity: cardIn }}>
          <div style={{ padding: `${width * 0.05}px ${width * 0.07}px`, borderRadius: width * 0.05, background: "rgba(20,12,34,0.95)", border: `${width * 0.006}px solid ${P.accent}`, boxShadow: `0 0 ${width * 0.12}px ${P.hero}`, fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.062, color: P.ink, whiteSpace: "nowrap" }}>
            Reply to important emails
          </div>
        </div>
      ) : null}
      {broken
        ? shards.map((_, i) => {
            const t = (frame - breakAt) / fps;
            const a = rnd(i) * Math.PI * 2;
            const v = width * (0.5 + rnd(i + 3) * 0.6);
            const o = interpolate(frame - breakAt, [0, 18], [1, 0], clamp);
            return <div key={i} style={{ position: "absolute", left: width * 0.5 + Math.cos(a) * v * t, top: height * 0.3 + Math.sin(a) * v * t + 900 * t * t, width: width * 0.06, height: width * 0.03, background: P.glow, opacity: o, transform: `rotate(${frame * 20 + i * 30}deg)`, boxShadow: `0 0 20px ${P.accent}` }} />;
          })
        : null}
      {broken
        ? STEPS.map((s, i) => {
            const q = spring({ frame: frame - breakAt - 3 - i * 4, fps, config: { damping: 12, stiffness: 180 } });
            const float = Math.sin((frame + i * 13) / 16) * height * 0.004;
            const dim = firstOn && i > 0 ? 0 : 1;
            const big = firstOn && i === 0 ? 1.12 : 1;
            return (
              <div key={s} style={{ position: "absolute", left: width * 0.5, top: height * (0.17 + i * 0.075) + float, transform: `translate(-50%,-50%) scale(${q * big})`, opacity: q * dim, filter: firstOn && i === 0 ? `drop-shadow(0 0 24px ${P.accent})` : undefined }}>
                <TaskChip label={s} dot={i === 0 && firstOn ? P.win : P.accent} size={0.06} font={fonts.display} />
              </div>
            );
          })
        : null}
    </AbsoluteFill>
  );
};

// Purple light: a ring that sweeps out from the phone when START is pressed
const LightRing: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (frame < at) return null;
  const t = interpolate(frame - at, [0, 22], [0, 1], clamp);
  const r = width * 2.4 * t;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: width * x - r / 2, top: height * y - r / 2, width: r, height: r, borderRadius: "50%", border: `${width * 0.03 * (1 - t) + 2}px solid ${P.glow}`, boxShadow: `0 0 ${width * 0.1}px ${P.accent}, inset 0 0 ${width * 0.1}px ${P.accent}`, opacity: 1 - t }} />
      <AbsoluteFill style={{ background: P.glow, opacity: interpolate(frame - at, [0, 2, 10], [0, 0.5, 0], clamp) }} />
    </AbsoluteFill>
  );
};

const PhoneAt: React.FC<{ w: number; y: number; inAt?: number; children: React.ReactNode }> = ({ w, y, inAt = 0, children }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame: frame - inAt, fps, config: springs.smooth });
  return (
    <div style={{ position: "absolute", left: width * (0.5 - w / 2), top: height * (y - ph(w) / 2), width: width * w, height: height * ph(w), transform: `translateY(${(1 - q) * height * 0.4}px) rotate(${(1 - q) * 8}deg)`, opacity: q }}>
      {children}
    </div>
  );
};

const TimerBadge: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame: frame - 6, fps, config: springs.snappy });
  const left = Math.max(0, startSec - Math.floor(frame / fps));
  return (
    <div style={{ position: "absolute", top: height * 0.16, left: width * 0.06, display: "flex", alignItems: "center", gap: width * 0.02, padding: `${width * 0.018}px ${width * 0.035}px`, borderRadius: width, background: "rgba(10,6,20,0.85)", border: `3px solid ${P.green}`, transform: `scale(${q})`, transformOrigin: "0% 50%", fontFamily: fonts.display }}>
      <div style={{ width: width * 0.025, height: width * 0.025, borderRadius: "50%", background: P.green, opacity: 0.5 + 0.5 * Math.sin(frame / 5) }} />
      <div>
        <div style={{ fontSize: width * 0.026, fontWeight: 700, color: P.green, letterSpacing: 2 }}>FOCUSING WITH FOCO</div>
        <div style={{ fontSize: width * 0.065, fontWeight: 800, color: P.ink, fontVariantNumeric: "tabular-nums" }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
      </div>
    </div>
  );
};

const TopLine: React.FC<{ text: string; keyword?: string; color?: string; y?: number }> = ({ text, keyword, color = P.accent, y = 0.07 }) => (
  <Headline text={text} keyword={keyword} hero={color} font={fonts.display} maxSize={0.085} y={y} />
);

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const { width, height } = useVideoConfig();
  const S = (id: string) => sceneById(manifest, id);
  const hook = S("hook"), frozen = S("frozen"), ask = S("ask"), magic = S("magic"), one = S("one"), started = S("started"), relief = S("relief"), cta = S("cta");
  const hookClip = urls[A.stuck];

  const breakAt = wordFrame(magic, "broke"); // in magic's clock
  const glowFirstAt = wordFrame(one, "step"); // in one's clock (Shatter continues into "one")
  const pressAt = onWord(one, "just"); // START pressed, the frost melts
  const doingAt = started.startFrame + wordFrame(started, "doing");
  const doneAt = relief.startFrame + wordFrame(relief, "done");
  const startWordAt = cta.startFrame + wordFrame(cta, "start");

  // Frost over the whole film: creeps in during "frozen", holds, melts on START
  const frame = useCurrentFrame();
  const frost = interpolate(frame, [frozen.startFrame + 4, frozen.startFrame + 26], [0, 1], clamp) * (frame < started.startFrame ? 1 : 0);
  const melt = interpolate(frame, [one.startFrame + pressAt, one.startFrame + pressAt + 26], [0, 1], clamp);
  const desat = frost * (1 - melt);

  const cues = [
    { at: 0, sound: "clock", volume: 0.35 },
    { at: 2, sound: "impact", volume: 0.4 },
    { at: frozen.startFrame + 2, sound: "crackle", volume: 0.5 },
    { at: frozen.startFrame + 4, sound: "impact", volume: 0.45 },
    { at: cueBefore(ask.startFrame + 12, 40), sound: "whooshLight", volume: 0.3 },
    { at: magic.startFrame, sound: "shimmer", volume: 0.45 },
    { at: magic.startFrame + breakAt, sound: "glass", volume: 0.5 },
    { at: magic.startFrame + breakAt + 6, sound: "shimmer", volume: 0.4 },
    { at: one.startFrame + glowFirstAt, sound: "impact", volume: 0.35 },
    { at: one.startFrame + pressAt, sound: "click", volume: 0.5 },
    { at: one.startFrame + pressAt, sound: "shine", volume: 0.5 },
    { at: started.startFrame, sound: "impact", volume: 0.45 },
    { at: doingAt, sound: "chime", volume: 0.35 },
    { at: doneAt, sound: "chime", volume: 0.5 },
    { at: startWordAt, sound: "impact", volume: 0.5 },
    { at: startWordAt + 2, sound: "shimmer", volume: 0.4 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: P.bg }}>
      {/* The world: live during the hook, frozen until START, warm after */}
      <AbsoluteFill style={{ filter: `grayscale(${desat}) brightness(${1 - desat * 0.15}) hue-rotate(${desat * 10}deg)` }}>
        <SceneFrame from={hook.startFrame} durationInFrames={hook.durationFrames} enter="cut" exit="cut">
          <Room src={hookClip} />
        </SceneFrame>
        <SceneFrame from={frozen.startFrame} durationInFrames={frozen.durationFrames + ask.durationFrames + magic.durationFrames + one.durationFrames} enter="cut" exit="cut">
          <Room src={hookClip} freezeAt={Math.max(0, hook.durationFrames - 1)} />
          <AbsoluteFill style={{ background: "rgba(4,2,8,0.35)" }} />
        </SceneFrame>
        <SceneFrame from={started.startFrame} durationInFrames={started.durationFrames} enter="cut" exit="cut">
          <Room src={urls[A.typing]} />
        </SceneFrame>
        <SceneFrame from={relief.startFrame} durationInFrames={relief.durationFrames} enter="cut" exit="cut">
          <Room src={urls[A.coffee]} />
        </SceneFrame>
      </AbsoluteFill>
      <Frost amount={frost} hole={melt} hx={0.5} hy={0.62} />

      {/* Hook + frozen: the clock and the thoughts */}
      <SceneFrame from={hook.startFrame} durationInFrames={hook.durationFrames} enter="cut" exit="cut">
        <Clock from={1 * 60 + 20} to={1 * 60 + 20} frames={1} y={0.15} />
        <Sequence from={onWord(hook, "haven't")}>
          <TopLine text="Hasn't started." keyword="started" color={P.win} y={0.36} />
        </Sequence>
      </SceneFrame>
      <SceneFrame from={frozen.startFrame} durationInFrames={frozen.durationFrames} enter="cut" exit="cut">
        <Clock from={1 * 60 + 20} to={1 * 60 + 44} frames={frozen.durationFrames} y={0.15} />
        <Thoughts freezeAt={26} />
        <Sequence from={onWord(frozen, "won't")}>
          <TopLine text="Brain: frozen." keyword="frozen" color={P.ice} y={0.62} />
        </Sequence>
      </SceneFrame>

      {/* FOCO: the phone, the magic split, step one and START */}
      <Sequence from={ask.startFrame} durationInFrames={ask.durationFrames + breakAt}>
        <PhoneAt w={0.4} y={0.51} inAt={2}>
          <PhoneVideo src={urls[A.ask]} rate={2.4} lengthSec={10.6} glow={P.hero} glowStrength={0.7} />
        </PhoneAt>
      </Sequence>
      <SceneFrame from={ask.startFrame} durationInFrames={ask.durationFrames} enter="cut" exit="cut">
        <TopLine text="So she asked FOCO." keyword="FOCO" y={0.19} />
      </SceneFrame>
      <Sequence from={magic.startFrame} durationInFrames={magic.durationFrames + one.durationFrames}>
        <Shatter breakAt={breakAt} glowFirstAt={magic.durationFrames + glowFirstAt} />
      </Sequence>
      <Sequence from={magic.startFrame + breakAt - 2} durationInFrames={40}>
        <Burst at={2} x={0.5} y={0.3} color={P.accent} accent={P.glow} radius={0.6} />
      </Sequence>
      <Sequence from={one.startFrame} durationInFrames={one.durationFrames}>
        <PhoneAt w={0.4} y={0.5} inAt={0}>
          <PhoneVideo src={urls[A.start]} trimSec={1.2} rate={Math.max(1, (6.4 * 30) / Math.max(1, pressAt + 2))} lengthSec={7.6} glow={P.hero} glowStrength={0.8} />
        </PhoneAt>
        <LightRing at={pressAt} x={0.5} y={0.5} />
      </Sequence>

      {/* Started: real hands, a FOCO timer, steps ticking off */}
      <SceneFrame from={started.startFrame} durationInFrames={started.durationFrames} enter="cut" exit="cut">
        <TimerBadge startSec={118} />
        {[0, 1].map((i) => (
          <div key={i} style={{ position: "absolute", left: width * 0.5, top: height * (0.5 + i * 0.075), transform: "translate(-50%,-50%)" }}>
            <TaskChip label={STEPS[i]} dot={P.win} checkAt={wordFrame(started, "doing") - 6 + i * 14} size={0.07} font={fonts.display} />
          </div>
        ))}
        <Sequence from={wordFrame(started, "doing")}>
          <TopLine text="Started." keyword="Started" color={P.win} y={0.32} />
        </Sequence>
      </SceneFrame>
      <SceneFrame from={relief.startFrame} durationInFrames={relief.durationFrames} enter="cut" exit="cut">
        <div style={{ position: "absolute", left: width * 0.06, top: height * 0.15, width: width * 0.28, height: height * ph(0.3) }}>
          <PhoneVideo src={urls[A.did]} trimSec={0.3} rate={1} lengthSec={2.6} glow={P.win} glowStrength={0.5} />
        </div>
        <Sequence from={wordFrame(relief, "done")}>
          <TopLine text="First step done." keyword="done" color={P.green} y={0.55} />
        </Sequence>
      </SceneFrame>

      {/* The start button */}
      <SceneFrame from={cta.startFrame} durationInFrames={cta.durationFrames} enter="cut" exit="cut">
        <EndCard startAt={wordFrame(cta, "start")} urls={urls} />
      </SceneFrame>

      {manifest.scenes.map((s) => (
        <SceneFrame key={`vo-${s.id}`} from={s.startFrame} durationInFrames={s.durationFrames} enter="cut" exit="cut">
          {s.id === "cta" ? null : <Captions words={s.words} group={manifest.captions} mode="pop" highlight={P.hero} face={fonts.display} bottom={0.26} />}
          {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
        </SceneFrame>
      ))}
      <SoundCues cues={cues} sounds={Object.fromEntries(Object.entries(SFX).map(([k, v]) => [k, urls[v]]))} />
      {manifest.music ? <Music src={urls[MUSIC]} volume={0.4} dips={[{ from: frozen.startFrame, to: one.startFrame + pressAt, volume: 0.12 }]} /> : null}
      <Grain blend="overlay" opacity={0.05} />
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ startAt: number; urls: Record<string, string> }> = ({ startAt, urls }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const q = spring({ frame: frame - 2, fps, config: springs.snappy });
  const lit = interpolate(frame, [startAt, startAt + 6], [0, 1], clamp);
  const s = width * 0.26;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, rgba(124,58,237,${0.25 + lit * 0.35}), ${P.bg} 65%)` }}>
      <div style={{ position: "absolute", left: width * 0.5 - s / 2, top: height * 0.15, width: s, height: s, borderRadius: "50%", background: `linear-gradient(160deg, ${P.accent}, ${P.hero})`, border: `${s * 0.035}px solid #fff`, boxShadow: `0 0 ${s * (0.3 + lit * 0.6)}px ${P.hero}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: s * 0.2, color: "#fff", letterSpacing: s * 0.01, transform: `scale(${q * (1 + lit * 0.06)})` }}>
        START
      </div>
      <div style={{ position: "absolute", top: height * 0.32, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04, opacity: q }}>
        <Img src={urls[A.icon]} style={{ width: width * 0.16, height: width * 0.16, borderRadius: width * 0.035 }} />
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.13, color: P.ink, letterSpacing: width * 0.006 }}>FOCO</div>
      </div>
      <Sequence from={startAt}>
        <Headline text="The start button your brain is missing." keyword="start" hero={P.accent} font={fonts.display} maxSize={0.062} y={0.55} />
      </Sequence>
      <div style={{ position: "absolute", top: height * 0.665, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: width * 0.04, opacity: interpolate(frame, [startAt + 10, startAt + 18], [0, 1], clamp) }}>
        <Img src={urls[A.appStore]} style={{ height: width * 0.12 }} />
        <Img src={urls[A.googlePlay]} style={{ height: width * 0.15 }} />
      </div>
    </AbsoluteFill>
  );
};
