# /best-adhd-app/ guide rebuild (2026-11-13)

Guide part of post #1080, rebuilt on the 40 live reviews. The tabbed directory (foco-appdex) is untouched.

- `extract.py <dir> reviews.json` parses each review's at-a-glance table from WP REST JSON.
- `build.py` writes the new page and `post-patches/best-adhd-app.json` (3 edits: answer box + picks + 40-app table, rest of the guide, FAQ schema). Paths point at the session scratchpad; adjust before reuse.
- NOT applied yet. Waiting for Adi's "פרסם" before running `action=patch`.
