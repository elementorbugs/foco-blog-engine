---
name: carousel
description: Make a FOCO TikTok photo carousel (1080x1920 slides + caption) on a topic Adi gives. Use when Adi says "/carousel", "carousel", "קרוסלה", or asks for TikTok/Instagram slides.
---

# FOCO TikTok carousel

Format copied from a viral app carousel (Flowfy): real lifestyle photo per slide, TikTok-style lilac text bubbles,
an in-app FOCO card, and FOCO revealed only at the end as a casual "btw". Engine lives in `foco-video/`.

## Steps
1. **Concept.** Pick an angle for the topic Adi gave (relatable/funny, validating, or practical-tips). 6-8 slides:
   slide 1 = hook, last slide = FOCO reveal + a question that invites comments. If Adi gave no topic, propose 3 angles.
2. **Write the spec** `foco-video/carousels/<slug>.json` (schema below). Every non-final slide needs a Pexels `query`
   (portrait lifestyle shot, describe the scene, not the emotion).
3. `cd foco-video && node carousel/build.js <slug> photos`, then **Read** `carousel/work/<slug>/sheet.jpg`
   (row = slide in order, column = pick 1-6). Choose photos: real/candid, room for text at top and bottom,
   no visible brand logos, no near-duplicates across slides. Write `"pick": N` into each slide.
4. `node carousel/build.js <slug> render`, then **Read** `out/tiktok-<slug>/preview.jpg` and
   `carousel/work/<slug>/safezones.jpg`. Check: no text in a red zone, text isn't covering a face, nothing overflows,
   bubbles readable on the photo. Fix and re-render.
5. Open the folder (`explorer.exe` on `out\tiktok-<slug>`) and reply in Hebrew: concept, slide list, caption, posting tip.

## Spec schema
```json
{
  "slug": "study",
  "caption": "one casual hook line + a question 👇",
  "hashtags": ["#adhd", "#adhdtiktok", "#foco"],
  "slides": [
    { "layout": "hook", "id": "hook", "query": "...", "lines": ["Big hook line", "second line"], "tag": "(small white tag)" },
    { "layout": "pair", "id": "a", "query": "...", "topLabel": "THEY SAY", "top": "...", "bottomLabel": "MY BRAIN HEARS", "bottom": "..." },
    { "layout": "caption", "id": "b", "query": "...", "label": "...", "comment": "...", "time": "10:15 am (optional clock chip)" },
    { "layout": "step", "id": "c", "query": "...", "label": "Can't start X?", "step": "tiny first step", "min": 1 },
    { "layout": "card", "id": "d", "query": "...", "label": "...", "comment": "...", "title": "Task name", "steps": [{ "text": "...", "min": 2 }], "result": "actually took: 4 min ✅" },
    { "layout": "final-card", "id": "end", "photo": "hook", "lines": ["...FOCO 💜"], "title": "Task", "steps": [{ "text": "...", "min": 1 }], "ask": "question 👇" },
    { "layout": "final-phone", "id": "end", "photo": "hook", "lines": ["btw the app is called FOCO 💜", "(purple blob icon)"], "screenshot": 3, "ask": "question 👇" }
  ]
}
```
- `id` = photo file name; `pick` = chosen candidate (1-6); `photo` = reuse another slide's photo (finals use it, blurred).
- `card` mimics FOCO's real "Let's break it down" screen (steps + minutes); `step` shows one first step.
- `final-phone` shows a real FOCO App Store screenshot (`public/apps/foco-<n>.png`, 3 = Break It Down).
- Keep each bubble under ~45 characters; slides look best with one idea each.

## Design system (canvas 1080x1920; a phone shows it ~2.8x smaller, so 1 phone pt ≈ 2.8 px here)

**Safe zones (TikTok UI covers these; approx.):** top 0-180 (tabs + photo dots), bottom 1500-1920
(username, caption, sound), right rail x 950-1080 at y 850-1500 (like/comment/share). Spec.tsx exports them as
`SAFE`. Every render writes `carousel/work/<slug>/safezones.jpg` with the zones shaded red: **Read it every time**;
no readable text in red. Photos can run under the zones, text can't.

**Typography**
- Body/bubbles: **Poppins** 700 (800 for emphasis). Headings inside FOCO UI cards: **Sora** 800. No other fonts.
- Sizes (px on the 1080 canvas):
  | role | size | ≈ phone pt |
  |---|---|---|
  | hook line 1 | 64 | 23 |
  | hook line 2 / slide label | 54-58 | 20 |
  | comment / second bubble | 44-48 | 16-17 |
  | white tag / ask | 40-48 | 14-17 |
  | FOCO card step text | 34 | 12 |
  | decorative UI labels only ("YOUR PLAN", "min") | 18-30 | not meant to be read |
