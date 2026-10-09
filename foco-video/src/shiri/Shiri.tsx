// Promo video for חשמל שירי (Shiri Electric), Bialik 63 Ramat Gan. 1920x1080, Hebrew VO.
// Assets: public/shiri/{img,vo}/, music public/shiri/music.wav (scripts/make-music.js)
// VO + word timings: shiri-video/word-timings.py -> public/shiri/vo/{*.mp3,timings.json}
import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";

export const SHIRI_FPS = 30;
const FONT = "Rubik";

const fontHandle = delayRender("rubik");
new FontFace(FONT, `url(${staticFile("fonts/Rubik.ttf")})`, { weight: "300 900" })
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(fontHandle);
  });

const C = {
  bg: "#FBF8F3",
  ink: "#1F1B19",
  muted: "#6E6662",
  brand: "#EF4923",
  brandDeep: "#C8361A",
  soft: "rgba(239, 73, 35, 0.10)",
  card: "#FFFFFF",
};

// VO durations (ffprobe) and lead/tail padding per scene, seconds
const LEAD = 0.4;
const SCENES = [
  { id: "intro", vo: 8.856, lead: 0.7, tail: 0.5 },
  { id: "brand", vo: 2.184, lead: 0.3, tail: 0.6 },
  { id: "cats", vo: 8.112, lead: LEAD, tail: 0.7 },
  { id: "range", vo: 5.976, lead: LEAD, tail: 0.6 },
  { id: "trust", vo: 4.896, lead: LEAD, tail: 0.7 },
  { id: "values", vo: 7.728, lead: LEAD, tail: 0.8 },
  { id: "cta", vo: 14.592, lead: LEAD, tail: 3.0 },
] as const;
type SceneId = (typeof SCENES)[number]["id"];

const sceneFrames = SCENES.map((s) => Math.ceil((s.lead + s.vo + s.tail) * SHIRI_FPS));
export const SHIRI_TOTAL = sceneFrames.reduce((a, b) => a + b, 0);

const img = (f: string) => staticFile(`shiri/img/${f}`);

// ---------- helpers ----------

// Seconds since this scene's VO started (negative during lead)
const useVoTime = (lead: number) => {
  const frame = useCurrentFrame();
  return frame / SHIRI_FPS - lead;
};

// 0..1 spring that starts at VO time `at` (seconds)
const usePop = (lead: number, at: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round((lead + at) * fps), fps, config: { damping, mass: 0.7 } });
};

const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", right: -380 + drift, top: -520, background: "radial-gradient(circle, rgba(239,73,35,0.16) 0%, rgba(239,73,35,0) 65%)" }} />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", left: -360 - drift, bottom: -480, background: "radial-gradient(circle, rgba(239,73,35,0.10) 0%, rgba(239,73,35,0) 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: C.brand }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC<{ scale?: number; color?: string }> = ({ scale = 1, color = C.brand }) => (
  <div style={{ direction: "rtl", display: "inline-flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1, whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44 * scale, color: "#626062", alignSelf: "flex-end", marginLeft: 0, marginBottom: 6 * scale, direction: "rtl" }}>
      משנת 1958
    </div>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 190 * scale, color, letterSpacing: -4 * scale }}>חשמל שירי</div>
  </div>
);

const ProductCard: React.FC<{ src: string; size: number; style?: React.CSSProperties }> = ({ src, size, style }) => (
  <div style={{ width: size, height: size, background: C.card, borderRadius: size * 0.14, boxShadow: "0 18px 50px rgba(60,30,20,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", ...style }}>
    <Img src={src} style={{ width: "84%", height: "84%", objectFit: "contain" }} />
  </div>
);

const Ltr: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ direction: "ltr", unicodeBidi: "isolate", display: "inline-block" }}>{children}</span>
);

const PinIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.brand }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
);
const PhoneIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.brand }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" /></svg>
);
const ClockIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.brand }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3.5 2" /></svg>
);
const GlobeIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.brand }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19" /></svg>
);
const CheckIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill={C.brand} /><path d="M7 12.5l3.2 3.2L17.5 8.5" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ---------- scenes ----------

const ALL_PRODUCTS = [
  "kitchen-5.jpg", "audio-5.jpg", "care-3.jpg", "tools-6.jpg", "climate-3.jpg", "light-4.jpg",
  "kitchen-4.jpg", "care-2.jpg", "audio-6.jpg", "tools-4.jpg", "kitchen-2.jpg", "light-3.jpg",
  "care-6.jpg", "climate-2.jpg", "kitchen-6.png", "audio-2.png", "light-6.jpg", "tools-3.jpg",
];

