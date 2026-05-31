# FOCO Blog - Project Instructions

## Site
- **URL:** tryfoco.com (WordPress on Cloudways, custom FOCO theme, RankMath SEO)
- **Niche:** ADHD task initiation, executive function, focus techniques, ADHD productivity
- **Audience:** ADHD adults, ADHD students/parents-of, professionals managing ADHD at work
- **WP Auth:** Basic auth via app password (in `.env`, NOT committed)
- **Brand voice:** validating, plain-spoken, neuroscience-grounded, zero shame. Anti-hustle. Defines ADHD struggles in physiological/clinical terms (not character flaws). Slightly dry humor on lighter posts; tender register on shame/diagnosis topics.

## Strategic Positioning (LOCKED - do not redesign without explicit ask)
We do NOT compete with CHADD, ADDitude, or Inflow on broad ADHD content. We compete on **task initiation specifically** - narrow, ownable, the place existing content goes shallow. Win that niche, expand outward in year 2.

"Task initiation deficit" is FOCO's branded framing - used heavily inside content, but `/adhd-task-paralysis/` is the SEO pillar URL because that's what users actually search.

## 6 Pillars + 36 Spokes (LOCKED)

**P1 - `/adhd-task-paralysis/`** (flagship, conversion-relevant)
Spokes: `how-to-break-adhd-task-paralysis` · `adhd-cant-start-anything` · `task-initiation-deficit-explained` · `adhd-shutdown-vs-paralysis` · `procrastination-vs-paralysis` · `the-5-minute-rule-adhd`
Mascot: state_6_pause (acute pain) shifting to state_2_alignment (resolution)

**P2 - `/adhd-executive-function/`** (E-E-A-T anchor)
Spokes: `executive-function-skills-list` · `working-memory-adhd` · `time-blindness-adhd` · `emotional-regulation-adhd` · `adhd-transitions` · `russell-barkley-executive-function-model`
Mascot: state_1_presence (educational/calm)

**P3 - `/how-to-focus-with-adhd/`** (broadest top-of-funnel)
Spokes: `pomodoro-for-adhd` · `body-doubling-adhd` · `hyperfocus-adhd` · `brown-noise-adhd` · `adhd-time-blocking` · `best-adhd-fidget-tools`
Mascot: state_3_focus

**P4 - `/adhd-for-students/`** (parent + teen + college audience)
Spokes: `adhd-college-survival-guide` · `adhd-studying-techniques` · `adhd-test-anxiety` · `adhd-homework-help-parents` · `adhd-teen-organization` · `adhd-accommodations-school`
Mascot: state_3_focus

**P5 - `/adhd-at-work/`** (high commercial intent)
Spokes: `managing-adhd-at-work` · `adhd-remote-work` · `adhd-job-interview-tips` · `disclosing-adhd-to-employer` · `adhd-meetings-strategies` · `adhd-burnout-symptoms`
Mascot: state_2_alignment

**P6 - `/adhd-task-breakdown-apps/`** (conversion hub, NARROW vs "best ADHD apps")
Spokes: `foco-vs-goblin-tools` · `foco-vs-tiimo` · `foco-vs-inflow` · `best-task-breakdown-apps-for-adhd` · `best-free-adhd-apps` · `best-adhd-apps-for-moms`
Mascot: state_5_completion

## Cross-Pillar Infrastructure (the GEO moat)
Not pillars but as important. Build alongside pillars.

- **`/adhd-glossary/`** - single page, ~50 terms (ADHD tax, time blindness, RSD, executive dysfunction, task initiation deficit, etc.). Schema: `DefinedTermSet`. AI-engine catnip - gets cited disproportionately.
- **`/adhd-research/`** - every original FOCO data report. Quarterly: "What 100K FOCO users showed us about task initiation." Schema: `Dataset`. Proprietary data is the only durable moat against AI-rehashed content.
- **`/adhd-stories/`** - user stories, ADHD founders, ADHD parents. Builds non-SEO links (newsletters, podcasts). Brand affinity engine.

## Cover / Featured Images

### Spec
- **Resolution:** 1200×630 PNG at 1x (`deviceScaleFactor: 1`) - NOT 2x retina. Must read at thumbnail size on blog index.
- **Layout:** mascot left (~35% width) + title right (~60%) + logo bottom-right. Different from remindher's center-only - mascot is FOCO's signature, must appear.
- **Background:** `#040208` near-black with radial gradient `rgba(124, 58, 237, 0.30)` upper-right + neon accent line top.
- **Title:** Inter 800 weight, 78-86px, white, max 3 lines, max 3 words per line. Shorter = better.
- **Mascot:** Pulled from `C:\Users\User\design foco\states_1024\foco_state_*.png`. Auto-selected by post pillar (see mascot mapping below).

