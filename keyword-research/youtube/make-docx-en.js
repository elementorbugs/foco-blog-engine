// English Word report of the YouTube keyword research -> FOCO-YouTube-Plan-EN.docx (Hebrew version: make-docx.js)
// Usage: node keyword-research/youtube/make-docx-en.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require("docx");

const PURPLE = "7C3AED";
const DARK = "1A0A2E";
const MUTED = "6B7280";
const SOFT = "F3EBFF";
const FONT = "Arial";

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 320 },
    children: (Array.isArray(text) ? text : [text]).map((t) =>
      typeof t === "string" ? new TextRun({ text: t, font: FONT, size: o.size ?? 24, bold: o.bold, color: o.color ?? DARK }) : t,
    ),
  });
const b = (t) => new TextRun({ text: t, font: FONT, size: 24, bold: true, color: DARK });
const r = (t) => new TextRun({ text: t, font: FONT, size: 24, color: DARK });
const h1 = (t) => p(t, { size: 40, bold: true, color: PURPLE, after: 200 });
const h2 = (t) => p(t, { size: 30, bold: true, color: PURPLE, before: 320, after: 140 });
const bullet = (parts) => p(["• ", ...(Array.isArray(parts) ? parts : [parts])]);

const cell = (text, o = {}) =>
  new TableCell({
    width: o.w ? { size: o.w, type: WidthType.DXA } : undefined,
    shading: o.head ? { type: ShadingType.CLEAR, fill: PURPLE } : o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: o.head ? 20 : 19, bold: o.head || o.bold, color: o.head ? "FFFFFF" : DARK })] })],
  });

const rows = [
  ["1", "Body doubling: what it is and how to do it alone", "adhd body doubling", "9,900 · easy", "Weak: top explainers are small or old (one from 2019)", "\"Someone working alongside you\" is FOCO's core differentiator", "/body-doubling-adhd/"],
  ["2", "How to break ADHD task paralysis (a method)", "adhd task paralysis", "1,000 · easy-medium", "Weak: small channels in the top 3", "The site's flagship pillar topic", "/adhd-task-paralysis/"],
  ["3", "How to break down a big task with ADHD", "how to break down tasks adhd", "low · easy", "Very weak: most results 0-18K views", "Exactly FOCO's main feature, easy to demo", "/ai-task-breakdown/"],
  ["4", "Can't start work from home (ADHD)", "adhd work from home tips / adhd can't start work", "medium", "Weak: median 20K views", "Fits the primary audience (freelancers) exactly", "/adhd-remote-work/"],
  ["5", "Cleaning when overwhelmed", "adhd motivation to clean", "880-12,100 · medium", "High demand (median 150K), moderate competition", "Room-to-steps breakdown + timer; we have a printable planner", "/adhd-cleaning-planner/"],
  ["6", "Time blindness tips", "adhd time blindness tips", "2,400 · medium", "Medium: median 37K", "Timer + time estimate per step", "/time-blindness-adhd/"],
  ["7", "Procrastination / \"can't get started\"", "adhd procrastination", "1,000 · medium", "Strong: big channels, millions of views", "Huge demand but hard to rank. Use for Shorts", "/procrastination-vs-paralysis/"],
];

const line = { style: BorderStyle.SINGLE, size: 4, color: "D1B3FF" };
// explicit twip widths (page text width ~10100): Word rejects/garbles the 100-twip placeholder grid from percentage-only tables
const COLS = [400, 1900, 1600, 1300, 1700, 1900, 1300];
const table = new Table({
  width: { size: COLS.reduce((a, c) => a + c, 0), type: WidthType.DXA },
  columnWidths: COLS,
  borders: { insideHorizontal: line, insideVertical: line, left: line, right: line, top: { style: BorderStyle.SINGLE, size: 6, color: PURPLE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: PURPLE } },
  rows: [
    new TableRow({ tableHeader: true, children: ["#", "Video topic", "What people search", "Google searches/mo · difficulty", "YouTube competition", "Why it's good for FOCO", "Embed in post"].map((t, j) => cell(t, { head: true, w: COLS[j] })) }),
    ...rows.map((row, i) => new TableRow({ children: row.map((t, j) => cell(t, { fill: i < 3 ? SOFT : undefined, bold: j === 1, w: COLS[j] })) })),
  ],
});

const doc = new Document({
  styles: { default: { document: { run: { font: FONT } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 900, right: 900 } } },
      children: [
        h1("FOCO YouTube Plan: Keyword Research"),
        p("October 2026 · based on real YouTube and Google search data", { color: MUTED, size: 22, after: 240 }),

        h2("The bottom line"),
        bullet([b("Biggest opportunity: body doubling. "), r("Nearly 10,000 Google searches a month, weak YouTube competition, and it is exactly FOCO's edge (\"someone working alongside you\").")]),
        bullet([b("Quick wins: "), r("task breakdown and task paralysis. The top results there are small channels with few views, so a good video can climb.")]),
        bullet([b("Every video also strengthens the site: "), r("we embed it in the matching post (as with the task paralysis video), and cut 2-3 short clips from each long video for TikTok and Reels.")]),

        h2("The 7 topics, ranked"),
        p("The three rows shaded purple are the recommended starting set.", { color: MUTED, size: 22 }),
        table,

        h2("Fit with the target audience"),
        p("The primary audience is people with ADHD who work on their own, led by a freelancer aged 28-38. So:"),
        bullet([b("Topic 4 (can't start work from home) moved up: "), r("competition is weak and it speaks directly to this audience.")]),
        bullet([b("Examples in every video are work tasks: "), r("sending a quote, an invoice, replying to a client. Not just laundry and dishes.")]),
        bullet([b("The core message stays: "), r("\"FOCO isn't another to-do list. FOCO helps you start.\"")]),

        h2("Video formats"),
        bullet([b("5-8 minute search videos "), r("for topics 1-6: explain and give a method, with the mascot, voice, captions, b-roll and real FOCO screens.")]),
        bullet([b("\"Body double with FOCO\" series: "), r("25, 50 or 60-minute sessions where the mascot \"works alongside you\", with a timer and calm music. Captures searches like adhd body doubling study / cleaning / pomodoro.")]),
        bullet([b("Shorts: "), r("2-3 short clips cut from every long video for TikTok, Reels and Shorts.")]),
        bullet([b("Not doing: "), r("\"focus music\" (a separate niche) and more app-ranking videos (already done).")]),

        h2("Recommended order"),
        p("1. Explainer: body doubling"),
        p("2. How to break task paralysis"),
        p("3. How to break down a big task (FOCO demo)"),
        p("4. Can't start work from home"),
        p("5. \"Body double with FOCO\" sessions"),
        p("6. Cleaning, then time blindness"),

        h2("Status (October 6, 2026)"),
        bullet([b("Done: "), r("body doubling explainer is live and embedded in /body-doubling-adhd/.")]),
        bullet([b("Ready to upload: "), r("first 60-minute \"Body double with FOCO\" session (focus, 5-minute break, focus) with a royalty-free Pixabay track.")]),
        bullet([b("Next: "), r("task paralysis video, then the task breakdown demo.")]),

        h2("How the research was done"),
        bullet([b("YouTube autocomplete: "), r("628 real searches people type.")]),
        bullet([b("YouTube top 10 for each topic: "), r("view counts and which channels rank, to see where we can win.")]),
        bullet([b("Ubersuggest: "), r("US monthly Google searches and ranking difficulty.")]),
        bullet([b("The site's Google Search Console: "), r("what the site already shows up for.")]),
      ],
    },
  ],
});

const out = path.join(__dirname, "FOCO-YouTube-Plan-EN.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
});
