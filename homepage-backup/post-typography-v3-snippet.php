<?php
/**
 * FOCO post typography v3 (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * Calmer reading layout for blog posts, matching homepage v3: Lexend headings at 600 instead of
 * Inter 800 with tight tracking, softer ink, a slightly wider column, more space above H2s,
 * and the light header used on the homepage.
 *
 * PREVIEW MODE: applies only when the URL has ?style=v3, so the same post can be compared
 * both ways. To ship it to every post, set FOCO_POST_V3_LIVE to true.
 * Rollback: deactivate this snippet.
 */
if ( ! defined( 'FOCO_POST_V3_LIVE' ) ) {
	define( 'FOCO_POST_V3_LIVE', false );
}

add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	if ( ! FOCO_POST_V3_LIVE && ( ! isset( $_GET['style'] ) || 'v3' !== $_GET['style'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">';
	$css = 'html:has(body.single-post){background:#FAF8FD !important}.single-post .foco-app .foco-nav,.single-post .foco-app .foco-nav.scrolled{background:rgba(250,248,253,.9) !important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid #E7E0F5 !important;box-shadow:none !important;padding:12px 0 !important}.single-post .foco-app .foco-nav .nav-links a{color:#3B2A63 !important}.single-post .foco-app .foco-nav .nav-links a:hover{color:#6D28D9 !important}.single-post .foco-app .foco-nav.open .nav-links a{color:#fff !important}.single-post .foco-app .foco-nav-toggle{background:#fff !important;border-color:#E7E0F5 !important}.single-post .foco-app .foco-nav-toggle span{background:#1E1733 !important}.single-post .foco-app,.single-post .blog-single{background:#FAF8FD !important}.single-post .blog-single .wrap{max-width:964px !important;padding-left:24px !important;padding-right:24px !important}.single-post .blog-single article,.single-post .blog-single article p,.single-post .blog-single article li,.single-post .blog-single article td,.single-post .blog-single article th,.single-post .blog-single .post-meta{font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif !important}.single-post .blog-single article p,.single-post .blog-single article li{color:#4A4560 !important;font-size:18px !important;line-height:1.85 !important;letter-spacing:.015em !important}.single-post .blog-single article p{margin-bottom:22px !important}.single-post .blog-single article strong{color:#2A2340 !important;font-weight:600 !important}.single-post .blog-single h1,.single-post .blog-single article h2,.single-post .blog-single article h3,.single-post .blog-single article h4{font-family:Lexend,Inter,system-ui,sans-serif !important;font-weight:600 !important;letter-spacing:.005em !important;color:#2A2340 !important}.single-post .blog-single h1{font-size:clamp(32px,4vw,48px) !important;line-height:1.2 !important}.single-post .blog-single article h2{font-size:clamp(24px,2.4vw,29px) !important;line-height:1.3 !important;margin-top:60px !important;margin-bottom:16px !important}.single-post .blog-single article h3{font-size:21px !important;line-height:1.35 !important;margin-top:36px !important}.single-post .blog-single .post-meta,.single-post .blog-single .post-meta span{font-size:14px !important;color:#7A7290 !important;letter-spacing:.01em !important}.single-post .blog-single .foco-tldr{background:#F3EEFC !important;border:0 !important;border-left:4px solid #7C3AED !important;border-radius:14px !important;box-shadow:none !important;padding:22px 26px !important}.single-post .blog-single article .foco-tldr,.single-post .blog-single article .foco-tldr *,.single-post .blog-single article .foco-tldr p{color:#2A2340 !important;font-size:18px !important;line-height:1.75 !important}.single-post .blog-single article .foco-tldr a{color:#5B21B6 !important}.single-post .blog-single .foco-key-takeaways{background:#fff !important;border:1px solid #ECE6F7 !important;border-radius:16px !important}.single-post .blog-single .foco-key-takeaways h2{font-size:18px !important;margin-top:0 !important;color:#5B21B6 !important}.single-post .blog-single .foco-key-takeaways li{font-size:16.5px !important;line-height:1.7 !important}@media (max-width:640px){.single-post .blog-single .post-meta{display:flex !important;flex-wrap:wrap !important;gap:2px 10px !important;font-size:13px !important}.single-post .blog-single .post-meta span{white-space:nowrap !important;font-size:13px !important}.single-post .blog-single article p,.single-post .blog-single article li{font-size:17px !important;line-height:1.8 !important}.single-post .blog-single article h2{margin-top:44px !important}}';
	echo '<style id="foco-post-v3">' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput -- static CSS
}, 99 );
