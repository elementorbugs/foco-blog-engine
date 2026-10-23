// "Tiimo vs TickTick" (16:9 YouTube) on the Versus engine. 2-2 with a tie, then "pick the one built for your problem";
// the bonus round (both start from organizing) brings in FOCO.
// Verdicts follow the blog post posts-new/post-tiimo-vs-ticktick.html (facts checked 2026-10-18: App Store listings,
// TickTick's 2026-10-12 release notes, pricing pages). No prices or plan names. Voice: tts/versus-vo.mjs --dir=tiimo-ticktick.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const T = 1000 / 2173, K = 1000 / 1778;
const vs = makeVersus({
  voDir: "versus-vo/tiimo-ticktick",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "tiimo", name: "Tiimo", color: "#C4B5FD" },
  R: { id: "ticktick", name: "TickTick", color: "#60A5FA" },
  hookChips: [["R", "Everything in one app"], ["L", "A calm, visual day"]],
  rounds: [
    { title: "Built for ADHD", L: store("tiimo", 1, T), R: store("ticktick", 1, K), lNote: "Neurodivergent-first design", rNote: "General productivity app", order: ["L", "R"], win: "L" },
    { title: "Seeing your day", L: store("tiimo", 3, T), R: store("ticktick", 2, K), lNote: "Morning · Day · Evening", rNote: "Calendar views, starts from lists", order: ["L", "R"], win: "L" },
    { title: "Everything in one place", L: store("tiimo", 5, T), R: store("ticktick", 4, K), lNote: "Day plan + routines", rNote: "Tasks, calendar, habits, matrix", order: ["R", "L"], win: "R" },
    { title: "Staying focused", L: store("tiimo", 6, T), R: store("ticktick", 6, K), lNote: "Visual countdown", rNote: "Pomodoro + white noise", order: ["R", "L"], win: "tie" },
    { title: "Works on every device", L: store("tiimo", 4, T), R: store("ticktick", 10, K), lNote: "Apple devices, Android, web", rNote: "Also Windows + Linux", order: ["R", "L"], win: "R" },
  ],
  scoreLine: ["Don't pick the better app.", "Pick the one built for your problem."],
  freeze: ["📅 Starts from your day plan", "📋 Starts from your lists"],
  freezeAt: [0.7, 0.86],
  outro: [["tiimo", "Tiimo", "A calm, visual day"], ["ticktick", "TickTick", "One system for everything"], ["foco", "FOCO", "The plan's fine, you can't start"]],
});
export const TiimoVsTickTick = vs.Component;
export const TT_TOTAL = vs.total;
