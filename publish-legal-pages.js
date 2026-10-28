// Accessibility Statement page (new) + Privacy Policy update (page 3): website + cookies section,
// drops the leftover App Store / Play form notes at the bottom. Backs up page 3 first.
//   node publish-legal-pages.js            dry run: writes previews to .audit-cache/legal/
//   node publish-legal-pages.js --live     pushes both pages
// Pairs with the consent snippet (homepage-backup/consent-a11y-snippet.php).
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');
const LIVE = process.argv.includes('--live');
const OUT = path.join(__dirname, '.audit-cache', 'legal');
const UPDATED = 'October 28, 2026';

const h2 = t => `<!-- wp:heading -->\n<h2 class="wp-block-heading">${t}</h2>\n<!-- /wp:heading -->\n\n`;
const h3 = t => `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">${t}</h3>\n<!-- /wp:heading -->\n\n`;
const p = t => `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->\n\n`;
const ul = items => `<!-- wp:list -->\n<ul class="wp-block-list">${items.map(i => `<!-- wp:list-item -->\n<li>${i}</li>\n<!-- /wp:list-item -->`).join('\n\n')}</ul>\n<!-- /wp:list -->\n\n`;
const hr = '<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->\n\n';
const MAIL = '<a href="mailto:support@tryfoco.com">support@tryfoco.com</a>';

const accessibility =
  p(`<em>Last updated: ${UPDATED}</em>`) +
  p('FOCO is built for people whose brains work differently, so we want tryfoco.com to work for everyone, including people who use screen readers, keyboards, magnification or other assistive technology.') +
  h2('Which standard do we follow?') +
  p('We aim to meet the <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener">Web Content Accessibility Guidelines (WCAG) 2.1</a> at level AA. WCAG 2.1 AA is also the basis of Israeli Standard IS 5568 and the European standard EN 301 549.') +
  p('We consider the site <strong>partially conformant</strong>: most of it meets WCAG 2.1 AA, and the known gaps are listed below.') +
  h2('What have we done so far?') +
  ul([
    'A "Skip to content" link as the first keyboard stop on every page.',
    'Every page has a labelled main content area and navigation, so screen readers can jump between them.',
    'All links, buttons and menus work with a keyboard and show a clearly visible focus outline.',
    'Text and background colours meet WCAG AA contrast ratios.',
    'Images carry text alternatives; decorative icons are hidden from screen readers.',
    'Looping animations have a pause button, and they start paused when your device is set to reduce motion.',
    'The site respects your "reduce motion" setting and stays usable at 200% browser zoom.',
    'Pages use real headings in a logical order, and the language of each page is declared.',
  ]) +
  h2('Are there known limitations?') +
  p('Yes. We are working on these:') +
  ul([
    'Some older posts contain charts or tables whose descriptions could be more detailed.',
    'Embedded YouTube videos and app store pages are run by third parties, and we cannot fully control their accessibility.',
    'Printable PDF planners and worksheets are designed for printing and may not be fully readable by screen readers. Contact us and we will send an accessible version.',
    'Interactive tools such as the body doubling room and the visual timer are still being reviewed against WCAG 2.1 AA.',
  ]) +
  p('This statement covers the website. The FOCO mobile app on the App Store and Google Play follows the accessibility features of iOS and Android, and we review it separately.') +
  h2('How did we check?') +
  p(`We assessed the site ourselves on ${UPDATED}, using automated testing with axe-core against WCAG 2.1 A and AA rules, plus manual keyboard and reduced-motion testing on desktop and mobile.`) +
  h2('Found a barrier? How do I contact you?') +
  p('If anything on the site is hard to use, or you need content in another format, tell us and we will fix it or find another way to help.') +
  ul([
    `Email: ${MAIL}`,
    'Accessibility contact: Adi Ben Elyahu, founder',
    'Please include the page address and a short description of the problem.',
  ]) +
  p('We aim to reply within 5 business days.');

