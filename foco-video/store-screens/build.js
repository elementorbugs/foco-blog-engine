// App Store screenshots v3 (7 x 1320x2868, iPhone 6.9"). Brief: BRIEF.md. One wide panorama sliced into slides, so
// the story (and a light stream carrying tasks) runs across slide edges like Brain.fm's store page.
// Story: head full -> type / snap / say it -> it all lands in your day -> tiny steps -> focus -> done.
// Phone screens are real app screenshots (raw/ first, then assets/) or 1:1 rebuilds of real screens.
// usage: node store-screens/build.js   -> store-screens/out/0N-<id>.png + out/preview.jpg
const fs = require('fs'), path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));
const url = f => encodeURI('file:///' + f.replace(/\\/g, '/')); // the folder name has a space
const A = p => url(path.join(__dirname, fs.existsSync(path.join(__dirname, 'raw', p)) ? 'raw' : 'assets', p)); // raw/ wins
const F = p => url(path.join(__dirname, '..', 'public', 'fonts', p));
const W = 1320, H = 2868, PW = 740, PH = Math.round(PW * 2556 / 1179); // phone screen size
const PY = 1000, PC = (W - PW - 40) / 2, PR = W - PW - 40 - 70; // phone top; centred / right-hand x
const IDS = ['stuck', 'dump', 'scan', 'say', 'day', 'steps', 'focus', 'momentum'], N = IDS.length;

