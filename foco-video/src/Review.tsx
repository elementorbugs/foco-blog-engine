// Edit of the user's "5 apps for ADHD task paralysis" talking-head review (public/source.mp4).
// All timings below are in SOURCE seconds (from work/transcript.txt + burned-in captions).
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import { Audio } from "@remotion/media";
import { BODY, Background, C, Check, HEAD } from "./Composition";

export const FPS = 30;

// The FOCO "falls short" sentence is said twice in the source; drop the second take (+ the "um")
const CUT_A = 119.62;
const CUT_B = 129.97;
const SRC_END = 289.41;
const GAP = CUT_B - CUT_A;
const END_CARD = 180;

// source seconds -> output frame
const f = (t: number) => Math.round((t < CUT_B ? Math.min(t, CUT_A) : t - GAP) * FPS);
// output frame -> source seconds
const src = (frame: number) => (frame < f(CUT_A) ? frame / FPS : frame / FPS + GAP);

export const REVIEW_TOTAL = f(SRC_END) + END_CARD;

type Shot = { n: number; t: number };
type Point = { text: string; t: number };
type App = {
  rank: number;
  id: string;
  name: string;
  color: string;
  start: number;
  end: number;
  bestFor: string;
  shots: Shot[];
  winsAt: number;
  wins: Point[];
  shortAt: number;
  short: Point[];
};

const GREEN = "#4ADE80";
const ORANGE = "#FB923C";

const APPS: App[] = [
  {
    rank: 1, id: "foco", name: "FOCO", color: "#A78BFA", start: 70.9, end: CUT_A,
    bestFor: "The exact moment you're frozen",
    shots: [{ n: 3, t: 70.9 }, { n: 2, t: 92.6 }, { n: 4, t: 99.7 }],
    winsAt: 92.6, wins: [{ text: "Zero planning: type the stuck task, get a tiny first step", t: 94.5 }, { text: "AI companion stays with you through step one", t: 99.7 }],
    shortAt: 110.7, short: [{ text: "Not a calendar or project manager", t: 111.9 }, { text: "For scheduling, pair it with a planning app", t: 114.9 }],
  },
  {
    rank: 2, id: "goblin", name: "Goblin Tools", color: "#84CC16", start: CUT_B, end: 168.1,
    bestFor: "Free, instant task breakdown",
    shots: [{ n: 1, t: CUT_B }],
    winsAt: 147.4, wins: [{ text: "Completely free, no account needed", t: 147.6 }, { text: "Type a task, get steps back in seconds", t: 151.7 }],
    shortAt: 156.6, short: [{ text: "The breakdown disappears when you close it", t: 157.2 }, { text: "No presence or companion feature", t: 162.9 }],
  },
  {
    rank: 3, id: "inflow", name: "Inflow", color: "#818CF8", start: 168.1, end: 209.0,
    bestFor: "The pattern underneath the freeze",
    shots: [{ n: 2, t: 168.1 }, { n: 4, t: 186.6 }, { n: 6, t: 197.6 }],
    winsAt: 186.6, wins: [{ text: "Tackles why the freeze keeps happening", t: 187.0 }, { text: "Community adds accountability", t: 192.9 }],
    shortAt: 197.6, short: [{ text: "Daily lessons take real time", t: 198.9 }, { text: "Subscription only", t: 204.5 }],
  },
  {
    rank: 4, id: "finch", name: "Finch", color: "#38BDF8", start: 209.0, end: 250.3,
    bestFor: "Low-stakes, gentle starts",
    shots: [{ n: 6, t: 209.0 }, { n: 4, t: 227.6 }, { n: 2, t: 238.4 }],
    winsAt: 227.6, wins: [{ text: "Low pressure, gentle tone", t: 229.5 }, { text: "Helps when the freeze is tied to shame", t: 232.5 }],
    shortAt: 238.4, short: [{ text: "Not built for breaking down one big task", t: 240.0 }, { text: "Better for small daily check-ins", t: 244.4 }],
  },
  {
    rank: 5, id: "habitica", name: "Habitica", color: "#C084FC", start: 250.3, end: SRC_END,
    bestFor: "Routines with game rewards",
    shots: [{ n: 1, t: 250.3 }, { n: 4, t: 262.5 }, { n: 5, t: 276.5 }],
    winsAt: 268.3, wins: [{ text: "Genuinely fun if you respond to games", t: 269.6 }, { text: "Strong for building routines over time", t: 273.0 }],
    shortAt: 276.5, short: [{ text: "Setup itself can become procrastination", t: 279.0 }, { text: "Not built for one stuck task", t: 285.0 }],
  },
];

