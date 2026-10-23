// "Tiimo vs Structured" (16:9 YouTube) on the Versus engine. Tiimo edges it 3-2, then "pick the one built for your
// problem", and a bonus round on the freeze where FOCO comes in.
// Verdicts follow the blog post posts-new/post-tiimo-vs-structured.html; features follow planners/COMPARISON.md.
// Voice: tts/versus-vo.mjs -> public/versus-vo + vo.json.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "./Versus";

export { VS_FPS } from "./Versus";

const T = 1000 / 2173, S = 1000 / 2171;
const vs = makeVersus({
  voDir: "versus-vo",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "tiimo", name: "Tiimo", color: "#C4B5FD" },
  R: { id: "structured", name: "Structured", color: "#FB7185" },
  hookChips: [["R", "One clean timeline"], ["L", "Built for neurodivergent brains"]],
  rounds: [
    { title: "Seeing your day", L: store("tiimo", 3, T), R: store("structured", 2, S), lNote: "Morning · Day · Evening", rNote: "One line, real-size blocks", order: ["R", "L"], win: "R" },
    { title: "Built for ADHD", L: store("tiimo", 1, T), R: store("structured", 1, S), lNote: "Neurodivergent-first design", rNote: "General planner ADHD fans love", order: ["L", "R"], win: "L" },
    { title: "AI planning", L: store("tiimo", 5, T), R: store("structured", 4, S), lNote: "Brain dump + step breakdown", rNote: "AI subtasks: newest iPhones", order: ["L", "R"], win: "L" },
    { title: "Staying with the task", L: store("tiimo", 4, T), R: store("structured", 5, S), lNote: "Countdown on your lock screen", rNote: "Pomodoro + what's-next widgets", order: ["R", "L"], win: "L" },
    { title: "Overplanning", L: null, R: "energy", lNote: "Not advertised", rNote: "Energy Monitor (opt-in)", order: ["R"], win: "R" },
  ],
  scoreLine: ["Don't pick the better app.", "Pick the one built for your problem."],
  freeze: ["📅 Starts from your day plan", "📅 Starts from your day plan"],
  outro: [["structured", "Structured", "One clean timeline"], ["tiimo", "Tiimo", "A planner built around your brain"], ["foco", "FOCO", "The plan's fine, you can't start"]],
});
export const TiimoVsStructured = vs.Component;
export const VS_TOTAL = vs.total;
