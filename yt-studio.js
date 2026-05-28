#!/usr/bin/env node
// yt-studio.js — FOCO YouTube Studio.
// Local-only web tool that wraps render-focus-video.js + render-thumbnails-v2.js
// and generates YouTube metadata (title, description, chapters, tags, pinned comment)
// via the Anthropic API in Claude's voice.
//
// Usage:
//   node yt-studio.js                  # starts server, opens browser
//   node yt-studio.js --port=4040      # custom port
//   node yt-studio.js --no-open        # skip auto-open browser
//
// Reads .env for ANTHROPIC_API_KEY. Fails fast if missing.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const Busboy = require('busboy');
const { buildPrompt } = require('./yt-studio-prompts');
const { buildMetadataDocx } = require('./yt-studio-docx');
const { fillTemplates, buildMetadataTxt } = require('./yt-studio-text');

// ─── ENV ─────────────────────────────────────────────────────────────────────
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
const E = (k) => process.env[k] || envSources[k] || null;
const ANTHROPIC_API_KEY = E('ANTHROPIC_API_KEY');
if (!ANTHROPIC_API_KEY) {
  console.error('\n✗ ANTHROPIC_API_KEY missing.');
  console.error('  Add it to foco-blog-engine/.env (same key daily-generate.js uses).');
  process.exit(1);
}

// ─── CLI args ────────────────────────────────────────────────────────────────
const arg = (n, fb) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : fb;
};
const flag = (n) => process.argv.includes(`--${n}`);
const PORT = parseInt(arg('port', '3030'), 10);
const NO_OPEN = flag('no-open');

const ASSETS = path.join(__dirname, 'video-assets');
const UI_DIR = path.join(__dirname, 'yt-studio-ui');
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

// ─── job store (in-memory) ───────────────────────────────────────────────────
const jobs = new Map(); // jobId → { listeners:Set<res>, events:[], done:false, result, error }

function newJobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emit(jobId, type, data) {
  const job = jobs.get(jobId);
  if (!job) return;
  const evt = { type, data };
  job.events.push(evt);
  for (const res of job.listeners) {
    try {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  }
  if (type === 'done' || type === 'error') {
    job.done = true;
    if (type === 'done') job.result = data;
    if (type === 'error') job.error = data;
    setTimeout(() => jobs.delete(jobId), 5 * 60 * 1000); // GC after 5min
  }
}

// ─── slug helper ─────────────────────────────────────────────────────────────
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/-$/, '');
}

// ─── Anthropic API ───────────────────────────────────────────────────────────
function anthropicRequest(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    };
    const r = https.request(opts, (res) => {
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

// Extract the first balanced {...} block from text (handles nested objects).
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

async function generateMetadata({ keyword, credit }) {
  const prompt = buildPrompt({ keyword, credit });
  const r = await anthropicRequest({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body || {});
  if (r.status === 400 && /credit balance.*too low/i.test(bodyStr)) {
    throw new Error('Anthropic API credit balance too low. Top up at https://console.anthropic.com/settings/billing');
  }
  if (r.status !== 200 || !r.body.content || !r.body.content[0]) {
    throw new Error(`Claude API failed (status ${r.status}): ${bodyStr.slice(0, 300)}`);
  }
  const text = r.body.content[0].text || '';
  const jsonBlock = extractJsonBlock(text);
  if (!jsonBlock) throw new Error('Could not find JSON in Claude response: ' + text.slice(0, 200));
  let parsed;
  try {
    parsed = JSON.parse(jsonBlock);
  } catch (e) {
    throw new Error('Failed to parse Claude JSON: ' + e.message + '\nRaw: ' + jsonBlock.slice(0, 300));
  }
  // Guarantee tags are always present — required by every downstream consumer.
  if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) {
    throw new Error('Claude returned no tags. Cannot proceed — every pack must have a tags list. Raw response: ' + JSON.stringify(parsed).slice(0, 400));
  }
  if (parsed.tags.length < 10) {
    console.warn(`⚠ Only ${parsed.tags.length} tags returned — expected 15-20. Proceeding anyway.`);
  }
  return parsed;
}

// ─── render wrappers ─────────────────────────────────────────────────────────
function runChildScript(scriptName, args, onLog) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(__dirname, scriptName), ...args], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    p.stdout.on('data', (d) => { onLog && onLog(d.toString()); process.stdout.write(d); });
    p.stderr.on('data', (d) => { onLog && onLog(d.toString()); process.stderr.write(d); });
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
    p.on('error', reject);
  });
}

async function renderVideo({ imageName, audioName, suffix, minutes, jobId }) {
  emit(jobId, 'phase', { step: `video-${minutes}`, state: 'start' });
  await runChildScript('render-focus-video.js', [
    String(minutes),
    `--image=${imageName}`,
    `--audio=${audioName}`,
    `--suffix=${suffix}`,
  ]);
  emit(jobId, 'phase', { step: `video-${minutes}`, state: 'done' });
}

