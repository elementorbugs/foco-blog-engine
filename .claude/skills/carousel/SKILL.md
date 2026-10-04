---
name: carousel
description: Make a FOCO TikTok photo carousel (1080x1920 slides + caption) on a topic Adi gives. Use when Adi says "/carousel", "carousel", "קרוסלה", or asks for TikTok/Instagram slides.
---

# FOCO TikTok carousel

Format copied from a viral app carousel (Flowfy): real lifestyle photo per slide, TikTok-style lilac text bubbles,
an in-app FOCO card, and FOCO revealed only at the end as a casual "btw". Engine lives in `foco-video/`.

## Steps
1. **Concept + hook.** Write 3 hook options (see "The hook") and get Adi's pick first.
   **Concept.** Pick an angle for the topic Adi gave (relatable/funny, validating, or practical-tips). 6-8 slides:
   slide 1 = hook, last slide = FOCO reveal + a question that invites comments. If Adi gave no topic, propose 3 angles.
2. **Write the spec** `foco-video/carousels/<slug>.json` (schema below). Every non-final slide needs a Pexels `query`
   (portrait lifestyle shot, describe the scene, not the emotion).
3. `cd foco-video && node carousel/build.js <slug> photos`, then **Read** `carousel/work/<slug>/sheet.jpg`
   (row = slide in order, column = pick 1-6). Choose photos: real/candid, room for text at top and bottom,
   no visible brand logos, no near-duplicates across slides. Write `"pick": N` into each slide.
4. `node carousel/build.js <slug> render`, then **Read** `out/tiktok-<slug>/preview.jpg` and
   `carousel/work/<slug>/safezones.jpg`. Check: no text in a red zone, text isn't covering a face, nothing overflows,
   bubbles readable on the photo. Fix and re-render.
5. **Deliver by email:** `node carousel/send.js <slug>` emails the slides (JPEG, in order) + caption to Adi.
   Needs `GMAIL_USER` + `GMAIL_APP_PASSWORD` (env vars in the cloud, `.env` locally). On Adi's PC also open the folder
   (`explorer.exe` on `out\tiktok-<slug>`). Reply in Hebrew: concept, slide list, caption, posting tip.

