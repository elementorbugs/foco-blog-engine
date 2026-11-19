# Handoff 2026-11-19: FOCO homepage redesign (lifestyle images)

Written by the cloud session for Adi to continue in local Claude Code (which has a Gemini connection).
Talk to Adi in short Hebrew. Read CLAUDE.md and tasks/lessons.md first.

## Goal
Adi: the homepage (tryfoco.com) feels too technical. It shows app screens, not the experience.
He wants real-life images (e.g. a woman working with FOCO next to her) that show the use and the feeling,
designed with conversion in mind and built around our avatar.

## Where the homepage lives
- WordPress page **#4760, slug `home-preview`** (it is the front page). Content is HTML in the page body.
- Local reference copy: `homepage-preview/index.html`. Backup of the old theme version: `homepage-backup/`.
- Edit it with the patch workflow: write `post-patches/home-preview.json` (`[{"old":"...","new":"..."}]`),
  commit, then `gh workflow run blog-post.yml --ref main -f action=patch -f file=posts-new/post-home-preview.html -f keyword=x`.
  `scripts/patch-post.js` now falls back to pages, so this works for the homepage (added 2026-11-18).
- `{{media:<file>}}` in a patch uploads `post-media/home-preview/<file>` first.
- Current H1 on the live page: "From stuck to done. / Kick-start your next task." (someone changed it after the
  2026-11-18 patch, which had set "From stuck to done, / at your own pace."). Confirm with Adi which he wants.

## The avatar
- Adults 25-40, men AND women, diagnosed or suspected ADHD: freelancers, office workers, students, parents.
- Mostly arrive on a phone from TikTok, Instagram and Pinterest. Design mobile first.
- Feeling: "I know what to do and I don't move", then shame ("lazy", "what's wrong with me").
- They have tried many apps, notebooks and planners and dropped them within a week.
  Biggest objection: "another app I'll abandon".
- What they want: not productivity. To feel capable, stop feeling guilty, close the thing that has nagged them for a week.
- Our data (FOCO Research, /foco-research/, 194 respondents, self-selected): 73% say the first barrier is not
  knowing where to start; 80% hit that wall 5+ times a day. Cite with the source, never as prevalence.

## Why the current page under-converts
1. Shows the product, not the moment: about 10 phone screens on flat backgrounds, no person anywhere.
2. Talks features ("Smart focus sessions", "Templates") instead of outcomes.
3. Dark sections feel techy and cold. This audience needs warmth and safety.
4. "I've tried everything" only appears in the FAQ near the bottom, though it is objection #1.

## Proposed page structure (a story, not a feature list)
1. Hero: real-life photo (person at a desk or in a kitchen, phone with FOCO showing one small first step).
   Headline, one CTA, 5.0 rating right next to the CTA.
2. "Sound familiar?": 4 stuck moments as photos (unsent email, sink full of dishes, open laptop and blank stare,
   phone at 2am). Replaces the current 4 text cards ("20 minutes", "An hour gone"...).
3. Reframe: "You're not lazy. Your brain doesn't know where to start." + the 73% stat with its source.
4. How it works in 3 steps: real hands and real scenes, not floating screens.
5. "A day with FOCO": morning dishes, midday email, evening form. Three small "I started" moments.
6. "Tried everything?": direct answer. Not another list; it helps you start. No red overdue lists, no guilt.
7. Social proof: real reviews + survey stats.
8. Pricing + trial, FAQ, final CTA.

Visual direction: light, warm background, purple only as accent. Real, slightly messy places, natural light.
Mixed cast (men and women). The phone always shows a REAL FOCO screen. Mobile first.

## Hard rules for the images
- The phone screen must be a real FOCO screen. If the AI output's screen is not sharp or accurate, composite the
  real screenshot onto the phone yourself.
- NEVER attach stock or AI faces to the real reviews in "People who couldn't start". That would imply those people
  wrote them.
- No mascot inside body content rules apply to blog posts; on the homepage keep using real screens.
- Images must look like real photos, not AI. Look at every image before using it.
- No em dashes in any copy.

## Real FOCO screenshots to use as references
- Task breakdown: https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-plan.jpg
- Focus timer + companion: https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-focus.jpg
- Day view: https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-today.jpg
- Stats: https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-stats.jpg

