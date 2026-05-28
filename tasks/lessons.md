# Lessons learned

Pruned quarterly. Keep under 60 lines.

## SEO / URL structure

- **Keyword-in-slug beats short-slug for unbranded sites.** For hub pages targeting search keywords, put the keyword in the URL: `/adhd-resources/` not `/resources/`, `/adhd-tools/` not `/tools/`, `/adhd-glossary/` not `/glossary/`. Branded/utility pages (about, contact, pricing, founders) keep short slugs because nobody searches "tryfoco about". Mistake made: suggested `/resources/` for a hub page targeting "adhd resources" — user corrected to `/adhd-resources/`.

- **Feature sub-pages need the keyword too.** `/features/adhd-task-breakdown/` not `/features/task-breakdown/`. The `/features/` parent gives context but the sub-page's own keyword has to be in its slug.

- **RankMath title appends " - SiteName" automatically.** Don't put the brand name in the H1/title field yourself — it doubles. Page title should be just the topic; RankMath adds the suffix.

## WordPress publishing

- **WP templates output H1 via `the_title()`. Body content must NOT have its own H1.** `single.php` line 13 and `page.php` line 14 both output `<h1><?php the_title(); ?></h1>`. If body content also starts with `<h1>`, the rendered page has duplicate H1s — Google flags as SEO error. **Always strip `<h1>` from body content before pushing.** `create-post.js` STEP 10.5 handles this automatically. For one-off page pushes via REST, strip H1 before sending the `content` field.

- **Pages don't get auto-injected FAQPage schema.** `create-post.js` only runs on Posts. For Pages with FAQ sections, manually add FAQPage schema via RankMath → Schema → Add FAQPage.

- **Local theme repo can drift from live theme on Cloudways.** When the user pastes their live header.php or footer.php, sync the local file before editing. The disk version may be stale.

- **Theme h2 is sized for landing-page hero (clamp 30-60px). Content Pages + blog post bodies need smaller H2.** Scope override with `body.page:not(.foco-page)` (Pages) and `.foco-app .blog-single article h2/h3` (post bodies). Without this, H2 visually dominates H1 on every content page.
