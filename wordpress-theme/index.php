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

		<?php
		/* ---- Browse by topic: category index (blog home, page 1 only) ---- */
		if ( is_home() && ! is_paged() ) :
			$foco_topics = array(
				array( 'understanding-adhd',      'Understanding ADHD' ),
				array( 'focus-productivity',      'Focus & Productivity' ),
				array( 'app-reviews-comparisons', 'App Reviews & Comparisons' ),
				array( 'adhd-planners-printables', 'Planners & Printables' ),
				array( 'focus-music-audio',       'Focus Music & Audio' ),
				array( 'focus-timers',            'Focus Timers' ),
			);
		?>
		<nav class="topic-tiles" aria-label="Browse the blog by topic">
			<h2 class="topic-tiles-title">Browse by topic</h2>
			<div class="topic-photo-grid">
				<?php foreach ( $foco_topics as $t ) :
					$term = get_term_by( 'slug', $t[0], 'category' );
					if ( ! $term || is_wp_error( $term ) || $term->count < 1 ) {
						continue;
					}
					$url = get_term_link( $term );
					if ( is_wp_error( $url ) ) {
						continue;
					}
					$img = get_template_directory_uri() . '/assets/topics/' . $t[0] . '.jpg';
				?>
					<a class="topic-tile" href="<?php echo esc_url( $url ); ?>">
						<img class="topic-tile-img" src="<?php echo esc_url( $img ); ?>" alt="" loading="lazy" width="800" height="600" />
						<span class="topic-tile-body">
							<span class="topic-tile-name"><?php echo esc_html( $t[1] ); ?></span>
							<span class="topic-tile-count"><?php echo (int) $term->count; ?></span>
						</span>
					</a>
				<?php endforeach; ?>
			</div>
		</nav>
		<?php endif; ?>

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
