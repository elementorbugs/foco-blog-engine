<?php
/**
 * FOCO sitewide fonts (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * One type system across the whole site: Lexend for headings, Plus Jakarta Sans for everything
 * else (replaces the theme's Inter). Loaded on every front-end page. Code keeps a monospace font.
 * Rollback: deactivate this snippet (the theme falls back to Inter).
 */
add_action( 'wp_head', function () {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
		. '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">';
	echo '<style id="foco-site-fonts">'
		. '.foco-app,.foco-app *{font-family:"Plus Jakarta Sans",Inter,system-ui,-apple-system,sans-serif !important}'
		. '.foco-app h1,.foco-app h2,.foco-app h3,.foco-app h4,.foco-app h5,.foco-app h6,.foco-app .fh .big,.foco-app .fh .price,.foco-app .fh .stat b{font-family:Lexend,Inter,system-ui,sans-serif !important}'
		. '.foco-app code,.foco-app pre,.foco-app kbd,.foco-app samp{font-family:Menlo,Monaco,"Courier New",monospace !important}'
		. '</style>';
}, 5 );