const ProductRibbon: React.FC<{ y: number; speed: number; size: number; offset?: number; opacity?: number }> = ({ y, speed, size, offset = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const gap = 36;
  const w = (size + gap) * ALL_PRODUCTS.length;
  const x = (((frame * speed + offset) % w) + w) % w;
  return (
    <div style={{ position: "absolute", top: y, left: 0, width: 1920, height: size + 80, overflow: "visible", opacity }}>
      {[0, 1].map((k) => (
        <div key={k} style={{ position: "absolute", top: 20, left: x - w * k, display: "flex", gap }}>
          {ALL_PRODUCTS.map((p) => <ProductCard key={p} src={img(p)} size={size} />)}
        </div>
      ))}
    </div>
  );
};

const Intro: React.FC<{ lead: number }> = ({ lead }) => {
  const t = useVoTime(lead);
  const yearIn = usePop(lead, -0.2);
  const streetIn = usePop(lead, 3.0);
  const oneIn = usePop(lead, 5.85);
  const beatA = interpolate(t, [2.75, 3.05], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beatB = interpolate(t, [5.55, 5.85], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.ink }}>
      {/* beat A: since 1958 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: beatA }}>
        <div style={{ fontWeight: 700, fontSize: 70, color: C.muted, opacity: yearIn, transform: `translateY(${(1 - yearIn) * 30}px)` }}>משנת</div>
        <div style={{ fontWeight: 900, fontSize: 380, lineHeight: 0.95, color: C.brand, letterSpacing: -10, transform: `scale(${0.7 + yearIn * 0.3})`, opacity: yearIn }}>
          <Ltr>1958</Ltr>
        </div>
      </AbsoluteFill>
      {/* beat B: Bialik 63, Ramat Gan (street-sign card) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: streetIn * beatB }}>
        <div style={{ transform: `scale(${0.85 + streetIn * 0.15}) rotate(${(1 - streetIn) * -4}deg)`, background: C.ink, color: "#fff", borderRadius: 36, padding: "54px 110px", border: "10px solid #fff", outline: `6px solid ${C.ink}`, boxShadow: "0 30px 80px rgba(30,20,15,0.25)", textAlign: "center" }}>
          <div style={{ fontWeight: 400, fontSize: 64, opacity: 0.8 }}>רחוב</div>
          <div style={{ fontWeight: 900, fontSize: 190, lineHeight: 1 }}>ביאליק <Ltr>63</Ltr></div>
        </div>
        <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 18, fontWeight: 700, fontSize: 76, opacity: interpolate(t, [4.5, 4.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <PinIcon size={72} /> רמת גן
        </div>
      </AbsoluteFill>
      {/* beat C: one address for electrical goods */}
      <AbsoluteFill style={{ opacity: oneIn }}>
        <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", transform: `translateY(${(1 - oneIn) * 40}px)` }}>
          <div style={{ fontWeight: 500, fontSize: 80, color: C.muted }}>כתובת אחת</div>
          <div style={{ fontWeight: 900, fontSize: 150, lineHeight: 1.05 }}>למוצרי <span style={{ color: C.brand }}>חשמל</span></div>
        </div>
        <ProductRibbon y={560} speed={4} size={300} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ lead: number; dur: number }> = ({ lead, dur }) => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const logo = usePop(lead, 0.0, 12);
  const pulse = 1 + interpolate(frame, [dur - 30, dur], [0, 0.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${interpolate(wipe, [0, 0.5, 1], [0, 100, 100])}%`, left: "auto", background: C.brand, opacity: interpolate(wipe, [0.5, 1], [1, 0], { extrapolateLeft: "clamp" }) }} />
      <div style={{ transform: `scale(${(0.8 + logo * 0.2) * pulse})`, opacity: logo }}>
        <Logo scale={1.5} />
      </div>
    </AbsoluteFill>
  );
};

const CATS = [
  { name: "מטבח", at: 0.58, imgs: ["kitchen-5.jpg", "kitchen-4.jpg", "kitchen-2.jpg"] },
  { name: "חימום וקירור", at: 1.6, imgs: ["climate-4.jpg", "climate-3.jpg", "climate-2.jpg"] },
  { name: "טיפוח", at: 3.07, imgs: ["care-3.jpg", "care-2.jpg", "care-6.jpg"] },
  { name: "מערכות שמע", at: 4.06, imgs: ["audio-5.jpg", "audio-6.jpg", "audio-2.png"] },
  { name: "כלי עבודה", at: 5.31, imgs: ["tools-6.jpg", "tools-4.jpg", "tools-3.jpg"] },
  { name: "תאורה", at: 6.52, imgs: ["light-4.jpg", "light-3.jpg", "light-6.jpg"] },
];

const CatTile: React.FC<{ lead: number; cat: (typeof CATS)[number]; active: boolean }> = ({ lead, cat, active }) => {
  const p = usePop(lead, cat.at - 0.1);
  const W = 540, H = 400;
  return (
    <div style={{ width: W, height: H, background: C.card, borderRadius: 36, boxShadow: active ? "0 26px 70px rgba(239,73,35,0.28)" : "0 16px 44px rgba(60,30,20,0.10)", border: `5px solid ${active ? C.brand : "transparent"}`, opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + p * 0.1 + (active ? 0.03 : 0)})`, position: "relative", overflow: "hidden", direction: "rtl" }}>
      <div style={{ position: "absolute", top: 26, right: 32, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: active ? C.brand : C.ink }}>{cat.name}</div>
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, direction: "ltr" }}>
        <Img src={img(cat.imgs[2])} style={{ width: 130, height: 150, objectFit: "contain" }} />
        <Img src={img(cat.imgs[0])} style={{ width: 230, height: 260, objectFit: "contain" }} />
        <Img src={img(cat.imgs[1])} style={{ width: 130, height: 150, objectFit: "contain" }} />
      </div>
    </div>
  );
};

