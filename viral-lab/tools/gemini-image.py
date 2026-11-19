# Scene generation with Gemini's image model (the "nano-banana" Arcads uses) on the project's own Gemini key, with the
# official FOCO states as references. Fallback when the Arcads daily allowance runs out.
# Key: GEMINI_IMAGE_KEY (a separate, billed project, so the free voice key stays free), else GOOGLE_AI_API_KEY /
# GEMINI_API_KEY, from the environment or the project .env (never printed).
# Usage: python viral-lab/tools/gemini-image.py <out.png> <prompt.txt> [--model gemini-2.5-flash-image] [--norefs] [--aspect 1:1]
# --norefs: scene only (no FOCO references), for the composite method where the official FOCO is placed in code.
import os, re, sys
from google import genai
from google.genai import types

out, prompt_file = sys.argv[1], sys.argv[2]
model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "gemini-2.5-flash-image"
ASPECT = sys.argv[sys.argv.index("--aspect") + 1] if "--aspect" in sys.argv else "9:16"  # e.g. 1:1, 4:3
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
REFS = [os.path.join(ROOT, "foco-video", "public", "mascots-hd", f"{s}.png") for s in ("presence", "alignment", "drift")]


def key():
    for k in ("GEMINI_IMAGE_KEY", "GOOGLE_AI_API_KEY", "GEMINI_API_KEY"):
        if os.environ.get(k):
            return os.environ[k]
    found = {}
    for line in open(os.path.join(ROOT, ".env"), encoding="utf8"):
        m = re.match(r"\s*(GEMINI_IMAGE_KEY|GOOGLE_AI_API_KEY|GEMINI_API_KEY)\s*=\s*(.+)", line)
        if m:
            found[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    for k in ("GEMINI_IMAGE_KEY", "GOOGLE_AI_API_KEY", "GEMINI_API_KEY"):
        if found.get(k):
            return found[k]
    sys.exit("no Gemini key")


client = genai.Client(api_key=key())
EXTRA = [sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--ref"]  # extra reference images (e.g. a recurring side character)
parts = [types.Part.from_bytes(data=open(p, "rb").read(), mime_type="image/png") for p in EXTRA] + ([] if "--norefs" in sys.argv else [types.Part.from_bytes(data=open(p, "rb").read(), mime_type="image/png") for p in REFS])
res = client.models.generate_content(
    model=model,
    contents=parts + [open(prompt_file, encoding="utf8").read()],
    config=types.GenerateContentConfig(response_modalities=["IMAGE"], image_config=types.ImageConfig(aspect_ratio=ASPECT)),
)
for p in res.candidates[0].content.parts:
    if p.inline_data:
        open(out, "wb").write(p.inline_data.data); print("saved", out); break
else:
    sys.exit("no image returned")
