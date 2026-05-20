// yt-studio-text.js — Plain-text metadata.txt builder + template filler.
// Shared between yt-studio.js (server) and regen-metadata.js (CLI).

// Claude returns title_template + description_template with {N} / {CHAPTERS}
// placeholders. We fill them per duration so all 3 videos share one body —
// only the duration number and chapter list differ between them.
function fillTemplates(metadata) {
  const out = {};
  for (const mins of [25, 50, 90]) {
    const d = metadata.per_duration && metadata.per_duration[mins];
    if (!d || !Array.isArray(d.chapters)) continue;
    const title = String(metadata.title_template || '').replace(/\{N\}/g, String(mins));
    const chaptersText = d.chapters.map(c => `${c.time} ${c.label}`).join('\n');
    const description = String(metadata.description_template || '')
      .replace(/\{N\}/g, String(mins))
      .replace(/\{CHAPTERS\}/g, chaptersText);
    out[mins] = { title, description, chapters: d.chapters };
  }
  return out;
}

function extractHashtags(text) {
  const matches = String(text || '').match(/#[A-Za-z][A-Za-z0-9]+/g);
  if (!matches) return [];
  const seen = new Set();
  const out = [];
  for (const tag of matches) {
    const k = tag.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(tag); }
  }
  return out;
}

function buildMetadataTxt(metadata, filled, suffix) {
  const L = [];
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
  L.push('═'.repeat(72));
  L.push(`   FOCO YouTube Pack — ${suffix}`);
  L.push(`   Generated: ${ts}`);
  L.push('═'.repeat(72));
  L.push('');
  L.push('📌 TITLE TEMPLATE   (one title — only {N} changes between videos)');
  L.push('─'.repeat(72));
  L.push(metadata.title_template);
  L.push('─'.repeat(72));
  L.push('');
  L.push('   Filled per duration (paste these as the actual YouTube titles):');
  for (const mins of [25, 50, 90]) {
    if (filled[mins]) L.push(`     → ${mins} min: ${filled[mins].title}    (${filled[mins].title.length} chars)`);
  }
  L.push('');
  L.push('');
  const tags = metadata.tags || [];
  L.push(`📌 TAGS   (${tags.length} keywords — list + comma-separated for paste)`);
  L.push('─'.repeat(72));
  for (const t of tags) L.push(`   • ${t}`);
  L.push('');
  L.push('   ↓ Copy this into YouTube tags field:');
  L.push('   ' + tags.join(', '));
  L.push('─'.repeat(72));
  L.push('');
  L.push('');
  const hashtags = extractHashtags(metadata.description_template);
  if (hashtags.length) {
    L.push(`#️⃣ HASHTAGS   (${hashtags.length} — first 3 show above title on mobile)`);
    L.push('─'.repeat(72));
    L.push(hashtags.join(' '));
    L.push('─'.repeat(72));
    L.push('');
    L.push('');
  }
  L.push('📌 PINNED COMMENT   (paste as first reply after publishing)');
  L.push('─'.repeat(72));
  L.push(metadata.pinned_comment);
  L.push('─'.repeat(72));
  L.push('');
  L.push('');
  L.push('═'.repeat(72));
  L.push('   📝 DESCRIPTIONS — one per duration');
  L.push('   Same body across all 3 — only {N} and chapters change.');
  L.push('═'.repeat(72));
  for (const mins of [25, 50, 90]) {
    if (!filled[mins]) continue;
    L.push('');
    L.push(`╔══ ${mins} MIN ${'═'.repeat(58)}╗`);
    L.push('');
    L.push(filled[mins].description);
    L.push('');
    L.push(`╚${'═'.repeat(68)}╝`);
    L.push('');
  }
  return L.join('\n');
}

module.exports = { fillTemplates, extractHashtags, buildMetadataTxt };