const Cats: React.FC<{ lead: number }> = ({ lead }) => {
  const t = useVoTime(lead);
  const activeIdx = CATS.reduce((acc, c, i) => (t >= c.at - 0.1 ? i : acc), -1);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 540px)", gap: 44 }}>
        {CATS.map((c, i) => <CatTile key={c.name} lead={lead} cat={c} active={i === activeIdx && t < 7.6} />)}
      </div>
    </AbsoluteFill>
  );
};

const BRANDS = ["BRAUN", "PANASONIC", "SONY", "JBL", "PHILIPS", "WORX", "REMINGTON", "WESTINGHOUSE", "HYUNDAI", "BLACKROSE"];

const Range: React.FC<{ lead: number }> = ({ lead }) => {
  const frame = useCurrentFrame();
  const t = useVoTime(lead);
  const countIn = usePop(lead, 0.0);
  const n = Math.round(interpolate(t, [0.1, 1.3], [0, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) }));
  const brandsIn = interpolate(t, [1.9, 2.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const price = usePop(lead, 3.6, 10);
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.ink, alignItems: "center" }}>
      <div style={{ marginTop: 130, display: "flex", alignItems: "baseline", gap: 30, opacity: countIn, transform: `scale(${0.85 + countIn * 0.15})` }}>
        <div style={{ fontWeight: 500, fontSize: 84, color: C.muted }}>למעלה מ־</div>
        <div style={{ fontWeight: 900, fontSize: 300, lineHeight: 1, color: C.brand, letterSpacing: -6 }}><Ltr>{n.toLocaleString("en-US")}</Ltr></div>
        <div style={{ fontWeight: 800, fontSize: 110 }}>מוצרים</div>
      </div>
      <div style={{ position: "absolute", top: 560, width: 1920, height: 120, overflow: "hidden", opacity: brandsIn, direction: "ltr" }}>
        <div style={{ position: "absolute", top: 18, left: -((frame * 3) % 1800), display: "flex", gap: 90, whiteSpace: "nowrap" }}>
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => (
            <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 6, color: "#B4ABA6" }}>{b}</div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", top: 760, display: "flex", alignItems: "center", gap: 24, background: C.brand, color: "#fff", borderRadius: 999, padding: "26px 70px", fontWeight: 800, fontSize: 76, transform: `scale(${price}) rotate(${(1 - price) * 8 - 2}deg)`, boxShadow: "0 24px 60px rgba(239,73,35,0.35)" }}>
        <svg width={70} height={70} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" /><circle cx="7.5" cy="7.5" r="1.6" fill="#fff" /></svg>
        במחירים משתלמים
      </div>
    </AbsoluteFill>
  );
};

const TRUST = [
  { text: "מוצרים חדשים", at: 0.75 },
  { text: "אחריות יבואן", at: 2.05 },
  { text: "שירות יבואן", at: 2.65 },
];

const Trust: React.FC<{ lead: number }> = ({ lead }) => {
  const frame = useCurrentFrame();
  const prod = usePop(lead, -0.3);
  const float = Math.sin(frame / 22) * 10;
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 140 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
        {TRUST.map((x) => <TrustRow key={x.text} lead={lead} {...x} />)}
      </div>
      <div style={{ opacity: prod, transform: `translateY(${(1 - prod) * 80 + float}px)` }}>
        <ProductCard src={img("care-5.png")} size={620} />
      </div>
    </AbsoluteFill>
  );
};

const TrustRow: React.FC<{ lead: number; text: string; at: number }> = ({ lead, text, at }) => {
  const p = usePop(lead, at - 0.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 34, opacity: p, transform: `translateX(${(1 - p) * 120}px)` }}>
      <div style={{ transform: `scale(${p})` }}><CheckIcon size={110} /></div>
      <div style={{ fontWeight: 800, fontSize: 104 }}>{text}</div>
    </div>
  );
};

