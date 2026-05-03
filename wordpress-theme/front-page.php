<?php
/**
 * Front page template for FOCO theme.
 *
 * Reads every section from ACF if available; falls back to the design's
 * default copy if ACF is not installed or fields are empty.
 *
 * Edit content: WP Admin → Pages → Edit your front page → scroll to the
 * "FOCO Landing Page" field group (with tabs for each section).
 *
 * @package FOCO
 */

get_header();

// Theme directory URI shortcut for fallback images.
$tdir = get_template_directory_uri();
?>

<!-- ================ HERO ================ -->
<header class="hero">
	<div class="wrap hero-inner">
		<div class="hero-copy">
			<span class="eyebrow"><span class="dot"></span> <?php echo esc_html( foco_field( 'hero_eyebrow', 'ADHD Focus Companion' ) ); ?></span>
			<h1 class="hero-h">
				<?php echo wp_kses_post( foco_field( 'hero_headline_1', "You don't finish tasks." ) ); ?><br>
				<span class="grad"><?php echo wp_kses_post( foco_field( 'hero_headline_2', 'You never start them.' ) ); ?></span>
			</h1>
			<p class="hero-sub"><?php echo wp_kses_post( foco_field( 'hero_subhead', 'FOCO is your ADHD focus companion. It turns any task into one tiny step you can actually begin.' ) ); ?></p>

			<div class="hero-microcta">
				<span class="arrow">👉</span>
				<?php echo wp_kses_post( foco_field( 'hero_microcta', '<strong>Free</strong> · No credit card · 60-second start' ) ); ?>
			</div>

			<div class="hero-cta">
				<div class="store-badges"><?php echo foco_store_buttons(); ?></div>
			</div>

			<div class="trust-row">
				<span class="stars">★★★★★</span>
				<span><?php echo wp_kses_post( foco_field( 'hero_trust', 'Trusted by <strong style="color:#fff">100,000+</strong> ADHD minds' ) ); ?></span>
			</div>
		</div>

		<div class="hero-visual">
			<div class="hero-orb"></div>
			<div class="sparkles">
				<span class="sparkle"></span><span class="sparkle"></span><span class="sparkle"></span>
				<span class="sparkle"></span><span class="sparkle"></span>
			</div>
			<img class="hero-mascot"
				src="<?php echo foco_image( 'hero_mascot', 'large', $tdir . '/assets/images/foco_state_1_presence.png' ); ?>"
				alt="FOCO mascot">
		</div>
	</div>
</header>

