<?php
/**
 * Default index — used by Posts page (Settings → Reading) and as fallback.
 * Renders the blog list with featured-image thumbnails on the left.
 *
 * @package FOCO
 */
get_header(); ?>

<div class="blog-archive">
	<div class="wrap">
		<h1><?php is_home() ? esc_html_e( 'From the FOCO blog', 'foco' ) : single_post_title(); ?></h1>

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
			<p style="color:var(--muted)">No posts yet. Check back soon.</p>
		<?php endif; ?>
	</div>
</div>

<?php get_footer(); ?>
