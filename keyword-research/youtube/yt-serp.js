// Top-10 YouTube results per candidate topic: views, age, channel, title-match -> serp.json
const fs = require("fs");
const topics = ["adhd task paralysis","how to break adhd task paralysis","adhd trouble starting tasks","adhd procrastination tips","how to stop procrastinating with adhd","adhd body doubling explained","adhd cleaning tips","adhd motivation to clean","adhd study tips","adhd executive dysfunction tips","adhd overwhelmed by tasks","adhd time blindness tips","adhd productivity system","adhd apps that actually work","adhd planner app","adhd to do list tips","adhd work from home tips","adhd tips for college students","adhd morning routine","adhd motivation hacks","how to break down tasks adhd","adhd body doubling pomodoro"];
const num = (t) => { if (!t) return 0; const m = t.replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i); if (!m) return 0; return parseFloat(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()] || 1); };
const ageYears = (t) => { if (!t) return null; const m = t.match(/(\d+)\s+(hour|day|week|month|year)/); if (!m) return null; return +m[1] * { hour: 1 / 8760, day: 1 / 365, week: 7 / 365, month: 1 / 12, year: 1 }[m[2]]; };
(async () => {
  const out = fs.existsSync("serp.json") ? JSON.parse(fs.readFileSync("serp.json", "utf8")) : {};
  for (const q of topics) {
    await new Promise((r) => setTimeout(r, 4000));
    let m = null;
    for (let attempt = 0; attempt < 4 && !m; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 2500 * attempt));
      let html = "";
      try { html = await (await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en&gl=US`, { headers: { "Accept-Language": "en-US", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", Cookie: "CONSENT=YES+1; SOCS=CAI" } })).text(); } catch (e) { console.log(`${q}: fetch error, retrying`); }
      m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    }
    if (!m) { console.log(`${q}: no data`); continue; }
    const data = JSON.parse(m[1]);
    const vids = [];
    const walk = (o) => { if (!o || typeof o !== "object" || vids.length >= 10) return; if (o.videoRenderer) { const v = o.videoRenderer; vids.push({ title: v.title?.runs?.[0]?.text, channel: v.ownerText?.runs?.[0]?.text, views: num(v.viewCountText?.simpleText), age: ageYears(v.publishedTimeText?.simpleText), len: v.lengthText?.simpleText }); return; } for (const k in o) walk(o[k]); };
    walk(data);
    out[q] = vids;
    fs.writeFileSync("serp.json", JSON.stringify(out, null, 1));
    const views = vids.map((v) => v.views).sort((a, b) => a - b);
    const med = views[Math.floor(views.length / 2)] || 0;
    const recent = vids.filter((v) => v.age !== null && v.age <= 1).length;
    const exact = vids.filter((v) => q.split(" ").filter((w) => w.length > 3).every((w) => (v.title || "").toLowerCase().includes(w))).length;
    console.log(`${q.padEnd(38)} median ${String(Math.round(med / 1000)).padStart(5)}K  max ${String(Math.round(views[views.length - 1] / 1000)).padStart(6)}K  <1yr ${recent}/10  exact-title ${exact}/10`);
  }
  fs.writeFileSync("serp.json", JSON.stringify(out, null, 1));
})();
