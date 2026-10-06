// Hebrew (RTL) Word report of the YouTube keyword research -> FOCO-YouTube-Research.docx
// Usage: node keyword-research/youtube/make-docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, BorderStyle,
} = require("docx");

const PURPLE = "7C3AED";
const DARK = "1A0A2E";
const MUTED = "6B7280";
const SOFT = "F3EBFF";
const FONT = "Arial";

const p = (text, o = {}) =>
  new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 320 },
    children: (Array.isArray(text) ? text : [text]).map((t) =>
      typeof t === "string" ? new TextRun({ text: t, font: FONT, size: o.size ?? 24, bold: o.bold, color: o.color ?? DARK, rightToLeft: true }) : t,
    ),
  });
const b = (t) => new TextRun({ text: t, font: FONT, size: 24, bold: true, color: DARK, rightToLeft: true });
const r = (t) => new TextRun({ text: t, font: FONT, size: 24, color: DARK, rightToLeft: true });
const h1 = (t) => p(t, { size: 40, bold: true, color: PURPLE, after: 200 });
const h2 = (t) => p(t, { size: 30, bold: true, color: PURPLE, before: 320, after: 140 });
const bullet = (parts) => p(["• ", ...(Array.isArray(parts) ? parts : [parts])]);

const cell = (text, o = {}) =>
  new TableCell({
    shading: o.head ? { type: ShadingType.CLEAR, fill: PURPLE } : o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text, font: FONT, size: o.head ? 20 : 19, bold: o.head || o.bold, color: o.head ? "FFFFFF" : DARK, rightToLeft: true })],
      }),
    ],
  });

