<?php
/**
 * FOCO theme functions
 *
 * - Theme support (logo, menus, post-thumbnails, html5, title)
 * - Asset enqueuing (Google Fonts, theme CSS, theme JS)
 * - Body class
 * - ACF field group registration (only if ACF is active)
 * - foco_field() / foco_url() helpers — safe access with fallback defaults
 *
 * @package FOCO
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ============================================================
   THEME SETUP
   ============================================================ */

if ( ! function_exists( 'foco_setup' ) ) :
function foco_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );

	// Custom Logo (editable in Appearance → Customize → Site Identity)
	add_theme_support( 'custom-logo', array(
		'height'      => 80,
		'width'       => 240,
		'flex-height' => true,
		'flex-width'  => true,
	) );

	// Register navigation menu locations
	register_nav_menus( array(
		'primary'          => __( 'Primary Menu (top nav)', 'foco' ),
		'footer'           => __( 'Footer Menu (legacy)', 'foco' ),
		'footer-product'   => __( 'Footer — Product', 'foco' ),
		'footer-resources' => __( 'Footer — Resources', 'foco' ),
		'footer-tools'     => __( 'Footer — Tools', 'foco' ),
		'footer-company'   => __( 'Footer — Company', 'foco' ),
	) );
}
endif;
add_action( 'after_setup_theme', 'foco_setup' );

/* ============================================================
   ENQUEUE STYLES + SCRIPTS
   ============================================================ */

function foco_enqueue_assets() {
	// Inter from Google Fonts
	wp_enqueue_style(
		'foco-inter',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
		array(),
		null
	);

	// Theme stylesheet
	wp_enqueue_style(
		'foco-theme',
		get_stylesheet_uri(),
		array( 'foco-inter' ),
		wp_get_theme()->get( 'Version' )
	);

	// Theme JS (FAQ accordion, nav scroll behavior)
	wp_enqueue_script(
		'foco-theme',
		get_template_directory_uri() . '/assets/js/main.js',
		array(),
		wp_get_theme()->get( 'Version' ),
		true
	);
}
add_action( 'wp_enqueue_scripts', 'foco_enqueue_assets' );

/* ============================================================
   BODY CLASS — adds .foco-page on the front page so we can scope
   global rules without affecting WP admin or unrelated pages.
   ============================================================ */

function foco_body_class( $classes ) {
	if ( is_front_page() || is_home() ) {
		$classes[] = 'foco-page';
	}
	return $classes;
}
add_filter( 'body_class', 'foco_body_class' );

/* ============================================================
   ACF HELPERS
   - foco_field( $key, $default ) returns ACF field value or default.
   - foco_sub( $key, $default ) returns ACF sub_field inside have_rows loops.
   - foco_url( $key, $default ) returns href-safe URL.
   - foco_image( $key, $size, $default_url ) returns an image URL.
   These let templates work with or without ACF installed.
   ============================================================ */

function foco_field( $key, $default = '' ) {
	if ( function_exists( 'get_field' ) ) {
		$value = get_field( $key );
		if ( ! empty( $value ) || $value === '0' || $value === 0 ) {
			return $value;
		}
	}
	return $default;
}

function foco_sub( $key, $default = '' ) {
	if ( function_exists( 'get_sub_field' ) ) {
		$value = get_sub_field( $key );
		if ( ! empty( $value ) || $value === '0' || $value === 0 ) {
			return $value;
		}
	}
	return $default;
}

function foco_url( $key, $default = '#' ) {
	$value = foco_field( $key, '' );
	return ! empty( $value ) ? esc_url( $value ) : esc_url( $default );
}

function foco_image( $key, $size = 'large', $default_url = '' ) {
	$image = foco_field( $key, null );
	if ( is_array( $image ) ) {
		// ACF returns array
		if ( isset( $image['sizes'][ $size ] ) ) return esc_url( $image['sizes'][ $size ] );
		if ( isset( $image['url'] ) ) return esc_url( $image['url'] );
	}
	if ( is_numeric( $image ) ) {
		$src = wp_get_attachment_image_url( $image, $size );
		if ( $src ) return esc_url( $src );
	}
	if ( is_string( $image ) && $image ) return esc_url( $image );
	return esc_url( $default_url );
}

