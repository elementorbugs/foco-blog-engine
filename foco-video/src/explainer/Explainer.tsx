// "5 best apps for ADHD task paralysis" explainer, hosted by the FOCO mascot.
// Voiceover + word timings come from tts/ (generate.mjs -> analyze.py -> vo.json).
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { BODY, Background, C, Check, HEAD } from "../Composition";
import VO from "./vo.json";

export const FPS = 30;
const GAP = 0.6; // seconds of breath between scenes
const END_HOLD = 90;

export type Word = { text: string; start: number; end: number };
export type Scene = { id: string; mascot: number; duration: number; words: Word[]; env: number[] };
const SCENES = VO as Scene[];

// Scene start (seconds) on the global timeline
const STARTS: Record<string, number> = {};
{
  let t = 0.4;
  for (const s of SCENES) {
    STARTS[s.id] = t;
    t += s.duration + GAP;
  }
}
const sceneOf = (id: string) => SCENES.find((s) => s.id === id)!;
const last = SCENES[SCENES.length - 1];
export const EXPLAINER_TOTAL = Math.round((STARTS[last.id] + last.duration) * FPS) + END_HOLD;

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

// Local frame (inside the scene's Sequence) when `phrase` starts being spoken
const at = (id: string, phrase: string) => {
  const words = sceneOf(id).words.map((w) => norm(w.text));
  const p = phrase.split(" ").map(norm);
  for (let i = 0; i + p.length <= words.length; i++) {
    if (p.every((w, k) => words[i + k] === w)) return Math.round(sceneOf(id).words[i].start * FPS);
  }
  throw new Error(`phrase not found in ${id}: ${phrase}`);
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, from: number, damping = 14) => spring({ frame: frame - from, fps: FPS, config: { damping } });

const ORANGE = C.celebrate;
const GREEN = "#4ADE80";

// ───────────────────────── Captions ─────────────────────────
type Page = { words: Word[]; start: number; end: number };
const pagesOf = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const endSentence = /[.?!]$/.test(w.text);
    const comma = /,$/.test(w.text) && cur.length >= 3;
    if (cur.length >= 6 || endSentence || comma || i === words.length - 1) {
      pages.push({ words: cur, start: cur[0].start, end: w.end });
      cur = [];
    }
  });
  pages.forEach((p, i) => (p.end = i + 1 < pages.length ? pages[i + 1].start : p.end + 0.5));
  return pages;
};

