#!/usr/bin/env node
// regen-metadata.js — Regenerate yt-{suffix}-metadata.txt without re-rendering videos.
// Useful when the SEO prompt evolves but the existing MP4s are fine to keep.
//
// Usage:
//   node regen-metadata.js --suffix=brain-dump --keyword="brain dump" --credit="Pavel Bekirov (Pixabay)"

const fs = require('fs');
const https = require('https');
const path = require('path');
const { buildPrompt } = require('./yt-studio-prompts');
const { buildMetadataDocx } = require('./yt-studio-docx');
const { fillTemplates, buildMetadataTxt } = require('./yt-studio-text');

// ─── ENV (same chain as yt-studio.js) ────────────────────────────────────────
const envSources = {};
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
    if (m) envSources[m[1]] = m[2];
  }
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.foco-config', 'wp-creds.env'));
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || envSources.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY missing.');
  process.exit(1);
}

// ─── CLI args ────────────────────────────────────────────────────────────────
const arg = (n) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : null;
};
const suffix = arg('suffix');
const keyword = arg('keyword');
const credit = arg('credit') || '';
if (!suffix || !keyword) {
  console.error('Usage: node regen-metadata.js --suffix=<s> --keyword="<k>" [--credit="<c>"]');
  process.exit(1);
}

const ASSETS = path.join(__dirname, 'video-assets');

// ─── Anthropic ───────────────────────────────────────────────────────────────
function anthropicRequest(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const r = https.request({
      hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    r.write(payload);
    r.end();
  });
}

function extractJsonBlock(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inStr) { escape = true; continue; }
    if (c === '"') inStr = !inStr;
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`▶ Regenerating metadata for suffix="${suffix}" keyword="${keyword}"`);
  const prompt = buildPrompt({ keyword, credit });
  const t0 = Date.now();
  const r = await anthropicRequest({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`  Claude responded in ${((Date.now() - t0) / 1000).toFixed(1)}s (status ${r.status})`);
  const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body || {});
  if (r.status === 400 && /credit balance.*too low/i.test(bodyStr)) {
    console.error('Anthropic billing low. Top up at console.anthropic.com/settings/billing');
    process.exit(1);
  }
  if (r.status !== 200 || !r.body.content || !r.body.content[0]) {
    console.error(`Claude error: ${bodyStr.slice(0, 500)}`);
    process.exit(1);
  }
  const text = r.body.content[0].text || '';
  const jsonBlock = extractJsonBlock(text);
  if (!jsonBlock) { console.error('No JSON block in response:\n' + text); process.exit(1); }
  let metadata;
  try { metadata = JSON.parse(jsonBlock); }
  catch (e) { console.error('JSON parse failed: ' + e.message + '\nRaw: ' + jsonBlock); process.exit(1); }
  if (!Array.isArray(metadata.tags) || metadata.tags.length === 0) {
    console.error('✗ Claude returned no tags. Cannot proceed — every pack must have a tags list.');
    console.error('  Raw: ' + JSON.stringify(metadata).slice(0, 400));
    process.exit(1);
  }
  if (metadata.tags.length < 10) {
    console.warn(`⚠ Only ${metadata.tags.length} tags returned — expected 15-20. Proceeding anyway.`);
  }
  const filled = fillTemplates(metadata);
  const txt = buildMetadataTxt(metadata, filled, suffix);
  const txtPath = path.join(ASSETS, `yt-${suffix}-metadata.txt`);
  fs.writeFileSync(txtPath, txt);
  const docxBuf = await buildMetadataDocx(metadata, filled, suffix);
  const docxPath = path.join(ASSETS, `yt-${suffix}-metadata.docx`);
  let writtenDocxPath = docxPath;
  try {
    fs.writeFileSync(docxPath, docxBuf);
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      writtenDocxPath = path.join(ASSETS, `yt-${suffix}-metadata.new.docx`);
      fs.writeFileSync(writtenDocxPath, docxBuf);
      console.warn(`⚠ Original .docx is locked (open in Word?). Wrote to ${writtenDocxPath} instead — close Word and rename, or use this directly.`);
    } else { throw e; }
  }
  console.log(`✓ Wrote ${txtPath} (${txt.length} chars)`);
  console.log(`✓ Wrote ${writtenDocxPath} (${(docxBuf.length / 1024).toFixed(1)} KB)`);
  console.log('');
  console.log('Titles preview:');
  for (const mins of [25, 50, 90]) {
    if (filled[mins]) console.log(`  ${mins}min (${filled[mins].title.length}): ${filled[mins].title}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
