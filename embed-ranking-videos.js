// Embeds the two 2026-10-18 YouTube ranking videos in their matching posts, each with a VideoObject (+ chapter Clips)
// so Google can show the video and key moments in search:
//   Y4Arp3c5Me4 "ADHD Apps That Actually Work" -> best-apps-for-adhd-task-paralysis (4315), before "1. FOCO"
//   KHYMe32G4yo "I Tested 8 ADHD Planner Apps"  -> best-adhd-planner (762), after the comparison table
//   VvfBtlBEsP4 "Tiimo vs Structured"           -> tiimo-vs-structured (4411), after the at-a-glance table
//   fEzsET47x1E "Goblin Tools vs Tiimo"         -> goblin-tools-vs-tiimo (4407), after the at-a-glance table
//   a4MsXHYD6y4 "Tiimo vs TickTick"             -> tiimo-vs-ticktick (4916), after the at-a-glance table
//   SKnYBA2szPE "Tiimo vs Todoist"             -> tiimo-vs-todoist (4929), after the at-a-glance table (added 2026-10-19)
// GET -> guarded insert -> POST -> verify, with backups.   node embed-ranking-videos.js
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
const sleep = ms => new Promise(r => setTimeout(r, ms));

const embed = (id, title, caption) => `<!-- wp:html -->
<figure style="margin:28px 0">
<iframe width="100%" height="360" style="border-radius:14px;border:1px solid rgba(167,139,250,0.18);aspect-ratio:16/9;height:auto" src="https://www.youtube.com/embed/${id}" title="${title}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
<figcaption style="font-size:13px;color:#B8B0CC;text-align:center;margin-top:8px;font-style:italic;opacity:0.75">${caption} | <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube</a></figcaption>
</figure>
<!-- /wp:html -->

`;
const video = (id, name, description, uploadDate, seconds, clips) => {
  const url = `https://www.youtube.com/watch?v=${id}`;
  const obj = {
    '@context': 'https://schema.org', '@type': 'VideoObject', name, description,
    thumbnailUrl: [`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
    uploadDate, duration: `PT${Math.floor(seconds / 60)}M${seconds % 60}S`, embedUrl: `https://www.youtube.com/embed/${id}`, url,
    publisher: { '@type': 'Organization', name: 'FOCO', logo: { '@type': 'ImageObject', url: 'https://tryfoco.com/wp-content/uploads/2026/05/foco-logo-mark.png' } },
    hasPart: clips.map(([n, start, end]) => ({ '@type': 'Clip', name: n, startOffset: start, endOffset: end, url: `${url}&t=${start}s` })),
  };
  return `<!-- wp:html --><script type="application/ld+json">${JSON.stringify(obj)}</script><!-- /wp:html -->\n\n`;
};
const ARTICLE = '<!-- wp:html --><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"';

const PLAN = {
  4315: {
    id: 'Y4Arp3c5Me4',
    anchor: '<h2 id="foco">1. FOCO',
    block: embed('Y4Arp3c5Me4', 'ADHD Apps That Actually Work (Ranked, Starting With #1)', 'Video: 8 ADHD apps ranked by one question, does it help you start?'),
    schema: video('Y4Arp3c5Me4', 'ADHD Apps That Actually Work (Ranked, Starting With #1)',
      'Eight ADHD apps ranked by one question: does it help you start? FOCO, Goblin Tools, Llama Life, Tiimo, Structured, Sunsama, Motion and Todoist, with #1 first.',
      '2026-10-18T07:40:35-07:00', 151,
      [['Why #1 comes first', 0, 21], ['#1 FOCO', 21, 61], ['We lost you', 61, 72], ['#2 Goblin Tools', 72, 86], ['#3 Llama Life', 86, 96], ['#4 Tiimo', 96, 108], ['#5 Structured', 108, 121], ['Speed round: #6 to #8', 121, 140], ['Start with #1', 140, 151]]),
  },
  762: {
    id: 'KHYMe32G4yo',
    anchor: '<h2 id="why-fail">',
    block: embed('KHYMe32G4yo', 'I Tested 8 ADHD Planner Apps - Here\'s the Best One!', 'Video: 8 ADHD planner apps, sorted by where you get stuck'),
    schema: video('KHYMe32G4yo', 'I Tested 8 ADHD Planner Apps - Here\'s the Best One!',
      'Eight ADHD planner apps sorted by where you get stuck: seeing your day (Structured, Tiimo), starting (FOCO, Goblin Tools), drifting mid-task (Llama Life), and forgetting or overplanning (Todoist, Sunsama, Motion).',
      '2026-10-18T07:29:59-07:00', 404,
      [['Where do you get stuck?', 0, 27], ['Structured', 30, 72], ['Tiimo', 72, 113], ['FOCO', 116, 184], ['Goblin Tools', 184, 210], ['Llama Life', 214, 258], ['Todoist', 263, 296], ['Sunsama', 296, 327], ['Motion', 327, 359], ['Feature table', 359, 367], ['Which one is yours?', 367, 404]]),
  },
  4411: {
    id: 'VvfBtlBEsP4',
    anchor: '<h2>What do the two apps actually look like?',
    // this post has no Article schema: the VideoObject goes right after its FAQ/ItemList ld+json block
    schemaAfter: '</script>\n<!-- /wp:html -->',
    block: embed('VvfBtlBEsP4', 'Tiimo vs Structured: Which ADHD Planner Is Actually Better?', 'Video: Tiimo vs Structured in 5 rounds, plus the bonus round'),
    schema: video('VvfBtlBEsP4', 'Tiimo vs Structured: Which ADHD Planner Is Actually Better?',
      'Tiimo vs Structured in five rounds: seeing your day, built for ADHD, AI planning, staying with the task and overplanning. Tiimo edges it 3 to 2, so pick the one built for your problem.',
      '2026-10-18T08:26:13-07:00', 173,
      [['The answer in 10 seconds', 0, 21], ['Round 1: Seeing your day', 21, 44], ['Round 2: Built for ADHD', 44, 66], ['Round 3: AI planning', 66, 89], ['Round 4: Staying with the task', 89, 105], ['Round 5: Overplanning', 105, 121], ['The score', 121, 128], ['Bonus round: the moment you freeze', 128, 141], ["FOCO, for when you can't start", 141, 158], ['Which one should you pick?', 158, 173]]),
  },
  4916: {
    id: 'a4MsXHYD6y4',
    anchor: '<h2>What do the two apps actually look like?',
    // pushed from a local Windows file, so its ld+json block closes with CRLF
    schemaAfter: '</script>\r\n<!-- /wp:html -->',
    block: embed('a4MsXHYD6y4', 'Tiimo vs TickTick: Which ADHD Planner App Is Better?', 'Video: Tiimo vs TickTick in 5 rounds, plus the bonus round'),
    schema: video('a4MsXHYD6y4', 'Tiimo vs TickTick : Which ADHD Planner App Is Better?',
      'Tiimo vs TickTick in five rounds: built for ADHD, seeing your day, everything in one place, staying focused and devices. Two rounds each and a tie, so pick the one built for your problem.',
      '2026-10-18T10:47:29-07:00', 169,
      [['The answer in 10 seconds', 0, 21], ['Round 1: Built for ADHD', 21, 42], ['Round 2: Seeing your day', 42, 61], ['Round 3: Everything in one place', 61, 80], ['Round 4: Staying focused', 80, 96], ['Round 5: Works on every device', 96, 116], ['The score', 116, 122], ['Bonus round: the moment you freeze', 122, 136], ["FOCO, for when you can't begin", 136, 154], ['Which one should you pick?', 154, 169]]),
  },
  4929: {
    id: 'SKnYBA2szPE',
    anchor: '<h2>Which one is built for ADHD?</h2>',
    // pushed from a local Windows file, so its ld+json block closes with CRLF
    schemaAfter: '</script>\r\n<!-- /wp:html -->',
    block: embed('SKnYBA2szPE', 'Tiimo vs Todoist for ADHD: Which Planner App Is Actually Better?', 'Video: Tiimo vs Todoist in 5 rounds, plus the bonus round'),
    // chapter times from the Versus timeline (vo.json + engine pads), total 168.27s vs YouTube's 168s
    schema: video('SKnYBA2szPE', 'Tiimo vs Todoist for ADHD: Which Planner App Is Actually Better?',
      'Tiimo vs Todoist in five rounds: getting tasks out of your head, seeing your day, staying on task, big projects and your calendar. Todoist wins 3 to 2, but if time is your problem, Tiimo wins the rounds that matter.',
      '2026-10-19T06:39:21-07:00', 168,
      [['The answer in 10 seconds', 0, 21], ['Round 1: Getting tasks out of your head', 21, 43], ['Round 2: Seeing your day', 43, 63], ['Round 3: Staying on task', 63, 80], ['Round 4: Big projects', 80, 99], ['Round 5: Your calendar', 99, 115], ['The score', 115, 122], ['Bonus round: the moment you freeze', 122, 136], ["FOCO, for when you can't begin", 136, 154], ['Which one should you pick?', 154, 168]]),
  },
  4407: {
    id: 'fEzsET47x1E',
    anchor: '<h2>What happened when we gave Goblin Tools a real task?',
    schemaAfter: '</script>\n<!-- /wp:html -->',
    block: embed('fEzsET47x1E', 'Goblin Tools vs Tiimo: Which ADHD App Actually Helps?', 'Video: Goblin Tools vs Tiimo in 5 rounds, plus the bonus round'),
    schema: video('fEzsET47x1E', 'Goblin Tools vs Tiimo: Which ADHD App Actually Helps?',
      'Goblin Tools vs Tiimo in five rounds: breaking down a stuck task, planning your whole day, staying on task, setup and routines. Tiimo wins on points, but if you are stuck on one task right now, Goblin Tools wins the round that matters.',
      '2026-10-18T09:12:43-07:00', 161,
      [['The answer in 10 seconds', 0, 20], ['Round 1: Breaking down a stuck task', 20, 43], ['Round 2: Planning your whole day', 43, 60], ['Round 3: Staying on task', 60, 78], ['Round 4: Setup before you start', 78, 95], ['Round 5: Routines and reminders', 95, 110], ['The score', 110, 118], ['Bonus round: you have the steps and still freeze', 118, 128], ["FOCO, for when you can't begin", 128, 146], ['Which one should you pick?', 146, 161]]),
  },
};

const get = async id => (await (await fetch(BASE + `/wp-json/wp/v2/posts/${id}?context=edit&_=` + Math.random(), { headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' } })).json()).content.raw;

(async () => {
  for (const [postId, p] of Object.entries(PLAN)) {
    const live = await get(postId);
    if (live.includes(`youtube.com/embed/${p.id}`)) { console.log(`${postId}: SKIP already embedded`); continue; }
    const schemaAt = p.schemaAfter || ARTICLE;
    for (const a of [p.anchor, schemaAt]) {
      const c = live.split(a).length - 1;
      if (c !== 1) { console.error(`${postId}: ABORT guard x${c}: ${a.slice(0, 60)}`); process.exit(1); }
    }
    const withEmbed = live.replace(p.anchor, p.block + p.anchor);
    const next = p.schemaAfter ? withEmbed.replace(p.schemaAfter, p.schemaAfter + '\n\n' + p.schema.trimEnd()) : withEmbed.replace(ARTICLE, p.schema + ARTICLE);
    fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${postId}-pre-video-embed-${Date.now()}.html`), live);
    const r = await fetch(BASE + `/wp-json/wp/v2/posts/${postId}`, { method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }) });
    await sleep(2500);
    const fresh = await get(postId);
    console.log(`${postId}: HTTP ${r.status} | embed: ${fresh.includes(`youtube.com/embed/${p.id}`)} | schema: ${(fresh.match(new RegExp(`"embedUrl":"https://www.youtube.com/embed/${p.id}"`, 'g')) || []).length}`);
  }
})();
