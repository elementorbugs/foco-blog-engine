// yt-studio-docx.js — Build a polished Word .docx from the YouTube metadata.
// FOCO-branded headings, clickable hyperlinks, code-styled template blocks, LTR forced.

const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink,
  BorderStyle, ShadingType, AlignmentType, HeadingLevel,
} = require('docx');

const PURPLE = '7C3AED';     // FOCO primary
const LILAC = 'A78BFA';      // FOCO secondary
const ORANGE = 'FB923C';     // FOCO celebrate
const DARK = '1A0A2E';       // body text on white
const MUTED = '6B7280';      // captions/timestamps
const SOFT_PURPLE = 'F3EBFF'; // code-box bg
const SOFT_ORANGE = 'FFF4ED'; // pinned-comment bg
const RULE = 'D1B3FF';        // section dividers

// ─── primitives ──────────────────────────────────────────────────────────────
function para(opts) {
  // bidirectional: false forces LTR even on Hebrew-locale Word installs.
  return new Paragraph({ bidirectional: false, ...opts });
}

function h1(text) {
  return para({
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 40, color: PURPLE, font: 'Calibri' })],
  });
}

function h2(text) {
  return para({
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 30, color: PURPLE, font: 'Calibri' })],
  });
}

function body(text, opts = {}) {
  return para({
    spacing: { after: 100, line: 300 },
    children: [new TextRun({ text, size: 22, color: DARK, font: 'Calibri', ...opts })],
  });
}

function muted(text) {
  return para({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, color: MUTED, italics: true, font: 'Calibri' })],
  });
}

function codeBox(text, bg = SOFT_PURPLE) {
  return para({
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    spacing: { before: 80, after: 80 },
    border: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: LILAC, space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LILAC, space: 4 },
      left:   { style: BorderStyle.SINGLE, size: 4, color: LILAC, space: 8 },
      right:  { style: BorderStyle.SINGLE, size: 4, color: LILAC, space: 8 },
    },
    children: [new TextRun({ text, font: 'Consolas', size: 20, color: DARK })],
  });
}

function quoteBox(text) {
  return para({
    shading: { type: ShadingType.SOLID, color: SOFT_ORANGE, fill: SOFT_ORANGE },
    spacing: { before: 80, after: 80 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: ORANGE, space: 8 },
    },
    children: [new TextRun({ text, size: 22, color: DARK, italics: true, font: 'Calibri' })],
  });
}

function durationBanner(label) {
  return para({
    shading: { type: ShadingType.SOLID, color: PURPLE, fill: PURPLE },
    spacing: { before: 320, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: label, bold: true, size: 32, color: 'FFFFFF', font: 'Calibri' })],
  });
}

function divider() {
  return para({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } },
    children: [new TextRun({ text: '' })],
  });
}

// Parse a multi-line block. Detect URLs and convert to ExternalHyperlinks.
// Each line becomes a Paragraph. Blank lines become empty paragraphs (spacing).
function richBlock(text) {
  const URL_RE = /(https?:\/\/[^\s)]+)/g;
  const paragraphs = [];
  for (const line of String(text).split('\n')) {
    if (line.trim() === '') {
      paragraphs.push(para({ spacing: { after: 80 }, children: [new TextRun({ text: '' })] }));
      continue;
    }
    const runs = [];
    let lastIdx = 0;
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(line)) !== null) {
      if (m.index > lastIdx) {
        runs.push(new TextRun({ text: line.slice(lastIdx, m.index), size: 22, color: DARK, font: 'Calibri' }));
      }
      runs.push(new ExternalHyperlink({
        link: m[1],
        children: [new TextRun({ text: m[1], size: 22, color: PURPLE, font: 'Calibri', underline: {} })],
      }));
      lastIdx = m.index + m[1].length;
    }
    if (lastIdx < line.length) {
      runs.push(new TextRun({ text: line.slice(lastIdx), size: 22, color: DARK, font: 'Calibri' }));
    }
    paragraphs.push(para({ spacing: { after: 80, line: 300 }, children: runs }));
  }
  return paragraphs;
}

// Extract hashtags from description template (they're same across all durations).
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