// Screenshot aspect (h / w) per app
const ASPECT: Record<string, number> = { foco: 2.173, goblin: 1.778, inflow: 2.167, finch: 2.171, habitica: 2.164 };

const TITLE = { from: 0, to: 4.6 };
const DEF = { from: 17.6, to: 32.2 };
const CRIT = { from: 32.3, to: 70.9 };
const CRITERIA: Point[] = [
  { text: "What happens in the first 60 seconds?", t: 38.7 },
  { text: "Does it plan, or get you moving?", t: 43.2 },
  { text: "Taps until you do something physical", t: 46.8 },
  { text: "Works cold, with zero setup?", t: 50.6 },
  { text: "Free to try the core feature?", t: 54.3 },
];

// Split-screen layout: video on the right, graphics on the left
const SPLIT = { x: 760, y: 150, w: 1100, h: 619 };
const FLASH = 1.6; // seconds the rank card covers the screen

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0..1 visibility of a window [from, to] in source seconds, with eased edges
const useWindow = (from: number, to: number, edge = 14) => {
  const frame = useCurrentFrame();
  const a = f(from), b = f(to);
  return Math.min(interpolate(frame, [a, a + edge], [0, 1], clamp), interpolate(frame, [b - edge, b], [1, 0], clamp));
};

// spring that starts at a source time
const useAt = (t: number, damping = 14) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - f(t), fps: FPS, config: { damping } });
};

const Presenter: React.FC = () => {
  const frame = useCurrentFrame();
  const t = src(frame);
  // Contiguous panels merged so the layout never pops back to full screen between them
  const panels = [TITLE, { from: DEF.from, to: SRC_END }];
  const s = Math.max(
    ...panels.map((p) => {
      const a = f(p.from), b = f(p.to);
      const e = Easing.inOut(Easing.cubic);
      return Math.min(interpolate(frame, [a, a + 18], [0, 1], { ...clamp, easing: e }), interpolate(frame, [b - 18, b], [1, 0], { ...clamp, easing: e }));
    }),
  );
  const x = interpolate(s, [0, 1], [0, SPLIT.x]);
  const y = interpolate(s, [0, 1], [0, SPLIT.y]);
  const w = interpolate(s, [0, 1], [1920, SPLIT.w]);
  const h = interpolate(s, [0, 1], [1080, SPLIT.h]);
  // Punch-in on the full-screen stretch to keep it moving
  const punch = interpolate(t, [8.9, 9.3, 16.4, 16.8], [1, 1.12, 1.12, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: s * 28, overflow: "hidden", border: s > 0.01 ? `3px solid rgba(167,139,250,${0.5 * s})` : "none", boxShadow: `0 30px 90px rgba(0,0,0,${0.6 * s})` }}>
      <div style={{ width: "100%", height: "100%", transform: `scale(${punch})`, transformOrigin: "50% 35%" }}>
        <Sequence durationInFrames={f(CUT_A)}>
          <OffthreadVideo src={staticFile("source.mp4")} trimAfter={Math.round(CUT_A * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        <Sequence from={f(CUT_A)} durationInFrames={f(SRC_END) - f(CUT_A)}>
          <OffthreadVideo src={staticFile("source.mp4")} trimBefore={Math.round(CUT_B * FPS)} trimAfter={Math.round(SRC_END * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
    </div>
  );
};

const Chip: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ display: "inline-block", fontFamily: BODY, fontWeight: 800, fontSize: 24, letterSpacing: 3, color, padding: "10px 22px", borderRadius: 999, background: `${color}22`, border: `2px solid ${color}88` }}>
    {children}
  </div>
);

