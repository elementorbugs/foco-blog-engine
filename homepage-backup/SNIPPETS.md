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

Snippets 1-4 are the plugin's inactive examples.
