# Jess (avatar) - image kit

- `jess-anchor.png`: Jess in her living room (first Gemini shot). Pass it as `--ref` to every new Jess/room image so the face, hair, cardigan and apartment stay the same.
- `jess-white-bg.png`: Jess on a plain white background, the clean source for sticker cut-outs (rembg `isnet-general-use`).
- `prompts/`: the exact prompts used for the waiting-mode carousel (p* = room shots, wl*/c* = white-background poses, o*/lo* = object photos).

Generate: `python -X utf8 viral-lab/tools/gemini-image.py --model gemini-3-pro-image-preview --norefs --ref .claude/skills/carousel/kit/jess-anchor.png ...`
Persona + Reddit quotes: `../jess.md`. Rules: `../SKILL.md`.