export const Captions: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const page = pagesOf(scene.words).find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  const enter = pop(frame, Math.round(page.start * FPS), 18);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1300, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 20, fontFamily: BODY, fontWeight: 800, fontSize: 54, lineHeight: 1.2, padding: "14px 30px", borderRadius: 22, background: "rgba(4,2,8,0.62)", transform: `translateY(${(1 - enter) * 16}px)`, opacity: enter }}>
        {page.words.map((w, i) => {
          const next = page.words[i + 1];
          const active = t >= w.start && t < (next ? next.start : w.end + 0.3);
          const said = t >= w.start;
          return (
            <span key={i} style={{ color: active ? ORANGE : said ? "#FFFFFF" : "rgba(255,255,255,0.55)", display: "inline-block", textShadow: active ? "0 0 18px rgba(251,146,60,0.55)" : "none" }}>
              {w.text.replace(/^Foco/, "FOCO")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────── Mascot host ─────────────────────────
export type Spot = { x: number; y: number; h: number };
export const Mascot: React.FC<{ scene: Scene; spot: Spot; state?: number }> = ({ scene, spot, state }) => {
  const frame = useCurrentFrame();
  // Smoothed loudness (~1/3 s window) so the mascot sways with the voice instead of jittering per frame
  const win = 5;
  let sum = 0, n = 0;
  for (let k = frame - win; k <= frame + win; k++) {
    if (k >= 0 && k < scene.env.length) { sum += scene.env[k]; n++; }
  }
  const talk = Math.min(1, (n ? sum / n : 0) * 1.3);
  const enter = pop(frame, 0, 12);
  const bob = Math.sin(frame / 22) * 7;
  return (
    <Img
      src={staticFile(`mascots/foco_state_${state ?? scene.mascot}_${["", "presence", "alignment", "focus", "drift", "completion", "pause"][state ?? scene.mascot]}.png`)}
      style={{
        position: "absolute", left: spot.x, top: spot.y, height: spot.h,
        transformOrigin: "50% 100%",
        transform: `translateY(${(1 - enter) * 200 + bob - talk * 6}px) scale(${1 + talk * 0.01}, ${1 + talk * 0.025})`,
        opacity: enter,
        filter: "drop-shadow(0 20px 40px rgba(124,58,237,0.45))",
      }}
    />
  );
};

// ───────────────────────── Shared bits ─────────────────────────
export const Chip: React.FC<{ color: string; children: React.ReactNode; size?: number }> = ({ color, children, size = 26 }) => (
  <div style={{ display: "inline-block", fontFamily: BODY, fontWeight: 800, fontSize: size, letterSpacing: 3, color, padding: "10px 24px", borderRadius: 999, background: `${color}22`, border: `2px solid ${color}88` }}>
    {children}
  </div>
);

// Shows exactly one statement at a time, each from its trigger frame until the next
const Statements: React.FC<{ items: { from: number; node: React.ReactNode }[]; style?: React.CSSProperties }> = ({ items, style }) => {
  const frame = useCurrentFrame();
  const idx = items.reduce((acc, it, i) => (frame >= it.from ? i : acc), -1);
  if (idx < 0) return null;
  const s = pop(frame, items[idx].from, 13);
  return <div style={{ ...style, opacity: s, transform: `translateY(${(1 - s) * 50}px) scale(${0.94 + s * 0.06})` }}>{items[idx].node}</div>;
};

export const Big: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 120 }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.04, color: C.text }}>{children}</div>
);

// ───────────────────────── Scenes ─────────────────────────
const Hook: React.FC = () => {
  const id = "hook";
  const frame = useCurrentFrame();
  const lineX = interpolate(frame, [at(id, "Because your brain"), at(id, "Because your brain") + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Statements
        style={{ position: "absolute", left: 140, top: 200, width: 1250 }}
        items={[
          { from: at(id, "You know exactly"), node: <Big>You know exactly<br />what to do.</Big> },
          { from: at(id, "You just can't start"), node: <Big>You just <span style={{ color: ORANGE }}>can't start.</span></Big> },
          { from: at(id, "Not because"), node: <Big>Not because<br />you're <span style={{ textDecoration: "line-through", color: C.muted }}>lazy</span>.</Big> },
          { from: at(id, "Because your brain"), node: (
            <div>
              <Big size={100}>Stuck at the<br /><span style={{ color: C.primary2 }}>starting line.</span></Big>
              <div style={{ marginTop: 40, height: 14, width: 900 * lineX, borderRadius: 999, background: `repeating-linear-gradient(90deg, #fff 0 40px, #111 40px 80px)` }} />
            </div>
          ) },
          { from: at(id, "And most planner apps"), node: <Big size={100}>Most planner apps<br />solve the <span style={{ color: ORANGE }}>wrong problem.</span></Big> },
        ]}
      />
    </AbsoluteFill>
  );
};

const TODOS = ["Finish the report", "Reply to that email", "Book the dentist"];
const Problem: React.FC = () => {
  const id = "problem";
  const frame = useCurrentFrame();
  const listIn = pop(frame, 0);
  const frozen = at(id, "and still sit frozen");
  const gapAt = at(id, "That gap");
  const termAt = at(id, "Task initiation deficit");
  const showList = frame < gapAt;
  // clock fast-forwards while nothing happens
  const mins = Math.floor(interpolate(frame, [frozen, gapAt], [0, 167], clamp));
  return (
    <AbsoluteFill>
      {showList ? (
        <div style={{ position: "absolute", left: 160, top: 150, display: "flex", gap: 80, alignItems: "flex-start" }}>
          <div style={{ width: 760, padding: "40px 44px", borderRadius: 32, background: "#FAF8FD", boxShadow: "0 40px 90px rgba(0,0,0,0.5)", opacity: listIn, transform: `rotate(-2deg) translateY(${(1 - listIn) * 80}px)` }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: "#160F22" }}>Today</div>
            {TODOS.map((t, i) => {
              const s = pop(frame, at(id, "You can have a perfect list") + i * 6);
              const isFirst = i === 0 && frame >= frozen;
              return (
                <div key={t} style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 24, opacity: s, padding: "18px 20px", borderRadius: 18, background: isFirst ? "rgba(96,165,250,0.18)" : "transparent", border: isFirst ? "3px solid #60A5FA" : "3px solid transparent" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, border: "4px solid #7C3AED" }} />
                  <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 42, color: "#26203A" }}>{t}</div>
                  {isFirst ? <div style={{ width: 4, height: 44, background: "#26203A", opacity: Math.floor(frame / 15) % 2 }} /> : null}
                </div>
              );
            })}
          </div>
          <div style={{ opacity: frame >= frozen ? 1 : 0, textAlign: "center", marginTop: 60 }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 130, color: "#60A5FA" }}>
              {Math.floor(mins / 60)}:{String(mins % 60).padStart(2, "0")}
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.muted }}>still on item one</div>
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 160, top: 170, width: 1500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Big size={110}>Knowing</Big>
            <div style={{ height: 12, width: 380 * pop(frame, gapAt + 6), borderRadius: 999, background: `linear-gradient(90deg, ${C.primary2}, ${ORANGE})` }} />
            <Big size={110}><span style={{ opacity: pop(frame, gapAt + 14) }}>Starting</span></Big>
          </div>
          {frame >= termAt ? (
            <div style={{ marginTop: 70, opacity: pop(frame, termAt), transform: `scale(${0.9 + pop(frame, termAt) * 0.1})`, transformOrigin: "left center" }}>
              <Chip color={ORANGE}>THE NAME FOR THAT GAP</Chip>
              <div style={{ marginTop: 24, fontFamily: HEAD, fontWeight: 800, fontSize: 96, color: ORANGE }}>Task initiation deficit</div>
            </div>
          ) : null}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Host: React.FC = () => {
  const id = "host";
  const frame = useCurrentFrame();
  const disc = pop(frame, at(id, "Full disclosure"), 11);
  const test = pop(frame, at(id, "one honest test"), 11);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 900, top: 230, width: 900 }}>
        <Big size={120}>Hi, I'm <span style={{ color: C.primary2 }}>FOCO.</span></Big>
        <div style={{ marginTop: 40, opacity: disc, transform: `rotate(-3deg) scale(${0.7 + disc * 0.3})`, transformOrigin: "left center", display: "inline-block", padding: "22px 34px", borderRadius: 22, background: "#FDE68A", color: "#3B2A05", fontFamily: BODY, fontWeight: 800, fontSize: 40 }}>
          Full disclosure: I'm one of the apps 👀
        </div>
        <div style={{ marginTop: 40, opacity: test, fontFamily: HEAD, fontWeight: 800, fontSize: 70, color: C.text }}>
          So: <span style={{ color: ORANGE }}>1 honest test.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CRITERIA = [
  { phrase: "What happens in the first", text: "What happens in the first 60 seconds?" },
  { phrase: "Does it get you moving", text: "Gets you moving, not planning" },
  { phrase: "How many taps", text: "Few taps to a real action" },
  { phrase: "And can you try", text: "Core feature free to try" },
];
const Criteria: React.FC = () => {
  const id = "criteria";
  const frame = useCurrentFrame();
  const passAt = at(id, "Here are the five");
  const secs = Math.max(0, 60 - Math.floor(frame / FPS) * 4);
  const ring = interpolate(frame, [0, passAt], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, top: 110 }}>
        <Chip color={C.primary2}>THE TEST</Chip>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 24 }}>
          {CRITERIA.map((c) => {
            const s = pop(frame, at(id, c.phrase));
            return (
              <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 26, opacity: s, transform: `translateX(${(1 - s) * 80}px)`, width: 980, padding: "26px 32px", borderRadius: 26, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(167,139,250,0.3)", fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.text }}>
                <Check color={GREEN} size={58} />
                {c.text}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1260, top: 170, width: 440, height: 440 }}>
        <svg width="440" height="440" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${276 * ring} 276`} transform="rotate(-90 50 50)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 130, color: C.text }}>{frame >= passAt ? 0 : secs}</div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.muted }}>seconds</div>
        </div>
      </div>
      {frame >= passAt ? (
        <div style={{ position: "absolute", left: 1210, top: 650, opacity: pop(frame, passAt), fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: GREEN }}>5 apps passed</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── App reviews ─────────────────────────
type Point = { text: string; phrase: string };
type AppData = { id: string; rank: number; name: string; color: string; aspect: number; bestFor: string; shots: { n: number; phrase?: string }[]; pros: Point[]; cons: Point[] };

const APPS: AppData[] = [
  {
    id: "habitica", rank: 5, name: "Habitica", color: "#C084FC", aspect: 2.164, bestFor: "Building routines",
    shots: [{ n: 1 }, { n: 4, phrase: "It's genuinely fun" }, { n: 3, phrase: "Setting up your avatar" }],
    pros: [{ text: "Turns tasks into an RPG", phrase: "It turns your recurring" }, { text: "Fun if games motivate you", phrase: "It's genuinely fun" }, { text: "Builds routines over weeks", phrase: "strong for building" }],
    cons: [{ text: "Setup can become procrastination", phrase: "Setting up your avatar" }, { text: "Not for one stuck task", phrase: "And it's not built" }],
  },
  {
    id: "finch", rank: 4, name: "Finch", color: "#38BDF8", aspect: 2.171, bestFor: "Gentle, low-stakes days",
    shots: [{ n: 4 }, { n: 6, phrase: "which helps on days" }, { n: 2, phrase: "But Finch won't" }],
    pros: [{ text: "A pet that grows with you", phrase: "A virtual pet" }, { text: "Low stakes, gentle tone", phrase: "The stakes are deliberately" }, { text: "Helps with shame and overwhelm", phrase: "which helps on days" }],
    cons: [{ text: "Won't break down a big task", phrase: "But Finch won't" }, { text: "Made for small daily wins", phrase: "It's made for" }],
  },
  {
    id: "inflow", rank: 3, name: "Inflow", color: "#818CF8", aspect: 2.167, bestFor: "When the freeze keeps coming back",
    shots: [{ n: 2 }, { n: 4, phrase: "Short daily lessons" }, { n: 6, phrase: "Just know the lessons" }],
    pros: [{ text: "Works on the pattern underneath", phrase: "Instead of fixing" }, { text: "Short daily CBT-based lessons", phrase: "Short daily lessons" }, { text: "Community for accountability", phrase: "plus a community" }],
    cons: [{ text: "Lessons take real time", phrase: "Just know the lessons" }, { text: "Subscription only", phrase: "and it's subscription only" }],
  },
  {
    id: "goblin", rank: 2, name: "Goblin Tools", color: "#84CC16", aspect: 1.778, bestFor: "Free, instant breakdown",
    shots: [{ n: 1 }],
    pros: [{ text: "Steps in seconds", phrase: "Type in any task" }, { text: "Free on the web, no account", phrase: "The web version is free" }, { text: "Passes the 60-second test", phrase: "so it passes" }],
    cons: [{ text: "Doesn't stay with you", phrase: "It doesn't stay" }, { text: "No companion while you work", phrase: "Once the steps" }],
  },
  {
    id: "foco", rank: 1, name: "FOCO", color: ORANGE, aspect: 2.173, bestFor: "The exact moment you're frozen",
    shots: [{ n: 2 }, { n: 3, phrase: "It breaks it into" }, { n: 4, phrase: "Then focus mode" }, { n: 6, phrase: "calm background sounds" }],
    pros: [{ text: "Type, talk, or snap a photo", phrase: "Tell it the task" }, { text: "Tiny steps with time estimates", phrase: "It breaks it into" }, { text: "Focus timer + calm sounds", phrase: "Then focus mode" }, { text: "Feels like someone beside you", phrase: "so it feels like" }, { text: "Built-in calendar too", phrase: "It even has a built-in" }],
    cons: [],
  },
];

const REVEAL = 50; // frames the big rank card holds

const Tracker: React.FC<{ rank: number }> = ({ rank }) => (
  <div style={{ position: "absolute", right: 70, top: 56, display: "flex", gap: 14 }}>
    {APPS.map((a) => {
      const active = a.rank === rank;
      const done = a.rank > rank;
      return (
        <div key={a.id} style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: active ? a.color : done ? "rgba(255,255,255,0.08)" : "rgba(124,58,237,0.2)", border: active ? "none" : "2px solid rgba(167,139,250,0.25)", transform: active ? "scale(1.15)" : "none" }}>
          {done || active ? <Img src={staticFile(`apps/${a.id}-icon.png`)} style={{ width: 46, height: 46, borderRadius: 12, opacity: done ? 0.5 : 1 }} /> : <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: C.primary2 }}>{a.rank}</span>}
        </div>
      );
    })}
  </div>
);

const Phone: React.FC<{ app: AppData }> = ({ app }) => {
  const frame = useCurrentFrame();
  const w = 400;
  const h = Math.min(800, Math.round(w * app.aspect));
  const enter = pop(frame, REVEAL - 6, 13);
  const starts = app.shots.map((s) => (s.phrase ? at(app.id, s.phrase) : REVEAL));
  const float = Math.sin(frame / 25) * 10;
  return (
    <div style={{ perspective: 1600 }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: 50, overflow: "hidden", border: "10px solid #0d0a14", outline: `3px solid ${app.color}`, boxShadow: `0 50px 100px rgba(0,0,0,0.6), 0 0 90px ${app.color}55`, background: "#000", opacity: enter, transform: `translateY(${(1 - enter) * 200 + float}px) rotateY(${12 - enter * 4}deg) rotateZ(${(1 - enter) * -8}deg)` }}>
        {app.shots.map((s, i) => {
          const a = starts[i];
          const b = starts[i + 1] ?? 1e7;
          const op = interpolate(frame, [a - 8, a, b - 8, b], [i === 0 ? 1 : 0, 1, 1, 0], clamp);
          const zoom = interpolate(frame, [a, a + 300], [1, 1.08], clamp);
          return <Img key={s.n} src={staticFile(`apps/${app.id}-${s.n}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: op, transform: `scale(${zoom})`, transformOrigin: "top center" }} />;
        })}
      </div>
    </div>
  );
};

