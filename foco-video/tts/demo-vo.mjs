// Voiceover for the ClipDemo cuts: ../src/demo/demo-vo-lines.json -> ../public/demo-vo/<key>.wav
// and writes each clip's length (seconds) to ../src/demo/demo-vo.json so the edit can fit around it.
// Usage: node demo-vo.mjs [key]
import fs from "fs";
import { KokoroTTS } from "kokoro-js";

const lines = JSON.parse(fs.readFileSync("../src/demo/demo-vo-lines.json", "utf8"));
const outDir = "../public/demo-vo";
const durFile = "../src/demo/demo-vo.json";
const durations = fs.existsSync(durFile) ? JSON.parse(fs.readFileSync(durFile, "utf8")) : {};
const only = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const [key, text] of Object.entries(lines.lines)) {
  if (only && key !== only) continue;
  const audio = await tts.generate(text, { voice: lines.voice, speed: 1.0 });
  await audio.save(`${outDir}/${key}.wav`);
  durations[key] = Math.round((audio.audio.length / audio.sampling_rate) * 100) / 100;
  console.log(key, durations[key]);
}
fs.writeFileSync(durFile, JSON.stringify(durations, null, 2));
