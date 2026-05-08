// Adds foco-disclaimer block + HowTo JSON-LD schema to each timer post.
// Idempotent — skips posts that already have both.

const fs = require('fs');
const https = require('https');

const c = fs.readFileSync('.env', 'utf8');
const e = (k) => { const m = c.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; };
const auth = Buffer.from(e('WP_USER') + ':' + e('WP_APP_PASSWORD')).toString('base64');
const HOST = e('WP_HOST');

function req(method, path, body) {
  return new Promise((res, rej) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, port: 443, path, method, headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, response => {
      let d = ''; response.on('data', x => d += x);
      response.on('end', () => { try { res({ s: response.statusCode, b: JSON.parse(d) }); } catch { res({ s: response.statusCode, b: d }); } });
    });
    r.on('error', rej);
    if (payload) r.write(payload);
    r.end();
  });
}

const DISCLAIMER = '<!-- wp:html --><div class="foco-disclaimer" style="margin:32px 0;padding:20px;background:rgba(167,139,250,0.06);border-left:3px solid #A78BFA;border-radius:8px;font-size:14px;color:#B8B0CC;line-height:1.6"><strong>Note.</strong> This article describes a focus tool and the cognitive science behind why it helps people with ADHD start tasks. It is not a substitute for clinical evaluation or treatment. If executive-function challenges are significantly affecting your daily life, please consult a clinician with experience in adult ADHD.</div><!-- /wp:html -->';

function howToSchema(durationMin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': `How to use a ${durationMin}-minute timer for ADHD task initiation`,
    'description': `A 4-step procedure for using a ${durationMin}-minute timer to start and sustain focused work.`,
    'totalTime': `PT${durationMin}M`,
    'tool': [{ '@type': 'HowToTool', 'name': `${durationMin}-minute countdown timer` }],
    'step': [
      { '@type': 'HowToStep', 'position': 1, 'name': 'Pick one specific task', 'text': `Choose a single, specific task — not "be productive" but a defined behavior. Specificity beats general intention for ADHD task initiation.` },
      { '@type': 'HowToStep', 'position': 2, 'name': 'Press Start', 'text': `Click Start on the timer. The countdown ring begins. The visible time externalizes the duration so the prefrontal cortex doesn't have to track it internally.` },
      { '@type': 'HowToStep', 'position': 3, 'name': 'Work until the timer rings', 'text': `Stay with the chosen task until the ${durationMin} minutes complete. If you get distracted, return to the task without self-criticism.` },
      { '@type': 'HowToStep', 'position': 4, 'name': 'Decide what comes next', 'text': `When the timer rings, choose: stop with progress made, run another block, or take a short break.` },
    ],
  };
}

const POSTS = [
  { id: 723, slug: '5-minute-timer-adhd',  duration: 5 },
  { id: 728, slug: '15-minute-timer-adhd', duration: 15 },
  { id: 737, slug: '20-minute-timer-adhd', duration: 20 },
  { id: 742, slug: '25-minute-timer-adhd', duration: 25 },
  { id: 747, slug: '30-minute-timer-adhd', duration: 30 },
];

(async () => {
  for (const p of POSTS) {
    console.log(`\n→ ${p.id} ${p.slug}`);
    const r = await req('GET', `/wp-json/wp/v2/posts/${p.id}?context=edit&_fields=content`);
    if (r.s !== 200) { console.log('  fetch fail', r.s); continue; }
    let html = r.b.content.raw;
    let changes = 0;

    if (!html.includes('foco-disclaimer')) {
      if (html.includes('<h2>References</h2>')) {
        html = html.replace('<h2>References</h2>', DISCLAIMER + '\n\n<h2>References</h2>');
        console.log('  + disclaimer inserted before References');
        changes++;
      } else {
        console.log('  ⚠ no References anchor — disclaimer not inserted');
      }
    } else {
      console.log('  = disclaimer already present');
    }

    if (!html.includes('"HowTo"')) {
      const block = `<!-- wp:html --><script type="application/ld+json">${JSON.stringify(howToSchema(p.duration))}</script><!-- /wp:html -->`;
      html = html + '\n\n' + block;
      console.log(`  + HowTo schema appended (${p.duration}-min)`);
      changes++;
    } else {
      console.log('  = HowTo schema already present');
    }

    if (changes === 0) { console.log('  no changes — skipping push'); continue; }
    const upd = await req('POST', `/wp-json/wp/v2/posts/${p.id}`, { content: html });
    console.log(`  push: ${upd.s === 200 ? '✓' : '✗ ' + upd.s}`);
  }
})();