<!-- ================ PROBLEM ================ -->
<section id="problem">
	<div class="wrap">
		<div class="problem-intro">
			<div class="section-eyebrow"><?php echo esc_html( foco_field( 'problem_eyebrow', 'The real problem' ) ); ?></div>
			<h2>
				<?php echo wp_kses_post( foco_field( 'problem_h_1', 'You have something to do.' ) ); ?><br>
				<span class="grad"><?php echo wp_kses_post( foco_field( 'problem_h_2', "But you don't start." ) ); ?></span>
			</h2>
			<div class="layered">
				<span class="fade"><?php echo esc_html( foco_field( 'problem_layered_1', 'You sit down.' ) ); ?></span>
				<span class="fade"><?php echo esc_html( foco_field( 'problem_layered_2', 'You open your laptop.' ) ); ?></span>
				<span class="climax"><?php echo wp_kses_post( foco_field( 'problem_climax', 'And then&hellip; nothing.' ) ); ?></span>
			</div>

			<div class="problem-image">
				<img src="<?php echo foco_image( 'problem_image', 'large', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80' ); ?>"
					alt="A person paralyzed in front of their computer"
					loading="lazy">
				<img class="companion-mascot"
					src="<?php echo foco_image( 'companion_mascot', 'medium', $tdir . '/assets/images/foco_state_6_pause.png' ); ?>"
					alt=""
					aria-hidden="true">
				<div class="problem-image-caption"><?php echo wp_kses_post( foco_field( 'problem_caption', 'FOCO stays with you. <br>Until you can begin.' ) ); ?></div>
			</div>

			<div class="problem-resolution">
				<p class="rejected"><?php echo wp_kses_post( foco_field( 'reject_1', "Not because you're <span class=\"strike\">lazy</span>." ) ); ?></p>
				<p class="rejected"><?php echo wp_kses_post( foco_field( 'reject_2', "Not because you <span class=\"strike\">don't care</span>." ) ); ?></p>
				<p class="truth"><?php echo wp_kses_post( foco_field( 'truth_line', "Because your brain doesn't know <span class=\"grad\">where to begin.</span>" ) ); ?></p>
			</div>
		</div>

		<div class="problem-vignettes">
			<?php
			if ( function_exists( 'have_rows' ) && have_rows( 'vignettes' ) ) :
				while ( have_rows( 'vignettes' ) ) : the_row(); ?>
					<div class="vignette" data-num="<?php echo esc_attr( get_sub_field( 'num' ) ); ?>">
						<h3 class="vignette-headline"><?php echo esc_html( get_sub_field( 'head' ) ); ?></h3>
						<p class="vignette-text"><?php echo wp_kses_post( get_sub_field( 'body' ) ); ?></p>
					</div>
				<?php endwhile;
			else :
				// Default 4 vignettes when ACF empty
				$default_vignettes = array(
					array( '01', '20 minutes.',     '<strong>You sit there.</strong> Staring at the screen. Thinking. <strong>Not starting.</strong>' ),
					array( '02', 'Anything else.',  '<strong>You switch tasks.</strong> Anything else suddenly <strong>feels easier</strong> than the thing you should do.' ),
					array( '03', 'An hour gone.',   '<strong>"Just a second"</strong> on your phone. You look up — and the morning is gone.' ),
					array( '04', 'Later.',          '<strong>Tomorrow.</strong> Next week. And eventually — <strong>never.</strong>' ),
				);
				foreach ( $default_vignettes as $v ) : ?>
					<div class="vignette" data-num="<?php echo esc_attr( $v[0] ); ?>">
						<h3 class="vignette-headline"><?php echo esc_html( $v[1] ); ?></h3>
						<p class="vignette-text"><?php echo wp_kses_post( $v[2] ); ?></p>
					</div>
				<?php endforeach;
			endif;
			?>
		</div>
	</div>
</section>

<!-- ================ SECTION BRIDGE ================ -->
<div class="section-bridge" aria-hidden="true">
	<span class="bridge-orb"></span>
	<p class="bridge-text"><?php echo wp_kses_post( foco_field( 'bridge_text', "You're not broken. <strong>There's a name for this.</strong>" ) ); ?></p>
</div>

<!-- ================ INSIGHT ================ -->
<section id="why-adhd" class="insight">
	<div class="wrap insight-inner">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'insight_eyebrow', 'This is not a willpower problem' ) ); ?></div>
		<h2>
			<?php echo esc_html( foco_field( 'insight_h_1', 'It has' ) ); ?>
			<span class="grad"><?php echo esc_html( foco_field( 'insight_h_2', 'a name.' ) ); ?></span>
		</h2>
		<div class="tid-box">
			<div class="label"><?php echo esc_html( foco_field( 'insight_label', "It's called" ) ); ?></div>
			<div class="name"><?php echo esc_html( foco_field( 'insight_name', 'Task Initiation Deficit' ) ); ?></div>
		</div>
		<p style="margin-top:40px; font-size:19px"><?php echo wp_kses_post( foco_field( 'insight_p1', "ADHD brains don't struggle with doing.<br><strong style=\"color:#fff; font-size:22px\">They struggle with starting.</strong>" ) ); ?></p>
		<div class="bridge">
			That invisible moment between<br>
			<span class="arrow-quote"><?php echo esc_html( foco_field( 'insight_quote_1', '"I should do this"' ) ); ?></span>
			<span style="color:#A78BFA;font-size:22px;margin:0 8px;vertical-align:middle">→</span>
			<span class="arrow-quote"><?php echo esc_html( foco_field( 'insight_quote_2', '"I\'m doing it"' ) ); ?></span>
			<p style="margin-top:24px"><?php echo esc_html( foco_field( 'insight_after', "That's where everything breaks." ) ); ?></p>
		</div>
		<img class="insight-mascot"
			src="<?php echo foco_image( 'insight_mascot', 'large', $tdir . '/assets/images/foco_state_6_pause.png' ); ?>"
			alt="">
	</div>
