<?php
/**
 * FOCO Play referrer (2026-11-03).
 * Adds an install referrer to every Google Play link for FOCO (com.adiben.foco) on the site
 * that does not already carry one, so installs from tryfoco.com stop showing up as
 * "google-play / organic" and get attributed in GA4 (firstUserSource = tryfoco,
 * firstUserCampaign = page slug). Links that already have &referrer= (post_bar) are left as is.
 * Runs on page load and again at click time (covers links injected later by tools).
 * Rollback: wp-admin -> Snippets -> deactivate "FOCO Play referrer".
 */
add_action('wp_footer', function () {
	echo '<script>(function(){function slug(){var p=location.pathname.replace(/^\/+|\/+$/g,"").replace(/\//g,"_");return p?p.slice(0,90):"home"}function fix(a){var h=a.getAttribute("href")||"";if(h.indexOf("play.google.com")<0||h.indexOf("com.adiben.foco")<0||/[?&]referrer=/.test(h))return;var r="utm_source=tryfoco&utm_medium=site&utm_campaign="+slug();a.setAttribute("href",h+(h.indexOf("?")<0?"?":"&")+"referrer="+encodeURIComponent(r))}function all(){document.querySelectorAll("a[href*=\"com.adiben.foco\"]").forEach(fix)}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",all);else all();document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a)fix(a)},true)})();</script>';
}, 99);
