# Viral playbook (evidence-based, updated after every analysis)

Each rule cites its references. 1 source = hypothesis, 2 = signal, 3+ = pattern.
Refs: DUCK = adhdfordummies-7678833409912753421 (114K, like 25%), GIFTED = neuronpond-7679200647983418655 (342K, like 14%),
SPOT = bob.saner-7698040764944682247 (100K, like 10%), LISTEN = bob.saner-7700256955901676818 (23K, like 7%).

## The genre (4/4 = pattern)
"ADHD cartoon list": one cute blob/duck character, one simple prop scene per half-sentence, solid muted background,
soft narration, captions above the character, 27-38s, no product. Three different creators run it right now. [DUCK GIFTED SPOT LISTEN]

## Voice (measured: tools/voice.py, word counts from transcripts)
- All 4 are a calm MALE narrator, 120-128Hz, near-identical across 3 creators (likely the same popular TTS voice). [all] (pattern)
- Speaking rate 180-226 words/min, almost no pauses: dense, fast, matter-of-fact. [all] (pattern)
- Pitch moves little (range 12-14 semitones, sd ~5): steady storyteller, not sing-song. [all] (pattern)
- Ours: Kokoro af_heart FEMALE ~185Hz, 130-167 wpm with gaps, pitch range 20-24 st (sd ~8): slower and much
  more sing-song. Biggest single difference between our videos and the genre.

## Hooks
- 2-word identity LABEL first, then the claim: "Gifted ADHD." / "ADHD in women." The two biggest videos open this way. [GIFTED DUCK] (signal)
- Flattering identity beats pure pain: gifted (342K) and spotting low IQ (100K) outperform. Pride makes it shareable. [GIFTED SPOT] (signal)
- A full-sentence hook that needs 6s to reach its twist reached the fewest people. [LISTEN] (hypothesis)

