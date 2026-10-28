# /visual-timer/ — plan (2026-10-28, planning only, nothing built)

## 1. The opportunity (Ubersuggest, US)
| Keyword | Vol/mo | SD | Who ranks |
|---|---|---|---|
| visual timer | 22,200 (Sep peak 33,100, Jun-Jul 12,100) | 29 | #1 visualtimer.com **DA 5**, ~7,400 clicks; #2 online-stopwatch (DA 59); #3 Amazon; #4 toytheater; then stores/apps. **No article on page 1: Google wants a working tool.** |
| classroom visual timer | 9,900 | 27 | (later: own page) |
| online visual timer / visual timer online free | 1,900 / 1,300 | 47-49 | #1 visualtimer.com again (DA 5), #4 a DA 11 site |
| 5 minute visual timer / 5 min visual timer | 1,600 / 1,300 | 22 / **8** | visualtimer.com preset pages |
| visual timer adhd / adhd visual timer | 1,600 / 1,300 | 24 | #1 Baptist Health article (DA 60, **no tool, no citations**), #3 adhdflowstate list (DA 16) |
| adhd timer | 1,300 | 23 | |
| 10 / 2 / 15 / 20 / 30 minute visual timer | 720 / 390 / 390 / 260 / 210 | 22-33 | |

We have nothing for "visual timer". Our 5/10/15/25/30-minute ADHD timer posts rank 5-7 on tiny queries only.

