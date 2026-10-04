# Per-scene voiceover analysis -> ../src/explainer/vo.json
# duration, word timestamps (whisper, mapped back onto the script words), loudness envelope per video frame
import json, re
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel

FPS = 30
script = json.load(open("script.json", encoding="utf8"))
model = WhisperModel("small.en", device="cpu", compute_type="int8")
PROMPT = "Foco, Habitica, Finch, Inflow, Goblin Tools, Magic To Do, ADHD, CBT."

def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())

out = []
for s in script["scenes"]:
    path = f"../public/vo/{s['id']}.wav"
    audio, sr = sf.read(path)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    dur = len(audio) / sr
    hop = sr // FPS
    env = [float(np.sqrt(np.mean(audio[i:i + hop] ** 2))) for i in range(0, len(audio), hop)]
    peak = max(env) or 1
    env = [round(e / peak, 3) for e in env]

    segs, _ = model.transcribe(path, word_timestamps=True, initial_prompt=PROMPT)
    heard = [w for seg in segs for w in seg.words]

    # Captions use the SCRIPT's spelling; timings come from whisper (sequential fuzzy alignment)
    words = s["text"].replace("A D H D", "ADHD").replace("C B T", "CBT").replace("Magic To Do", "Magic ToDo").split()
    timed, j = [], 0
    for w in words:
        k = j
        while k < len(heard) and k < j + 4 and norm(heard[k].word) != norm(w):
            k += 1
        if k < len(heard) and norm(heard[k].word) == norm(w):
            j = k
        if j < len(heard):
            timed.append({"text": w, "start": round(heard[j].start, 3), "end": round(heard[j].end, 3)})
            j += 1
        else:
            last = timed[-1]["end"] if timed else 0
            timed.append({"text": w, "start": last, "end": min(dur, last + 0.3)})
    out.append({"id": s["id"], "mascot": s["mascot"], "duration": round(dur, 3), "words": timed, "env": env})
    print(s["id"], round(dur, 1), "s", len(words), "words,", len(heard), "heard")

json.dump(out, open("../src/explainer/vo.json", "w", encoding="utf8"))
print("total", round(sum(o["duration"] for o in out), 1), "s")
