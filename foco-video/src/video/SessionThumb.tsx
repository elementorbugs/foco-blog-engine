// YouTube thumbnail for body-double "work with me" sessions (1280x720): bright frame, big "1 HOUR" timer feel.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, HEAD } from "../Composition";

export const SessionThumb: React.FC<{ slug: string; variant: "A" | "B" }> = ({ slug, variant }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Img src={staticFile(`video/${slug}/thumb-bg.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(1.05) saturate(1.05)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(243,235,255,0.95) 0%, rgba(243,235,255,0.75) 42%, rgba(243,235,255,0) 70%)" }} />
    <div style={{ position: "absolute", left: 60, top: 70 }}>
      <div style={{ display: "inline-block", fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: "#fff", background: C.primary, padding: "6px 22px", borderRadius: 14 }}>ADHD BODY DOUBLE</div>
      {variant === "A" ? (
        <>
          <div style={{ marginTop: 16, fontFamily: HEAD, fontWeight: 800, fontSize: 150, lineHeight: 0.95, color: "#2D1257" }}>WORK</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 150, lineHeight: 0.95, color: "#2D1257" }}>WITH ME</div>
          <div style={{ marginTop: 22, display: "inline-block", fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: "#fff", background: "#2D1257", padding: "8px 26px", borderRadius: 18 }}>60:00 ⏱</div>
        </>
      ) : (
        <>
          <div style={{ marginTop: 16, fontFamily: HEAD, fontWeight: 800, fontSize: 210, lineHeight: 0.9, color: "#2D1257" }}>1 HOUR</div>
          <div style={{ marginTop: 10, fontFamily: HEAD, fontWeight: 800, fontSize: 66, lineHeight: 1.05, color: C.primary }}>timer + calm music</div>
        </>
      )}
    </div>
    <Img src={staticFile("mascots/foco_state_3_focus.png")} style={{ position: "absolute", right: 50, bottom: 30, height: 300, filter: "drop-shadow(0 10px 30px rgba(124,58,237,0.5))" }} />
  </AbsoluteFill>
);