</section>

<!-- ================ SHIFT ================ -->
<section class="shift">
	<div class="wrap">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'shift_eyebrow', 'The shift' ) ); ?></div>
		<img class="shift-mascot"
			src="<?php echo foco_image( 'shift_mascot', 'large', $tdir . '/assets/images/foco_state_2_alignment.png' ); ?>"
			alt="">
		<div class="shift-stack">
			<span class="strike"><?php echo esc_html( foco_field( 'shift_strike_1', "You don't need more motivation." ) ); ?></span>
			<span class="strike"><?php echo esc_html( foco_field( 'shift_strike_2', "You don't need another to-do list." ) ); ?></span>
			<span style="margin-top:16px;display:block"><?php echo esc_html( foco_field( 'shift_lead', 'You need:' ) ); ?></span>
			<span class="shift-key"><?php echo esc_html( foco_field( 'shift_key', 'A smaller starting line.' ) ); ?></span>
		</div>
		<p class="shift-coda"><?php echo wp_kses_post( foco_field( 'shift_coda', 'FOCO removes the hardest part — by giving you <strong>the first tiny step</strong>.' ) ); ?></p>
	</div>
</section>

<!-- ================ HOW IT WORKS ================ -->
<section id="how">
	<div class="wrap" style="text-align:center">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'how_eyebrow', 'How it works' ) ); ?></div>
		<h2>
			<?php echo esc_html( foco_field( 'how_h_1', "You don't need a plan." ) ); ?><br>
			<span class="grad"><?php echo esc_html( foco_field( 'how_h_2', 'Just a place to begin.' ) ); ?></span>
		</h2>
		<div class="how-steps" style="margin-top:56px">
			<?php
			if ( function_exists( 'have_rows' ) && have_rows( 'how_steps' ) ) :
				while ( have_rows( 'how_steps' ) ) : the_row();
					$chips_raw = get_sub_field( 'chips' );
					$chips = $chips_raw ? array_filter( array_map( 'trim', explode( "\n", $chips_raw ) ) ) : array();
					?>
					<div class="step">
						<div class="step-num"><?php echo esc_html( get_sub_field( 'num' ) ); ?></div>
						<div class="phone"><img src="<?php echo foco_sub_image( 'phone', 'large', $tdir . '/assets/images/foco_aso_05.png' ); ?>" alt=""></div>
						<h3><?php echo esc_html( get_sub_field( 'head' ) ); ?></h3>
						<?php if ( ! empty( $chips ) ) : ?>
							<div class="task-examples">
								<?php foreach ( $chips as $chip ) : ?>
									<span class="task-chip"><?php echo esc_html( $chip ); ?></span>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>
						<p style="margin-top:14px"><?php echo wp_kses_post( get_sub_field( 'body' ) ); ?></p>
					</div>
				<?php endwhile;
			else :
				// 3 default steps
				$default_steps = array(
					array(
						'num'   => '1',
						'phone' => $tdir . '/assets/images/foco_aso_05.png',
						'head'  => 'Type anything',
						'chips' => array( '"Prepare client presentation"', '"Clean the apartment"', '"Study for exam"' ),
						'body'  => "That's enough.",
					),
					array(
						'num'   => '2',
						'phone' => $tdir . '/assets/images/foco_aso_06.png',
						'head'  => 'Get instant clarity',
						'chips' => array(),
						'body'  => 'FOCO turns it into <strong style="color:#fff">5 tiny steps</strong> you can actually do — with realistic time estimates.<br>No thinking. No overwhelm.',
					),
					array(
						'num'   => '3',
						'phone' => $tdir . '/assets/images/foco_aso_07.png',
						'head'  => 'Just begin',
						'chips' => array(),
						'body'  => 'Focus mode guides you <strong style="color:#fff">one step at a time</strong>.<br>No pressure. No chaos. Just forward.',
					),
				);
				foreach ( $default_steps as $s ) : ?>
					<div class="step">
						<div class="step-num"><?php echo esc_html( $s['num'] ); ?></div>
						<div class="phone"><img src="<?php echo esc_url( $s['phone'] ); ?>" alt=""></div>
						<h3><?php echo esc_html( $s['head'] ); ?></h3>
						<?php if ( ! empty( $s['chips'] ) ) : ?>
							<div class="task-examples">
								<?php foreach ( $s['chips'] as $chip ) : ?>
									<span class="task-chip"><?php echo esc_html( $chip ); ?></span>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>
						<p style="margin-top:14px"><?php echo wp_kses_post( $s['body'] ); ?></p>
					</div>
				<?php endforeach;
			endif;
			?>
		</div>
	</div>
