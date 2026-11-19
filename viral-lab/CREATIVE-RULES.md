# FOCO creative rules: the one checklist (videos + carousels)

Built 2026-11-18 from every rule file, with the contradictions between them resolved (list at the bottom).
A reviewer agent checks a script, a storyboard or sampled frames against THIS file only.
The detailed sources stay where they are and win on detail inside their own format:
`.claude/skills/carousel/spec.md` (Adi's master spec for Jess stories) · `.claude/skills/carousel/SKILL.md` (how to run it) ·
`.claude/skills/carousel/jess.md` (Jess + sourced quotes) · `viral-lab/FOCO-VIDEO-RULES.md` (mascot reels, app explainers) ·
`tasks/lessons.md` (why each rule exists). When Adi gives a new correction: add it here AND to lessons.md.

How conflicts were resolved: a rule only applies inside its format (section 2); inside one format the newer dated
rule from Adi wins.

## 1. Always (every format)

**HARD GATE: English self-check before ANY text reaches Adi or a render (Adi, 2026-11-19: "why do you repeat this mistake? from now on you are obligated to check yourself").**
This already failed twice (2026-11-18 "you don't check your English", 2026-11-19 "what is STARTING IT WAS"). It is not optional and not "when there's time":
1. Collect EVERY line that will be seen: slides/overlays, captions, hashtags line, email text to Adi, alt text.
2. Send them to a fresh native-copy-editor subagent: "native American English editor for casual TikTok/IG copy; flag anything unnatural, literary, inverted, stiff or non-native; give a natural replacement".
3. Fix every flag, then re-check the changed lines the same way.
4. Only then render / show / send, and say in the reply that the check ran.
Banned in social copy: inverted or clever-literary syntax ("starting it was"), parenthetical cleverness ("the longer (and sorrier)"), vague plurals that don't match what's shown ("the first steps were" for two).


**Truth**
- FOCO does only what is verified: say / type / snap a task, it lands in your day, ONE optional tap breaks it into
  steps (never "automatic"), focus session with a timer + sounds and the character with you. FOCO does not do the work,
  stop interruptions, sync Google/Apple calendar or resume a task after an interruption.
- No prices, no "free", no discounts, no store rating, no review quotes, no fake urgency.
- **Strategy first (Adi, 2026-11-19: "the most important file there is"):** `tasks/avatar-research-2026-11-18/strategy-avatars-positioning-2026-11.md`. Every creative names its sub-avatar (1-6) and one pain row before anything is written; where it conflicts with these rules (em dashes, "finally", proposed-not-shipped features, prices/reviews), these rules win.
- No invented statistics, studies, quotes or customers. A Reddit quote is copied exactly from `jess.md` or from
  `tasks/avatar-research-2026-11-18/avatar-adhd-freelancer.md` (its link is in reports 01-05 of that folder; find the
  link before using it), or it is paraphrased in the character's voice without quote marks.

**Audience + pain (Adi, 2026-11-18: "the most important thing")**
- The chosen avatar: an ADHD freelancer / self-employed person with no boss (mom, dad or no kids). Every carousel and
  every video starts from ONE pain from `tasks/avatar-research-2026-11-18/avatar-adhd-freelancer.md` (ranked pains,
  their exact words, dreams) + `pain-bank.md` (P1-P20, each with its TRUE FOCO answer). Write the pain in their words.
- The core: they can start what someone else asks for (a client's deadline); what only they ask for never starts
  ("I'm my own boss, and I don't respect the boss"). Moms say it as time ("an hour or two here or there"), people
  without kids as paralysis. The dream FOCO answers: "I work best alone with instruction".
- Record the P-number of the pain in every brief / log row, to learn which pain works.
- No medical promises. Never attribute ADHD to the viewer ("your ADHD", "are you a mom with ADHD?"). Say "people
  with ADHD", never "ADHD people".
- A character (Jess, a test mom, a narrator) is never presented as a real customer or a testimonial. Images of an
  AI-made person get the platform's AI label.
- FOCO's interface is shown only as real screenshots / recordings or the real-UI component; never an invented screen.
  One task runs through the whole piece: the task in the story is the task on the screen.

**Tone**
- Validating, plain, zero shame. Never tease the viewer's struggle (no "three hours on a ten-minute task").
  Name what she already knows about herself, name it as not laziness, then offer one small thing to try.
- The person is the hero. FOCO is the tool that helps her begin; it enters at the turn, not before.
- Natural American English, read aloud before rendering. No em dashes. No "game changer", "finally", "chaos", "overwhelmed" on repeat.
- Adi never appears. No founder-on-camera formats.

**Craft**
- Authentic beats polished: real footage, real desk, real screens. A "real" background shows the whole real scene,
  never an upscaled crop of one texture. Nothing that reads as an AI ad template (cut-out stock person, floating
  phone on a glow).
- Every on-screen element is explained by the line spoken or written at that moment; sound off still tells the story.
- Text never covers text, the phone's screen or the character. FOCO's screen is large enough to read when it matters.
- Safe zone. Video (9:16): all text, captions, logos and badges between 14% and 75% of the height, and out of the
  right 12%. Photo carousels: the carousel engine's zones (top 180 px, bottom from 1500 px, right rail x 950+ at
  y 850-1500), checked on its `safezones.jpg`.
- Store names on an end card are the two official badges, never typed text.
- In any narration write the brand as "Foco" (the voice spells "FOCO" letter by letter); on screen it is FOCO.
  Transcribe every voice file with whisper before rendering and check the brand comes back as one word.
- Before saying "done": look at sampled frames of the FINAL file, and say plainly what was not checked (the sound).

## 2. By format (where the old rules disagreed, the format decides)

| | Jess stories (carousel, Story video, VSL) | Mascot list reels | Explainer / launch film | Ranking / "X vs Y" (YouTube) |
|---|---|---|---|---|
| Point of view | First person, diary voice | Third person ("people with ADHD") | Second or third person, never "you have ADHD" | Neutral reviewer, "we" |
| Voice | Carousel + Story video: none. VSL: first-person narration | Calm male, 180-220 wpm, one continuous take | Narrator optional; a launch film has none | Narrated |
| Stuck task | A WORK task inside a kid window | Any | One task, same on every screen | n/a |
| FOCO | Once at the turn (+ a small reference at the end). When the story fits, show say -> in her day -> steps -> start | Close of 4 s or less, or caption only | The product is the subject | FOCO #1, then only apps that do not compete directly |
| FOCO character | Only near the end, next to her when she starts or finishes | The character is the star (official states, both arms + feet, ~24% of frame) | Optional | Optional |
| Length | Carousel 6-8 slides · Story video 40-48 s · VSL up to ~70 s | 27-38 s, new picture about every 2.4 s | 15-50 s | 3-5 min + a 40 s vertical cut |
| Images | Jess's kit, Gemini Pro with her anchor (identity must hold) | Gemini Flash only, 3-4 images, rest in code | Real footage / screens first | Real screens; competitor store shots flat, never in a phone |
| Captions | Carousel: designed text. VSL: designed text on the page, no auto-captions | 2-4 words, one highlighted | Native style or designed | Word captions |
| Music | Baked in, a different track each video, licence credit in the caption | Baked in | Baked in | Baked in |
| CTA | spec section 11 (rotate types). "link in bio" only on organic posts while the link is live | None spoken; FOCO close | End card with both badges | 3 s download card + "link in the description" |
| Hook | A specific moment she recognises (time, object, contradiction) | Curiosity gap in the first 3 s, the first sentence carries the twist | The problem, said without judgement | The exact search phrase, result teased |
| Approval | Story text approved by Adi BEFORE images | Coherence beat table before render | Script shown with the result | Facts checked against store listings |

Paid ads (any format): first person or neutral only, never "link in bio" (the ad has its own button), badges on the last frame.

**Jess's voice (Adi, 2026-11-18: "yes, sometimes, but a female voice, an authentic one").** A first-person narrated
Jess VSL is allowed SOMETIMES, not as the default: most Jess videos stay text-led. When narrated: a woman's voice
that sounds like a real person talking (warm, a little tired, unpolished), never an announcer or a bright "ad" voice.
The reviewer cannot hear: every new narration is flagged for Adi to listen to before it ships.
**Status: no voice approved.** Adi heard five library voices (Sarah, Matilda, Jessica, Bella, Laura) on 2026-11-18:
"none of them, they talk like AI". Until a real woman's recording exists (or a voice Adi approves by ear), every
Jess video is TEXT-LED: designed text on screen, music and sound effects, no narrator. Do not offer library
text-to-speech for Jess again.

## 3. Contradictions that were resolved (2026-11-18)

| # | The two rules | Decision |
|---|---|---|
| 1 | "Calm male narrator" (video rules) vs first-person Jess (spec) vs no narrator (Story video) | By format, table above |
| 2 | "Third person: they" (video rules) vs "first person diary" (spec) | Third person = mascot reels only; Jess = first person |
| 3 | "Open with a 2-word identity label" vs "BASE RULE: no label-then-explain, the first sentence carries the twist" (same file) | The base rule wins; the label is an optional test, not a rule |
| 4 | "Gemini Flash only, no Pro" (cost rule) vs "gemini-3-pro" for Jess (carousel skill) | Flash for mascot scenes; Pro only for Jess / a test mom, where the face must stay the same |
| 5 | "Every creative shows all 3 differentiators" (10-22) vs "FOCO once, at the turn" (spec 11-17) | Store graphics, ads built on the product and comparisons show all 3; Jess stories show FOCO at the turn, covering the 3 when the story fits |
| 6 | "Music is added on upload" vs "music is baked in" (same file) | Baked in |
| 7 | Story video "~35-45 s" vs "~40-48 s for 10 slides" (same file) | 40-48 s for 10 slides |
| 8 | Safe zone 14%-75% (memory) vs top 180 px / bottom 1500 px (carousel skill) | By medium: video = 14%-75%; photo carousel = the engine's pixel zones (the approved carousels were built on them) |
| 9 | "No CTA inside the video" (playbook pattern) vs "every Short ends on a download card" (11-15) | By format: mascot reels a short FOCO close, YouTube Shorts the download card |
| 10 | Kokoro narration (VSL recipe, 10-16) vs "Kokoro rejected" (10-27) | Kokoro is out; the VSL story arc stays |
| 11 | "Trust: real store rating / review quote" (old paid playbook) vs "never the rating or reviews" (11-17) | Never, until there are organic reviews |
| 12 | "Must not look designed: no glow, no floating phone" (explainers, 11-15) vs the 3D launch film Adi accepted (11-16) | A launch film is its own format; explainers and Jess stories stay hand-made and real |

## 4. Still open (Adi decides)
- May backgrounds (her apartment plates) be reused across episodes?
- The unattended worker that makes Studio orders without an open Claude session (needs permission prompts off).
