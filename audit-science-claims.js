// Flags medical / neurological sentences that carry no source, across the six
// pages Adi named. Classifies each into the register it is actually written in:
//
//   RESEARCH   a factual claim about studies, brains, prevalence, mechanism
//   MECHANISM  a causal explanation stated as fact ("X happens because Y")
//   REPORTED   lived experience, correctly hedged
//   SURVEY     a finding from FOCO's own n=194 data
//   PRODUCT    a claim about what FOCO does
//
// A sentence is "unsourced" when its own paragraph carries no outbound citation
// and no hedge. Those are the ones that have to change.
//   node audit-science-claims.js [--full]
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const BASE = 'https://' + env.WP_HOST.replace(/^https?:\/\//, '');
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const TARGETS = [
  ['posts', 42,   'adhd-task-paralysis'],
  ['posts', 112,  'adhd-task-initiation-research'],
  ['pages', 106,  'adhd-glossary'],
  ['posts', 52,   'procrastination-vs-paralysis'],
  ['posts', 65,   'body-doubling-adhd'],
  ['posts', 170,  'time-blindness-adhd'],
];

// hard neuro / clinical vocabulary: if a sentence uses these it is making a
// scientific claim whether or not it means to
const SCIENCE = /\b(dopamine|dopaminergic|norepinephrine|neurotransmitter|prefrontal|cortex|cortical|amygdala|basal ganglia|striatum|neural|neurologic\w*|neurobiolog\w*|brain (?:scan|imaging|circuit|region|chemistry|structure)|fMRI|executive (?:function|dysfunction) (?:is|are|involves)|working memory (?:is|deficit)|receptor|synap\w+|myelin|frontal lobe|default mode network|reward (?:pathway|circuit|system)|nervous system|cognitive load theory|dysregulat\w+)\b/i;
// quantified or prevalence claims
const QUANT = /\b\d{1,3}(?:\.\d+)?\s?(?:%|percent|times more|x more)\b|\b(?:most|majority of|nearly all|almost all) (?:people|adults|children|ADHD)\b/i;
// absolutes that are unsafe in YMYL
const ABSOLUTE = /\b(?:always|never|proven|proves|scientifically proven|guarantee[sd]?|cure[sd]?|will fix|eliminates?)\b/i;

// a citation or a hedge anywhere in the same paragraph downgrades severity
const CITED = /<a [^>]*href="https?:\/\/(?!(?:www\.)?tryfoco\.com)/i;
const HEDGE = /\b(?:research suggests|studies suggest|evidence suggests|appears to|is thought to|is associated with|may |might |can |often |tends? to|one (?:model|explanation|theory)|commonly (?:described|reported)|widely (?:used|described)|not a (?:formal|clinical) diagnosis|clinical(?:ly)? (?:observation|term))\b/i;

const FULL = process.argv.includes('--full');

const get = async (t, id) => {
  const r = await fetch(BASE + '/wp-json/wp/v2/' + t + '/' + id + '?context=edit&_=' + Math.random(), {
    headers: { Authorization: AUTH, 'Cache-Control': 'no-cache' },
  });
  const p = await r.json();
  return p.content.raw !== undefined ? p.content.raw : p.content.rendered;
};

const strip = s => s.replace(/<[^>]+>/g, '').replace(/&#8217;|&#039;/g, "'").replace(/&amp;/g, '&').replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function classify(sent) {
  if (/\bFOCO\b/.test(sent)) return 'PRODUCT';
  if (/survey|n\s?=\s?194|194 adults|respondents/i.test(sent)) return 'SURVEY';
  if (SCIENCE.test(sent)) return 'RESEARCH';
  if (QUANT.test(sent)) return 'RESEARCH';
  if (/\bbecause\b|\bwhich is why\b|\bthe reason\b|\bcauses?\b/i.test(sent)) return 'MECHANISM';
  return 'REPORTED';
}

(async () => {
  const report = [];
  let totalFlag = 0;

  for (const [type, id, slug] of TARGETS) {
    const raw = await get(type, id);
    // work paragraph by paragraph so a citation in the paragraph counts
    const paras = [...raw.matchAll(/<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map(m => ({ tag: m[1].toLowerCase(), html: m[2] }))
      .filter(p => strip(p.html).length > 25);

    const refCount = (raw.match(/<li><a [^>]*href="https?:\/\/(?!(?:www\.)?tryfoco)/g) || []).length;
    const flags = [];

    for (const p of paras) {
      const cited = CITED.test(p.html);
      const text = strip(p.html);
      for (const sent of text.split(/(?<=[.!?])\s+(?=[A-Z"“])/)) {
        if (sent.length < 30) continue;
        const sci = SCIENCE.test(sent), qty = QUANT.test(sent), abs = ABSOLUTE.test(sent);
        if (!sci && !qty && !abs) continue;
        const hedged = HEDGE.test(sent);
        // severity: an unhedged, uncited hard-science or absolute claim is the problem
        let sev = null;
        if (abs && !hedged) sev = 'HIGH';
        else if ((sci || qty) && !cited && !hedged) sev = 'HIGH';
        else if ((sci || qty) && !cited && hedged) sev = 'LOW';
        if (!sev) continue;
        flags.push({ sev, kind: classify(sent), sent, tag: p.tag });
      }
    }
    flags.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === 'HIGH' ? -1 : 1));
    totalFlag += flags.filter(f => f.sev === 'HIGH').length;
    report.push({ slug, id, refCount, paras: paras.length, flags });
  }

  for (const r of report) {
    const hi = r.flags.filter(f => f.sev === 'HIGH');
    const lo = r.flags.filter(f => f.sev === 'LOW');
    console.log('\n' + '='.repeat(78));
    console.log('/' + r.slug + '/  (#' + r.id + ')   external refs on page: ' + r.refCount);
    console.log('  unhedged + uncited: ' + hi.length + '    hedged but uncited: ' + lo.length);
    console.log('='.repeat(78));
    for (const f of (FULL ? r.flags : hi)) {
      console.log('  [' + f.sev.padEnd(4) + '] ' + f.kind.padEnd(9) + ' ' + f.sent.slice(0, 165));
    }
    if (!hi.length && !FULL) console.log('  nothing unhedged and uncited');
  }
  console.log('\n' + '-'.repeat(78));
  console.log('TOTAL unhedged + uncited scientific claims across the six pages: ' + totalFlag);
  if (!FULL) console.log('Run with --full to also list the hedged-but-uncited ones.');
})();
