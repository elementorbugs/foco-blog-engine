// chart-configs.js
// Per-slug chart definitions. The pipeline (create-post.js / rebuild-charts.js)
// reads this file as the SOURCE OF TRUTH for which charts go in which post and
// where they're inserted (pos N = before the Nth <h2> in the body).
//
// To update a chart in a published post: edit here, then run
//   node rebuild-charts.js <slug>
// which strips existing foco-chart figures and re-injects fresh.

const K = require('./chart-kit');

module.exports = {

  // ── SPOKE: Pomodoro for ADHD (under P3) ────────────────────────────────
  'pomodoro-for-adhd': {
    postId: null,
    file: 'post-pomodoro-for-adhd.html',
    pexelsPlans: [
      { query: 'kitchen timer minimal desk modern',         anchor: '<h2>What is the Pomodoro Technique?</h2>' },
      { query: 'focused person headphones writing laptop',  anchor: '<h2>How do you actually use Pomodoro?</h2>' },
      { query: 'morning coffee notebook routine planning',  anchor: '<h2>What if 25 minutes feels wrong?</h2>' },
      { query: 'apps phone screen productivity tools',      anchor: '<h2>Are there good Pomodoro apps for ADHD?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.progressTimeline({
        title: 'The Standard Pomodoro Cycle',
        caption: 'Repeat 4 times, then take a 15-30 minute long break. Sustainability beats intensity.',
        steps: [
          { label: '25 min',  sub: 'Focused single-task work' },
          { label: '5 min',   sub: 'Real break — no phone' },
          { label: '×4',      sub: 'Repeat for one set' },
          { label: '15-30',   sub: 'Long recovery break' },
        ],
      }) },
      { pos: 3, html: K.infographicList({
        title: 'Why Pomodoro Works for ADHD',
        caption: '4 specific mechanisms — none of them require willpower.',
        items: [
          { icon: '⏱️', label: 'Bounded time',     value: 'Brain commits to 25, not "all day"' },
          { icon: '☕', label: 'Guaranteed break', value: "You're scheduling rest, not denying it" },
          { icon: '🎯', label: 'External pacing',  value: 'Timer compensates for time blindness' },
          { icon: '🔄', label: 'Dopamine reset',   value: 'New pomodoro = small novelty hit' },
        ],
      }) },
      { pos: 4, html: K.statGrid({
        title: 'Common Pomodoro Variants',
        caption: 'The 25/5 split is standard. Adjust to fit your brain — the principle is what matters.',
        stats: [
          { value: '15/5',  label: 'For bad days, fatigue, or just-diagnosed ADHD' },
          { value: '25/5',  label: 'Standard — works for most ADHD adults' },
          { value: '50/10', label: 'For deep work + experienced focus' },
          { value: '90/15', label: 'For ultradian-rhythm advanced users' },
        ],
      }) },
      { pos: 5, html: K.infographicList({
        title: '4 Mistakes That Kill Pomodoro for ADHD',
        caption: 'Almost every "it didn\'t work" comes down to one of these.',
        items: [
          { icon: '⏭️', label: 'Skip the break',      value: 'Burnout by mid-afternoon' },
          { icon: '📱', label: 'Phone during break',   value: 'Different work, not rest' },
          { icon: '🧺', label: 'Multiple tasks/pomo',  value: 'None get done well' },
          { icon: '🎭', label: 'Productivity theater', value: 'Looking busy ≠ doing it' },
        ],
      }) },
    ],
  },

  // ── SPOKE: ADHD Hyperfocus (under P3) ──────────────────────────────────
  'hyperfocus-adhd': {
    postId: null,
    file: 'post-hyperfocus-adhd.html',
    pexelsPlans: [
      { query: 'person deeply focused laptop late night',     anchor: '<h2>What is hyperfocus?</h2>' },
      { query: 'gamer focused screen intense concentration',  anchor: '<h2>How is hyperfocus possible if ADHD is an attention disorder?</h2>' },
      { query: 'morning routine coffee focused planning',     anchor: '<h2>How do you channel hyperfocus instead of being controlled by it?</h2>' },
      { query: 'tired exhausted person rest break recovery',  anchor: '<h2>How do you safely come out of hyperfocus?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.infographicList({
        title: 'The Signature Features of Hyperfocus',
        caption: 'If most of these felt familiar, you have firsthand experience with ADHD hyperfocus.',
        items: [
          { icon: '⏰', label: 'Time disappears',     value: 'What felt like 30 min was 4 hours' },
          { icon: '🍽️', label: 'Hunger stops',       value: 'Forgot to eat for 8+ hours' },
          { icon: '📵', label: 'Phone ignored',       value: 'Texts, calls — invisible' },
          { icon: '😵', label: 'Coming out is jarring', value: 'Sudden re-entry to the world' },
        ],
      }) },
      { pos: 3, html: K.stackedCompare({
        title: 'Same Brain, Two Modes',
        leftLabel: 'Boring task',
        rightLabel: 'Interesting task',
        source: 'Volkow et al., JAMA (2009); Barkley executive function research',
        caption: 'ADHD attention isn\'t broken — it\'s deeply unevenly distributed. The same brain that hyperfocuses for 8 hours can fail to start a 5-minute task. The variable is dopamine, not willpower.',
        segments: [
          { label: 'Dopamine generated',     left: 15, right: 92 },
          { label: 'Focus available',        left: 18, right: 88 },
          { label: 'Time you can sustain',   left: 8,  right: 95 },
          { label: 'How easy to start',      left: 12, right: 90 },
        ],
      }) },
      { pos: 4, html: K.progressTimeline({
        title: 'Channeling Hyperfocus: The 5-Step Plan',
        caption: 'You can\'t summon hyperfocus on demand, but you can stack conditions to make it more likely to land on what matters.',
        steps: [
          { label: 'Pre-block',  sub: 'Calendar-protect 1-2 hours/day' },
          { label: 'Time it',    sub: 'Schedule when dopamine peaks' },
          { label: 'Gamify',     sub: 'Make boring tasks novel' },
          { label: 'Interrupt',  sub: 'External alarms + people' },
          { label: 'Recover',    sub: 'Plan rest day after' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Brown Noise for ADHD (under P3) ─────────────────────────────
  'brown-noise-adhd': {
    postId: null,
    file: 'post-brown-noise-adhd.html',
    pexelsPlans: [
      { query: 'headphones person focused desk minimal',     anchor: '<h2>What is brown noise?</h2>' },
      { query: 'noise canceling headphones over ear modern', anchor: '<h2>How do you actually use brown noise?</h2>' },
      { query: 'phone music app screen settings',            anchor: '<h2>What about coloured noise apps?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.statGrid({
        title: 'How the Noise Spectrum Compares',
        caption: 'Most ADHD adults who experiment end up preferring brown — the depth feels grounding, not sharp.',
        stats: [
          { value: 'White', label: 'Equal frequencies — hissy, harsh' },
          { value: 'Pink',  label: 'Lightly weighted lower — softer' },
          { value: 'Brown', label: 'Heavily weighted lower — deepest, warmest' },
        ],
      }) },
      { pos: 3, html: K.infographicList({
        title: 'Why Brown Noise Helps ADHD Focus',
        caption: 'Three mechanisms working together. Occupies, masks, and stays neutral.',
        items: [
          { icon: '🌊', label: 'Occupies background',     value: 'Wandering attention has somewhere to land' },
          { icon: '🔇', label: 'Masks distractions',      value: 'Voices, traffic, fridge — gone' },
          { icon: '🚫', label: 'No language or melody',   value: "Brain can ignore it (can't ignore words)" },
        ],
      }) },
      { pos: 4, html: K.donutChart({
        title: 'ADHD Adults Who Find Brown Noise Helpful',
        value: 65,
        label: 'find it helps',
        unit: '%',
        source: 'Anecdotal estimates from ADHD coaching practice (no formal trials yet)',
        caption: 'Most ADHD adults respond. A meaningful 30-40% don\'t. If you\'re in that group, try pink noise, nature sounds, or silence with noise-canceling headphones.',
      }) },
    ],
  },

  // ── COMPARISON CLUSTER (P10 — adhd-comparisons) ────────────────────────
  'adhd-and-autism': {
    postId: null,
    file: 'post-adhd-and-autism.html',
    pexelsPlans: [
      { query: 'brain neuroscience overlap research',     anchor: '<h2>How are ADHD and autism related?</h2>' },
      { query: 'thoughtful adult quiet contemplation',    anchor: '<h2>What\'s different about ADHD vs autism?</h2>' },
      { query: 'therapist clinical evaluation patient',   anchor: '<h2>How is AuDHD diagnosed and treated?</h2>' },
    ],
    charts: [
      { pos: 1, html: K.donutChart({
        title: 'How Often ADHD and Autism Co-Occur',
        value: 50,
        label: 'overlap rate',
        unit: '%',
        source: 'Synthesis of recent ADHD-autism comorbidity studies (2015-2024)',
        caption: 'Range varies by study (30-80%), with newer research suggesting the rate is higher than historical estimates. Until 2013, dual diagnosis was forbidden by DSM-IV — so older data understates the overlap.',
      }) },
      { pos: 2, html: K.stackedCompare({
        title: 'ADHD vs Autism: Core Differences',
        leftLabel: 'ADHD core',
        rightLabel: 'Autism core',
        source: 'DSM-5 + clinical literature',
        caption: 'Same brain can have both — but the underlying motivational systems are different. ADHD seeks novelty; autism seeks predictability.',
        segments: [
          { label: 'Novelty-seeking',          left: 88, right: 22 },
          { label: 'Routine preference',       left: 25, right: 90 },
          { label: 'Variable attention',       left: 90, right: 38 },
          { label: 'Social comm. difficulty',  left: 45, right: 88 },
          { label: 'Sensory sensitivity',      left: 55, right: 80 },
        ],
      }) },
      { pos: 3, html: K.infographicList({
        title: 'What ADHD and Autism Share',
        caption: 'These are the overlap areas — and why the conditions are so often confused.',
        items: [
          { icon: '🧠', label: 'Executive dysfunction',  value: 'Task initiation, working memory' },
          { icon: '👂', label: 'Sensory sensitivity',   value: 'Lights, sounds, textures' },
          { icon: '❤️', label: 'Emotional regulation',  value: 'Intense feelings, slow recovery' },
          { icon: '🛏️', label: 'Sleep difficulties',    value: 'Insomnia, delayed sleep phase' },
          { icon: '🤝', label: 'Social challenges',     value: 'Different reasons, similar effect' },
          { icon: '🔥', label: 'Hyperfocus / interests', value: 'Both lock onto interests intensely' },
        ],
      }) },
    ],
  },


  'adhd-or-add': {
    postId: null,
    file: 'post-adhd-or-add.html',
    pexelsPlans: [
      { query: 'medical history old paperwork records',     anchor: '<h2>Are ADHD and ADD different conditions?</h2>' },
      { query: 'thoughtful woman daydream window light',    anchor: '<h2>What\'s the difference between ADHD and ADHD-PI (the inattentive type)?</h2>' },
      { query: 'mental health professional consultation',   anchor: '<h2>If I was diagnosed with "ADD" 25 years ago, do I need to be re-evaluated?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.progressTimeline({
        title: 'How "ADD" Became "ADHD" — Diagnostic History',
        source: 'DSM-III (1980), DSM-III-R (1987), DSM-5 (2013)',
        caption: 'Same condition. Different decade names. The neurology never changed — only the words for it.',
        steps: [
          { label: 'Pre-1980', sub: '"Minimal brain dysfunction"' },
          { label: '1980',     sub: 'DSM-III: ADD coined' },
          { label: '1987',     sub: 'DSM-III-R: renamed ADHD' },
          { label: '2013',     sub: 'DSM-5: 3 presentations' },
        ],
      }) },
      { pos: 4, html: K.infographicList({
        title: 'Internal vs External Hyperactivity (Adults)',
        caption: 'Many adults insist they\'re "not hyperactive" because they only know the kid version. Their hyperactivity moved inside.',
        items: [
          { icon: '🏃', label: 'External (kid version)', value: 'Running, climbing, fidgeting' },
          { icon: '💭', label: 'Racing thoughts',         value: 'Mind won\'t quiet' },
          { icon: '🛋️', label: "Can't relax",            value: 'Body still, brain spinning' },
          { icon: '👟', label: 'Micro-fidgeting',         value: 'Foot tap, pen click, below awareness' },
        ],
      }) },
    ],
  },

  // ── SPOKE: ADHD Diagnostic Codes (under future P9 diagnosis) ──────────
  'adhd-diagnostic-codes': {
    postId: null,
    file: 'post-adhd-diagnostic-codes.html',
    pexelsPlans: [
      { query: 'medical chart paperwork doctor records',     anchor: '<h2>Why do diagnostic codes matter?</h2>' },
      { query: 'doctor patient consultation paperwork',      anchor: '<h2>How do you find your own diagnostic code?</h2>' },
      { query: 'school accommodations meeting professional', anchor: '<h2>How do diagnostic codes affect accommodations?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.infographicList({
        title: 'The 5 ADHD Diagnostic Codes (DSM-5 / ICD-10)',
        caption: 'Same F90.x family used in both DSM-5 and ICD-10 for billing compatibility worldwide.',
        items: [
          { icon: '🧠', label: 'F90.0 — Inattentive',  value: 'Most common in girls/women, often missed' },
          { icon: '⚡', label: 'F90.1 — Hyperactive',  value: 'More common in young children' },
          { icon: '🌀', label: 'F90.2 — Combined',     value: 'Most common overall, ~50-60%' },
          { icon: '📋', label: 'F90.8 — Other',        value: 'Specific symptoms, doesn\'t fit a subtype' },
          { icon: '❓', label: 'F90.9 — Unspecified',  value: 'Temporary while evaluation completes' },
        ],
      }) },
      { pos: 3, html: K.stackedCompare({
        title: 'DSM-5/ICD-10 vs ICD-11 — Equivalent Codes',
        leftLabel: 'ICD-10 / DSM-5',
        rightLabel: 'ICD-11 (newer)',
        source: 'WHO ICD-11; American Psychiatric Association DSM-5-TR',
        caption: 'Same categories, different numbering. Most US healthcare still uses F90.x.',
        segments: [
          { label: 'Inattentive',          left: 100, right: 100 },
          { label: 'Hyperactive-impulsive', left: 100, right: 100 },
          { label: 'Combined',             left: 100, right: 100 },
        ],
      }) },
      { pos: 5, html: K.statGrid({
        title: 'Where Your Code Appears',
        caption: '4 places to look for it. If you\'ve ever been diagnosed, you have one — even if you\'ve never seen it.',
        stats: [
          { value: '📄',  label: 'Evaluation report (top or bottom)' },
          { value: '💳',  label: 'Insurance EOB claims' },
          { value: '💊',  label: 'Pharmacy prescription records' },
          { value: '☎️',  label: 'Just ask your clinician' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Best Productivity Apps for ADHD (under P6) ─────────────────
  'best-productivity-apps-for-adhd': {
    postId: null,
    file: 'post-best-productivity-apps-for-adhd.html',
    pexelsPlans: [
      { query: 'phone apps screen productivity tools',         anchor: '<h2>What makes a productivity app actually good for ADHD?</h2>' },
      { query: 'person choosing decision multiple options',    anchor: '<h2>Which ADHD productivity app should you choose?</h2>' },
      { query: 'subscription billing money smartphone',        anchor: '<h2>Are paid ADHD productivity apps worth it?</h2>' },
    ],
    charts: [
      { pos: 1, html: K.infographicList({
        title: 'The 3 Properties of an ADHD-Friendly App',
        caption: 'Apps that fail for ADHD typically violate at least one of these. Apps that succeed have all three.',
        items: [
          { icon: '🪒', label: 'Low setup friction',     value: 'Use it in under 60 seconds' },
          { icon: '🎯', label: 'External structure',     value: 'App does the executive function work' },
          { icon: '⚡', label: 'Dopamine at the start',  value: 'Tiny rewards for beginning' },
        ],
      }) },
      { pos: 7, html: K.statGrid({
        title: 'Match Your Weakness to the Right App',
        caption: 'Pick based on which executive function is your biggest struggle, not based on features.',
        stats: [
          { value: "Can't start", label: 'FOCO or Goblin Tools' },
          { value: 'Time blind',  label: 'Tiimo or visual planner' },
          { value: 'No focus',    label: 'Forest + Brain.fm' },
          { value: 'Chaotic day', label: 'Sunsama or TickTick' },
        ],
      }) },
    ],
  },

  // ── PILLAR 3: How to Focus With ADHD ───────────────────────────────────
  'how-to-focus-with-adhd': {
    postId: null,
    file: 'post-how-to-focus-with-adhd.html',
    pexelsPlans: [
      { query: 'focused person headphones laptop work',         anchor: '<h2>Why is focus so hard for ADHD?</h2>' },
      { query: 'pomodoro timer kitchen desk minimal',           anchor: '<h2>How does the Pomodoro Technique work for ADHD?</h2>' },
      { query: 'two people coworking coffee shop laptops',      anchor: '<h2>What is body doubling and why does it help?</h2>' },
      { query: 'organized planner schedule calendar week',      anchor: '<h2>What is time blocking and how do you do it for ADHD?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.infographicList({
        title: 'The 3 Principles That Make Focus Techniques Work',
        caption: 'Almost every focus technique that works for ADHD shares these three. Almost everything that fails violates at least one.',
        items: [
          { icon: '⏱️', label: 'Bound the time',       value: '"25 min" beats "all afternoon"' },
          { icon: '🪒', label: 'Reduce start friction', value: 'Pre-stage everything' },
          { icon: '🤝', label: 'External structure',   value: 'Timer, body double, alarm' },
        ],
      }) },
      { pos: 3, html: K.progressTimeline({
        title: 'The Pomodoro Cycle for ADHD',
        caption: 'Standard 25/5 split works for most. Try 15/5 or 50/10 if 25 feels wrong.',
        steps: [
          { label: '25 min', sub: 'Focused work, no distractions' },
          { label: '5 min',  sub: 'Break — stand, water, walk' },
          { label: 'Repeat', sub: 'Cycle 4 times' },
          { label: '15-30',  sub: 'Long break after cycle' },
        ],
      }) },
      { pos: 6, html: K.donutChart({
        title: 'ADHD Adults Who Respond to Stimulant Medication',
        value: 75,
        label: 'respond to first-line',
        unit: '%',
        source: 'NIMH; multiple meta-analyses of adult ADHD pharmacotherapy',
        caption: '70-80% of ADHD adults respond to first-line stimulants when properly prescribed. Medication is not a cure, but it raises the focus baseline that all other techniques compound on top of.',
      }) },
    ],
  },

  // ── PILLAR 2: ADHD Executive Function ──────────────────────────────────
  'adhd-executive-function': {
    postId: null,
    file: 'post-adhd-executive-function.html',
    pexelsPlans: [
      { query: 'brain neuroscience research scientist',         anchor: '<h2>What is executive function?</h2>' },
      { query: 'thoughtful woman desk work focus',              anchor: '<h2>How does ADHD affect executive function?</h2>' },
      { query: 'organized planner notebook desk system',        anchor: '<h2>What are the signs of executive dysfunction?</h2>' },
      { query: 'therapist consultation mental health office',   anchor: '<h2>How do you treat executive dysfunction?</h2>' },
    ],
    charts: [
      // Before H2 #2 "How does ADHD affect executive function?"
      { pos: 2, html: K.donutChart({
        title: 'Adults With ADHD Who Have Executive Function Deficits',
        value: 90,
        label: 'have deficits',
        unit: '%',
        source: 'CHADD; Faraone et al., Nature Reviews Disease Primers (2015)',
        caption: "Roughly 9 in 10 adults with ADHD have measurable executive function deficits. It's the rule, not the exception. If this describes you, you are part of an enormous group.",
      }) },

      // Before H2 #3 "What are the 7 executive functions?"
      { pos: 3, html: K.infographicList({
        title: "The 7 Executive Functions ADHD Affects",
        source: "Russell Barkley's executive function model (1997)",
        caption: 'ADHD impairs all seven, but task initiation and working memory are typically the most affected. The dopamine system that powers each of them is genuinely quieter in the ADHD brain.',
        items: [
          { icon: '🛑', label: 'Inhibition',          value: 'Not doing the wrong thing' },
          { icon: '🎯', label: 'Sustained attention', value: 'Staying with one thing' },
          { icon: '🧠', label: 'Working memory',      value: 'Holding info in mind' },
          { icon: '🚀', label: 'Task initiation',     value: 'Starting something' },
          { icon: '❤️', label: 'Emotional regulation', value: 'Managing feelings' },
          { icon: '👁️', label: 'Self-monitoring',     value: "Noticing how you're doing" },
          { icon: '🔀', label: 'Cognitive flexibility', value: 'Switching gears' },
        ],
      }) },

      // Before H2 #5 "Is executive dysfunction the same as ADHD?"
      { pos: 5, html: K.horizontalBar({
        title: 'Where Executive Dysfunction Shows Up',
        unit: '%',
        source: 'Synthesis of DSM-5 + clinical comorbidity research',
        caption: "ADHD is by far the most common chronic cause. The other conditions are real but less common — and the treatments for what's underneath are different.",
        bars: [
          { label: 'ADHD',       value: 90, highlight: true },
          { label: 'Depression', value: 60 },
          { label: 'Burnout',    value: 55 },
          { label: 'Autism',     value: 45 },
        ],
      }) },

      // Before H2 #6 "How do you treat executive dysfunction?"
      { pos: 6, html: K.progressTimeline({
        title: 'The 4 Evidence-Based Intervention Categories',
        source: 'Solanto (2011), Ramsay (2010), MTA Study, NIMH guidelines',
        caption: 'Best outcomes generally combine 2-3 of these, not just one. The order from left to right is roughly cheapest to costliest — but combined approaches outperform any single modality.',
        steps: [
          { label: 'Shrink',     sub: 'Tiny first step' },
          { label: 'Externalize', sub: 'Out of head, into system' },
          { label: 'Co-regulate', sub: 'Borrow regulation' },
          { label: 'Medicate',   sub: 'When clinically appropriate' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Russell Barkley Executive Function Model (under P2) ─────────
  'russell-barkley-executive-function-model': {
    postId: null,
    file: 'post-russell-barkley-executive-function-model.html',
    pexelsPlans: [
      { query: 'professor researcher academic books library',  anchor: '<h2>Who is Russell Barkley?</h2>' },
      { query: 'brain prefrontal cortex neuroscience model',   anchor: '<h2>What does the model say causes ADHD?</h2>' },
      { query: 'therapist psychologist consultation patient',  anchor: '<h2>Why does Barkley\'s model matter for treatment?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.infographicList({
        title: "Barkley's Core Reframe of ADHD",
        caption: 'The shift sounds small. It changed the entire field.',
        items: [
          { icon: '❌', label: 'OLD framing',  value: 'ADHD = attention disorder' },
          { icon: '✅', label: 'NEW framing',  value: 'ADHD = self-regulation disorder' },
          { icon: '💡', label: 'Implication',  value: 'Knowledge intact, performance impaired' },
        ],
      }) },
      { pos: 3, html: K.infographicList({
        title: 'The 7 Executive Functions in Barkley\'s Model',
        source: 'Barkley, Psychological Bulletin (1997)',
        caption: 'ADHD impairs all seven, in different patterns for different people.',
        items: [
          { icon: '🛑', label: 'Inhibition',           value: 'Foundation; affects all others' },
          { icon: '🎯', label: 'Sustained attention',  value: 'The classic ADHD symptom' },
          { icon: '🧠', label: 'Working memory',       value: 'Mental scratchpad' },
          { icon: '🚀', label: 'Task initiation',      value: 'Most impaired in adults' },
          { icon: '❤️', label: 'Emotional regulation', value: 'Now considered core feature' },
          { icon: '👁️', label: 'Self-monitoring',     value: 'Real-time awareness' },
          { icon: '🔀', label: 'Cognitive flexibility', value: 'Switching gears' },
        ],
      }) },
    ],
  },

  // ── SPOKE: ADHD Transitions (under P2) ─────────────────────────────────
  'adhd-transitions': {
    postId: null,
    file: 'post-adhd-transitions.html',
    pexelsPlans: [
      { query: 'person closing laptop ending work',           anchor: '<h2>What is a transition, and why is it hard for ADHD?</h2>' },
      { query: 'tired exhausted woman couch evening',         anchor: '<h2>What does ADHD transition difficulty look like?</h2>' },
      { query: 'morning routine ritual coffee planner',       anchor: '<h2>How do you actually make transitions less expensive?</h2>' },
      { query: 'focused work concentration deep flow',        anchor: '<h2>Hyperfocus and transitions</h2>' },
    ],
    charts: [
      { pos: 2, html: K.infographicList({
        title: 'Why ADHD Makes Transitions So Costly',
        caption: 'Three mechanisms compound. The ADHD brain treats every transition as a mini-project; a typical brain treats it as a small detail.',
        items: [
          { icon: '🔒', label: 'Hyperfocus inertia',  value: "Brain doesn't want to release dopamine state" },
          { icon: '🧠', label: 'Working memory',      value: "Can't hold old + new task simultaneously" },
          { icon: '🚀', label: 'Activation cost',     value: 'New task needs task initiation again' },
        ],
      }) },
      { pos: 3, html: K.infographicList({
        title: 'What Transition Difficulty Looks Like',
        caption: 'If three or more sound familiar, this is your name for the pattern.',
        items: [
          { icon: '⏱️', label: '90-min shutdown',     value: '"Wrapping up" for an hour' },
          { icon: '🔁', label: '"One more thing"',    value: 'Loops, never quite leaving' },
          { icon: '📺', label: "Can't end fun",       value: 'Video, book, gaming continues' },
          { icon: '😴', label: 'Tired from "nothing"', value: '20 small transitions = burnout' },
          { icon: '😰', label: 'Sunday dread',         value: 'Anticipation of mode shift' },
        ],
      }) },
      { pos: 4, html: K.progressTimeline({
        title: 'The 6-Tool Transition Toolkit',
        caption: 'Two halves: fewer transitions, and lower-cost transitions when you do have them.',
        steps: [
          { label: 'Batch',     sub: 'Group similar tasks' },
          { label: 'Ritualize', sub: 'Same sequence every time' },
          { label: 'Buffer',    sub: 'Add 15+ min between tasks' },
          { label: 'External',  sub: 'Alarms, outside cues' },
          { label: 'Pre-stage', sub: 'Set up next start before ending' },
          { label: 'Accept',    sub: 'Endings cost — plan for it' },
        ],
      }) },
    ],
  },

  // ── SPOKE: ADHD Emotional Regulation (under P2) ────────────────────────
  'emotional-regulation-adhd': {
    postId: null,
    file: 'post-emotional-regulation-adhd.html',
    pexelsPlans: [
      { query: 'emotional woman face feelings expression',     anchor: '<h2>What is emotional regulation?</h2>' },
      { query: 'overwhelmed person hands face stress',         anchor: '<h2>What does ADHD emotional dysregulation feel like?</h2>' },
      { query: 'calm meditation breathing peaceful',           anchor: '<h2>How do you actually regulate emotions with ADHD?</h2>' },
      { query: 'therapy session counseling discussion',        anchor: '<h2>Does medication help emotional regulation?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.donutChart({
        title: 'ADHD Adults Who Experience Emotional Dysregulation',
        value: 70,
        label: 'experience this',
        unit: '%',
        source: 'Synthesis of Barkley + adult ADHD emotional regulation research',
        caption: 'Roughly 7 in 10 adults with ADHD report significant emotional regulation difficulties. Newer ADHD frameworks treat this as a core feature, not a comorbidity.',
      }) },
      { pos: 3, html: K.infographicList({
        title: 'The 4 Patterns of ADHD Emotional Dysregulation',
        caption: "Most ADHD adults experience two or three of these strongly. None of them is a character flaw.",
        items: [
          { icon: '📢', label: 'Intensity',         value: 'Bigger than the trigger' },
          { icon: '⚡', label: 'Speed',             value: 'Calm to overwhelmed in seconds' },
          { icon: '⏳', label: 'Duration',          value: "The wave doesn't recede on schedule" },
          { icon: '🔁', label: 'Difficulty shifting', value: "Can't 'just decide' to feel better" },
        ],
      }) },
      { pos: 5, html: K.progressTimeline({
        title: 'The 6-Tool Emotional Regulation Toolkit',
        caption: 'The fix is not to feel less. The fix is to slow the response so you can choose.',
        steps: [
          { label: 'Name it',     sub: '"I notice rage"' },
          { label: '90 sec',      sub: 'Do nothing, just wait' },
          { label: 'Body',        sub: 'Cold water, walk, breath' },
          { label: 'Pre-decide',  sub: '"No emails when flooded"' },
          { label: 'Treatment',   sub: 'CBT/DBT + medication' },
        ],
      }) },
    ],
  },

  // ── SPOKE: ADHD Time Blindness (under P2) ──────────────────────────────
  'time-blindness-adhd': {
    postId: null,
    file: 'post-time-blindness-adhd.html',
    pexelsPlans: [
      { query: 'analog clock wall time perception',         anchor: '<h2>What is ADHD time blindness?</h2>' },
      { query: 'late running clock stress watch',           anchor: '<h2>What does ADHD time blindness look like in real life?</h2>' },
      { query: 'visual timer kitchen modern desk',          anchor: '<h2>How do you actually compensate for time blindness?</h2>' },
      { query: 'medication therapy adhd treatment plan',    anchor: '<h2>Does medication help with time blindness?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.donutChart({
        title: 'Adults With ADHD Affected by Time Blindness',
        value: 80,
        label: 'experience this',
        unit: '%',
        source: 'Synthesis of Barkley research + clinical observation',
        caption: 'Time blindness is one of the most common — and most underappreciated — ADHD adult symptoms. Roughly 4 in 5 adults with ADHD experience it to a clinically meaningful degree.',
      }) },
      { pos: 3, html: K.infographicList({
        title: 'What Time Blindness Looks Like',
        caption: "If most of these felt familiar, you're describing a common ADHD adult presentation — not a personality flaw.",
        items: [
          { icon: '⏰', label: 'Chronic lateness',     value: '"I had plenty of time"' },
          { icon: '🚫', label: 'Time-blind start',    value: 'Looked up — 2 hours gone' },
          { icon: '⚡', label: 'Deadline-only output', value: 'Tasks live in "not now"' },
          { icon: '📞', label: 'Meeting overruns',    value: '15 min becomes 45 min' },
          { icon: '⏱️', label: 'Bad estimates',       value: '"Just 10 minutes" lies' },
          { icon: '😵', label: 'The 5pm panic',       value: 'Day disappeared, where?' },
        ],
      }) },
      { pos: 4, html: K.progressTimeline({
        title: 'The 6-Tool Time-Blindness Toolkit',
        caption: 'Externalize the internal clock. None of these alone is enough; together they compound.',
        steps: [
          { label: 'Visual timer',     sub: 'See time passing' },
          { label: 'Alarms',           sub: 'For everything' },
          { label: 'Calendar blocks',  sub: 'Real durations' },
          { label: 'Next anchor',      sub: 'Always know what\'s next' },
          { label: 'Departure dress',  sub: 'Get ready first' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Working Memory and ADHD (under P2) ──────────────────────────
  'working-memory-adhd': {
    postId: null,
    file: 'post-working-memory-adhd.html',
    pexelsPlans: [
      { query: 'person forgetting confused thinking',           anchor: '<h2>What is working memory?</h2>' },
      { query: 'sticky notes desk reminders organization',      anchor: '<h2>What does working memory deficit feel like?</h2>' },
      { query: 'notebook writing planner external memory',      anchor: '<h2>How do you actually compensate for working memory issues?</h2>' },
      { query: 'medication therapy mental health professional', anchor: '<h2>Does medication help working memory?</h2>' },
    ],
    charts: [
      { pos: 2, html: K.donutChart({
        title: 'Working Memory Capacity Reduction in ADHD',
        value: 30,
        label: 'less capacity',
        unit: '%',
        source: 'Synthesis of Barkley + working memory studies',
        caption: 'Adults with ADHD can hold meaningfully less in active mind at once. The exact number varies, but a ~30% reduction across verbal, visual-spatial, and executive working memory is consistent across studies.',
      }) },
      { pos: 4, html: K.infographicList({
        title: 'What Working Memory Deficit Feels Like',
        caption: 'These are not "memory problems." They are working memory operating at reduced capacity — a different thing.',
        items: [
          { icon: '🚪', label: 'Walk into rooms',     value: 'Forget why on arrival' },
          { icon: '📖', label: 'Read paragraphs',     value: 'Retain almost nothing' },
          { icon: '💭', label: 'Mid-sentence',        value: 'Lose the start' },
          { icon: '📋', label: 'Three instructions',  value: 'Remember one' },
          { icon: '🔢', label: 'Mental math',         value: 'Disproportionately hard' },
          { icon: '🔑', label: '"I just had it!"',    value: 'Phones, keys, pens' },
        ],
      }) },
      { pos: 5, html: K.progressTimeline({
        title: 'The Externalize Toolkit',
        caption: 'The fix is structural — not "remember harder." Move the load out of your head.',
        steps: [
          { label: 'Write',     sub: 'Before you finish current task' },
          { label: 'Photo',     sub: 'Anything you\'ll need later' },
          { label: 'Text',      sub: 'Ask for written instructions' },
          { label: 'Repeat',    sub: 'Say it back to encode' },
          { label: 'Next-step', sub: 'Visible on every doc' },
        ],
      }) },
    ],
  },

  // ── SPOKE: 7 Executive Function Skills (under P2) ─────────────────────
  'executive-function-skills-list': {
    postId: null,
    file: 'post-executive-function-skills-list.html',
    pexelsPlans: [
      { query: 'organized desk planner notebook focused',     anchor: '<h2>What are executive function skills?</h2>' },
      { query: 'person thinking concentration window',        anchor: '<h2>3. Working memory</h2>' },
      { query: 'professional therapist office consultation',  anchor: '<h2>5. Emotional regulation</h2>' },
      { query: 'morning routine coffee planner setup',        anchor: '<h2>How do you assess your own executive function profile?</h2>' },
    ],
    charts: [
      { pos: 1, html: K.infographicList({
        title: 'The 7 Executive Functions at a Glance',
        source: "Russell Barkley's executive function model (1997)",
        caption: 'Each skill is independently impaired in ADHD. Most people have 2-3 weak ones and a few that are reasonably intact.',
        items: [
          { icon: '🛑', label: 'Inhibition',           value: 'Not interrupting, not impulse-buying' },
          { icon: '🎯', label: 'Sustained attention',  value: 'Staying with one thing' },
          { icon: '🧠', label: 'Working memory',       value: 'Holding info in mind' },
          { icon: '🚀', label: 'Task initiation',      value: 'Getting started' },
          { icon: '❤️', label: 'Emotional regulation', value: 'Managing feelings' },
          { icon: '👁️', label: 'Self-monitoring',      value: 'Noticing how you\'re doing' },
          { icon: '🔀', label: 'Cognitive flexibility', value: 'Switching gears' },
        ],
      }) },
      { pos: 8, html: K.statGrid({
        title: 'Most-Affected Executive Functions in ADHD',
        caption: 'Individual profiles vary, but these patterns hold across most ADHD adults.',
        stats: [
          { value: '#1', label: 'Task initiation' },
          { value: '#2', label: 'Working memory' },
          { value: '#3', label: 'Sustained attention' },
        ],
      }) },
    ],
  },

  // ── RESEARCH SYNTHESIS Q1: 30 Years of ADHD Research on Task Initiation ─
  'adhd-task-initiation-research': {
    postId: null,
    file: 'post-adhd-task-initiation-research.html',
    pexelsPlans: [
      { query: 'neuroscience brain scan research lab',          anchor: '<h2>Why this matters</h2>' },
      { query: 'medical research scientist microscope',         anchor: '<h2>What does the brain science actually show?</h2>' },
      { query: 'therapy session counseling consultation',       anchor: '<h2>Why is task initiation deficit so often misdiagnosed as laziness?</h2>' },
      { query: 'organized workspace planner notebook focus',    anchor: '<h2>What does the research say actually works?</h2>' },
    ],
    charts: [
      // Before H2 #2 "How common is task initiation deficit in ADHD?"
      { pos: 2, html: K.donutChart({
        title: 'Adults With ADHD Who Have Executive Function Deficits',
        value: 90,
        label: 'have deficits',
        unit: '%',
        source: 'Children and Adults with ADHD (CHADD); Faraone et al., Nature Reviews Disease Primers (2015)',
        caption: 'Across populations and methodologies, the floor is high: roughly 9 in 10 adults with ADHD have measurable executive function deficits. Task initiation is consistently among the top three most-affected functions.',
      }) },

      // Before H2 #3 "What does the brain science actually show?"
      { pos: 3, html: K.horizontalBar({
        title: 'Dopamine Receptor Availability: ADHD vs Controls',
        unit: '%',
        source: 'Volkow et al., JAMA (2009) — PET scan study of 53 adults with ADHD',
        caption: 'In the brain regions responsible for motivation and reward, dopamine receptor density is measurably reduced in ADHD adults. The launch signal is genuinely weaker — not absent, but quieter.',
        bars: [
          { label: 'Controls (typical)',     value: 100 },
          { label: 'Adults with ADHD',       value: 75, highlight: true },
        ],
      }) },

      // Before H2 #4 "Why is task initiation deficit so often misdiagnosed?"
      { pos: 4, html: K.infographicList({
        title: "Barkley's 7 Executive Functions ADHD Affects",
        source: 'Barkley, Psychological Bulletin (1997)',
        caption: 'Three decades after Barkley published this framework, it still organizes most ADHD research. Task initiation is one of seven — but it is the one most often misdiagnosed as a values problem.',
        items: [
          { icon: '🛑', label: 'Inhibition',          value: 'Not doing the wrong thing' },
          { icon: '🎯', label: 'Sustained attention', value: 'Staying with one thing' },
          { icon: '🧠', label: 'Working memory',      value: 'Holding info in mind' },
          { icon: '🚀', label: 'Task initiation',     value: 'Starting something' },
          { icon: '❤️', label: 'Emotional regulation', value: 'Managing feelings' },
          { icon: '👁️', label: 'Self-monitoring',     value: "Noticing how you're doing" },
          { icon: '🔀', label: 'Cognitive flexibility', value: 'Switching gears' },
        ],
      }) },

      // Before H2 #5 "What does the research say actually works?"
      { pos: 5, html: K.progressTimeline({
        title: 'The 4 Evidence-Based Intervention Categories',
        source: 'Synthesis: Solanto (2011), Ramsay (2010), MTA Study, NIMH guidelines',
        caption: 'These four are the categories with the strongest evidence base. Best outcomes generally combine 2-3 of them, not just one.',
        steps: [
          { label: 'Shrink',     sub: 'Activation-cost reduction' },
          { label: 'Externalize', sub: 'Out of head, into system' },
          { label: 'Co-regulate', sub: 'Borrow others\' regulation' },
          { label: 'Medicate',   sub: 'When clinically appropriate' },
        ],
      }) },
    ],
  },

  // ── PILLAR 1: ADHD Task Paralysis ──────────────────────────────────────
  'adhd-task-paralysis': {
    postId: null, // resolved on first push
    file: 'post-adhd-task-paralysis.html',
    pexelsPlans: [
      { query: 'frustrated woman laptop computer staring',         anchor: '<h2>What is ADHD task paralysis?</h2>' },
      { query: 'tired exhausted person desk work head hands',      anchor: '<h2>Why does ADHD task paralysis happen?</h2>' },
      { query: 'person scrolling phone couch distracted',          anchor: '<h2>How is task paralysis different from procrastination?</h2>' },
      { query: 'hands typing keyboard focused work close up',      anchor: '<h2>How do you break ADHD task paralysis right now?</h2>' },
    ],
    charts: [
      // Before H2 #2 "Why does ADHD task paralysis happen?"
      { pos: 2, html: K.donutChart({
        title: 'How Common Is This Among ADHD Adults?',
        value: 90,
        label: 'experience this',
        unit: '%',
        source: 'Children and Adults with ADHD (CHADD); Barkley et al., 2008',
        caption: 'Roughly 9 in 10 people with ADHD experience executive function struggles, including task initiation. If this is you, you are very far from alone.',
      }) },

      // Before H2 #3 "How is task paralysis different from procrastination?"
      { pos: 3, html: K.infographicList({
        title: 'The 4 Brain Factors Behind Task Paralysis',
        caption: 'None of this is willpower. All of it is wiring.',
        items: [
          { icon: '⚡', label: 'Low dopamine',       value: "Brain can't 'fire up' to start" },
          { icon: '🧠', label: 'Working memory load', value: 'Holding the task = freezing' },
          { icon: '⏰', label: 'Time blindness',     value: '30 min feels like 3 hours' },
          { icon: '🔀', label: 'Decision paralysis', value: "Can't pick the first step" },
        ],
      }) },

      // Before H2 #4 "What are the signs of ADHD task paralysis?"
      { pos: 4, html: K.stackedCompare({
        title: 'Procrastination vs. Task Paralysis',
        leftLabel: 'Procrastination',
        rightLabel: 'Task Paralysis',
        source: 'Barkley, ADHD: A Handbook for Diagnosis and Treatment (4th ed.)',
        caption: 'Procrastination is choosing avoidance. Task paralysis is being stuck even when you want to start. The fixes are different — that is why "just try harder" never works for paralysis.',
        segments: [
          { label: 'Doing something else?',   left: 95, right: 15 },
          { label: 'Feels physically heavy?', left: 25, right: 88 },
          { label: 'Trying harder helps?',    left: 60, right: 8  },
          { label: 'Wants to start?',         left: 40, right: 92 },
        ],
      }) },

      // Before H2 #5 "How do you break ADHD task paralysis right now?"
      { pos: 5, html: K.progressTimeline({
        title: 'The 5-Step Unlock to Break Task Paralysis',
        source: 'FOCO methodology, informed by Atomic Habits (James Clear) + ADHD coaching practice',
        caption: 'Each step exists to remove a specific block your brain is using to refuse. Do them in order — the first time, with this article in front of you.',
        steps: [
          { label: 'Name it',     sub: 'First physical action only' },
          { label: 'Shrink it',   sub: 'Under 2 minutes' },
          { label: 'Permission',  sub: 'Quit after, allowed' },
          { label: 'Trigger',     sub: 'Stand, move, water' },
          { label: 'Start',       sub: 'Before you feel ready' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Body Doubling for ADHD (under P1) ───────────────────────────
  'body-doubling-adhd': {
    postId: null,
    file: 'post-body-doubling-adhd.html',
    // Curated Pexels — body-doubling content benefits from real-world scenes
    pexelsPlans: [
      { query: 'two people working coffee shop laptops',         anchor: '<h2>What is body doubling?</h2>' },
      { query: 'co-working space focused people working',        anchor: '<h2>What does body doubling actually look like?</h2>' },
      { query: 'video call work from home headphones laptop',    anchor: '<h2>How do you start body doubling?</h2>' },
      { query: 'study group library focused students',           anchor: '<h2>What if you don\'t have anyone to body double with?</h2>' },
    ],
    charts: [
      // Before H2 #2 "Why does body doubling work for ADHD?"
      { pos: 2, html: K.infographicList({
        title: 'Why It Works: 3 Mechanisms',
        caption: 'Body doubling activates three different ADHD-friendly systems at once.',
        items: [
          { icon: '👀', label: 'Soft accountability', value: "Their gaze keeps you in your seat" },
          { icon: '🤝', label: 'Co-regulation',       value: 'Your nervous system borrows theirs' },
          { icon: '🧩', label: 'Shared decisions',    value: "You start when they start" },
        ],
      }) },

      // Before H2 #4 "How do you start body doubling?"
      { pos: 4, html: K.infographicList({
        title: '5 Ways to Start Body Doubling Today',
        caption: 'Pick one. The first session feels weird. By the third, it feels obvious.',
        items: [
          { icon: '💬', label: 'Text a friend',         value: 'Video call, work in silence' },
          { icon: '📱', label: 'Focusmate / Flow Club', value: 'Match with strangers, free tier' },
          { icon: '🏠', label: 'Family or roommate',    value: 'Just sit in the same room' },
          { icon: '☕', label: 'Coffee shop',           value: 'Strangers count too' },
          { icon: '👥', label: 'ADHD community',        value: 'Discord / Zoom / Slack rooms' },
        ],
      }) },

      // Before H2 #6 "What does the research say about body doubling?"
      { pos: 6, html: K.donutChart({
        title: 'ADHD Adults With Executive Function Issues',
        value: 90,
        label: 'benefit from this',
        unit: '%',
        source: 'CHADD; Barkley executive function research',
        caption: 'Roughly 9 in 10 adults with ADHD struggle with executive function. Body doubling addresses task initiation, sustained attention, and self-monitoring all at once — three things ADHD brains struggle with most.',
      }) },

      // Before H2 #7 "How does body doubling fit with other ADHD tools?"
      { pos: 7, html: K.progressTimeline({
        title: 'Stack Body Doubling With...',
        caption: 'Body doubling is a sustain tool. Pair it with a launch tool for compounding effect.',
        steps: [
          { label: 'Launch',  sub: '2-minute rule' },
          { label: 'Sustain', sub: 'Body doubling' },
          { label: 'Pace',    sub: 'Pomodoro blocks' },
          { label: 'Track',   sub: 'External task list' },
          { label: 'Support', sub: 'Treatment if needed' },
        ],
      }) },
    ],
  },

  // ── SPOKE: 2-Minute Rule for ADHD (under P1) ───────────────────────────
  '2-minute-rule-adhd': {
    postId: null,
    file: 'post-2-minute-rule-adhd.html',
    pexelsPlans: [
      { query: 'small alarm clock timer minutes desk',         anchor: '<h2>What is the 2-minute rule?</h2>' },
      { query: 'hands opening laptop starting work close up',  anchor: '<h2>Why does the 2-minute rule work for ADHD?</h2>' },
      { query: 'person writing first step notebook focused',   anchor: '<h2>How do you actually use the 2-minute rule?</h2>' },
      { query: 'frustrated tired woman desk paper struggling', anchor: '<h2>What are common mistakes with the 2-minute rule?</h2>' },
    ],
    charts: [
      // Before H2 #2 "Why does the 2-minute rule work for ADHD?"
      { pos: 2, html: K.donutChart({
        title: 'Activation Cost: How Small Is Small Enough?',
        value: 2,
        label: 'minutes max',
        unit: ' min',
        source: 'Adapted from Atomic Habits (James Clear) for ADHD task initiation',
        caption: 'Two minutes is short enough that almost any brain — even one that has been frozen for hours — can do it. Smaller than this, you do it without thinking. Larger, the dopamine deficit blocks you again.',
      }) },

      // Before H2 #3 "How do you actually use the 2-minute rule?"
      { pos: 3, html: K.progressTimeline({
        title: 'The 5-Step 2-Minute Rule (ADHD Edition)',
        source: 'FOCO methodology, refined for ADHD task initiation',
        caption: "Each step removes a specific block. Skip one and the rule often fails. Run through all five — the first time, with this article in front of you.",
        steps: [
          { label: 'Name',       sub: 'First physical action' },
          { label: 'Shrink',     sub: 'Under 2 minutes' },
          { label: 'Permission', sub: 'You can quit after' },
          { label: 'Trigger',    sub: 'Stand, move, water' },
          { label: 'Start',      sub: 'Before you feel ready' },
        ],
      }) },

      // Before H2 #4 "What are common mistakes with the 2-minute rule?"
      { pos: 4, html: K.infographicList({
        title: '4 Reasons the 2-Minute Rule Fails',
        caption: 'Almost every "it didn\'t work for me" comes down to one of these.',
        items: [
          { icon: '🌫️', label: 'Too vague',           value: '"Work on it" is not an action' },
          { icon: '🎭', label: 'Pretending to stop',   value: 'Your brain knows the truth' },
          { icon: '📦', label: 'Action too big',       value: '"Open file + type" might be too big' },
          { icon: '🪑', label: 'No body movement',     value: 'Mind alone rarely shifts modes' },
        ],
      }) },

      // Before H2 #6 "How does the 2-minute rule fit with other ADHD tools?"
      { pos: 6, html: K.infographicList({
        title: 'Combine With These for Best Results',
        caption: 'The 2-minute rule is a launch tool. Pair it with a sustain tool for compounding effect.',
        items: [
          { icon: '📝', label: 'Externalized task list', value: 'Get tasks out of your head' },
          { icon: '👥', label: 'Body doubling',          value: 'Work alongside someone' },
          { icon: '🌙', label: 'Night-before plan',      value: 'Pre-decide first action' },
          { icon: '💊', label: 'Treatment when needed',  value: 'Therapy + medication' },
        ],
      }) },
    ],
  },

  // ── SPOKE: Procrastination vs Paralysis (under P1) ─────────────────────
  'procrastination-vs-paralysis': {
    postId: null,
    file: 'post-procrastination-vs-paralysis.html',
    pexelsPlans: [
      { query: 'person scrolling phone procrastinating sofa',     anchor: '<h2>Why does procrastination happen?</h2>' },
      { query: 'frozen tired woman blank computer screen',        anchor: '<h2>Why does task paralysis happen?</h2>' },
      { query: 'thoughtful person reflecting window quiet',       anchor: '<h2>How can you tell which one you\'re experiencing?</h2>' },
      { query: 'person writing notebook desk action starting',    anchor: '<h2>How do you fix each one?</h2>' },
    ],
    charts: [
      // Before H2 #2 "Why does procrastination happen?"
      { pos: 2, html: K.stackedCompare({
        title: 'Procrastination vs. Task Paralysis: Side by Side',
        leftLabel: 'Procrastination',
        rightLabel: 'Task Paralysis',
        source: 'Pychyl (procrastination research) + Barkley (executive function)',
        caption: "If most of the right-hand bars feel familiar, you're probably dealing with paralysis, not procrastination — and that changes which tools will actually work.",
        segments: [
          { label: 'Doing something else?',     left: 95, right: 15 },
          { label: 'Body feels heavy?',         left: 25, right: 88 },
          { label: '"Try harder" works?',       left: 65, right: 8  },
          { label: 'Could do it for a friend?', left: 30, right: 92 },
          { label: 'Lifelong pattern?',         left: 35, right: 85 },
        ],
      }) },

      // Before H2 #4 "How can you tell which one you're experiencing?"
      { pos: 4, html: K.infographicList({
        title: 'Where the Two Come From',
        caption: 'Different brain systems. Different fixes.',
        items: [
          { icon: '😣', label: 'Procrastination', value: 'Emotional regulation problem' },
          { icon: '⚡', label: 'Task paralysis',  value: 'Dopamine launch failure' },
          { icon: '🎭', label: 'Procrastination triggers', value: 'Boredom, anxiety, overwhelm' },
          { icon: '🧠', label: 'Paralysis triggers',       value: 'Low dopamine + decision load' },
        ],
      }) },

      // Before H2 #5 "How do you fix each one?"
      { pos: 5, html: K.statGrid({
        title: 'Different Problems Need Different Tools',
        caption: 'Procrastination tools target the feeling. Paralysis tools target the start.',
        stats: [
          { value: '⏰',  label: 'Procrastination → deadlines, accountability, mood work' },
          { value: '🎯',  label: 'Paralysis → tiny first step, body doubling, externalize' },
          { value: 'Both', label: 'Reducing friction at the start always helps' },
        ],
      }) },

      // Before H2 #7 "What does this mean for ADHD adults?"
      { pos: 7, html: K.donutChart({
        title: 'ADHD Adults Mislabeled as Lazy',
        value: 90,
        label: 'experience paralysis',
        unit: '%',
        source: 'Children and Adults with ADHD (CHADD); Barkley, 2008',
        caption: "Roughly 9 in 10 ADHD adults experience executive dysfunction including task initiation problems. Most have been told they're lazy. They aren't.",
      }) },
    ],
  },

  // ── SPOKE: Task Initiation Deficit Explained (under P1) ────────────────
  'task-initiation-deficit-explained': {
    postId: null,
    file: 'post-task-initiation-deficit-explained.html',
    pexelsPlans: [
      { query: 'thoughtful woman window contemplating coffee',     anchor: '<h2>What is task initiation deficit?</h2>' },
      { query: 'brain neuroscience research scientist lab',        anchor: '<h2>Why does task initiation deficit happen in the brain?</h2>' },
      { query: 'therapist office consultation woman talking',      anchor: '<h2>How is task initiation deficit diagnosed?</h2>' },
      { query: 'morning planner notebook coffee productive',       anchor: '<h2>How do you treat task initiation deficit?</h2>' },
    ],
    charts: [
      // Before H2 #2 "Is task initiation deficit the same as ADHD task paralysis?"
      { pos: 2, html: K.infographicList({
        title: 'The 7 Executive Functions ADHD Affects',
        source: "Russell Barkley's executive function model",
        caption: 'Task initiation is one of seven core skills your brain uses to manage itself. ADHD impairs all of them to varying degrees — but task initiation is often the first to break down.',
        items: [
          { icon: '🚀', label: 'Task initiation',     value: 'Starting things' },
          { icon: '🎯', label: 'Sustained attention', value: 'Staying with it' },
          { icon: '🧠', label: 'Working memory',      value: 'Holding info live' },
          { icon: '🛑', label: 'Inhibition',          value: 'Resisting impulses' },
          { icon: '💭', label: 'Self-monitoring',     value: "Noticing how you're doing" },
          { icon: '❤️', label: 'Emotional regulation', value: 'Managing feelings' },
          { icon: '🔀', label: 'Flexibility',         value: 'Switching gears' },
        ],
      }) },

      // Before H2 #3 "Why does task initiation deficit happen in the brain?"
      { pos: 3, html: K.donutChart({
        title: 'Adults With ADHD Who Experience It',
        value: 90,
        label: 'experience this',
        unit: '%',
        source: 'Children and Adults with ADHD (CHADD); Barkley, 2008',
        caption: 'Roughly 9 in 10 adults with ADHD experience executive function deficits including task initiation. If this describes you, you are part of an enormous group.',
      }) },

      // Before H2 #5 "What are the signs of task initiation deficit?"
      { pos: 5, html: K.horizontalBar({
        title: 'Where Task Initiation Deficit Shows Up',
        source: 'Compiled from DSM-5; American Psychiatric Association',
        caption: "ADHD is by far the most common cause, but it's not the only one. If you have ADHD, this is most of why you can't start. The other conditions are less common but worth knowing.",
        bars: [
          { label: 'ADHD',       value: 90, highlight: true },
          { label: 'Depression', value: 60 },
          { label: 'Burnout',    value: 55 },
          { label: 'Autism',     value: 45 },
        ],
      }) },

      // Before H2 #6 "How do you treat task initiation deficit?"
      { pos: 6, html: K.progressTimeline({
        title: 'Treatment Hierarchy: Start Here',
        source: 'FOCO methodology + ADHD clinical guidelines',
        caption: 'Most people get the biggest gains from the first three steps. Medication adds capacity but rarely works alone — the systems still matter.',
        steps: [
          { label: 'Shrink',    sub: 'Under-2-min first step' },
          { label: 'Externalize', sub: 'Out of head, onto paper' },
          { label: 'Body double', sub: 'Work alongside someone' },
          { label: 'Reward',    sub: 'Dopamine at the start' },
          { label: 'Treatment', sub: 'Therapy + medication' },
        ],
      }) },
    ],
  },

  '10-minute-timer-adhd': {
    file: 'post-10-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'analog kitchen timer minimal desk',           anchor: '<h2 id="why-10-minutes">Why 10 minutes works for the ADHD brain</h2>' },
      { query: 'cluttered desk before tidying messy papers',  anchor: '<h2 id="5-uses">5 ADHD-tested ways to use a 10-minute timer</h2>' },
      { query: 'two people working laptop coffee shop',       anchor: '<h2 id="body-doubling">Using a 10-minute timer for body doubling</h2>' },
    ],
  },

  '5-minute-timer-adhd': {
    file: 'post-5-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'small kitchen timer hourglass simple',         anchor: '<h2 id="why-5-minutes">Why a 5-minute timer works for ADHD</h2>' },
      { query: 'person putting on sneakers shoes morning',     anchor: '<h2 id="5-uses">5 things you can actually do in 5 minutes</h2>' },
      { query: 'tired exhausted overwhelmed person rest',      anchor: '<h2 id="when-it-fails">When 5 minutes still feels impossible</h2>' },
    ],
  },

  '15-minute-timer-adhd': {
    file: 'post-15-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'person reading book coffee morning calm',     anchor: '<h2 id="why-15-minutes">Why a 15-minute timer fits the ADHD brain</h2>' },
      { query: 'home workout yoga mat exercise routine',      anchor: '<h2 id="5-uses">5 ways to use 15 minutes well</h2>' },
      { query: 'taking deep breath relax break window',       anchor: '<h2 id="double-block">The double-15 protocol</h2>' },
    ],
  },

  '20-minute-timer-adhd': {
    file: 'post-20-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'focused person writing laptop workspace',     anchor: '<h2 id="why-20-minutes">Why 20 minutes works for ADHD</h2>' },
      { query: 'tomato kitchen timer pomodoro vintage',       anchor: '<h2 id="20-vs-25">Why 20 instead of the standard Pomodoro 25</h2>' },
      { query: 'developer coding screen monitor focused',     anchor: '<h2 id="5-uses">5 ways to spend 20 minutes well</h2>' },
    ],
  },

  '25-minute-timer-adhd': {
    file: 'post-25-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'pomodoro tomato red kitchen timer wood',      anchor: '<h2 id="why-25-minutes">Why 25 minutes — the Cirillo origin</h2>' },
      { query: 'person concentrated writing journal table',   anchor: '<h2 id="5-uses">5 ways to use a 25-minute Pomodoro</h2>' },
      { query: 'walking outside park nature break fresh',     anchor: '<h2 id="breaks">What to actually do in the 5-minute break</h2>' },
    ],
  },

  '30-minute-timer-adhd': {
    file: 'post-30-minute-timer-adhd.html',
    pexelsPlans: [
      { query: 'half hour clock minimal modern desk',         anchor: '<h2 id="why-30-minutes">Why 30 minutes is the upper sustainable edge</h2>' },
      { query: 'cooking kitchen ingredients prep meal',       anchor: '<h2 id="5-uses">5 ways to use 30 minutes well</h2>' },
      { query: 'person stretching break floor relax',         anchor: '<h2 id="breaks">The 10-minute break (longer than Pomodoro)</h2>' },
    ],
  },

  'best-adhd-planner': {
    file: 'post-best-adhd-planner.html',
    pexelsPlans: [
      { query: 'paper planner notebook calendar pen desk',    anchor: '<h2 id="why-fail">Why most planners fail the ADHD brain</h2>' },
      { query: 'phone calendar app digital planner screen',   anchor: '<h2 id="digital-options">Digital ADHD planners reviewed</h2>' },
      { query: 'leather journal paper hand writing morning',  anchor: '<h2 id="paper-options">Paper ADHD planners reviewed</h2>' },
    ],
  },

  'adhd-imposter-syndrome': {
    file: 'post-adhd-imposter-syndrome.html',
    pexelsPlans: [
      { query: 'person looking mirror reflection thoughtful',  anchor: '<h2 id="what-it-is">What ADHD imposter syndrome actually is</h2>' },
      { query: 'overwhelmed person hands face stress quiet',   anchor: '<h2 id="rsd-connection">The RSD connection</h2>' },
      { query: 'journal notebook writing introspection desk',  anchor: '<h2 id="how-to-break">How to break the pattern</h2>' },
    ],
  },

  'adhd-and-depression': {
    file: 'post-adhd-and-depression.html',
    pexelsPlans: [
      { query: 'rainy window evening contemplative quiet',      anchor: '<h2>How are ADHD and depression connected?</h2>' },
      { query: 'young adult journal morning light soft',        anchor: '<h2>How is ADHD-driven depression different from "regular" depression?</h2>' },
      { query: 'therapy office warm soft chairs natural light', anchor: '<h2>Why does treating only depression often fail?</h2>' },
      { query: 'medication bottle shelf calm natural light',    anchor: '<h2>Does ADHD medication help depression?</h2>' },
    ],
  },

};