async function renderThumbnails({ imageName, suffix, jobId }) {
  emit(jobId, 'phase', { step: 'thumbnails' });
  await runChildScript('render-thumbnails-v2.js', [
    `--image=${imageName}`,
    `--suffix=${suffix}`,
  ]);
  emit(jobId, 'phase', { step: 'thumbnails-done' });
}

// Template filling + metadata.txt builder live in yt-studio-text.js (shared with regen-metadata.js)

// ─── job orchestration ───────────────────────────────────────────────────────
async function runJob(jobId, input) {
  try {
    const { imageTmp, audioTmp, imageOriginalName, audioOriginalName, keyword, credit, thumbnails } = input;
    const suffix = slugify(keyword) || 'session';
    const imageExt = (imageOriginalName.match(/\.(png|jpg|jpeg|webp)$/i) || [null, 'png'])[1].toLowerCase();
    const audioExt = (audioOriginalName.match(/\.(mp3|m4a|wav|aac|ogg)$/i) || [null, 'mp3'])[1].toLowerCase();
    const imageName = `yt-${suffix}.${imageExt === 'jpeg' ? 'jpg' : imageExt}`;
    const audioName = `yt-${suffix}.${audioExt}`;

    emit(jobId, 'phase', { step: 'saving' });
    // Files already streamed to disk by busboy; move from temp to canonical name.
    // Use rename then fall back to copy+unlink if rename fails (e.g., target exists on some FS).
    movePath(imageTmp, path.join(ASSETS, imageName));
    movePath(audioTmp, path.join(ASSETS, audioName));
    emit(jobId, 'phase', { step: 'saving-done' });

    // Kick off metadata in parallel with video rendering (metadata returns first).
    emit(jobId, 'phase', { step: 'metadata' });
    const metadataPromise = generateMetadata({ keyword, credit })
      .then(m => { emit(jobId, 'phase', { step: 'metadata-done' }); return m; });

    // Videos run sequentially (FFmpeg saturates CPU; parallel would actually be slower).
    for (const mins of [25, 50, 90]) {
      await renderVideo({ imageName, audioName, suffix, minutes: mins, jobId });
    }

    if (thumbnails) {
      await renderThumbnails({ imageName, suffix, jobId });
    }

    const metadata = await metadataPromise;
    const filled = fillTemplates(metadata);

    // Build metadata files — both .docx (rich) and .txt (plain fallback)
    const metaTxtName = `yt-${suffix}-metadata.txt`;
    let metaDocxName = `yt-${suffix}-metadata.docx`;
    fs.writeFileSync(path.join(ASSETS, metaTxtName), buildMetadataTxt(metadata, filled, suffix));
    const docxBuf = await buildMetadataDocx(metadata, filled, suffix);
    try {
      fs.writeFileSync(path.join(ASSETS, metaDocxName), docxBuf);
    } catch (e) {
      if (e.code === 'EBUSY' || e.code === 'EPERM') {
        metaDocxName = `yt-${suffix}-metadata.new.docx`;
        fs.writeFileSync(path.join(ASSETS, metaDocxName), docxBuf);
        console.warn(`⚠ ${suffix}-metadata.docx was locked (open in Word?). Wrote ${metaDocxName} instead.`);
      } else { throw e; }
    }

    const result = {
      metadata,
      filled,
      files: {
        videos: {
          25: `foco-session-${suffix}-25min.mp4`,
          50: `foco-session-${suffix}-50min.mp4`,
          90: `foco-session-${suffix}-90min.mp4`,
        },
        thumbnails: thumbnails ? {
          25: `thumb-${suffix}-25min.png`,
          50: `thumb-${suffix}-50min.png`,
          90: `thumb-${suffix}-90min.png`,
        } : null,
        metadataTxt: metaTxtName,
        metadataDocx: metaDocxName,
      },
    };
    emit(jobId, 'done', result);
  } catch (e) {
    console.error('[job error]', e);
    emit(jobId, 'error', { message: e.message || String(e) });
  }
}

// ─── HTTP server ─────────────────────────────────────────────────────────────
function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

function mimeFor(p) {
  const ext = path.extname(p).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }[ext] || 'application/octet-stream';
}

// Per-file upload caps. Audio dominates (large MP3s of focus music); image is small.
const UPLOAD_LIMITS = {
  audio: 500 * 1024 * 1024, // 500 MB — fits ~5 hours of 192 kbps MP3
  image: 25 * 1024 * 1024,  // 25 MB — generous for any cover art
};

// Rename, falling back to copy+unlink if the destination exists or rename fails
// across drives (shouldn't happen here since temp + final share ASSETS dir).
function movePath(src, dst) {
  try { fs.renameSync(src, dst); return; }
  catch (e) {
    fs.copyFileSync(src, dst);
    try { fs.unlinkSync(src); } catch {}
  }
}