## Structure
- Line 1 = the whole promise in one cheeky, flattering sentence; then talk like a person (first person, short lines,
  quoted lines of others), a rhetorical re-hook at ~70%, end on the punchline. Deadpan voice, humour in the words. [SPOT] (Adi's favourite)
- "Can do the HARD thing, but can't do the EASY thing" contrast list -> unresolved or tender ending. [GIFTED DUCK] (signal)
- The punchline of those contrasts is task initiation ("4 business days to start the assignment", "dodge a 10-minute
  task for 3 weeks"). FOCO's niche is the viral core of the genre. [GIFTED DUCK] (signal)
- Third person ("they / ADHD people") lets the viewer identify AND tag someone. [GIFTED SPOT LISTEN DUCK] (pattern)
- No product, no CTA inside the video in any of the four. [all] (pattern)

## Pace
- A new picture every ~2.3-2.5s (GIFTED 14 images/32s, SPOT 16/38s, DUCK 15/38s). [GIFTED SPOT DUCK] (pattern)
- Camera language (close-up on the eyes, over-the-shoulder) on top of new pictures. [LISTEN] (hypothesis)

## Production stack (measured 2026-10-27)
- **The pictures do not move.** Pixel change inside a shot over 0.5s: 0.05-0.24 (0 = identical frames) in all three
  big videos. No animation, no zoom, no Ken Burns: still images + hard cuts every ~2.4s + captions + TTS. [GIFTED SPOT DUCK] (pattern)
  -> character animation is NOT what makes them work; image quality, consistency, pace and voice are.
- Images look like one AI image model fed the same character reference each time (paper grain, flat colours with
  outline, warm palette; typical of ChatGPT/GPT-image cartoon output). Inference, not proven.
- Captions are editor auto-caption templates (CapCut-style: karaoke black box / plain lowercase / caps + yellow word).
- Same male TTS voice across three creators = one popular stock TTS voice (CapCut or ElevenLabs). Inference.

## Visual craft
- A second character as the foil, and a label sign ("ADHD") on the hero. [SPOT LISTEN] (signal)
- Props with readable text deliver the joke (2+2=5, scoreboard 5:0, "FACT: smoking is bad"). [SPOT] (hypothesis)
- Caption style varies (caps + one yellow word / lowercase / karaoke black box), so it is not the driver. [all]

## Share / save / comment triggers
- Spoken "Send this to your friends" at the end -> best share-per-like in the set (35% vs 16-27%). [LISTEN] (hypothesis)
- Caption tag line "tag a friend who needs a reminder that she isn't lazy". [DUCK]
- Comment rate is low everywhere (0.11-0.16%): this genre wins on likes/shares/saves, not debate. [all] (pattern)

## Post caption
- Long keyword-rich mini-article (580-2000 chars: "twice-exceptional", "executive function", "masking") + 3-5 hashtags.
  4/4 do it = TikTok search SEO. [all] (pattern) -> replaces our short hook+hashtags captions.

## Where our 6 videos miss the pattern (2026-10-27)
| | Ours | Pattern |
|---|---|---|
| Seconds per picture | 3.5-4.6s (one image per long line) | ~2.4s |
| Length | 35-54s incl. 8-10s FOCO close | 27-38s, no close |
| Hook | sentence ("ADHD paralysis doesn't look like laziness") | 2-word label first |
| Framing | mostly "you" | "they / ADHD people" |
| Characters | mascot alone | hero + foil, label sign |
| Ending | FOCO feature + end card | unresolved/tender line + "send this to..." |
| Caption | hook + hashtags | 600-2000 char keyword essay |

## Our results
(filled from ours/*/results.md)

## Distribution: location beats language on TikTok (research 2026-10-28)
Adi's account region is Israel; the content is English. Reddit (r/socialmedia, r/SocialMediaMarketing, r/TikTok,
r/dropship, 2023-2026) is close to unanimous, and anecdotal:
- The first test pool comes from the account's region signals (SIM carrier, account registration, IP, device history),
  not from the video's language. English captions and hashtags shift the audience only slowly, through non-local
  watch time and comments. It compounds: early local engagement teaches TikTok the video is local content.
- VPN and eSIM tricks mostly fail: views drop to tens, or the region flips back. A real local account (created and
  posted by someone in the target country) is the method that reliably works ("sub 200 with VPN -> 5k with a US local").
- Posting at target-country hours helps a little (TikTok tests on whoever is online at publish time).
- Instagram Reels also leans local (a Greek restaurant with English content: 70-90% Greek viewers).
- TikTok's own 2020 explainer: language and country settings get LOWER weight than interactions, which fits the
  above: who engages decides; region only seeds the first pool.
Decision: English TikTok from Israel = weak start. Options: a US-created account managed through an API scheduler,
US-hours posting, Promote targeted to the US, and YouTube Shorts.

## ADHD app-list shorts (Adi's references, 2026-11-15: "this concept works")
Refs: product_hunt-DhadtGZ68cU (63K views, 8s), siennacols-XLl7DB5BlvE (20s, aesthetic), raising_littles_daily-j_Sv0jFeHKI
(4.3K, 28s, ranking slots), wendy bQzIjzZf9bU (2.4K, 58s, face + b-roll), long: thebusinessdive-SzLCasiidPY, amberfiglow-b1PoxflJjE8.
Pattern: (1) a relatable human shot (stuck at desk, scrolling phone) or calm aesthetic photo, never a designed stage;
(2) hook as a question in 1-2s ("ADHD messing up your focus?"); (3) the list = app icon + name + 1-4 word job, often
all at once; (4) "links in bio/description" end card; (5) minimal type, no motion graphics. Shortest one won by far.

## Founder-diary "authentic" format (itskateydixon refs, 2026-11-17)
Refs: references/instagram-277423956-DfuLp88J1Rw, -DfjHbTTpx2E (talking reels), instagram-itskateydixon-Df1T-ipHQCZ (11-slide diary carousel). She sells a product (Claude edit studio) but it reads as a person, not an ad.
- Talking reel: one locked phone shot, real room, natural light, holding a mic, laptop on lap. Near-zero cuts (1-4 in 80s), jump cuts only to remove pauses.
- Text = two-tier title above the head: small handwritten lowercase line + bold sans line under it, typed on word by word with the VO. One title per beat, changes every 3-6s.
- Proof pops: small screenshots of the product (timeline, buttons) float in the top third for 1-2s, then gone. Never full-screen UI.
- Tiny lowercase word captions on the chest (secondary), one meme cutaway, a crossed-out live-updated number ("230 people" -> "503 PEOPLE!!!!").
- Script: personal reason (daughter dropped naps) -> what I built -> 5 steps -> "I still keep control" -> real number -> "comment WAITLIST".
- Carousel: cream paper bg, taped polaroid phone photos, serif body + bold sans headline with ONE dark-red word, blue script handwritten asides, scattered star stickers. Story arc: near-failure -> low point -> someone helps -> pivot -> "we're so close" -> comment keyword. "if you're new here, hi I'm Katey" slide = re-intro.
- Why it works: stakes are real and dated, numbers are real, she's tired on camera, the product is the side character.

## Mom mental-load "list" reels (Adi's references, 2026-11-18: 37K + 39K likes)
Two IG reels, same engine: **one identity line + a list of roles that piles up on screen + a calm/frozen visual + a trending song. No voice, no story, under 13s.**
- The list IS the content. Each item lands on a beat; the pile-up makes the overload felt, not explained.
- Hook = identity label ("2026 Moms be like:" / "I'M A MOTHER but I'm also a"). The unfinished "but I'm also a" is an open loop.
- Visual does the opposite of the text: the list grows, she doesn't move (stare at a table / slow walk on a beach). That contrast is the joke/the ache.
- 8-13s, 0-1 cuts, ends on the full list = loops; too many words to read once = rewatch.
- Comment trigger is built in: viewers add the job that's missing. Share trigger: "this is me" repost / send to partner.
- Faceless or face half-hidden, phone-shot, zero brand look. Fits our no-founder rule and Jess.
- FOCO version: "ADHD moms be like:" + list -> she stares (= paralysis). Or "I HAVE ADHD / but I'm also the family's" + role flood. Product, if any, is one quiet final frame, never a CTA voice.
First FOCO remake: `story-jess-be-like` (2026-11-18), Jess at 9pm, 19.6s, list stacks one line per ~0.9s (Story engine `wait` per item), then "not lazy. just 7 tasks and no first step." + FOCO steps card. Waiting for numbers.
