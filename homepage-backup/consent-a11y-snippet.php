<?php
/**
 * FOCO cookie consent + accessibility fixes (2026-10-28). Runs as a "Code Snippets" plugin snippet.
 * Free replacement for paid consent / accessibility plugins. Everything runs client-side so it
 * works behind the Varnish page cache.
 *
 * Consent: Google Consent Mode v2 defaults are printed before Site Kit's gtag. Visitors in the
 * EEA, UK and Switzerland (Google geolocates by IP) start with analytics denied until they accept;
 * everyone else starts granted and can opt out. Ads storage is always denied (the site runs no ads).
 * The banner shows on first visit when the browser timezone is European; "Cookie settings" in the
 * footer reopens it for anyone. Choice is kept in the first-party cookie foco_consent (180 days).
 *
 * Accessibility (WCAG 2.1 AA): skip link, main landmark, labelled nav, visible keyboard focus,
 * reduced-motion support, pause buttons on looping videos, contrast fixes, footer heading levels,
 * YouTube embeds switched to privacy-enhanced youtube-nocookie.com.
 * Rollback: deactivate this snippet.
 */

// The three pieces are functions so standalone pages that skip the theme (the body doubling room)
// can print them too: head script before their gtag, style, and banner before </body>.
function foco_consent_head_html() {
	ob_start();
	?>
<script id="foco-consent-default">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500,region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH']});gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});(function(){var m=document.cookie.match(/(?:^|; )foco_consent=(all|essential)/);if(m){gtag('consent','update',{analytics_storage:m[1]==='all'?'granted':'denied'});}})();</script>
	<?php
	return ob_get_clean();
}

function foco_consent_style_html() {
	return '<style id="foco-consent-a11y">.foco-skip{position:fixed;left:16px;top:-80px;z-index:2147483647;background:#7C3AED;color:#fff !important;font:600 15px/1 "Plus Jakarta Sans",system-ui,sans-serif;padding:14px 18px;border-radius:12px;text-decoration:none !important;transition:top .15s}.foco-skip:focus{top:16px}.foco-sr{position:absolute !important;width:1px !important;height:1px !important;padding:0 !important;margin:-1px !important;overflow:hidden !important;clip:rect(0,0,0,0) !important;white-space:nowrap !important;border:0 !important}#main-content{scroll-margin-top:96px}#main-content:focus{outline:none}html body a:focus-visible,html body button:focus-visible,html body input:focus-visible,html body select:focus-visible,html body textarea:focus-visible,html body summary:focus-visible,html body [tabindex]:focus-visible{outline:3px solid #8B5CF6 !important;outline-offset:2px !important}html body .foco-app .blog-single article figure:not(.foco-dark):not([class*=foco-chart])>figcaption,html body .foco-app .blog-single article figure:not(.foco-dark):not([class*=foco-chart])>figcaption *{color:#5F5874 !important;opacity:1 !important}html body .foco-app .foco-fr-kit .card b{color:#1E1733 !important}html body .foco-app .foco-fr-kit .card span{color:#5F5874 !important}html body .foco-app .foco-fr-kit .card a{color:#fff !important}html body .foco-app .foco-fr-next>div{color:#5F5874 !important}html body .foco-app .foco-dl-req span{color:#5F5874 !important}html body .foco-app .foco-dl-badge .t .s{color:#6D28D9 !important;opacity:1 !important}html body .foco-app .foco-reset-foot,html body .foco-app .foco-bedtime-foot,html body .foco-app .foco-morning-foot{color:#6E6684 !important}html body .foco-app .blog-single article div[style*="background:#120a1f"] p{color:#E7E0F5 !important}html body .foco-app .blog-single article div[style*="background:#120a1f"] p[style*="#A78BFA"]{color:#A78BFA !important}html body .foco-app .blog-archive .topic-tiles-title.topic-tiles-title{color:#5F5874 !important}.foco-vid-toggle{position:absolute;right:10px;bottom:10px;z-index:3;width:36px;height:36px;border-radius:50%;border:1px solid rgba(167,139,250,.5);background:rgba(4,2,8,.72);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.foco-vid-toggle svg{width:14px;height:14px;fill:currentColor}html body .foco-app footer .foco-footer-btn{background:none;border:0;padding:0;margin:0;font:inherit;font-size:14px;line-height:21px;color:#B8B0CC;cursor:pointer;text-align:left}html body .foco-app footer .foco-footer-btn:hover{color:#fff}#foco-consent{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:400px;background:#0a0410;color:#E7E0F5;border:1px solid rgba(167,139,250,.4);border-radius:20px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.45);font:400 14px/1.55 "Plus Jakarta Sans",system-ui,sans-serif}#foco-consent[hidden]{display:none}#foco-consent h2{margin:0 0 6px;font:700 16px/1.3 Lexend,system-ui,sans-serif;color:#fff}#foco-consent p{margin:0 0 14px;color:#D4CCE6}#foco-consent a{color:#C4B5FD;text-decoration:underline}#foco-consent .fc-row{display:flex;gap:10px}#foco-consent button{flex:1;min-height:44px;border-radius:12px;font:600 14px/1 "Plus Jakarta Sans",system-ui,sans-serif;cursor:pointer;padding:0 14px}#foco-consent .fc-yes{background:#7C3AED;color:#fff;border:1px solid #7C3AED}#foco-consent .fc-no{background:transparent;color:#fff;border:1px solid rgba(167,139,250,.6)}@media (max-width:600px){#foco-consent{left:12px;right:12px;bottom:12px;max-width:none}}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}}</style>';
}

