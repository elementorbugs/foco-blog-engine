// "Finch vs Habitica" (16:9 YouTube) on the Versus engine. 2-2 with a tie, then "pick the one built for your problem";
// the bonus round (both reward you after you act) brings in FOCO.
// Verdicts follow the blog post posts-new/post-finch-vs-habitica.html (facts checked 2026-10-22: US App Store listings,
// Habitica wiki on death and Pause Damage). No prices or plan names. Voice: tts/versus-vo.mjs --dir=finch-habitica.
import VO_LINES from "./vo-lines.json";
import VO from "./vo.json";
import { makeVersus, store } from "../Versus";

const F = 1000 / 2171, H = 1000 / 2164;
const vs = makeVersus({
  voDir: "versus-vo/finch-habitica",
  lines: (VO_LINES as { lines: Record<string, string> }).lines,
  dur: VO as Record<string, number>,
  L: { id: "finch", name: "Finch", color: "#7DD3FC" },
  R: { id: "habitica", name: "Habitica", color: "#C4B5FD" },
  hookChips: [["L", "Gentle, no penalty"], ["R", "A game with real stakes"]],
  rounds: [
    { title: "When you miss a day", L: store("finch", 7, F), R: store("habitica", 1, H), lNote: "No penalty, keep going", rNote: "Lose health, then a level", order: ["R", "L"], win: "L" },
    { title: "Habits and to-dos", L: store("finch", 4, F), R: store("habitica", 2, H), lNote: "Small self-care goals", rNote: "Habits, Dailies, To-dos", order: ["R", "L"], win: "R" },
    { title: "Your mood", L: store("finch", 6, F), R: null, lNote: "Mood, journal, breathing", rNote: "Not a focus", order: ["L", "R"], win: "L" },
    { title: "Rewards", L: store("finch", 1, F), R: store("habitica", 5, H), lNote: "Your bird grows", rNote: "Gold, gear and pets", order: ["R", "L"], win: "tie" },
    { title: "Friends and accountability", L: store("finch", 2, F), R: store("habitica", 1, H), lNote: "Goal buddies", rNote: "Parties, challenges, guilds", order: ["R", "L"], win: "R" },
  ],
  scoreLine: ["Don't pick the better app.", "Pick the one built for your problem."],
  freeze: ["🐦 Rewards you after you act", "⚔️ Rewards you after you act"],
  freezeAt: [0.15, 0.3],
  outro: [["finch", "Finch", "Gentle self-care, no penalty"], ["habitica", "Habitica", "Habits that play like a game"], ["foco", "FOCO", "The big task you can't begin"]],
});
export const FinchVsHabitica = vs.Component;
export const FH_TOTAL = vs.total;