// ─── document builder ────────────────────────────────────────────────────────
function buildMetadataDocx(metadata, filled, suffix) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const children = [];

  // ─── Cover ───────────────────────────────────────────────────────────────
  children.push(para({
    spacing: { after: 100 },
    children: [new TextRun({ text: '🎧 FOCO YouTube Pack', bold: true, size: 52, color: PURPLE, font: 'Calibri' })],
  }));
  children.push(para({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: 'Pack: ', size: 22, color: MUTED, font: 'Calibri' }),
      new TextRun({ text: suffix, size: 22, color: DARK, bold: true, font: 'Calibri' }),
    ],
  }));
  children.push(para({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: 'Generated: ', size: 20, color: MUTED, font: 'Calibri' }),
      new TextRun({ text: ts, size: 20, color: MUTED, font: 'Calibri' }),
    ],
  }));
  children.push(divider());

  // ─── Title section ───────────────────────────────────────────────────────
  children.push(h2('📌 Title Template'));
  children.push(muted('Same title for all 3 videos — only {N} changes between 25 / 50 / 90.'));
  children.push(codeBox(metadata.title_template || ''));
  children.push(para({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: 'Filled per duration (paste as YouTube titles):', bold: true, size: 22, color: DARK, font: 'Calibri' })],
  }));
  for (const mins of [25, 50, 90]) {
    if (!filled[mins]) continue;
    children.push(para({
      spacing: { after: 60 },
      indent: { left: 240 },
      children: [
        new TextRun({ text: `${mins} min `, size: 22, color: ORANGE, bold: true, font: 'Calibri' }),
        new TextRun({ text: '→ ', size: 22, color: MUTED, font: 'Calibri' }),
        new TextRun({ text: filled[mins].title, size: 22, color: DARK, font: 'Calibri' }),
        new TextRun({ text: `   (${filled[mins].title.length} chars)`, size: 18, color: MUTED, italics: true, font: 'Calibri' }),
      ],
    }));
  }

  // ─── Tags section ────────────────────────────────────────────────────────
  children.push(divider());
  const tags = metadata.tags || [];
  children.push(para({
    spacing: { before: 320, after: 80 },
    children: [
      new TextRun({ text: '📌 Tags', bold: true, size: 30, color: PURPLE, font: 'Calibri' }),
      new TextRun({ text: `   (${tags.length} keywords)`, size: 20, color: MUTED, italics: true, font: 'Calibri' }),
    ],
  }));
  children.push(muted('Visual review list — every keyword on its own line:'));
  for (const tag of tags) {
    children.push(para({
      spacing: { after: 30 },
      indent: { left: 240 },
      children: [
        new TextRun({ text: '•  ', size: 22, color: ORANGE, bold: true, font: 'Calibri' }),
        new TextRun({ text: tag, size: 22, color: DARK, font: 'Calibri' }),
      ],
    }));
  }
  children.push(para({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text: '↓ For pasting into YouTube tags field (comma-separated):', bold: true, size: 22, color: DARK, font: 'Calibri' })],
  }));
  children.push(codeBox(tags.join(', ')));

  // ─── Hashtags section ────────────────────────────────────────────────────
  const hashtags = extractHashtags(metadata.description_template);
  if (hashtags.length) {
    children.push(divider());
    children.push(h2('#️⃣ Hashtags'));
    children.push(muted('The first 3 hashtags appear ABOVE the title on mobile YouTube. Already included at the bottom of each description — surfaced here for quick copy.'));
    children.push(codeBox(hashtags.join(' ')));
  }

  // ─── Pinned Comment section ──────────────────────────────────────────────
  children.push(divider());
  children.push(h2('📌 Pinned Comment'));
  children.push(muted('Paste as the first reply after publishing each video.'));
  children.push(quoteBox(metadata.pinned_comment || ''));

  // ─── Descriptions section ────────────────────────────────────────────────
  children.push(divider());
  children.push(h1('📝 Descriptions'));
  children.push(muted('Same body across all 3 — only {N} and chapter timestamps change.'));

  for (const mins of [25, 50, 90]) {
    const f = filled[mins];
    if (!f) continue;
    children.push(durationBanner(`${mins} MIN`));
    for (const p of richBlock(f.description)) children.push(p);
  }

  const doc = new Document({
    creator: 'FOCO YouTube Studio',
    title: `FOCO YouTube Pack — ${suffix}`,
    description: 'YouTube metadata pack — titles, tags, descriptions, pinned comment.',
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }, // 1in
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { buildMetadataDocx };
