// "Goblin Tools vs ChatGPT" (16:9 YouTube) on the Versus engine. Goblin Tools 3-2 on points, but ChatGPT wins the
// rounds that matter when a task is messy and personal; the bonus round (both stop at the list) brings in FOCO.
// Verdicts follow the blog post posts-new/post-goblin-tools-vs-chatgpt.html (Goblin tested hands-on 2026-10-09:
// public/versus/goblin-kitchen-test.jpg; ChatGPT from its US App Store listing). No prices or plan names.
// Voice: tts/versus-vo.mjs --dir=goblin-chatgpt.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const G = 1000 / 1778, C = 1000 / 2164;
const TEST = { src: "versus/goblin-kitchen-test.jpg", ratio: 900 / 804 };
const vs = makeVersus({
  voDir: "versus-vo/goblin-chatgpt",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "goblin", name: "Goblin Tools", color: "#4ADE80" },
  R: { id: "chatgpt", name: "ChatGPT", color: "#5EEAD4" },
  hookChips: [["L", "Instant steps, zero setup"], ["R", "Knows your whole story"]],
  rounds: [
    { title: "Getting steps, fast", L: TEST, R: store("chatgpt", 7, C), lNote: "Our test: 6 steps in seconds", rNote: "You write the prompt", order: ["L", "R"], win: "L" },
    { title: "Knowing your situation", L: store("goblin", 1, G), R: store("chatgpt", 2, C), lNote: "Sees one line of text", rNote: "Context + follow-ups", order: ["R", "L"], win: "R" },
    { title: "Steps you can start", L: TEST, R: store("chatgpt", 7, C), lNote: "Spiciness setting", rNote: "Only if you ask", order: ["L", "R"], win: "L" },
    { title: "Staying on track", L: store("goblin", 1, G), R: store("chatgpt", 1, C), lNote: "One job, then done", rNote: "Can do anything", order: ["L", "R"], win: "L" },
    { title: "Help with the work itself", L: store("goblin", 1, G), R: store("chatgpt", 8, C), lNote: "Built for breakdowns", rNote: "Drafts, plans, explains", order: ["R", "L"], win: "R" },
  ],
  scoreLine: ["Goblin Tools wins on points.", "Messy task? ChatGPT."],
  freeze: ["📝 A list, then you're on your own", "💬 A chat, then you're on your own"],
  freezeAt: [0.1, 0.35],
  outro: [["goblin", "Goblin Tools", "Instant steps, zero setup"], ["chatgpt", "ChatGPT", "A task that needs your story"], ["foco", "FOCO", "Got the steps, still can't begin"]],
});
export const GoblinVsChatGPT = vs.Component;
export const GC_TOTAL = vs.total;
