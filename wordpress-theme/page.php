<?php
/**
 * Generic page template — for pages that aren't the front page.
 * Useful for Privacy, Terms, About, etc.
 *
 * @package FOCO
 */
get_header();

while ( have_posts() ) : the_post(); ?>

<div class="blog-single">
	<div class="wrap">
		<h1><?php the_title(); ?></h1>
		<article>
			<?php the_content(); ?>
		</article>
	</div>
</div>

<?php endwhile;
get_footer();
