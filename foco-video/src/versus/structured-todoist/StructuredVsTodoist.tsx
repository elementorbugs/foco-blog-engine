// "Structured vs Todoist" (16:9 YouTube) on the Versus engine. Todoist 3-2 on points, but Structured wins the round
// that matters if time blindness is the problem; the bonus round (a slot or a list, neither makes you start) brings in FOCO.
// Verdicts follow the blog post posts-new/post-structured-vs-todoist.html (facts checked 2026-10-22: US App Store listings,
// Structured and Todoist help centers). No prices, plan names or "free" claims. Voice: tts/versus-vo.mjs --dir=structured-todoist.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const S = 1000 / 2171, D = 1000 / 2173;
const vs = makeVersus({
  voDir: "versus-vo/structured-todoist",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "structured", name: "Structured", color: "#F9A8A8" },
  R: { id: "todoist", name: "Todoist", color: "#F87171" },
  hookChips: [["L", "See your day as time"], ["R", "Catch every task and project"]],
  rounds: [
    { title: "Seeing your time", L: store("structured", 2, S), R: store("todoist", 3, D), lNote: "Blocks sized by time", rNote: "Starts from lists", order: ["L", "R"], win: "L" },
    { title: "Getting tasks out of your head", L: store("structured", 1, S), R: store("todoist", 1, D), lNote: "Inbox, then the timeline", rNote: "Quick Add + Ramble", order: ["R", "L"], win: "R" },
    { title: "Big projects", L: store("structured", 3, S), R: store("todoist", 4, D), lNote: "Built around today", rNote: "Projects, priorities, filters", order: ["R", "L"], win: "R" },
    { title: "Staying focused", L: store("structured", 5, S), R: null, lNote: "Focus timer on your lock screen", rNote: "No focus timer", order: ["L", "R"], win: "L" },
    { title: "Works on every device", L: store("structured", 6, S), R: store("todoist", 7, D), lNote: "No Windows or Linux", rNote: "Also Windows + Linux", order: ["R", "L"], win: "R" },
  ],
  scoreLine: ["Todoist wins on points.", "Losing track of time? Structured."],
  freeze: ["🕒 Gives it a time slot", "📋 Gives it a place on the list"],
  freezeAt: [0.05, 0.4],
  outro: [["structured", "Structured", "See your day as time"], ["todoist", "Todoist", "Catch every task and project"], ["foco", "FOCO", "The plan's fine, you can't start"]],
});
export const StructuredVsTodoist = vs.Component;
export const SD_TOTAL = vs.total;