</section>

<!-- ================ FEATURES (SPOTLIGHTS) ================ -->
<section id="features">
	<div class="wrap">
		<div style="text-align:center; margin-bottom:32px">
			<div class="section-eyebrow"><?php echo esc_html( foco_field( 'features_eyebrow', 'Why it finally works' ) ); ?></div>
			<h2>
				<?php echo esc_html( foco_field( 'features_h_1', 'Built for' ) ); ?>
				<span class="grad"><?php echo esc_html( foco_field( 'features_h_2', 'how your brain works.' ) ); ?></span>
			</h2>
			<p class="section-sub" style="margin-left:auto;margin-right:auto"><?php echo wp_kses_post( foco_field( 'features_sub', 'Every part of FOCO is designed around task initiation — not productivity theater.' ) ); ?></p>
		</div>

		<?php
		if ( function_exists( 'have_rows' ) && have_rows( 'spotlights' ) ) :
			$idx = 0;
			while ( have_rows( 'spotlights' ) ) : the_row();
				$reverse = ( $idx % 2 === 1 );
				$idx++;
				?>
				<div class="feature-spot<?php echo $reverse ? ' feature-spot--reverse' : ''; ?>">
					<div class="feature-spot-copy">
						<span class="feature-badge"><?php echo wp_kses_post( get_sub_field( 'badge' ) ); ?></span>
						<h3>
							<?php echo esc_html( get_sub_field( 'h_1' ) ); ?>
							<span class="grad"><?php echo esc_html( get_sub_field( 'h_2' ) ); ?></span>
						</h3>
						<p><?php echo wp_kses_post( get_sub_field( 'body' ) ); ?></p>
						<a href="<?php echo foco_sub_url( 'cta_url', '#cta-final' ); ?>" class="btn-pill"><?php echo esc_html( get_sub_field( 'cta' ) ?: 'Try it free →' ); ?></a>
					</div>
					<div class="feature-spot-visual">
						<div class="feature-spot-phone"><img src="<?php echo foco_sub_image( 'phone', 'large', $tdir . '/assets/images/foco_aso_05.png' ); ?>" alt=""></div>
					</div>
				</div>
			<?php endwhile;
		else :
			$default_spots = array(
				array( '✨ AI Task Breakdown',   'Turn overwhelm',   'into action.',     'Type any task. FOCO instantly breaks it into <strong style="color:#fff">5 tiny steps</strong> with realistic time estimates. No thinking. No overwhelm.', $tdir . '/assets/images/foco_aso_05.png' ),
				array( '☀️ Your Daily Start',   'No decisions.',    'Just: begin here.','FOCO picks the one highest-impact task each morning. You skip decision fatigue and start with confidence — every single day.', $tdir . '/assets/images/foco_aso_06.png' ),
				array( '🎯 Focus Mode',         'Stay',             'in the moment.',   'A calm timer + the FOCO mascot keeps you anchored to one step at a time. Drift happens — and FOCO gently brings you back.', $tdir . '/assets/images/foco_aso_07.png' ),
				array( '📈 Momentum Tracking',  'See proof',        "you're moving.",   'Streaks, focus minutes, finished tasks. Real evidence that small actions compound — even on the hard days.', $tdir . '/assets/images/foco_aso_09.png' ),
			);
			foreach ( $default_spots as $i => $sp ) :
				$reverse = ( $i % 2 === 1 );
				?>
				<div class="feature-spot<?php echo $reverse ? ' feature-spot--reverse' : ''; ?>">
					<div class="feature-spot-copy">
						<span class="feature-badge"><?php echo esc_html( $sp[0] ); ?></span>
						<h3><?php echo esc_html( $sp[1] ); ?> <span class="grad"><?php echo esc_html( $sp[2] ); ?></span></h3>
						<p><?php echo wp_kses_post( $sp[3] ); ?></p>
						<a href="#cta-final" class="btn-pill">Try it free →</a>
					</div>
					<div class="feature-spot-visual">
						<div class="feature-spot-phone"><img src="<?php echo esc_url( $sp[4] ); ?>" alt=""></div>
					</div>
				</div>
				<?php
			endforeach;
		endif;
		?>
	</div>
