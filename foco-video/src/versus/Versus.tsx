// Generic "App A vs App B" YouTube engine (16:9). Decision-first: the answer in 10s, a 5-round duel with a live
// scoreboard, a score scene, a bonus round on the freeze where FOCO comes in, then a 3-card verdict.
// Each video is a config (see TiimoVsStructured.tsx, GoblinVsTiimo.tsx): app sides, rounds, on-screen notes and the
// voice lines (tts/versus-vo.mjs --dir=<video>). VO keys: h1-h4, r<n>a + one line per side + verdict, sc, b1-b2, f1-f3, o1-o2.
// No prices or plan names in any config. Shared kit: ../unstuck/UnstuckRank.
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { BODY, BODY_STACK, C, HEAD } from "../Composition";
import { BigNum, Cut, Hypno, ShotCard, Sfx, WordCaption, jit, pop, popStyle, ramp } from "../unstuck/UnstuckRank";

export const VS_FPS = 30;
const FPS = VS_FPS;
const GAP = 0.35;
const s2f = (s: number) => Math.round(s * FPS);

export type Side = "L" | "R";
export type VsApp = { id: string; name: string; color: string; x?: number };
// a round card: a store screenshot, any public image, the Energy Monitor illustration, or "?" (not offered)
export type VsShot = { src: string; ratio: number } | "energy" | null;
export type VsRound = { title: string; L: VsShot; R: VsShot; lNote: string; rNote: string; order: Side[]; win: Side | "tie" };
export type VsConfig = {
  voDir: string; // public/<voDir>/<key>.wav
  lines: Record<string, string>;
  dur: Record<string, number>;
  L: VsApp;
  R: VsApp;
  hookChips: [Side, string][]; // lit side + chip text for h2, h3
  rounds: VsRound[];
  scoreLine: [string, string]; // big text in the score scene (white, orange)
  freeze: [string, string]; // bonus round: one label per side (L, R)
  freezeAt?: [number, number]; // when each label pops, as a fraction of the b2 line (default both at 0.55)
  outro: [string, string, string][]; // [app id, name, line] x3, last one is FOCO
};
export const store = (id: string, n: number, ratio: number): VsShot => ({ src: `apps/${id}-${n}.png`, ratio });

type Kind = "hook" | "title" | "side" | "verdict" | "score" | "neither" | "foco" | "outro";
type BeatDef = { vo: string; kind: Kind; round?: number; side?: Side; win?: Side | "tie"; pre?: number; post?: number };
type Beat = BeatDef & { at: number; audio: number; len: number };
type Group = { key: string; from: number; len: number; b: Beat[] };

