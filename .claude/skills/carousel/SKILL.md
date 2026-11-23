---
name: carousel
description: Make a FOCO story carousel about our avatar Jess (WFH freelance mom with ADHD) or an approved test mom, in the scrapbook "diary" format, TikTok + Instagram slides + captions. Use when Adi says "/carousel", "carousel", "קרוסלה", or asks for TikTok/Instagram slides.
---

# FOCO story carousel (Jess series)

**`spec.md` is the MASTER (Adi's spec V2, 2026-11-17). Read it in full before every carousel; it wins wherever this
file differs.** This file only says how to execute it with our tools.
Old formats/rules (Maya freelancer series, chat/notes/versus, paid-ad playbook and ad carousels) were DELETED
2026-11-18 (Adi). Never rebuild them; only the styles in "Design styles" below exist.

## This folder = everything
| file | what |
|---|---|
| `spec.md` | MASTER content & performance spec (mission, angles A-J, structure, writing, product, CTA, tests, QA, scoring) |
| `SKILL.md` | how to run it in our engine (this file) |
| `jess.md` | Jess's profile + research: verbatim quotes WITH source links, recurring themes, frequency |
| `tasks/avatar-research-2026-11-18/strategy-avatars-positioning-2026-11.md` | **THE strategy (Adi, 2026-11-19: "the most important file there is")**: 6 sub-avatars with hooks, pain map, positioning, messaging, creative concepts. Every carousel names its sub-avatar (1-6) first |
| `tasks/avatar-research-2026-11-18/avatar-adhd-freelancer.md` + `pain-bank.md` | **THE pain source (Adi, 2026-11-18: "the most important thing")**: the chosen avatar's pains ranked by frequency and intensity, in their exact words, plus their dreams; P1-P20 with the true FOCO answer. Every carousel starts from one P-number |
| `log.md` | learning log: one row per carousel (hypothesis, angle, hook, CTA, results, next test) |
| `kit/` | character references: `jess-anchor.png` (+ `jess-white-bg.png`) and the Gemini prompts; test moms get `<name>-anchor.png` + `<name>.md` profile here |
Engine (tools, not rules): `foco-video/` (spec `carousels/<slug>.json`, images `carousels/own/<folder>/`,
`src/carousel/Diary.tsx`, `carousel/build.js`, `carousel/send.js`).

## Workflow (spec §15, with our tools)
1. **Concept (Stage 1):** read `spec.md`, `jess.md`, `log.md` and the pain source (`avatar-adhd-freelancer.md` +
   `pain-bank.md`). Pick ONE pain (P-number, write it in the log row) and an angle from spec §5 that is NOT one of the
   recent rows in `log.md` (angle C waiting mode is done). **Filter every candidate situation FIRST by FOCO fit:
   does a real FOCO feature (say/type/snap the task, optional one-tap breakdown, one-step focus session) solve THIS
   moment's starting problem? Rate fit strong/medium/weak and drop weak (e.g. resuming after an interruption).
   Only then rank by recurrence and relatability** (Adi, 2026-11-17: "how is all this related to FOCO?"). Ideal: the
   product insight lives inside the story (the dish is easy because it's small; FOCO makes work that small). Write: audience, problem, angle, character, work task,
   time window, stakes, emotional takeaway, why FOCO fits, and ONE test hypothesis (spec §13, one variable).
   **Cold-read test (Adi, 2026-11-18: "I didn't understand the script"):** before showing Adi, give ONLY the slide
   text (no concept, no context) to a fresh subagent: "retell what happens on each slide in one sentence, list
   anything confusing". Every time stamp must say what happened since the last one (e.g. "since then I answered 14
   other emails"). If the retelling is wrong anywhere, rewrite and test again.
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
- **Reddit quotes on a slide: copy exact wording from `jess.md` or `avatar-adhd-freelancer.md` (links in reports
  01-05 of the same folder).** An excerpt is fine only as a contiguous piece with "…"; never reword inside quote
  marks. If you can't find it with a link, it can't be a quote: paraphrase it in the character's voice instead.
- Times read unambiguously ("1pm", not "1:00") and the clock moves forward consistently.
- "link in bio" only while the bio link is live.

## Characters
- **Jess** (default, recurring): profile in `jess.md`, reference `kit/jess-anchor.png`. Keep her identity (spec §3).
- **Test mom** (spec §3): write her own profile `kit/<name>.md` (age, look, family, work, apartment; NOT Jess's
  biography), generate ONE base portrait in her home, **show it to Adi for approval**, then save
  `kit/<name>-anchor.png` and use only her in that carousel. Never mix identities in one carousel.

## Making images (Gemini)
- **Cost rule (Adi, 2026-11-23):** default model `gemini-2.5-flash-image` (~$0.04/image). `gemini-3-pro-image-preview`
  (~$0.13/image, ~$0.24 at 4K) only when flash can't hold the character/person on-model, and say the REAL total to Adi
  before the batch (images x price). Never quote the flash price for a Pro run. The tool prints the cost of every run.
- `python -X utf8 viral-lab/tools/gemini-image.py --model gemini-3-pro-image-preview --norefs --ref .claude/skills/carousel/kit/<anchor>.png ...`
  Prompt style: `kit/prompts/` (candid iPhone, natural light, lived-in home, screens unreadable, no logos/text).
- Cut-out sticker: generate the pose on a plain WHITE background, rembg `isnet-general-use`, threshold the mask, keep
  the largest region, fill holes, save PNG.
- Objects: from her POV with the anchor as ref, cropped. Only objects that belong to the story (spec §10: no filler props).

## Design styles

**Rotate series (Adi, 2026-11-19: "all the carousels look the same").** Never two posts in a row in the same style; Jess
Story at most 1 post in 4. Every style keeps the brand codes (FOCO purple, the dark FOCO UI, the character only as itself)
and shows the product only as real recorded screens. **Every post ends with the fixed CTA slide** (Adi, 2026-11-19), styled per series but same copy: app icon or character, "start the task you're avoiding." / "say it. break it down. focus for 5 minutes." + App Store and Google Play badges (dark.js `{end,sub,blur}`, comic.js `"end":{text,sub}`). No prices, no "free". Benchmark contact sheets of the top ADHD carousels: see the
2026-11-19 lesson in tasks/lessons.md. (Adi picks one by NAME; if he doesn't name one, ask which, or use the last one he approved)
Every style uses the same story rules and the same QA. Add each new style here with a name, a layout and an example.

| name (Adi says) | Hebrew | look | layout | example |
|---|---|---|---|---|
| **Scrapbook** | סקראפבוק | handmade diary on crumpled cream paper: taped polaroids, the character as a white-outlined cut-out, Kalam ballpoint notes on torn paper scraps, thick blue arrows, lilac marker behind ONE key word, bold lowercase headline + serif body, drawn mail banner | `diary` / `final-diary` (blocks + `collage`). **Two colour themes** (Adi, 2026-11-18: "so not everything looks the same"): `"theme": "beige"` (default, cream paper + lilac marker) or `"theme": "purple"` (lilac paper + yellow marker) at the spec top level; alternate them across posts | `diary-jess-waiting-mode`, `diary-jess-planners` (beige), `diary-jess-planners-purple` |
| **Story** | סטורי | "made on a phone" in 2 minutes: the real photo full-bleed, native TikTok/IG text (white + black stroke, or text on white/black boxes), Instagram-pen scribbles (uneven circles, arrows, underlines) in yellow/white, iPhone cut-out sticker, crooked screenshots. No paper, stars or tape. Approved 2026-11-18 ("looks less effortful but still aesthetic") | `story` (free-positioned `blocks`: bg (+blur/dim), txt, hand, circle, arrow, under, cutout, shot, notif, focosteps, badges) | `story-jess-planners` (8 slides), `story-sample` |
| **Dark mood** | אווירה כהה | faceless "person sharing" slideshow (benchmark: mybuddymomo, 778K plays): 5 moody night photos with ONE small lowercase centered line each (the pain, no product), then 3 REAL FOCO screens (voice, steps, timer) big on a blurred dark photo with a white caption sticker, last slide in daylight (dark to light = stuck to started). Approved 2026-11-19 | `carousel/series/dark.js` (spec `"series": "dark"`, slides `{photo,...}` or `{screen,...,stk}`); assets in `carousels/own/<slug>/` | `dark-email-avoid` (9 slides) |
| **FOCO comic** | קומיקס | 4 panels starring the FOCO character in ONE recurring scene (desk, laptop, mug), one handwritten Kalam line per panel, white panel frame, "n/4" + FOCO tag, then a grid slide (benchmark: ADHDinos, 457K plays). Panels: Gemini with the official states as refs (try `gemini-2.5-flash-image` first; `gemini-3-pro-image-preview` only if flash drifts off-model), panels 2-4 with `--ref panel-1.png` so the style matches; check every panel against `viral-lab/character/official` (no white eyeballs, no pastel body, glossy deep purple, glow outline). Cost: flash ~$0.04/image, 3 Pro ~$0.13/image. Approved 2026-11-19 | `carousel/series/comic.js` (spec `"series": "comic"`, `panels:[{image,text}]`), 1080x1350 | `comic-one-email` (5 slides) |

**Video (Story style only):** the same Story spec renders as an animated video: `node carousel/video.js <slug>` ->
`out/tiktok-<slug>/video.mp4` (1080x1920, items enter in array order: TikTok text pops word by word, pen marks draw
themselves, the sticker slaps on with a bounce, the mail drops in, FOCO's steps appear and step 1 glows, slow zoom on
the photo, story transitions between slides, light sound effects, music baked in: see Video rules below). Timing comes from
`schedule()` in Story.tsx (entrance per item + reading time); keep the whole video ~40-48 s for 10 slides. Check sampled frames
(ffmpeg -ss) before sending. Email it with `node carousel/send.js <slug> --video` (re-encoded to fit Gmail).

**Video rules (Adi, 2026-11-18):**
- **Music: a different track every video.** `video.js` picks from the CC BY 4.0 library (`factory/music.json`, Kevin
  MacLeod; moods lofi/warm/calm/piano/upbeat, never "quirky"), never one of the last 5 (`carousels/music-used.json`);
  force one with `--music <key>`. Never fall back to the same track ("the same music every time gets old fast").
  The license REQUIRES the credit line in the caption: `send.js --video` adds `🎵 Music: "<title>" Kevin MacLeod
  (incompetech.com), licensed under CC BY 4.0` to both captions; tell Adi to keep it.
- **Effects-only version for TikTok (Adi, 2026-11-20: "the music is annoying, I love the effects"):** also render `node carousel/video.js <slug> --no-music` -> `video-no-music.mp4` (no credit needed). Adi adds a trending sound in TikTok and sets Volume: Original sound 100%, Added sound ~15-25%, so the effects stay on top.
- **Music is baked in** under the effects (soft bed, fade in/out, -14 LUFS), because music added in the app would bury
  the effects. If Adi adds a trending sound anyway: lower the added sound in the app's Volume settings.
- **Transitions belong to her story, never a technical swipe.** Per slide `"enter"`: `cut` (default, like tapping
  to the next story), `time` + `"time": "10:35"` (her clock jumps, big time stamp over the blurred next moment),
  `buzz` (phone buzz shake: message/notification slides), `flash` (camera shutter: when she snaps/scans),
  `focus` (blur clears to sharp: when she starts working). Pick each one from what happens in the story.
- **Show the product's ease between tasks** (Adi: "in a second it's in her day, in another second she can start"):
  when it fits the story, show HOW the task got in: `scan` (her paper planner/list snapped, "N tasks found"), say it
  (voice), then `daycal` (the real "lands in your day" view), then `focosteps`, then the start (timer screen + sound).
  The last slide gets a `recap` row (🎙️ say it · 📸 snap it · ▶️ start).
- **The FOCO character only near the end:** `mascot` (official `public/mascots-hd` states) as a sticker NEXT TO
  her when she starts (`focus`) or finishes (`completion`). Never in the pain part of her story.
- Length ~40-48 s for 10 slides; check a 2 fps contact sheet of the whole video before sending.


**HARD GATE: English self-check before ANY text reaches Adi or a render (Adi, 2026-11-19: "why do you repeat this mistake? from now on you are obligated to check yourself").**
This already failed twice (2026-11-18 "you don't check your English", 2026-11-19 "what is STARTING IT WAS"). It is not optional and not "when there's time":
1. Collect EVERY line that will be seen: slides/overlays, captions, hashtags line, email text to Adi, alt text.
2. Send them to a fresh native-copy-editor subagent: "native American English editor for casual TikTok/IG copy; flag anything unnatural, literary, inverted, stiff or non-native; give a natural replacement".
3. Fix every flag, then re-check the changed lines the same way.
4. Only then render / show / send, and say in the reply that the check ran.
Banned in social copy: inverted or clever-literary syntax ("starting it was"), parenthetical cleverness ("the longer (and sorrier)"), vague plurals that don't match what's shown ("the first steps were" for two).

**Copy pass before every render (Adi, 2026-11-18: "you don't check your English").** Read every line out loud as
marketing copy: natural American English, idiomatic, clear in one read, catchy. Kill awkward lines ("a dish is just
small" -> "dishes are easy to start."), check prepositions ("after your next drop-off"), keep callbacks consistent,
and check captions too. List all slide text and fix it BEFORE making images or rendering.

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