</section>

<!-- ================ SOCIAL PROOF ================ -->
<section class="proof">
	<div class="wrap">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'proof_eyebrow', 'Real results' ) ); ?></div>
		<h2>
			<span class="grad"><?php echo esc_html( foco_field( 'proof_h_1', '100,000+ people' ) ); ?></span><br>
			<?php echo esc_html( foco_field( 'proof_h_2', 'are breaking task paralysis with FOCO.' ) ); ?>
		</h2>

		<div class="testi-cards">
			<?php
			if ( function_exists( 'have_rows' ) && have_rows( 'testimonials' ) ) :
				while ( have_rows( 'testimonials' ) ) : the_row();
					$photo = get_sub_field( 'photo' );
					$photo_url = '';
					if ( is_array( $photo ) && isset( $photo['sizes']['medium_large'] ) ) {
						$photo_url = $photo['sizes']['medium_large'];
					} elseif ( is_array( $photo ) && isset( $photo['url'] ) ) {
						$photo_url = $photo['url'];
					} elseif ( is_string( $photo ) && $photo ) {
						$photo_url = $photo;
					}
					?>
					<div class="testi-card">
						<div class="testi-photo" style="background-image: url('<?php echo esc_url( $photo_url ); ?>')">
							<div class="testi-photo-overlay">
								<div class="name"><?php echo esc_html( get_sub_field( 'name' ) ); ?></div>
								<?php if ( get_sub_field( 'country' ) || get_sub_field( 'loc' ) ) : ?>
									<div class="meta">
										<?php if ( get_sub_field( 'country' ) ) : ?><span class="flag"><?php echo esc_html( get_sub_field( 'country' ) ); ?></span><?php endif; ?>
										<?php if ( get_sub_field( 'loc' ) ) : ?><span><?php echo esc_html( get_sub_field( 'loc' ) ); ?></span><?php endif; ?>
									</div>
								<?php endif; ?>
							</div>
						</div>
						<div class="testi-quote-block">
							<div class="stars">★★★★★</div>
							<p><?php echo wp_kses_post( get_sub_field( 'quote' ) ); ?></p>
							<?php if ( get_sub_field( 'role' ) ) : ?>
								<span class="role"><?php echo esc_html( get_sub_field( 'role' ) ); ?></span>
							<?php endif; ?>
						</div>
					</div>
				<?php endwhile;
			else :
				// Default placeholder testimonials
				$default_testimonials = array(
					array( 'Maya R.',  'US',  'USA',          'I had a 3-week assignment I couldn\'t start. FOCO got me to begin in 2 minutes.',     'Designer · Diagnosed at 31',  'https://i.pravatar.cc/400?img=49' ),
					array( 'Jordan K.','UK',  'London',       'For the first time in years, I started something without spiraling.',                  'PhD student · Neuroscience',  'https://i.pravatar.cc/400?img=12' ),
					array( 'Sam P.',   'CA',  'Toronto',      'The mascot sounds silly… but it completely changed how I focus.',                       'Software Engineer',           'https://i.pravatar.cc/400?img=33' ),
					array( 'Aisha N.', 'DE',  'Berlin',       'Other apps yelled at me. FOCO just helped me begin. That\'s the whole difference.',     'Master\'s student',           'https://i.pravatar.cc/400?img=5'  ),
					array( 'Marcus T.','US',  'NYC',          'First productivity app that doesn\'t make me feel like a failure for needing it.',      'Writer · ADHD since 2018',    'https://i.pravatar.cc/400?img=60' ),
					array( 'Chloé M.', 'FR',  'Paris',        'I recommend FOCO to most of my ADHD clients now. It just works.',                        'ADHD coach',                  'https://i.pravatar.cc/400?img=25' ),
					array( 'Diego R.', 'MX',  'Mexico City',  'Went from 0 finished tasks last week to 18 this week. Same brain. Different app.',      'Founder · Late-diagnosed',    'https://i.pravatar.cc/400?img=8'  ),
					array( 'Lena Ø.',  'DK',  'Copenhagen',   'Mom of three with late-diagnosis ADHD. FOCO finally fits how my brain works.',          'Parent · Designer',           'https://i.pravatar.cc/400?img=32' ),
				);
				foreach ( $default_testimonials as $t ) : ?>
					<div class="testi-card">
						<div class="testi-photo" style="background-image: url('<?php echo esc_url( $t[5] ); ?>')">
							<div class="testi-photo-overlay">
								<div class="name"><?php echo esc_html( $t[0] ); ?></div>
								<div class="meta"><span class="flag"><?php echo esc_html( $t[1] ); ?></span><span><?php echo esc_html( $t[2] ); ?></span></div>
							</div>
						</div>
						<div class="testi-quote-block">
							<div class="stars">★★★★★</div>
							<p>"<?php echo esc_html( $t[3] ); ?>"</p>
							<span class="role"><?php echo esc_html( $t[4] ); ?></span>
						</div>
					</div>
				<?php endforeach;
			endif;
			?>
		</div>

		<div class="big-stat-card">
			<div class="big-stat-num"><?php echo esc_html( foco_field( 'big_stat_num', '2,400,000+' ) ); ?></div>
			<div class="big-stat-label"><?php echo wp_kses_post( foco_field( 'big_stat_label', 'tasks finally <strong>started</strong> with FOCO' ) ); ?></div>
		</div>
	</div>
