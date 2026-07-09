<?php
/**
 * The footer for the FOCO theme.
 * Renders the dark FOCO footer with editable columns from ACF, then
 * closes the .foco-app wrapper and outputs wp_footer().
 *
 * @package FOCO
 */
?>

	<!-- ================ FOOTER ================ -->
	<footer>
		<div class="wrap">
			<div class="foot-grid">
				<div class="foot-brand">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="logo" rel="home">
						<?php
						if ( has_custom_logo() ) {
							the_custom_logo();
						} else {
							printf(
								'<img class="logo-mark" src="%s" alt="" width="36" height="36" decoding="async" /><span>%s</span>',
								esc_url( get_template_directory_uri() . '/assets/images/foco-logo-mark.png' ),
								esc_html( get_bloginfo( 'name' ) )
							);
						}
						?>
					</a>
					<p><?php echo wp_kses_post( foco_field( 'footer_tagline', 'The ADHD focus companion that helps you begin — one small step at a time.' ) ); ?></p>
				</div>

				<?php
				$cols = function_exists( 'have_rows' ) && have_rows( 'footer_cols' );
				if ( $cols ) :
					while ( have_rows( 'footer_cols' ) ) : the_row();
						$heading = get_sub_field( 'heading' );
						?>
						<div class="foot-col">
							<h4><?php echo esc_html( $heading ); ?></h4>
							<ul>
								<?php if ( have_rows( 'links' ) ) : while ( have_rows( 'links' ) ) : the_row(); ?>
									<li><a href="<?php echo esc_url( get_sub_field( 'url' ) ?: '#' ); ?>"><?php echo esc_html( get_sub_field( 'label' ) ); ?></a></li>
								<?php endwhile; endif; ?>
							</ul>
						</div>
						<?php
					endwhile;
				else :
					// Fallback hard-coded columns when no ACF data
					?>
					<div class="foot-col">
						<h4>Product</h4>
						<ul>
							<li><a href="#features">Features</a></li>
							<li><a href="#how">How it works</a></li>
							<li><a href="#pricing">Pricing</a></li>
							<li><a href="#">Download</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Company</h4>
						<ul>
							<li><a href="#">About</a></li>
							<li><a href="<?php echo esc_url( get_post_type_archive_link( 'post' ) ); ?>">Blog</a></li>
							<li><a href="#">Contact</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Resources</h4>
						<ul>
							<li><a href="#why-adhd">Why ADHD</a></li>
							<li><a href="#">ADHD Guide</a></li>
							<li><a href="#">Support</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Legal</h4>
						<ul>
							<li><a href="#">Privacy</a></li>
							<li><a href="#">Terms</a></li>
						</ul>
					</div>
					<?php
				endif;
				?>
			</div>
			<div class="foot-bottom">
				<span><?php echo wp_kses_post( foco_field( 'footer_copy', '© ' . date( 'Y' ) . ' FOCO. Built for ADHD minds.' ) ); ?></span>
				<span><?php echo wp_kses_post( foco_field( 'footer_made', 'Made with care 💜' ) ); ?></span>
			</div>
		</div>
	</footer>

</div><!-- /.foco-app -->

<?php wp_footer(); ?>
</body>
</html>
