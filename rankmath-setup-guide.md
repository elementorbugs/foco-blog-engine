# RankMath Manual Setup Guide

Settings that can't be set via REST API. ~10 minutes total. Do these once.

After completing each section, **save the page** before navigating away.

---

## 1. Site Identity (3 minutes) — fixes the biggest problem

WP Admin → **Settings → General**

| Field | Current (probably) | Set to |
|---|---|---|
| **Site Title** | tryfoco.com | `FOCO` |
| **Tagline** | Just another WordPress site | `Your ADHD Focus Companion` |
| **WordPress Address (URL)** | leave alone | leave alone |
| **Site Address (URL)** | leave alone | leave alone |

Click **Save Changes**.

**Why this matters:** The Site Title is what shows in `<title>` tags and og:site_name across every page. "FOCO" + post title is way more brand-coherent than "tryfoco.com - Post Title".

---

## 2. RankMath Title & Meta (3 minutes)

WP Admin → **RankMath SEO → Titles & Meta**

### Tab: Global Meta

| Field | Set to |
|---|---|
| **Title Separator** | `—` (em dash) — looks more editorial than hyphen |
| **Capitalize Titles** | OFF |

### Tab: Homepage

| Field | Set to |
|---|---|
| **Homepage Title** | `FOCO — ADHD Focus Companion: Start Tasks You've Been Stuck On` (62 chars, fits ≤65) |
| **Homepage Description** | `FOCO turns any task into one tiny first step. Built for ADHD brains. Free trial — no credit card required. Start tasks you've been stuck on for weeks.` (157 chars) |

### Tab: Posts

| Field | Set to |
|---|---|
| **Single Post Title** | `%title% %sep% %sitename%` |
| **Single Post Description** | leave blank (RankMath will use rank_math_description per-post, which we now auto-set) |
| **Schema Type** | Article |
| **Article Type** | BlogPosting |

### Tab: Pages

| Field | Set to |
|---|---|
| **Single Page Title** | `%title% %sep% %sitename%` |
| **Schema Type** | WebPage |

### Tab: Author / Date / Search Archives

For each of these (**Author Archives**, **Date Archives**, **Search Results**):
- Set **Index Search Pages**: NO (toggle off)
- Set **Robots Meta**: `noindex, follow`

This prevents thin-content archive pages from competing with your real content.

---

## 3. RankMath Schema Defaults (1 minute)

WP Admin → **RankMath SEO → Titles & Meta → Posts**

- **Default Schema**: Article
- **Article Type**: BlogPosting
- **Headline Source**: Title
- **Description Source**: SEO Description (which we auto-set from TL;DR)

---

## 4. Sitemaps (1 minute)

WP Admin → **RankMath SEO → Sitemap Settings**

Confirm these are ON:
- **Sitemap**: Enabled
- **Include images**: Enabled
- **Include featured image**: Enabled
- **Posts**: Included
- **Pages**: Included
- **Categories**: Excluded (optional — keeps focus on real content)
- **Tags**: Excluded (optional)

Sitemap URL: `https://tryfoco.com/sitemap_index.xml`

After saving, **submit it to Google**:
1. Go to **Google Search Console** → your property
2. Sidebar → **Sitemaps**
3. Add new sitemap: paste `sitemap_index.xml`
4. Submit

Same for Bing Webmaster Tools (if you use it).

---

## 5. Social / OpenGraph (1 minute)

WP Admin → **RankMath SEO → Titles & Meta → Social Meta**

| Field | Set to |
|---|---|
| **Site Name (for og:site_name)** | `FOCO` |
| **Twitter Username** | your @handle (or blank) |
| **Default Social Image** | upload `c:\Users\User\design foco\states_1024\foco_state_1_presence.png` (or your generic FOCO logo) — fallback when post has no cover |

Make sure **OpenGraph** is enabled and **Twitter Cards** is set to `summary_large_image`.

---

## 6. Robots & AI Crawlers (2 minutes)

WP Admin → **RankMath SEO → General Settings → Edit robots.txt**

Replace existing content with:

```
User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /readme.html
Sitemap: https://tryfoco.com/sitemap_index.xml

# AI crawlers — explicitly allowed (we want to be cited)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /
```

Click **Save Changes**.

---

## 7. Google Search Console — verify + submit (2 minutes)

If not already verified:
1. Go to **search.google.com/search-console**
2. Add property: `https://tryfoco.com`
3. Verify via DNS or HTML file (RankMath has a built-in verification field — you can paste the meta tag at **RankMath → General Settings → Webmaster Tools**)

Then for each new post, after publishing:
1. Search Console → **URL Inspection**
2. Paste the post URL
3. Click **Request Indexing**

This dramatically speeds up Google's first crawl. Skip it and you'll wait days. Do it and you're indexed in hours.

---

## 8. Cloudways Cache (after every content change)

When you edit anything, the public site won't show changes until you purge cache:

1. Cloudways → your application → **Application Settings**
2. **Manage Services** → **Varnish**
3. Click **Purge**

Or set up auto-purge if it's not already active. Otherwise verify changes are live with:

```
curl -sI https://tryfoco.com/adhd-task-paralysis/ | grep X-Cache
```

If it says `MISS`, you got fresh. If `HIT`, your cache is stale.

---

## 9. llms.txt (FOCO-specific, 1 minute)

If the **Website LLMs.txt** plugin is installed:
- WP Admin → **Settings → Website LLMs.txt** (or similar)
- Click **Generate / Save** to refresh the file based on current published posts
- Verify at `https://tryfoco.com/llms.txt`

If not installed: install it (search "Website LLMs.txt" in **Plugins → Add New**), then generate.

This file is what AI engines look for when deciding which pages to index for citation. It should list your pillars, glossary, and research piece prominently.

---

## 10. Final verification (2 minutes)

After completing 1–9, verify each fix worked:

```bash
curl -s https://tryfoco.com/adhd-task-paralysis/ | grep -oE '<title>[^<]+</title>'
# Expected: <title>ADHD Task Paralysis: Why You Can't Start — FOCO</title>

curl -s https://tryfoco.com/adhd-task-paralysis/ | grep -oE '<meta name="description"[^>]+>'
# Expected: a 150-160 char description starting with "If you sit down..."

curl -s https://tryfoco.com/adhd-task-paralysis/ | grep -oE '<meta property="og:site_name"[^>]+>'
# Expected: og:site_name="FOCO"

curl -s https://tryfoco.com/sitemap_index.xml | head -20
# Expected: valid XML sitemap listing post-sitemap, page-sitemap, etc.

curl -s https://tryfoco.com/robots.txt | head
# Expected: AI crawler rules at the bottom

curl -s https://tryfoco.com/llms.txt | head
# Expected: a Markdown manifest listing your top URLs
```

If any of these fail, that section's setup didn't save. Repeat that step.

---

## Time budget

| Section | Time |
|---|---|
| 1. Site Identity | 3 min |
| 2. Title & Meta | 3 min |
| 3. Schema Defaults | 1 min |
| 4. Sitemaps + GSC submit | 2 min |
| 5. Social / OpenGraph | 1 min |
| 6. Robots + AI crawlers | 2 min |
| 7. GSC verify + submit | 2 min |
| 8. Cloudways purge | 30 sec |
| 9. llms.txt | 1 min |
| 10. Verification | 2 min |
| **Total** | **~15 min** |

Do this once. After this, every new post the engine ships inherits all these defaults automatically.
