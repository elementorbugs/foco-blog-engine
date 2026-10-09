<?php
/**
 * FOCO homepage v2 (2026-10-08). Runs as a "Code Snippets" plugin snippet, so no theme upload is needed.
 *
 * 1) Front page: if the page set as the static front page holds the v2 layout (class="fh"),
 *    render it with page.php (the v2 CSS handles that wrapper) instead of the classic
 *    ACF template in front-page.php.
 * 2) Keeps the classic homepage reachable at /home-classic/ (page 17) with front-page.php.
 *
 * Rollback: Settings > Reading > Homepage > "Home (classic)" (page 17), or deactivate this snippet.
 */
add_filter( 'template_include', function ( $template ) {
	if ( is_front_page() ) {
		$front_id = (int) get_option( 'page_on_front' );
		if ( $front_id && false !== strpos( (string) get_post_field( 'post_content', $front_id ), 'class="fh"' ) ) {
			$page_tpl = locate_template( 'page.php' );
			if ( $page_tpl ) {
				return $page_tpl;
			}
		}
	} elseif ( is_page( 17 ) ) {
		$classic = locate_template( 'front-page.php' );
		if ( $classic ) {
			return $classic;
		}
	}
	return $template;
}, 99 );

// The classic template's CSS is scoped to .foco-page, which the theme only adds on the front page.
add_filter( 'body_class', function ( $classes ) {
	if ( is_page( 17 ) && ! is_front_page() ) {
		$classes[] = 'foco-page';
	}
	return $classes;
} );

// page.php prints the page title as an <h1>; on the v2 homepage the hero already has the real <h1>,
// so blank the template's title there to keep exactly one meaningful H1.
add_filter( 'the_title', function ( $title, $id = 0 ) {
	if ( ! is_admin() && is_front_page() && in_the_loop() && (int) $id === (int) get_option( 'page_on_front' ) ) {
		return '';
	}
	return $title;
}, 10, 2 );
