<?php
/**
 * Blog archive (category, tag, date archives, default blog list).
 * Same dark style as the rest of FOCO. Now includes featured-image
 * thumbnails on the left of each post card.
 *
 * @package FOCO
 */
get_header(); ?>

<div class="blog-archive">
	<div class="wrap">
		<h1>
			<?php
			if ( is_category() ) {
				printf( esc_html__( 'Category: %s', 'foco' ), '<span class="accent">' . esc_html( single_cat_title( '', false ) ) . '</span>' );
			} elseif ( is_tag() ) {
				printf( esc_html__( 'Tag: %s', 'foco' ), '<span class="accent">' . esc_html( single_tag_title( '', false ) ) . '</span>' );
			} elseif ( is_author() ) {
				printf( esc_html__( 'Author: %s', 'foco' ), '<span class="accent">' . esc_html( get_the_author() ) . '</span>' );
			} elseif ( is_date() ) {
				echo esc_html( get_the_archive_title() );
			} else {
				esc_html_e( 'From the FOCO blog', 'foco' );
			}
			?>
		</h1>

		<?php if ( have_posts() ) : ?>
			<div class="post-grid">
			<?php while ( have_posts() ) : the_post(); ?>
				<?php $foco_cats = get_the_category(); ?>
				<a class="post-card<?php echo has_post_thumbnail() ? ' has-thumb' : ''; ?>" href="<?php the_permalink(); ?>">
					<div class="post-card-thumb">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy', 'alt' => esc_attr( get_the_title() ) ) ); ?>
						<?php else : ?>
							<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/topics/understanding-adhd.jpg' ); ?>" alt="" loading="lazy" />
						<?php endif; ?>
					</div>
					<?php if ( ! empty( $foco_cats ) ) : ?>
						<div class="eyebrow"><?php echo esc_html( $foco_cats[0]->name ); ?></div>
					<?php endif; ?>
					<h2><?php the_title(); ?></h2>
					<div class="excerpt"><?php the_excerpt(); ?></div>
					<div class="post-card-meta">FOCO &nbsp;&bull;&nbsp; <?php echo esc_html( get_the_date() ); ?></div>
				</a>
			<?php endwhile; ?>
			</div>
			<div style="margin-top:40px"><?php the_posts_pagination(); ?></div>
		<?php else : ?>
			<p style="color:var(--muted)">No posts found.</p>
		<?php endif; ?>
	</div>
</div>

<?php get_footer(); ?>