const rows = [
  ["1", "Body doubling: מה זה ואיך עושים את זה לבד", "adhd body doubling", "9,900 · קל", "חלשה: סרטוני ההסבר המובילים קטנים או ישנים (מ-2019)", "ה\"מישהו שעובד לצידך\" הוא היתרון המרכזי של FOCO", "/body-doubling-adhd/"],
  ["2", "איך יוצאים מ-task paralysis (שיטה)", "adhd task paralysis", "1,000 · קל-בינוני", "חלשה: ערוצים קטנים בטופ 3", "נושא הדגל של האתר", "/adhd-task-paralysis/"],
  ["3", "איך מפרקים משימה גדולה עם ADHD", "how to break down tasks adhd", "נמוך · קל", "חלשה מאוד: רוב התוצאות 0-18K צפיות", "זה בדיוק הפיצ'ר המרכזי של FOCO, קל להדגים", "/ai-task-breakdown/"],
  ["4", "לא מצליחה להתחיל לעבוד מהבית (ADHD)", "adhd work from home tips / adhd can't start work", "בינוני", "חלשה: חציון 20K צפיות", "מתאים בדיוק לקהל היעד החדש (פרילנסריות)", "/adhd-remote-work/"],
  ["5", "ניקיון כשמוצפים", "adhd motivation to clean", "880-12,100 · בינוני", "ביקוש גבוה (חציון 150K), תחרות בינונית", "פירוק חדר לצעדים + טיימר; יש לנו פלאנר להורדה", "/adhd-cleaning-planner/"],
  ["6", "טיפים ל-time blindness", "adhd time blindness tips", "2,400 · בינוני", "בינונית: חציון 37K", "טיימר + הערכת זמן לכל צעד", "/time-blindness-adhd/"],
  ["7", "דחיינות ו\"לא מצליחה להתחיל\"", "adhd procrastination", "1,000 · בינוני", "חזקה: ערוצים גדולים, מיליוני צפיות", "ביקוש ענק אבל קשה לדרג. מתאים ל-Shorts", "/procrastination-vs-paralysis/"],
];

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  visuallyRightToLeft: true,
  borders: { insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D1B3FF" }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "D1B3FF" }, top: { style: BorderStyle.SINGLE, size: 6, color: PURPLE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: PURPLE }, left: { style: BorderStyle.SINGLE, size: 4, color: "D1B3FF" }, right: { style: BorderStyle.SINGLE, size: 4, color: "D1B3FF" } },
  rows: [
    new TableRow({ tableHeader: true, children: ["#", "נושא הסרטון", "מה מחפשים (באנגלית)", "חיפושים בגוגל בחודש · קושי", "התחרות ביוטיוב", "למה זה טוב ל-FOCO", "באיזה מאמר נטמיע"].map((t) => cell(t, { head: true })) }),
    ...rows.map((row, i) => new TableRow({ children: row.map((t, j) => cell(t, { fill: i < 3 ? SOFT : undefined, bold: j === 1 })) })),
  ],
});

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, rightToLeft: true } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 900, right: 900 } } },
      children: [
        h1("מחקר מילות מפתח לסרטוני יוטיוב של FOCO"),
        p("אוקטובר 2026 · מבוסס על חיפושים אמיתיים ביוטיוב ובגוגל", { color: MUTED, size: 22, after: 240 }),

        h2("השורה התחתונה"),
        bullet([b("ההזדמנות הכי גדולה: Body doubling. "), r("כמעט 10,000 חיפושים בחודש בגוגל, תחרות חלשה ביוטיוב, וזה בדיוק היתרון של FOCO (\"מישהו שעובד לצידך\").")]),
        bullet([b("יש נושאים שאפשר לנצח בהם מהר: "), r("פירוק משימות ו-task paralysis. בתוצאות המובילות שם יש ערוצים קטנים עם מעט צפיות, אז סרטון טוב יכול לעלות למעלה.")]),
        bullet([b("כל סרטון מחזק גם את האתר: "), r("נטמיע אותו במאמר המתאים (כמו שעשינו עם סרטון ה-task paralysis), ומכל סרטון ארוך נחתוך 2-3 סרטונים קצרים לטיקטוק ולרילס.")]),

        h2("7 הנושאים, מדורגים"),
        p("שלושת הנושאים המסומנים בסגול הם ההמלצה להתחלה.", { color: MUTED, size: 22 }),
        table,

        h2("התאמה לקהל היעד שלך"),
        p("בסשנים בענן קבעת שקהל היעד הראשי הוא אנשים עם ADHD שעובדים לבד, ובראשם פרילנסרית בת 28-38. לכן:"),
        bullet([b("נושא 4 (לא מצליחה להתחיל לעבוד מהבית) עלה בדירוג: "), r("התחרות עליו חלשה, והוא מדבר בדיוק אל הקהל הזה.")]),
        bullet([b("בכל סרטון, הדוגמאות יהיו משימות עבודה: "), r("לשלוח הצעת מחיר, חשבונית, לענות ללקוח. לא רק כביסה וכלים.")]),
        bullet([b("המסר המרכזי נשאר: "), r("\"FOCO הוא לא עוד רשימת משימות. FOCO עוזר לך להתחיל.\"")]),

        h2("סוגי הסרטונים"),
        bullet([b("סרטוני חיפוש של 5-8 דקות "), r("לנושאים 1-6: סרטונים שמסבירים ונותנים שיטה, עם המסקוט, קול, כתוביות, וידאו ברקע ומסכים אמיתיים של FOCO.")]),
        bullet([b("סדרת \"Body double with FOCO\": "), r("סשנים של 25 או 50 דקות שבהם המסקוט \"עובד לצידך\", עם טיימר וסאונד רגוע. היא תופסת חיפושים כמו adhd body doubling study / cleaning / pomodoro.")]),
        bullet([b("Shorts: "), r("מכל סרטון ארוך חותכים 2-3 קטעים קצרים לטיקטוק, רילס ושורטס.")]),
        bullet([b("לא נעשה: "), r("\"מוזיקה לפוקוס\" (נישה אחרת), ועוד דירוגי אפליקציות (כבר עשינו).")]),

        h2("סדר עבודה מומלץ"),
        p("1. סרטון הסבר: Body doubling"),
        p("2. איך יוצאים מ-task paralysis"),
        p("3. איך מפרקים משימה גדולה (הדגמה של FOCO)"),
        p("4. לא מצליחה להתחיל לעבוד מהבית"),
        p("5. סשנים של Body double with FOCO"),
        p("6. ניקיון, ואז time blindness"),

        h2("מה צריך ממך"),
        bullet([b("לבחור את הסרטון הראשון "), r("(ההמלצה שלי: Body doubling).")]),
        bullet([b("לאשר חיבור ל-Google Drive "), r("בהגדרות של claude.ai (Connectors). סרטון כבד מדי למייל, ודרך Drive תקבל קישור במייל.")]),

        h2("איך עשינו את המחקר"),
        bullet([b("ההשלמות האוטומטיות של יוטיוב: "), r("628 חיפושים אמיתיים שאנשים מקלידים.")]),
        bullet([b("10 התוצאות המובילות ביוטיוב לכל נושא: "), r("כמה צפיות יש להן ואילו ערוצים מדורגים, כדי לראות איפה אפשר לנצח.")]),
        bullet([b("Ubersuggest: "), r("כמה מחפשים בגוגל בחודש בארה\"ב, וכמה קשה לדרג.")]),
        bullet([b("Google Search Console של האתר: "), r("על מה האתר כבר מופיע בחיפוש.")]),
      ],
    },
  ],
});

const out = path.join(__dirname, "FOCO-YouTube-Research.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
});
