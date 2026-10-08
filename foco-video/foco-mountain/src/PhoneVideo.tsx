import React from "react";
import { Freeze, OffthreadVideo, useCurrentFrame, useVideoConfig } from "reelkit/frame";

export type PhoneVideoProps = {
  // urls[key] of the user's own screen recording. Never fake an app screen.
  src: string;
  // Frame (in this component's clock) at which playback starts; before it the first frame is held.
  playAt?: number;
  // Playback speed of the recording.
  rate?: number;
  // Seconds into the recording where playback begins.
  trimSec?: number;
  // Length of the recording in seconds; playback holds the last frame after it.
  lengthSec?: number;
  // Status-bar time shown above the recording.
  time?: string;
  frameColor?: string;
  // Colour of the soft glow behind the phone; none when omitted.
  glow?: string;
  // Glow strength from 0 to 1.
  glowStrength?: number;
  // Fill colour behind the recording (the app's background).
  screenColor?: string;
};

// A phone body that fills its container and plays a real screen recording inside, with a drawn status bar and an optional coloured glow. Put it in a sized box (or a Carry) to move it around; it starts playback at playAt and holds the last frame at the end.
export const PhoneVideo: React.FC<PhoneVideoProps> = ({ src, playAt = 0, rate = 1, trimSec = 0, lengthSec = 9999, time = "9:41", frameColor = "#0b0910", glow, glowStrength = 0.6, screenColor = "#0d0b14" }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const maxLocal = Math.max(0, ((lengthSec - trimSec) * fps) / rate - 1);
  const local = Math.min(maxLocal, Math.max(0, frame - playAt));
  const unit = width * 0.01;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {glow ? (
        <div style={{ position: "absolute", inset: "-14%", borderRadius: "40%", background: `radial-gradient(closest-side, ${glow}, transparent)`, opacity: glowStrength, filter: `blur(${unit * 3}px)` }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, borderRadius: "13% / 6.5%", background: frameColor, padding: "3.2%", boxShadow: `0 ${unit * 3}px ${unit * 8}px rgba(0,0,0,0.55), inset 0 0 0 ${unit * 0.35}px rgba(255,255,255,0.16)` }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "10.5% / 5.2%", overflow: "hidden", background: screenColor, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "6.2%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 9%", color: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: unit * 1.5 }}>
            <span>{time}</span>
            <span style={{ width: "28%", height: "62%", borderRadius: 999, background: "#000" }} />
            <span style={{ display: "flex", gap: unit * 0.4, alignItems: "center" }}>
              <span style={{ width: unit * 2.2, height: unit * 1.1, borderRadius: unit * 0.3, border: `${unit * 0.15}px solid #fff`, boxSizing: "border-box", padding: unit * 0.12 }}>
                <span style={{ display: "block", width: "80%", height: "100%", background: "#fff", borderRadius: unit * 0.1 }} />
              </span>
            </span>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <Freeze frame={local}>
              <OffthreadVideo src={src} muted trimBefore={Math.round(trimSec * fps)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </Freeze>
          </div>
        </div>
      </div>
    </div>
  );
};
