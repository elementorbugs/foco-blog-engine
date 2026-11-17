---
name: carousel
description: Make a FOCO carousel about our avatar Jess (WFH freelance mom with ADHD) in the scrapbook "diary" format, TikTok + Instagram slides + captions. Use when Adi says "/carousel", "carousel", "קרוסלה", or asks for TikTok/Instagram slides.
---

# Jess diary carousel (the only carousel format, since 2026-11-17)

Adi's bar: `diary-jess-waiting-mode` (emailed 2026-11-17, "matched my expectations"). Start every new carousel from it.
Older formats and rules (Maya/freelancer series, chat/notes/versus, paid-ad playbook) are archived in
`tasks/archive/carousel-old-2026-10/` and are NOT used unless Adi asks for them by name.

## This folder = everything
| file | what |
|---|---|
| `SKILL.md` | the rules (this file) |
| `jess.md` | who Jess is + her verbatim Reddit words (217 posts) + performance log. READ before writing |
| `kit/jess-anchor.png` | Jess in her living room: `--ref` for every new image (same face, hair, cardigan, apartment) |
| `kit/jess-white-bg.png` + `kit/prompts/` | white-background source for cut-outs + the exact Gemini prompts used |
The render engine lives in `foco-video/` (specs `foco-video/carousels/<slug>.json`, images
`foco-video/carousels/own/<slug-folder>/`, code `src/carousel/Diary.tsx`, `carousel/build.js`, `carousel/send.js`).

## Jess in one breath
34, WFH freelancer (~25 h/week), 2 kids (son 6 with ADHD, daughter 2 in half-day daycare), diagnosed after her son.
Works inside windows: daycare 9:00-12:30, nap 1-3pm, after 8:30pm. The stuck task is always a WORK task (client
proposal, invoice, reply to a client) inside one of those windows. Strongest insight: **"waiting mode"**.

## Story rules (hard)
1. The story is about JESS, never about FOCO or the founder. Adi never appears (faceless brand).
2. Her words: hooks and lines come from `jess.md` quotes, natural spoken American English, first person, lowercase
   diary voice, 3-10 words per block, one thought per slide. Zero shame, slightly dry humor.
3. Concrete stakes: a real task, a deadline, a client message, the clock. Never abstract "mental load".
4. Times must read unambiguously: "1pm", not "1:00" (reads as night). The clock moves forward across slides and the
   timeline stays consistent (nap 1pm -> 2:40 -> 2:58 -> she wakes 3:05).
5. FOCO appears ONCE, at the turn (slide 6 of 8), never in the hook. The mechanism in plain words: she says the task
   out loud -> one tap (optional, her choice) breaks it into tiny steps -> step 1 is 2 minutes. Never "automatic".
6. Never: "free", prices, store rating or App Store review quotes, medical claims or stats, em dashes, competitor
   recommendations, promises FOCO can't control (a client saying yes).

