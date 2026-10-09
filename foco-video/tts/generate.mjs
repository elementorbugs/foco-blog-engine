// Generates one voiceover WAV per scene from script.json -> ../public/vo/<id>.wav
// Usage: node generate.mjs [sceneId]   (no arg = all scenes)
//        VIDEO=<slug> node generate.mjs [sceneId]   -> ../videos/<slug>/script.json into ../public/video/<slug>/vo/
import fs from "fs";
import { KokoroTTS } from "kokoro-js";

const V = process.env.VIDEO;
const script = JSON.parse(fs.readFileSync(V ? `../videos/${V}/script.json` : "script.json", "utf8"));
const voDir = V ? `../public/video/${V}/vo` : "../public/vo";
const only = process.argv[2];
fs.mkdirSync(voDir, { recursive: true });

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const s of script.scenes) {
  if (only && s.id !== only) continue;
  const audio = await tts.generate(s.text, { voice: script.voice, speed: 1.0 });
  await audio.save(`${voDir}/${s.id}.wav`);
  console.log("saved", s.id);
}
