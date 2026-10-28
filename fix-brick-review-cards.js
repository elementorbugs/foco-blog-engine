// Visual pass on /brick-app-review/ (2026-10-28): the "Is Brick good for ADHD?" reasons and the JAMA note become cards,
// and "Who should buy Brick?" becomes three pick cards, so no section runs as a wall of text.
// Applies the same guarded find/replace to the local source and the live post (GET -> backup -> POST -> verify).
//   node fix-brick-review-cards.js [--dry]
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
const SLUG = 'brick-app-review';
const LOCAL = path.join(__dirname, 'posts-new', `post-${SLUG}.html`);
const dry = process.argv.includes('--dry');

const card = (bg, border, title, titleColor, body) =>
  `<div style="flex:1 1 200px;background:${bg};border:1px solid ${border};border-radius:16px;padding:18px 20px"><p style="margin:0 0 6px;font-weight:800;color:${titleColor}">${title}</p>${body}</div>`;
const p = t => `<p style="margin:0;font-size:15px;color:#4A4560">${t}</p>`;
const ul = (items, color) => `<ul style="margin:0;padding-left:18px;color:${color};font-size:15px">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const row = cards => `<!-- wp:html -->\n<div style="display:flex;flex-wrap:wrap;gap:14px;margin:24px 0">${cards.join('')}</div>\n<!-- /wp:html -->`;

const EDITS = [
  [`<p>Three things about ADHD explain why a physical lock can work better than a setting:</p>
<ul>
<li><strong>Friction beats willpower.</strong> ADHD involves differences in <strong>executive function</strong>, the brain skills that pause an urge and weigh it against a goal (<a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" target="_blank" rel="noopener">NIMH</a>). Brick doesn't ask you to resist; it makes the feed a walk away.</li>
<li><strong>The feed is built for an ADHD reward system.</strong> Endless new posts deliver quick hits of novelty, the kind of instant reward many people with ADHD find hard to step away from (more in <a href="https://www.tryfoco.com/adhd-and-dopamine/">ADHD and dopamine</a>).</li>
<li><strong>"Just one minute" loses track of time.</strong> With <a href="https://www.tryfoco.com/time-blindness-adhd/">time blindness</a>, a quick check can quietly become an hour, and a locked phone stops the slide before it starts.</li>
</ul>`,
  `<p>Three things about ADHD explain why a physical lock can work better than a setting:</p>
` + row([
    card('#F4F0FB', '#E7E0F5', '1. Friction beats willpower', '#160F22', p(`ADHD involves differences in <strong>executive function</strong>, the brain skills that pause an urge and weigh it against a goal (<a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" target="_blank" rel="noopener">NIMH</a>). Brick doesn't ask you to resist; it makes the feed a walk away.`)),
    card('#F4F0FB', '#E7E0F5', '2. Feeds reward fast', '#160F22', p(`Endless new posts deliver quick hits of novelty, the kind of instant reward many people with ADHD find hard to step away from (more in <a href="https://www.tryfoco.com/adhd-and-dopamine/">ADHD and dopamine</a>).`)),
    card('#F4F0FB', '#E7E0F5', '3. "One minute" becomes an hour', '#160F22', p(`With <a href="https://www.tryfoco.com/time-blindness-adhd/">time blindness</a>, a quick check can quietly stretch out. A locked phone stops the slide before it starts.`)),
  ])],
  [`<p>Research backs the concern, with caveats. A 2018 <a href="https://pubmed.ncbi.nlm.nih.gov/30027248/" target="_blank" rel="noopener">JAMA study of 2,587 teens</a> found a modest link between frequent digital media use and later ADHD symptoms, and its authors say more work is needed to know whether one causes the other.</p>`,
  `<!-- wp:html -->
<div style="display:flex;gap:16px;align-items:flex-start;background:#FFFFFF;border:1px solid #E7E0F5;border-left:5px solid #7C3AED;border-radius:14px;padding:18px 20px;margin:24px 0"><div style="flex:none;font-size:30px;font-weight:800;color:#7C3AED;line-height:1">2,587</div><div><p style="margin:0 0 4px;font-weight:800;color:#160F22">teens followed for 2 years</p><p style="margin:0;font-size:15px;color:#4A4560">A 2018 <a href="https://pubmed.ncbi.nlm.nih.gov/30027248/" target="_blank" rel="noopener">JAMA study</a> found a modest link between frequent digital media use and later ADHD symptoms. Its authors say more work is needed to know whether one causes the other.</p></div></div>
<!-- /wp:html -->`],
  [`<p><strong>Buy Brick if:</strong></p>
<ul>
<li>You've deleted and reinstalled the same apps more times than you can count.</li>
<li>Software blockers last a day before you switch them off.</li>
<li>You'd rather pay once than keep another subscription.</li>
</ul>
<p><strong>Look elsewhere if:</strong></p>
<ul>
<li>Your laptop is the bigger distraction.</li>
<li>You lose small objects often, since the puck has to stay findable.</li>
<li>You only need a gentle nudge, which free apps like ScreenZen and one sec give you.</li>
</ul>
<p><strong>Add FOCO if:</strong></p>
<ul>
<li>The phone is away and the task still won't start.</li>
<li>You want AI to break it into small steps, put them in your day and stay with you while you focus.</li>
<li>You're fine with a paid app, $59 a year with a 7-day free trial or $9 a month, on iPhone or Android.</li>
</ul>`,
  row([
    card('#EFFAF3', '#CBEBD6', 'Buy Brick if', '#14532D', ul([
      "You've deleted and reinstalled the same apps more times than you can count.",
      'Software blockers last a day before you switch them off.',
      "You'd rather pay once than keep another subscription."], '#1F3B2B')),
    card('#FDF1EC', '#F5D5C7', 'Look elsewhere if', '#7C2D12', ul([
      'Your laptop is the bigger distraction.',
      'You lose small objects often, since the puck has to stay findable.',
      'You only need a gentle nudge, which free apps like ScreenZen and one sec give you.'], '#4A2416')),
    card('#F4F0FB', '#D9CCF5', 'Add FOCO if', '#4C1D95', ul([
      "The phone is away and the task still won't start.",
      'You want AI to break it into small steps, put them in your day and stay with you while you focus.',
      "You're fine with a paid app, $59 a year with a 7-day free trial or $9 a month, on iPhone or Android."], '#2E1A5C')),
  ])],
];