## 2. What the competition does, and the gap
**visualtimer.com (#1):** circle that shrinks clockwise, presets 5-60, drag to set, Space to start, fullscreen, hide-numbers, ~20 alarm sounds, colour picker, light/dark, background image, a task list, share link, native apps. Weak: Start/Reset only (no pause listed), unexplained toggles ("Proportional", "+ Image"), ~200 nav links drowning the tool, 500 words of generic copy, ADHD claim with no source.
**online-stopwatch (#2):** clock face, three 60-option dropdowns to set time, sound loops, ads + repeated premium upsells, broken links.
**Baptist Health (#1 for "visual timer adhd"):** 900-word article, no tool, no sources.

**Nobody combines a first-class tool with real ADHD help.** That's the gap.

## 3. The idea (taste skill step 4)
> On this page, **FOCO's "just start step one"** becomes **the label written inside the shrinking disc**.

The visitor types the one small thing they're starting ("Open the report doc"), and it sits inside the coloured wedge while it shrinks. When time runs out the timer asks: *Keep going (+5)* or *Done*. A competitor's timer measures time; ours starts a task. Competitor test: visualtimer.com's task list is a list beside the timer, not the step inside it, so the sentence fails for them. Good.

**The live thing** is the timer itself, at full size and working on the first screen.

## 4. Art direction (taste skill, dealt: `product-performs`, seed 2005330067, saved in .taste-skill/direction.json)
- **Brand kept** (`--keep palette,type`): FOCO dark ground `#040208`, lifted `#0a0410`, ink `#FFFFFF`, muted `#B8B0CC`, accent `#7C3AED` on the primary action only. The house rule bans violet; brand wins here (documented `--allow` for that rule only).
- **House rules we WILL follow** (the old timer widget breaks all of them): no gradients, no glow, no shadows at rest, no uppercase letter-spaced labels, no pill badges, no eyebrows, no monospace (tabular figures in the text face instead).
- **Hero, "control that reads the page":** two tonal halves meeting at a clean vertical edge (no line). Left (`#040208`): `h1` "Visual Timer" + one sentence + the step field, anchored bottom-left. Right (`#0a0410`): **the disc, as large as the screen allows** (min(560px, 70vh)), controls directly under it. Phone: the disc comes first (78vw), then controls, then h1 + sentence. **The tool is in static HTML** (an SVG disc rendered at 5:00) so Google sees it and LCP is instant; the script only takes it over.
- **Wedge colour (decided by Adi 2026-10-28: FOCO branding + what people expect):** everything around the disc is FOCO (dark `#040208`/`#0a0410` ground, purple `#7C3AED` on the Start button and the step label, FOCO type, the mascot-free FOCO CTA). The wedge itself defaults to a **warm timer red tuned to the FOCO palette** (a coral red that sits with the purple, close to the Time Timer red searchers recognise), and the swatches lead with FOCO's own colours: red (default), FOCO purple, FOCO orange `#FB923C`, lilac `#A78BFA`, teal. The empty part of the disc is FOCO lilac at low strength, not grey, so even the red wedge reads as FOCO.
- **Motion:** masked headline rise on load (signature); the wedge itself is the moving picture (smooth, transform-free SVG path updated per frame); press/hover/focus feedback on every control; `prefers-reduced-motion` keeps the wedge but drops entrances.

## 5. The tool: feature spec (each item beats or matches #1)
**Set the time (3 ways, all instant)**
- Presets: 1, 2, 5, 10, 15, 20, 25, 30, 45, 60 (covers every preset keyword above).
- Drag around the disc to set (like #1), snaps to whole minutes, 15 s steps under 2 min.
- Type it: one field that accepts "7", "7m", "90s", "1h30", "1:30". No dropdowns.

**Run it**
- Start / Pause / Reset, plus **+1 and +5 while running** (ADHD: extending beats restarting).
- Keyboard: Space start/pause, R reset, F fullscreen, ↑/↓ ±1 min, number keys = presets. Shown in a "?" popover, not on the page.
- **Accurate:** counts from timestamps (no drift in background tabs); **the tab title and favicon become the countdown** ("4:12 · Open the report doc"), so a hidden tab still shows time leaving. #1 doesn't do this; it's the most useful thing for time blindness.
- **Keep screen awake** (Wake Lock API) for desks and classrooms.
- Fullscreen with numbers on/off; the step label stays.

**Face**
- 60-minute face (classic, wedge = minutes out of 60) or **"fill the circle"** face (wedge = whole set time). This is #1's unexplained "Proportional", made plain with two named buttons.
- Hide numbers (for kids / for anxiety), colour swatches, light ground option for projectors.

**Cues (the ADHD layer)**
- Halfway cue and last-minute cue (soft chime + the wedge changes shade). Time blindness is about not noticing time passing; two checkpoints fix that.
- End: 4 calm sounds (no air-raid siren), volume, vibrate on phones, optional browser notification if the tab is hidden.
- **Focus sound while running:** brown / pink noise generated live (Web Audio, no files). Ties to our brown-noise posts and FOCO's "focuses with you, with music".
- Pomodoro loop toggle (25/5, auto-next round), links to /pomodoro-for-adhd/.

**Remember + share**
- Remembers last settings (localStorage, wrapped in try/catch, works without it).
- Share link with settings in the URL (`?m=10&c=red&face=fill`), so teachers can bookmark "their" timer.

**Quality bar**
- No ads, no sign-up, no pop-ups. Inline JS + CSS ≤ 40 KB, zero external requests. Works offline once loaded.
- Accessibility: every control keyboard-reachable with an accessible name, `aria-live` announcing each minute (polite) and the end, contrast ≥ 4.5:1, 44px touch targets, reduced-motion respected.
- Built as a self-contained dark island (`foco-dark`, scoped selectors, `!important` on colour) per the light-article lessons. Check that the sticky "Stuck? Take step one" app bar doesn't cover the controls on a phone.

## 6. The page below the tool (sections from the dealt sheet, mapped to the argument)
1. **How it works, "Drag through the stages":** one range slider with 4 stops driving a mini disc: *Name the step → Pick the minutes → Watch it shrink → Keep going or stop*. Doubles as the HowTo schema.
2. **Settings as sentences, "Sentences with switches":** 5 full-width bands, each a sentence ending in a real switch **wired to the timer above**: "Warn me at halfway" · "Play brown noise while it runs" · "Hide the numbers" · "Keep my screen awake" · "Start the next round on its own". Switching one changes the tool. Content and control are the same thing.
3. **Why a visual timer helps with ADHD (Q&A, ~500 words):** H2 questions, answer first, 1-2 sentence paragraphs, with sourced, hedged claims about time perception in ADHD (sources to be verified in the build: NIMH, CHADD, Barkley, plus one peer-reviewed time-perception study via PubMed; no invented numbers). Sub-questions: What is a visual timer? · Why do visual timers help with time blindness? · How long should I set it to start a task? (→ /5-minute-timer-adhd/, /adhd-task-paralysis/) · Visual timer vs a physical Time Timer? · Can I use it in a classroom or with kids?
4. **FAQ, "Question index, one answer":** questions left, sticky answer right; on a phone an accordion. All answers in the HTML (FAQPage schema): Is it free? Does it work when I switch tabs? Does it work on my phone? Can I use it full screen on a projector? Can it run longer than 60 minutes? Does it keep my screen on? Is there an app? (→ FOCO, honestly: FOCO has its own focus timer with a companion and music, iPhone + Android.)
5. **CTA, "First step, already open":** full-width accent field with a working FOCO fragment: "What are you avoiding?" + an example ("Reply to the landlord email") + three sample steps it breaks into, then App Store / Google Play buttons. No fake sign-up (FOCO has no web app). FOCO facts: $59/yr with 7-day trial or $9/mo (only if price shown; better not shown here).
6. Footer: the site's normal footer.

Imagery: the tool and FOCO fragments are the pictures (software rule). One real FOCO screen (landscape, mascot-free) in the CTA. No stock.

## 7. SEO / GEO package
- **URL** `/visual-timer/` as a WordPress **Page** with a full-width template, deployed like the body-doubling room (tools/visual-timer/ source → snippet). Not a blog post: no light-article CSS, no TOC, no pipeline image stripping.
- **Title** (≤60): "Visual Timer: Free Online Countdown You Can See" (+ " - FOCO" = 55). **H1** "Visual Timer". **Meta**: "A free visual timer: the colour shrinks as time passes. Presets, full screen, halfway cues and brown noise. Made for focus and ADHD. No sign-up."
- **Schema:** `WebApplication` (UtilitiesApplication, free offer, browser requirements), `HowTo` (the 4 stages), `FAQPage`, `BreadcrumbList`. No rating values.
- **Answer-first definition** in the first 60 words of the Q&A block (AI Overview + citation bait).
- **Internal links in:** all 6 minute-timer posts, /time-blindness-adhd/, /pomodoro-for-adhd/, /adhd-task-paralysis/, /how-to-focus-with-adhd/, /brown-noise-adhd/, the "Free ADHD Tools" menu, /adhd-visual-schedule/, the homepage tools strip.
- **Phase 2, preset pages** (what makes #1 strong): convert our existing 5/10/15/25/30-minute posts to use the new tool, preset, and add 1, 2, 3, 20, 45, 60-minute pages. Then `/classroom-timer/` (9,900/mo) as its own page using the same tool.
- **Distribution:** 3-5 Pinterest pins ("free visual timer for the classroom / for ADHD"), a short demo video for YouTube Shorts/TikTok, a mention in the newsletter. Teachers share timers; that's the backlink engine.
- **Measure:** GA4 events (timer_start, preset, fullscreen, sound_on, foco_cta_click); GSC baseline for the keywords above on launch day; check at 2, 4 and 8 weeks.

## 8. Realistic expectations
Weeks 1-4: page 1 for "visual timer adhd", "adhd visual timer" and "online visual timer". Months 2-4: top 5 for "visual timer", pushed by the preset pages and pins. #1 for the head term depends on links and time; the tool quality and speed are what we control.

## 9. Decisions for Adi
1. ~~Default wedge colour~~ Decided: FOCO frame + warm timer red wedge, FOCO swatches (see §4).
2. OK to ship as a Page at `/visual-timer/` (new URL)?
3. Phase 2 (preset pages + classroom page) right after, or measure first?

## 10. Build order (when approved)
copy deck → static HTML tool (works with no JS: shows a 5:00 disc + instructions) → JS engine (timestamps, title/favicon, wake lock, audio) → sections → taste-skill `lint.mjs` + `inspect.mjs` at 1440/768/390, 0 FAIL → critique rounds → deploy as Page → schema check → contrast audit → GA4 events → links in → IndexNow + GSC request.
