// Snapshot of US App Store listings for ASO research: lookup metadata, product-page text (subtitle, description,
// promotional text, in-app purchases, version history) and full-size iPhone screenshots.
// Usage: node scripts/aso-snapshot.js <out-dir> <appId> [<appId> ...]   -> <out-dir>/<appId>/{meta.json,page.txt,shot-N.jpg}
const fs = require('fs'), path = require('path'), https = require('https');
const get = (url) => new Promise((res, rej) => https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return res(get(new URL(r.headers.location, url).href));
  const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
}).on('error', rej));
const str = (h, key) => { const m = h.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`)); return m ? JSON.parse('"' + m[1] + '"') : ''; };
const text = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

(async () => {
  const [out, ...ids] = process.argv.slice(2);
  for (const id of ids) {
    const dir = path.join(out, id); fs.mkdirSync(dir, { recursive: true });
    const meta = JSON.parse((await get(`https://itunes.apple.com/lookup?id=${id}&country=us`)).toString()).results[0];
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
    const h = (await get(meta.trackViewUrl.split("?")[0])).toString();
    const sub = (h.match(/<h2 class="subtitle[^"]*"[^>]*>([^<]*)/) || h.match(/class="subtitle[^"]*"[^>]*>([^<]*)/) || [])[1] || '';
    const iapBlock = (h.match(/In-App Purchases[\s\S]{0,6000}?<\/dl>|In-App Purchases[\s\S]{0,3000}?<\/ul>/) || [''])[0];
    const iaps = [...iapBlock.matchAll(/<(?:span|div|dt|dd)[^>]*>([^<]{2,60})<\/(?:span|div|dt|dd)>/g)].map(m => text(m[1])).filter(Boolean);
    const ver = (h.match(/Version History[\s\S]{0,4000}/) || [''])[0];
    const page = [
      `NAME: ${meta.trackName}`, `SUBTITLE: ${text(sub)}`, `SELLER: ${meta.sellerName}`,
      `GENRES: ${meta.genres.join(', ')} | AGE: ${meta.contentAdvisoryRating} | SIZE: ${(meta.fileSizeBytes / 1e6).toFixed(0)}MB | LANGS: ${meta.languageCodesISO2A.length}`,
      `RELEASED: ${meta.releaseDate} | VERSION: ${meta.version} (${meta.currentVersionReleaseDate})`,
      `RATING: ${meta.averageUserRating} from ${meta.userRatingCount} | PRICE: ${meta.formattedPrice}`,
      `PROMO: ${str(h, 'promotionalText')}`,
      `IN-APP: ${iaps.join(' | ')}`,
      `RELEASE NOTES (current): ${meta.releaseNotes || ''}`,
      `VERSION HISTORY: ${text(ver).slice(0, 1200)}`,
      `\nDESCRIPTION (${meta.description.length} chars):\n${meta.description}`,
    ].join('\n');
    fs.writeFileSync(path.join(dir, 'page.txt'), page);
    const shots = meta.screenshotUrls.map(u => u.replace(/\/[0-9]+x[0-9]+bb\.(jpg|png)$/, '/1290x2796bb.jpg'));
    for (let i = 0; i < shots.length; i++) fs.writeFileSync(path.join(dir, `shot-${i + 1}.jpg`), await get(shots[i]));
    console.log(id, meta.trackName, '| subtitle:', text(sub), '| shots:', shots.length, '| ipad shots:', meta.ipadScreenshotUrls.length);
  }
})();
