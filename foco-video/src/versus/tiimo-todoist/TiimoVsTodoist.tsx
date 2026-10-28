// "Tiimo vs Todoist" (16:9 YouTube) on the Versus engine. Todoist wins 3-2 on points, but Tiimo wins the rounds that
// matter if time is your problem; the bonus round (both start from organizing) brings in FOCO.
// Verdicts follow the blog post posts-new/post-tiimo-vs-todoist.html (facts checked 2026-10-18: App Store listings,
// pricing pages, Todoist help center). No prices or plan names. Voice: tts/versus-vo.mjs --dir=tiimo-todoist.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const T = 1000 / 2173, D = 1000 / 2172;
const vs = makeVersus({
  voDir: "versus-vo/tiimo-todoist",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "tiimo", name: "Tiimo", color: "#C4B5FD" },
  R: { id: "todoist", name: "Todoist", color: "#F87171" },
  hookChips: [["R", "Catches every task"], ["L", "Shows and paces your day"]],
  rounds: [
    { title: "Getting tasks out of your head", L: store("tiimo", 5, T), R: store("todoist-v2", 1, D), lNote: "AI brain dump", rNote: "Ramble: just talk", order: ["R", "L"], win: "R" },
    { title: "Seeing your day", L: store("tiimo", 3, T), R: store("todoist-v2", 3, D), lNote: "Morning · Day · Evening", rNote: "List first, calendar layout", order: ["L", "R"], win: "L" },
    { title: "Staying on task", L: store("tiimo", 6, T), R: store("todoist-v2", 2, D), lNote: "Visual focus timer", rNote: "Reminders, no timer", order: ["L", "R"], win: "L" },
    { title: "Big projects", L: store("tiimo", 1, T), R: store("todoist-v2", 4, D), lNote: "Built around your day", rNote: "Projects, labels, sharing", order: ["R", "L"], win: "R" },
    { title: "Your calendar", L: store("tiimo", 4, T), R: store("todoist-v2", 5, D), lNote: "Apple Calendar + Reminders", rNote: "Google or Outlook", order: ["R", "L"], win: "R" },
  ],
  scoreLine: ["Todoist wins on points.", "Time is your problem? Tiimo."],
  freeze: ["📅 Starts from your day plan", "📋 Starts from your task list"],
  freezeAt: [0.88, 0.7],
  outro: [["todoist", "Todoist", "You keep forgetting things"], ["tiimo", "Tiimo", "You keep losing track of time"], ["foco", "FOCO", "The plan's fine, you can't start"]],
});
export const TiimoVsTodoist = vs.Component;
export const TD_TOTAL = vs.total;
