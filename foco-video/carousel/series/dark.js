// "Dark mood" series (benchmark: mybuddymomo, 778K plays): moody full-bleed photos with one small lowercase line,
// then REAL FOCO screens on a blurred dark photo with a white native caption sticker, ending in daylight.
// Spec: carousels/<slug>.json with "series": "dark". Usage: node carousel/series/dark.js <slug>
// Fixed CTA end slide (Adi 2026-11-19): {end, sub, blur}. Slide kinds: {photo, pos, top, text, sub?, bright?, dark?} or {screen, blur, text, rot?, top?, h?, fit?, stk:{x,y,rot}}
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", ".."), slug = process.argv[2];
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "carousels", slug + ".json"), "utf8"));
const U = f => encodeURI("file:///" + path.join(ROOT, f).split(path.sep).join("/"));
const FONT = U("public/fonts/TikTokSans-latin.woff2");
const css = `@font-face{font-family:TT;src:url("${FONT}")}html,body{margin:0}
.s{position:relative;width:1080px;height:1920px;overflow:hidden;background:#050308}
.ph{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
.cap{position:absolute;left:110px;right:110px;text-align:center;font-family:TT;font-weight:500;font-size:46px;line-height:1.3;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.6)}
.cap.dk{color:#111;text-shadow:0 0 18px rgba(255,255,255,.9)}.sub{display:block;font-size:32px;opacity:.85;margin-top:14px}
.blur{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(30px) brightness(.45)}
.scr{position:absolute;left:50%;width:700px;transform:translateX(-50%) rotate(var(--r));border-radius:46px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.08)}
.scr img{display:block;width:100%;object-fit:cover}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;padding:0 90px 180px;text-align:center;font-family:TT;color:#fff}
.end .ic{width:190px;height:190px;border-radius:44px;box-shadow:0 0 80px rgba(124,58,237,.7)}.end .nm{font-weight:700;font-size:44px;letter-spacing:.12em;margin-top:-10px}
.end .h{font-weight:600;font-size:64px;line-height:1.15}.end .sb{font-weight:500;font-size:36px;color:#cfc4ff}.end .bd{display:flex;gap:22px;margin-top:20px}.end .bd img{height:96px}
.stk{position:absolute;background:#fff;color:#000;font-family:TT;font-weight:600;font-size:40px;line-height:1.25;padding:14px 22px;border-radius:14px;max-width:560px;transform:rotate(var(--r));box-shadow:0 8px 24px rgba(0,0,0,.35)}`;
const html = s => s.end
  ? `<div class="s"><div class="blur" style="background-image:url(${U(s.blur)})"></div><div class="end"><img class="ic" src="${U("public/apps/foconew-icon.png")}"><div class="nm">FOCO</div><div class="h">${s.end}</div><div class="sb">${s.sub}</div><div class="bd"><img src="${U("public/badges/app-store.svg")}"><img src="${U("public/badges/google-play-cropped.png")}"></div></div></div>`
  : s.screen
  ? `<div class="s"><div class="blur" style="background-image:url(${U(s.blur)})"></div><div class="scr" style="--r:${s.rot || 0}deg;top:${s.top || 250}px"><img src="${U(s.screen)}" style="height:${s.h || 1250}px;object-position:${s.fit || "top"}"></div><div class="stk" style="left:${s.stk.x}px;top:${s.stk.y}px;--r:${s.stk.rot || 0}deg">${s.text}</div></div>`
  : `<div class="s"><div class="ph" style="background-image:url(${U(s.photo)});background-position:${s.pos || "50% 50%"};filter:brightness(${s.bright || .85})"></div><div class="cap${s.dark ? " dk" : ""}" style="top:${s.top}px">${s.text}${s.sub ? `<span class="sub">${s.sub}</span>` : ""}</div></div>`;
(async () => {
  const out = path.join(ROOT, "out", "tiktok-" + slug); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (let i = 0; i < spec.slides.length; i++) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }), hf = path.join(out, `.s${i + 1}.html`);
    fs.writeFileSync(hf, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html(spec.slides[i])}</body></html>`);
    await p.goto("file:///" + hf.split(path.sep).join("/")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(out, `slide-${i + 1}.png`) }); await p.close(); fs.unlinkSync(hf);
  }
  await b.close(); console.log("rendered", spec.slides.length, "->", out);
})();