const VALUES = [
  { text: "שירות אישי", at: 1.35 },
  { text: "אמינות", at: 2.6 },
  { text: "מקצועיות", at: 3.59 },
];

const Values: React.FC<{ lead: number }> = ({ lead }) => {
  const t = useVoTime(lead);
  const tag = usePop(lead, 5.45);
  const lift = interpolate(t, [5.2, 5.7], [0, -90], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 80, transform: `translateY(${lift}px)` }}>
        {VALUES.map((v) => <ValueWord key={v.text} lead={lead} {...v} />)}
      </div>
      <div style={{ position: "absolute", top: 690, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`, fontWeight: 500, fontSize: 92, color: C.muted }}>
        כמו שהיה <span style={{ color: C.brand, fontWeight: 800 }}>תמיד.</span>
      </div>
    </AbsoluteFill>
  );
};

const ValueWord: React.FC<{ lead: number; text: string; at: number }> = ({ lead, text, at }) => {
  const p = usePop(lead, at - 0.08);
  const line = usePop(lead, at + 0.15, 20);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
      <div style={{ fontWeight: 900, fontSize: 130 }}>{text}</div>
      <div style={{ height: 14, width: `${line * 100}%`, background: C.brand, borderRadius: 7, marginTop: 6 }} />
    </div>
  );
};

const InfoRow: React.FC<{ lead: number; at: number; icon: React.ReactNode; children: React.ReactNode; big?: boolean }> = ({ lead, at, icon, children, big }) => {
  const p = usePop(lead, at - 0.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: p, transform: `translateX(${(1 - p) * 80}px)` }}>
      <div style={{ width: big ? 104 : 84, height: big ? 104 : 84, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ fontWeight: big ? 900 : 700, fontSize: big ? 100 : 54, color: C.ink, whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
};

const Cta: React.FC<{ lead: number }> = ({ lead }) => {
  const logo = usePop(lead, -0.2);
  const come = usePop(lead, 12.45, 9);
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 70 }}>
        <div style={{ opacity: logo, transform: `scale(${0.85 + logo * 0.15})` }}><Logo scale={0.82} /></div>
        <div style={{ opacity: come, transform: `scale(${come})`, background: C.brand, color: "#fff", fontWeight: 800, fontSize: 80, borderRadius: 999, padding: "22px 80px", boxShadow: "0 24px 60px rgba(239,73,35,0.35)" }}>
          בואו להתרשם!
        </div>
      </div>
      <div style={{ width: 4, height: 620, background: "rgba(31,27,25,0.08)", borderRadius: 2 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <InfoRow lead={lead} at={2.17} icon={<PinIcon size={50} />}>ביאליק <Ltr>63</Ltr>, רמת גן</InfoRow>
        <InfoRow lead={lead} at={5.88} icon={<PhoneIcon size={60} />} big><Ltr>03-6738835</Ltr></InfoRow>
        <InfoRow lead={lead} at={9.6} icon={<ClockIcon size={48} />}>
          <div style={{ fontSize: 44, lineHeight: 1.35 }}>
            <div>א׳–ה׳ <Ltr>9:00–14:00</Ltr> · <Ltr>16:00–18:00</Ltr></div>
            <div>ו׳ וערבי חג <Ltr>9:00–14:00</Ltr></div>
          </div>
        </InfoRow>
        <InfoRow lead={lead} at={10.9} icon={<GlobeIcon size={48} />}><Ltr>shirielectric.co.il</Ltr></InfoRow>
      </div>
    </AbsoluteFill>
  );
};

const SceneBody: React.FC<{ id: SceneId; lead: number; dur: number }> = ({ id, lead, dur }) => {
  switch (id) {
    case "intro": return <Intro lead={lead} />;
    case "brand": return <Brand lead={lead} dur={dur} />;
    case "cats": return <Cats lead={lead} />;
    case "range": return <Range lead={lead} />;
    case "trust": return <Trust lead={lead} />;
    case "values": return <Values lead={lead} />;
    case "cta": return <Cta lead={lead} />;
  }
};

export const ShiriPromo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  let start = 0;
  return (
    <AbsoluteFill>
      <Background />
      <Audio
        src={staticFile("shiri/music.wav")}
        volume={(f) => 0.14 * interpolate(f, [0, 20, durationInFrames - 75, durationInFrames - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SCENES.map((s, i) => {
        const from = start;
        const dur = sceneFrames[i];
        start += dur;
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <SceneFade dur={i === SCENES.length - 1 ? dur + 8 : dur}>
              <SceneBody id={s.id} lead={s.lead} dur={dur} />
            </SceneFade>
            <Sequence from={Math.round(s.lead * SHIRI_FPS)} layout="none">
              <Audio src={staticFile(`shiri/vo/${s.id}.mp3`)} volume={1} />
            </Sequence>
            {i > 0 && <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