const css = `
@font-face{font-family:Head;src:url("${F('Poppins-ExtraBold.ttf')}")}
@font-face{font-family:Emo;src:url("${F('NotoColorEmoji.woff2')}")}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W * N}px;height:${H}px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;position:relative;background:#05030a}
.bg{position:absolute;top:0;height:${H}px;width:${W}px}
.slide{position:absolute;top:0;width:${W}px;height:${H}px;overflow:hidden}
.head{position:absolute;left:0;right:0;top:170px;text-align:center;z-index:8;padding:0 60px}
h1{font-family:Head;font-size:126px;line-height:1.05;letter-spacing:-2.5px}
h1 em{font-style:normal;background:linear-gradient(90deg,#E9D5FF,#A78BFA 60%,#C4B5FD);-webkit-background-clip:text;color:transparent}
.sub{margin-top:30px;font-size:56px;font-weight:500;line-height:1.3;color:#C9C1E0}
.phone{position:absolute;top:${PY}px;width:${PW + 40}px;border-radius:120px;padding:20px;z-index:4;
  background:linear-gradient(150deg,#55555f,#1a1a20 30%,#0c0c10 60%,#3a3a44);box-shadow:inset 0 0 0 2px #6a6a76,inset 0 0 0 8px #0b0b0e,0 80px 160px rgba(0,0,0,.75),0 0 180px rgba(124,58,237,.32)}
.screen{position:relative;width:${PW}px;height:${PH}px;border-radius:100px;overflow:hidden;background:#0b0a14}
.screen>img{width:100%;height:100%;display:block}
.island{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:224px;height:66px;border-radius:38px;background:#000;z-index:9}
.glass{position:absolute;z-index:7;border-radius:48px;background:rgba(17,13,32,.94);box-shadow:0 0 0 2px rgba(196,181,253,.5),0 0 120px rgba(124,58,237,.5),0 50px 110px rgba(0,0,0,.7)}
.chip{position:absolute;z-index:6;display:flex;align-items:center;gap:18px;padding:22px 38px;border-radius:999px;font-size:44px;font-weight:600;white-space:nowrap;
  background:rgba(30,22,58,.9);border:2px solid rgba(196,181,253,.55);box-shadow:0 0 50px rgba(124,58,237,.45),0 24px 60px rgba(0,0,0,.5)}
.chip.w{background:#fff;color:#151025;border:none}
.person{position:absolute;overflow:hidden;z-index:3;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 58%,transparent 100%)}
.person.notint::after{display:none}
.person img{position:absolute;filter:drop-shadow(0 0 3px rgba(221,214,254,.9)) drop-shadow(0 0 50px rgba(167,139,250,.55))}
.ui{position:absolute;left:0;top:0;width:393px;height:852px;transform:scale(${PW / 393});transform-origin:0 0;font-family:Inter,sans-serif;color:#fff;background:#0b0a14}
.sb{position:absolute;top:17px;left:0;right:0;height:22px;font-size:17px;font-weight:600;z-index:3}
.sb .t{position:absolute;left:52px}.sb .r{position:absolute;right:30px;top:2px;display:flex;gap:6px;align-items:center}
.emo{font-family:Emo}
.home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:139px;height:5px;border-radius:3px;background:#fff;z-index:3}
`;
const statusBar = `<div class="sb"><span class="t">9:41</span><span class="r">
<svg width="19" height="12" viewBox="0 0 19 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 17 12" fill="#fff"><path d="M8.5 2.2c2.4 0 4.6.9 6.2 2.5l1.2-1.2C14 1.6 11.4.5 8.5.5S3 1.6 1.1 3.5l1.2 1.2C3.9 3.1 6.1 2.2 8.5 2.2zm0 3.4c1.4 0 2.8.6 3.8 1.5l1.2-1.2c-1.3-1.3-3.1-2-5-2s-3.7.7-5 2l1.2 1.2c1-.9 2.4-1.5 3.8-1.5zm0 3.4c.5 0 .9.2 1.3.5L8.5 10.8 7.2 9.5c.4-.3.8-.5 1.3-.5z"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="#fff" stroke-opacity=".4" fill="none"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><rect x="24.5" y="4.5" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".4"/></svg></span></div>`;
const check = (bg, fg, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" style="flex:none"><circle cx="10" cy="10" r="10" fill="${bg}"/><path d="M6 10.3l2.7 2.7L14.2 7.4" stroke="${fg}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ico = {
  cam: (c = '#C4B5FD', s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`,
  mic: (c = '#C4B5FD', s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>`,
  type: (c = '#C4B5FD', s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>`,
  cal: (c = '#C4B5FD', s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  send: s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`,
};

// ---------- rebuilt real screens (393pt iOS layout) ----------
const CAM = { w: 720, cx: 846, cy: 1180, rot: 18 }; // photo scale + the written block's centre (source px) + level-out rotation
// iOS camera picker (FOCO's "Take photo") with the Pexels list photo (RDNE Stock project #8581008) in frame
const camera = () => `<div class="ui" style="background:#000">${statusBar}
  <div style="position:absolute;left:0;right:0;top:96px;height:560px;overflow:hidden"><img src="${A('list-photo.jpg')}" style="position:absolute;width:${CAM.w}px;left:${196 - CAM.cx * CAM.w / 1800}px;top:${290 - CAM.cy * CAM.w / 1800}px;transform-origin:${CAM.cx * CAM.w / 1800}px ${CAM.cy * CAM.w / 1800}px;transform:rotate(${CAM.rot}deg)"></div>
  <div style="position:absolute;left:26px;top:150px;width:341px;height:420px;border-radius:18px;box-shadow:0 0 0 900px rgba(8,5,20,.62)"></div>
  <div style="position:absolute;left:0;right:0;top:656px;bottom:0;background:#000">
    <div style="text-align:center;color:#FFD60A;font-size:13px;font-weight:600;letter-spacing:1px;margin-top:14px">PHOTO</div>
    <div style="position:absolute;left:24px;top:76px;font-size:17px">Cancel</div>
    <div style="position:absolute;left:50%;top:52px;transform:translateX(-50%);width:72px;height:72px;border-radius:50%;border:4px solid #fff;padding:4px"><div style="width:100%;height:100%;border-radius:50%;background:#fff"></div></div>
  </div><div class="home"></div></div>`;
// Sessions day view, laid out like the real Oct 14 screen (header, week strip, time-of-day sections, rows, tab bar)
const dayView = sections => {
  const ic = (c, d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const days = [['M', 12], ['T', 13], ['W', 14], ['T', 15], ['F', 16], ['S', 17], ['S', 18]];
  const row = ([e, t, m, bg, done]) => `<div style="display:flex;align-items:center;gap:14px;padding:15px 16px;border-radius:18px;background:#1a1d33;border:1px solid rgba(255,255,255,.06);margin-bottom:9px${done ? ';opacity:.6' : ''}">
    <div class="emo" style="width:44px;height:44px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">${e}</div>
    <div style="flex:1"><div style="font-size:17px;font-weight:600${done ? ';text-decoration:line-through' : ''}">${t}</div><div style="font-size:13px;color:#8d8aa6;margin-top:3px">${m}</div></div>
    ${done ? check('#7C3AED', '#fff', 26) : '<div style="width:26px;height:26px;border-radius:50%;border:2px solid #9b98b0;flex:none"></div>'}</div>`; // done: optional 5th field
  const tab = (l, d, on) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;color:${on ? '#A78BFA' : '#9b98b0'}">
    <div style="width:56px;height:40px;border-radius:13px;${on ? 'background:#262046;' : ''}display:flex;align-items:center;justify-content:center">${ic(on ? '#A78BFA' : '#cfcde0', d)}</div>${l}</div>`;
  return `<div class="ui" style="background:#090a14">${statusBar}
  <div style="position:absolute;top:60px;left:17px;font-size:33px;font-weight:700;letter-spacing:-.5px">Wednesday</div>
  <div style="position:absolute;top:100px;left:17px;font-size:16px;color:#A78BFA">Oct 14, 2026 ›</div>
  <div style="position:absolute;top:66px;right:67px;width:44px;height:44px;border-radius:13px;background:#161a2b;display:flex;align-items:center;justify-content:center">${ic('#d9d7e6', '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>')}</div>
  <div style="position:absolute;top:66px;right:12px;width:44px;height:44px;border-radius:13px;background:#8B7CF6;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:300">+</div>
  <div style="position:absolute;top:142px;left:26px;right:26px;display:flex;justify-content:space-around">${days.map(([d, n]) => `<div style="width:42px;height:68px;border-radius:13px;${n === 14 ? 'background:#9d8cf5;' : ''}display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:${n === 14 ? 15 : 15}px;color:${n === 14 ? '#fff' : '#c9c7d8'}"><span>${d}</span><b style="font-size:17px;font-weight:600">${n}</b></div>`).join('')}</div>
  <div style="position:absolute;top:232px;left:16px;right:16px">
  ${sections.map(([name, icon, rows]) => `<div style="display:flex;align-items:center;gap:12px;font-size:15px;font-weight:700;letter-spacing:2px;margin:6px 0 12px">${ic('#e6e4f0', icon)}${name}<span style="background:#2a2550;color:#A78BFA;border-radius:12px;padding:2px 9px;font-size:13px">${rows.length}</span>
    <span style="margin-left:auto;color:#cfcde0">${ic('#cfcde0', '<path d="M6 9l6 6 6-6"/>')}</span><span style="margin-left:12px">${ic('#A78BFA', '<path d="M12 5v14M5 12h14"/>')}</span></div>${rows.map(row).join('')}`).join('')}
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:#090a14;border-top:1px solid rgba(255,255,255,.06);display:flex;padding-top:10px">
    ${tab('Chat', '<path d="M4 18l1.5-3.5A7.5 7.5 0 1 1 9 18.6L4 18z"/>')}${tab('Sessions', '<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>', 1)}${tab('You', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}</div>
  <div class="home"></div></div>`;
};

// ---------- building blocks ----------
const phone = (x, content, top = PY) => `<div class="phone" style="left:${x}px;top:${top}px"><div class="screen">${content}<div class="island"></div></div></div>`;
const img = f => `<img src="${A(f)}">`;
// FOCO_LANG=es -> Spanish (Mexico) store screenshots: headlines, subs and the floating marketing chips are translated;
// cards that mirror the app's own screens stay English, because the app itself is English-only.
const LANG = process.env.FOCO_LANG || 'en';
const ES = {
  'Stuck before<br><em>you start?</em>': '¿Te cuesta<br><em>empezar?</em>',
  'FOCO beats procrastination<br>and task paralysis.': 'FOCO te ayuda a superar la procrastinación<br>y a dar el primer paso.',
  'Get it out<br><em>of your head.</em>': 'Sácalo de<br><em>tu cabeza.</em>',
  'Type it, snap it or say it.<br>It goes straight into your calendar.': 'Escríbelo, hazle una foto o dilo.<br>FOCO lo agrega a tu calendario.',
  'Snap your<br><em>paper list.</em>': 'Haz una foto<br><em>de tu lista.</em>',
  'FOCO pulls every task off the page<br>and into your calendar.': 'FOCO detecta las tareas<br>y las agrega a tu calendario.',
  'Or just<br><em>say it.</em>': 'O simplemente<br><em>dilo.</em>',
  'Talk. It lands in your calendar,<br>with a reminder.': 'Habla y FOCO lo agrega a tu calendario<br>con un recordatorio.',
  'It all lands<br><em>in your day.</em>': 'Todo en<br><em>un solo lugar.</em>',
  'Typed, snapped or said.<br>One calendar.': 'Escribe, habla o haz una foto.<br>Todas tus tareas, organizadas<br>en tu calendario.',
  'Big task?<br><em>Tiny steps.</em>': '¿Tarea grande?<br><em>Pasos pequeños.</em>',
  'FOCO\'s AI breaks it into steps<br>you can actually start.': 'La IA de FOCO la divide en pasos sencillos<br>para que puedas empezar.',
  'One task.<br><em>Full focus.</em>': 'Una tarea.<br><em>Enfoque total.</em>',
  'A timer and calm sounds<br>to get you through it.': 'Un temporizador y sonidos relajantes<br>para ayudarte a terminar.',
  'Watch your<br><em>momentum grow.</em>': 'Mira cuánto<br><em>has avanzado.</em>',
  'Streaks, focus time and<br>every step you finish.': 'Tus rachas, minutos de concentración<br>y pasos completados.',
  'Reply to emails': 'Responder correos', 'Invoice client': 'Facturar al cliente', 'New presentation': 'Nueva presentación',
  'Type': 'Escribe', 'Snap': 'Haz una foto', 'Say': 'Habla', 'Your calendar': 'Tu calendario',
  '✦ Found 8 tasks': '✦ 8 tareas encontradas',
  'Groom the dog': 'Bañar al perro', 'Make dinner': 'Hacer la cena', 'Drink enough water': 'Tomar suficiente agua', 'Go shopping': 'Ir de compras',
  'Said': 'Dicho', 'Typed': 'Escrito', 'Snapped': 'Fotografiado',
  'WORK · 60 MIN': 'TRABAJO · 60 MIN', 'Make a new presentation': 'Hacer una nueva presentación',
};
const tr = s => (LANG === 'es' && ES[s]) || s;
const head = (h, sub) => `<div class="head"><h1>${tr(h)}</h1><div class="sub">${tr(sub)}</div></div>`;
// a person cut-out: box (x,y,w,h) on the slide, image scaled to imgW and shifted by (ix,iy) inside the box
const person = (f, x, y, w, h, imgW, ix, iy) => `<div class="person" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${A(f)}" style="width:${imgW}px;left:${ix}px;top:${iy}px"></div>`;
// a crop of a real screenshot ([sx,sy,sw,sh] px) as a pop-out card of width w
const cropPop = (f, [sx, sy, sw, sh], left, top, w) => { const k = w / sw; return `<div class="glass" style="left:${left}px;top:${top}px;width:${w}px;height:${Math.round(sh * k)}px;background:url('${A(f)}') -${Math.round(sx * k)}px -${Math.round(sy * k)}px / ${Math.round(1179 * k)}px auto no-repeat"></div>`; };
// screen points -> slide px, for overlays on a phone at x
const ox = (px, x) => px + 20 + x * PW / 393, oy = y => PY + 20 + y * PW / 393;
const scanner = (x, y, w, h) => {
  const c = d => `<path d="${d}" stroke="#fff" stroke-width="34" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 18px #8B5CF6)"/><path d="${d}" stroke="#7C3AED" stroke-width="20" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 24px #7C3AED)"/>`, L = 130;
  return `<svg style="position:absolute;left:${x}px;top:${y}px;z-index:6;overflow:visible" width="${w}" height="${h}">
  ${c(`M0 ${L} V30 Q0 0 30 0 H${L}`)}${c(`M${w - L} 0 H${w - 30} Q${w} 0 ${w} 30 V${L}`)}${c(`M0 ${h - L} V${h - 30} Q0 ${h} 30 ${h} H${L}`)}${c(`M${w - L} ${h} H${w - 30} Q${w} ${h} ${w} ${h - 30} V${h - L}`)}
  <defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity="0"/><stop offset="1" stop-color="#8B5CF6" stop-opacity=".42"/></linearGradient></defs>
  <rect x="20" y="${h * .55 - 230}" width="${w - 40}" height="230" fill="url(#beam)"/>
  <rect x="0" y="${h * .55 - 5}" width="${w}" height="10" rx="5" fill="#7C3AED" style="filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 16px #C4B5FD) drop-shadow(0 0 40px #8B5CF6) drop-shadow(0 0 70px #7C3AED)"/></svg>`;
};
// voice recorder: red REC dot, timer, big waveform, live transcript
const recorder = (x, y, w) => {
  const hs = [18, 30, 52, 80, 60, 96, 128, 90, 150, 112, 70, 132, 160, 118, 84, 140, 100, 64, 120, 150, 96, 58, 110, 136, 88, 52, 76, 40, 26, 16];
  return `<div class="glass" style="left:${x}px;top:${y}px;width:${w}px;padding:44px 54px 50px;background:#110d20">
    <div style="display:flex;align-items:center;gap:18px;font-size:40px;font-weight:600;letter-spacing:2px"><span style="width:26px;height:26px;border-radius:50%;background:#ef4444;box-shadow:0 0 24px #ef4444"></span>REC<span style="margin-left:auto;font-variant-numeric:tabular-nums;color:#C9C1E0;letter-spacing:0">0:04</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between;height:190px;margin:26px 0 22px">${hs.map(h => `<span style="width:16px;height:${h}px;border-radius:8px;background:linear-gradient(#E9D5FF,#8B5CF6)"></span>`).join('')}</div>
    <div style="font-size:52px;font-weight:600;line-height:1.25">"Call the dentist<br>tomorrow at 7"</div></div>`;
};
// result card in FOCO's style: category, title, minutes, "Added to your sessions"
const taskCard = (x, y, w, cat, title, min, note) => `<div class="glass" style="left:${x}px;top:${y}px;width:${w}px;padding:40px 48px;background:#0f1620;box-shadow:0 0 0 3px rgba(52,211,153,.6),0 0 110px rgba(52,211,153,.3),0 50px 110px rgba(0,0,0,.7)">
  <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:700;letter-spacing:3px;color:#34D399"><span style="width:16px;height:16px;border-radius:50%;background:#34D399"></span>${cat}<span style="margin-left:auto;color:#a9a6bf;font-weight:500;letter-spacing:0;font-size:34px">${min}</span></div>
  <div style="font-size:52px;font-weight:600;margin:16px 0 18px">${title}</div>
  <div style="display:flex;align-items:center;gap:16px;font-size:36px;color:#34D399">${check('#34D399', '#0b2b22', 40)}${note}</div></div>`;

// Chat home, rebuilt 1:1 from Adi's Oct 14 screenshot ("What task are you putting off?"); raw/chat.png wins if saved
const chatHome = (typed = '') => {
  if (fs.existsSync(path.join(__dirname, 'raw', 'chat.png')) && !typed) return img('chat.png');
  const ic = (c, d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const pill = (inner, w) => `<div style="height:31px;${w ? 'width:' + w + 'px;' : 'padding:0 13px;'}border-radius:16px;border:1.5px solid rgba(129,140,248,.35);background:#0f1224;display:flex;align-items:center;justify-content:center;gap:7px;font-size:11.5px;font-weight:600;letter-spacing:2px;color:#cfcde0">${inner}</div>`;
  const tab = (l, d, on) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;color:${on ? '#A78BFA' : '#cfcde0'}">
    <div style="width:56px;height:40px;border-radius:13px;${on ? 'background:#262046;' : ''}display:flex;align-items:center;justify-content:center">${ic(on ? '#A78BFA' : '#cfcde0', d)}</div>${l}</div>`;
  return `<div class="ui" style="background:#080912">${statusBar}
  <div style="position:absolute;top:70px;left:30px">${ic('#cfcde0', '<path d="M4 7h16M4 12h16M4 17h16"/>', 24)}</div>
  <div style="position:absolute;top:66px;right:16px;display:flex;gap:9px">${pill(ic('#cfcde0', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5"/>', 14) + 'ANYTIME')}${pill(ic('#cfcde0', '<path d="M4 9h13l-3-3M20 15H7l3 3"/>', 14) + 'NO')}${pill('•••', 32)}</div>
  <div style="position:absolute;top:150px;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(124,58,237,.45),transparent 65%)"></div>
  <img src="${A('mascot-calm.png')}" style="position:absolute;top:170px;left:50%;transform:translateX(-50%);width:230px;-webkit-mask-image:radial-gradient(circle at 50% 52%,#000 52%,transparent 70%)">
  <div style="position:absolute;top:462px;left:0;right:0;text-align:center;font-size:31px;font-weight:800;line-height:1.12;letter-spacing:-.6px">What task <span style="color:#A78BFA">are you<br>putting off?</span></div>
  <div style="position:absolute;top:548px;left:24px;right:24px;text-align:center;font-size:15px;line-height:1.5;color:#d6d4e4">Tell FOCO what you need to do.<br>I'll break it into small steps and add it to your calendar.</div>
  <div style="position:absolute;top:668px;left:16px;right:16px;height:60px;border-radius:30px;border:1.5px solid rgba(129,140,248,.5);background:#111428;box-shadow:0 0 24px rgba(124,58,237,.25);display:flex;align-items:center;gap:14px;padding:0 6px 0 16px">
    ${ic('#A78BFA', '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 26)}<div style="flex:1;font-size:17px;color:${typed ? '#fff' : '#6d6a8a'}">${typed || 'I need to...'}</div>
    ${ic('#A78BFA', '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', 24)}
    <div style="width:46px;height:46px;border-radius:50%;background:${typed ? 'linear-gradient(135deg,#6366F1,#9333EA)' : '#1c1f36'};display:flex;align-items:center;justify-content:center">${ic(typed ? '#fff' : '#6d6a8a', '<path d="M12 19V5M6 11l6-6 6 6"/>', 22)}</div></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:#080912;border-top:1px solid rgba(255,255,255,.06);display:flex;padding-top:10px">
    ${tab('Chat', '<path d="M4 18l1.5-3.5A7.5 7.5 0 1 1 9 18.6L4 18z"/>', 1)}${tab('Sessions', '<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>')}${tab('You', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}</div>
  <div class="home"></div></div>`;
};

// Chat thread after sending tasks, styled 1:1 on the recorded chat (user bubble, FOCO reply, task card "Added to your sessions")
const chatThread = turns => {
  const ic = (c, d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const pill = (inner, w) => `<div style="height:31px;${w ? 'width:' + w + 'px;' : 'padding:0 13px;'}border-radius:16px;border:1.5px solid rgba(129,140,248,.35);background:#0f1224;display:flex;align-items:center;justify-content:center;gap:7px;font-size:11.5px;font-weight:600;letter-spacing:2px;color:#cfcde0">${inner}</div>`;
  const tab = (l, d, on) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;color:${on ? '#A78BFA' : '#cfcde0'}">
    <div style="width:56px;height:40px;border-radius:13px;${on ? 'background:#262046;' : ''}display:flex;align-items:center;justify-content:center">${ic(on ? '#A78BFA' : '#cfcde0', d)}</div>${l}</div>`;
  const turn = ([said, reply, cat, title, min]) => `
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-bottom:12px"><div style="background:#2b2558;border:1px solid rgba(167,139,250,.35);border-radius:18px;padding:11px 16px;font-size:15.5px">${said}</div>
      <div style="width:30px;height:30px;border-radius:50%;background:#7C3AED;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">S</div></div>
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px"><div style="width:30px;height:30px;border-radius:50%;background:#1b1838;flex:none;overflow:hidden"><img src="${A('mascot-calm.png')}" style="width:30px"></div>
      <div style="background:#141729;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:11px 16px;font-size:15.5px;color:#e6e4f0">${reply}</div></div>
    <div style="margin:0 0 58px 38px;background:#121a24;border:1px solid rgba(52,211,153,.45);border-radius:16px;padding:12px 15px">
      <div style="display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;letter-spacing:1.6px;color:#34D399"><span style="width:7px;height:7px;border-radius:50%;background:#34D399"></span>${cat}<span style="margin-left:auto;color:#9a97b0;font-weight:500;letter-spacing:0;font-size:12px">${min}</span></div>
      <div style="font-size:16px;font-weight:600;margin:6px 0 7px">${title}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#34D399">${check('#34D399', '#0b2b22', 14)}Added to your sessions</div></div>`;
  return `<div class="ui" style="background:#080912">${statusBar}
  <div style="position:absolute;top:70px;left:30px">${ic('#cfcde0', '<path d="M4 7h16M4 12h16M4 17h16"/>', 24)}</div>
  <div style="position:absolute;top:66px;right:16px;display:flex;gap:9px">${pill(ic('#cfcde0', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5"/>', 14) + 'ANYTIME')}${pill(ic('#cfcde0', '<path d="M4 9h13l-3-3M20 15H7l3 3"/>', 14) + 'NO')}${pill('•••', 32)}</div>
  <div style="position:absolute;top:126px;left:14px;right:14px">${turns.map(turn).join('')}</div>
  <div style="position:absolute;top:668px;left:16px;right:16px;height:60px;border-radius:30px;border:1.5px solid rgba(129,140,248,.5);background:#111428;display:flex;align-items:center;gap:14px;padding:0 6px 0 16px">
    ${ic('#A78BFA', '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 26)}<div style="flex:1;font-size:17px;color:#6d6a8a">I need to...</div>
    ${ic('#A78BFA', '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', 24)}
    <div style="width:46px;height:46px;border-radius:50%;background:#1c1f36;display:flex;align-items:center;justify-content:center">${ic('#6d6a8a', '<path d="M12 19V5M6 11l6-6 6 6"/>', 22)}</div></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:#080912;border-top:1px solid rgba(255,255,255,.06);display:flex;padding-top:10px">
    ${tab('Chat', '<path d="M4 18l1.5-3.5A7.5 7.5 0 1 1 9 18.6L4 18z"/>', 1)}${tab('Sessions', '<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>')}${tab('You', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}</div>
  <div class="home"></div></div>`;
};

// demo voice.png still has a 'Get Pro' pill (plan badge, store rule) and an 11:09 low-battery status bar: cover both.
// Not needed once Adi's new voice.png (no Get Pro) is saved in raw/.
const voiceScreen = () => { const k = PW / 1179, raw = fs.existsSync(path.join(__dirname, 'raw', 'voice.png'));
  return img('voice.png') + (raw ? '' : `<div style="position:absolute;left:${Math.round(262 * k)}px;top:${Math.round(196 * k)}px;width:${Math.round(262 * k)}px;height:${Math.round(110 * k)}px;background:#07070c;border-radius:40px"></div><div style="position:absolute;left:0;top:0;width:100%;height:${Math.round(150 * k)}px;background:#07070c"></div><div class="ui" style="background:transparent;height:60px">${statusBar}</div>`); };

// slide 5: three sources on the left, light lines flowing into their tasks (everything converges on the calendar)
const converge = () => {
  // each source icon sits level with the task(s) it produced; short glowing lines run into the tags
  const src = [[ico.mic('#fff', 64), [312]], [ico.type('#fff', 64), [442]], [ico.cam('#fff', 64), [513, 584]]], tagL = PR - 215, D = 140;
  const ys = rows => rows.map(r => Math.round(oy(r)));
  const lines = src.flatMap(([, rows]) => { const t = ys(rows), cy = Math.round(t.reduce((p, q) => p + q) / t.length);
    return t.map(ty => `<path d="M ${40 + D} ${cy} C ${tagL - 70} ${cy}, ${tagL - 70} ${ty}, ${tagL} ${ty}" stroke="#C4B5FD" stroke-opacity=".6" stroke-width="5" fill="none"/>`); }).join('');
  return `<svg style="position:absolute;z-index:3;left:0;top:0" width="${W}" height="${H}"><defs><filter id="lg"><feGaussianBlur stdDeviation="6"/></filter></defs><g filter="url(#lg)" opacity=".8">${lines}</g>${lines}</svg>`
    + src.map(([i, rows]) => { const t = ys(rows), cy = Math.round(t.reduce((p, q) => p + q) / t.length);
      return `<div style="position:absolute;z-index:6;left:40px;top:${cy - D / 2}px;width:${D}px;height:${D}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8B5CF6,#4C1D95);box-shadow:0 0 0 3px rgba(233,213,255,.5),0 0 80px rgba(139,92,246,.7);display:flex;align-items:center;justify-content:center">${i}</div>`; }).join('');
};

// Add task > Sub-tasks, rebuilt 1:1 from Adi's Oct 14 screenshot (5 steps "SUBTASKS ADDED BY FOCO"); raw/subtasks.png wins
const SUBS = [['Open presentation software', '3m'], ['Choose a blank slide template', '5m'], ['Type the main title heading', '8m'], ['Draft three key talking points', '8m'], ['Save the new presentation file', '3m']];
const subtasksScreen = () => {
  if (fs.existsSync(path.join(__dirname, 'raw', 'subtasks.png'))) return img('subtasks.png');
  const x = '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#9a97b0" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const circ = (inner, bg) => `<div style="width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center">${inner}</div>`;
  return `<div class="ui" style="background:#080912">${statusBar}
  <div style="position:absolute;top:56px;left:16px">${circ('<svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>', '#151829')}</div>
  <div style="position:absolute;top:64px;left:0;right:0;text-align:center;font-size:17px;font-weight:600">Add task</div>
  <div style="position:absolute;top:56px;right:16px">${circ(check('#fff', '#151829', 22), '#151829')}</div>
  <div style="position:absolute;top:112px;left:16px;right:16px;border-radius:0 0 18px 18px;background:#0f1222;border:1px solid rgba(255,255,255,.06);border-top:none;padding:10px 16px 14px;display:flex;align-items:center">
    <div style="flex:1"><div style="font-size:16px">Reminder</div><div style="font-size:13px;color:#5e6080;margin-top:4px;line-height:1.35">Get notified 5 min before and at task time</div></div>
    <div style="width:48px;height:28px;border-radius:14px;background:#1a1d30;position:relative"><div style="position:absolute;left:2px;top:2px;width:24px;height:24px;border-radius:50%;background:#fff"></div></div></div>
  <div style="position:absolute;top:208px;left:16px;right:16px;border-radius:18px;background:#0f1222;border:1px solid rgba(255,255,255,.06);padding:16px 16px 14px">
    <div style="display:flex;justify-content:space-between;font-size:16px;margin-bottom:12px">Sub-tasks<span style="color:#7d7a96">5</span></div>
    ${SUBS.map(([t, m], i) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:13px;background:#151829;border:1px solid rgba(255,255,255,.07);margin-bottom:7px">
      <div style="width:22px;height:22px;border-radius:50%;border:1px solid #3a3d58;display:flex;align-items:center;justify-content:center;font-size:11px;color:#7d7a96;flex:none">${i + 1}</div>
      <div style="flex:1"><div style="font-size:14.5px">${t}</div><div style="font-size:12px;color:#7d7a96;margin-top:2px">${m}</div></div>${x}</div>`).join('')}
    <div style="margin-top:4px;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.07);text-align:center;font-size:12px;letter-spacing:2px;color:#6d6f9a">+&nbsp; ADD NEW</div>
    <div style="margin-top:7px;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.07);text-align:center;font-size:12px;letter-spacing:2px;color:#6d6f9a">✦&nbsp; SUBTASKS ADDED BY FOCO</div></div>
  <div style="position:absolute;top:715px;left:16px;right:16px;height:74px;border-radius:18px;background:#141729;padding:16px;font-size:16px;color:#5e6080">Write your notes here...</div>
  <div class="home"></div></div>`;
};

// Focus timer running, rebuilt 1:1 from the recorded timer screen (FOCUSING pill, ring + mascot, time, Pause/Done)
const timerScreen = (task, time = '02:57', frac = .82) => {
  const ic = (c, d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const R = 122, C = 2 * Math.PI * R;
  const tab = (l, d, on) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;color:${on ? '#A78BFA' : '#9b98b0'}">
    <div style="width:56px;height:40px;border-radius:13px;${on ? 'background:#262046;' : ''}display:flex;align-items:center;justify-content:center">${ic(on ? '#A78BFA' : '#cfcde0', d)}</div>${l}</div>`;
  return `<div class="ui" style="background:#080912">${statusBar}
  <div style="position:absolute;top:62px;left:16px;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:16px;background:#10141f;font-size:12px;font-weight:700;letter-spacing:2px;color:#34D399"><span style="width:8px;height:8px;border-radius:50%;background:#34D399"></span>FOCUSING</div>
  <div style="position:absolute;top:66px;right:64px">${ic('#cfcde0', '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>', 22)}</div>
  <div style="position:absolute;top:66px;right:20px">${ic('#cfcde0', '<path d="M6 6l12 12M18 6L6 18"/>', 22)}</div>
  <svg style="position:absolute;left:${196 - R - 10}px;top:${300 - R - 10}px" width="${2 * R + 20}" height="${2 * R + 20}" viewBox="0 0 ${2 * R + 20} ${2 * R + 20}">
    <defs><linearGradient id="tg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/></linearGradient></defs>
    <circle cx="${R + 10}" cy="${R + 10}" r="${R}" stroke="#1b1e2e" stroke-width="7" fill="none"/>
    <circle cx="${R + 10}" cy="${R + 10}" r="${R}" stroke="url(#tg)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${C * frac} ${C}" transform="rotate(-90 ${R + 10} ${R + 10})"/>
    <circle cx="${R + 10}" cy="${R + 10}" r="${R - 26}" fill="#14162a"/></svg>
  <img src="${A('mascot-calm.png')}" style="position:absolute;left:${196 - 70}px;top:${300 - 74}px;width:140px;-webkit-mask-image:radial-gradient(circle at 50% 52%,#000 52%,transparent 70%)">
  <div style="position:absolute;top:452px;left:0;right:0;text-align:center;font-size:56px;font-weight:700;letter-spacing:1px">${time}</div>
  <div style="position:absolute;top:522px;left:0;right:0;text-align:center;font-size:15px;color:#e6e4f0">remaining</div>
  <div style="position:absolute;top:552px;left:0;right:0;text-align:center;font-size:18px">${task}</div>
  <div style="position:absolute;top:628px;left:0;right:0;text-align:center;font-size:14px;font-style:italic;color:#7d7a96">Stay with it. Great things take focus.</div>
  <div style="position:absolute;top:666px;left:16px;right:16px;display:flex;gap:12px">
    <div style="flex:1;height:52px;border-radius:26px;border:1.5px solid #2a2e48;display:flex;align-items:center;justify-content:center;font-size:17px">Pause</div>
    <div style="flex:1;height:52px;border-radius:26px;background:linear-gradient(90deg,#6366F1,#9333EA);display:flex;align-items:center;justify-content:center;font-size:17px">Done</div></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:#080912;border-top:1px solid rgba(255,255,255,.06);display:flex;padding-top:10px">
    ${tab('Chat', '<path d="M4 18l1.5-3.5A7.5 7.5 0 1 1 9 18.6L4 18z"/>')}${tab('Sessions', '<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>', 1)}${tab('You', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')}</div>
  <div class="home"></div></div>`;
};

// "Your stats", rebuilt 1:1 from Adi's Oct 14 screenshot (streak card, Today/This week/All time, Tasks & steps) plus the
// Focus sessions card from the recording. Sample-user numbers (store screenshots show a typical week, like Cal AI does).
const STATS = { streak: 5, longest: 9, today: '25m', week: '76m', all: '312m', tasks: [34, 12, 22, 8], subs: [98, 41, 57, 21], sessions: [5, 4, 1] };
const statsScreen = (d = STATS) => {
  const ic = (c, dd, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${dd}</svg>`;
  const card = inner => `<div style="border-radius:18px;background:#111426;border:1px solid rgba(255,255,255,.06);padding:16px 18px;margin-bottom:12px">${inner}</div>`;
  const nums = (v, cols = ['#fff', '#34D399', '#A78BFA', '#818CF8']) => `<div style="display:flex">${v.map((n, i) => `<div style="flex:1"><div style="font-size:30px;font-weight:600;color:${cols[i]}">${n}</div><div style="font-size:12px;letter-spacing:1px;color:#b8b5c8;margin-top:2px">${['Total', 'Done', 'Left', 'Last 7d'][i]}</div></div>`).join('')}</div>`;
  const R = 46, C = 2 * Math.PI * R, fin = d.sessions[1] / d.sessions[0];
  return `<div class="ui" style="background:#080912">${statusBar}
  <div style="position:absolute;top:66px;left:22px">${ic('#cfcde0', '<path d="M6 6l12 12M18 6L6 18"/>', 24)}</div>
  <div style="position:absolute;top:66px;left:0;right:0;text-align:center;font-size:18px;font-weight:600">Your stats</div>
  <div style="position:absolute;top:66px;right:22px">${ic('#cfcde0', '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>', 24)}</div>
  <div style="position:absolute;top:112px;left:12px;right:12px">
    ${card(`<div style="display:flex;align-items:center;gap:16px"><div class="emo" style="width:56px;height:56px;border-radius:50%;background:#3a3420;border:1px solid #7a6a2a;display:flex;align-items:center;justify-content:center;font-size:24px">🔥</div>
      <div><div style="font-size:12px;letter-spacing:2.5px;color:#b8b5c8">CURRENT STREAK</div><div style="font-size:26px;font-weight:700;margin:2px 0">${d.streak} days</div><div style="font-size:15px;color:#b8b5c8">Longest: ${d.longest} days</div></div></div>`)}
    <div style="display:flex;gap:8px;margin-bottom:12px">${[['TODAY', d.today, '#34D399'], ['THIS WEEK', d.week, '#A78BFA'], ['ALL TIME', d.all, '#818CF8']].map(([l, v, c]) => `<div style="flex:1;border-radius:16px;background:#111426;border:1px solid rgba(255,255,255,.06);padding:12px 12px"><div style="font-size:11px;letter-spacing:1.6px;color:#b8b5c8"><span style="color:${c}">●</span> ${l}</div><div style="font-size:20px;font-weight:600;margin-top:6px">${v}</div></div>`).join('')}</div>
    ${card(`<div style="font-size:12px;letter-spacing:2.5px;color:#b8b5c8">TASKS &amp; STEPS</div><div style="font-size:14px;color:#8d8aa6;margin:4px 0 12px">Totals, what's done, and what's left</div>
      <div style="font-size:11px;letter-spacing:2px;color:#cfcde0;font-weight:700;margin-bottom:6px">TASKS</div>${nums(d.tasks)}
      <div style="height:1px;background:rgba(255,255,255,.08);margin:12px 0"></div>
      <div style="font-size:11px;letter-spacing:2px;color:#cfcde0;font-weight:700;margin-bottom:6px">SUBTASKS</div>${nums(d.subs)}`)}
    ${card(`<div style="font-size:12px;letter-spacing:2.5px;color:#b8b5c8">FOCUS SESSIONS</div><div style="font-size:14px;color:#8d8aa6;margin:4px 0 10px">${Math.round(fin * 100)}% finished</div>
      <div style="display:flex;align-items:center;gap:22px"><svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r="${R}" stroke="#ef4444" stroke-width="10" fill="none"/>
        <circle cx="55" cy="55" r="${R}" stroke="#8B5CF6" stroke-width="10" fill="none" stroke-dasharray="${C * fin} ${C}" transform="rotate(-90 55 55)"/>
        <text x="55" y="58" text-anchor="middle" fill="#fff" font-size="24" font-weight="700" font-family="Inter">${d.sessions[0]}</text><text x="55" y="76" text-anchor="middle" fill="#b8b5c8" font-size="9" letter-spacing="1.5" font-family="Inter">SESSIONS</text></svg>
        <div style="font-size:15px;line-height:1.8"><div><span style="color:#8B5CF6">●</span> Completed <b>${d.sessions[1]}</b></div><div><span style="color:#ef4444">●</span> Abandoned <b>${d.sessions[2]}</b></div><div><span style="color:#818CF8">●</span> Finished <b>${Math.round(fin * 100)}%</b></div></div></div>`)}
  </div><div class="home"></div></div>`;
};

// ---------- the story ----------
const T = [ // [emoji, title, meta, icon bg]
  ['💊', 'Call dentist', '10m • Health', '#1f3a3a'], ['🏠', 'Clean the kitchen', '30m • Home', '#3d2a22'], ['🏠', 'Groom the dog', '20m • Home', '#3d2a22'], ['🏠', 'Make dinner', '30m • Home', '#3d2a22']];
const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';

const slides = [
  // 1 STUCK: the freelancer stuck before she starts, tasks circling her; FOCO asks "What task are you putting off?"
  () => { const top = 1180, k = PW / 393; // the real input bar, enlarged, pops out of the screen
    return `${head('Stuck before<br><em>you start?</em>', 'FOCO beats procrastination<br>and task paralysis.')}
    <div style="position:absolute;z-index:2;left:-300px;top:700px;width:1200px;height:1100px;background:radial-gradient(circle at 50% 45%,rgba(167,139,250,.38),transparent 62%)"></div>
    <svg style="position:absolute;z-index:2;left:0;top:0" width="${W}" height="${H}"><ellipse cx="600" cy="1000" rx="440" ry="290" transform="rotate(-14 600 1000)" fill="none" stroke="#C4B5FD" stroke-opacity=".35" stroke-width="3" stroke-dasharray="14 18"/></svg>
    <div class="person" style="left:-160px;top:700px;width:1080px;height:1340px;-webkit-mask-image:radial-gradient(ellipse 56% 52% at 46% 44%,#000 66%,transparent 100%)"><img src="${A('rd-head-cut.png')}" style="width:1440px;left:-330px;top:-332px;filter:saturate(.78) hue-rotate(-8deg) brightness(.97) drop-shadow(-5px -3px 8px rgba(233,213,255,.95)) drop-shadow(0 0 60px rgba(167,139,250,.65))"></div>
    ${[['Reply to emails', 235, 1], ['Invoice client', 280, .5], ['New presentation', 345, .8]].map(([t, a, d]) => { const r = a * Math.PI / 180, q = -14 * Math.PI / 180, ex = 440 * Math.cos(r), ey = 290 * Math.sin(r), x = 600 + ex * Math.cos(q) - ey * Math.sin(q), y = 1000 + ex * Math.sin(q) + ey * Math.cos(q);
      return `<div class="chip" style="left:${Math.round(x)}px;top:${Math.round(y)}px;transform:translate(-50%,-50%) rotate(${(a - 280) / 9}deg) scale(${.8 + d * .2});opacity:${.45 + d * .55};filter:blur(${(1 - d) * 5}px);font-size:42px;z-index:6">${tr(t)}</div>`; }).join('')}
    ${phone(PR, chatHome(), top)}
    <div class="glass" style="left:120px;top:${Math.round(top + 20 + 668 * k) - 26}px;width:1170px;height:${Math.round(60 * k * 1.25)}px;border-radius:999px;display:flex;align-items:center;gap:30px;padding:0 18px 0 46px;background:#111428;box-shadow:0 0 0 3px rgba(167,139,250,.75),0 0 120px rgba(124,58,237,.6),0 40px 100px rgba(0,0,0,.7)">
      ${ico.cam('#A78BFA', 62)}<div style="flex:1;font-size:50px;color:#8e8aad">I need to...<span style="display:inline-block;width:4px;height:56px;background:#C4B5FD;margin-left:4px;vertical-align:-10px"></span></div>${ico.mic('#A78BFA', 58)}
      <div style="width:118px;height:118px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#9333EA);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(147,51,234,.7)">${ico.send(58)}</div></div>`; },
  // 2 DUMP: the thoughts from slide 1 get typed into FOCO; each comes back as a task in her sessions
  () => { const k = PW / 393, top = PY;
    const turns = [['Clean the kitchen', "I've got your kitchen cleanup all set up!", 'HOME', 'Clean the kitchen', '30 min'], ['call dentist tomorrow 7 am', 'Dentist call is scheduled for tomorrow morning!', 'HEALTH', 'Call dentist', '10 min']];
    return `${head('Get it out<br><em>of your head.</em>', 'Type it, snap it or say it.<br>It goes straight into your calendar.')}
    <div style="position:absolute;z-index:8;left:0;right:0;top:720px;display:flex;justify-content:center;align-items:center;gap:16px">${[[ico.type('#E9D5FF', 40), 'Type'], [ico.cam('#E9D5FF', 40), 'Snap'], [ico.mic('#E9D5FF', 40), 'Say']].map(([i, t]) => `<div class="chip" style="position:static;font-size:38px;padding:16px 28px">${i}${tr(t)}</div>`).join('')}
      <svg width="60" height="40" viewBox="0 0 60 40"><path d="M4 20h46M38 8l14 12-14 12" stroke="#C4B5FD" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="chip" style="position:static;font-size:38px;padding:16px 30px;background:linear-gradient(90deg,#6366F1,#9333EA);border:none">${ico.cal('#fff', 40)}${tr('Your calendar')}</div></div>
    <div style="position:absolute;z-index:2;left:-300px;top:760px;width:1200px;height:1100px;background:radial-gradient(circle at 50% 45%,rgba(167,139,250,.38),transparent 62%)"></div>
    <div class="person" style="left:-160px;top:760px;width:1080px;height:1500px;-webkit-mask-image:radial-gradient(ellipse 56% 52% at 46% 46%,#000 66%,transparent 100%)"><img src="${A('rd-type-cut.png')}" style="width:1300px;left:-71px;top:-175px;filter:saturate(.78) hue-rotate(-8deg) brightness(.97) drop-shadow(-5px -3px 8px rgba(233,213,255,.95)) drop-shadow(0 0 60px rgba(167,139,250,.65))"></div>
    ${phone(PR, chatThread(turns), top)}
    <div class="glass" style="left:400px;top:${Math.round(top + 20 + 222 * k)}px;width:880px;padding:40px 50px;box-shadow:0 0 0 3px rgba(52,211,153,.7),0 0 120px rgba(52,211,153,.32),0 50px 110px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:700;letter-spacing:3px;color:#34D399"><span style="width:16px;height:16px;border-radius:50%;background:#34D399"></span>HOME<span style="margin-left:auto;color:#a9a6bf;font-weight:500;letter-spacing:0;font-size:34px">30 min</span></div>
      <div style="font-size:56px;font-weight:600;margin:14px 0 16px">Clean the kitchen</div>
      <div style="display:flex;align-items:center;gap:16px;font-size:38px;color:#34D399">${check('#34D399', '#0b2b22', 42)}Added to your sessions</div></div>`; },
  // 2 SCAN: the scanner is the hero: straightened paper in the camera, bold glowing brackets + beam, tasks flying out
  () => { const fx = ox(PC, 26), fy = oy(150), fw = PW * 341 / 393, fh = PW * 420 / 393;
    return `${head('Snap your<br><em>paper list.</em>', 'FOCO pulls every task off the page<br>and into your calendar.')}
    ${phone(PC, camera())}
    ${scanner(fx, fy, fw, fh)}
    <div style="position:absolute;z-index:8;left:${fx + fw / 2}px;top:${fy + fh + 30}px;transform:translateX(-50%);display:flex;align-items:center;gap:14px;font-size:36px;font-weight:700;padding:16px 30px;border-radius:999px;background:linear-gradient(90deg,#6366F1,#9333EA);box-shadow:0 0 50px rgba(147,51,234,.7);white-space:nowrap">${tr('✦ Found 8 tasks')}</div>
    ${[['Groom the dog', 30, 870, -5, 'l'], ['Make dinner', 30, 1170, 4, 'r'], ['Drink enough water', 30, 2300, -3, 'l'], ['Go shopping', 30, 2420, 3, 'r']].map(([t, m, y, r, side]) => `<div class="chip w" style="${side === 'l' ? 'left' : 'right'}:${m}px;top:${y}px;transform:rotate(${r}deg);z-index:9">${check('#7C3AED', '#fff', 40)}${tr(t)}</div>`).join('')}`; },
  // 3 SAY: she stands in front of the FOCO phone, recording a voice note on hers; sound waves run up to the recorder card
  () => { const hx = 850, hy = 1960; // her phone (in hand) on the slide: source (1500,1800) at scale .6
    return `${head('Or just<br><em>say it.</em>', 'Talk. It lands in your calendar,<br>with a reminder.')}
    ${phone(PR, voiceScreen())}
    <div style="position:absolute;z-index:5;left:-300px;top:900px;width:1400px;height:1600px;background:radial-gradient(circle at 40% 45%,rgba(167,139,250,.35),transparent 60%)"></div>
    <div class="person notint" style="z-index:6;left:-60px;top:900px;width:1100px;height:1968px;-webkit-mask-image:linear-gradient(#000 70%,transparent 94%)"><img src="${A('rd-phone-cut.png')}" style="width:1080px;left:0;top:0;filter:saturate(.75) drop-shadow(-5px -3px 8px rgba(233,213,255,.95)) drop-shadow(0 0 60px rgba(167,139,250,.65))"></div>
    <svg style="position:absolute;z-index:7;left:0;top:0;overflow:visible" width="${W}" height="${H}">
      ${[0, 1, 2].map(i => { const r = 70 + i * 50; return `<path d="M ${hx + r * .2} ${hy - r} A ${r} ${r} 0 0 1 ${hx + r} ${hy - r * .2}" stroke="#E9D5FF" stroke-opacity="${.95 - i * .25}" stroke-width="10" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 14px #8B5CF6)"/>`; }).join('')}
      <path d="M ${hx + 160} ${hy - 200} C ${hx + 240} ${hy - 330}, ${hx + 150} ${1560}, ${hx + 120} 1520" stroke="#C4B5FD" stroke-opacity=".55" stroke-width="4" stroke-dasharray="12 14" fill="none"/></svg>
    ${recorder(560, 1080, 720)}
    ${taskCard(40, 2330, 760, 'HEALTH', 'Call dentist', '10 min', 'Tomorrow · 7:00 AM')}`; },
  // 4 DAY: everything captured lands on the calendar
  () => `${head('It all lands<br><em>in your day.</em>', 'Typed, snapped or said.<br>One calendar.')}
    ${phone(PR, dayView([['MORNING', sun, [T[0]]], ['ANYTIME', clock, [T[1], T[2], T[3]]]]))}
    ${[[ico.mic('#fff', 40), 'Said', 312], [ico.type('#fff', 40), 'Typed', 442], [ico.cam('#fff', 40), 'Snapped', 513], [ico.cam('#fff', 40), 'Snapped', 584]].map(([i, t, y]) => `<div class="chip" style="right:${W - PR - 40}px;top:${Math.round(oy(y)) - 46}px;font-size:38px;padding:16px 30px">${i}${tr(t)}</div>`).join('')}
    ${converge()}`,
  // 5 STEPS: the heavy 60-min task flows into a big, readable card of FOCO's 5 AI steps (step 1 highlighted)
  () => { const top = 1330, r1 = top + 150;
    return `${head('Big task?<br><em>Tiny steps.</em>', 'FOCO\'s AI breaks it into steps<br>you can actually start.')}
    <div class="glass" style="left:60px;top:700px;width:600px;padding:38px 42px;transform:rotate(-4deg);background:#151229">
      <div style="font-size:28px;font-weight:700;letter-spacing:3px;color:#A78BFA">${tr('WORK · 60 MIN')}</div>
      <div style="font-size:52px;font-weight:700;line-height:1.15;margin-top:12px">${tr('Make a new presentation')}</div></div>
    ${phone(PR, subtasksScreen())}
    <svg style="position:absolute;z-index:5;left:0;top:0" width="${W}" height="${H}"><defs><filter id="ag"><feGaussianBlur stdDeviation="5"/></filter></defs>
      <path d="M 180 1010 C 120 1180, 90 ${r1}, 32 ${r1}" stroke="#C4B5FD" stroke-width="6" fill="none" filter="url(#ag)" opacity=".8"/><path d="M 180 1010 C 120 1180, 90 ${r1}, 32 ${r1}" stroke="#E9D5FF" stroke-width="4" fill="none"/></svg>
    <div class="glass" style="left:40px;top:${top}px;width:1240px;padding:40px 44px 30px;background:#11142a;box-shadow:0 0 0 3px rgba(167,139,250,.7),0 0 140px rgba(124,58,237,.55),0 50px 120px rgba(0,0,0,.75)">
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:30px;font-weight:700;letter-spacing:4px;color:#C4B5FD;margin-bottom:24px">✦ 5 TINY STEPS BY FOCO<span style="color:#9a97b0;font-weight:500;letter-spacing:0">27 min total</span></div>
      ${SUBS.map(([t, m], i) => `<div style="display:flex;align-items:center;gap:28px;padding:24px 30px;border-radius:30px;margin-bottom:16px;${i ? 'background:#181b33;border:2px solid rgba(255,255,255,.06)' : 'background:linear-gradient(90deg,rgba(99,102,241,.35),rgba(147,51,234,.35));border:3px solid #A78BFA'}">
        <div style="width:70px;height:70px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;${i ? 'border:3px solid #4a4d6c;color:#b8b5c8' : 'background:#7C3AED'}">${i + 1}</div>
        <div style="flex:1;font-size:48px;font-weight:600">${t}</div>
        <div style="font-size:40px;font-weight:600;color:${i ? '#9a97b0' : '#E9D5FF'}">${m.replace('m', ' min')}</div></div>`).join('')}
      </div>`; },
  // 6 FOCUS: she works; the timer runs on step 1 from slide 6; the real soundscape row pops out
  () => { const sw = 1240;
    return `${head('One task.<br><em>Full focus.</em>', 'A timer and calm sounds<br>to get you through it.')}
    <div style="position:absolute;z-index:2;left:-300px;top:760px;width:1200px;height:1100px;background:radial-gradient(circle at 50% 45%,rgba(167,139,250,.38),transparent 62%)"></div>
    <div class="person" style="left:-160px;top:760px;width:1080px;height:1250px;-webkit-mask-image:radial-gradient(ellipse 56% 52% at 46% 46%,#000 66%,transparent 100%)"><img src="${A('rd-focus-cut.png')}" style="width:1300px;left:-112px;top:105px;filter:saturate(.78) hue-rotate(-8deg) brightness(.97) drop-shadow(-5px -3px 8px rgba(233,213,255,.95)) drop-shadow(0 0 60px rgba(167,139,250,.65))"></div>
    ${phone(PR, timerScreen(SUBS[0][0]))}
    ${cropPop('focus.png', [20, 1805, 1140, 265], 40, 2120, sw)}
    <div style="position:absolute;z-index:8;left:80px;top:2070px;font-size:30px;font-weight:700;letter-spacing:4px;color:#fff;background:linear-gradient(90deg,#6366F1,#9333EA);padding:12px 26px;border-radius:999px;box-shadow:0 10px 30px rgba(124,58,237,.5)">♫ PICK YOUR SOUND</div>`; },
  // 7 MOMENTUM: her, through the day; the real stats screen (sample-user week) with the streak + steps popping out
  () => `${head('Watch your<br><em>momentum grow.</em>', 'Streaks, focus time and<br>every step you finish.')}
    <div style="position:absolute;z-index:2;left:-300px;top:760px;width:1200px;height:1100px;background:radial-gradient(circle at 50% 45%,rgba(167,139,250,.38),transparent 62%)"></div>
    <div class="person" style="left:-160px;top:760px;width:1080px;height:1500px;-webkit-mask-image:radial-gradient(ellipse 56% 52% at 46% 46%,#000 66%,transparent 100%)"><img src="${A('rd-smile-cut.png')}" style="width:1300px;left:-256px;top:34px;filter:saturate(.78) hue-rotate(-8deg) brightness(.97) drop-shadow(-5px -3px 8px rgba(233,213,255,.95)) drop-shadow(0 0 60px rgba(167,139,250,.65))"></div>
    ${phone(PR, statsScreen())}
    <div class="glass" style="left:440px;top:${Math.round(oy(112)) - 20}px;width:840px;padding:34px 44px;display:flex;align-items:center;gap:34px;background:#14111f;box-shadow:0 0 0 3px rgba(196,181,253,.8),0 0 120px rgba(124,58,237,.55),0 40px 100px rgba(0,0,0,.7)">
      <div class="emo" style="width:120px;height:120px;border-radius:50%;background:#3a3420;border:2px solid #a8903a;display:flex;align-items:center;justify-content:center;font-size:58px;flex:none">🔥</div>
      <div><div style="font-size:28px;letter-spacing:4px;color:#d9d3ea;font-weight:700">CURRENT STREAK</div><div style="font-size:84px;font-weight:700;line-height:1.05">${STATS.streak} days</div></div></div>
    <div class="glass" style="left:40px;top:2250px;width:560px;padding:34px 42px;background:#130f26;transform:rotate(-3deg)">
      <div style="font-size:28px;letter-spacing:3px;color:#A78BFA;font-weight:700">STEPS DONE</div><div style="font-size:110px;font-weight:700;line-height:1.05">${STATS.subs[3]}</div><div style="font-size:34px;color:#C9C1E0">in the last 7 days</div></div>`,
];

// one light stream running through every slide near the bottom: the thread of the story
// one light stream through every frame near the bottom. Each segment is an S-curve whose end tangent equals the next
// segment's start tangent (c2 and the next c1 mirror around the join), so it flows across frame edges without a kink.
const stream = FW => { const y0 = 2700, A = 120, D = FW * .33; let d = `M -60 ${y0}`;
  for (let i = 0; i < N; i++) { const x = i * FW; d += ` C ${x + D} ${y0 - A}, ${x + FW - D} ${y0 + A}, ${x + FW} ${y0}`; }
  d += ` C ${N * FW + D} ${y0 - A}, ${N * FW + 60} ${y0}, ${N * FW + 120} ${y0}`;
  return `<svg style="position:absolute;left:0;top:0;z-index:1" width="${FW * N}" height="${H}"><defs><filter id="sb"><feGaussianBlur stdDeviation="10"/></filter></defs>
  <path d="${d}" stroke="#A78BFA" stroke-opacity=".7" stroke-width="26" fill="none" filter="url(#sb)"/><path d="${d}" stroke="#F3E8FF" stroke-opacity=".85" stroke-width="4" fill="none"/></svg>`; };
const bgs = FW => `<div style="position:absolute;left:0;top:${H - 1100}px;width:${FW * N}px;height:1100px;background:linear-gradient(rgba(124,58,237,0),rgba(124,58,237,.34) 55%,rgba(124,58,237,.5))"></div>` // one continuous floor glow: no dark seams between frames
  + IDS.map((_, i) => `<div class="bg" style="left:${i * FW}px;width:${FW}px;background:radial-gradient(1000px 800px at 50% 100%,rgba(124,58,237,.28),transparent 70%),radial-gradient(800px 700px at ${i % 2 ? 0 : 100}% 70%,rgba(192,38,211,.2),transparent 70%)"></div>`).join('');

// layouts: ios = 1320x2868 frames; android = 9:16 frames (1613x2868 -> 1080x1920): same slide in the middle, the
// background and the stream run edge to edge, nothing is padded.
module.exports = { css, slides, bgs, stream, IDS, W, H, url, head, phone, timerScreen, chatHome, dayView, sun, clock, cropPop, ico, check, A, PW, PH, PY, PC, PR, oy, ox }; // new-slides.js reuses the helpers
const SUFFIX = LANG === 'en' ? '' : '-' + LANG; // Spanish goes to Apple-es/ and Android-es/, never over the English set
const LAYOUTS = { ios: { FW: W, dir: 'Apple' + SUFFIX }, android: { FW: Math.round(H * 9 / 16), dir: 'Android' + SUFFIX, size: [1080, 1920] } };
if (require.main === module) (async () => {
  const WORK = path.join(__dirname, 'work'); fs.mkdirSync(WORK, { recursive: true }); // scratch output; out/ holds only the slides
  const { execFileSync } = require('child_process'); const FF = require(path.join(__dirname, '..', 'node_modules', 'ffmpeg-static'));
  const browser = await chromium.launch();
  for (const [name, L] of Object.entries(LAYOUTS)) {
    const off = (L.FW - W) / 2, clipCss = '.slide{overflow:visible}' // shadows/glows flow across frame edges in both layouts (no brightness step at seams);
    const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${css}body{width:${L.FW * N}px}${clipCss}</style></head><body>
    ${bgs(L.FW)}${stream(L.FW)}${slides.map((s, i) => `<div class="slide" style="left:${i * L.FW + off}px">${s()}</div>`).join('')}</body></html>`;
    const file = path.join(WORK, `panorama-${name}${SUFFIX}.html`); fs.writeFileSync(file, html);
    const page = await browser.newPage({ viewport: { width: L.FW * N, height: H }, deviceScaleFactor: 1 });
    await page.goto(url(file)); await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready);
    const outDir = path.join(__dirname, L.dir); fs.mkdirSync(outDir, { recursive: true });
    for (let i = 0; i < N; i++) {
      const tmp = path.join(WORK, `${name}-0${i + 1}-${IDS[i]}.png`), dst = path.join(outDir, name === 'ios' ? `FINAL-0${i + 1}.png` : `0${i + 1}-${IDS[i]}.png`);
      await page.screenshot({ path: tmp, timeout: 180000, clip: { x: i * L.FW, y: 0, width: L.FW, height: H } });
      if (L.size) execFileSync(FF, ['-loglevel', 'error', '-y', '-i', tmp, '-vf', `scale=${L.size[0]}:${L.size[1]}:flags=lanczos`, tmp + '.s.png']);
      for (let t = 0; t < 8; t++) { try { fs.copyFileSync(L.size ? tmp + '.s.png' : tmp, dst); break; } catch (e) { await new Promise(r => setTimeout(r, 700)); } } // Explorer can hold the file
      console.log(dst);
    }
    await page.screenshot({ path: path.join(WORK, `preview-${name}.jpg`), quality: 80 });
    execFileSync(FF, ['-loglevel', 'error', '-y', '-i', path.join(WORK, `preview-${name}.jpg`), '-vf', 'scale=3200:-1', path.join(WORK, `preview-${name}-small.jpg`)]);
    await page.close();
  }
  await browser.close();
})();
