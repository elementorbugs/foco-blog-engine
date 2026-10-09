<?php
/**
 * FOCO light blog index + archives (2026-10-09). Runs as a "Code Snippets" plugin snippet.
 *
 * Brand rule (2026-10-09): every page is light (#FAF8FD); dark is only an accent (footer, demo
 * band, final CTA). This converts /blog/, category/tag/date archives and search results:
 * - content left-aligned to the header container (1200px), like posts;
 * - "Browse by topic" as light pills (name + count); the dark photo tiles looked heavy here;
 * - posts as white cards in a 3-column grid (2 on tablets, 1 on phones); the dark mascot covers
 *   read as the accent.
 * Rollback: deactivate this snippet.
 */
add_action( 'wp_head', function () {
	if ( ! ( is_home() || is_archive() || is_search() ) ) {
		return;
	}
	$a = 'html body .foco-app .blog-archive';
	echo '<style id="foco-light-archives">'
		. 'html,html body,html body .foco-app{background:#FAF8FD !important}'
		. $a . '{background:#FAF8FD !important;max-width:none !important;padding:118px 0 88px !important;color:#4A4560 !important}'
		// grid: h1, topic tiles and pagination span the row; cards fill 3 columns
		. $a . ' .wrap{max-width:1200px !important;margin:0 auto !important;padding:0 24px !important;display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr)) !important;gap:30px 24px !important;align-items:stretch !important}'
		. $a . ' .wrap>:not(.post-card){grid-column:1/-1 !important}'
		. $a . ' h1{font-size:clamp(34px,4vw,48px) !important;font-weight:600 !important;letter-spacing:.005em !important;line-height:1.15 !important;color:#2A2340 !important;margin:0 0 4px !important;text-align:left !important}'
		. $a . ' .archive-description,' . $a . ' .taxonomy-description{color:#5B5170 !important;font-size:17px !important;max-width:720px !important}'
		// topics: light pills (name + count) instead of dark photo tiles, which looked heavy on the light page
		. $a . ' .topic-tiles{margin:0 0 22px !important}'
		. $a . ' .topic-tiles-title{color:#7A7290 !important;font-size:12px !important;font-weight:600 !important;letter-spacing:.1em !important;text-transform:uppercase !important;margin:0 0 12px !important}'
		. $a . ' .topic-photo-grid{display:flex !important;flex-wrap:wrap !important;gap:10px !important}'
		. $a . ' .topic-tile{display:inline-flex !important;align-items:center !important;aspect-ratio:auto !important;position:relative !important;overflow:visible !important;background:#FFFFFF !important;border:1px solid #E7E0F5 !important;border-radius:999px !important;box-shadow:none !important;padding:0 !important;transition:border-color .15s,background .15s !important}'
		. $a . ' .topic-tile:hover{border-color:#7C3AED !important;background:#F6F2FD !important}'
		. $a . ' .topic-tile::before,' . $a . ' .topic-tile::after,' . $a . ' .topic-tile-img{display:none !important}'
		. $a . ' .topic-tile-body{position:static !important;display:inline-flex !important;align-items:center !important;gap:8px !important;padding:10px 12px 10px 18px !important}'
		. $a . ' .topic-tile-name{font-size:15px !important;font-weight:600 !important;color:#2A2340 !important;text-shadow:none !important;white-space:nowrap !important;letter-spacing:0 !important}'
		. $a . ' .topic-tile-count{background:#F3EEFC !important;border:0 !important;color:#6D28D9 !important;font-size:12px !important;font-weight:700 !important;padding:3px 9px !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important}'
		. $a . ' .topic-tile:hover .topic-tile-name{color:#6D28D9 !important}'
		// cards
		. $a . ' .post-card{display:flex !important;flex-direction:column !important;background:#FFFFFF !important;border:1px solid #ECE6F7 !important;border-radius:18px !important;overflow:hidden !important;text-decoration:none !important;transition:transform .18s,box-shadow .18s !important;margin:0 !important;padding:0 !important;gap:0 !important;width:auto !important;max-width:none !important}'
		. $a . ' .post-card:hover{transform:translateY(-3px) !important;box-shadow:0 14px 34px rgba(76,29,149,.12) !important}'
		. $a . ' .post-card-thumb{width:100% !important;max-width:none !important;flex:none !important;aspect-ratio:1200/630 !important;margin:0 !important;border-radius:0 !important;background:#0B0614 !important;overflow:hidden !important}'
		. $a . ' .post-card-thumb img{width:100% !important;height:100% !important;object-fit:cover !important;border-radius:0 !important}'
		. $a . ' .post-card-body{display:flex !important;flex-direction:column !important;gap:8px !important;padding:18px 20px 20px !important;flex:1 !important}'
		. $a . ' .post-date{font-size:12px !important;font-weight:600 !important;letter-spacing:.08em !important;text-transform:uppercase !important;color:#7A7290 !important;margin:0 !important}'
		. $a . ' .post-card h2{font-family:Lexend,Inter,sans-serif !important;font-size:19px !important;font-weight:600 !important;line-height:1.32 !important;letter-spacing:.005em !important;color:#2A2340 !important;margin:0 !important}'
		. $a . ' .post-card .excerpt,' . $a . ' .post-card .excerpt p{font-size:14.5px !important;line-height:1.6 !important;color:#5B5170 !important;margin:0 !important;display:-webkit-box !important;-webkit-line-clamp:3 !important;-webkit-box-orient:vertical !important;overflow:hidden !important}'
		. $a . ' .read-more{margin-top:auto !important;padding-top:6px !important;font-size:13.5px !important;font-weight:600 !important;color:#6D28D9 !important}'
		// pagination
		. $a . ' .pagination{margin-top:24px !important}'
		. $a . ' .pagination .nav-links{display:flex !important;flex-wrap:wrap !important;gap:8px !important;justify-content:flex-start !important;background:none !important;position:static !important;box-shadow:none !important;border:0 !important;padding:0 !important}'
		. $a . ' .page-numbers{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-width:42px !important;height:42px !important;padding:0 14px !important;border-radius:999px !important;border:1px solid #E7E0F5 !important;background:#FFFFFF !important;color:#3B2A63 !important;font-weight:600 !important;font-size:14px !important;text-decoration:none !important}'
		. $a . ' .page-numbers.current{background:#7C3AED !important;border-color:#7C3AED !important;color:#FFFFFF !important}'
		. $a . ' .page-numbers.dots{border:0 !important;background:none !important}'
		. $a . ' a.page-numbers:hover{border-color:#7C3AED !important;color:#6D28D9 !important}'
		// responsive
		. '@media (max-width:1000px){' . $a . ' .wrap{grid-template-columns:repeat(2,minmax(0,1fr)) !important}}'
		. '@media (max-width:640px){' . $a . '{padding:100px 0 60px !important}' . $a . ' .wrap{grid-template-columns:1fr !important;gap:20px !important}' . $a . ' .topic-photo-grid{gap:8px !important}' . $a . ' .topic-tile-body{padding:8px 10px 8px 14px !important}' . $a . ' .topic-tile-name{font-size:14px !important}}'
		. '</style>';
}, 100 );

// 12 posts per page fills the 3-column grid (10 left a single card on the last row).
add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() && $q->is_main_query() && ( $q->is_home() || $q->is_archive() || $q->is_search() ) ) {
		$q->set( 'posts_per_page', 12 );
	}
} );