- **Floor: 40px for anything the viewer must read** (34 only inside the FOCO card, where it mimics real UI).
- Bubble text: max ~45 characters, max 2 lines, sentence case/lowercase (TikTok voice), CAPS only for 1-2 stressed
  words ("ONE email", "WEEKS"). Labels in tags (THE PLAN, REALITY) are all-caps, letter-spaced, 30px.
- Hook slide: 2-3 bubbles stacked in the middle third (y ~640); content slides: label top (y 230-260),
  payoff bottom (y 1180-1330).

**Colors** (FOCO tokens; don't invent new ones)
| use | background | text |
|---|---|---|
| default bubble | `#EFE7FF` lilac | `#6D28D9` purple |
| contrast bubble (tag, ask, "reality") | `#FFFFFF` | `#160F22` near-black |
| win / result bubble | `#DCFCE7` | `#15803D` green |
| top label tag | `#7C3AED` | `#FFFFFF` |
| bottom label tag | `#FB923C` orange | `#FFFFFF` |
| FOCO card | `#130A22`, border `rgba(167,139,250,.35)` | `#FFFFFF`, sub `#B8B0CC`, accent `#A78BFA`, step dot `#7C3AED` |
- Max 3 bubble colors per slide. Purple = voice, white = punchline/question, green = result only, orange = contrast label only.
- If a photo is busy behind a bubble, swap the photo (don't add dark overlays except on final slides).

**Emoji**
- Max 1 emoji per bubble, at the end, never mid-sentence. Hook line 1: no emoji (line 2 may have one).
- Pick emoji that read at thumbnail size and carry tone: 🫠 😭 💀 🙃 😵‍💫 (relatable), ✅ 💜 📌 👇 (payoff/CTA).
  💜 is FOCO's emoji: use it on the reveal slide.
- Never emoji in tags/labels or inside the FOCO card.
- Known issue: renders use Windows emoji (backlog #1), so keep emoji few and simple until fixed.

**FOCO mascot** (`foco-video/public/mascots/foco_state_<n>_<name>.png`)
- Mascot appears **only on the final reveal slide**, as a small sticker (~220-300px tall) next to the ask or the phone,
  never over a lifestyle photo on content slides (it breaks the "real person's post" feel that makes the format work).
- Pick the state by mood: `5_completion` (celebrating) or `2_alignment` (smiling) for the reveal; `6_pause` (stuck)
  only if the final slide is about being frozen. Not built into Spec.tsx yet (backlog #10).
- The purple blob icon (`public/apps/foco-icon.png`) is the app icon: it's what "(purple blob icon)" refers to, and it
  already sits in every FOCO card header.

## Quality rules (what makes it look native, not "produced")
- **Hook first.** Write 3 hook options for slide 1 and let Adi pick before rendering. It decides scroll vs stop.
- **Text never covers a face** or the interesting part of the photo. If it does, pick another photo
  (per-slide text position is not built yet, see backlog).
- **Prefer Adi's own phone photos** over Pexels when he provides them: real and imperfect beats polished stock,
  and stock images also show up in other creators' posts. Pexels is the fallback.
- **Vary the format.** Check `foco-video/carousels/` and don't repeat the last carousel's main layout or angle
  (relatable/funny, validating, practical tips: rotate).
- **Emoji caveat:** slides render with Windows emoji, which look off next to iPhone UI. Use few emoji in slide text
  until the emoji font is fixed (backlog #1).
- After posting, ask Adi for views/saves/comments and log them (backlog #7), so the next concepts follow what works.

## Backlog (agreed with Adi 2026-10-04, NOT built yet; never claim these exist)
1. iPhone-style emoji font in slides.
2. Per-slide text position (`"textPos": "top" | "middle" | "bottom"`).
3. Generate 3 hook variants as rendered slide-1 options.
4. Own-photo input: a folder Adi drops photos into, used instead of Pexels.
5. Instagram 4:5 (1080x1350) export alongside 9:16.
6. New layouts: iPhone Notes screenshot, iMessage chat, check/cross list.
7. Performance log: carousel, date, views, saves, comments, to steer future angles.
8. Video version (slides + transitions + music) for Reels/Shorts.
9. Phone preview page with download buttons when Adi works from the phone.
10. Mascot sticker option on final slides (see Design system > FOCO mascot).
Priority order Adi saw: 1-4 first.

## Rules (the build lints the first three)
- No em dashes (—). No photo credits in the caption. Never claim FOCO is "not a calendar": it HAS a built-in calendar.
- FOCO facts only from Adi / memory (`project_foco_pricing_facts`): AI breakdown + AI chat are paid ($9/mo, $59/yr),
  manual tasks free, iOS + Android only, focus mode with ambient sounds. Don't say "free app".
- No medical claims or invented stats. Personal-story framing ("cost me $40") is fine; "X% of ADHDers" is not.
- Validating, zero shame, slightly dry humor. FOCO appears only on the last slide (plus `card`/`step` UI).
- Don't recommend competitor apps.