add_action( 'wp_head', function () {
	if ( ! is_admin() ) { echo foco_consent_head_html(); } // phpcs:ignore WordPress.Security.EscapeOutput -- static markup
}, 1 );

add_action( 'wp_head', function () {
	if ( ! is_admin() ) { echo foco_consent_style_html(); } // phpcs:ignore WordPress.Security.EscapeOutput -- static markup
}, 99 );

// Footer: "Accessibility" link + "Cookie settings" button in the Legal column, footer headings as level 2.
// Inner buffer: opens after the social-links snippet's (get_footer 0) and closes before it (wp_footer 0).
add_action( 'get_footer', function () {
	if ( is_admin() || wp_doing_ajax() ) { return; }
	$GLOBALS['foco_a11y_ob'] = ob_get_level();
	ob_start();
}, 1 );

add_action( 'wp_footer', function () {
	if ( ! isset( $GLOBALS['foco_a11y_ob'] ) || ob_get_level() <= $GLOBALS['foco_a11y_ob'] ) { return; }
	$html = ob_get_clean();
	$html = preg_replace( '#(<div class="foot-col">\s*)<h4>#', '$1<h4 role="heading" aria-level="2">', $html );
	if ( false === strpos( $html, '/accessibility-statement/' ) ) {
		$html = preg_replace( '#(<h4[^>]*>Legal</h4>\s*<ul>.*?)</ul>#s', '$1<li><a href="' . esc_url( home_url( '/accessibility-statement/' ) ) . '">Accessibility</a></li><li><button type="button" class="foco-footer-btn" data-foco-consent-open>Cookie settings</button></li></ul>', $html, 1 );
	}
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput -- theme footer markup + static links
}, -1 );