const apply = (s, label) => {
  for (const [find, to] of EDITS) {
    const c = s.split(find).length - 1;
    if (c !== 1) { console.error(`ABORT ${label}: guard x${c}: ${find.slice(0, 60)}`); process.exit(1); }
    s = s.replace(find, () => to);
  }
  if (/—/.test(s)) { console.error(`ABORT ${label}: em dash`); process.exit(1); }
  return s;
};

const api = (p, opt = {}) => fetch(BASE + p, { ...opt, headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...(opt.headers || {}) } });

(async () => {
  const local = apply(fs.readFileSync(LOCAL, 'utf8'), 'local');
  const post = (await (await api(`/wp-json/wp/v2/posts?slug=${SLUG}&context=edit&_=${Math.random()}`)).json())[0];
  const live = apply(post.content.raw, 'live');
  if (dry) { console.log('dry run OK: both guards match'); return; }
  fs.writeFileSync(LOCAL, local);
  fs.mkdirSync(path.join(__dirname, '.audit-cache', 'backups'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '.audit-cache', 'backups', `${post.id}-pre-brick-cards-${Date.now()}.html`), post.content.raw);
  const r = await api(`/wp-json/wp/v2/posts/${post.id}`, { method: 'POST', body: JSON.stringify({ content: live }) });
  const fresh = (await (await api(`/wp-json/wp/v2/posts?slug=${SLUG}&context=edit&_=${Math.random()}`)).json())[0].content.raw;
  console.log(`HTTP ${r.status} | cards live: ${fresh.includes('2,587</div>') && fresh.includes('Add FOCO if</p>')}`);
})();