const PointRow: React.FC<{ p: Point; app: AppData; good: boolean }> = ({ p, app, good }) => {
  const frame = useCurrentFrame();
  const s = pop(frame, at(app.id, p.phrase));
  const color = good ? GREEN : ORANGE;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: s, transform: `translateX(${(1 - s) * 70}px)`, padding: "16px 26px", borderRadius: 20, background: good ? "rgba(74,222,128,0.08)" : "rgba(251,146,60,0.1)", border: `2px solid ${color}66`, fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.text }}>
      <div style={{ width: 46, height: 46, borderRadius: 999, background: color, color: "#0a0410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 28, flexShrink: 0 }}>{good ? "✓" : "✕"}</div>
      {p.text}
    </div>
  );
};

const AppScene: React.FC<{ app: AppData }> = ({ app }) => {
  const frame = useCurrentFrame();
  // Rank reveal card
  const rv = interpolate(frame, [0, 8, REVEAL - 8, REVEAL], [0, 1, 1, 0], clamp);
  const num = pop(frame, 2, 9);
  const head = pop(frame, REVEAL - 4);
  const isOne = app.rank === 1;
  return (
    <AbsoluteFill>
      {frame < REVEAL ? (
        <AbsoluteFill style={{ opacity: rv, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 70 }}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 380, color: isOne ? ORANGE : app.color, textShadow: `0 0 100px ${app.color}`, transform: `scale(${0.5 + num * 0.5}) rotate(${(1 - num) * -12}deg)` }}>#{app.rank}</div>
          <div style={{ opacity: pop(frame, 12), transform: `translateX(${(1 - pop(frame, 12)) * 80}px)` }}>
            <Img src={staticFile(`apps/${app.id}-icon.png`)} style={{ width: 180, height: 180, borderRadius: 44 }} />
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 120, color: C.text, marginTop: 16 }}>{app.name}</div>
          </div>
        </AbsoluteFill>
      ) : (
        <>
          <Tracker rank={app.rank} />
          <div style={{ position: "absolute", left: 170, top: isOne ? 70 : 80 }}>
            <Phone app={app} />
          </div>
          <div style={{ position: "absolute", left: 700, top: 150, width: 900, opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <Img src={staticFile(`apps/${app.id}-icon.png`)} style={{ width: 110, height: 110, borderRadius: 26 }} />
              <div>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: app.color, letterSpacing: 3 }}>#{app.rank} OF 5</div>
                <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 92, lineHeight: 1, color: C.text }}>{app.name}</div>
              </div>
            </div>
            <div style={{ marginTop: 26 }}>
              <Chip color={app.color} size={28}>BEST FOR: {app.bestFor.toUpperCase()}</Chip>
            </div>
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
              {app.pros.map((p) => <PointRow key={p.text} p={p} app={app} good />)}
              {app.cons.map((p) => <PointRow key={p.text} p={p} app={app} good={false} />)}
            </div>
          </div>
        </>
      )}
      {isOne ? <Confetti from={4} /> : null}
    </AbsoluteFill>
  );
};

