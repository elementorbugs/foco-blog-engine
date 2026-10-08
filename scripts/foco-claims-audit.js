// Scans every published post/page for FOCO claims that contradict the confirmed product facts.
// Facts: manual tasks free; AI breakdown + AI chat paid ($9/mo or $59/yr); iOS + Android only (no web app);
// built-in calendar (no external calendar sync); breakdown is a one-tap choice; body doubling = AI companion.
const fs = require('fs'), https = require('https');
for (const l of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const { WP_HOST, WP_USER, WP_APP_PASSWORD } = process.env;
const auth = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const get = p => new Promise(r => https.get({ hostname: WP_HOST, path: p, headers: { Authorization: 'Basic ' + auth } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => r(JSON.parse(d))) }));

const RULES = [
  ['free-tier-breakdown', /FOCO[^.<]{0,120}free (tier|plan|version)[^.<]{0,120}(breakdown|break[s]? (it|tasks?) (down|into))|free (tier|plan|version)[^.<]{0,60}FOCO[^.<]{0,120}(breakdown|initiation)/i],
  ['foco-free-tier-generic', /FOCO('s|&#8217;s|’s)? (has a |offers a |)(real |generous |)free (tier|plan)|FOCO is free\b(?! for creating)|free forever/i],
  ['web-app', /FOCO[^.<]{0,80}(web app|web version|in (your|the) browser|on the web)|(iOS|Android)[, ]+(and |)(Web|web)\b[^<]{0,20}<\/td>/],
  ['not-planner-calendar', /FOCO[^.<]{0,60}(is not a (planner|calendar)|isn't a (planner|calendar)|not a planner|not a calendar|doesn't (have|include) a calendar|no calendar)|pair (it|FOCO) with (a |Google )?[Cc]alendar/],
  ['body-doubling-unqualified', /FOCO[^.<]{0,100}body.doubling(?![^.<]{0,60}(AI|companion|character))/i],
  ['real-people', /FOCO[^.<]{0,150}(real people|other users|live (session|feed|room)|co-working room|video session)/i],
  ['five-steps-auto', /(breaks? (it|tasks?|any task) into|gives you) (5|five) (tiny |small |)(first |)steps/i],
  ['wrong-price', /FOCO[^.<]{0,120}\$(19\.99|99|4\.99|7\.99|14\.99)\b|\$(19\.99|99)(\/| a | per )(mo|month|yr|year)[^.<]{0,60}FOCO/i],
  ['soft-checkins', /soft check-ins/i],
  ['motion-price', /Motion[^.<]{0,120}\$19\b/i],
];

(async () => {
  const hits = {};
  for (const t of ['posts', 'pages']) for (let p = 1; p < 6; p++) {
    const r = await get(`/wp-json/wp/v2/${t}?status=publish&per_page=100&page=${p}&context=edit&_fields=id,slug,content`);
    if (!Array.isArray(r) || !r.length) break;
    for (const post of r) {
      const text = post.content.raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ');
      for (const [name, re] of RULES) {
        const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        let m; while ((m = g.exec(text))) {
          const ctx = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
          (hits[post.slug] = hits[post.slug] || { id: post.id, t, items: [] }).items.push([name, ctx]);
        }
      }
    }
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(hits, null, 1));
  const slugs = Object.keys(hits);
  const byRule = {}; slugs.forEach(s => hits[s].items.forEach(([n]) => byRule[n] = (byRule[n] || 0) + 1));
  console.log('pages with issues:', slugs.length, '| by rule:', JSON.stringify(byRule));
  slugs.sort((a, b) => hits[b].items.length - hits[a].items.length).forEach(s => {
    console.log(`\n## ${s} (${hits[s].t} ${hits[s].id}) - ${hits[s].items.length}`);
    hits[s].items.slice(0, 6).forEach(([n, c]) => console.log(`  [${n}] ...${c.slice(0, 230)}...`));
  });
})();
