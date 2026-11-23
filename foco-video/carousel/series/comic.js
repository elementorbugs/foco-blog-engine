// "FOCO comic" series (benchmark: ADHDinos, 457K plays): 4 panels of the on-model FOCO character acting in one
// recurring scene, one handwritten line per panel, then a grid slide. 1080x1350 (works on TikTok and IG).
// Panels (cost: flash-image ~$0.04, 3-pro-image ~$0.13 per image): Gemini scenes with the official states as references (viral-lab/tools/gemini-image.py, --ref panel-1 for
// the next panels so desk/style stay identical); check every panel against viral-lab/character/official before use.
// Spec: carousels/<slug>.json with "series": "comic". Usage: node carousel/series/comic.js <slug>
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", ".."), slug = process.argv[2];
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "carousels", slug + ".json"), "utf8"));
const U = f => encodeURI("file:///" + (path.isAbsolute(f) ? f : path.join(ROOT, f)).split(path.sep).join("/"));
const css = `@font-face{font-family:Kalam;src:url("${U("public/fonts/Kalam-Regular.ttf")}")}
@font-face{font-family:KalamB;src:url("${U("public/fonts/Kalam-Bold.ttf")}")}
html,body{margin:0}.s{position:relative;width:1080px;height:1350px;overflow:hidden;background:#160b2b}
.bg{position:absolute;inset:0;background-size:cover;background-position:center bottom}
.frame{position:absolute;inset:26px;border:6px solid #efe8ff;border-radius:8px}
.txt{position:absolute;left:100px;right:100px;top:120px;text-align:center;font-family:Kalam;font-size:60px;line-height:1.22;color:#f6f2ff;text-shadow:0 2px 14px rgba(10,4,24,.9)}
.txt b{font-family:KalamB;font-weight:400;color:#c9b0ff}
.n,.tag{position:absolute;bottom:56px;font-family:KalamB;font-size:30px;color:#a78bfa}.n{left:62px}.tag{right:62px;letter-spacing:.05em}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:0 90px;text-align:center}
.end .m{width:330px;filter:drop-shadow(0 0 40px rgba(124,58,237,.6))}.end .h{font-family:KalamB;font-size:66px;line-height:1.15;color:#f6f2ff}.end .sb{font-family:Kalam;font-size:40px;color:#c9b0ff}.end .bd{display:flex;gap:22px;margin-top:10px}.end .bd img{height:84px}
.cell{position:absolute;width:500px;height:625px;overflow:hidden;border-radius:6px}.cell img{width:100%;height:100%}
.pill{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#160b2b;border:4px solid #efe8ff;color:#fff;font-family:KalamB;font-size:42px;padding:6px 36px;border-radius:999px}`;
(async () => {
  const out = path.join(ROOT, "out", "tiktok-" + slug); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), n = spec.panels.length;
  const go = async (body, name) => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1350 } }), hf = path.join(out, `.${name}.html`);
    fs.writeFileSync(hf, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
    await p.goto("file:///" + hf.split(path.sep).join("/")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, name + ".jpg"), type: "jpeg", quality: 93 }); await p.close(); fs.unlinkSync(hf);
  };
  for (let i = 0; i < n; i++) await go(`<div class="s"><div class="bg" style="background-image:url(${U(spec.panels[i].image)})"></div><div class="txt">${spec.panels[i].text}</div><div class="frame"></div><div class="n">${i + 1}/${n}</div><div class="tag">FOCO</div></div>`, `slide-${i + 1}`);
  await go(`<div class="s">${spec.panels.slice(0, 4).map((_, i) => `<div class="cell" style="left:${26 + (i % 2) * 528}px;top:${34 + Math.floor(i / 2) * 656}px"><img src="${U(path.join(out, `slide-${i + 1}.jpg`))}"></div>`).join("")}<div class="pill">FOCO</div></div>`, `slide-${n + 1}`);
  if (spec.end) await go(`<div class="s"><div class="bg" style="background-image:url(${U(spec.panels[0].image)});filter:blur(18px) brightness(.5)"></div><div class="end"><img class="m" src="${U("public/mascots-hd/alignment.png")}"><div class="h">${spec.end.text}</div><div class="sb">${spec.end.sub}</div><div class="bd"><img src="${U("public/badges/app-store.svg")}"><img src="${U("public/badges/google-play-cropped.png")}"></div></div><div class="frame"></div></div>`, `slide-${n + 2}`);
  await b.close(); console.log("rendered", n + (spec.end ? 2 : 1), "->", out);
})();