### Mascot per pillar (auto-pick logic in cover generator)
| Pillar | Mascot file | Mood |
|---|---|---|
| P1 task-paralysis | `foco_state_6_pause.png` | stuck/contemplative |
| P2 executive-function | `foco_state_1_presence.png` | calm/grounding |
| P3 how-to-focus | `foco_state_3_focus.png` | actively focused |
| P4 for-students | `foco_state_3_focus.png` | actively focused |
| P5 at-work | `foco_state_2_alignment.png` | smiling/winning |
| P6 task-breakdown-apps | `foco_state_5_completion.png` | celebrating |
| Solution/win posts (any pillar) | `foco_state_2_alignment.png` | smiling |
| Drift/distraction subtopic | `foco_state_4_drift.png` | wandering |

### Logo
White FOCO wordmark + mark, bottom-right, max-height 36px. Source: `brand/foco-logo-white.png`.

### Generator
`regenerate-covers.js` - edit `posts` array, run `node regenerate-covers.js`. Idempotent.

## Blog Post Content

### Format
- HTML body only (no `<html>/<body>` wrapper). Starts with `<h1>`.
- All `<style>` blocks must be **single-line** (no newlines) - WordPress `wpautop()` injects `<br/>` into multiline styles.
- Charts/figures wrapped in `<!-- wp:html -->...<!-- /wp:html -->` to prevent WordPress `<p>` injection.
- Tables wrapped in `<div class="foco-table-wrap">` with `overflow-x:auto` for mobile.

### Editorial markers - NEVER ship to publish
Strip before push: `[PERSONAL EXPERIENCE]`, `[UNIQUE INSIGHT]`, `[ORIGINAL DATA]`, `[IMAGE:...]`, `[CHART:...]`, `[CITATION:...]`. Pipeline aborts if any are present.