function safeUnlink(p) {
  if (p && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch {} }
}

// Parse a multipart/form-data POST, streaming file parts directly to temp files
// in ASSETS. Resolves with { files: { [field]: { tmpPath, originalName } }, fields: {...} }.
// On any file exceeding its limit, rejects and cleans up partial temps.
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let bb;
    try { bb = Busboy({ headers: req.headers, limits: { files: 5, fields: 20 } }); }
    catch (e) { return reject(e); }

    const files = {};
    const fields = {};
    const writes = [];
    let failed = null;

    const fail = (err) => {
      if (failed) return;
      failed = err;
      for (const f of Object.values(files)) safeUnlink(f.tmpPath);
      try { req.unpipe(bb); } catch {}
      try { bb.destroy(); } catch {}
      reject(err);
    };

    bb.on('file', (name, file, info) => {
      const { filename } = info;
      const limit = UPLOAD_LIMITS[name] ?? UPLOAD_LIMITS.audio;
      const tmpPath = path.join(ASSETS, `.upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${name}`);
      const sink = fs.createWriteStream(tmpPath);
      files[name] = { tmpPath, originalName: filename || '' };

      let received = 0;
      file.on('data', (chunk) => {
        received += chunk.length;
        if (received > limit) {
          file.unpipe(sink);
          sink.destroy();
          fail(new Error(`${name} file exceeds ${Math.round(limit / 1024 / 1024)} MB limit`));
        }
      });
      file.on('error', fail);
      sink.on('error', fail);
      const done = new Promise((res) => sink.on('close', res));
      writes.push(done);
      file.pipe(sink);
    });

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('error', fail);
    bb.on('finish', async () => {
      if (failed) return;
      await Promise.all(writes);
      if (failed) return;
      resolve({ files, fields });
    });

    req.on('aborted', () => fail(new Error('Client aborted upload')));
    req.pipe(bb);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS not needed (same-origin), but add no-store everywhere for predictability.

  if (req.method === 'GET' && pathname === '/') {
    return serveFile(res, path.join(UI_DIR, 'index.html'), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && pathname === '/client.js') {
    return serveFile(res, path.join(UI_DIR, 'client.js'), 'application/javascript; charset=utf-8');
  }

  // Serve generated files from video-assets/
  if (req.method === 'GET' && pathname.startsWith('/file/')) {
    const name = decodeURIComponent(pathname.slice('/file/'.length));
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      res.writeHead(400); return res.end('Bad path');
    }
    const fp = path.join(ASSETS, name);
    if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': mimeFor(fp),
      'Content-Disposition': `inline; filename="${name}"`,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(fp).pipe(res);
    return;
  }

  if (req.method === 'POST' && pathname === '/generate') {
    try {
      const ct = req.headers['content-type'] || '';
      if (!ct.startsWith('multipart/form-data')) {
        res.writeHead(415); return res.end('Expected multipart/form-data');
      }
      const { files, fields } = await parseMultipart(req);
      if (!files.image || !files.audio || !fields.keyword) {
        safeUnlink(files.image?.tmpPath);
        safeUnlink(files.audio?.tmpPath);
        res.writeHead(400); return res.end('Missing required fields');
      }
      const jobId = newJobId();
      jobs.set(jobId, { listeners: new Set(), events: [], done: false });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jobId }));
      // fire and forget
      runJob(jobId, {
        imageTmp: files.image.tmpPath,
        audioTmp: files.audio.tmpPath,
        imageOriginalName: files.image.originalName,
        audioOriginalName: files.audio.originalName,
        keyword: fields.keyword,
        credit: fields.credit || '',
        thumbnails: fields.thumbnails === 'true' || fields.thumbnails === '1' || fields.thumbnails === 'on',
      });
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(400);
        res.end('Upload failed: ' + (e.message || String(e)));
      }
    }
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/progress/')) {
    const jobId = pathname.slice('/progress/'.length);
    const job = jobs.get(jobId);
    if (!job) { res.writeHead(404); return res.end('Unknown job'); }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
    });
    // Replay any events that already happened
    for (const evt of job.events) {
      res.write(`event: ${evt.type}\n`);
      res.write(`data: ${JSON.stringify(evt.data)}\n\n`);
    }
    if (job.done) {
      res.end();
      return;
    }
    job.listeners.add(res);
    req.on('close', () => job.listeners.delete(res));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function openBrowser(url) {
  const opener = process.platform === 'win32' ? `start "" "${url}"`
              : process.platform === 'darwin' ? `open "${url}"`
              : `xdg-open "${url}"`;
  exec(opener, () => {}); // best-effort
}

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('▶ FOCO YouTube Studio running at ' + url);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
  if (!NO_OPEN) openBrowser(url);
});
