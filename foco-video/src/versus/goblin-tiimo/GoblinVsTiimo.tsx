// "Goblin Tools vs Tiimo" (16:9 YouTube) on the Versus engine. Tiimo edges it 3-2 on points, but Goblin wins the
// round that matters when one task is stuck right now; the bonus round ("you have the steps and still freeze") brings in FOCO.
// Verdicts follow the blog post /goblin-tools-vs-tiimo/ (Goblin tested hands-on 2026-10-09: public/versus/goblin-kitchen-test.jpg);
// features follow planners/COMPARISON.md + Tiimo's App Store listing. Voice: tts/versus-vo.mjs --dir=goblin-tiimo.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const T = 1000 / 2173, G = 1000 / 1778;
const TEST = { src: "versus/goblin-kitchen-test.jpg", ratio: 900 / 804 };
const vs = makeVersus({
  voDir: "versus-vo/goblin-tiimo",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "goblin", name: "Goblin Tools", color: "#4ADE80" },
  R: { id: "tiimo", name: "Tiimo", color: "#C4B5FD" },
  hookChips: [["L", "Stuck on one task? Steps in seconds"], ["R", "See the shape of your day"]],
  rounds: [
    { title: "Breaking down a stuck task", L: TEST, R: store("tiimo", 5, T), lNote: "Our test: steps in seconds", rNote: "Steps inside your day plan", order: ["L", "R"], win: "L" },
    { title: "Planning your whole day", L: null, R: store("tiimo", 3, T), lNote: "No calendar", rNote: "Color-coded visual timeline", order: ["R", "L"], win: "R" },
    { title: "Staying on task", L: store("goblin", 1, G), R: store("tiimo", 6, T), lNote: "Taskmaster, no countdown", rNote: "Calm focus timer", order: ["R", "L"], win: "R" },
    { title: "Setup before you start", L: TEST, R: store("tiimo", 1, T), lNote: "Open and type", rNote: "Build your day first", order: ["L", "R"], win: "L" },
    { title: "Routines and reminders", L: null, R: store("tiimo", 4, T), lNote: "No routines or reminders", rNote: "Routines + reminders", order: ["R"], win: "R" },
  ],
  scoreLine: ["Tiimo wins on points.", "Stuck right now? Goblin."],
  freeze: ["📝 A list, then you're on your own", "📅 Starts from your day plan"],
  freezeAt: [0.12, 0.62],
  outro: [["goblin", "Goblin Tools", "One task stuck right now"], ["tiimo", "Tiimo", "Your whole day needs a shape"], ["foco", "FOCO", "Got the steps, still can't begin"]],
});
export const GoblinVsTiimo = vs.Component;
export const GT_TOTAL = vs.total;