## The 8-slide structure (from the approved carousel)
1. **Hook:** pen "adhd mom diary" + bold headline with ONE `*marked*` word ("my toddler napped for 2 hours and i
   didn't start *anything.*") + collage: Jess cut-out, object photo (laptop), sticky ("proposal due TOMORROW!!"),
   note + arrow pointing at her ("me, \"about to start\"").
2. **Setup:** objects of her day (baby monitor, paperwork) + time note ("1pm. she's napping.") + the stakes + "*and waited.*"
3. **Reframe:** "waited for *what?*" + the reason + object photo + "it's called waiting mode."
4. **Validation:** a real Reddit quote on a paper card + photo + "literally me today" + "i felt so seen".
5. **Low point:** drawn mail notification from the client + Jess cut-out (hand on forehead) + "2:40pm" note.
6. **Turn (FOCO):** "so i opened FOCO and said it out loud." + sticky with the spoken task + note + arrow + FOCO
   step card (step 1, 2 min) + "step 1 was *2 minutes.*"
7. **Outcome with a time:** done-laptop photo + Jess working cut-out + "2:58. *first page done.*" + "she woke up at 3:05."
8. **Final (`final-diary`):** "you don't need another *to-do list.*" / "you need help starting 💜" + step card +
   note "try it at the next nap" + arrow to store badges + "link in bio 💜 waiting mode, same? 👇".

## Look (hard rules)
- Scrapbook, handmade, never a clean template: crumpled paper, coffee ring, grain, torn tape, lilac marker behind
  the key word, Kalam Bold ballpoint handwriting, slight tilts.
- **Every slide is a full collage, no big empty areas:** Jess as a white-outlined cut-out sticker OR an object of
  her day (laptop, monitor, paperwork, kid's backpack, phone) + handwritten note + thick arrow. Different object each slide.
- **Readability:** notes always on a torn paper scrap (built in), arrows have a white under-stroke (built in), text
  never bare on a photo, arrows never cross text, no orphan word on a line (balanced wrap is built in).

## Making images (Gemini, ~free)
- New Jess / room / object shot: `python -X utf8 viral-lab/tools/gemini-image.py --model gemini-3-pro-image-preview
  --norefs --ref .claude/skills/carousel/kit/jess-anchor.png ...` (prompts style: `kit/prompts/`). Candid iPhone look,
  natural afternoon light, lived-in apartment, screens unreadable, no logos, no text.
- Cut-out: generate the pose on a plain WHITE background, then rembg `isnet-general-use`, threshold the mask, keep the
  largest region, fill holes, save PNG (cutting from a room photo keeps the couch).
- Object photos: generate from her POV with the anchor as ref, crop to the object.
- Put files in `foco-video/carousels/own/<folder>/`. AI images: turn on the AI-generated label when posting.

## Spec (diary layout)
```json
{ "slug": "diary-jess-<topic>",
  "tiktok": { "caption": "...", "hashtags": ["#adhdmom", "...3-5"] },
  "instagram": { "caption": "...", "hashtags": ["...3-5"], "altText": "..." },
  "slides": [ { "layout": "diary" | "final-diary", "id": "s1", "gap": 26, "blocks": [ ... ] } ] }
```
Blocks stack centred in the safe band: `head` / `big` / `body` (`bold`?) / `script` (pen) with `text`, `size?`
(`*word*` = marker highlight); `quote` (paper card); `badges`; `collage` `{ "h", "items": [...] }`.
Collage items (x/y in an 830-wide box, `rot?`): `photo {file,w,h,tape?}` · `cutout {file,h}` ·
`note {text,w?,size?}` · `arrow {w~175,flip?}` · `sticky {text,w?}` · `notif {from,text,w?}` (drawn mail banner) ·
`focostep {step,min,scale?}`. `file` paths are relative to `foco-video/`.

## Steps
1. Read `jess.md`. Pick ONE moment from her life + ONE work task + a time window. Write the 8 slides on the structure
   above (offer Adi 2 alternative hook lines in the reply, but build the strongest one).
2. Make the images (above), write the spec.
3. `cd foco-video && node carousel/build.js <slug> render`. Fix every real ⚠ overlap warning it prints.
4. **Self-check, every time, before sending:** build a large contact sheet of the PNGs (ffmpeg crop 1080x1400 from
   y 150, 4 per row) and Read it, plus `carousel/work/<slug>/safezones.jpg`. Every word readable, nothing bare on a
   busy photo, no arrow through text, no orphans, no text in TikTok safe zones (top 0-180, bottom 1500+, right rail
   x 950+ at y 850-1500), times unambiguous, story reads in order. (slide-N.jpg is only rebuilt by send.js.)
5. `node carousel/send.js <slug>` (emails slides + captions; cloud uses RESEND_API_KEY), open the folder on Adi's PC
   (`explorer.exe out\tiktok-<slug>`), commit + push own files only to branch `carousel-tool`.
6. Reply in Hebrew: what the story is, what changed, posting tips (Instagram gets the `ig-slide-N` 4:5 files; AI label on).

## Captions
TikTok: line 1 = searchable phrase + the moment ("ADHD mom waiting mode is real: ..."), 1-3 lines of the reframe/tip,
a comment question + "save this for the next nap 📌", last line "the app on the last slides is FOCO, link in bio 💜".
Instagram: first ~125 chars = the hook, the reframe, a numbered recap of the slides, the outcome line, "save + send to
the mom friend who gets it", "💜 The app I use is FOCO, link in bio." + one-sentence altText. 3-5 hashtags each
(#adhdmom #waitingmode #taskparalysis #adhdtiktok / #adhdwomen).

## After posting
Ask Adi for views, saves, shares, comments, link clicks; log them in the performance table at the bottom of `jess.md`
and let the winners steer the next moment/hook.
Next ideas (offered, not built): "notification jump scare", "apps made for people without kids", interrupted
"1 billion times" (resuming after an interruption).