const TitlePanel: React.FC = () => {
  const v = useWindow(TITLE.from, TITLE.to);
  const a = useAt(0.2);
  const b = useAt(0.6);
  return (
    <div style={{ position: "absolute", left: 70, top: 250, width: 640, opacity: v, color: C.text }}>
      <div style={{ opacity: a }}>
        <Chip color={ORANGE}>RANKED FOR ADHD</Chip>
      </div>
      <div style={{ marginTop: 30, fontFamily: HEAD, fontWeight: 800, fontSize: 80, lineHeight: 1.04, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>
        5 Best Apps for
        <br />
        <span style={{ color: C.primary2 }}>Task Paralysis</span>
      </div>
      <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, opacity: b }}>Judged on one thing: do they get you started?</div>
    </div>
  );
};

const DefPanel: React.FC = () => {
  const v = useWindow(DEF.from, DEF.to);
  const a = useAt(DEF.from + 0.2);
  const b = useAt(19.0);
  const c = useAt(25.2);
  return (
    <div style={{ position: "absolute", left: 70, top: 170, width: 640, opacity: v, color: C.text }}>
      <div style={{ opacity: a }}>
        <Chip color={C.primary2}>THE REAL PROBLEM</Chip>
      </div>
      <div style={{ marginTop: 26, fontFamily: HEAD, fontWeight: 800, fontSize: 84, lineHeight: 1.05, opacity: a }}>
        Knowing
        <span style={{ color: ORANGE }}> ≠ </span>
        <br />
        Starting
      </div>
      <div style={{ marginTop: 34, padding: "28px 32px", borderRadius: 26, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(167,139,250,0.35)", fontFamily: BODY, fontWeight: 700, fontSize: 32, lineHeight: 1.35, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        <span style={{ color: C.primary2 }}>Task initiation deficit:</span> the gap between knowing what to do and actually starting it.
      </div>
      <div style={{ marginTop: 24, padding: "28px 32px", borderRadius: 26, background: "rgba(74,222,128,0.1)", border: `2px solid ${GREEN}88`, fontFamily: BODY, fontWeight: 700, fontSize: 32, lineHeight: 1.35, opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
        Apps that help <span style={{ color: GREEN }}>shrink the task</span> until starting takes no decision.
      </div>
    </div>
  );
};

const CritPanel: React.FC = () => {
  const v = useWindow(CRIT.from, CRIT.to);
  const a = useAt(CRIT.from + 0.2);
  const n = useAt(62.4);
  return (
    <div style={{ position: "absolute", left: 70, top: 120, width: 640, opacity: v, color: C.text }}>
      <div style={{ opacity: a }}>
        <Chip color={C.primary2}>HOW WE RANKED THEM</Chip>
      </div>
      <div style={{ marginTop: 20, fontFamily: HEAD, fontWeight: 800, fontSize: 56, lineHeight: 1.1, opacity: a }}>
        The first <span style={{ color: ORANGE }}>60 seconds</span>, while frozen
      </div>
      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 16 }}>
        {CRITERIA.map((c) => (
          <Criterion key={c.text} p={c} />
        ))}
      </div>
      <div style={{ marginTop: 22, opacity: n, fontFamily: BODY, fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.55)" }}>
        Not scored: <span style={{ textDecoration: "line-through" }}>calendar sync</span> · <span style={{ textDecoration: "line-through" }}>team features</span>
      </div>
    </div>
  );
};

const Criterion: React.FC<{ p: Point }> = ({ p }) => {
  const s = useAt(p.t);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: s, transform: `translateX(${(1 - s) * 60}px)`, padding: "18px 22px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(167,139,250,0.25)", fontFamily: BODY, fontWeight: 700, fontSize: 30, lineHeight: 1.2 }}>
      <Check color={GREEN} size={44} />
      {p.text}
    </div>
  );
};