function foco_sub_image( $key, $size = 'large', $default_url = '' ) {
	if ( ! function_exists( 'get_sub_field' ) ) return esc_url( $default_url );
	$image = get_sub_field( $key );
	if ( is_array( $image ) ) {
		if ( isset( $image['sizes'][ $size ] ) ) return esc_url( $image['sizes'][ $size ] );
		if ( isset( $image['url'] ) ) return esc_url( $image['url'] );
	}
	if ( is_numeric( $image ) ) {
		$src = wp_get_attachment_image_url( $image, $size );
		if ( $src ) return esc_url( $src );
	}
	if ( is_string( $image ) && $image ) return esc_url( $image );
	return esc_url( $default_url );
}

function foco_sub_url( $key, $default = '#' ) {
	if ( ! function_exists( 'get_sub_field' ) ) return esc_url( $default );
	$value = get_sub_field( $key );
	return ! empty( $value ) ? esc_url( $value ) : esc_url( $default );
}

/* ============================================================
   ACF FIELD GROUPS
   Registered programmatically so the theme is self-contained.
   The user just needs ACF (free) installed and activated.
   Field group is attached to the front page (Settings → Reading
   → Static front page).
   ============================================================ */

add_action( 'acf/init', 'foco_register_acf_fields' );
function foco_register_acf_fields() {

	if ( ! function_exists( 'acf_add_local_field_group' ) ) return;

	acf_add_local_field_group( array(
		'key'      => 'group_foco_landing',
		'title'    => 'FOCO Landing Page',
		'location' => array(
			array(
				array(
					'param'    => 'page_type',
					'operator' => '==',
					'value'    => 'front_page',
				),
			),
		),
		'menu_order'      => 0,
		'position'        => 'normal',
		'style'           => 'default',
		'label_placement' => 'top',
		'active'          => true,
		'fields' => array(

			/* ---------------- HERO ---------------- */
			array( 'key' => 'tab_hero',  'label' => 'Hero', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'hero_eyebrow',     'label' => 'Eyebrow text',          'name' => 'hero_eyebrow',     'type' => 'text', 'default_value' => 'ADHD Focus Companion' ),
			array( 'key' => 'hero_headline_1',  'label' => 'Headline (line 1, white)', 'name' => 'hero_headline_1', 'type' => 'text', 'default_value' => "You don't finish tasks." ),
			array( 'key' => 'hero_headline_2',  'label' => 'Headline (line 2, gradient purple)', 'name' => 'hero_headline_2', 'type' => 'text', 'default_value' => 'You never start them.' ),
			array( 'key' => 'hero_subhead',     'label' => 'Subhead',               'name' => 'hero_subhead',     'type' => 'textarea', 'rows' => 2, 'default_value' => "FOCO is your ADHD focus companion. It turns any task into one tiny step you can actually begin." ),
			array( 'key' => 'hero_microcta',    'label' => 'Micro-CTA pill (HTML allowed)', 'name' => 'hero_microcta', 'type' => 'text', 'default_value' => '<strong>Free</strong> &middot; No credit card &middot; 60-second start' ),
			array( 'key' => 'hero_mascot',      'label' => 'Hero mascot image',     'name' => 'hero_mascot',      'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'hero_trust',       'label' => 'Trust line (HTML allowed)', 'name' => 'hero_trust', 'type' => 'text', 'default_value' => 'Trusted by <strong style="color:#fff">100,000+</strong> ADHD minds' ),
			array( 'key' => 'app_store_url',    'label' => 'App Store URL',         'name' => 'app_store_url',    'type' => 'url', 'default_value' => '#' ),
			array( 'key' => 'google_play_url',  'label' => 'Google Play URL',       'name' => 'google_play_url',  'type' => 'url', 'default_value' => '#' ),

			/* ---------------- PROBLEM ---------------- */
			array( 'key' => 'tab_problem', 'label' => 'Problem', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'problem_eyebrow',  'label' => 'Eyebrow', 'name' => 'problem_eyebrow', 'type' => 'text', 'default_value' => 'The real problem' ),
			array( 'key' => 'problem_h_1',      'label' => 'Headline (line 1)', 'name' => 'problem_h_1', 'type' => 'text', 'default_value' => 'You have something to do.' ),
			array( 'key' => 'problem_h_2',      'label' => 'Headline (line 2, gradient)', 'name' => 'problem_h_2', 'type' => 'text', 'default_value' => "But you don't start." ),
			array( 'key' => 'problem_layered_1','label' => 'Layered intro line 1', 'name' => 'problem_layered_1', 'type' => 'text', 'default_value' => 'You sit down.' ),
			array( 'key' => 'problem_layered_2','label' => 'Layered intro line 2', 'name' => 'problem_layered_2', 'type' => 'text', 'default_value' => 'You open your laptop.' ),
			array( 'key' => 'problem_climax',   'label' => 'Climax line (purple)', 'name' => 'problem_climax', 'type' => 'text', 'default_value' => 'And then&hellip; nothing.' ),
			array( 'key' => 'problem_image',    'label' => 'Photo (paralyzed scene)', 'name' => 'problem_image', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'problem_caption',  'label' => 'Photo caption (HTML allowed)', 'name' => 'problem_caption', 'type' => 'text', 'default_value' => 'FOCO stays with you. <br>Until you can begin.' ),
			array( 'key' => 'companion_mascot', 'label' => 'Companion mascot overlaid on photo', 'name' => 'companion_mascot', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'reject_1',         'label' => 'Rejection 1 (HTML allowed; wrap struck word in <span class="strike">word</span>)', 'name' => 'reject_1', 'type' => 'text', 'default_value' => "Not because you're <span class=\"strike\">lazy</span>." ),
			array( 'key' => 'reject_2',         'label' => 'Rejection 2 (HTML allowed)', 'name' => 'reject_2', 'type' => 'text', 'default_value' => "Not because you <span class=\"strike\">don't care</span>." ),
			array( 'key' => 'truth_line',       'label' => 'Truth line (wrap punch words in <span class="grad">word</span>)', 'name' => 'truth_line', 'type' => 'text', 'default_value' => "Because your brain doesn't know <span class=\"grad\">where to begin.</span>" ),
			array(
				'key' => 'vignettes',
				'label' => 'Pain vignettes (4 cards)',
				'name' => 'vignettes',
				'type' => 'repeater',
				'min' => 0,
				'max' => 8,
				'layout' => 'block',
				'button_label' => 'Add vignette',
				'sub_fields' => array(
					array( 'key' => 'v_num',   'label' => 'Number tag (e.g. 01)', 'name' => 'num',   'type' => 'text' ),
					array( 'key' => 'v_head',  'label' => 'Headline (gradient)',  'name' => 'head',  'type' => 'text' ),
					array( 'key' => 'v_body',  'label' => 'Body (HTML allowed)',  'name' => 'body',  'type' => 'textarea', 'rows' => 3 ),
				),
			),

			/* ---------------- BRIDGE ---------------- */
			array( 'key' => 'tab_bridge', 'label' => 'Bridge', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'bridge_text', 'label' => 'Bridge text (HTML allowed)', 'name' => 'bridge_text', 'type' => 'text', 'default_value' => "You're not broken. <strong>There's a name for this.</strong>" ),

			/* ---------------- INSIGHT ---------------- */
			array( 'key' => 'tab_insight', 'label' => 'Insight', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'insight_eyebrow', 'label' => 'Eyebrow', 'name' => 'insight_eyebrow', 'type' => 'text', 'default_value' => 'This is not a willpower problem' ),
			array( 'key' => 'insight_h_1',     'label' => 'Headline part 1', 'name' => 'insight_h_1', 'type' => 'text', 'default_value' => 'It has' ),
			array( 'key' => 'insight_h_2',     'label' => 'Headline part 2 (gradient)', 'name' => 'insight_h_2', 'type' => 'text', 'default_value' => 'a name.' ),
			array( 'key' => 'insight_label',   'label' => 'TID box label', 'name' => 'insight_label', 'type' => 'text', 'default_value' => "It's called" ),
			array( 'key' => 'insight_name',    'label' => 'TID box name', 'name' => 'insight_name', 'type' => 'text', 'default_value' => 'Task Initiation Deficit' ),
			array( 'key' => 'insight_p1',      'label' => 'Bottom paragraph 1 (HTML allowed)', 'name' => 'insight_p1', 'type' => 'textarea', 'default_value' => "ADHD brains don't struggle with doing.<br><strong>They struggle with starting.</strong>" ),
			array( 'key' => 'insight_quote_1', 'label' => 'Bridge quote 1', 'name' => 'insight_quote_1', 'type' => 'text', 'default_value' => '"I should do this"' ),
			array( 'key' => 'insight_quote_2', 'label' => 'Bridge quote 2', 'name' => 'insight_quote_2', 'type' => 'text', 'default_value' => "\"I'm doing it\"" ),
			array( 'key' => 'insight_after',   'label' => 'Closing line', 'name' => 'insight_after', 'type' => 'text', 'default_value' => "That's where everything breaks." ),
			array( 'key' => 'insight_mascot',  'label' => 'Insight mascot image', 'name' => 'insight_mascot', 'type' => 'image', 'return_format' => 'array' ),

			/* ---------------- SHIFT ---------------- */
			array( 'key' => 'tab_shift', 'label' => 'Shift', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'shift_eyebrow', 'label' => 'Eyebrow', 'name' => 'shift_eyebrow', 'type' => 'text', 'default_value' => 'The shift' ),
			array( 'key' => 'shift_mascot',  'label' => 'Shift mascot image', 'name' => 'shift_mascot', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'shift_strike_1','label' => 'Strikethrough line 1', 'name' => 'shift_strike_1', 'type' => 'text', 'default_value' => "You don't need more motivation." ),
			array( 'key' => 'shift_strike_2','label' => 'Strikethrough line 2', 'name' => 'shift_strike_2', 'type' => 'text', 'default_value' => "You don't need another to-do list." ),
			array( 'key' => 'shift_lead',    'label' => 'Lead-in', 'name' => 'shift_lead', 'type' => 'text', 'default_value' => 'You need:' ),
			array( 'key' => 'shift_key',     'label' => 'Key phrase (big gradient)', 'name' => 'shift_key', 'type' => 'text', 'default_value' => 'A smaller starting line.' ),
			array( 'key' => 'shift_coda',    'label' => 'Coda paragraph (HTML allowed)', 'name' => 'shift_coda', 'type' => 'textarea', 'rows' => 2, 'default_value' => 'FOCO removes the hardest part &mdash; by giving you <strong>the first tiny step</strong>.' ),

			/* ---------------- HOW IT WORKS ---------------- */
			array( 'key' => 'tab_how', 'label' => 'How it works', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'how_eyebrow', 'label' => 'Eyebrow', 'name' => 'how_eyebrow', 'type' => 'text', 'default_value' => 'How it works' ),
			array( 'key' => 'how_h_1',     'label' => 'Headline line 1', 'name' => 'how_h_1', 'type' => 'text', 'default_value' => "You don't need a plan." ),
			array( 'key' => 'how_h_2',     'label' => 'Headline line 2 (gradient)', 'name' => 'how_h_2', 'type' => 'text', 'default_value' => 'Just a place to begin.' ),
			array(
				'key' => 'how_steps',
				'label' => 'Steps (3 recommended)',
				'name' => 'how_steps',
				'type' => 'repeater',
				'min' => 0,
				'max' => 6,
				'layout' => 'block',
				'button_label' => 'Add step',
				'sub_fields' => array(
					array( 'key' => 's_num',   'label' => 'Number',           'name' => 'num',   'type' => 'text' ),
					array( 'key' => 's_phone', 'label' => 'Phone screenshot', 'name' => 'phone', 'type' => 'image', 'return_format' => 'array' ),
					array( 'key' => 's_head',  'label' => 'Headline',         'name' => 'head',  'type' => 'text' ),
					array( 'key' => 's_body',  'label' => 'Description (HTML allowed)', 'name' => 'body', 'type' => 'textarea', 'rows' => 3 ),
					array( 'key' => 's_chips', 'label' => 'Task chips (one per line, optional)', 'name' => 'chips', 'type' => 'textarea', 'rows' => 3 ),
				),
			),

			/* ---------------- FEATURES (SPOTLIGHTS) ---------------- */
			array( 'key' => 'tab_features', 'label' => 'Features', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'features_eyebrow', 'label' => 'Eyebrow', 'name' => 'features_eyebrow', 'type' => 'text', 'default_value' => 'Why it finally works' ),
			array( 'key' => 'features_h_1',     'label' => 'Headline line 1', 'name' => 'features_h_1', 'type' => 'text', 'default_value' => 'Built for' ),
			array( 'key' => 'features_h_2',     'label' => 'Headline line 2 (gradient)', 'name' => 'features_h_2', 'type' => 'text', 'default_value' => 'how your brain works.' ),
			array( 'key' => 'features_sub',     'label' => 'Subhead', 'name' => 'features_sub', 'type' => 'textarea', 'rows' => 2, 'default_value' => 'Every part of FOCO is designed around task initiation &mdash; not productivity theater.' ),
			array(
				'key' => 'spotlights',
				'label' => 'Feature spotlights',
				'name' => 'spotlights',
				'type' => 'repeater',
				'min' => 0,
				'max' => 8,
				'layout' => 'block',
				'button_label' => 'Add spotlight',
				'sub_fields' => array(
					array( 'key' => 'sp_badge',   'label' => 'Badge text',    'name' => 'badge',   'type' => 'text' ),
					array( 'key' => 'sp_h_1',     'label' => 'Headline part 1', 'name' => 'h_1',   'type' => 'text' ),
					array( 'key' => 'sp_h_2',     'label' => 'Headline part 2 (gradient)', 'name' => 'h_2', 'type' => 'text' ),
					array( 'key' => 'sp_body',    'label' => 'Body (HTML allowed)', 'name' => 'body', 'type' => 'textarea', 'rows' => 3 ),
					array( 'key' => 'sp_cta',     'label' => 'CTA text',      'name' => 'cta',     'type' => 'text', 'default_value' => 'Try it free →' ),
					array( 'key' => 'sp_cta_url', 'label' => 'CTA link',      'name' => 'cta_url', 'type' => 'url', 'default_value' => '#' ),
					array( 'key' => 'sp_phone',   'label' => 'Phone screenshot', 'name' => 'phone', 'type' => 'image', 'return_format' => 'array' ),
				),
			),

			/* ---------------- SOCIAL PROOF ---------------- */
			array( 'key' => 'tab_proof', 'label' => 'Social proof', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'proof_eyebrow', 'label' => 'Eyebrow', 'name' => 'proof_eyebrow', 'type' => 'text', 'default_value' => 'Real results' ),
			array( 'key' => 'proof_h_1',     'label' => 'Headline line 1 (gradient)', 'name' => 'proof_h_1', 'type' => 'text', 'default_value' => '100,000+ people' ),
			array( 'key' => 'proof_h_2',     'label' => 'Headline line 2', 'name' => 'proof_h_2', 'type' => 'text', 'default_value' => 'are breaking task paralysis with FOCO.' ),
			array(
				'key' => 'testimonials',
				'label' => 'Testimonials',
				'name' => 'testimonials',
				'type' => 'repeater',
				'min' => 0,
				'max' => 16,
				'layout' => 'block',
				'button_label' => 'Add testimonial',
				'sub_fields' => array(
					array( 'key' => 't_photo',   'label' => 'Photo',         'name' => 'photo',   'type' => 'image', 'return_format' => 'array' ),
					array( 'key' => 't_name',    'label' => 'Name',          'name' => 'name',    'type' => 'text' ),
					array( 'key' => 't_country', 'label' => 'Country code (e.g. US)', 'name' => 'country', 'type' => 'text' ),
					array( 'key' => 't_loc',     'label' => 'Location',      'name' => 'loc',     'type' => 'text' ),
					array( 'key' => 't_quote',   'label' => 'Quote',         'name' => 'quote',   'type' => 'textarea', 'rows' => 3 ),
					array( 'key' => 't_role',    'label' => 'Role / sub-line', 'name' => 'role',  'type' => 'text' ),
				),
			),
			array( 'key' => 'big_stat_num',   'label' => 'Big stat number', 'name' => 'big_stat_num', 'type' => 'text', 'default_value' => '2,400,000+' ),
			array( 'key' => 'big_stat_label', 'label' => 'Big stat label (HTML allowed)', 'name' => 'big_stat_label', 'type' => 'text', 'default_value' => 'tasks finally <strong>started</strong> with FOCO' ),

			/* ---------------- MOMENTUM ---------------- */
			array( 'key' => 'tab_momentum', 'label' => 'Momentum', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'mo_eyebrow',  'label' => 'Eyebrow', 'name' => 'mo_eyebrow', 'type' => 'text', 'default_value' => 'This is how momentum starts' ),
			array( 'key' => 'mo_h_1',      'label' => 'Headline line 1', 'name' => 'mo_h_1', 'type' => 'text', 'default_value' => "You don't need to" ),
			array( 'key' => 'mo_h_2',      'label' => 'Headline line 2 (orange gradient)', 'name' => 'mo_h_2', 'type' => 'text', 'default_value' => 'fix your life.' ),
			array( 'key' => 'mo_stack_1',  'label' => 'Stack line 1', 'name' => 'mo_stack_1', 'type' => 'text', 'default_value' => "You don't need discipline." ),
			array( 'key' => 'mo_stack_2',  'label' => 'Stack line 2', 'name' => 'mo_stack_2', 'type' => 'text', 'default_value' => "You don't need a perfect system." ),
			array( 'key' => 'mo_punch_1',  'label' => 'Punch part 1', 'name' => 'mo_punch_1', 'type' => 'text', 'default_value' => '👉 You just need to' ),
			array( 'key' => 'mo_punch_2',  'label' => 'Punch part 2 (orange gradient)', 'name' => 'mo_punch_2', 'type' => 'text', 'default_value' => 'start once.' ),
			array( 'key' => 'mo_mascot',   'label' => 'Momentum mascot image', 'name' => 'mo_mascot', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'mo_subhead',  'label' => 'Subhead (HTML allowed)', 'name' => 'mo_subhead', 'type' => 'text', 'default_value' => 'Start your first task now. <strong style="color:#fff">Free. No credit card.</strong>' ),

			/* ---------------- PRICING ---------------- */
			array( 'key' => 'tab_pricing', 'label' => 'Pricing', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'pr_eyebrow',  'label' => 'Eyebrow', 'name' => 'pr_eyebrow', 'type' => 'text', 'default_value' => 'Pricing' ),
			array( 'key' => 'pr_risk',     'label' => 'Risk-reversal hook (HTML allowed)', 'name' => 'pr_risk', 'type' => 'text', 'default_value' => "💪 Try it. If it doesn't help you start &mdash; don't pay." ),
			array( 'key' => 'pr_h_1',      'label' => 'Headline part 1', 'name' => 'pr_h_1', 'type' => 'text', 'default_value' => 'Unlock' ),
			array( 'key' => 'pr_h_2',      'label' => 'Headline part 2 (gradient)', 'name' => 'pr_h_2', 'type' => 'text', 'default_value' => 'full focus.' ),
			array( 'key' => 'pr_sub',      'label' => 'Subhead', 'name' => 'pr_sub', 'type' => 'textarea', 'rows' => 2, 'default_value' => "FOCO helps you stay consistent. You'll know in your first session." ),
			array(
				'key' => 'pricing_tiers',
				'label' => 'Pricing tiers',
				'name' => 'pricing_tiers',
				'type' => 'repeater',
				'min' => 0,
				'max' => 4,
				'layout' => 'block',
				'button_label' => 'Add tier',
				'sub_fields' => array(
					array( 'key' => 'pt_featured',  'label' => 'Featured?', 'name' => 'featured', 'type' => 'true_false' ),
					array( 'key' => 'pt_name',      'label' => 'Tier name', 'name' => 'name', 'type' => 'text' ),
					array( 'key' => 'pt_pill',      'label' => "'Best value' pill (optional)", 'name' => 'pill', 'type' => 'text' ),
					array( 'key' => 'pt_save',      'label' => 'Save badge (e.g. Save 58%)', 'name' => 'save', 'type' => 'text' ),
					array( 'key' => 'pt_amount',    'label' => 'Amount', 'name' => 'amount', 'type' => 'text' ),
					array( 'key' => 'pt_period',    'label' => 'Period (e.g. /month)', 'name' => 'period', 'type' => 'text' ),
					array( 'key' => 'pt_equiv',     'label' => 'Equivalent line (HTML allowed)', 'name' => 'equiv', 'type' => 'text' ),
					array( 'key' => 'pt_tagline',   'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text' ),
					array(
						'key' => 'pt_benefits',
						'label' => 'Benefits',
						'name' => 'benefits',
						'type' => 'repeater',
						'min' => 0,
						'max' => 12,
						'layout' => 'table',
						'button_label' => 'Add benefit',
						'sub_fields' => array(
							array( 'key' => 'pt_benefit', 'label' => 'Benefit', 'name' => 'benefit', 'type' => 'text' ),
						),
					),
					array( 'key' => 'pt_cta',     'label' => 'CTA text',  'name' => 'cta', 'type' => 'text', 'default_value' => 'Start 7-day free trial' ),
					array( 'key' => 'pt_cta_url', 'label' => 'CTA link',  'name' => 'cta_url', 'type' => 'url', 'default_value' => '#' ),
				),
			),
			array( 'key' => 'pr_quote', 'label' => 'Coda quote pill (HTML allowed)', 'name' => 'pr_quote', 'type' => 'text', 'default_value' => 'Small steps. Real progress. <strong>Big results.</strong>' ),

			/* ---------------- FAQ ---------------- */
			array( 'key' => 'tab_faq', 'label' => 'FAQ', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'faq_eyebrow', 'label' => 'Eyebrow', 'name' => 'faq_eyebrow', 'type' => 'text', 'default_value' => 'FAQ' ),
			array( 'key' => 'faq_h_1',     'label' => 'Headline part 1', 'name' => 'faq_h_1', 'type' => 'text', 'default_value' => 'Quick' ),
			array( 'key' => 'faq_h_2',     'label' => 'Headline part 2 (gradient)', 'name' => 'faq_h_2', 'type' => 'text', 'default_value' => 'answers.' ),
			array( 'key' => 'faq_mascot',  'label' => 'FAQ corner mascot (decorative)', 'name' => 'faq_mascot', 'type' => 'image', 'return_format' => 'array' ),
			array(
				'key' => 'faq_items',
				'label' => 'FAQ items',
				'name' => 'faq_items',
				'type' => 'repeater',
				'min' => 0,
				'max' => 20,
				'layout' => 'block',
				'button_label' => 'Add question',
				'sub_fields' => array(
					array( 'key' => 'faq_q', 'label' => 'Question', 'name' => 'q', 'type' => 'text' ),
					array( 'key' => 'faq_a', 'label' => 'Answer (HTML allowed)', 'name' => 'a', 'type' => 'wysiwyg', 'tabs' => 'visual', 'toolbar' => 'basic', 'media_upload' => 0 ),
				),
			),

			/* ---------------- FINAL CTA ---------------- */
			array( 'key' => 'tab_finalcta', 'label' => 'Final CTA', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'fc_eyebrow', 'label' => 'Eyebrow', 'name' => 'fc_eyebrow', 'type' => 'text', 'default_value' => 'Final word' ),
			array( 'key' => 'fc_h_1',     'label' => "Headline 'You're'", 'name' => 'fc_h_1', 'type' => 'text', 'default_value' => "You're" ),
			array( 'key' => 'fc_h_2',     'label' => 'Headline (gradient — e.g. not stuck.)', 'name' => 'fc_h_2', 'type' => 'text', 'default_value' => 'not stuck.' ),
			array( 'key' => 'fc_h_3',     'label' => 'Second-line headline', 'name' => 'fc_h_3', 'type' => 'text', 'default_value' => "You just don't have a starting point." ),
			array( 'key' => 'fc_punch',   'label' => 'Punch line below', 'name' => 'fc_punch', 'type' => 'text', 'default_value' => 'FOCO gives you one.' ),

			/* ---------------- FOOTER ---------------- */
			array( 'key' => 'tab_footer', 'label' => 'Footer', 'name' => '', 'type' => 'tab' ),
			array( 'key' => 'footer_tagline', 'label' => 'Footer tagline', 'name' => 'footer_tagline', 'type' => 'textarea', 'rows' => 2, 'default_value' => 'The ADHD focus companion that helps you begin &mdash; one small step at a time.' ),
			array(
				'key' => 'footer_cols',
				'label' => 'Footer link columns',
				'name' => 'footer_cols',
				'type' => 'repeater',
				'min' => 0,
				'max' => 6,
				'layout' => 'block',
				'button_label' => 'Add column',
				'sub_fields' => array(
					array( 'key' => 'fc_heading', 'label' => 'Column heading', 'name' => 'heading', 'type' => 'text' ),
					array(
						'key' => 'fc_links',
						'label' => 'Links',
						'name' => 'links',
						'type' => 'repeater',
						'min' => 0,
						'layout' => 'table',
						'button_label' => 'Add link',
						'sub_fields' => array(
							array( 'key' => 'fl_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text' ),
							array( 'key' => 'fl_url',   'label' => 'URL',   'name' => 'url',   'type' => 'url', 'default_value' => '#' ),
						),
					),
				),
			),
			array( 'key' => 'footer_copy', 'label' => 'Copyright line', 'name' => 'footer_copy', 'type' => 'text', 'default_value' => '© 2026 FOCO. Built for ADHD minds.' ),
			array( 'key' => 'footer_made', 'label' => 'Right-side footer line', 'name' => 'footer_made', 'type' => 'text', 'default_value' => 'Made with care 💜' ),
		),
	) );
}

/* ============================================================
   APPLE / GOOGLE STORE BADGES — small SVG components reused 3+
   times on the page. Keep in PHP so we don't repeat markup.
   ============================================================ */

function foco_apple_badge_svg() {
	return '<svg class="store-icon" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>';
}

function foco_google_play_svg() {
	return '<svg class="store-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 2.5v19l15-9.5z" fill="url(#gp-grad)"/></svg>';
}

function foco_store_buttons() {
	// Until ACF app_store_url / google_play_url are filled in, store badges
	// fall back to the /get-foco/ waitlist so clicks don't hit a dead anchor.
	$waitlist = home_url( '/get-foco/' );
	$apple    = foco_url( 'app_store_url', $waitlist );
	$google   = foco_url( 'google_play_url', $waitlist );
	ob_start(); ?>
	<a href="<?php echo $apple; ?>" class="store-badge" aria-label="Download on the App Store">
		<?php echo foco_apple_badge_svg(); ?>
		<span class="text"><span class="small">Download on the</span><span class="big">App Store</span></span>
	</a>
	<a href="<?php echo $google; ?>" class="store-badge" aria-label="Get it on Google Play">
		<?php echo foco_google_play_svg(); ?>
		<span class="text"><span class="small">GET IT ON</span><span class="big">Google Play</span></span>
	</a>
	<?php
	return ob_get_clean();
}

/* ============================================================
   Allow extra HTML in nav menu titles (so users can put icons in)
   ============================================================ */

function foco_allowed_nav_html( $allowed_tags ) {
	$allowed_tags['span']['class'] = true;
	$allowed_tags['strong'] = array();
	$allowed_tags['em'] = array();
	return $allowed_tags;
}
add_filter( 'wp_nav_menu_args', function ( $args ) {
	$args['fallback_cb'] = '__return_empty_string';
	return $args;
} );
