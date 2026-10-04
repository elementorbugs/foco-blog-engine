import { KokoroTTS } from "kokoro-js";
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
const text = "You know exactly what you need to do. You just can't start. That's not laziness. It's called task initiation deficit, and the right app can make it a lot smaller.";
for (const v of ["af_heart", "af_bella", "am_michael", "am_fenrir"]) {
  const audio = await tts.generate(text, { voice: v });
  await audio.save(`sample-${v}.wav`);
  console.log("saved", v);
}