// Ranking list beside the phone; unrevealed apps stay hidden
const Tracker: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, letterSpacing: 3, color: C.muted, marginBottom: 4 }}>THE RANKING</div>
    {APPS.map((a) => {
      const active = a.rank === current;
      const shown = a.rank <= current;
      return (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 16, background: active ? `${a.color}33` : "rgba(255,255,255,0.04)", border: `2px solid ${active ? a.color : "rgba(167,139,250,0.15)"}`, opacity: shown ? 1 : 0.45 }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: active ? a.color : "rgba(255,255,255,0.1)", color: active ? "#0a0410" : C.text, fontFamily: HEAD, fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.rank}</div>
          {shown ? <Img src={staticFile(`apps/${a.id}-icon.png`)} style={{ width: 36, height: 36, borderRadius: 9 }} /> : null}
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 25, color: shown ? C.text : C.muted }}>{shown ? a.name : "???"}</div>
        </div>
      );
    })}
  </div>
);

const Phone: React.FC<{ app: App }> = ({ app }) => {
  const frame = useCurrentFrame();
  const enter = useAt(app.start + FLASH - 0.3, 13);
  const w = 300;
  const h = Math.round(w * ASPECT[app.id]);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: 34, overflow: "hidden", flexShrink: 0, border: `4px solid ${app.color}`, boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 50px ${app.color}44`, background: "#000", opacity: enter, transform: `translateY(${(1 - enter) * 80}px) rotate(${(1 - enter) * -5}deg)` }}>
      {app.shots.map((s, i) => {
        const a = f(s.t), b = i + 1 < app.shots.length ? f(app.shots[i + 1].t) : 10_000_000;
        const op = interpolate(frame, [a - 8, a, b - 8, b], [i === 0 ? 1 : 0, 1, 1, 0], clamp);
        const zoom = interpolate(frame, [a, a + 240], [1, 1.07], clamp);
        return <Img key={s.n} src={staticFile(`apps/${app.id}-${s.n}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: op, transform: `scale(${zoom})`, transformOrigin: "top center" }} />;
      })}
    </div>
  );
};

