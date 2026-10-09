# Decision-first rewrite: "X alternative(s)" list posts (2026-10-09)

Read `tasks/review-format/SPEC.md` first. **Everything in it applies** (hard limits, FOCO facts, writing rules, lint, report), except the structure below, which replaces its "Required structure" for list posts.

## What is different about list posts
- They compare several apps against one app the reader is leaving (X). Be fair to X: say what it does well and who should stay with it.
- **No fake ranking.** Order by use case ("best for …"), not by a score. FOCO may come first only because its use case (starting a stuck task) matches FOCO's real strength; say once that we make it. Include at least 4 non-FOCO alternatives with real strengths. Keep the old post's app list unless an app is discontinued or a fact is now false; you may drop one weak entry or add one clearly better-known option, and say why in your report.
- Every app's price, free plan and platforms must be verified today on its own site or store listing (WebFetch / WebSearch / `https://itunes.apple.com/lookup?id=<id>&country=us` or `https://itunes.apple.com/search?term=<name>&entity=software&country=us&limit=5`). If a price is not public or varies by country, say so and link the pricing page. App Store rating = `averageUserRating` rounded to 1 decimal + `userRatingCount`, "US App Store, October 9, 2026".

## Icons
- Apps already in `app-directory.json` → `apps.<key>.icon` (FOCO, Goblin Tools, Tiimo, Structured, Inflow, Amazing Marvin, Aligned, Todoist, TickTick, Motion, Sunsama, Habitica).
- Any other app: use the official App Store icon URL from the iTunes API, `artworkUrl512` with the size part changed to `96x96bb.png` (e.g. `…/512x512bb.jpg` → `…/96x96bb.png`). We will re-host these before publishing; just use the mzstatic URL. Web-only apps with no store listing: omit the `<img>` and keep the name.

## Required structure
1. `<p class="foco-review-meta">Updated October 9, 2026 · Prices and ratings checked today · <strong>We make FOCO</strong>, one of the apps on this list</p>`
2. `<div class="foco-tldr">`: `<p><strong>Short answer:</strong> …</p>` (40-60 words: the best alternative depends on why you are leaving X) + `<ul>` of 4-5 lines "**If X's problem is …:** App" (the reader's reason → the pick).
3. `<h2>` "Which X alternatives are best at a glance?" + the multi table:
```
<div class="foco-table-wrap foco-cmp2 multi"><table>
<thead><tr><th scope="col">App</th><th scope="col">Best for</th><th scope="col">Free version</th><th scope="col">Paid</th><th scope="col">Platforms</th><th scope="col">App Store</th></tr></thead>
<tbody>
<tr class="cm-ours"><th scope="row"><span class="cm-app"><img src="ICON" alt="FOCO app icon" width="36" height="36" loading="lazy"/><span><b>FOCO</b><small>We make this app</small></span></span></th><td data-label="Best for">…</td><td data-label="Free version"><span class="cm-no">No</span> 7-day trial</td><td data-label="Paid">$9/mo or $59/yr</td><td data-label="Platforms">iPhone, Android</td><td data-label="App Store"><span class="cm-star">★ 5.0</span> 15 ratings</td></tr>
<tr><th scope="row"><span class="cm-app"><img …/><span><b>App</b><small>short tag, e.g. "Free on the web"</small></span></span></th><td data-label="Best for">…</td>…</tr>
</tbody></table></div>
```
   Every `<td>` needs its `data-label` (it becomes the label on phones). `tr class="cm-ours"` only on FOCO's row. Use `cm-yes`/`cm-no`/`cm-star` as in the reference.
4. `<h2>` "Why do people look for an X alternative?" Short and fair, 2-4 paragraphs, no trash talk; sourced where it is a claim about X (its own pricing/help pages, store listing).
5. `<h2>` "What are the best X alternatives for ADHD?" then one `<h3>` per app: "N. App, best for …". Under each: 2-3 short paragraphs (what it does for ADHD, the honest trade-off), then `<p><strong>Price:</strong> … (checked Oct 9, 2026)</p>`. Keep existing real screenshots from the old post where they still fit (same src); FOCO entry may use one FOCO screenshot from SPEC.md (look at it first).
6. `<h2>` "Who should stay with X?" (2-3 bullets, honest).
7. `<h2>FAQ</h2>` with 5-6 `<h3>` questions people search ("Is there a free alternative to X?", "What is the best X alternative for ADHD?"...).
8. `<h2>How did we compare them?</h2>`: method, sources and dates, disclosure, "we did not test the other apps hands-on" (only FOCO and Goblin Tools' website have been used by us; see SPEC.md), authority links (NIMH / CHADD / Barkley).
9. Key Takeaways div at the end (3-4 bullets, one mentions FOCO).
10. JSON-LD `@graph`: `ItemList` (ordered, `itemListOrder` "https://schema.org/ItemListOrderAscending") of `SoftwareApplication` for every app on the list, including FOCO, with name, applicationCategory, operatingSystem, url, offers (price/priceCurrency/description). Plus FAQPage matching the visible FAQ exactly. No ratings.

Write `posts-new/post-<slug>.html`, run `node tasks/review-format/lint.js posts-new/post-<slug>.html` until PASS, then report (facts changed old → new with source URL, apps added/dropped and why, anything unverified).
