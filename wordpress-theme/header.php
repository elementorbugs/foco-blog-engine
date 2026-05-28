<?php
/**
 * The header for the FOCO theme.
 *
 * @package FOCO
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#040208">
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
				'menu_id'        => 'foco-primary-menu',
				'fallback_cb'    => 'foco_default_menu',
				'depth'          => 2,
			) );
			?>

			<a href="<?php echo esc_url( home_url( '/#cta-final' ) ); ?>" class="btn btn-primary nav-cta">Get the app</a>

			<button class="nav-toggle" id="foco-nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="foco-primary-menu">
				<span></span><span></span><span></span>
			</button>
		</div>
	</nav>

	<!-- Mobile menu styles + dropdown styles + toggle -->
	<style>
	.foco-app .nav-toggle{display:none;width:42px;height:42px;border-radius:10px;background:var(--card);border:1px solid var(--stroke);flex-direction:column;justify-content:center;align-items:center;gap:5px;padding:0;cursor:pointer;flex-shrink:0;transition:background .2s,border-color .2s;}
	.foco-app .nav-toggle:hover{background:var(--card-hover);border-color:var(--stroke-strong);}
	.foco-app .nav-toggle span{display:block;width:18px;height:2px;background:var(--text);border-radius:2px;transition:transform .25s ease,opacity .2s ease;}
	.foco-app .nav-toggle.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
	.foco-app .nav-toggle.open span:nth-child(2){opacity:0;}
	.foco-app .nav-toggle.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}

	/* ============ DROPDOWN MENU (desktop hover) ============ */
	@media (min-width:901px){
		.foco-app .nav-links > .menu-item-has-children{position:relative;}
		.foco-app .nav-links > .menu-item-has-children > a::after{content:'▾';margin-left:6px;font-size:11px;opacity:0.65;transition:transform .2s ease,opacity .2s ease;display:inline-block;}
		.foco-app .nav-links > .menu-item-has-children:hover > a::after,
		.foco-app .nav-links > .menu-item-has-children:focus-within > a::after{transform:rotate(180deg);opacity:1;}
		.foco-app .nav-links .sub-menu{position:absolute;top:calc(100% + 6px);left:-16px;min-width:240px;margin:0;padding:8px 0;list-style:none;background:rgba(10,4,16,0.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(167,139,250,0.25);border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,0.55),0 4px 12px rgba(124,58,237,0.15);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease;z-index:1000;}
		.foco-app .nav-links > .menu-item-has-children:hover > .sub-menu,
		.foco-app .nav-links > .menu-item-has-children:focus-within > .sub-menu{opacity:1;visibility:visible;transform:translateY(0);}
		.foco-app .nav-links .sub-menu::before{content:'';position:absolute;top:-6px;left:0;right:0;height:6px;}
		.foco-app .nav-links .sub-menu li{list-style:none;margin:0;}
		.foco-app .nav-links .sub-menu a{display:block;padding:11px 20px;font-size:14px;font-weight:500;color:var(--text);text-decoration:none;white-space:nowrap;transition:background .15s ease,color .15s ease,padding-left .15s ease;border-radius:0;}
		.foco-app .nav-links .sub-menu a:hover{background:rgba(124,58,237,0.18);color:var(--primary-2);padding-left:24px;}
	}

	@media (max-width:900px){
		.foco-app .nav-inner{gap:10px;}
		.foco-app .nav-toggle{display:inline-flex;}
		.foco-app .nav-cta{padding:9px 16px;font-size:13px;white-space:nowrap;flex-shrink:0;}
		.foco-app .logo{font-size:16px;min-width:0;}
		.foco-app .logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
		.foco-app .nav-links{display:none !important;position:fixed;top:68px;left:0;right:0;bottom:0;flex-direction:column;gap:0;padding:8px 24px 32px;background:rgba(4,2,8,0.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--stroke);z-index:99;list-style:none;margin:0;overflow-y:auto;}
		.foco-app .nav-links.open{display:flex !important;}
		.foco-app .nav-links > li{list-style:none;border-bottom:1px solid rgba(255,255,255,0.06);}
		.foco-app .nav-links > li:last-child{border-bottom:0;}
		.foco-app .nav-links > li > a{display:block;padding:16px 0;font-size:16px;color:var(--text);font-weight:500;}
		.foco-app .nav-links > li > a:hover{color:var(--primary-2);}
		.foco-app .nav-links .menu-item-has-children > a::after{content:'▾';margin-left:8px;opacity:0.5;font-size:12px;}
		.foco-app .nav-links .sub-menu{display:block;list-style:none;padding:0 0 12px 16px;margin:0;border-top:1px solid rgba(255,255,255,0.04);}
		.foco-app .nav-links .sub-menu li{list-style:none;border-bottom:0;}
		.foco-app .nav-links .sub-menu a{display:block;padding:11px 0;font-size:14px;color:var(--muted);font-weight:400;}
		.foco-app .nav-links .sub-menu a:hover{color:var(--primary-2);}
	}
	@media (max-width:480px){
		.foco-app .nav-cta{padding:8px 14px;font-size:12px;}
		.foco-app .logo img{max-height:28px;}
	}
	@media (max-width:380px){
		.foco-app .nav-cta{display:none;}
	}
	</style>
	<script>
	(function(){
		var btn = document.getElementById('foco-nav-toggle');
		var menu = document.getElementById('foco-primary-menu');
		if(!btn || !menu) return;
		function close(){ btn.classList.remove('open'); menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
		btn.addEventListener('click', function(){
			var open = btn.classList.toggle('open');
			menu.classList.toggle('open', open);
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			document.body.style.overflow = open ? 'hidden' : '';
		});
		menu.addEventListener('click', function(e){
			// Close menu on any leaf link click (but not on parent items with sub-menus on desktop hover)
			if(e.target.tagName === 'A') close();
		});
		document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
	})();
	</script>
<?php

/**
 * Default nav fallback if no menu has been assigned to the "primary" location.
 *
 * Once you've created a Primary Menu in wp-admin → Appearance → Menus and
 * assigned it to the "primary" location, this fallback is ignored.
 * It exists so the theme looks reasonable on a fresh install.
 */
if ( ! function_exists( 'foco_default_menu' ) ) :
function foco_default_menu() {
	$home = esc_url( home_url( '/' ) );
	echo '<ul id="foco-primary-menu" class="nav-links">';
	echo '<li><a href="' . $home . '#features">Features</a></li>';
	echo '<li><a href="' . $home . '#how">How it works</a></li>';
	echo '<li><a href="' . $home . '#why-adhd">Why ADHD</a></li>';
	echo '<li><a href="' . $home . '#pricing">Pricing</a></li>';
	echo '<li><a href="' . $home . 'blog/">Blog</a></li>';
	echo '</ul>';
}
endif;
