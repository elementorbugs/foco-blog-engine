// Speak named lines for a session video: VIDEO=<slug> node lines.mjs -> ../public/video/<slug>/vo/<name>.wav
import fs from "fs";
import { KokoroTTS } from "kokoro-js";
const V = process.env.VIDEO;
const cfg = JSON.parse(fs.readFileSync(`../videos/${V}/voice.json`, "utf8"));
const out = `../public/video/${V}/vo`;
fs.mkdirSync(out, { recursive: true });
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const [name, text] of Object.entries(cfg.lines)) {
  const audio = await tts.generate(text, { voice: cfg.voice, speed: 0.95 });
  await audio.save(`${out}/${name}.wav`);
  console.log("saved", name);
}