</section>

<!-- ================ MOMENTUM ================ -->
<section class="momentum">
	<div class="wrap">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'mo_eyebrow', 'This is how momentum starts' ) ); ?></div>
		<h2>
			<?php echo esc_html( foco_field( 'mo_h_1', "You don't need to" ) ); ?>
			<span class="accent-orange"><?php echo esc_html( foco_field( 'mo_h_2', 'fix your life.' ) ); ?></span>
		</h2>
		<div class="momentum-stack">
			<span><?php echo esc_html( foco_field( 'mo_stack_1', "You don't need discipline." ) ); ?></span>
			<span><?php echo esc_html( foco_field( 'mo_stack_2', "You don't need a perfect system." ) ); ?></span>
			<span class="punch">
				<?php echo esc_html( foco_field( 'mo_punch_1', '👉 You just need to' ) ); ?>
				<span class="grad-orange"><?php echo esc_html( foco_field( 'mo_punch_2', 'start once.' ) ); ?></span>
			</span>
		</div>
		<img class="momentum-mascot"
			src="<?php echo foco_image( 'mo_mascot', 'large', $tdir . '/assets/images/foco_state_5_completion.png' ); ?>"
			alt="">
		<p style="font-size:17px;color:#B8B0CC;margin-bottom:22px"><?php echo wp_kses_post( foco_field( 'mo_subhead', 'Start your first task now. <strong style="color:#fff">Free. No credit card.</strong>' ) ); ?></p>
		<div class="store-badges" style="justify-content:center"><?php echo foco_store_buttons(); ?></div>
	</div>
</section>

