// FAQ for /visual-timer/. One source for the visible list and the FAQPage schema (deploy.js renders both into the HTML).
window.VT_FAQ = [
  ['Is this visual timer free?', 'Yes. It is free, with no sign-up, no ads and no limit on how often you use it.'],
  ['Does the timer keep running if I switch tabs?', 'Yes. It counts from the clock, not from the screen, so it stays accurate in a background tab, and the tab title and icon show the time left.'],
  ['Does it work on my phone?', 'Yes, in any modern browser on iPhone, Android, tablets and laptops. Turn on Keep screen awake so the phone does not dim while it runs.'],
  ['Can I use it full screen in a classroom?', 'Yes. Press F or the full-screen button. You can hide the numbers and keep only the colour, which is easier for young children to read.'],
  ['Can it run longer than 60 minutes?', 'Yes. Open settings and type a custom time like 1h30 or 90. Past an hour, the whole circle stands for the time you set.'],
  ['What do the halfway and last-minute cues do?', 'They play a soft sound and brighten the wedge at the halfway mark and with one minute left, so you notice time passing before it runs out. Turn them off in settings.'],
  ['Is there a visual timer app?', 'FOCO, our ADHD planner for iPhone and Android, has a focus timer with a companion and calm music, and it breaks stuck tasks into small timed steps first.'],
];
if (typeof module !== 'undefined') module.exports = window.VT_FAQ;
