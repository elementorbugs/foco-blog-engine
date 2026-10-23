// "Todoist vs TickTick" (16:9 YouTube) on the Versus engine. 2-2 with a tie, then "pick the one built for your problem";
// the bonus round (both organize, neither makes you start) brings in FOCO.
// Verdicts follow the blog post posts-new/post-todoist-vs-ticktick.html (facts checked 2026-10-19: US App Store listings,
// pricing pages, Todoist help center). No prices or plan names. Voice: tts/versus-vo.mjs --dir=todoist-ticktick.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const D = 1000 / 2173, K = 1000 / 1778;
const vs = makeVersus({
  voDir: "versus-vo/todoist-ticktick",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "todoist", name: "Todoist", color: "#F87171" },
  R: { id: "ticktick", name: "TickTick", color: "#60A5FA" },
  hookChips: [["L", "Fast capture, clean list"], ["R", "Everything in one app"]],
  rounds: [
    { title: "Getting tasks out of your head", L: store("todoist", 1, D), R: store("ticktick", 3, K), lNote: "Quick Add + Ramble", rNote: "AI Voice Add", order: ["L", "R"], win: "L" },
    { title: "Seeing your time", L: store("todoist", 3, D), R: store("ticktick", 2, K), lNote: "Syncs your calendar", rNote: "Calendars + Timeline", order: ["R", "L"], win: "R" },
    { title: "Everything in one app", L: store("todoist", 4, D), R: store("ticktick", 6, K), lNote: "Tasks only", rNote: "Timer, habits, matrix", order: ["R", "L"], win: "R" },
    { title: "Keeping it simple", L: store("todoist", 2, D), R: store("ticktick", 1, K), lNote: "Clean, stays out of your way", rNote: "More to set up", order: ["L", "R"], win: "L" },
    { title: "Works on every device", L: store("todoist", 7, D), R: store("ticktick", 10, K), lNote: "Same 8 platforms", rNote: "Same 8 platforms", order: ["R", "L"], win: "tie" },
  ],
  scoreLine: ["Don't pick the better app.", "Pick the one built for your problem."],
  freeze: ["📋 Starts from your list", "📋 Starts from your list"],
  freezeAt: [0.72, 0.86],
  outro: [["todoist", "Todoist", "Fast capture, clean list"], ["ticktick", "TickTick", "One app for everything"], ["foco", "FOCO", "The list's fine, you can't start"]],
});
export const TodoistVsTickTick = vs.Component;
export const DK_TOTAL = vs.total;
