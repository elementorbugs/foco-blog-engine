<?php
/**
 * The header for the FOCO theme.
 * Outputs: <head>, opening <body>, .foco-app wrapper, fixed nav with
 * the_custom_logo + wp_nav_menu, and the shared SVG defs (Google Play
 * gradient) used by store badges later in the page.
 *
 * @package FOCO
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="profile" href="https://gmpg.org/xfn/11">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="foco-app">

	<!-- Shared SVG gradient defs used by Google Play store badges -->
	<svg width="0" height="0" style="position:absolute" aria-hidden="true">
		<defs>
			<linearGradient id="gp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#00E3FF"/>
				<stop offset="33%" stop-color="#00F076"/>
				<stop offset="66%" stop-color="#FFE000"/>
				<stop offset="100%" stop-color="#FF3A44"/>
			</linearGradient>
		</defs>
	</svg>

	<!-- ================ NAV ================ -->
	<nav class="foco-nav" id="foco-nav">
		<div class="wrap nav-inner">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="logo" rel="home">
				<?php
				if ( has_custom_logo() ) {
					the_custom_logo();
				} else {
					echo '<span class="logo-mark"></span><span>' . esc_html( get_bloginfo( 'name' ) ) . '</span>';
				}
				?>
			</a>

			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'nav-links',
				'fallback_cb'    => 'foco_default_menu',
				'depth'          => 1,
			) );
			?>

			<a href="#cta-final" class="btn btn-primary">Get the app</a>
		</div>
	</nav>
<?php

/**
 * Default nav fallback if no menu has been assigned to the "primary" location.
 * Lets the theme look right out of the box; user can override via Appearance → Menus.
 */
function foco_default_menu() {
	echo '<ul class="nav-links">';
	echo '<li><a href="#features">Features</a></li>';
	echo '<li><a href="#how">How it works</a></li>';
	echo '<li><a href="#why-adhd">Why ADHD</a></li>';
	echo '<li><a href="#pricing">Pricing</a></li>';
	echo '</ul>';
}