const cookies =
  h2('<strong>13. Our Website and Cookies</strong>') +
  `<!-- wp:paragraph -->\n<p id="cookies">This section covers our website, tryfoco.com. The website shows no ads, and we never sell visitor data.</p>\n<!-- /wp:paragraph -->\n\n` +
  h3('13.1 Cookies we use') +
  ul([
    '<strong>Strictly necessary:</strong> <code>foco_consent</code> remembers your cookie choice for 6 months. It contains no personal data.',
    '<strong>Analytics (optional):</strong> Google Analytics 4 sets <code>_ga</code> and <code>_ga_*</code> cookies (stored up to 2 years) to count visits and see which pages people read. We use it in Consent Mode with ad features turned off.',
  ]) +
  h3('13.2 Your choice') +
  ul([
    'Visitors in the European Economic Area, the UK and Switzerland: analytics cookies stay off until you press "Accept analytics".',
    'Everyone else: analytics is on by default, and you can turn it off at any time.',
    'Change your choice whenever you like with the "Cookie settings" link in the footer of every page. Choosing "Reject" also deletes existing Google Analytics cookies.',
  ]) +
  h3('13.3 Other services that load on the site') +
  ul([
    '<strong>YouTube:</strong> videos are embedded in privacy-enhanced mode (youtube-nocookie.com) and most load only when you press play.',
    '<strong>Fonts:</strong> all fonts are served from our own server, so loading a page sends nothing to Google.',
    '<strong>Hosting:</strong> our hosting provider keeps standard server logs (such as IP address and browser type) for security.',
  ]) +
  p(`For questions about website data, or to use your rights under GDPR, UK GDPR or US state privacy laws (including CCPA), email ${MAIL}.`) +
  hr;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const get = async u => (await fetch(BASE + u, { headers: { Authorization: AUTH } })).json();
  const send = async (u, body) => {
    const r = await fetch(BASE + u, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    return `HTTP ${r.status} id ${j.id} ${j.status} ${j.link}`;
  };

  // Privacy Policy
  const pp = await get('/wp-json/wp/v2/pages/3?context=edit');
  fs.writeFileSync(path.join(OUT, `privacy-backup-${Date.now()}.html`), pp.content.raw);
  let raw = pp.content.raw;
  if (!raw.includes('id="cookies"')) {
    const notes = raw.indexOf('<!-- wp:heading -->\n<h2 class="wp-block-heading">Apple App Privacy</h2>');
    if (notes > 0) raw = raw.slice(0, notes).replace(/(<!-- wp:separator -->\s*<hr[^>]*\/>\s*<!-- \/wp:separator -->\s*)+$/, '');
    raw = raw
      .replace('when you use the FOCO mobile application (“App”).', 'when you use the FOCO mobile application (“App”) and our website, tryfoco.com (“Site”).')
      .replace('<strong>14. Contact</strong>', '<strong>15. Contact</strong>')
      .replace('<strong>13. Changes to This Policy</strong>', '<strong>14. Changes to This Policy</strong>');
    const at = raw.indexOf('<!-- wp:heading -->\n<h2 class="wp-block-heading"><strong>14. Changes to This Policy');
    if (at < 0) throw new Error('Privacy policy layout changed: "Changes to This Policy" heading not found');
    raw = p(`<em>Last updated: ${UPDATED}</em>`) + raw.slice(0, at) + cookies + raw.slice(at);
  }
  if (/[֐-׿—]/.test(raw + accessibility)) throw new Error('Hebrew text or em dash left in page content');
  fs.writeFileSync(path.join(OUT, 'privacy-new.html'), raw);
  fs.writeFileSync(path.join(OUT, 'accessibility-statement.html'), accessibility);

  const existing = await get('/wp-json/wp/v2/pages?status=any&slug=accessibility-statement');
  if (!LIVE) { console.log(`Dry run. Previews in ${OUT}. Accessibility page ${existing.length ? 'exists (#' + existing[0].id + ')' : 'will be created'}.`); return; }
  console.log('privacy:', await send('/wp-json/wp/v2/pages/3', { content: raw }));
  console.log('accessibility:', await send('/wp-json/wp/v2/pages' + (existing.length ? '/' + existing[0].id : ''), {
    title: 'Accessibility Statement', slug: 'accessibility-statement', status: 'publish', content: accessibility,
  }));
})();
