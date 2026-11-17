# FOCO paid-ad carousel playbook (approved by Adi 2026-11-17)

Reference build: `foco-video/carousels/ad-mom-nap-time-v9.json` -> `out/tiktok-ad-mom-nap-time-v9/`.
Read this whole file before any ad carousel. It wins over the organic defaults in SKILL.md.

## 1. Story structure (9 slides)
| # | Role | Layout | Example (ADHD mom) |
|---|---|---|---|
| 1 | Hook: audience + specific tension | `hook` (+ `tag`, `textTop`) | "Mom with ADHD here:" / "baby fell asleep ON me ⏳" / "1 hour. just me and my phone." |
| 2 | The plan (small, doable) | `caption` + `time` | 2:00 pm "3 things I can do from my phone" |
| 3 | The avoidance (funny, specific) | `caption` + `time` | 2:40 pm "40 minutes later:" / "I'd watched 30 reels 🫠" |
| 4 | Shame-free reframe | `caption` + `time` | "I'm not lazy." / "I just can't start." |
| 5 | Differentiator 1, BEFORE: say it | `voice` | "so I just said it out loud 🎙️" + messy transcript |
| 6 | Differentiator 2, AFTER (the WOW): in my day | `daycal` | "2 seconds later: in my day ✨" |
| 7 | Differentiator 3: FOCO with her | `withme` | "then FOCO stayed with me while I started 💜" |
| 8 | Outcome + number contrast | `caption` + `time` | "all 3 done in 16 min ✅" / "right before she woke up 🥹" |
| 9 | Sell | `final-ad` | core line + 3-icon recap + CTA pill + badges |

Rules of the arc:
- ONE character, ONE place, ONE afternoon. The clock chip moves forward every slide (2:00 -> 2:40 -> 2:42 -> 2:58).
- Slides 5 -> 6 are a before/after pair with the same framing: the swipe IS the reveal.
- A number contrast closes the loop (40 min scrolling vs all 3 done in 16 min).
- Every slide = one big sentence readable in 1 second. Squint-test the preview at thumbnail size.
- The text must describe what the image shows (scrolling face -> "watched 30 reels"; baby awake -> "before she woke up").
- Option to test: cut slide 2 so FOCO appears by slide 4.

