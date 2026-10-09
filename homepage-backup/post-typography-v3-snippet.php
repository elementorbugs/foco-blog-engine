<?php
/**
 * FOCO post layout + typography v3 (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * - Light header, as on the homepage.
 * - The reading column lines up with the header's left edge (the logo) instead of floating in the
 *   middle of wide screens: .wrap spans the header's 1200px container, content sits left at 860px.
 * - On screens >= 1240px the free space on the right holds a sticky "On this page" list built
 *   from the post's H2s (client-side, no content edits).
 * - Softer ink, more air (measured against recordo.app posts), light answer box instead of the
 *   dark slab, images left-aligned. Fonts come from the sitewide font snippet (Lexend + Plus Jakarta Sans).
 *
 * Rollback: deactivate this snippet.
 */
add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	$p   = '.single-post .blog-single';
	$css = 'html:has(body.single-post){background:#FAF8FD !important}'
		// light header
		. '.single-post .foco-app .foco-nav,.single-post .foco-app .foco-nav.scrolled{background:rgba(250,248,253,.92) !important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid #E7E0F5 !important;box-shadow:none !important;padding:12px 0 !important}'
		. '.single-post .foco-app .foco-nav .nav-links a{color:#3B2A63 !important}.single-post .foco-app .foco-nav .nav-links a:hover{color:#6D28D9 !important}.single-post .foco-app .foco-nav.open .nav-links a{color:#fff !important}'
		. '.single-post .foco-app .foco-nav-toggle{background:#fff !important;border-color:#E7E0F5 !important}.single-post .foco-app .foco-nav-toggle span{background:#1E1733 !important}'
		. '.single-post .foco-app,' . $p . '{background:#FAF8FD !important}'
		// layout: same container as the header, content aligned left
		. $p . ' .wrap{max-width:1200px !important;padding-left:24px !important;padding-right:24px !important;position:relative !important;margin-left:auto !important;margin-right:auto !important}'
		. $p . ' .wrap>*{max-width:860px !important;margin-left:0 !important;margin-right:0 !important}'
		. $p . ' .wrap>.foco-toc-side{max-width:none !important}'
		. $p . ' article figure,' . $p . ' article .foco-img,' . $p . ' article .wp-block-image,' . $p . ' article img{margin-left:0 !important;margin-right:auto !important}'
		. $p . ' article figure figcaption,' . $p . ' article .foco-img figcaption{text-align:left !important}'
		. $p . ' article,' . $p . ' article>*{text-align:left !important}'
		// body text
		. $p . ' article p,' . $p . ' article li{color:#4A4560 !important;font-size:18px !important;line-height:1.85 !important;letter-spacing:.015em !important}'
		. $p . ' article p{margin-bottom:22px !important}'
		. $p . ' article strong{color:#2A2340 !important;font-weight:600 !important}'
		// headings
		. $p . ' h1,' . $p . ' article h2,' . $p . ' article h3,' . $p . ' article h4{font-weight:600 !important;letter-spacing:.005em !important;color:#2A2340 !important;max-width:none !important}'
		. $p . ' h1{font-size:clamp(32px,4vw,48px) !important;line-height:1.2 !important}'
		. $p . ' article h2{font-size:clamp(24px,2.4vw,29px) !important;line-height:1.3 !important;margin-top:60px !important;margin-bottom:16px !important;scroll-margin-top:96px !important}'
		. $p . ' article h3{font-size:21px !important;line-height:1.35 !important;margin-top:36px !important}'
		// meta row
		. $p . ' .post-meta,' . $p . ' .post-meta span{font-size:14px !important;color:#625A78 !important;letter-spacing:.01em !important}'
		// review/comparison posts: one-line freshness + disclosure under the meta row
		. $p . ' article p.foco-review-meta{font-size:14px !important;line-height:1.55 !important;color:#625A78 !important;letter-spacing:.01em !important;margin:0 0 18px !important}'
		// answer box + takeaways
		. $p . ' .foco-tldr{background:#F3EEFC !important;border:0 !important;border-left:4px solid #7C3AED !important;border-radius:14px !important;box-shadow:none !important;padding:22px 26px !important}'
		. $p . ' article .foco-tldr,' . $p . ' article .foco-tldr *,' . $p . ' article .foco-tldr p{color:#2A2340 !important;font-size:18px !important;line-height:1.75 !important}'
		. $p . ' article .foco-tldr a{color:#5B21B6 !important}'
		. $p . ' .foco-key-takeaways{background:#fff !important;border:1px solid #ECE6F7 !important;border-radius:16px !important}'
		. $p . ' .foco-key-takeaways h2{font-size:18px !important;margin-top:0 !important;color:#5B21B6 !important}'
		. $p . ' .foco-key-takeaways li{font-size:16.5px !important;line-height:1.7 !important}'
		// sticky "On this page" in the right gutter (wide screens only)
		. $p . ' .foco-toc-side{display:none}'
		. '@media (min-width:1240px){' . $p . ' .foco-toc-side{display:block;position:absolute;right:24px;width:240px}'
		. $p . ' .foco-toc-side nav{position:sticky;top:100px;border-left:2px solid #ECE6F7;padding:4px 0 4px 18px}'
		. $p . ' .foco-toc-side b{display:block;font:600 12px/1 Lexend,Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#625A78;margin-bottom:14px}'
		. $p . ' .foco-toc-side a{display:block;font-size:14px;line-height:1.45;color:#5B5170 !important;text-decoration:none !important;border:0 !important;padding:6px 0;transition:color .15s}'
		. $p . ' .foco-toc-side a:hover,' . $p . ' .foco-toc-side a.on{color:#6D28D9 !important}'
		. $p . ' .foco-toc-side a.on{font-weight:600}}'
		// mobile
		. '@media (max-width:640px){' . $p . ' .post-meta{display:flex !important;flex-wrap:wrap !important;gap:2px 10px !important}' . $p . ' .post-meta span{white-space:nowrap !important;font-size:13px !important}'
		. $p . ' article p,' . $p . ' article li{font-size:17px !important;line-height:1.8 !important}' . $p . ' article h2{margin-top:44px !important}}';
	echo '<style id="foco-post-v3">' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput -- static CSS
}, 99 );