// Card under the video: "Best for" -> "Where it wins" -> "Where it falls short"
const Verdict: React.FC<{ app: App }> = ({ app }) => {
  const frame = useCurrentFrame();
  const t = src(frame);
  const mode = t >= app.shortAt ? "short" : t >= app.winsAt ? "wins" : "best";
  const since = f(mode === "short" ? app.shortAt : mode === "wins" ? app.winsAt : app.start + FLASH);
  const enter = spring({ frame: frame - since, fps: FPS, config: { damping: 15 } });
  const color = mode === "short" ? ORANGE : mode === "wins" ? GREEN : app.color;
  const label = mode === "short" ? "✕  WHERE IT FALLS SHORT" : mode === "wins" ? "✓  WHERE IT WINS" : "BEST FOR";
  const points = mode === "short" ? app.short : app.wins;
  return (
    <div style={{ position: "absolute", left: SPLIT.x, top: SPLIT.y + SPLIT.h + 26, width: SPLIT.w, height: 250, padding: "24px 34px", borderRadius: 28, background: `${color}14`, border: `3px solid ${color}`, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)`, color: C.text }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 3, color }}>{label}</div>
      {mode === "best" ? (
        <div style={{ marginTop: 18, fontFamily: HEAD, fontWeight: 800, fontSize: 60, lineHeight: 1.1 }}>{app.bestFor}</div>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {points.map((p) => {
            const s = spring({ frame: frame - f(p.t), fps: FPS, config: { damping: 14 } });
            return (
              <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 18, opacity: s, transform: `translateX(${(1 - s) * 40}px)`, fontFamily: BODY, fontWeight: 700, fontSize: 38, lineHeight: 1.15 }}>
                <div style={{ width: 16, height: 16, borderRadius: 999, background: color, flexShrink: 0 }} />
                {p.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AppPanel: React.FC<{ app: App }> = ({ app }) => {
  const v = useWindow(app.start, app.end);
  const head = useAt(app.start + FLASH - 0.4);
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <div style={{ position: "absolute", left: SPLIT.x, top: 62, fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: C.muted }}>
        5 BEST APPS FOR ADHD TASK PARALYSIS
      </div>
      <div style={{ position: "absolute", left: 60, top: 56, display: "flex", alignItems: "center", gap: 26, opacity: head, transform: `translateX(${(1 - head) * -60}px)` }}>
        <Img src={staticFile(`apps/${app.id}-icon.png`)} style={{ width: 120, height: 120, borderRadius: 28, boxShadow: `0 0 40px ${app.color}66` }} />
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: app.color }}>#{app.rank}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: app.name.length > 8 ? 62 : 76, lineHeight: 1, color: C.text }}>{app.name}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, top: 220, display: "flex", gap: 30 }}>
        <Phone app={app} />
        <Tracker current={app.rank} />
      </div>
      <Verdict app={app} />
    </AbsoluteFill>
  );
};

// Full-screen rank card while the presenter says "Number X, <app>"
const RankFlash: React.FC<{ app: App }> = ({ app }) => {
  const frame = useCurrentFrame();
  // Lead in slightly so the card fully covers the jump cut before #2
  const a = f(app.start) - 8;
  const b = f(app.start) + Math.round(FLASH * FPS);
  const x = interpolate(frame, [a, a + 10, b - 10, b], [1920, 0, 0, -1920], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (frame < a || frame > b) return null;
  const pop = spring({ frame: frame - a - 6, fps: FPS, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>
      <Background glow={`${app.color}66`} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 70 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 340, lineHeight: 1, color: app.rank === 1 ? ORANGE : app.color, textShadow: `0 0 80px ${app.color}88`, transform: `scale(${0.6 + pop * 0.4})` }}>#{app.rank}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
          <Img src={staticFile(`apps/${app.id}-icon.png`)} style={{ width: 170, height: 170, borderRadius: 40, transform: `scale(${pop})` }} />
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 120, lineHeight: 1, color: C.text }}>{app.name}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [f(SRC_END) - 10, f(SRC_END) + 8], [0, 1], clamp);
  const m = spring({ frame: frame - f(SRC_END), fps: FPS, config: { damping: 10 } });
  const a = spring({ frame: frame - f(SRC_END) - 12, fps: FPS, config: { damping: 14 } });
  const b = spring({ frame: frame - f(SRC_END) - 28, fps: FPS, config: { damping: 14 } });
  if (v <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <Background />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, color: C.text }}>
        <Img src={staticFile("mascots/foco_state_2_alignment.png")} style={{ width: 520, transform: `scale(${0.6 + m * 0.4}) translateY(${Math.sin(frame / 10) * 10}px)` }} />
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 110, lineHeight: 1.05, opacity: a }}>
            Frozen on
            <br />
            <span style={{ color: C.primary2 }}>step one?</span>
          </div>
          <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.muted, opacity: b }}>Try FOCO on iPhone + Android</div>
          <div style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 28, background: "#fff", borderRadius: 32, padding: "22px 44px", opacity: b, boxShadow: "0 0 80px rgba(124,58,237,0.6)" }}>
            <Img src={staticFile("foco-logo.png")} style={{ height: 80 }} />
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.primary }}>tryfoco.com</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AppReview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      <TitlePanel />
      <DefPanel />
      <CritPanel />
      {APPS.map((a) => (
        <AppPanel key={a.id} app={a} />
      ))}
      <Presenter />
      {APPS.map((a) => (
        <RankFlash key={a.id} app={a} />
      ))}
      {APPS.map((a) => (
        <Sequence key={a.id} from={f(a.start)} durationInFrames={30}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
        </Sequence>
      ))}
      <EndCard />
    </AbsoluteFill>
  );
};
