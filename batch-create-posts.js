// Batches all posts-new files through create-post.js
// Title overrides where H1 > 58 chars; pillar flag for the 3 pillars in posts-new
const { execSync } = require('child_process');
const path = require('path');

// Map: slug → { keyword, title (if H1>58), pillar }
const POSTS = [
  // Pillars (3 in posts-new)
  { slug: 'adhd-task-paralysis', kw: 'adhd task paralysis', title: 'ADHD Task Paralysis: Why You Can\'t Start', pillar: true },
  { slug: 'adhd-executive-function', kw: 'adhd executive function', pillar: true },
  { slug: 'how-to-focus-with-adhd', kw: 'how to focus with adhd', pillar: true },

  // Spokes — H1 ≤ 58 (no title override needed)
  { slug: 'adhd-diagnostic-codes', kw: 'adhd diagnostic codes' },
  { slug: 'emotional-regulation-adhd', kw: 'adhd emotional regulation' },
  { slug: 'adhd-vs-ocd', kw: 'adhd vs ocd' },
  { slug: 'best-productivity-apps-for-adhd', kw: 'productivity apps for adhd' },
  { slug: '2-minute-rule-adhd', kw: '2 minute rule adhd' },
  { slug: 'adhd-or-add', kw: 'adhd or add' },
  { slug: 'adhd-vs-autism', kw: 'adhd vs autism' },
  { slug: 'brown-noise-adhd', kw: 'brown noise adhd' },
  { slug: 'task-initiation-deficit-explained', kw: 'task initiation deficit' },
  { slug: 'russell-barkley-executive-function-model', kw: 'russell barkley executive function' },
  { slug: 'adhd-transitions', kw: 'adhd transitions' },

  // Spokes — H1 > 58 (need title override)
  { slug: 'adhd-vs-add', kw: 'adhd vs add', title: 'ADHD vs ADD: 5 Symptom Differences That Matter' },
  { slug: 'body-doubling-adhd', kw: 'body doubling adhd', title: 'Body Doubling for ADHD: Why It Works' },
  { slug: 'time-blindness-adhd', kw: 'adhd time blindness', title: 'ADHD Time Blindness: Why Time Feels Different' },
  { slug: 'adhd-and-dopamine', kw: 'adhd and dopamine', title: 'ADHD and Dopamine: The Real Reason Your Brain Won\'t' },
  { slug: 'adhd-task-initiation-research', kw: 'adhd task initiation research', title: 'ADHD Task Initiation: 30 Years of Research' },
  { slug: 'hyperfocus-adhd', kw: 'adhd hyperfocus', title: 'ADHD Hyperfocus: Why You Lock On for 8 Hours' },
  { slug: 'procrastination-vs-paralysis', kw: 'procrastination vs task paralysis', title: 'Procrastination vs Task Paralysis: How to Tell' },
  { slug: 'executive-function-skills-list', kw: 'executive function skills', title: '7 Executive Function Skills (And How ADHD Affects)' },
  { slug: 'pomodoro-for-adhd', kw: 'pomodoro for adhd', title: 'The Pomodoro Technique for ADHD: Why It Works' },
  { slug: 'working-memory-adhd', kw: 'working memory adhd', title: 'Working Memory and ADHD: Why You Walk Into Rooms' },
  { slug: 'adhd-and-anxiety', kw: 'adhd and anxiety', title: 'ADHD and Anxiety: Why They Travel Together' },
  { slug: 'adhd-and-depression', kw: 'adhd and depression', title: 'ADHD and Depression: Why ADHD Adults Get Depressed 3x' },
];

const results = [];
const errors = [];

for (let i = 0; i < POSTS.length; i++) {
  const p = POSTS[i];
  process.stdout.write(`\n[${i + 1}/${POSTS.length}] ${p.slug}: `);
  const args = [
    'create-post.js',
    `posts-new/post-${p.slug}.html`,
    `--keyword=${JSON.stringify(p.kw)}`,
  ];
  if (p.title) args.push(`--title=${JSON.stringify(p.title)}`);
  if (p.pillar) args.push('--pillar');
  const cmd = `node ${args.join(' ')}`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    // Extract post ID and chart count
    const idMatch = out.match(/Post ID:\s+(\d+)/);
    const chartMatch = out.match(/Charts:\s+(\d+)/);
    const featMatch = out.match(/Featured:\s+media #(\d+)/);
    process.stdout.write(`✓ id=${idMatch?.[1] || '?'} charts=${chartMatch?.[1] || '0'} cover=${featMatch?.[1] || 'none'}`);
    results.push({ slug: p.slug, id: idMatch?.[1], charts: chartMatch?.[1], cover: featMatch?.[1] });
  } catch (e) {
    const msg = (e.stdout || e.message || '').slice(-300);
    process.stdout.write(`✗ FAILED`);
    errors.push({ slug: p.slug, error: msg });
  }
}

console.log(`\n\n=== SUMMARY ===`);
console.log(`Success: ${results.length}/${POSTS.length}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  ${e.slug}: ${e.error.split('\n').slice(-3).join('\n').slice(0, 200)}`));
}
require('fs').writeFileSync('batch-results.json', JSON.stringify({ results, errors }, null, 2));
console.log('\nFull results: batch-results.json');
