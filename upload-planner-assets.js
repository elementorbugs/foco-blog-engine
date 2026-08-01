// Uploads the weekly planner PDF + preview PNGs to WP media.
// Usage: node upload-planner-assets.js
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
  if (!l || l.trim().startsWith('#')) return;
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});

const HOST = env.WP_HOST.replace(/\/$/, '');
const BASE = HOST.startsWith('http') ? HOST : 'https://' + HOST;
const AUTH = 'Basic ' + Buffer.from(env.WP_USER + ':' + env.WP_APP_PASSWORD).toString('base64');

const FILES = [
  { file: 'printable/adhd-weekly-planner-template.pdf', name: 'adhd-weekly-planner-template-foco.pdf', type: 'application/pdf', title: 'ADHD Weekly Planner Template (FOCO)', alt: 'ADHD weekly planner free printable template PDF' },
  { file: 'printable/page-weekly-template.png',         name: 'adhd-weekly-planner-preview.png',      type: 'image/png',       title: 'ADHD Weekly Planner preview',       alt: 'ADHD weekly planner printable template preview showing seven day rows with three lines each' },
  { file: 'printable/page-daily-template-v2.png',       name: 'adhd-daily-planner-preview.png',       type: 'image/png',       title: 'ADHD Daily Planner preview',        alt: 'ADHD daily planner printable template preview showing top three priorities, time blocks and brain dump' },
];

(async () => {
  for (const f of FILES) {
    const buf = fs.readFileSync(path.join(__dirname, f.file));
    const res = await fetch(BASE + '/wp-json/wp/v2/media', {
      method: 'POST',
      headers: {
        Authorization: AUTH,
        'Content-Type': f.type,
        'Content-Disposition': 'attachment; filename="' + f.name + '"',
      },
      body: buf,
    });
    const j = await res.json();
    if (!res.ok) { console.error('FAIL', f.name, res.status, JSON.stringify(j).slice(0, 300)); continue; }
    // set title + alt
    await fetch(BASE + '/wp-json/wp/v2/media/' + j.id, {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: f.title, alt_text: f.alt }),
    });
    console.log('OK  id=' + j.id + '  ' + j.source_url);
  }
})();
