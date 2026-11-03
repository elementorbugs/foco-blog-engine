// Install attribution for standalone tool pages (served by a Code Snippet that skips wp_footer, so the site-wide
// "FOCO Play referrer" snippet #20 never runs there). Every tool deploy passes its built HTML through this.
// Every Google Play link for FOCO gets referrer=utm_source=tryfoco&utm_medium=site&utm_campaign=<campaign>.
// An existing referrer is REPLACED: shared markup (adhd-tools reuses the visual timer's badges) must be
// attributed to the page that serves it. Throws if a plain link survives. QA: node analytics/qa-store-links.js
const PLAY = /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.adiben\.foco(?:(?:&amp;|&)referrer=[^"'\s<>)]*)?/g;

module.exports = function withPlayReferrer(html, campaign) {
  if (!/^[a-z0-9-_]+$/.test(campaign)) throw new Error('store-referrer: bad campaign "' + campaign + '"');
  const ref = encodeURIComponent('utm_source=tryfoco&utm_medium=site&utm_campaign=' + campaign);
  const out = html.replace(PLAY, 'https://play.google.com/store/apps/details?id=com.adiben.foco&referrer=' + ref);
  if (/details\?id=com\.adiben\.foco(?!&referrer=)/.test(out)) throw new Error('store-referrer: a FOCO Play link is still missing its referrer');
  return out;
};
