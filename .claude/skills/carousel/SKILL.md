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
   (each slide = a 6x2 block in order, picks 1-12 left-to-right, top row first). Choose photos: real/candid, room for text at top and bottom,
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
Cloud sandboxes block SMTP, so cloud delivery needs `RESEND_API_KEY` (send.js switches to Resend automatically;
verified working 2026-10-04). Always `git pull` first in a reused session so the latest scripts run.

## Spec schema
```json
{
  "slug": "study",
  "tiktok": { "caption": "...", "hashtags": ["#adhd", "#adhdcleaning", "#adhdtiktok"] },
  "instagram": { "caption": "...", "hashtags": ["#adhd", "#adhdtips", "#adhdcleaning"], "altText": "..." },
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
- `phone` shows a real screenshot MID-carousel: `{ "layout": "phone", "id", "query", "label", "comment"?, "screenshot": N, "result"? }`
  (label/comment top, screenshot centered, optional green result). Screenshots: 1 = home/Start Focus,
  2 = Chat it / Speak it / Scan it input, 3 = Break It Down, 4 = focus timer, 5 = Add task with date + reminder, 6 = sounds,
  7 = REAL calendar (Sessions) view: "Write mail" 4 steps 5/8/5/2 min, 8 = REAL focus-mode start screen (soundscape, Rainy),
  9 = "Stuck? Tell FOCO" chat/speak/scan (dark, newer). 7 and 8 are raw phone screens: add `"crop": [y0, y1]` (0-1 slice
  of the screen, e.g. 7: [0.06, 0.8], 8: [0.535, 0.86]) so they render large and readable instead of a tiny phone.
  10 = "Your Day, Simplified" calendar (banana cake), 11 = "Build Momentum" stats (shows "FREE AI 2/3 uses": avoid,
  we never say free), 12 = "Feeling Stuck? Let FOCO Guide You" chat: "i want to write mail to my boss" -> "Added to
  your sessions" (use `"crop": [0, 0.68], "aspect": 2.085`). 10-12 are App Store cards with the white frame cropped off.
  Keep the example task consistent with the screenshots (7, 8 and 12 are the "Write mail" task).
- `inputs` = the capture step drawn LARGE (Speak it / Scan it / Chat it cards in the app's colors):
  `{ "layout": "inputs", "id", "query", "label", "comment"?, "result"? }`. Adi (2026-10-05): show features up close;
  a full screenshot shrunk into a slide is "noise, not the point". Prefer `inputs`/`crop` over whole screenshots.
- **Creative library** (`foco-video/public/creatives/`, from Adi 2026-10-05; use as ideas AND as slide visuals via
  `phone` + `"image": "creatives/<file>"` instead of `screenshot`, add `crop`/`aspect` to zoom). Aspect 941x1672 = 1.777.
  - `speak-email-boss.png`: "JUST SPEAK IT." real chat: "I need to email my boss." -> "Email my boss, 25 min, Added to
    your Sessions" + mic button + inset "Or upload a photo of your task list". Best capture-step visual for the
    email story (matches screenshots 7/8/12).
  - `speak-snap-split.png`: "JUST SPEAK IT. Name the task you're procrastinating on" phone + a to-do notebook in scan
    corners ("OR SNAP YOUR LIST"). Has a white rounded frame: crop it.
  - `speak-it-dark-1.png` / `speak-it-dark-2.png`: dark poster style, mic + mascot, "I need to plan my week and finish
    the report" -> "FOCO turned this into tasks" list, plus a hand snapping a handwritten to-do list -> tasks.
    Illustrated marketing art (not exact UI): good for a hook/reveal or as inspiration, not as "proof" screens.
  - `snap-list-to-day.png` (+ `-crop.png`, frame removed, aspect 1.756): "SNAP YOUR LIST. FIND IT IN YOUR DAY."
    handwritten to-do (Email my boss, Book dentist, Buy groceries) -> arrow -> Sunday calendar with the same 3 tasks.
    The clearest "photo of a paper list -> my day" visual; perfect for a scan-it carousel.
  - `speak-email-boss-crop.png`: frame removed (aspect 1.756). Used in head-to-done step 1 with crop [0.335, 0.88].
  - `chat-input-closeup.jpg`: close-up of the real chat empty state "Hi, it's FOCO. Name the task you're
    procrastinating on" + input bar (camera, mic). Landscape: use for a zoomed "this is all you see" detail.
  Creative ideas these support: "voice note to tasks" (say one messy sentence, get a clean list), "photo of my paper
  list -> app", "the only screen you need: one input box", before/after messy thoughts -> clear tasks.
- `"own": "carousels/own/<file>.jpg"` on a slide uses Adi's own phone photo instead of Pexels (no `query`/`pick`).
- Keep each bubble under ~45 characters; slides look best with one idea each.

## Captions (organic reach; Adi's standing rule: every carousel ships a TikTok AND an Instagram caption)
Spec fields (build lints them; no `caption`/`hashtags` at top level anymore):
`"tiktok": { "caption": "...", "hashtags": [3-5] }`,
`"instagram": { "caption": "...", "hashtags": [3-5], "altText": "..." }` → `caption-tiktok.txt` / `caption-instagram.txt`.

**Both platforms are search engines now: write for search.** Put the phrase people actually type in the first line
("how to clean your room with ADHD", "ADHD study tips", "task paralysis"), in natural words, not a keyword list.

**TikTok** (lowercase, casual, ~300-600 chars)
1. Line 1 = search phrase + the slide topic ("how to clean your room with ADHD when you can't start 🧹").
2. 1-3 lines summarizing the value from the slides (the method/tips in plain words), so the caption stands alone.
3. Engagement: one specific comment question ("what task have you been avoiding for weeks? 👇") + "save this for ...📌".
4. Soft FOCO line last: "the app on the last slide is FOCO, link in bio 💜".

**Instagram** (sentence case, can be longer, line breaks)
1. First ~125 chars (shown before "more") = searchable hook headline.
2. A short reframe line, then the takeaways as a numbered list (mirrors the slides).
3. One result/proof line ("22 minutes later...").
4. CTA: save + send to a friend (shares/saves drive IG reach), then "💜 The app I use ... is FOCO, link in bio."
5. `altText`: one plain sentence describing the slides + topic keywords (accessibility and IG search).

**Hashtags: 3-5 per platform**, never 20: 1 broad (#adhd), 2-3 topic-specific (#adhdcleaning #taskparalysis
#adhdstudent ...), 1 community (#adhdtiktok on TikTok, #adhdtips on IG). Put them at the end.
Brand/benefit rules apply: no "free", no medical promises, no em dashes, no photo credits.

## Design system (canvas 1080x1920; a phone shows it ~2.8x smaller, so 1 phone pt ≈ 2.8 px here)

**Instagram:** IG crops 9:16 carousel images to 4:5, cutting top text. render also writes `ig-slide-N.png`
(1080x1350 = the y 140-1490 band of each slide, `SpecSlideIG`). Tell Adi to upload the ig-slide files to Instagram.
This only works because all text stays inside the safe band below, so the safe-zone rule protects IG too.

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

**Emoji** (Adi wants more emoji: they make slides lively; updated 2026-10-04)
- Rendered with the bundled **Noto Color Emoji** font (`public/fonts/NotoColorEmoji.woff2`), identical on Adi's PC
  and in the cloud. Runs of emoji are auto-glued so they never wrap onto a line alone.
- **1-2 emoji per bubble**, at the end (a run like "🌧️🎧" counts as 2). Hook line 1 may end with one.
- **Sticker:** add `"sticker": "🧺"` to most slides: one big tilted emoji (130px, shadow) like a TikTok sticker,
  at a safe default spot per layout; override with `"stickerPos": [x, y]`. Check it doesn't cover a face, the step
  chip or text; keep it inside the safe band.
- Pick emoji that carry the slide's object or feeling: objects (🧺 📝 ⏱️ 🧹 📚) for stickers, feelings
  (🫠 😵‍💫 🤯 😌 💀 🙃) in bubbles, ✅ for wins, 💜 for FOCO, 👇 📌 for CTAs.
- Never emoji in tags/labels or inside the FOCO card UI.

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
2. **One tap to break it down (AI):** after the task is in the calendar/sessions, the user CHOOSES whether to split it
   into small steps, with one tap ("Make subtasks using FOCO"); it is not automatic (Adi, 2026-10-05). Copy: "one tap
   and it breaks it into tiny steps", never "it lands already broken down".
   **It breaks it into tiny first steps with time estimates** → "step 1 is so small you can't say no to it".
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
**ONE task end to end (Adi, 2026-10-05, hard rule):** a process carousel follows ONE task with ONE name, ONE total
time and ONE step list on every slide (capture, calendar, breakdown, focus, final). Never mix screenshots of
different tasks ("Email my boss" 25 min next to "Write mail" 20 min is wrong). If no real screenshot shows that exact
task, draw the screen (`calendar`, `card`, `focus`, `inputs`, `final-card`) with the same name/minutes; step minutes
must add up to the total. Before rendering, list task name + total + steps per slide and check they match.
**The FOCO process, in this order (Adi's words):** 1. say it / snap the list / type it -> it lands in the calendar.
2. OPTIONAL: if you want, ONE tap and FOCO's AI breaks the big task into steps (never automatic, say "if I want").
3. pick a step, start a timer with music YOU choose. 4. finish it, move on to the next one if you want.
`calendar` layout = Sessions day view with the task + the optional "MAKE SUBTASKS USING FOCO" button:
`{ "layout": "calendar", "id", "query", "label", "comment"?, "title", "min", "category", "result"? }`.
Example: `carousels/head-to-done.json` (Email my boss, 25 min, 3/4/13/5).
**Show the whole in-app process (Adi, 2026-10-05):** "I want them to see a process." Default FOCO-forward structure is
the full flow: task pops into your head → capture it (`phone` screenshot 2: say it / snap the list / type it) →
it lands in the calendar with a reminder (`phone` screenshot 5) → `card` breakdown → `focus` with timer + sound → win.
Number the steps on the slides ("step 1: ..."). Example: `carousels/head-to-done.json`.

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
- **No brand and no app in the hook.** FOCO can appear from slide 2 on (process carousels show the app throughout).
- Photo: a person or a strong scene with clear space in the middle third for the bubbles.

## Quality rules (what makes it look native, not "produced")
- **Photos must not look like stock (Adi's standing rule, 2026-10-04).** build.js fetches 12 candidates per slide
  and every slide gets a "phone photo" grade (warmer, softer saturation, grain, light vignette) in `Photo`.
  **Queries:** concrete scene + light + mood, e.g. "lying on bed surrounded by clothes", "relaxing with tea at home
  window light", "cozy tidy bedroom morning sunlight". Words that pull authentic results: natural light, window light,
  candid, cozy, morning, overhead, close-up, POV, real home. Avoid generic queries ("woman cleaning", "messy room").
  **Pick:** natural/window light, real homes, imperfect angles, candid moments, details (a mug, hands, fabric), warm
  or moody tones. **Reject:** studio/plain-wall backdrops, posed smiles or kissy faces at the camera, uniforms
  (maids, hazmat), perfect hotel rooms, obvious stock gestures, flat over-lit images, and two near-identical shots
  from the same shoot on consecutive slides.
- **One narrator per carousel (Adi's standing rule, 2026-10-04).** Carousels are first-person ("my room"), so a
  different person on every slide reads as stock and kills authenticity. Default: **no faces at all** (hands,
  objects, rooms, overhead/flat-lay, POV-from-the-eyes shots), like the Flowfy original. Write Pexels queries for that
  ("hands folding laundry overhead", "POV laptop on bed", "messy desk top view"). If any slide shows a person, every
  other visible person must be the **same person from the same shoot** (same photographer/series), otherwise no faces.
  Reject candidates that break this, even if the photo is better. Adi's own photos (backlog #4) beat both.
  **How (built in):** set `"narrator": "young blonde woman"` at the spec's top level and `"person": true` on every
  slide that shows a person, hands or body; build.js prefixes their Pexels query with the narrator. When picking,
  match **gender, skin tone, approximate age and hair** across all person slides (hands too: same skin tone),
  rejecting any candidate that doesn't, even if it's a better photo. Slides with `"person": false` show only
  objects/rooms. If the hook photo has a face in the middle third, set `"textTop"` (e.g. 1060) so the bubbles sit
  below the face (keep the block above y 1500).
  **Same-shoot mode (default whenever slides show a person):** set `"sameShoot": true` (+ `"narrator"`, e.g. "woman").
  build.js searches every person slide deep, splits each photographer's results into shoots (photo IDs uploaded
  together, `shootGap` default 3000; **use 60** to get one model, one home), ranks shoots by slides covered, and
  person slides pick ONLY from that shoot (prints the top shoots; `"shootIndex": N` picks another). Matching hair
  color alone is NOT enough (Adi rejected a blonde/curly/older mix): same model, same home, every person slide.
  Adapt the copy to what the shoot actually shows if needed; object/room slides (`person: false`) stay free.
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
1. ~~Consistent emoji font~~ (done 2026-10-04: Noto Color Emoji bundled; Apple emoji can't be licensed).
2. Per-slide text position: hook has `textTop` (done 2026-10-04); other layouts still fixed.
3. Generate 3 hook variants as rendered slide-1 options.
4. ~~Own-photo input~~ (done 2026-10-05: `"own"` per slide; photos live in `foco-video/carousels/own/`).
11. ~~Same-shoot mode~~ (done 2026-10-04: `sameShoot`, `shootGap`, `shootIndex`).
5. ~~Instagram 4:5 export~~ (done 2026-10-04: `ig-slide-N.png`, emailed with the TikTok slides).
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
- Validating, zero shame, slightly dry humor. No FOCO in the hook; after that, show the app wherever it proves the process.
- Don't recommend competitor apps.
