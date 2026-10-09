# Decision-first rewrite: FOCO app comparison / review posts (2026-10-09)

You are rewriting ONE existing blog post into FOCO's new decision-first format. Work only with files.

## Hard limits
- **Do NOT fetch anything on tryfoco.com** (no WebFetch, curl or browser). The server has bot protection and went down today from too many requests. Every internal URL you may link to is listed in `tasks/review-format/live-posts.txt` (all verified live).
- Do NOT call the WordPress API, do not run git, do not publish. Write exactly one file: `posts-new/post-<slug>.html`.
- You MAY use WebSearch / WebFetch on competitor and authority sites to verify facts (pricing pages, About pages, help centers).

## Inputs
- Old post body: `tasks/review-format/old-<slug>.html` (raw WordPress content, light-style block already removed).
- Store facts checked today: `tasks/review-format/store-facts.json` (US App Store price, rating, rating count). Quote ratings as e.g. "4.6 (20,673 ratings)" and say "US App Store, October 9, 2026" in the method section.
- **Reference implementation (copy its HTML patterns exactly):** `posts-new/post-goblin-tools-vs-tiimo.html`.
- App icons (official, already on our media library): `app-directory.json` → `apps.<key>.icon`.
- FOCO screenshots you may use (real app):
  - steps with a time per step: `https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-steps.jpg` (task "Finish my presentation")
  - AI breakdown plan: `https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-plan.jpg`
  - focus timer + companion: `https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-focus.jpg`
  - day view / calendar: `https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-today.jpg`
  - voice capture: `https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-voice.jpg`
  Look at the image before describing it (Read tool on `homepage-preview/assets/shot-*.jpg`, same images).
- Keep every real screenshot/figure already in the old post (reuse the same `<img src>`), unless it shows something now false.

## FOCO facts (the only ones you may state)
FOCO is an ADHD planner app for task paralysis (iPhone and Android; no web app). AI breaks a stuck task into small steps, each with a time estimate. Voice capture turns speech into a task; you can photograph a handwritten list and it lands in the built-in calendar (morning / afternoon / anytime, reminders, missed tasks move on without a red overdue wall). Focus timer with calm music and an AI body-doubling companion on screen. Progress stats (focus sessions, completed steps). **Pricing: 7-day free trial, then $9/month or $59/year. There is NO free tier; never say FOCO is free.** We make FOCO.

## Required structure (in this order)
1. `<p class="foco-review-meta">Updated October 9, 2026 · Prices and ratings checked today · <strong>We make FOCO</strong>, one of the apps compared</p>` (adjust wording; one short line).
2. `<div class="foco-tldr">`: `<p><strong>Short answer:</strong> …</p>` (40-60 words, direct answer) + `<ul>` of "Pick X if …" lines (vs posts) or "Try X if … / Skip it if … / Pick FOCO if …" (reviews). Be fair: say plainly when the competitor is the better choice.
3. `<h2>` "How do X and Y compare at a glance?" (or "X at a glance" for a review) + the table card:
   - vs post: `<div class="foco-table-wrap foco-cmp2">` with `<thead>` = label cell `<span class="cm-label">Checked Oct 9, 2026</span>` + one `<th>` per app with `<span class="cm-app"><img …icon…/><span><b>Name</b><small>one-line pricing summary</small></span></span>`.
   - review: same but class `foco-table-wrap foco-cmp2 one` and a single app column.
   - rows: `<tr><th scope="row">Label</th><td>…</td></tr>`. Use `<span class="cm-yes">Yes</span>`, `<span class="cm-no">No</span>`, `<span class="cm-star">★ 4.6</span>`. 8-10 rows: best for, free version, paid, free trial, 3-4 feature rows that matter for ADHD, platforms, App Store rating, setup.
4. An evidence section with real screenshots (existing figures + FOCO shots). Only FOCO can be described as used/tested by us. For competitors say "from the official App Store screenshots" / "according to X's site". **Never claim we tested a competitor app.**
5. 3-5 `<h2>` questions on the differences that matter (task initiation, planning, coaching, cost...). Answer in the first sentence.
6. `<h2>Who should pick which?</h2>` (or "Who should try X?") with short `<ul>` lists per app, FOCO last, FOCO pricing stated.
7. `<h2>FAQ</h2>` with 5-6 `<h3>` questions people actually search, 1-2 sentence answers.
8. `<h2>How did we compare them?</h2>`: method, sources with dates, disclosure, plus authority links (NIMH, CHADD or Barkley).
9. `<div class="foco-key-takeaways"><h2>Key Takeaways</h2><ul>…</ul></div>` at the END (3-4 bullets, one mentions FOCO).
10. `<!-- wp:html --><script type="application/ld+json">…</script><!-- /wp:html -->` with `@graph`: ItemList of SoftwareApplication (name, applicationCategory, operatingSystem, url, offers price/priceCurrency/description) for each app EXCEPT you may include FOCO only in vs posts where it is compared; plus FAQPage whose Q&A text matches the visible FAQ exactly. No aggregateRating, no Review rating values. Must be valid JSON.
- No in-body table of contents. No H1 (the theme prints the title).

## Writing rules (pipeline-enforced)
- Every paragraph in `<p>`; max 2 sentences per paragraph.
- **No em dashes (—)** anywhere. Use commas, periods or a hyphen.
- Banned words: delve, navigate, game-changer, moreover, furthermore, in today's fast-paced world, in conclusion, unleash, leverage (verb), seamlessly, dive deep, robust, cutting-edge, revolutionary, transformative, harness, embark, journey.
- Links are HTML `<a>` only, never markdown. Competitor sites and competitor app-store pages: `target="_blank" rel="nofollow noopener"`. Authority sources (nimh.nih.gov, chadd.org, russellbarkley.org, .gov/.edu, pubmed): `target="_blank" rel="noopener"`.
- ≥4 internal links (absolute `https://www.tryfoco.com/<slug>/`, only slugs in live-posts.txt), always include `https://www.tryfoco.com/best-adhd-app/` and relevant sibling comparisons. ≥3 external citations.
- No fabricated numbers. Every price comes from the vendor's pricing page or store (checked today); if sources conflict or the vendor says it varies by country, say so and link the pricing page instead of inventing a figure. Medical/ADHD claims hedged and sourced.
- Bold the first mention of key terms (e.g. **task initiation**). Validating, plain-spoken tone, zero shame. US English.
- Length: 1,200-1,700 words of visible text.
- Images: `<figure class="foco-img" style="margin:28px 0;max-width:…px"><img … loading="lazy" width height style="width:100%;height:auto;border-radius:14px;display:block;border:1px solid #E7E0F5"/><figcaption style="font-size:13px;margin-top:8px">…</figcaption></figure>`; phone screenshots max-width 300px. Alt text describes the image.

## Self-check before you finish
Run this and fix anything it reports:
```
node tasks/review-format/lint.js posts-new/post-<slug>.html
```

## Report back (short)
- File written, word count.
- Facts you changed vs the old post (old → new, with source URL).
- Anything you could not verify (and how you phrased it).
