// YouTube thumbnails (1280x720) for long videos; props: slug + variant. Big 2-4 word text, face/mascot, contrast.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, HEAD } from "../Composition";

const ORANGE = C.celebrate;

const T: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = "#fff", children, style }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 0.95, color, letterSpacing: -2, WebkitTextStroke: "3px #0a0410", paintOrder: "stroke fill", textShadow: "0 8px 0 #0a0410, 0 14px 40px rgba(0,0,0,0.6)", ...style }}>
    {children}
  </div>
);

export const VideoThumb: React.FC<{ slug: string; variant: "A" | "B" }> = ({ slug, variant }) => (
  <AbsoluteFill style={{ background: "#040208" }}>
    <Img src={staticFile(`video/${slug}/thumb-bg.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "70% 30%", filter: "saturate(0.9) brightness(0.8)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(4,2,8,0.92) 0%, rgba(4,2,8,0.6) 45%, rgba(4,2,8,0) 75%)" }} />
    {variant === "A" ? (
      <div style={{ position: "absolute", left: 60, top: 90 }}>
        <T size={84}>CAN'T START</T>
        <T size={84}>ALONE?</T>
        <div style={{ marginTop: 26, display: "inline-block", fontFamily: HEAD, fontWeight: 800, fontSize: 92, color: "#fff", background: C.primary, padding: "8px 30px", borderRadius: 22, transform: "rotate(-2deg)" }}>BODY DOUBLING</div>
      </div>
    ) : (
      <div style={{ position: "absolute", left: 60, top: 110 }}>
        <T size={120} color={ORANGE}>ADHD</T>
        <T size={120}>BODY</T>
        <T size={120}>DOUBLING</T>
      </div>
    )}
    <Img src={staticFile("mascots/foco_state_1_presence.png")} style={{ position: "absolute", right: 40, bottom: 20, height: 330, filter: "drop-shadow(0 0 40px rgba(124,58,237,0.8))" }} />
  </AbsoluteFill>
);