const Confetti: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  if (frame < 0 || frame > 90) return null;
  const colors = [ORANGE, C.primary2, GREEN, "#FDE68A", "#F472B6"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 70 }).map((_, i) => {
        const r = (n: number) => ((Math.sin(i * 999 + n * 77) + 1) / 2);
        const x = 960 + (r(1) - 0.5) * 1900 * Math.min(1, frame / 18);
        const y = 540 - 500 * r(2) * Math.min(1, frame / 14) + frame * frame * 0.16;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 10, background: colors[i % 5], transform: `rotate(${frame * 12 * r(3) + i}deg)`, opacity: interpolate(frame, [60, 90], [1, 0], clamp) }} />;
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────── Outro ─────────────────────────
const PICKS = [
  { phrase: "Can't start a task", q: "Can't start right now?", apps: ["foco", "goblin"] },
  { phrase: "If the freeze keeps", q: "Freeze keeps coming back?", apps: ["inflow"] },
  { phrase: "For routines", q: "Building routines?", apps: ["finch", "habitica"] },
];
const NAMES: Record<string, string> = { foco: "FOCO", goblin: "Goblin Tools", inflow: "Inflow", finch: "Finch", habitica: "Habitica" };

const Outro: React.FC = () => {
  const id = "outro";
  const frame = useCurrentFrame();
  const cta = at(id, "Foco is on iPhone");
  const step = at(id, "Now go do");
  return (
    <AbsoluteFill>
      {frame < cta ? (
        <div style={{ position: "absolute", left: 640, top: 110, width: 1180 }}>
          <Big size={84}>Which one is <span style={{ color: C.primary2 }}>right for you?</span></Big>
          <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 22 }}>
            {PICKS.map((p) => {
              const s = pop(frame, at(id, p.phrase));
              return (
                <div key={p.q} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: s, transform: `translateX(${(1 - s) * 80}px)`, padding: "24px 30px", borderRadius: 26, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(167,139,250,0.3)" }}>
                  <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 42, color: C.text }}>{p.q}</div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {p.apps.map((a) => (
                      <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px 8px 8px", borderRadius: 999, background: a === "foco" ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.08)" }}>
                        <Img src={staticFile(`apps/${a}-icon.png`)} style={{ width: 52, height: 52, borderRadius: 14 }} />
                        <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: C.text }}>{NAMES[a]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 700, top: 170, width: 1100 }}>
          {frame < step ? (
            <div style={{ opacity: pop(frame, cta) }}>
              <Big size={96}>Get <span style={{ color: C.primary2 }}>FOCO</span></Big>
              <div style={{ marginTop: 20, fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.muted }}>iPhone + Android · link below</div>
              <div style={{ marginTop: 50, display: "inline-flex", alignItems: "center", gap: 30, background: "#fff", borderRadius: 34, padding: "24px 46px", boxShadow: "0 0 90px rgba(124,58,237,0.6)" }}>
                <Img src={staticFile("foco-logo.png")} style={{ height: 90 }} />
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: C.primary }}>tryfoco.com</div>
              </div>
            </div>
          ) : (
            <div style={{ opacity: pop(frame, step), transform: `scale(${0.8 + pop(frame, step) * 0.2})`, transformOrigin: "left center" }}>
              <Big size={130}>Now go do</Big>
              <Big size={130}><span style={{ color: ORANGE }}>step one.</span></Big>
              <div style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 24, background: "#fff", borderRadius: 30, padding: "18px 36px" }}>
                <Img src={staticFile("foco-logo.png")} style={{ height: 70 }} />
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, color: C.primary }}>tryfoco.com</div>
              </div>
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── Layout per scene ─────────────────────────
const SPOTS: Record<string, Spot> = {
  hook: { x: 1390, y: 330, h: 520 },
  problem: { x: 1530, y: 560, h: 330 },
  host: { x: 170, y: 140, h: 720 },
  criteria: { x: 1530, y: 600, h: 290 },
  app: { x: 1640, y: 640, h: 240 },
  outro: { x: 90, y: 250, h: 560 },
};
const CONTENT: Record<string, React.FC> = { hook: Hook, problem: Problem, host: Host, criteria: Criteria, outro: Outro };

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const app = APPS.find((a) => a.id === scene.id);
  const Content = CONTENT[scene.id];
  const enter = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outroEnd = scene.id === "outro" ? 1 : interpolate(frame, [Math.round((scene.duration + GAP) * FPS) - 8, Math.round((scene.duration + GAP) * FPS)], [1, 0], clamp);
  const showMascot = !(app && frame < REVEAL);
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, outroEnd), transform: `translateX(${(1 - enter) * 60}px)` }}>
      {app ? <AppScene app={app} /> : <Content />}
      {showMascot ? (
        <Sequence from={app ? REVEAL : 0} layout="none">
          <Mascot scene={scene} spot={app ? SPOTS.app : SPOTS[scene.id]} state={scene.id === "outro" && frame >= at("outro", "Now go do") ? 5 : undefined} />
        </Sequence>
      ) : null}
      <Captions scene={scene} />
    </AbsoluteFill>
  );
};

export const Explainer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      <Audio src={staticFile("music-explainer.wav")} volume={0.13} />
      {SCENES.map((s) => {
        const from = Math.round(STARTS[s.id] * FPS);
        const app = APPS.find((a) => a.id === s.id);
        return (
          <React.Fragment key={s.id}>
            <Sequence from={from} durationInFrames={Math.round((s.duration + GAP) * FPS) + (s.id === "outro" ? END_HOLD : 0)}>
              <SceneView scene={s} />
            </Sequence>
            <Sequence from={from} durationInFrames={Math.round(s.duration * FPS) + 5}>
              <Audio src={staticFile(`vo/${s.id}.wav`)} />
            </Sequence>
            {app ? (
              <Sequence from={from} durationInFrames={30}>
                <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
              </Sequence>
            ) : null}
            {s.id === "foco" ? (
              <Sequence from={from + 6} durationInFrames={60}>
                <Audio src={staticFile("sfx/ding.wav")} volume={0.35} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