### External links
HTML `<a href>` tags only. Markdown `[text](url)` will render as literal brackets (WP doesn't process markdown inside `<!-- wp:html -->` blocks). Pipeline aborts if markdown links found.

### Paragraphs (CRITICAL SEO + GEO RULE)
- Max 1-2 sentences per paragraph. NEVER 3+ sentences in one block.
- MUST wrap every text paragraph in explicit `<p>...</p>` tags. Do NOT rely on `wpautop()` because `<!-- wp:html -->` blocks disable it.
- Bare text without `<p>` tags renders as a wall of text with zero spacing.

### Internal links (CRITICAL SEO RULE)
- Each post needs **≥3 inbound** links from other posts AND **≥4 outbound** links to other posts.
- Hub-and-spoke architecture - every spoke must link to its pillar.
- Verify destinations return HTTP 200 before linking - `curl -s -o /dev/null -w "%{http_code}" URL`.
- Never link to a draft slug. Pipeline aborts on dead-slug list.

### AI clichés banned
delve, navigate, game-changer, moreover, furthermore, in today's fast-paced world, in conclusion, unleash, leverage (as verb), seamlessly, dive deep, robust, cutting-edge, revolutionary, transformative, harness, embark on, journey (metaphorical).

**Em dashes (—) are BANNED.** They're one of the strongest "AI-generated" tells. Use commas, periods, or a regular hyphen (-) instead. Applies to every post, page, schema description, and meta description.

## SEO Title (CRITICAL)
- **Hard limit:** post title in WP DB ≤ **58 characters**. RankMath auto-appends ` - FOCO` (7 chars) → rendered `<title>` stays ≤65 (Google truncation).
- Front-load the keyword. First 30 chars carry the most weight.
- No clickbait padding. Drop "(That Actually Works)", "(You Need to Know)", "(Game-Changer)".
- `<h1>` ≠ title tag. H1 in body HTML can be longer/more descriptive. WP post title (becomes `<title>`) is the SEO-constrained one.
- Verify after publishing: `curl -s URL | grep -oE "<title>[^<]+</title>"` - count chars.
- Bulk fixer: `node shorten-titles.js` (dry-run by default, `--live` to push).

## GEO (Generative Engine Optimization) Rules

GEO is treated as a first-class concern, not an afterthought. Every post optimizes for AI engine citation alongside Google ranking.

### Structural requirements (every post)
1. **Answer box at top** - 40-60 word direct answer, in `<div class="foco-tldr">` immediately after `<h1>`. AI engines preferentially cite the first definitive answer block. **Do NOT prefix it with a literal "TL;DR" label - just the answer paragraph inside the `foco-tldr` box.**
2. **Q&A H2 structure** - every H2 phrased as a question users ask. Answer in the first paragraph. Detail follows.
3. **Definitive statements** - write "FOCO breaks tasks into 5 tiny steps" not "FOCO may help break down tasks." AI engines down-weight hedged claims.
4. **Entity definitions** - bold first mention of any technical term ("**task initiation deficit**", "**executive function**", "**rejection sensitive dysphoria**"). Schema reinforces these as defined entities.
5. **Citation density ≥ 3** authoritative external sources per post (NIMH, CHADD, ADDitude, peer-reviewed journals, .gov/.edu). Pipeline warns if < 3.
6. **Key Takeaways box** - bulleted list near top OR bottom. AI engines extract these as summary citations.

### llms.txt
Site root `llms.txt` lists pillars + key spokes for AI crawlers. Maintained automatically - `node setup-llms-txt.js` regenerates from current published-post list.

### robots.txt rules (AI crawlers)
Allow all major AI crawlers explicitly: GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Bytespider, CCBot, Google-Extended.

## Schema Strategy

| Page type | Schema |
|---|---|
| Pillars | `Article` + `WebPage` + `BreadcrumbList` |
| FAQ-heavy posts | `FAQPage` (auto-generated from H3 questions under FAQ H2) |
| Procedural/how-to posts | `HowTo` |
| Glossary | `DefinedTermSet` |
| Research/data posts | `Dataset` |
| App comparisons | `SoftwareApplication` + `Review` |
| All posts | `Article` baseline |

Most ADHD blogs ship `FAQPage` and stop. We layer schema by content type - that's the authority signal AI engines trigger on.

## Brand

### Colors (FOCO design tokens - extracted from live tryfoco.com)
Source of truth: `foco-theme/style.css` `:root` block. If the site's tokens change, update here AND `chart-kit.js` constants.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#040208` | Page background (near-black) |
| `--bg-2` | `#0a0410` | Lifted sections, chart wrappers |
| `--primary` | `#7C3AED` | Highlight bars, headlines, CTA |
| `--primary-2` | `#A78BFA` | Secondary bars, lilac accents |
| `--primary-soft` | `rgba(124, 58, 237, 0.18)` | Eyebrow pills, soft backgrounds |
| `--celebrate` | `#FB923C` | Wins, completion, save badges |
| `--celebrate-soft` | `rgba(251, 146, 60, 0.22)` | Risk-hook pills, orange tints |
| `--text` | `#FFFFFF` | Primary text |
| `--muted` | `#B8B0CC` | Body copy, captions |
| `--muted-2` | `#7d738f` | Tertiary text, dividers |
| `--card` | `rgba(255, 255, 255, 0.035)` | Card surfaces (vignettes, testimonials) |
| `--card-hover` | `rgba(255, 255, 255, 0.06)` | Card hover state |
| `--stroke` | `rgba(167, 139, 250, 0.18)` | Default borders |
| `--stroke-strong` | `rgba(167, 139, 250, 0.4)` | Emphasized borders |
| `--r-sm` / `--r` / `--r-lg` | `12px` / `20px` / `28px` | Border radii |

### Chart palette mapping (chart-kit.js constants)
Charts run on a DARK background - opposite of remindher (which used `#faf8ff` light cream). Adjust contrast accordingly.

```js
const C = {
  text:          '#FFFFFF',                     // chart titles, axis labels
  muted:         '#B8B0CC',                     // sub-labels, captions
  primary:       '#7C3AED',                     // highlight bar, donut fill
  primary2:      '#A78BFA',                     // secondary series
  primarySoft:   'rgba(124, 58, 237, 0.18)',    // soft bg fills
  celebrate:     '#FB923C',                     // accent for wins/saves
  celebrateSoft: 'rgba(251, 146, 60, 0.22)',
  bg:            '#0a0410',                     // chart figure background
  bgInner:       'rgba(255, 255, 255, 0.035)',  // inner cells (statGrid, infographicList)
  border:        'rgba(167, 139, 250, 0.18)',
  borderStrong:  'rgba(167, 139, 250, 0.4)',
  danger:        '#ef4444',                     // negative stats / warnings only
};
```

### Cover gradient (regenerate-covers.js)
```css
background: linear-gradient(135deg, #040208 0%, #0a0410 30%, #1a0a2e 60%, #2d1257 100%);
```
Plus radial glow upper-right `rgba(124, 58, 237, 0.30)` + lower-left lilac wash + 6px neon accent line top.

### Logo files
`brand/` folder - `foco-logo-white.png`, `foco-logo-purple.png`, `foco-mark.svg`, app icons.

### Tone register by topic
- **Diagnosis/clinical posts** (executive function, working memory): clear, neutral, validating. Cite primary research.
- **Acute pain posts** (task paralysis, can't start, shutdown): warm, somatic-first ("your nervous system is doing X"), zero shame.
- **How-to posts**: direct, actionable, "do this then that." Numbered steps. Time estimates.
- **Comparison/app posts**: confident, specific, fair to competitors. Never trash-talk.

## Chart Kit
- **File:** `chart-kit.js` - generates inline SVG charts with scoped CSS classes
- **Types:** horizontalBar, donutChart, stackedCompare, statGrid, progressTimeline, infographicList
- **Config:** `chart-configs.js` - per-slug chart definitions with data + injection position
- **All CSS minified to single line** (`wpSafe()` handles this)
- **All output wrapped in `<!-- wp:html -->`** blocks
- **CRITICAL: chart labels ≤ 20 chars max.** Long labels overflow especially in donutChart center. Descriptive context goes in `caption` (renders below). Never put a sentence in `label`.
- **Rebuild after editing chart-configs.js:** `node rebuild-charts.js [slug]` strips existing foco-chart figures and re-injects fresh. Idempotent.
- **Chart palette uses FOCO tokens** (purple/lilac/orange) not remindher's lilac/violet.

## Publishing Pipeline (one command)

**ALL post creation MUST go through `create-post.js`.** Single executable pipeline. Don't run cover generation, chart injection, marker injection, or RankMath setup as separate manual steps.

```bash
node create-post.js posts-new/post-{slug}.html \
  --keyword="primary target keyword" \
  [--title="WP Title ≤58 chars"] \
  [--pillar] \
  [--cover-title="Two\nLines"] \
  [--publish] \
  [--skip-cover] \
  [--dry-run]
```

### Steps the script runs (in order)
1. **Validate** - H1, no editorial markers, no markdown links, FAQ section, Key Takeaways, ≥4 internal links, TL;DR box, ≥3 external citations. Aborts on errors.
2. **Determine WP title** - `--title` if provided; else H1 if ≤58 chars; else aborts.
3. **Detect existing post** - looks up by slug. If exists, fetches WP content as base (protects charts/markers/schema from duplication).
4. **Generate + upload cover** - mascot-left + title-right layout, 1200×630 1x. Auto-picks mascot by pillar. Skipped if `--skip-cover` (reuses existing featured_media).
5. **Validate internal + external links**
   - Internal: aborts on dead-slug list or any slug missing from WP. Warns on draft-status targets.
   - External: auto-adds `target="_blank" rel="noopener"`. Warns if < 3 citations.
6. **Auto-split long paragraphs** - anything >3 sentences gets split into smaller chunks. Iterates until clean.
7. **Inject TL;DR** if missing - generates 40-60 word answer-style summary, wraps in `<div class="foco-tldr">`.
8. **Rebuild SVG charts** from `chart-configs.js` (strips existing + re-injects fresh).
9. **Inline images** - auto-fetches ~3 Pexels images using keyword + H2 section context. Skipped if no `.pexels-key` or `--skip-pexels`.
10. **Build + inject schema** - Article (always) + FAQPage (if FAQ H2 present) + HowTo (if procedural post detected via `--howto` flag).
11. **Push to WP** - CREATE if new (status=draft); UPDATE if exists (preserves current status, never demotes published→draft). If `--publish` AND post count ≥ 11, sets status=publish.
12. **Set RankMath focus keyword** via `/wp-json/rankmath/v1/updateMeta`.
13. **Set RankMath pillar flag** if `--pillar`.
14. **Set featured image alt text** including the keyword.

Always idempotent - re-runs are safe.

### Publish policy
- **Posts 1–10:** `--publish` flag is IGNORED. All ships as draft. User reviews + manually publishes via wp-admin.
- **Post 11+:** `--publish` flag respected. If passed, post goes live immediately. If not passed, ships as draft (default).
- **Cron-scheduled auto-publish:** NOT supported until 20+ posts ship and quality bar is proven.

### Required flags
- `--keyword` is REQUIRED. Used for focus keyword + alt text + GEO. Without it, abort.
- `--title` required if H1 > 58 chars.
- `--pillar` only on the 6 pillar posts (P1–P6).
- `--howto` for procedural posts that should get HowTo schema.

### After running create-post.js (manual steps)
1. Replace `[IMAGE:]` markers with real images (only if `--add-image-markers` opt-in flag was used).
2. **Purge Cloudways cache** - Cloudways → Application → Manage Services → Varnish → Purge. Verify with `curl -sI URL | grep X-Cache` (should show MISS).
3. Publish from wp-admin if post 1-10 (drafts).
4. Google Search Console → URL Inspection → Request Indexing.

### Never (even when reorganizing posts manually)
- Never POST cover generation, chart injection, RankMath calls, or schema as separate scripts. The pipeline is one command.
- Never push content edits via WP REST without first GETting current WP content as base. Local file in `posts-new/` is a draft; WP post is source of truth after first push.
- Never auto-publish in posts 1-10 even if `--publish` is passed (script enforces this).

## Slug Mapping - pillars + spokes

**Always verify a slug returns 200 before linking** (or accept that it's a known draft target):
`curl -s https://tryfoco.com/post-sitemap.xml | grep -oE "<loc>[^<]+</loc>"`

**Pillars (6, all flagged as RankMath "Pillar Content"):**
- `/adhd-task-paralysis/` - P1 flagship
- `/adhd-executive-function/` - P2 clinical
- `/how-to-focus-with-adhd/` - P3 procedural
- `/adhd-for-students/` - P4 students/parents
- `/adhd-at-work/` - P5 professional
- `/adhd-task-breakdown-apps/` - P6 conversion

When a NEW pillar is created, run `node set-pillar-content.js <postId>` to set the RankMath flag.

**Spokes (36, frequently linked):**
See `slug-map.json` for full live mapping with post IDs. Updated automatically by `create-post.js`.

**Cross-pillar infra:**
- `/adhd-glossary/` - terminology hub
- `/adhd-research/` - proprietary data hub
- `/adhd-stories/` - community/testimonial hub

## Project Structure

```
foco-blog-engine/
├── CLAUDE.md                  ← this file (project rules)
├── .env                       ← WP creds (gitignored)
├── .pexels-key                ← Pexels API key (gitignored)
├── package.json
├── create-post.js             ← UNIFIED PIPELINE (one command)
├── chart-kit.js               ← SVG chart primitives, FOCO palette
├── chart-configs.js           ← per-slug chart definitions
├── rebuild-charts.js          ← refresh charts from config
├── inject-internal-links.js   ← hub-and-spoke link injection
├── shorten-titles.js          ← enforce 58-char DB limit
├── regenerate-covers.js       ← bulk cover regen
├── fix-broken-links.js        ← repair after slug changes
├── set-pillar-content.js      ← RankMath pillar flag
├── setup-llms-txt.js          ← regenerate llms.txt
├── setup-rankmath.js          ← initial RankMath config (one-time)
├── posts-new/                 ← raw HTML drafts (slug = filename)
├── covers-new/                ← generated PNG covers
├── brand/                     ← FOCO logos + mascots reference
├── .audit-cache/              ← slug-to-id map, backups
└── slug-map.json              ← live pillar+spoke→postId mapping
```

## 90-Day Publishing Cadence (LOCKED)

| Weeks | What ships | Why this order |
|---|---|---|
| 1-2 | 3 pillars (P1 task-paralysis, P5 at-work, P6 apps) + 1 spoke each = 6 posts | Conversion-relevant pillars first. Task-paralysis is flagship. |
| 3-4 | Glossary launch + 3 more spokes | Glossary live ASAP - accumulates AI citations slowly, earlier = better. |
| Month 2 | 3 more pillars (P2, P3, P4) + 12 spokes + 1 research piece | Fill out cluster shape. First proprietary-data citation magnet. |
| Month 3 | 12 more spokes + 3 user stories + 1 research piece | Reach 36-post threshold where Google treats site as topic authority. |

Total at 90 days: 6 pillars + 36 spokes + glossary + 2 research + 3 stories = 48 published assets.

## Self-Improvement
After ANY correction from user → update `tasks/lessons.md` with the pattern. Review at session start. Prune quarterly, keep under 60 lines.