**Running in a cloud session** (Adi's phone, PC off): first `cd foco-video && npm ci` if `node_modules` is missing.
`PEXELS_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` come from the environment's env vars. Rendered files live only in
the session, so step 5 (email) is how Adi gets them. If a step fails on network (Pexels, Chrome download, SMTP),
say exactly which host was blocked so Adi can allow it in the environment's network settings.

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
    { "layout": "focus", "id": "f", "query": "...", "label": "then ONE step at a time", "comment": "...", "stepNo": 1, "stepTotal": 3, "step": "List the chapters", "min": 3, "sound": "Rainy", "result": "no thinking about step 2 yet ✅" },
    { "layout": "card", "id": "d", "query": "...", "label": "...", "comment": "...", "title": "Task name", "steps": [{ "text": "...", "min": 2 }], "result": "actually took: 4 min ✅" },
    { "layout": "final-card", "id": "end", "photo": "hook", "lines": ["...FOCO 💜"], "title": "Task", "steps": [{ "text": "...", "min": 1 }], "ask": "question 👇" },
    { "layout": "final-phone", "id": "end", "photo": "hook", "lines": ["btw the app I use is FOCO 💜"], "screenshot": 3, "ask": "question 👇" }
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
- Bubbles below the middle are narrower (they stay clear of the right rail): keep them ≤ ~30 characters.
  The last two words of every bubble are auto-glued (no lone emoji/word on a line); force other breaks with ` `
  (e.g. "for 3 weeks"). Caption-layout text is bottom-anchored and grows upward.
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

**Final slide = conversion slide** (both `final-*` layouts render this automatically)
- Order top to bottom: reveal line(s) → FOCO proof (real screenshot or breakdown card) + mascot → ask question →
  orange **"🔗 LINK IN BIO"** pill on top of a white **"DOWNLOAD / FOCO PLANNER"** panel with the official **App Store + Google Play badges**
  (`public/badges/`, downloaded from Apple/Google; never redraw or recolor them, keep them black, same height).
- Keep reveal lines short (1 line ideal, ~34 chars per line); the layout reflows below them, but more lines = smaller phone.
- No need to write "(purple blob icon)" anymore: the icon is in the download panel. Never write "free" (AI is paid).

**Emoji**
- Max 1 emoji per bubble, at the end, never mid-sentence. Hook line 1: no emoji (line 2 may have one).
- Pick emoji that read at thumbnail size and carry tone: 🫠 😭 💀 🙃 😵‍💫 (relatable), ✅ 💜 📌 👇 (payoff/CTA).
  💜 is FOCO's emoji: use it on the reveal slide.
- Never emoji in tags/labels or inside the FOCO card.
- Known issue: renders use Windows emoji (backlog #1), so keep emoji few and simple until fixed.

**FOCO mascot** (`foco-video/public/mascots/foco_state_<n>_<name>.png`)
- Mascot appears **only on the final reveal slide** (built in: `5_completion` sticker next to the phone / on the card's
  corner), never over a lifestyle photo on content slides (it breaks the "real person's post" feel the format relies on).
- For a different mood, change `Mascot` in Spec.tsx: `2_alignment` (smiling) or `6_pause` (stuck, only if the final
  slide is about being frozen).
- The purple blob icon (`public/apps/foco-icon.png`) is the app icon: it's what "(purple blob icon)" refers to, and it
  already sits in every FOCO card header.

## Value + FOCO messaging (Adi's standing rule: creatives must teach something AND sell FOCO's benefits clearly)

**Value first.** Every carousel must leave the viewer with something usable even if they never download FOCO:
a reframe ("it's a starting problem, not laziness"), a concrete tiny first step, or a method (one step at a time).
Rough split: ~80% value/relatable, ~20% FOCO. A carousel that is only jokes or only an ad fails the bar.

**FOCO's benefits, in the order they happen** (the story to tell, in plain feelings, not feature names):
1. **Tell it the stuck task** by typing, talking or snapping a photo → "you don't have to plan it yourself".
2. **It breaks it into tiny first steps with time estimates** → "step 1 is so small you can't say no to it".
3. **Focus mode, one step at a time:** a timer for just that step + calm background sounds (Silence, Study, Jazzy,
   Chill, Rainy) → "you only think about this one step; the rest can wait".
4. **Feels like someone working next to you** (AI companion presence, never "real people") → "you're not alone in it".
5. Built-in calendar + reminders for saved tasks (secondary; don't lead with it).

**Show, don't claim.** Prove each benefit with the matching visual:
| benefit | layout / asset |
|---|---|
| breakdown into steps | `card` (FOCO "Let's break it down" card) or `final-phone` screenshot 3 |
| one step + timer + music | `focus` layout (step N of M, timer, mascot, "<Sound> sounds playing") |
| a single tiny first step | `step` layout |
| chat / photo input | real screenshot 2 (`final-phone` with `"screenshot": 2`) |
| timer screen | real screenshot 4; sound picker: screenshot 6 |
A strong FOCO-forward carousel walks the method: stuck task → `card` breakdown → `focus` on step 1 → `result` win.

**Benefit copy that works** (lowercase, first person, outcome-first):
"I just tell it the task and it gives me step 1" · "rainy sounds on, ONE step on screen, that's all I look at" ·
"no thinking about step 2 yet" · "it's like someone's working next to me".
**Avoid:** feature lists, "AI-powered productivity", "best app", "free" (AI breakdown is paid), any medical promise
("fixes ADHD", "boosts dopamine"), and "not a calendar" (it has one).

## The hook (slide 1): ALWAYS strong. Adi's standing rule.
Slide 1 decides swipe vs scroll; spend the most effort here. Before rendering, **always show Adi 3 hook options**
(different formulas) with a one-line "why it stops the scroll", and render the one he picks.

**Formulas that work for this audience**
- **Specific confession:** "I avoided ONE email for 3 weeks" (number + tiny task + shame-free honesty)
- **Contrast / gap:** "Tasks I avoided for WEEKS vs how long they actually took"
- **Call-out:** "If you've ever cleaned the whole house instead of the ONE task..."
- **Myth-flip:** "It was never laziness" / "Things that look lazy but aren't"
- **List with stakes:** "5-minute tasks that cost me $300 (ADHD tax)"
- **POV / scene:** "POV: it's 11pm and you still haven't sent the invoice"
- **Insider label:** "ADHD edition", "only ADHD people will get slide 4"

**Hook checklist** (all must pass)
- Line 1 ≤ 8 words, readable in 1 second; the rest goes in line 2 / the white tag.
- Concrete, not abstract: a real task, number, time or object ("3 weeks", "ONE email", "$40"), never "productivity tips".
- Creates an open loop the next slides close (vs, list, "slide 4", a question).
- Relatable pain or tension in the viewer's own words (lowercase TikTok voice), zero shame.
- **No brand and no app in the hook.** FOCO only on the last slide.
- Photo: a person or a strong scene with clear space in the middle third for the bubbles.

## Quality rules (what makes it look native, not "produced")
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
10. ~~Mascot sticker on final slides~~ (done 2026-10-04).
Priority order Adi saw: 1-4 first.

## Rules (the build lints the first three)
- No em dashes (—). No photo credits in the caption. Never claim FOCO is "not a calendar": it HAS a built-in calendar.
- FOCO facts only from Adi / memory (`project_foco_pricing_facts`): AI breakdown + AI chat are paid ($9/mo, $59/yr),
  manual tasks free, iOS + Android only, focus mode with ambient sounds. Don't say "free app".
- No medical claims or invented stats. Personal-story framing ("cost me $40") is fine; "X% of ADHDers" is not.
- Validating, zero shame, slightly dry humor. FOCO appears only on the last slide (plus `card`/`step` UI).
- Don't recommend competitor apps.