## Step 1 (do this first): 3 hero image options, 4:3, 2K, real FOCO screen as the reference image
1. **Woman at home desk** (reference: plan screen)
   "Candid lifestyle photograph, shot on a full-frame camera with a 35mm lens, natural window light, late morning.
   A woman in her early 30s with messy shoulder-length hair, wearing a soft oversized sweater, sits at a slightly
   cluttered home desk: an open laptop with an unfinished presentation, sticky notes, a half-drunk coffee mug, a
   notebook. She is holding an iPhone in one hand, angled toward the camera so the screen is clearly visible and
   large in the frame, and the phone screen shows EXACTLY the app screen from the reference image (dark purple app UI
   with a task broken into small steps). Her expression is a quiet, relieved small smile, shoulders relaxed, like she
   just figured out where to start. Warm, honest, real-life feel, not a stock photo, slight depth of field with the
   phone screen sharp. No text overlays, no logos other than what is on the phone screen."
2. **Man in the kitchen** (reference: focus screen)
   "Candid lifestyle photograph, 35mm lens, soft natural afternoon light in a small lived-in apartment kitchen. A man
   in his early 30s with a short beard, wearing a plain t-shirt, is rinsing a plate at a sink with a pile of dirty
   dishes. On the counter next to the sink, an iPhone leans against the backsplash facing the camera, clearly visible
   and in sharp focus, and its screen shows EXACTLY the app screen from the reference image (dark purple focus timer
   screen with a small friendly purple companion character and soundscape options). He glances at the phone with a
   calm, focused, slightly amused expression, like he is finally getting it done. Real, warm, unpolished, not a stock
   photo. No text overlays."
3. **Hands, top-down** (reference: plan screen)
   "Top-down overhead lifestyle photograph of a real, slightly messy wooden desk in natural daylight: an open laptop
   edge, a to-do notebook with crossed-out scribbles, sticky notes, a coffee cup, headphones, a pen. In the center,
   two hands hold an iPhone flat and straight-on to the camera, screen large and perfectly sharp, showing EXACTLY the
   app screen from the reference image (dark purple app UI with one task broken into small timed steps). Thumb about
   to tap the first step. Warm, honest, everyday feel, not a staged stock photo. No text overlays."

Show Adi the 3 options. After he picks a direction, build a visual mockup of the new hero + 2-3 sections
(preview first, do not touch the live page), then go section by section.

Note: the cloud session could not generate these. Arcads and Higgsfield are both at zero credits
(an empty Arcads project "FOCO homepage lifestyle hero" exists with the two reference screens uploaded).

## Other open items from the same chat
- **FOCO has a web app**: https://webapp.tryfoco.com/ (sign-in page; Apple or email login with the app account).
  SPEC.md still says "no web app" and about 19 posts say FOCO is iPhone/Android only (foco-vs-tiimo,
  foco-vs-goblin-tools, motion-app-alternative, sunsama-alternative, todoist-alternatives, ...).
  Adi asked to WAIT before updating. Still need his answers: can you sign up on web, are all features there, live since when.
  Idea: an indexable landing page (e.g. /online-planner/) could target "online planner" (5,400/mo, SD 31).
- **Cloudways bot protection** intermittently returns HTML to GitHub Actions runners (WP REST fails). Adi should
  whitelist GitHub Actions in Cloudways. Retry once after a few minutes; don't loop.
- **RemindHer** (repo elementorbugs/remindher-blog): proposed strengthening /best-apps-for-family-calendar-sharing/
  (#5 for "family organizer app", 3,600/mo, SD 18). Not started.
- **/best-apps-for-adults-with-adhd/**: proposed retarget to "adhd apps for adults" (1,300, SD 40) and "adhd apps"
  (2,400, SD 12, currently pos 46); it cannibalizes with /best-adhd-apps-for-adult-women/. Not started.
- **/day-to-day-planner-app/**: 11 apps, ~10 inbound links. Not ranking yet; give it 4-6 weeks.

## Done in this chat (for context)
- Published: Mellow Flow review (#6282), ADHD cleaning apps list (#6306, 9 apps, per-app screenshot cards),
  plus inbound links for both.
- Fixed Motion individual pricing on /day-to-day-planner-app/; Goblin Tools price is now $0.99 (iPhone, US).
- Homepage H1 patched via the new page support in scripts/patch-post.js.