function foco_consent_banner_html() {
	$policy = esc_url( home_url( '/privacy-policy/#cookies' ) );
	ob_start();
	?>
<div id="foco-consent" role="region" aria-labelledby="foco-consent-title" hidden><h2 id="foco-consent-title">Cookies on FOCO</h2><p>We use Google Analytics cookies to see which pages actually help people. No ads, and we never sell your data. <a href="<?php echo $policy; ?>">Cookie policy</a></p><div class="fc-row"><button type="button" class="fc-no" data-foco-consent="essential">Reject</button><button type="button" class="fc-yes" data-foco-consent="all">Accept analytics</button></div></div>
<script id="foco-consent-a11y-js">(function(){
var d=document,b=d.body;
/* main landmark + skip link */
var app=d.querySelector('.foco-app'),main=d.querySelector('main,[role=main]');
if(!main&&app){main=app.querySelector(':scope>.blog-single,:scope>.blog-archive');if(!main){for(var i=0;i<app.children.length;i++){var c=app.children[i],t=c.tagName;if(t!=='NAV'&&t!=='FOOTER'&&t!=='SCRIPT'&&t!=='STYLE'&&t!=='svg'&&t!=='SVG'){main=c;break;}}}if(main){main.setAttribute('role','main');}}
if(main){if(!main.id){main.id='main-content';}main.setAttribute('tabindex','-1');var s=d.createElement('a');s.className='foco-skip';s.href='#'+main.id;s.textContent='Skip to content';b.insertBefore(s,b.firstChild);}
var nav=d.getElementById('foco-nav');if(nav&&!nav.getAttribute('aria-label')){nav.setAttribute('aria-label','Main');}
if(main){main.querySelectorAll('aside').forEach(function(a){a.setAttribute('role','region');});}
/* chart titles are labels, not page headings */
d.querySelectorAll('[class*="foco-chart"] h4').forEach(function(h){h.setAttribute('role','none');});
/* white text on orange pills fails contrast: dark text instead */
d.querySelectorAll('[style*="background:#FB923C"][style*="color:#fff"]').forEach(function(e){e.style.color='#1E1733';});
/* empty headings and table headers */
d.querySelectorAll('h1,h2,h3').forEach(function(h){if(!h.textContent.trim()&&!h.querySelector('img')){h.setAttribute('aria-hidden','true');}});
d.querySelectorAll('th').forEach(function(th){if(!th.textContent.trim()&&!th.getAttribute('aria-label')){var sp=d.createElement('span');sp.className='foco-sr';sp.textContent='Item';th.appendChild(sp);}});
/* looping autoplay videos: pause button (WCAG 2.2.2), start paused for reduced motion */
var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var PAUSE='<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/></svg>',PLAY='<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z"/></svg>';
d.querySelectorAll('video[autoplay][loop]').forEach(function(v){
var p=v.parentElement;if(!p){return;}if(getComputedStyle(p).position==='static'){p.style.position='relative';}
var btn=d.createElement('button');btn.type='button';btn.className='foco-vid-toggle';
function paint(){var paused=v.paused||v.dataset.focoPaused==='1';btn.innerHTML=paused?PLAY:PAUSE;btn.setAttribute('aria-label',paused?'Play animation':'Pause animation');}
btn.addEventListener('click',function(){if(v.dataset.focoPaused==='1'){v.dataset.focoPaused='0';v.play();}else{v.dataset.focoPaused='1';v.pause();}paint();});
v.addEventListener('play',function(){if(v.dataset.focoPaused==='1'){v.pause();}paint();});v.addEventListener('pause',paint);
if(still){v.dataset.focoPaused='1';v.pause();}
p.appendChild(btn);paint();});
/* consent banner */
var box=d.getElementById('foco-consent');if(!box){return;}
var skip=d.querySelector('.foco-skip');b.insertBefore(box,skip?skip.nextSibling:b.firstChild);
function chosen(){var m=d.cookie.match(/(?:^|; )foco_consent=(all|essential)/);return m?m[1]:null;}
function save(v){d.cookie='foco_consent='+v+'; max-age=15552000; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');if(typeof gtag==='function'){gtag('consent','update',{analytics_storage:v==='all'?'granted':'denied'});}
if(v==='essential'){d.cookie.split('; ').forEach(function(k){var n=k.split('=')[0];if(/^_ga/.test(n)){var h=location.hostname.replace(/^www\./,'');['',h,'.'+h,location.hostname].forEach(function(dm){d.cookie=n+'=; max-age=0; path=/'+(dm?'; domain='+dm:'');});}});}
box.hidden=true;}
box.querySelectorAll('[data-foco-consent]').forEach(function(x){x.addEventListener('click',function(){save(x.getAttribute('data-foco-consent'));});});
d.querySelectorAll('[data-foco-consent-open]').forEach(function(x){x.addEventListener('click',function(){box.hidden=false;var f=box.querySelector(chosen()==='all'?'.fc-no':'.fc-yes');f&&f.focus();});});
var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
if(!chosen()&&/^(Europe\/|Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe)|Asia\/Nicosia|Arctic\/)/.test(tz)){box.hidden=false;}
})();</script>
	<?php
	return ob_get_clean();
}

add_action( 'wp_footer', function () {
	if ( ! is_admin() ) { echo foco_consent_banner_html(); } // phpcs:ignore WordPress.Security.EscapeOutput -- static markup
}, 99 );

// Privacy-enhanced YouTube embeds (no YouTube cookies until the visitor presses play).
add_filter( 'the_content', function ( $content ) {
	return str_replace( array( 'www.youtube.com/embed/', '//youtube.com/embed/' ), array( 'www.youtube-nocookie.com/embed/', '//www.youtube-nocookie.com/embed/' ), $content );
}, 99 );
