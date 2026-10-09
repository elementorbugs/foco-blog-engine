<?php
/**
 * FOCO header logo size fix (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * header.php wraps the_custom_logo() (which prints its own <a class="custom-logo-link">) inside
 * <a class="logo">. Nested links are invalid HTML, so the browser splits them, the <img> falls
 * outside .logo, and the theme rule ".foco-app .logo img { max-height: 36px }" never applies.
 * The logo then renders at its full 329x98 and the fixed nav grows to ~135px on every page.
 * The split also leaves an empty <a class="logo"> as a flex item, which space-between turns into a
 * ~140px indent before the real logo; it is hidden here.
 * This caps the logo by its own class instead. Rollback: deactivate this snippet.
 */
add_action( 'wp_head', function () {
	echo '<style id="foco-logo-fix">.foco-app .foco-nav .nav-inner>a.logo:not(:has(*)){display:none !important}.foco-app .foco-nav img.custom-logo{height:40px !important;width:auto !important;max-height:none !important}.foco-app .foco-nav .custom-logo-link{display:flex;align-items:center}@media (max-width:900px){.foco-app .foco-nav img.custom-logo{height:34px !important}}</style>';
}, 99 );