// Builds the side "On this page" list from the article's H2s and keeps the current one highlighted.
add_action( 'wp_footer', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	?>
<script id="foco-toc-side">
(function () {
	var wrap = document.querySelector('.blog-single .wrap');
	var art = wrap ? wrap.querySelector('article') : null;
	if (!art || art.querySelector('.foco-appdex')) { return; }
	var skip = /^(key takeaways|table of contents|faq|frequently asked questions|sources|references)$/i;
	var hs = Array.prototype.filter.call(art.querySelectorAll('h2'), function (h) {
		return !skip.test(h.textContent.trim()) && !h.closest('.foco-key-takeaways, .foco-tldr, .foco-appdex');
	});
	if (hs.length < 3) { return; }
	var aside = document.createElement('aside');
	aside.className = 'foco-toc-side';
	aside.setAttribute('aria-label', 'On this page');
	var nav = document.createElement('nav');
	nav.innerHTML = '<b>On this page</b>';
	var links = hs.map(function (h, i) {
		if (!h.id) { h.id = 'sec-' + (i + 1) + '-' + h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50); }
		var a = document.createElement('a');
		a.href = '#' + h.id;
		a.textContent = h.textContent.trim();
		nav.appendChild(a);
		return a;
	});
	aside.appendChild(nav);
	wrap.appendChild(aside);
	function place() {
		aside.style.top = art.offsetTop + 'px';
		aside.style.height = art.offsetHeight + 'px';
	}
	place();
	window.addEventListener('load', place);
	window.addEventListener('resize', place);
	function mark() {
		var cur = 0;
		hs.forEach(function (h, i) { if (h.getBoundingClientRect().top < 140) { cur = i; } });
		links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
	}
	mark();
	window.addEventListener('scroll', mark, { passive: true });
})();
</script>
	<?php
}, 99 );