<!-- ================ PRICING ================ -->
<section id="pricing">
	<div class="wrap" style="text-align:center">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'pr_eyebrow', 'Pricing' ) ); ?></div>
		<span class="risk-hook"><?php echo wp_kses_post( foco_field( 'pr_risk', "💪 Try it. If it doesn't help you start — don't pay." ) ); ?></span>
		<h2>
			<?php echo esc_html( foco_field( 'pr_h_1', 'Unlock' ) ); ?>
			<span class="grad"><?php echo esc_html( foco_field( 'pr_h_2', 'full focus.' ) ); ?></span>
		</h2>
		<p class="section-sub" style="margin-left:auto;margin-right:auto"><?php echo wp_kses_post( foco_field( 'pr_sub', "FOCO helps you stay consistent. You'll know in your first session." ) ); ?></p>

		<div class="pricing-cards">
			<?php
			if ( function_exists( 'have_rows' ) && have_rows( 'pricing_tiers' ) ) :
				while ( have_rows( 'pricing_tiers' ) ) : the_row();
					$is_featured = (bool) get_sub_field( 'featured' );
					$pill        = get_sub_field( 'pill' );
					$save        = get_sub_field( 'save' );
					?>
					<div class="pricing-tier<?php echo $is_featured ? ' featured' : ''; ?>">
						<?php if ( $save ) : ?><span class="save-badge"><?php echo esc_html( $save ); ?></span><?php endif; ?>
						<div class="tier-header">
							<div class="tier-name">
								<?php echo esc_html( get_sub_field( 'name' ) ); ?>
								<?php if ( $pill ) : ?><span class="best-pill"><?php echo esc_html( $pill ); ?></span><?php endif; ?>
							</div>
							<div class="tier-price">
								<span class="amount"><?php echo esc_html( get_sub_field( 'amount' ) ); ?></span>
								<?php if ( get_sub_field( 'period' ) ) : ?><span class="period"><?php echo esc_html( get_sub_field( 'period' ) ); ?></span><?php endif; ?>
							</div>
							<?php if ( get_sub_field( 'equiv' ) ) : ?>
								<div class="tier-equiv"><?php echo wp_kses_post( get_sub_field( 'equiv' ) ); ?></div>
							<?php endif; ?>
						</div>
						<?php if ( get_sub_field( 'tagline' ) ) : ?>
							<p class="tier-tagline"><?php echo esc_html( get_sub_field( 'tagline' ) ); ?></p>
						<?php endif; ?>
						<ul class="benefits">
							<?php if ( have_rows( 'benefits' ) ) : while ( have_rows( 'benefits' ) ) : the_row(); ?>
								<li><span class="check">✓</span> <?php echo esc_html( get_sub_field( 'benefit' ) ); ?></li>
							<?php endwhile; endif; ?>
						</ul>
						<a href="<?php echo foco_sub_url( 'cta_url', '#' ); ?>" class="btn <?php echo $is_featured ? 'btn-primary' : 'btn-ghost'; ?> pricing-cta">
							<?php echo esc_html( get_sub_field( 'cta' ) ?: 'Start 7-day free trial' ); ?>
						</a>
					</div>
				<?php endwhile;
			else :
				// Default 2 tiers
				?>
				<div class="pricing-tier">
					<div class="tier-header">
						<div class="tier-name">Monthly</div>
						<div class="tier-price"><span class="amount">$19.99</span><span class="period">/month</span></div>
						<div class="tier-equiv">Flexibility · cancel anytime</div>
					</div>
					<p class="tier-tagline">Start without commitment.</p>
					<ul class="benefits">
						<li><span class="check">✓</span> Unlimited AI task breakdown</li>
						<li><span class="check">✓</span> Smart focus sessions &amp; timer</li>
						<li><span class="check">✓</span> Progress tracking &amp; insights</li>
						<li><span class="check">✓</span> Templates &amp; task scanning</li>
					</ul>
					<a href="#" class="btn btn-ghost pricing-cta">Start 7-day free trial</a>
				</div>
				<div class="pricing-tier featured">
					<span class="save-badge">Save 58%</span>
					<div class="tier-header">
						<div class="tier-name">Yearly <span class="best-pill">Best value</span></div>
						<div class="tier-price"><span class="amount">$99</span><span class="period">/year</span></div>
						<div class="tier-equiv"><span class="strike">$239.88</span> Just $8.25/month, billed yearly</div>
					</div>
					<p class="tier-tagline">Best for building real momentum.</p>
					<ul class="benefits">
						<li><span class="check">✓</span> Unlimited AI task breakdown</li>
						<li><span class="check">✓</span> Smart focus sessions &amp; timer</li>
						<li><span class="check">✓</span> Progress tracking &amp; insights</li>
						<li><span class="check">✓</span> Templates &amp; task scanning</li>
					</ul>
					<a href="#" class="btn btn-primary pricing-cta">👉 Start 7-day free trial</a>
				</div>
				<?php
			endif;
			?>
		</div>

		<div class="pricing-coda">
			<div class="quote-pill"><?php echo wp_kses_post( foco_field( 'pr_quote', 'Small steps. Real progress. <strong>Big results.</strong>' ) ); ?></div>
			<div class="pricing-trust">
				<span class="item"><span class="shield">🛡️</span> Cancel anytime</span>
				<span class="sep">·</span>
				<span class="item">No charge during trial</span>
				<span class="sep">·</span>
				<span class="item"><span class="stars">★★★★★</span> Join thousands building better focus</span>
			</div>
		</div>
	</div>
