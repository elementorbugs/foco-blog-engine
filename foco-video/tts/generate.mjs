// Generates one voiceover WAV per scene from script.json -> ../public/vo/<id>.wav
// Usage: node generate.mjs [sceneId]   (no arg = all scenes)
import fs from "fs";
import { KokoroTTS } from "kokoro-js";

const script = JSON.parse(fs.readFileSync("script.json", "utf8"));
const only = process.argv[2];
fs.mkdirSync("../public/vo", { recursive: true });

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const s of script.scenes) {
  if (only && s.id !== only) continue;
  const audio = await tts.generate(s.text, { voice: script.voice, speed: 1.0 });
  await audio.save(`../public/vo/${s.id}.wav`);
  console.log("saved", s.id);
}
