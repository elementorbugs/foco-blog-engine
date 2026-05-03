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
			<?php while ( have_posts() ) : the_post(); ?>
				<a class="post-card<?php echo has_post_thumbnail() ? ' has-thumb' : ''; ?>" href="<?php the_permalink(); ?>">
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="post-card-thumb">
							<?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy', 'alt' => esc_attr( get_the_title() ) ) ); ?>
						</div>
					<?php endif; ?>
					<div class="post-card-body">
						<div class="post-date"><?php echo esc_html( get_the_date() ); ?></div>
						<h2><?php the_title(); ?></h2>
						<div class="excerpt"><?php the_excerpt(); ?></div>
						<span class="read-more">Read more →</span>
					</div>
				</a>
			<?php endwhile; ?>
			<div style="margin-top:40px"><?php the_posts_pagination(); ?></div>
		<?php else : ?>
			<p style="color:var(--muted)">No posts found.</p>
		<?php endif; ?>
	</div>
</div>

<?php get_footer(); ?>
