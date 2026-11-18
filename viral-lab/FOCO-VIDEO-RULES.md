# FOCO video rules (mascot list reels)

The standing rules for every FOCO social video in this format. Evidence lives in playbook.md; this file is the checklist.
Update it when Adi gives a correction or when the playbook turns a hypothesis into a pattern.

**Scope (2026-11-18):** the voice, third-person, pace, caption and image-cost rules below are for the MASCOT LIST REELS
(and, in their own section, app explainers / rankings). Jess stories (carousel, Story video, VSL) follow
`.claude/skills/carousel/spec.md`. The one cross-format checklist, with the contradictions resolved, is
`viral-lab/CREATIVE-RULES.md`: a reviewer checks against that file.

## Character (Adi, 2026-10-27)
- **HARD RULE: FOCO always has BOTH arms and BOTH feet, visible, in every single shot.** (Adi, 2026-10-27: "no way FOCO
  without hands or legs, it's really weird; it must never happen again".) Every generation prompt says "both short pill
  arms and both round ball feet clearly visible"; every image is checked for 2 arms + 2 feet before it goes into a video,
  and any shot where a limb is missing, hidden by a prop, cropped or merged into the body is regenerated, never shipped.
- **NO LEGS.** The ball feet sit directly under the body. Action poses (lifting, pushing, walking) make the model add
  stick legs (4 of 10 shots on 2026-10-27), so every prompt also says "NO LEGS: the two round ball feet attach directly
  to the bottom of the egg body exactly like the reference, never on sticks".
- **Every picture shows ITS line** (Adi, 2026-10-27: "some creatives don't match the text"). One idea per picture: when
  a sentence holds two ideas ("gets worse" + "the more you care"), it gets two pictures; the joke in the line
  ("like it owes you money") must be visible, not just the setting. The first picture is the scroll-stopper: a
  dramatic, readable action (spotlight + "shhh"), never a neutral standing pose.
- **Use the OFFICIAL FOCO, never an AI redraw, wherever possible.** Adi's design files: character/official/
  (1 Presence ... 6 Pause, 4267px transparent PNG; source zip "FOCO charecter updated"). Cropped 1600px copies for
  Remotion: foco-video/public/mascots-hd/{presence,alignment,focus,drift,completion,pause}.png.
- **Scene method = composite**: the AI draws ONLY the scene (props + background, "NO character", empty spot left for
  it); the official FOCO state is placed on top in code at the fixed size, standing on that scene's anchor line
  (floor / chair / bed). Identity and size are then exact. Pick the state by mood: presence calm, alignment happy,
  focus working, drift worried, completion win, pause tired/overwhelmed. AI-drawn FOCO only when a scene truly needs an
  action pose; then use the official states as references and normalize its size.
- **Animation = the rig**: foco-video/src/foco/FocoRig.tsx assembles FOCO from the official .ai layers
  (public/foco-rig/<state>/<part>.png, re-export with `python viral-lab/tools/export-rig.py`). Motions: breathe,
  blink (dot-eye states), wave, cheer, bounce with squash, glow pulse. size=1000 -> body ~24% of a 1920 frame.
  Check: character/rig-test.mp4. Known gap: alignment's hands cross the belly, so a wave needs side hands.
- **The official images are the source for EVERY pose** (Adi, 2026-10-27: "always work from those images, that is your
  source"). New poses/actions are generated with the official states as references and checked against them.
  The earlier 2D redraw idea (sheet-v2a/v2b) is a fallback only.
- **It must be FOCO, not a new character** (Adi rejected v1, 2026-10-27: "it doesn't look like my FOCO"). Identity
  from the app (Chat screen) and public/mascots/foco_state_*.png: egg body (narrow rounded top, wide bottom),
  deep violet-indigo (#4c1d95-#6d28d9), eyes = closed curved arcs (calm) or small black dots (awake), small curved
  smile, magenta-pink cheeks, short pill arms at the sides, two round ball feet in body colour, sitting pose,
  thin white rim-light line along the head. NEVER: white eyeballs, hair/tuft, nose/beak, coloured feet, lavender body.
- **One canonical design, every scene**: character/sheet-v2a-outline.png (recommended, pending approval) or
  sheet-v2b-soft.png. Arcads references: presence 2caec105..., alignment 0cdb7d76-9359-4f05-a46a-d88eb6b67691,
  drift 5901b960-5f84-48a5-a49f-14522d1289ae (videoassets/<id>.png). Rejected attempts in character/rejected/.
- **Size: the character was too big before.** Target body height ~24% of the frame (~460px of 1920), the same in
  every scene (+-2%), feet on one baseline at ~66% height (~1270px). References: neuronpond and bob.saner median 24%;
  ours ranged 5-59%. Enforce in post with a normalize step, not by prompt alone. Oversized FOCO on a flat background: shrink the
  scene first with tools/shrink-pad.py <png> <24.5/bodyPct>, then normalize.py (zoom-in only).
- Props tell the joke: few, readable, outlined like the character; a foil character when the line has "other people".
- Background: one solid muted mid-tone per episode (teal #3a6b80 / slate / dusty purple), never near-black.

## Voice
- **ONE continuous take, never stitched per line** (Adi, 2026-10-27: "the speech sounds strange, it doesn't flow").
  Per-line clips restart the intonation every 2-3s and the 0.3s gaps chop it. Use tts/flow-vo.mjs (sentence chunks
  <= 30 words joined with a 0.12s breath; Kokoro truncates longer input) + tts/flow-words.py, render with FlowReel.
  Picture cuts follow the audio (cue phrases), not the other way round.
- **Natural speed** (1.0-1.1). Never push Kokoro to 1.3: it distorts. Reach the pace by writing tighter, not faster.
- Voice engine: Microsoft neural voices via tts/edge-flow.py (free, natural, exact word timings, no whisper).
  Default en-US-AndrewNeural at +8% (~205 wpm). Kokoro was rejected as "not enough"; ElevenLabs if Adi adds a key.
- **Not too serious** (Adi, 2026-10-27: the am_adam/am_liam/am_eric/am_puck test voices were "too serious, I don't like it"). Warm, friendly, a little playful; still steady, not sing-song. Pick by Adi's ear, not only by the pitch numbers.
- Calm male narrator, steady storyteller, not sing-song. Kokoro am_adam is the closest match to the genre
  (114Hz, pitch range 13.5 st, movement 4.7 vs references 120-128Hz, 12-14 st, ~5). Second: am_liam.
  Samples in character/voice-tests/. (Our old af_heart: female 185Hz, range 20-24 st = too bouncy.)
- Gemini leaves ~0.6s between sentences: run tts/tighten-gaps.py after gemini-flow.py (cuts silences to 0.22s,
  shifts the timings). Then measure: 27-38s, ~200+ wpm.
- 180-220 words per minute, almost no pauses (references 180-226; ours were 130-167 = too slow).

## Script
- **Start from ONE pain (Adi, 2026-11-18: "the most important thing").** Source: `tasks/avatar-research-2026-11-18/
  avatar-adhd-freelancer.md` (the chosen avatar's pains in their exact words + dreams) and `pain-bank.md` (P1-P20,
  each with its true FOCO answer). The video plan built on it: `viral-lab/pain-videos-plan-2026-11-18.md`.
  Write the P-number in brief.md and results.md.
- **Hook formulas: see hooks.md "Opener formulas"** (Adi's lists, 2026-10-27). Strongest: the taboo family
  ("No one talks about this, but..." / "Nobody wants to admit this, but...") - opener and payoff in ONE breath.
- **BASE RULE: say "people with ADHD", never "ADHD people"** (Adi, 2026-10-27: "ADHD people" sounds stuck/clunky).
  Person-first in every script, caption and cover ("people with ADHD", "if you have ADHD", "an ADHD brain" is fine).
- **BASE RULE: the hook opens a curiosity gap within 3 seconds.** By second 3 the viewer must want to know something
  ("...are weirdly productive" -> why weird?). No setup, no label-then-explain; the first sentence carries the twist.
- **Write it to be SPOKEN, flowing** (Adi, 2026-10-27: "the text doesn't flow"). Real sentences with connectors and
  little asides ("They'll explain quantum physics at 2am like it's the most exciting thing in the world, and then that
  same brain can't reply to one email"), not a repeated "They can X, and still not Y" formula. Read it out loud first.
- Optional test, NOT a rule (it conflicts with the base rule above, which wins): a 2-word identity label before the
  claim ("Gifted ADHD." / "ADHD in women."). Only when the label itself opens the curiosity gap.
- Third person: "they / people with ADHD" (never "ADHD people", base rule above), so viewers identify and tag someone.
- Body: "can do the HARD thing, but can't do the EASY thing" contrasts; the punchline is task initiation (our niche).
- Prefer flattering identity + pain over pain alone.
- End on a tender or unresolved line; test a spoken "send this to ..." close.
- No unsourced medical claims, zero shame (CLAUDE.md). Don't copy the mean tone of "spotting low IQ".

## Pace and length
- A new picture every ~2.4s (split a sentence across 2 pictures). 27-38s total.
- FOCO close: short (<= 4s) or caption-only; A/B test with vs without (see playbook).

## Captions and text
- 2-4 word chunks, one highlighted word, inside the safe zone (14%-75% height, off the right edge).
- Post caption: a 600-2000 char keyword-rich mini-article (executive function, task initiation, ...) + 3-5 hashtags.

## Series rules (Adi, 2026-10-25)
- Every episode: zero reused scene art, its own FOCO close built on the feature that answers its problem,
  its own end-card line and cover. Compare against every earlier episode before rendering.
- Cover: 9:16, text + character inside the safe zone, the profile grid crops to the central 3:4.

## App explainer / ranking videos (Adi, 2026-11-15)
- **Must not look AI-designed.** Reference = Saner.AI's own YouTube videos (@sanerai_official, ingested in
  references/youtube-@sanerai_official-*), NOT the bob.saner cartoon reels. Language: plain black type-on title cards,
  real app screens/recordings on a plain light ground with slow punch-in zooms, hand-drawn arrows + handwritten notes
  (Caveat), simple white captions. No glow, gradients, glass cards, check-mark chips or floating tilted phones.
- **No competitor images at all** (Adi, 2026-11-15: "don't take images from competitors"). No store screenshots, no
  screens inside a phone. A competitor = its name typed on + handwritten notes on what it does. Only FOCO gets real
  screens. This replaces the 2026-10-16 rule of explaining each app over its App Store screenshots.
- **Update, same day:** ranking videos = FOCO #1 first, then ONLY apps that don't compete directly (no Tiimo,
  Structured, Goblin Tools...). Their store screenshots ARE fine, shown flat as cards (never inside a phone).
  A fixed CTA bar sits at the bottom the whole video ("Download FOCO: link in the description"): the goal is
  the description link -> download.
- **Shorts CTA (Adi, 2026-11-15):** every Short ends on a 3 s FOCO download card (icon, tagline, both store badges, "Link in the description") and the description opens with a FOCO block + both store links and repeats the CTA at the end.

## Image cost rules for FOCO animation (Adi, 2026-11-15: "save tokens on images")
- Model: Gemini Flash Image only (viral-lab/tools/gemini-image.py, GEMINI_IMAGE_KEY, ~$0.04/image). No Pro models, no 2K/4K.
  (Mascot scenes only. The one exception is a recurring human character, Jess or a test mom: her images use the Pro
  model with her anchor so the face stays the same, see `.claude/skills/carousel/SKILL.md`.)
- 3-4 images per reel, not one per line: one base scene per setting; light bulbs, hearts, bubbles, "?", noise doodles,
  text in bubbles are code overlays on top of it. Target ~15 cents per reel.
- Test ONE image to lock the look, then batch the rest; redraw only the failed ones, never the whole set.
- Review generations on ONE small contact sheet, once (saves Claude tokens too).
- No ring/halo/floor glow under FOCO (Adi). Conversations: characters face each other, varied camera (wide, over-shoulder, close-up).
- Open question for Adi: may backgrounds (wall + rug only) be reused across episodes? Until answered, every episode gets new art.

## Coherence check before every render (Adi, 2026-11-15: "always make sure script, creatives and hook work together")
Write a beat table (time | spoken line | what's on screen | why it's there) and check it before rendering:
1. Every on-screen element is explained by the line spoken at that moment. No standalone metaphors (a 🚪 for "side
   door") or random symbols (🍕🐈 for "topics"): show the actual thing (story -> song -> movie -> actor's dog).
2. The hook's promise is paid off by second 3 AND the ending answers it.
3. Text on screen never repeats the caption word for word and never covers the captions or the character.
4. A viewer with the sound OFF still understands the story from the pictures + captions.
