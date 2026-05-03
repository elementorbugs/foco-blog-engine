// chart-kit.js
// Inline SVG chart generators with scoped CSS classes, optimized for the FOCO
// dark-mode blog. All output is wrapped in <!-- wp:html --> blocks so WordPress
// won't inject <p> or <br> tags. All <style> blocks are minified to one line
// because wpautop() rewrites multiline CSS into garbage.
//
// Used by create-post.js (via chart-configs.js) to inject charts into posts.
// Primitives: horizontalBar, donutChart, stackedCompare, statGrid,
//             progressTimeline, infographicList.

let _uid = 0;
function uid() { return 'foco-chart-' + (++_uid); }

const C = {
  text:          '#FFFFFF',
  muted:         '#B8B0CC',
  primary:       '#7C3AED',
  primary2:      '#A78BFA',
  primarySoft:   'rgba(124, 58, 237, 0.18)',
  celebrate:     '#FB923C',
  celebrateSoft: 'rgba(251, 146, 60, 0.22)',
  bg:            '#0a0410',
  bgInner:       'rgba(255, 255, 255, 0.035)',
  border:        'rgba(167, 139, 250, 0.18)',
  borderStrong:  'rgba(167, 139, 250, 0.4)',
  danger:        '#ef4444',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function minifyStyles(html) {
  return html.replace(/<style>([\s\S]*?)<\/style>/g, (m, css) => {
    return '<style>' + css.replace(/\s*\n\s*/g, '').replace(/\s{2,}/g, ' ').trim() + '</style>';
  });
}

function wpSafe(html) {
  let out = minifyStyles(html);
  out = out.replace(/\n\s*/g, '');
  return '<!-- wp:html -->' + out + '<!-- /wp:html -->';
}

function wrapper({ title, caption, svg, source }) {
  const id = uid();
  const src = source ? `<p class="${id}-src">${esc(source)}</p>` : '';
  const cap = caption ? `<p class="${id}-cap">${esc(caption)}</p>` : '';
  return wpSafe(`<figure class="${id}"><style>.${id}{margin:32px 0;padding:28px;background:${C.bg};border:1px solid ${C.border};border-radius:20px;box-sizing:border-box;max-width:100%;overflow:hidden;color:${C.text}}.${id} figcaption{font-size:19px;font-weight:700;color:${C.text};margin-bottom:20px;line-height:1.3}.${id}-cap{font-size:15px;color:${C.muted};margin:14px 0 0;line-height:1.5}.${id}-src{font-size:13px;color:${C.muted};margin:8px 0 0;font-style:italic;opacity:0.75}.${id} svg{display:block;width:100%;height:auto;max-width:100%}@media(max-width:600px){.${id}{padding:18px;margin:22px 0;border-radius:16px}.${id} figcaption{font-size:16px;margin-bottom:14px}.${id}-cap{font-size:13px}.${id}-src{font-size:11px}}</style><figcaption>${esc(title)}</figcaption>${svg}${cap}${src}</figure>`);
}

// ─── horizontalBar ───────────────────────────────────────────────────────────
// Use when comparing 2-5 categories on a single metric.
function horizontalBar({ title, bars, source, caption, unit = '%' }) {
  const id = uid();
  const max = Math.max(...bars.map(b => b.value));
  const rowH = 56;
  const labelW = 200;
  const chartW = 520;
  const totalW = labelW + chartW + 80;
  const totalH = bars.length * rowH + 20;

  let rows = '';
  bars.forEach((b, i) => {
    const barW = (b.value / max) * chartW;
    const y = i * rowH + 30;
    const color = b.highlight ? C.primary : (b.color || C.primary2);
    rows += `
    <text x="0" y="${y + 6}" font-size="15" fill="${C.text}" font-weight="600" class="${id}-lbl">${esc(b.label)}</text>
    <rect x="${labelW}" y="${y - 12}" width="${barW}" height="22" rx="4" fill="${color}"/>
    <text x="${labelW + barW + 10}" y="${y + 6}" font-size="16" fill="${C.text}" font-weight="700">${b.value}${esc(unit)}</text>`;
  });

  const svg = `
  <style>@media(max-width:600px){.${id}-lbl{font-size:12px !important}}</style>
  <svg viewBox="0 0 ${totalW} ${totalH}" preserveAspectRatio="xMinYMin meet" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(title)}">${rows}</svg>`;
  return wrapper({ title, caption, svg, source });
}

// ─── donutChart ──────────────────────────────────────────────────────────────
// One headline percentage with a label. Best for "X% of people experience Y".
function donutChart({ title, value, label, source, caption, unit = '%' }) {
  const id = uid();
  const pct = Math.min(100, Math.max(0, value));
  const r = 70, cx = 100, cy = 100, stroke = 22;
  const c = 2 * Math.PI * r;
  const fill = (pct / 100) * c;

  const svg = `
  <style>
    .${id}-wrap{display:flex;align-items:center;gap:32px;flex-wrap:wrap}
    .${id}-txt{flex:1;min-width:160px}
    .${id}-txt h4{font-size:18px;font-weight:700;color:${C.text};margin:0 0 8px}
    .${id}-txt p{font-size:14px;color:${C.muted};margin:0;line-height:1.5}
    @media(max-width:600px){
      .${id}-wrap{flex-direction:column;align-items:center;text-align:center;gap:16px}
      .${id}-wrap svg{width:160px;height:160px}
      .${id}-txt h4{font-size:16px}.${id}-txt p{font-size:13px}
    }
  </style>
  <div class="${id}-wrap">
    <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(title)}" style="flex-shrink:0">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="${stroke}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.primary}" stroke-width="${stroke}" stroke-dasharray="${fill} ${c - fill}" stroke-dashoffset="${c / 4}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"/>
      <text x="${cx}" y="${cy - 5}" font-size="42" font-weight="800" fill="${C.text}" text-anchor="middle">${pct}${esc(unit)}</text>
      <text x="${cx}" y="${cy + 20}" font-size="13" fill="${C.muted}" text-anchor="middle">${esc(label || '')}</text>
    </svg>
    <div class="${id}-txt"><h4>${esc(label || '')}</h4><p>You're not alone in this.</p></div>
  </div>`;
  return wrapper({ title, caption, svg, source });
}

// ─── stackedCompare ──────────────────────────────────────────────────────────
// Side-by-side comparison across multiple metrics. e.g. "Women vs Men" rows.
function stackedCompare({ title, source, caption, leftLabel, rightLabel, segments }) {
  const id = uid();
  const rowH = 68;
  const totalH = segments.length * rowH + 40;
  const leftX = 120, barW = 380, totalW = leftX + barW + 80;
  let rows = '';
  segments.forEach((s, i) => {
    const y = i * rowH + 30;
    const lw = (s.left / 100) * barW;
    rows += `
    <text x="0" y="${y + 16}" font-size="13" font-weight="600" fill="${C.text}" class="${id}-lbl">${esc(s.label)}</text>
    <rect x="${leftX}" y="${y + 22}" width="${barW}" height="20" rx="4" fill="${C.bgInner}"/>
    <rect x="${leftX}" y="${y + 22}" width="${lw}" height="20" rx="4" fill="${C.primary}"/>
    <text x="${leftX + lw - 8}" y="${y + 37}" font-size="12" font-weight="700" fill="white" text-anchor="end">${s.left}%</text>
    <text x="${leftX + barW + 10}" y="${y + 37}" font-size="12" font-weight="700" fill="${C.text}">${s.right}%</text>`;
  });
  const svg = `
  <style>@media(max-width:600px){.${id}-lbl{font-size:10px !important}}</style>
  <svg viewBox="0 0 ${totalW} ${totalH}" preserveAspectRatio="xMinYMin meet" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(title)}">
    <text x="${leftX}" y="12" font-size="13" font-weight="700" fill="${C.primary2}">${esc(leftLabel)}</text>
    <text x="${leftX + barW + 10}" y="12" font-size="13" font-weight="700" fill="${C.muted}">${esc(rightLabel)}</text>
    ${rows}
  </svg>`;
  return wrapper({ title, caption, svg, source });
}

// ─── statGrid ────────────────────────────────────────────────────────────────
// 2-4 big stats in a row. Use for "the math" or "key numbers" callouts.
function statGrid({ title, caption, source, stats }) {
  const id = uid();
  const cells = stats.map(s => `
    <div class="${id}-cell">
      <div class="${id}-val">${esc(s.value)}${s.unit ? `<span class="${id}-unit">${esc(s.unit)}</span>` : ''}</div>
      <div class="${id}-lbl">${esc(s.label)}</div>
    </div>`).join('');
  const svg = `
  <style>
    .${id}-grid{display:flex;flex-wrap:wrap;gap:12px}
    .${id}-cell{flex:1 1 180px;text-align:center;padding:20px 14px;background:${C.bgInner};border:1px solid ${C.border};border-radius:14px;min-width:0}
    .${id}-val{font-size:38px;font-weight:800;color:${C.primary2};line-height:1;letter-spacing:-0.02em}
    .${id}-unit{font-size:20px;color:${C.muted};margin-left:2px}
    .${id}-lbl{font-size:13px;color:${C.muted};margin-top:10px;line-height:1.4}
    @media(max-width:600px){
      .${id}-cell{flex:1 1 100%;padding:16px 12px}
      .${id}-val{font-size:30px}.${id}-lbl{font-size:12px}
    }
  </style>
  <div class="${id}-grid">${cells}</div>`;
  return wrapper({ title, caption, svg, source });
}

// ─── progressTimeline ────────────────────────────────────────────────────────
// 3-5 sequential steps (a process, a phased rollout, stages of a thing).
function progressTimeline({ title, caption, source, steps }) {
  const id = uid();
  const stepItems = steps.map((s, i) => `
    <div class="${id}-step">
      <div class="${id}-num">${i + 1}</div>
      <div class="${id}-txt">
        <strong>${esc(s.label)}</strong>
        ${s.sub ? `<span>${esc(s.sub)}</span>` : ''}
      </div>
    </div>`).join(`<div class="${id}-connector"></div>`);

  const svg = `
  <style>
    .${id}-timeline{display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding:8px 0}
    .${id}-step{display:flex;flex-direction:column;align-items:center;text-align:center;min-width:100px;flex:1}
    .${id}-num{width:36px;height:36px;background:linear-gradient(135deg,${C.primary},${C.primary2});color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0;box-shadow:0 8px 24px rgba(124,58,237,0.4)}
    .${id}-txt{margin-top:12px}
    .${id}-txt strong{display:block;font-size:14px;color:${C.text}}
    .${id}-txt span{display:block;font-size:12px;color:${C.muted};margin-top:4px}
    .${id}-connector{width:24px;min-width:16px;height:3px;background:${C.border};margin-top:17px;flex-shrink:0;border-radius:2px}
    @media(max-width:600px){
      .${id}-timeline{flex-direction:column;gap:0;align-items:stretch}
      .${id}-step{flex-direction:row;text-align:left;min-width:0;gap:14px;padding:10px 0}
      .${id}-connector{width:3px;height:18px;margin:0 0 0 17px}
      .${id}-txt{margin-top:0}
    }
  </style>
  <div class="${id}-timeline">${stepItems}</div>`;
  return wrapper({ title, caption, svg, source });
}

// ─── infographicList ─────────────────────────────────────────────────────────
// 3-12 items with icon + label + optional value. Replaces bullet lists for
// scannability. Uses real emoji as the icon.
function infographicList({ title, caption, source, items }) {
  const id = uid();
  const cells = items.map(it => `
    <div class="${id}-item">
      <div class="${id}-icon">${esc(it.icon)}</div>
      <div class="${id}-body">
        <div class="${id}-lbl">${esc(it.label)}</div>
        ${it.value ? `<div class="${id}-val">${esc(it.value)}</div>` : ''}
      </div>
    </div>`).join('');
  const svg = `
  <style>
    .${id}-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
    .${id}-item{display:flex;align-items:center;gap:14px;padding:14px 16px;background:${C.bgInner};border:1px solid ${C.border};border-radius:12px;transition:border-color 0.2s}
    .${id}-icon{font-size:28px;flex-shrink:0;line-height:1}
    .${id}-body{flex:1;min-width:0}
    .${id}-lbl{font-size:15px;font-weight:700;color:${C.text};line-height:1.3}
    .${id}-val{font-size:13px;color:${C.primary2};font-weight:600;margin-top:4px}
    @media(max-width:600px){
      .${id}-grid{grid-template-columns:1fr}
      .${id}-item{padding:12px 14px}
      .${id}-icon{font-size:24px}
      .${id}-lbl{font-size:14px}.${id}-val{font-size:12px}
    }
  </style>
  <div class="${id}-grid">${cells}</div>`;
  return wrapper({ title, caption, svg, source });
}

module.exports = {
  horizontalBar,
  donutChart,
  stackedCompare,
  statGrid,
  progressTimeline,
  infographicList,
  colors: C,
};
