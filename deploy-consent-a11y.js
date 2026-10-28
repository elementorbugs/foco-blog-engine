// Creates (or updates) the Code Snippets snippet for cookie consent + accessibility fixes.
// Source of truth: homepage-backup/consent-a11y-snippet.php (see homepage-backup/SNIPPETS.md).
//   node deploy-consent-a11y.js            update the snippet (or create it if missing)
// Rollback: wp-admin -> Snippets -> deactivate "FOCO cookie consent + accessibility".
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
const NAME = 'FOCO cookie consent + accessibility (2026-10-28)';
const code = fs.readFileSync(path.join(__dirname, 'homepage-backup', 'consent-a11y-snippet.php'), 'utf8').replace(/^<\?php\s*/, '');

(async () => {
  const list = await (await fetch(BASE + '/wp-json/code-snippets/v1/snippets', { headers: { Authorization: AUTH } })).json();
  const existing = list.find(s => s.name.startsWith('FOCO cookie consent + accessibility'));
  const body = { name: NAME, desc: 'Consent Mode v2 banner (opt-in EEA/UK/CH, opt-out elsewhere), skip link, main landmark, focus styles, video pause, contrast fixes, youtube-nocookie. Deactivate to roll back.', scope: 'front-end', active: true, code };
  const res = await fetch(BASE + '/wp-json/code-snippets/v1/snippets' + (existing ? '/' + existing.id : ''), {
    method: existing ? 'PUT' : 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  console.log(`HTTP ${res.status} | id ${j.id} | active ${j.active} | code_error ${JSON.stringify(j.code_error)}`);
})();