## 2. Images: Gemini, one consistent person (never Pexels people in ads)
Pexels forbids implying an identifiable person endorses FOCO or has ADHD. Generate instead.
1. Anchor scene: `python viral-lab/tools/gemini-image.py out/s1.png p1.txt --model gemini-3-pro-image-preview --norefs`
2. Every other scene: same command + `--ref out/s1.png` and a KEEP block ("the SAME woman (face, hair, outfit, ring),
   the SAME baby, the SAME couch/plants/window/side table, same light ... only the action changes").
3. Crop all scenes identically so faces read at phone size: width 72% of the image, 9:16, center x 40% / y 47%.
   Final slide uses the UNCROPPED anchor-family image (wide, both faces visible in the middle band).
4. Save to `foco-video/carousels/own/<slug>/sN.jpg` and use `"own"` on each slide.

**Look = real but fresh, never worn out** (Adi rejected the tired version):
- Prompt: "Candid iPhone photo, vertical 9:16, warm golden afternoon sunlight through a big window, slight natural
  grain. Bright, airy, cozy apartment: cream linen couch, green plants, wooden side table with mug, baby bottle and a
  small stack of mail. Lived-in but nice. Real photo, not stock, no studio light, no text, no logos."
- Person: ~30, naturally pretty, healthy skin, light natural makeup, hair in a claw clip with loose strands, cozy cream
  knit sweater, gold ring/hoops. "A real mom on a normal good day."
- Frustration = a sigh / hand on forehead, never haggard. Phone screen always faces away from camera.
- Useful props per beat: phone held up (plan), blank scrolling stare (avoidance), phone near lips whispering (voice),
  one white earbud + calm thumb tap (focus with music), baby awake looking up (win).
- Ask for "face in three-quarter view toward the camera" so expressions read.
- Meta/TikTok: turn on the AI-generated disclosure when uploading.

## 3. Visual system
**Text bubbles (photo slides):** story line = Poppins 700 in lilac bubble (`#EFE7FF` / `#6D28D9`), 56-58px;
inner voice = Caveat handwriting in white bubble, 46-52px; time chip top-center on caption slides.

**FOCO UI cards = light widget style** (`LightCard` in Spec.tsx), all identical shell:
- 880px wide, radius 48, padding 30/34, background `rgba(255,255,255,0.96)`,
  shadow `0 40px 100px rgba(40,10,80,0.35)` + ring `0 0 0 2px rgba(167,139,250,0.35)`.
- Header row: full FOCO logo (`foco-logo.png`, mascot + wordmark, 56px) left, status chip right
  (recording = red `#DC2626` on `#FEE2E2` with dot + "0:12"; calendar = "📅 Today" lilac; focus = "● focus mode" lilac;
  sorted = green `#15803D` on `#DCFCE7`).
- Highlighted step = purple gradient `linear-gradient(135deg, #7C3AED, #9F67FF)`, white text, "STEP 1" small caps,
  min chip `rgba(255,255,255,0.22)`, glow `0 12px 30px rgba(124,58,237,0.4)`.
- Dimmed rows = 50% opacity or soft `#FAF8FE` fill. Calendar rows get a colored left bar (purple / orange / green).
- Primary button = near-black `#160F22` pill, 80px, "▶ Start step 1".
- Cards are bottom-anchored at y 1480 (inside IG 4:5 band 140-1490); labels at top y 260.

**Layouts (all in `foco-video/src/carousel/Spec.tsx`):**
- `voice`: transcript in Caveat 50px with "um"s, glowing mic (purple gradient + 2 halo rings), waveform bars
  (filled purple / pending `#DDD6FE`).
- `daycal`: time column (2:45 pm ...) + task rows; task 1 shows "✨ split into N tiny steps, 1 tap" + lit STEP 1.
- `withme`: mascot `mascots-hd/focus.png` in a soft radial glow, "STEP 1 OF 3", task, big timer (Sora 800, 72px,
  purple), progress bar, "🌧️ Rainy sounds playing" pill, "I'm here with you 💜" in Caveat.
- `plan` / `step` with `"style": "pro"`: same light card family (alternatives to daycal).
- `final-ad`: sharp happy photo, gradient only top + bottom, core line at y 210, 3-icon recap card at y 440
  (92px emoji circles `#F5F0FF`, arrows `#A78BFA`, labels Poppins 800 28px, keep each label one line ≤16 chars),
  purple CTA pill straddling a white download panel (icon 96px, "ADHD PLANNER" / "FOCO", official badges 70px).

## 4. Copy rules
- First person only ("Mom with ADHD here:"), never "you have ADHD" / "are you a mom with ADHD?" (Meta health policy).
- No "free", no prices, no "link in bio" in ads, no store rating or review quotes
  (see memory `project_app_store_reviews_suspicious`).
- Every product claim must match the real app (speed of voice -> tasks, auto times in calendar, companion screen):
  confirm with Adi before spending.
- Ship `ad-copy.md` in the out folder: 3 primary texts (hook in first 125 chars), 3 headlines ≤40 chars,
  CTA button, one card headline per slide.

## 5. Pre-ship checklist
- [ ] preview.jpg squint test: every slide readable at thumbnail size, one idea each
- [ ] safezones.jpg: no text in red; nothing covers a face
- [ ] same person/baby/room on every photo slide; text matches each image
- [ ] no orphan word on its own line (shorten the label)
- [ ] claims confirmed; AI disclosure on; ad-copy.md written
- [ ] upload `ig-slide-N` (4:5) to Meta feed, `slide-N` (9:16) to Stories/Reels/TikTok
