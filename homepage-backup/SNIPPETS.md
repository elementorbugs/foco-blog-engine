# Live Code Snippets (tryfoco.com → Snippets)

Source of truth for each active snippet. Edit the file here, then PUT it to
`/wp-json/code-snippets/v1/snippets/<id>` (field `code`, without the leading `<?php`).
Rollback for any of them: deactivate it in wp-admin → Snippets.

| ID | File | What it does |
|---|---|---|
| 5 | homepage-v2-snippet.php | Renders the v2/v3 homepage (page 4760) with page.php; classic homepage at /home-classic/ |
| 6 | footer-social-snippet.php | Instagram / TikTok / YouTube / Pinterest icons under the footer logo |
| 7 | header-logo-snippet.php | Logo size fix + hides the empty `a.logo` left by the theme's nested-link bug |
| 8 | post-typography-v3-snippet.php | Post layout: left-aligned 860px column, sticky "On this page", light answer box |
| 9 | site-fonts-snippet.php | Lexend headings + Plus Jakarta Sans body, every page |
| 10 | site-chrome-snippet.php | Dark 78px header + black footer on every page; admin-bar offset |
| 11 | light-archives-snippet.php | Light /blog/ + archives: topic pills, 3-column card grid, 12 per page |
| 12 | light-pages-snippet.php | Light regular pages. GENERATED: edit light-articles.css or scripts/build-light-pages-snippet.js, then rebuild |
| 13 | post-app-cta-snippet.php | Sticky bottom app bar on every blog post: icon, "Stuck? Take step one.", App Store / Google Play button by device (both on desktop), ✕ hides it for the session. Deploy: `node deploy-post-app-cta.js` |
| 15 | tools/body-doubling-room/deploy/room-snippet.php | Serves the live body doubling room at /body-doubling/ (page 5453) as a standalone page. GENERATED: edit tools/body-doubling-room, then `node tools/body-doubling-room/deploy/deploy.js` |
| 17 | consent-a11y-snippet.php | Defines foco_consent_head_html/style_html/banner_html (also printed by the standalone room #15 and timer #16 snippets). Cookie consent (Consent Mode v2: opt-in EEA/UK/CH, opt-out elsewhere, banner + footer "Cookie settings") + WCAG fixes (skip link, main landmark, focus, video pause, contrast) + youtube-nocookie. Deploy: `node deploy-consent-a11y.js`. Pages: `node publish-legal-pages.js --live` (/accessibility-statement/ #5610, privacy cookies section) |
| 18 | self-hosted-fonts-snippet.php | Lexend, Plus Jakarta Sans, Inter, Fraunces, Figtree served from the media library (no visitor IP to Google); strips every Google Fonts link/@import from all pages incl. room + timer. GENERATED: `node deploy-self-hosted-fonts.js` (new Google font? add its css2 URL to SOURCES) |
| 20 | play-referrer-snippet.php | Adds an install referrer (utm_source=tryfoco, utm_campaign = page slug) to every FOCO Google Play link that has none, so site installs show in GA4 instead of google-play/organic. Standalone tools (room, timer, adhd-tools) skip wp_footer and get it from `tools/store-referrer.js` at deploy. `node deploy-play-referrer.js`. QA: `node analytics/qa-store-links.js` |

Snippets 1-4 are the plugin's inactive examples.

## Page 4760 hero background video (2026-11-19)
The live homepage hero has a background video (woman stuck at her laptop, mirrored, `foco-home-hero-woman.mp4`, 280KB; the server rejects uploads over ~1MB) behind a dark scrim, white text, phone demo kept on the right. It was injected straight into page 4760 by `homepage-preview/hero-video-inject.py` (idempotent, marker `fh-hero-video`), NOT in homepage-preview/index.html. If you rebuild the page with build-page.js, re-run the injector or the video disappears. Backup before the change: `homepage-backup/page-4760-2026-11-19-pre-push.html`.

## Homepage + /get-foco/ redesign layers (2026-11-19)
Page 4760 (homepage) is now the original build-page.js output PLUS injected layers, applied in this order by
`node homepage-preview/deploy-home-injections.js` (GETs the live page, backs it up, re-applies every layer, idempotent):
1. `hero-video-inject.py`: woman-at-laptop background video in the hero, phone demo kept, mobile video strip.
2. `feature-opal-inject.py`: Opal-style feature phones (3D tilt with scroll, dissolve at the bottom); swaps the stats screen for the "You did it!" screen (`done-url.txt`).
3. Steps screen swap ("Reply to important emails" in 5 steps, `steps-url.txt`).
4. `pain-art-inject.py`: Forest-style pain section, FOCO desk scenes (`pain-art-urls.json`, art in `art/pain-set2/`).
5. `night-theme-inject.py`: one continuous purple world over every section, FAQ title "FOCO answers, in one place."
The deploy script reads local media from `.tmp/hp/livepv/` only when a cached URL file is missing.
**If you rebuild the page with build-page.js, run deploy-home-injections.js right after or all of this disappears.**
/get-foco/ (page 1152) is rebuilt by `homepage-preview/get-foco-full.js` (`--force` rebuilds from the saved pre-redesign source; icons cached in `get-foco-icons.json`).
Backups before every push: `homepage-backup/page-4760-2026-11-19-*.html`, `get-foco-1152-2026-11-19-*.html`.