export const makeVersus = (cfg: VsConfig) => {
  const { lines: LINES, dur: DUR } = cfg;
  const APP: Record<Side, Required<VsApp>> = { L: { x: 520, ...cfg.L }, R: { x: 1400, ...cfg.R } };

  // ---------- TIMELINE ----------
  const round = (n: number, r: VsRound): BeatDef[] => {
    const k = `r${n + 1}`;
    const letters = ["b", "c", "d"];
    return [
      { vo: `${k}a`, kind: "title", round: n, pre: 0.2, post: 0.2 },
      ...r.order.map((side, i) => ({ vo: k + letters[i], kind: "side" as const, round: n, side })),
      { vo: k + letters[r.order.length], kind: "verdict", round: n, win: r.win, post: 0.5 },
    ];
  };
  const DEFS: BeatDef[] = [
    { vo: "h1", kind: "hook", pre: 0.3 }, { vo: "h2", kind: "hook" }, { vo: "h3", kind: "hook" }, { vo: "h4", kind: "hook", post: 0.3 },
    ...cfg.rounds.flatMap((r, n) => round(n, r)),
    { vo: "sc", kind: "score", post: 0.4 },
    { vo: "b1", kind: "neither", pre: 0.3 }, { vo: "b2", kind: "neither", post: 0.3 },
    { vo: "f1", kind: "foco" }, { vo: "f2", kind: "foco" }, { vo: "f3", kind: "foco", post: 0.3 },
    { vo: "o1", kind: "outro" }, { vo: "o2", kind: "outro", post: 1.6 },
  ];
  const BEATS: Beat[] = [];
  DEFS.reduce((at, d) => {
    const len = s2f((d.pre ?? 0) + DUR[d.vo] + GAP + (d.post ?? 0));
    BEATS.push({ ...d, at, audio: at + s2f(d.pre ?? 0), len });
    return at + len;
  }, 0);
  const total = BEATS[BEATS.length - 1].at + BEATS[BEATS.length - 1].len;

  // consecutive beats of one scene play as a group (hook, each round, score, bonus, foco, outro); beats keep global frames
  const groupKey = (b: Beat) => (b.round !== undefined ? `round${b.round}` : b.kind);
  const GROUPS: Group[] = [];
  BEATS.forEach((b) => {
    const last = GROUPS[GROUPS.length - 1];
    if (!last || last.key !== groupKey(b)) GROUPS.push({ key: groupKey(b), from: b.at, len: 0, b: [] });
    const g = GROUPS[GROUPS.length - 1];
    g.b.push(b);
    g.len += b.len;
  });
  const local = (g: Group) => g.b.map((b) => ({ ...b, at: b.at - g.from, audio: b.audio - g.from }));
  const cur = (b: Beat[], f: number) => {
    let i = 0;
    while (i + 1 < b.length && f >= b[i + 1].at) i++;
    return i;
  };

  // score lands near the end of each verdict line ("...Round to Structured.")
  const SCORE_HITS = BEATS.filter((b) => b.kind === "verdict").map((b) => ({ at: b.audio + s2f(DUR[b.vo] * 0.72), win: b.win! }));
  const scoreAt = (f: number) => {
    const done = SCORE_HITS.filter((h) => f >= h.at);
    return { L: done.filter((h) => h.win === "L").length, R: done.filter((h) => h.win === "R").length, tie: done.filter((h) => h.win === "tie").length };
  };

  const icon = (id: string) => staticFile(`apps/${id}-icon.png`);

  const Voice: React.FC<{ b: Beat[] }> = ({ b }) => (
    <>
      {b.map((x) => (
        <Sequence key={x.vo} from={x.audio} durationInFrames={x.len - (x.audio - x.at)}>
          <Audio src={staticFile(`${cfg.voDir}/${x.vo}.wav`)} />
          <WordCaption text={LINES[x.vo]} dur={DUR[x.vo]} top={960} />
        </Sequence>
      ))}
    </>
  );

  const Head: React.FC<{ side: Side; f: number; at?: number; size?: number }> = ({ side, f, at = 0, size = 72 }) => {
    const a = APP[side];
    return (
      <div style={{ position: "absolute", left: a.x - 300, width: 600, top: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, transform: `scale(${pop(f, at)})` }}>
        <Img src={icon(a.id)} style={{ width: size, height: size, borderRadius: size * 0.24, boxShadow: `0 0 40px ${a.color}66` }} />
        <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size * 0.7, color: "#fff" }}>{a.name}</span>
      </div>
    );
  };

  // ---------- SCOREBOARD ----------
  const Scoreboard: React.FC<{ f: number; big?: number }> = ({ f, big = 0 }) => {
    const sc = scoreAt(f);
    const lastHit = [...SCORE_HITS].reverse().find((h) => f >= h.at);
    const bump = lastHit ? 1 + 0.35 * Math.max(0, 1 - (f - lastHit.at) / 12) : 1;
    const k = 1 + big * 1.6;
    const Num: React.FC<{ n: number; side: Side }> = ({ n, side }) => (
      <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: APP[side].color, display: "inline-block", minWidth: 40, textAlign: "center", transform: `scale(${lastHit && lastHit.win === side ? bump : 1})` }}>{n}</span>
    );
    return (
      <div style={{ position: "absolute", left: 960, top: 40 + big * 300, transform: `translateX(-50%) scale(${k})`, transformOrigin: "top center", display: "flex", alignItems: "center", gap: 16, padding: "10px 26px", borderRadius: 999, background: "rgba(10,4,16,0.85)", border: "2px solid rgba(167,139,250,0.35)" }}>
        <Img src={icon(APP.L.id)} style={{ width: 46, height: 46, borderRadius: 12 }} />
        <Num n={sc.L} side="L" />
        <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 34, color: "rgba(214,208,228,0.6)" }}>:</span>
        <Num n={sc.R} side="R" />
        <Img src={icon(APP.R.id)} style={{ width: 46, height: 46, borderRadius: 12 }} />
        {sc.tie > 0 && <span style={{ marginLeft: 6, fontFamily: BODY, fontWeight: 800, fontSize: 22, color: C.muted, transform: `scale(${lastHit?.win === "tie" ? bump : 1})` }}>+{sc.tie} TIE</span>}
      </div>
    );
  };

  // ---------- HOOK ----------
  const HookScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    const i = cur(b, f);
    const slam = (side: Side) => ramp(f, b[0].audio - 4 + (side === "L" ? 0 : 5), b[0].audio + 8 + (side === "L" ? 0 : 5), 1, 0, Easing.out(Easing.back(1.4)));
    const lit = (side: Side) => (i === 1 || i === 2 ? cfg.hookChips[i - 1][0] === side : true);
    const chip = (side: Side, text: string, at: number) => (
      <div style={{ position: "absolute", left: APP[side].x - 330, width: 660, top: 640, display: "flex", justifyContent: "center", ...popStyle(f, at, side === "L" ? -6 : 6) }}>
        <div style={{ padding: "18px 34px", borderRadius: 999, background: "rgba(10,4,16,0.9)", border: `3px solid ${APP[side].color}`, fontFamily: BODY, fontWeight: 800, fontSize: 38, color: "#fff", textAlign: "center" }}>{text}</div>
      </div>
    );
    return (
      <AbsoluteFill>
        {i < 3 && (["L", "R"] as Side[]).map((side) => (
          <div key={side} style={{ position: "absolute", left: APP[side].x - 150, top: 230, width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, transform: `translateX(${slam(side) * (side === "L" ? -900 : 900)}px) scale(${lit(side) ? 1.06 : 0.92})`, opacity: lit(side) ? 1 : 0.3, filter: lit(side) ? "none" : "grayscale(1)" }}>
            <Img src={icon(APP[side].id)} style={{ width: 260, height: 260, borderRadius: 60, boxShadow: `0 0 ${70 + 20 * Math.sin(f / 7)}px ${APP[side].color}88` }} />
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 60, color: "#fff", whiteSpace: "nowrap" }}>{APP[side].name}</div>
          </div>
        ))}
        {i < 3 && (
          <div style={{ position: "absolute", left: 960, top: 330, transform: `translate(-50%, 0) scale(${pop(f, b[0].audio + 14, 8)}) rotate(-8deg)`, fontFamily: HEAD, fontWeight: 800, fontSize: 130, fontStyle: "italic", color: C.celebrate, textShadow: "0 0 40px rgba(251,146,60,0.7)" }}>VS</div>
        )}
        {(i === 1 || i === 2) && chip(cfg.hookChips[i - 1][0], cfg.hookChips[i - 1][1], b[i].audio + 4)}
        {i === 3 && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 160, gap: 40, flexDirection: "row" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop(f, b[3].at)})` }}>
              <BigNum n={cfg.rounds.length} size={300} color={C.primary2} />
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 56, color: "#fff" }}>rounds</div>
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 100, color: C.muted, opacity: pop(f, b[3].audio + 40) }}>+</div>
            <div style={{ ...popStyle(f, b[3].audio + 48, 8), width: 300, height: 380, borderRadius: 36, border: `4px dashed ${C.celebrate}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 180, color: C.celebrate, transform: `rotate(${Math.sin(f / 8) * 6}deg)` }}>?</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#fff", textAlign: "center" }}>bonus<br />round</div>
            </div>
          </AbsoluteFill>
        )}
        <Sfx at={b[0].audio - 4} name="boom" vol={0.5} />
        <Sfx at={b[0].audio + 14} name="stamp" vol={0.5} />
        <Sfx at={b[1].audio + 4} name="tick" vol={0.4} />
        <Sfx at={b[2].audio + 4} name="tick" vol={0.4} />
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  // ---------- A ROUND ----------
  const EnergyCard: React.FC<{ f: number; at: number; h: number }> = ({ f, at, h }) => {
    const tasks: [string, number][] = [["Deep work", 0.9], ["Team meeting", 0.7], ["Errands", 0.5], ["Gym", 0.6]];
    const fill = ramp(f, at + 10, at + 70);
    return (
      <div style={{ width: h * 0.55, height: h, borderRadius: 40, background: "rgba(17,13,32,0.94)", border: "2px solid rgba(251,113,133,0.5)", padding: "30px 30px 70px", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 50px 120px rgba(0,0,0,0.6)" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: "#fff" }}>How draining is each task?</div>
        {tasks.map(([t, v], k) => (
          <div key={t}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 22, color: C.muted }}>{t}</div>
            <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(1, fill * 1.4 - k * 0.12) * v * 100}%`, background: "#FB7185", borderRadius: 9 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 18px", borderRadius: 16, background: "rgba(239,68,68,0.18)", border: "2px solid #ef4444", fontFamily: BODY_STACK, fontWeight: 800, fontSize: 26, color: "#fff", opacity: ramp(f, at + 70, at + 80), transform: `scale(${pop(f, at + 70)})` }}>⚠️ This day is too much</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 18, color: "rgba(214,208,228,0.5)" }}>Illustration of the idea, not the app's screen</div>
      </div>
    );
  };

  const RoundScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    const i = cur(b, f);
    const n = b[0].round!;
    const R = cfg.rounds[n];
    const verdict = b[b.length - 1];
    const hit = verdict.audio + s2f(DUR[verdict.vo] * 0.72);
    const showCards = f >= b[1].at - 6;
    const active = b[i].kind === "side" ? b[i].side : undefined;
    const won = f >= hit ? verdict.win : undefined;
    const lit = (side: Side) => (won ? won === "tie" || won === side : !active || active === side);
    const H = 600;
    const card = (side: Side) => {
      const a = APP[side];
      const shot = R[side];
      const enter = pop(f, b[1].at - 6 + (side === "R" ? 4 : 0), 13);
      const on = lit(side);
      return (
        <div key={side} style={{ position: "absolute", left: a.x - 300, width: 600, top: 230, height: H, display: "flex", justifyContent: "center", perspective: 1600, transform: `translateX(${(1 - enter) * (side === "L" ? -700 : 700)}px)`, opacity: on ? 1 : 0.3, filter: on ? "none" : "grayscale(0.9)" }}>
          <div style={{ transform: `rotateY(${(side === "L" ? 10 : -10) + Math.sin(f / 30) * 4}deg) scale(${active === side ? 1.05 : 1})` }}>
            {shot === "energy" ? <EnergyCard f={f} at={b[1].audio} h={H} />
              : shot === null ? (
                <div style={{ width: H * 0.46, height: H, borderRadius: 40, border: "3px dashed rgba(196,181,253,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 160, color: "rgba(196,181,253,0.4)" }}>?</div>
              ) : <ShotCard src={staticFile(shot.src)} ratio={shot.ratio} h={shot.ratio > 0.9 ? H * 0.62 : H} shot={[0, 0.5, 0.5, 1]} style={shot.ratio > 0.9 ? { marginTop: H * 0.19 } : undefined} />}
          </div>
          <div style={{ position: "absolute", bottom: -24, padding: "12px 26px", borderRadius: 999, background: "rgba(10,4,16,0.92)", border: `2px solid ${a.color}`, fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#fff", whiteSpace: "nowrap", ...popStyle(f, b[1].at + 12 + (side === "R" ? 6 : 0), 0, 0) }}>{side === "L" ? R.lNote : R.rNote}</div>
          {won && (won === side) && (
            <div style={{ position: "absolute", top: 220, padding: "14px 30px", borderRadius: 14, border: `5px solid ${C.celebrate}`, color: C.celebrate, background: "rgba(10,4,16,0.75)", fontFamily: HEAD, fontWeight: 800, fontSize: 46, transform: `scale(${2.2 - pop(f, hit, 8) * 1.2}) rotate(-8deg)`, opacity: Math.min(1, pop(f, hit, 8) * 2) }}>ROUND WON</div>
          )}
        </div>
      );
    };
    const title = pop(f, b[0].audio - 4, 11);
    return (
      <AbsoluteFill style={{ transform: f >= hit && f < hit + 8 ? `translate(${jit(f, n) * 10}px, ${jit(f, n + 3) * 10}px)` : "none" }}>
        {!showCards && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140, gap: 16 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 12, color: C.celebrate, opacity: title }}>ROUND {n + 1}</div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 120, color: "#fff", textAlign: "center", transform: `scale(${0.4 + title * 0.6})`, filter: `blur(${(1 - title) * 8}px)` }}>{R.title}</div>
          </AbsoluteFill>
        )}
        {showCards && (
          <>
            <Head side="L" f={f} at={b[1].at - 6} size={64} />
            <Head side="R" f={f} at={b[1].at - 2} size={64} />
            <div style={{ position: "absolute", left: 960, top: 480, width: 300, transform: "translateX(-50%)", fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: "rgba(214,208,228,0.55)", textAlign: "center" }}>ROUND {n + 1}<br /><span style={{ fontFamily: HEAD, fontSize: 34, color: "#fff", letterSpacing: 0 }}>{R.title}</span></div>
            {card("L")}
            {card("R")}
            {won === "tie" && (
              <div style={{ position: "absolute", left: 960, top: 560, transform: `translateX(-50%) scale(${2.2 - pop(f, hit, 8) * 1.2}) rotate(-6deg)`, padding: "16px 40px", borderRadius: 16, border: `5px solid ${C.primary2}`, color: "#fff", background: "rgba(10,4,16,0.85)", fontFamily: HEAD, fontWeight: 800, fontSize: 64 }}>TIE</div>
            )}
          </>
        )}
        <Sfx at={b[0].audio - 6} name="sfx/whoosh.wav" vol={0.4} />
        <Sfx at={b[1].at - 6} name="sfx/whoosh.wav" vol={0.3} />
        <Sfx at={hit} name="stamp" vol={0.6} />
        <Sfx at={hit + 3} name="sfx/ding.wav" vol={0.35} />
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  // ---------- THE SCORE ----------
  const ScoreScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
          <div style={{ marginTop: 300, fontFamily: HEAD, fontWeight: 800, fontSize: 72, color: "#fff", textAlign: "center", lineHeight: 1.1, ...popStyle(f, b[0].audio + s2f(DUR.sc * 0.35), 0, 0.5) }}>
            {cfg.scoreLine[0]}<br /><span style={{ color: C.celebrate }}>{cfg.scoreLine[1]}</span>
          </div>
        </AbsoluteFill>
        <Sfx at={b[0].audio + s2f(DUR.sc * 0.35)} name="tick" vol={0.4} />
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  // ---------- BONUS ROUND: the freeze, where FOCO comes in ----------
  const NeitherScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    const i = cur(b, f);
    const t = pop(f, b[0].audio - 4, 11);
    const freezeAt = (cfg.freezeAt ?? [0.55, 0.55]).map((x) => b[1].audio + s2f(DUR.b2 * x));
    return (
      <AbsoluteFill>
        {i === 0 && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140, gap: 16 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 12, color: C.celebrate, opacity: t }}>BONUS ROUND</div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 104, color: "#fff", textAlign: "center", lineHeight: 1.05, transform: `scale(${0.4 + t * 0.6})`, filter: `blur(${(1 - t) * 8}px)` }}>The moment you freeze<br />on a task you've avoided</div>
          </AbsoluteFill>
        )}
        {i === 1 && (["L", "R"] as Side[]).map((side, k) => (
          <div key={side} style={{ position: "absolute", left: APP[side].x - 300, top: 220, width: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...popStyle(f, b[1].at + k * 5, 0, 0.6) }}>
            <Img src={icon(APP[side].id)} style={{ width: 240, height: 240, borderRadius: 56 }} />
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: "#fff" }}>{APP[side].name}</div>
            <div style={{ marginTop: 6, padding: "14px 26px", borderRadius: 999, background: "rgba(10,4,16,0.9)", border: `2px solid ${APP[side].color}`, fontFamily: BODY_STACK, fontWeight: 800, fontSize: 30, color: "#fff", whiteSpace: "nowrap", ...popStyle(f, freezeAt[k] + k * 6, 0, 0) }}>{cfg.freeze[k]}</div>
          </div>
        ))}
        <Sfx at={b[0].audio - 6} name="sfx/whoosh.wav" vol={0.4} />
        {[...new Set(freezeAt)].map((t) => <Sfx key={t} at={t} name="tick" vol={0.4} />)}
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  // ---------- FOCO (v2 store-screen layers) ----------
  const FocoScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    const i = cur(b, f);
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", top: 40, left: 960, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 14, padding: "10px 26px 10px 12px", borderRadius: 999, background: "rgba(124,58,237,0.2)", border: `2px solid ${C.primary2}88`, opacity: pop(f, 0) }}>
          <Img src={icon("foco")} style={{ width: 48, height: 48, borderRadius: 12 }} />
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: "#fff" }}>Full disclosure: we make FOCO</span>
        </div>
        {i === 0 && (
          <AbsoluteFill>
            <div style={popStyle(f, b[0].at, -4)}><Cut n="s0-4" h={820} cx={640} cy={520} pad={40} also={["s0-2"]} /></div>
            {([["s0-5", 340, 300], ["s0-6", 700, 190], ["s0-7", 1060, 280]] as [string, number, number][]).map(([n, cx, cy], k) => (
              <div key={n} style={popStyle(f, b[0].at + 8 + k * 7, k % 2 ? 8 : -8)}>
                <Cut n={n} w={n === "s0-6" ? 300 : 380} cx={cx + Math.sin(f / 20 + k * 2) * 24} cy={cy + Math.cos(f / 24 + k) * 14} pad={30} />
              </div>
            ))}
            <div style={{ position: "absolute", left: 1330, top: 520, ...popStyle(f, b[0].audio + 30) }}>
              <Img src={icon("foco")} style={{ width: 260, height: 260, borderRadius: 60, boxShadow: `0 0 ${80 + 30 * Math.sin(f / 6)}px rgba(124,58,237,0.8)` }} />
            </div>
          </AbsoluteFill>
        )}
        {i === 1 && (
          <AbsoluteFill>
            <div style={popStyle(f, b[1].at)}><Cut n="s5-3" h={830} cx={700} cy={500} /></div>
            <div style={popStyle(f, b[1].at + 12, 6)}><Cut n="s5-5" w={880} cx={1180} cy={480} pad={40} /></div>
          </AbsoluteFill>
        )}
        {i === 2 && (
          <AbsoluteFill>
            <div style={popStyle(f, b[2].at)}><Cut n="s6-4" h={830} cx={760} cy={500} /></div>
            <div style={popStyle(f, b[2].at + 12, 5)}><Cut n="s6-5" w={760} cx={1220} cy={700} pad={30} also={["s6-6"]} /></div>
          </AbsoluteFill>
        )}
        {[0, 1, 2].map((k) => <Sfx key={k} at={b[k].at} name="sfx/whoosh.wav" vol={0.3} />)}
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  // ---------- VERDICT ----------
  const OutroScene: React.FC<{ g: Group }> = ({ g }) => {
    const f = useCurrentFrame();
    const b = local(g);
    const at = [b[0].audio + s2f(DUR.o1 * 0.05), b[0].audio + s2f(DUR.o1 * 0.5), b[1].audio + 4];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 160 }}>
        <div style={{ display: "flex", gap: 40 }}>
          {cfg.outro.map(([id, name, line], k) => (
            <div key={id} style={{ width: 480, padding: "44px 36px", borderRadius: 36, background: "rgba(10,4,16,0.85)", border: `3px solid ${k === 2 ? C.celebrate : "rgba(167,139,250,0.4)"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, ...popStyle(f, at[k], k === 1 ? 0 : k === 0 ? -6 : 6) }}>
              <Img src={icon(id)} style={{ width: 150, height: 150, borderRadius: 36 }} />
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 56, color: "#fff" }}>{name}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.muted, textAlign: "center", lineHeight: 1.25 }}>{line}</div>
            </div>
          ))}
        </div>
        {at.map((t) => <Sfx key={t} at={t} name="stamp" vol={0.35} />)}
        <Voice b={b} />
      </AbsoluteFill>
    );
  };

  const Component: React.FC = () => {
    const f = useCurrentFrame();
    const g = GROUPS.find((x) => f >= x.from && f < x.from + x.len) ?? GROUPS[GROUPS.length - 1];
    const inRounds = g.key.startsWith("round");
    const scoreG = GROUPS.find((x) => x.key === "score")!;
    const big = g.key === "score" ? ramp(f, scoreG.from, scoreG.from + 14) : 0;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <Hypno t={f} />
        <Audio src={staticFile("music/dreamscape.mp3")} volume={0.07} loop />
        {GROUPS.map((x) => (
          <Sequence key={x.key} from={x.from} durationInFrames={x.len}>
            {x.key === "hook" && <HookScene g={x} />}
            {x.key.startsWith("round") && <RoundScene g={x} />}
            {x.key === "score" && <ScoreScene g={x} />}
            {x.key === "neither" && <NeitherScene g={x} />}
            {x.key === "foco" && <FocoScene g={x} />}
            {x.key === "outro" && <OutroScene g={x} />}
          </Sequence>
        ))}
        {(inRounds || g.key === "score") && <Scoreboard f={f} big={big} />}
      </AbsoluteFill>
    );
  };
  return { Component, total };
};
