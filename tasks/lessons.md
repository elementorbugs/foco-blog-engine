# Lessons learned

Pruned quarterly. Keep under 60 lines.

## SEO / URL structure

- **Keyword-in-slug beats short-slug for unbranded sites.** For hub pages targeting search keywords, put the keyword in the URL: `/adhd-resources/` not `/resources/`, `/adhd-tools/` not `/tools/`, `/adhd-glossary/` not `/glossary/`. Branded/utility pages (about, contact, pricing, founders) keep short slugs because nobody searches "tryfoco about". Mistake made: suggested `/resources/` for a hub page targeting "adhd resources" — user corrected to `/adhd-resources/`.

- **Feature sub-pages need the keyword too.** `/features/adhd-task-breakdown/` not `/features/task-breakdown/`. The `/features/` parent gives context but the sub-page's own keyword has to be in its slug.

- **RankMath title appends " - SiteName" automatically.** Don't put the brand name in the H1/title field yourself — it doubles. Page title should be just the topic; RankMath adds the suffix.

## Content selection / cloud sync

- **The daily automation runs from GitHub, NOT your local repo.** `.github/workflows/daily.yml` runs `0 15 * * *` (18:00 Israel), does a fresh `actions/checkout` of `github.com/elementorbugs/foco-blog-engine`, and runs `node daily-generate.js --count=3 --pull-gsc`. So ANY local change to engine code or data (priority-queue.json, daily-generate.js, blocked-keywords.json, create-post.js) has ZERO effect on the daily run until it is **committed AND pushed**. This caused the "off-list keywords" bug: the 15-keyword `priority-queue.json` and the queue-respecting logic lived only locally (`??` untracked + ` M` uncommitted), so the cloud kept running the old master-plan picker and produced off-list posts (adhd-signs-in-3-year-olds, adhd-sex, adhd-job). **A local `--dry-run` proves local behavior, NOT cloud behavior — they can diverge.** When the user reports the automation misbehaving: FIRST run `git status` and diff local vs `origin/main`; the fix is usually `git push`, not a code change. Fixed + pushed 2026-06-06 (commits fd1ce80, b28625f).
- The picker logic itself is correct: queue items get score 1e9, sort first, run 3/day in order, and drop out via the live-slug filter (`status=publish,future,draft`) as they publish. Latent risk: that fetch is `per_page=100` single-page; total live posts hit 98 on 2026-06-06, so once it passes 100 the filter will start missing slugs and may re-create dupes. Add pagination before then.

## Product accuracy (FOCO)

- **FOCO's body doubling is an AI focus companion (the Foco character), NEVER real people.** Do not write "live feed", "co-working room", "other users", "video sessions", "another person working in real time", or "display name". This false multiplayer narrative was generated across 11 posts (incl. the product page, which also had a fabricated "40-60%" stat + chart). Root cause: the generation prompt said "FOCO ... adds body doubling" with no guardrail, so the model invented real-people detail. Fixed the prompt ("FOCO PRODUCT FACTS" block in `daily-generate.js`) + schema in `create-post.js`. Always verify FOCO feature claims against reality; "AI body doubling" must stay AI-qualified. (2026-06-10)

## JS string pitfalls

- **`String.replace(re, replacement)` treats `$1`, `$2`… in the REPLACEMENT string as backreferences** — even when they're really literal text like a price "$17/mo" or "$1.99". This silently corrupted post 2136: a chart label `$17/mo` became `<the matched H2>7/mo` (the `$1` pulled in capture group 1) and dumped the heading inside the chart. **Always pass a replacement FUNCTION** (`.replace(re, () => insertHtml)`) whenever the inserted text can contain `$` (prices, regex-y content, user text). Functions' return values are NOT subject to `$` substitution. Verify rendered output, not just that the PATCH returned 200.

## WordPress publishing

- **WP templates output H1 via `the_title()`. Body content must NOT have its own H1.** `single.php` line 13 and `page.php` line 14 both output `<h1><?php the_title(); ?></h1>`. If body content also starts with `<h1>`, the rendered page has duplicate H1s — Google flags as SEO error. **Always strip `<h1>` from body content before pushing.** `create-post.js` STEP 10.5 handles this automatically. For one-off page pushes via REST, strip H1 before sending the `content` field.

- **Pages don't get auto-injected FAQPage schema.** `create-post.js` only runs on Posts. For Pages with FAQ sections, manually add FAQPage schema via RankMath → Schema → Add FAQPage.

- **Local theme repo can drift from live theme on Cloudways.** When the user pastes their live header.php or footer.php, sync the local file before editing. The disk version may be stale.

- **Theme h2 is sized for landing-page hero (clamp 30-60px). Content Pages + blog post bodies need smaller H2.** Scope override with `body.page:not(.foco-page)` (Pages) and `.foco-app .blog-single article h2/h3` (post bodies). Without this, H2 visually dominates H1 on every content page.
