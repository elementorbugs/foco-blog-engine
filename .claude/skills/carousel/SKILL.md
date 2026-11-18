---
name: carousel
description: Make a FOCO story carousel about our avatar Jess (WFH freelance mom with ADHD) or an approved test mom, in the scrapbook "diary" format, TikTok + Instagram slides + captions. Use when Adi says "/carousel", "carousel", "קרוסלה", or asks for TikTok/Instagram slides.
---

# FOCO story carousel (Jess series)

**`spec.md` is the MASTER (Adi's spec V2, 2026-11-17). Read it in full before every carousel; it wins wherever this
file differs.** This file only says how to execute it with our tools.
Old formats/rules (Maya freelancer series, chat/notes/versus, paid-ad playbook) are archived in
`tasks/archive/carousel-old-2026-10/`: never used unless Adi asks for them by name.

## This folder = everything
| file | what |
|---|---|
| `spec.md` | MASTER content & performance spec (mission, angles A-J, structure, writing, product, CTA, tests, QA, scoring) |
| `SKILL.md` | how to run it in our engine (this file) |
| `jess.md` | Jess's profile + research: verbatim quotes WITH source links, recurring themes, frequency |
| `log.md` | learning log: one row per carousel (hypothesis, angle, hook, CTA, results, next test) |
| `kit/` | character references: `jess-anchor.png` (+ `jess-white-bg.png`) and the Gemini prompts; test moms get `<name>-anchor.png` + `<name>.md` profile here |
Engine (tools, not rules): `foco-video/` (spec `carousels/<slug>.json`, images `carousels/own/<folder>/`,
`src/carousel/Diary.tsx`, `carousel/build.js`, `carousel/send.js`).

## Workflow (spec §15, with our tools)
1. **Concept (Stage 1):** read `spec.md`, `jess.md`, `log.md`. Pick an angle from spec §5 that is NOT one of the
   recent rows in `log.md` (angle C waiting mode is done). **Filter every candidate situation FIRST by FOCO fit:
   does a real FOCO feature (say/type/snap the task, optional one-tap breakdown, one-step focus session) solve THIS
   moment's starting problem? Rate fit strong/medium/weak and drop weak (e.g. resuming after an interruption).
   Only then rank by recurrence and relatability** (Adi, 2026-11-17: "how is all this related to FOCO?"). Ideal: the
   product insight lives inside the story (the dish is easy because it's small; FOCO makes work that small). Write: audience, problem, angle, character, work task,
   time window, stakes, emotional takeaway, why FOCO fits, and ONE test hypothesis (spec §13, one variable).
2. **Story approval (Stage 2):** send Adi the slide-by-slide text (6-8 slides, each with its narrative function)
   + hook + CTA type + hypothesis. **Wait for his OK before making images.**
3. **Visuals (Stage 3):** images from the approved character reference (below), then the spec JSON, then
   `cd foco-video && node carousel/build.js <slug> render`.
4. **QA (Stage 4):** fix every real ⚠ overlap warning from render. Then the manual review: build a large contact
   sheet of the PNGs (ffmpeg, crop 1080x1400 from y 150, 4 per row) and Read it, plus
   `carousel/work/<slug>/safezones.jpg`. Check every item in spec §15 Stage 4. Then score spec §16 (target ≥ 42/50);
   any critical failure (fabricated quote, wrong app behavior, misleading claim, unreadable text) is fixed first.
5. **Delivery (Stage 5):** `node carousel/send.js <slug>` (only report "sent" when it prints the confirmation),
   open the folder on Adi's PC, commit + push own files to `carousel-tool` (report only after git confirms).
   Reply in Hebrew with: the carousel, both captions, hashtags, hypothesis, score, publishing notes (IG gets the
   `ig-slide-N` 4:5 files, AI-generated label on), tracking identifier = the slug.
6. **Review (Stage 6):** ask Adi for the numbers after posting, fill the row in `log.md`. Don't call a winner from one post.

## Our hard rules on top of the spec
- Adi never appears (faceless brand). The story is about the character, never about the founder.
- FOCO facts only as verified with Adi: say it / type it / snap a list, ONE optional tap breaks a task into steps
  (never "automatic"), focus session with timer + sounds, calendar. Never "free", prices, store ratings or review
  quotes, discounts. Don't recommend competitors.
- **Reddit quotes on a slide: copy exact wording from `jess.md` (which holds the link).** An excerpt is fine only
  as a contiguous piece with "…"; never reword inside quote marks. If it isn't in `jess.md` with a link, it can't
  be a quote: paraphrase it in the character's voice instead.
- Times read unambiguously ("1pm", not "1:00") and the clock moves forward consistently.
- "link in bio" only while the bio link is live.

## Characters
- **Jess** (default, recurring): profile in `jess.md`, reference `kit/jess-anchor.png`. Keep her identity (spec §3).
- **Test mom** (spec §3): write her own profile `kit/<name>.md` (age, look, family, work, apartment; NOT Jess's
  biography), generate ONE base portrait in her home, **show it to Adi for approval**, then save
  `kit/<name>-anchor.png` and use only her in that carousel. Never mix identities in one carousel.

## Making images (Gemini)
- `python -X utf8 viral-lab/tools/gemini-image.py --model gemini-3-pro-image-preview --norefs --ref .claude/skills/carousel/kit/<anchor>.png ...`
  Prompt style: `kit/prompts/` (candid iPhone, natural light, lived-in home, screens unreadable, no logos/text).
- Cut-out sticker: generate the pose on a plain WHITE background, rembg `isnet-general-use`, threshold the mask, keep
  the largest region, fill holes, save PNG.
- Objects: from her POV with the anchor as ref, cropped. Only objects that belong to the story (spec §10: no filler props).

## Design styles (Adi picks one by NAME; if he doesn't name one, ask which, or use the last one he approved)
Every style uses the same story rules and the same QA. Add each new style here with a name, a layout and an example.

| name (Adi says) | Hebrew | look | layout | example |
|---|---|---|---|---|
| **Scrapbook** | סקראפבוק | handmade diary on crumpled cream paper: taped polaroids, the character as a white-outlined cut-out, Kalam ballpoint notes on torn paper scraps, thick blue arrows, lilac marker behind ONE key word, bold lowercase headline + serif body, drawn mail banner | `diary` / `final-diary` (blocks + `collage`). **Two colour themes** (Adi, 2026-11-18: "so not everything looks the same"): `"theme": "beige"` (default, cream paper + lilac marker) or `"theme": "purple"` (lilac paper + yellow marker) at the spec top level; alternate them across posts | `diary-jess-waiting-mode`, `diary-jess-planners` (beige), `diary-jess-planners-purple` |
| **Story** | סטורי | "made on a phone" in 2 minutes: the real photo full-bleed, native TikTok/IG text (white + black stroke, or text on white/black boxes), Instagram-pen scribbles (uneven circles, arrows, underlines) in yellow/white, iPhone cut-out sticker, crooked screenshots. No paper, stars or tape. Approved 2026-11-18 ("looks less effortful but still aesthetic") | `story` (free-positioned `blocks`: bg (+blur/dim), txt, hand, circle, arrow, under, cutout, shot, notif, focosteps, badges) | `story-jess-planners` (8 slides), `story-sample` |

**Video (Story style only):** the same Story spec renders as an animated video: `node carousel/video.js <slug>` ->
`out/tiktok-<slug>/video.mp4` (1080x1920, items enter in array order: TikTok text pops word by word, pen marks draw
themselves, the sticker slaps on with a bounce, the mail drops in, FOCO's steps appear and step 1 glows, slow zoom on
the photo, carousel-like swipe between slides, light sound effects; music is added on upload). Timing comes from
`schedule()` in Story.tsx (entrance per item + reading time); keep the whole video ~35-45 s. Check sampled frames
(ffmpeg -ss) before sending. Email it with `node carousel/send.js <slug> --video` (re-encoded to fit Gmail).

Shared rules for every style:
- Readability first: no bare text on a busy photo (paper scrap, stroke or box), arrows never cross text, no orphan words.
- TikTok safe zones: top 0-180, bottom 1500+, right rail x 950+ at y 850-1500.
- FOCO UI only as real screenshots or the real-UI `focosteps` component (copy of "N TINY STEPS BY FOCO"); never invent screens.
- Pen circles/arrows must land exactly on what they point at: check at full size.
- Every object in a photo must fit the story (e.g. no baby monitor when the kid is at daycare).

## Spec JSON (diary layout)
```json
{ "slug": "diary-jess-<topic>",
  "tiktok": { "caption": "...", "hashtags": ["3-5"] },
  "instagram": { "caption": "...", "hashtags": ["3-5"], "altText": "..." },
  "slides": [ { "layout": "diary" | "final-diary", "id": "s1", "gap": 26, "blocks": [ ... ] } ] }
```
Blocks (stack centred in the safe band): `head` / `big` / `body` (`bold`?) / `script` (pen) with `text`, `size?`
(`*word*` = marker); `quote` (paper card); `badges`; `collage { h, items }`. Collage items (x/y in an 830-wide box,
`rot?`): `photo {file,w,h,tape?}` · `cutout {file,h}` · `note {text,w?,size?}` · `arrow {w~175,flip?}` ·
`sticky {text,w?}` · `notif {from,text,w?}` · `focostep {step,min,scale?}`. `file` paths relative to `foco-video/`.

## Captions (spec §12)
Separate TikTok and Instagram captions that complement the story (not a slide-by-slide repeat), one natural search
phrase, conversational, one clear next action, 3-5 hashtags each, IG `altText`. No em dashes, no medical claims.
