<?php
/**
 * Single blog post template — uses the FOCO dark style for blog content.
 *
 * @package FOCO
 */
get_header();

while ( have_posts() ) : the_post(); ?>

<div class="blog-single">
	<div class="wrap">
		<h1><?php the_title(); ?></h1>
		<div class="post-meta">
			<span><?php echo esc_html( get_the_date() ); ?></span>
			<span>·</span>
			<span><?php echo esc_html( get_the_author() ); ?></span>
			<?php if ( has_category() ) : ?>
				<span>·</span>
				<span><?php the_category( ', ' ); ?></span>
			<?php endif; ?>
		</div>

		<article>
			<?php the_content(); ?>
		</article>

		<?php if ( comments_open() || get_comments_number() ) : ?>
			<div style="margin-top:48px"><?php comments_template(); ?></div>
		<?php endif; ?>

		<div style="margin-top:60px;display:flex;justify-content:space-between">
			<?php previous_post_link( '<span style="color:var(--primary-2)">← %link</span>' ); ?>
			<?php next_post_link(     '<span style="color:var(--primary-2)">%link →</span>' ); ?>
		</div>
	</div>
</div>

<?php endwhile;
get_footer();
