<?php
/**
 * FOCO sitewide header + footer (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * One look on every page:
 * - Header: solid white bar with a soft shadow and dark links (was dark/transparent on pages,
 *   translucent lavender on the homepage and posts).
 * - Footer: always near-black. It has no background of its own and inherits .foco-app, so pages
 *   with a light .foco-app (homepage, posts) were painting it light with white links.
 * Selectors are prefixed with html body to outrank the page-level snippets.
 * Rollback: deactivate this snippet.
 */
add_action( 'wp_head', function () {
	$n = 'html body .foco-app #foco-nav';
	echo '<style id="foco-site-chrome">'
		// header
		. $n . ',' . $n . '.scrolled{background:#FFFFFF !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important;border-bottom:1px solid #ECE6F7 !important;box-shadow:0 2px 14px rgba(30,23,51,.06) !important;padding:12px 0 !important}'
		. $n . ' .nav-links a{color:#2A2340 !important;font-weight:500 !important}'
		. $n . ' .nav-links a:hover{color:#6D28D9 !important}'
		. $n . '.open .nav-links{background:#FFFFFF !important;box-shadow:0 22px 40px rgba(30,23,51,.12) !important;border-bottom:1px solid #ECE6F7 !important}'
		. $n . '.open .nav-links a{color:#2A2340 !important}'
		. $n . '.open .nav-links>li{border-bottom-color:#F1ECF9 !important}'
		. 'html body .foco-app .foco-nav-toggle{background:#FFFFFF !important;border-color:#E7E0F5 !important}'
		. 'html body .foco-app .foco-nav-toggle span{background:#1E1733 !important}'
		// footer
		. 'html body .foco-app footer{background:#040208 !important;color:#B8B0CC !important}'
		. 'html body .foco-app footer h4{color:#FFFFFF !important}'
		. 'html body .foco-app footer a{color:#B8B0CC !important}'
		. 'html body .foco-app footer a:hover{color:#FFFFFF !important}'
		. 'html body .foco-app footer p,html body .foco-app footer span{color:#9C93B3 !important}'
		. '</style>';
}, 100 );