</section>

<!-- ================ FAQ ================ -->
<section>
	<?php $faq_mascot_url = foco_image( 'faq_mascot', 'medium', $tdir . '/assets/images/foco_state_3_focus.png' ); ?>
	<?php if ( $faq_mascot_url ) : ?>
		<img class="faq-pause-mascot" src="<?php echo $faq_mascot_url; ?>" alt="">
	<?php endif; ?>
	<div class="wrap">
		<div style="text-align:center">
			<div class="section-eyebrow"><?php echo esc_html( foco_field( 'faq_eyebrow', 'FAQ' ) ); ?></div>
			<h2>
				<?php echo esc_html( foco_field( 'faq_h_1', 'Quick' ) ); ?>
				<span class="grad"><?php echo esc_html( foco_field( 'faq_h_2', 'answers.' ) ); ?></span>
			</h2>
		</div>
		<div class="faq-grid">
			<?php
			if ( function_exists( 'have_rows' ) && have_rows( 'faq_items' ) ) :
				while ( have_rows( 'faq_items' ) ) : the_row(); ?>
					<div class="faq-item">
						<button class="faq-q"><?php echo esc_html( get_sub_field( 'q' ) ); ?> <span class="chev">+</span></button>
						<div class="faq-a"><?php echo wp_kses_post( get_sub_field( 'a' ) ); ?></div>
					</div>
				<?php endwhile;
			else :
				$default_faqs = array(
					array( 'Is this just another to-do app?', '<p>No. To-do apps assume you can start. <strong style="color:#fff">FOCO assumes you can\'t — and solves that.</strong></p>' ),
					array( "What if I've tried everything already?", '<p>That\'s exactly who FOCO is for. Most tools fail because they expect motivation. <strong style="color:#fff">FOCO removes the need for it.</strong></p>' ),
					array( 'Do I need ADHD?', '<p>No. If you struggle to start — FOCO helps. Diagnosed or not.</p>' ),
					array( 'What if I lose focus again?', '<p>You will. That\'s normal. <strong style="color:#fff">FOCO is built for that.</strong> It gently brings you back — without guilt.</p>' ),
					array( 'Can I cancel anytime?', '<p>Yes. No commitment. No tricks.</p>' ),
				);
				foreach ( $default_faqs as $f ) : ?>
					<div class="faq-item">
						<button class="faq-q"><?php echo esc_html( $f[0] ); ?> <span class="chev">+</span></button>
						<div class="faq-a"><?php echo wp_kses_post( $f[1] ); ?></div>
					</div>
				<?php endforeach;
			endif;
			?>
		</div>
	</div>
</section>

<!-- ================ FINAL CTA ================ -->
<section class="cta-band" id="cta-final">
	<div class="wrap">
		<div class="section-eyebrow"><?php echo esc_html( foco_field( 'fc_eyebrow', 'Final word' ) ); ?></div>
		<h2>
			<?php echo esc_html( foco_field( 'fc_h_1', "You're" ) ); ?>
			<span class="grad"><?php echo esc_html( foco_field( 'fc_h_2', 'not stuck.' ) ); ?></span><br>
			<?php echo esc_html( foco_field( 'fc_h_3', "You just don't have a starting point." ) ); ?>
		</h2>
		<p style="font-size:clamp(20px,2.2vw,26px);font-weight:600;color:#A78BFA;margin:-16px auto 40px;letter-spacing:-0.01em"><?php echo esc_html( foco_field( 'fc_punch', 'FOCO gives you one.' ) ); ?></p>
		<div class="store-badges"><?php echo foco_store_buttons(); ?></div>
		<div class="trust-row">
			<span class="stars">★★★★★</span>
			<span><?php echo wp_kses_post( foco_field( 'hero_trust', 'Trusted by <strong style="color:#fff">100,000+</strong> ADHD minds' ) ); ?></span>
		</div>
	</div>
</section>

<?php get_footer(); ?>
