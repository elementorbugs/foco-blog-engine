<?php
/**
 * FOCO sitewide header + footer (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * One look on every page:
 * - Header: solid near-black bar, same colour as the footer (Adi, 2026-10-09: white looked thin;
 *   dark reads as a frame around the light pages). Fixed size, no transitions.
 * - Footer: always near-black. It has no background of its own and inherits .foco-app, so pages
 *   with a light .foco-app (homepage, posts) were painting it light with white links.
 * Selectors are prefixed with html body to outrank the page-level snippets.
 * Rollback: deactivate this snippet.
 */
add_action( 'wp_head', function () {
	$n = 'html body .foco-app #foco-nav';
	echo '<style id="foco-site-chrome">'
		// header: dark, same colour as the footer; fixed height, nothing animates its size
		. $n . ',' . $n . '.scrolled{background:#040208 !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important;border-bottom:1px solid rgba(167,139,250,.16) !important;box-shadow:none !important;padding:16px 0 !important;transform:none !important;top:0 !important;transition:none !important}'
		. $n . ' .nav-links{gap:34px !important}'
		. $n . ' .nav-links a{color:#E7E0F5 !important;font-weight:500 !important;font-size:15px !important}'
		. $n . ' .nav-links a:hover{color:#FFFFFF !important}'
		. $n . ' img.custom-logo{height:44px !important}'
		. $n . '.open .nav-links{background:#040208 !important;box-shadow:0 22px 40px rgba(0,0,0,.5) !important;border-bottom:1px solid rgba(167,139,250,.16) !important}'
		. $n . '.open .nav-links a{color:#FFFFFF !important}'
		. $n . '.open .nav-links>li{border-bottom-color:rgba(167,139,250,.1) !important}'
		. 'html body .foco-app .foco-nav-toggle{background:rgba(255,255,255,.06) !important;border-color:rgba(167,139,250,.25) !important}'
		. 'html body .foco-app .foco-nav-toggle span{background:#FFFFFF !important}'
		. '@media (max-width:900px){' . $n . '{padding:12px 0 !important}' . $n . ' img.custom-logo{height:34px !important}}'
		// footer
		. 'html body .foco-app footer{background:#040208 !important;color:#B8B0CC !important}'
		. 'html body .foco-app footer h4{color:#FFFFFF !important}'
		. 'html body .foco-app footer a{color:#B8B0CC !important}'
		. 'html body .foco-app footer a:hover{color:#FFFFFF !important}'
		. 'html body .foco-app footer p,html body .foco-app footer span{color:#9C93B3 !important}'
		. '</style>';
}, 100 );
