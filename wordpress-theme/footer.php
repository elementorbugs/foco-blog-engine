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
							echo '<span class="logo-mark"></span><span>' . esc_html( get_bloginfo( 'name' ) ) . '</span>';
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
					// Fallback hard-coded columns when no ACF data is configured.
					// Matches the IA built out via the SEO sprint:
					//   Product / Resources / Company / Connect.
					$home = home_url( '/' );
					?>
					<div class="foot-col">
						<h4>Product</h4>
						<ul>
							<li><a href="<?php echo esc_url( $home . 'features/' ); ?>">Features</a></li>
							<li><a href="<?php echo esc_url( $home . 'pricing/' ); ?>">Pricing</a></li>
							<li><a href="<?php echo esc_url( $home . 'get-foco/' ); ?>">Get FOCO</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Resources</h4>
						<ul>
							<li><a href="<?php echo esc_url( $home . 'adhd-resources/' ); ?>">ADHD Resources</a></li>
							<li><a href="<?php echo esc_url( $home . 'adhd-tools/' ); ?>">Free Tools</a></li>
							<li><a href="<?php echo esc_url( $home . 'best-adhd-app/' ); ?>">Best ADHD Apps</a></li>
							<li><a href="<?php echo esc_url( get_post_type_archive_link( 'post' ) ?: $home . 'blog/' ); ?>">Blog</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Company</h4>
						<ul>
							<li><a href="<?php echo esc_url( $home . 'about/' ); ?>">About</a></li>
							<li><a href="<?php echo esc_url( $home . 'founders/' ); ?>">Founders</a></li>
							<li><a href="<?php echo esc_url( $home . 'contact/' ); ?>">Contact</a></li>
							<li><a href="<?php echo esc_url( $home . 'editorial-policy/' ); ?>">Editorial Policy</a></li>
						</ul>
					</div>
					<div class="foot-col">
						<h4>Connect</h4>
						<ul>
							<li><a href="https://www.instagram.com/foco.adhd/" target="_blank" rel="noopener">Instagram</a></li>
							<li><a href="https://www.tiktok.com/@foco.adhd" target="_blank" rel="noopener">TikTok</a></li>
							<li><a href="https://www.youtube.com/@FOCO-ADHDCOMPANION" target="_blank" rel="noopener">YouTube</a></li>
						</ul>
					</div>
					<?php
				endif;
				?>
			</div>
			<div class="foot-bottom">
				<span><?php echo wp_kses_post( foco_field( 'footer_copy', '© ' . date( 'Y' ) . ' FOCO. Built for ADHD minds.' ) ); ?></span>
				<span class="foot-legal">
					<a href="<?php echo esc_url( home_url( '/privacy-policy/' ) ); ?>">Privacy</a>
					<span style="opacity:0.4;margin:0 8px">·</span>
					<a href="<?php echo esc_url( home_url( '/term-and-use/' ) ); ?>">Terms</a>
				</span>
				<span><?php echo wp_kses_post( foco_field( 'footer_made', 'Made with care 💜' ) ); ?></span>
			</div>
		</div>
	</footer>

</div><!-- /.foco-app -->

<?php wp_footer(); ?>
</body>
</html>
