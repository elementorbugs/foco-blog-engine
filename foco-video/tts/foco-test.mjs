import { KokoroTTS } from "kokoro-js";
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const t of ["FOCO", "Foco"]) { const a = await tts.generate(t, { voice: "af_heart" }); console.log(t, (a.audio.length / a.sampling_rate).toFixed(2), "s"); }
