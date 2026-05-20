// client.js — Form submission, SSE progress, copy-to-clipboard for FOCO YouTube Studio.

const $ = (id) => document.getElementById(id);
const form = $('form');
const submitBtn = $('submit');
const progressEl = $('progress');
const progressList = $('progressList');
const thumbStep = $('thumbStep');
const resultsEl = $('results');
const errorBox = $('errorBox');

const JOB_STORAGE_KEY = 'foco-yt-job';

function saveJob(jobId, opts) {
  try { localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify({ jobId, ...opts })); } catch {}
}
function loadJob() {
  try {
    const raw = localStorage.getItem(JOB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearJob() {
  try { localStorage.removeItem(JOB_STORAGE_KEY); } catch {}
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function setStep(step, state) {
  const li = progressList.querySelector(`[data-step="${step}"]`);
  if (!li) return;
  li.classList.remove('active', 'done');
  if (state === 'active') li.classList.add('active');
  if (state === 'done') li.classList.add('done');
  const icon = li.querySelector('.icon');
  if (state === 'active') icon.textContent = '●';
  else if (state === 'done') icon.textContent = '✓';
  else icon.textContent = '○';
}

function resetProgress(withThumbs) {
  ['saving', 'metadata', 'video-25', 'video-50', 'video-90', 'thumbnails'].forEach(s => setStep(s, 'pending'));
  thumbStep.style.display = withThumbs ? '' : 'none';
  errorBox.classList.remove('active');
  errorBox.innerHTML = '';
  resultsEl.classList.remove('active');
  resultsEl.innerHTML = '';
}

function showError(msg) {
  errorBox.classList.add('active');
  errorBox.innerHTML = `<strong>Something went wrong.</strong><br>${msg}`;
}

function renderResults(payload) {
  const { metadata, filled, files } = payload;
  const tagsStr = (metadata.tags || []).join(', ');
  const hashtags = (String(metadata.description_template || '').match(/#[A-Za-z][A-Za-z0-9]+/g) || [])
    .filter((t, i, a) => a.findIndex(x => x.toLowerCase() === t.toLowerCase()) === i);
  const hashtagsStr = hashtags.join(' ');

  const blocks = [];

  blocks.push(`
    <div class="card shared-block">
      <h2>Shared across all 3 videos</h2>
      <div class="meta-field">
        <div class="meta-label">
          <span>Title template (only {N} changes)</span>
          <button type="button" class="copy-btn" data-copy="${escapeAttr(metadata.title_template || '')}">Copy template</button>
        </div>
        <div class="meta-value">${escapeHtml(metadata.title_template || '')}</div>
      </div>
      <div class="meta-field">
        <div class="meta-label">
          <span>Tags (paste comma-separated into YouTube)</span>
          <button type="button" class="copy-btn" data-copy="${escapeAttr(tagsStr)}">Copy tags</button>
        </div>
        <div class="meta-value">${escapeHtml(tagsStr)}</div>
      </div>
      ${hashtags.length ? `
      <div class="meta-field">
        <div class="meta-label">
          <span>Hashtags (first 3 show above title on mobile)</span>
          <button type="button" class="copy-btn" data-copy="${escapeAttr(hashtagsStr)}">Copy hashtags</button>
        </div>
        <div class="meta-value">${escapeHtml(hashtagsStr)}</div>
      </div>
      ` : ''}
      <div class="meta-field">
        <div class="meta-label">
          <span>Pinned comment</span>
          <button type="button" class="copy-btn" data-copy="${escapeAttr(metadata.pinned_comment || '')}">Copy comment</button>
        </div>
        <div class="meta-value">${escapeHtml(metadata.pinned_comment || '')}</div>
      </div>
    </div>
  `);

  for (const mins of [25, 50, 90]) {
    const f = filled && filled[mins];
    if (!f) continue;
    const video = files.videos && files.videos[mins];
    const thumb = files.thumbnails && files.thumbnails[mins];

    const downloads = [];
    if (video) downloads.push(`<a class="dl-btn dl-btn-video" href="/file/${encodeURIComponent(video)}" target="_blank" download><span class="dl-icon">↓</span><span class="dl-text"><span class="dl-title">Video MP4</span><span class="dl-sub">${escapeHtml(video)}</span></span></a>`);
    if (thumb) downloads.push(`<a class="dl-btn dl-btn-thumb" href="/file/${encodeURIComponent(thumb)}" target="_blank" download><span class="dl-icon">↓</span><span class="dl-text"><span class="dl-title">Thumbnail PNG</span><span class="dl-sub">${escapeHtml(thumb)}</span></span></a>`);

    blocks.push(`
      <div class="duration-block">
        <div class="duration-header">
          <div class="duration-pill">${mins} MIN</div>
        </div>
        ${downloads.length ? `<div class="dl-row">${downloads.join('')}</div>` : ''}
        <div class="meta-field">
          <div class="meta-label">
            <span>Title (${f.title.length} chars — ready to paste)</span>
            <button type="button" class="copy-btn" data-copy="${escapeAttr(f.title)}">Copy</button>
          </div>
          <div class="meta-value">${escapeHtml(f.title)}</div>
        </div>
        <div class="meta-field">
          <div class="meta-label">
            <span>Full description (ready to paste)</span>
            <button type="button" class="copy-btn" data-copy="${escapeAttr(f.description)}">Copy full</button>
          </div>
          <div class="meta-value">${escapeHtml(f.description)}</div>
        </div>
      </div>
    `);
  }

  if (files.metadataDocx || files.metadataTxt) {
    const dl = [];
    if (files.metadataDocx) dl.push(`<a class="dl-btn" href="/file/${encodeURIComponent(files.metadataDocx)}" target="_blank" download><span class="dl-icon">📄</span><span class="dl-text"><span class="dl-title">Word Document (.docx)</span><span class="dl-sub">Formatted, clickable links, FOCO-styled</span></span></a>`);
    if (files.metadataTxt) dl.push(`<a class="dl-btn dl-btn-thumb" href="/file/${encodeURIComponent(files.metadataTxt)}" target="_blank" download><span class="dl-icon">📋</span><span class="dl-text"><span class="dl-title">Plain Text (.txt)</span><span class="dl-sub">Same content, plain text fallback</span></span></a>`);
    blocks.push(`
      <div class="card">
        <h2>📦 Full package</h2>
        <p style="font-size:14px;color:#B8B0CC;margin-bottom:14px">Everything above in one downloadable file. Word doc is easier to scan and has clickable links.</p>
        <div class="dl-row">${dl.join('')}</div>
      </div>
    `);
  }

  resultsEl.innerHTML = blocks.join('');
  resultsEl.classList.add('active');

  resultsEl.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove('copied');
        }, 1500);
      } catch (e) {
        alert('Copy failed: ' + e.message);
      }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function attachToJob(jobId, wantThumbnails) {
  resetProgress(wantThumbnails);
  progressEl.classList.add('active');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Working…';

  const es = new EventSource(`/progress/${jobId}`);
  let gotAnyEvent = false;

  es.addEventListener('phase', (ev) => {
    gotAnyEvent = true;
    const data = JSON.parse(ev.data);
    if (data.step === 'saving') setStep('saving', 'active');
    else if (data.step === 'saving-done') setStep('saving', 'done');
    else if (data.step.startsWith('video-')) {
      const mins = data.step.split('-')[1];
      if (data.state === 'start') setStep(`video-${mins}`, 'active');
      if (data.state === 'done') setStep(`video-${mins}`, 'done');
    }
    else if (data.step === 'metadata') setStep('metadata', 'active');
    else if (data.step === 'metadata-done') setStep('metadata', 'done');
    else if (data.step === 'thumbnails') setStep('thumbnails', 'active');
    else if (data.step === 'thumbnails-done') setStep('thumbnails', 'done');
  });
  es.addEventListener('done', (ev) => {
    es.close();
    clearJob();
    const payload = JSON.parse(ev.data);
    renderResults(payload);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate another session';
  });
  es.addEventListener('error', (ev) => {
    es.close();
    // If we never got any event AND no explicit error data, the job ID is stale
    // (server restarted or GC'd). Clear silently and reset UI.
    if (!gotAnyEvent && !ev.data) {
      clearJob();
      progressEl.classList.remove('active');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate session pack';
      return;
    }
    let msg = 'Connection to server lost. The render may still be running — check video-assets/ folder.';
    try {
      if (ev.data) {
        const d = JSON.parse(ev.data);
        msg = d.message || msg;
        clearJob();
      }
    } catch {}
    showError(msg);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Try again';
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const image = $('image').files[0];
  const audio = $('audio').files[0];
  const keyword = $('keyword').value.trim();
  const credit = $('credit').value.trim();
  const wantThumbnails = $('thumbnails').checked;

  if (!image || !audio || !keyword) {
    showError('Please fill all required fields.');
    progressEl.classList.add('active');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Working…';
  resetProgress(wantThumbnails);
  progressEl.classList.add('active');

  try {
    const [imageB64, audioB64] = await Promise.all([fileToBase64(image), fileToBase64(audio)]);
    const startRes = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: { name: image.name, data: imageB64 },
        audio: { name: audio.name, data: audioB64 },
        keyword,
        credit,
        thumbnails: wantThumbnails,
      }),
    });
    if (!startRes.ok) {
      const err = await startRes.text();
      throw new Error(err);
    }
    const { jobId } = await startRes.json();
    saveJob(jobId, { thumbnails: wantThumbnails });
    attachToJob(jobId, wantThumbnails);
  } catch (e) {
    showError(e.message || String(e));
    submitBtn.disabled = false;
    submitBtn.textContent = 'Try again';
  }
});

// On page load: if a job was in-flight when the page was closed/refreshed,
// reconnect to it via SSE. Server replays past events + streams live ones.
window.addEventListener('DOMContentLoaded', () => {
  const saved = loadJob();
  if (saved && saved.jobId) {
    attachToJob(saved.jobId, !!saved.thumbnails);
  }
});
