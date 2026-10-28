// FOCO visual timer engine. Counts from timestamps (accurate in background tabs), draws the wedge,
// mirrors the countdown into the tab title and favicon, makes every sound with Web Audio (no files),
// keeps the screen awake on request and remembers settings. Works without storage, audio or wake lock.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var root = $('vt'), disc = $('vt-disc'), wedge = $('vt-wedge'), full = $('vt-full');
  var digits = $('vt-digits'), hubStep = $('vt-hub-step'), stepInput = $('vt-step');
  var goBtn = $('vt-go'), endBox = $('vt-end'), controls = $('vt-controls'), live = $('vt-live');
  var R = 100, MIN = 60000, DEFAULT_TITLE = document.title;
  var COLORS = { purple: ['#7C3AED', '#A78BFA'], orange: ['#F97316', '#FDBA74'], red: ['#E5484D', '#FF8A8F'], teal: ['#14B8A6', '#5EEAD4'], lilac: ['#A78BFA', '#E9D5FF'] };

  // ---------- state ----------
  var S = { total: 5 * MIN, remaining: 5 * MIN, running: false, endAt: 0, phase: 'focus', focusTotal: 5 * MIN,
    color: 'purple', face: 'clock', sound: 'bell', vol: 70, noise: 'off',
    halfway: true, lastMinute: true, digits: true, awake: false, loop: false, notify: false, step: '' };
  var flags = { half: false, last: false };
  // 'digits' is deliberately not remembered: hidden numbers on a later visit look like a broken timer
  var KEEP = ['color', 'face', 'sound', 'vol', 'noise', 'halfway', 'lastMinute', 'awake', 'loop', 'notify'];
  function save() { try { var o = {}; KEEP.forEach(function (k) { o[k] = S[k]; }); o.m = S.focusTotal / MIN; o.v = 2; localStorage.setItem('focoVT', JSON.stringify(o)); } catch (e) {} }
  function load() {
    try { var o = JSON.parse(localStorage.getItem('focoVT') || '{}'); if (o.v !== 2) o = {}; KEEP.forEach(function (k) { if (k in o) S[k] = o[k]; }); if (!COLORS[S.color]) S.color = 'purple'; if (o.m > 0) setTotal(o.m * MIN, true); } catch (e) {}
    if (window.VT_PRESET > 0) setTotal(window.VT_PRESET * MIN, true);
    var q = new URLSearchParams(location.search);
    if (q.get('min')) { var ms = parseTime(q.get('min')); if (ms) setTotal(ms, true); }
    if (COLORS[q.get('c')]) S.color = q.get('c');
    if (q.get('face') === 'fill' || q.get('face') === 'clock') S.face = q.get('face');
    if (q.get('step')) { S.step = q.get('step').slice(0, 48); stepInput.value = S.step; }
    if (q.get('digits') === '0') S.digits = false;
  }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }

  // ---------- time parsing: "7", "7m", "90s", "1h30", "1:30", "1.5h" ----------
  function parseTime(v) {
    v = String(v || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!v) return 0;
    var m;
    if ((m = v.match(/^(\d+):(\d{1,2}):(\d{1,2})$/))) return ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000;
    if ((m = v.match(/^(\d+):(\d{1,2})$/))) return (+m[1] * 60 + +m[2]) * 1000;
    if ((m = v.match(/^(\d+(?:\.\d+)?)$/))) return +m[1] * MIN;
    var total = 0, re = /(\d+(?:\.\d+)?)(h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)/g, hit = false;
    while ((m = re.exec(v))) { hit = true; var n = +m[1], u = m[2][0]; total += u === 'h' ? n * 3600000 : u === 'm' ? n * MIN : n * 1000; }
    if (!hit && (m = v.match(/^(\d+)h(\d+)$/))) return (+m[1] * 60 + +m[2]) * MIN;
    if ((m = v.match(/h(\d+)$/))) total += +m[1] * MIN; // "1h30"
    return hit ? Math.min(total, 12 * 3600000) : 0;
  }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h ? h + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0');
  }

  // ---------- drawing ----------
  function wedgePath(deg) {
    var a = deg * Math.PI / 180, x = -R * Math.sin(a), y = -R * Math.cos(a);
    return 'M0 0 L0 ' + (-R) + ' A' + R + ' ' + R + ' 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Z';
  }
  // a 60-minute clock face, like a classic Time Timer; only timers longer than an hour use the whole circle
  function face() { return S.total <= 60 * MIN ? 'clock' : 'fill'; }
  var drawnFace = '';
  function drawNums() {
    drawnFace = face();
    var g = $('vt-nums'), out = '';
    if (drawnFace === 'clock') for (var i = 0; i < 12; i += 3) {
      var a = -i * 30 * Math.PI / 180, r = 113;
      out += '<text x="' + (r * Math.sin(a)).toFixed(1) + '" y="' + (-r * Math.cos(a) + 4).toFixed(1) + '" text-anchor="middle">' + (i * 5) + '</text>';
    }
    g.innerHTML = out;
  }
  function remainingNow() { return S.running ? Math.max(0, S.endAt - Date.now()) : S.remaining; }
  var lastTitle = '', lastFavKey = '';
  function render() {
    var rem = remainingNow();
    if (face() !== drawnFace) drawNums();
    var deg = drawnFace === 'clock' ? Math.min(rem / (60 * MIN), 1) * 360 : (S.total ? rem / S.total * 360 : 0);
    var isFull = deg >= 359.95;
    full.style.display = isFull ? "" : "none"; wedge.style.display = isFull || deg <= 0.05 ? 'none' : '';
    if (!isFull && deg > 0.05) wedge.setAttribute('d', wedgePath(deg));
    digits.textContent = fmt(rem);
    var dt = $('vt-dock-time'); if (dt) { dt.textContent = fmt(rem); $('vt-dock-step').textContent = S.phase === 'break' ? 'Break' : S.step; $('vt-dock-go').textContent = goBtn.textContent; }
    var mins = Math.round(rem / MIN);
    disc.setAttribute('aria-valuenow', Math.min(60, mins));
    disc.setAttribute('aria-valuetext', fmt(rem).replace(':', ' minutes ') + ' seconds left');
    root.classList.toggle('is-half', S.halfway && flags.half && !flags.last);
    root.classList.toggle('is-last', S.lastMinute && flags.last);
    root.classList.toggle('vt-running', S.running);
    root.classList.toggle('vt-active', S.running || (rem > 0 && rem < S.total));
    var t = (S.running || rem < S.total) && rem > 0 ? fmt(rem) + (S.phase === 'break' ? ' · Break' : S.step ? ' · ' + S.step : ' · Visual Timer') : DEFAULT_TITLE;
    if (t !== lastTitle) { document.title = t; lastTitle = t; }
    drawFavicon(rem, deg);
  }
  var favCanvas = document.createElement('canvas'); favCanvas.width = favCanvas.height = 64;
  var favLink = $('fav'), favDefault = favLink ? favLink.href : '';
  function drawFavicon(rem, deg) {
    if (!favLink) return;
    var active = S.running || (rem > 0 && rem < S.total);
    var key = active ? S.color + Math.round(deg) : 'idle';
    if (key === lastFavKey) return; lastFavKey = key;
    if (!active) { favLink.href = favDefault; return; }
    try {
      var c = favCanvas.getContext('2d'); c.clearRect(0, 0, 64, 64);
      c.fillStyle = '#2a1c48'; c.beginPath(); c.arc(32, 32, 31, 0, Math.PI * 2); c.fill();
      c.fillStyle = COLORS[S.color][0]; c.beginPath(); c.moveTo(32, 32);
      c.arc(32, 32, 31, -Math.PI / 2 - deg * Math.PI / 180, -Math.PI / 2); c.closePath(); c.fill();
      favLink.href = favCanvas.toDataURL('image/png');
    } catch (e) {}
  }

  // ---------- setting the time ----------
  var USES = { 1: '1 minute: a breath, a stretch, or one sip of water.', 2: '2 minutes: the tiniest start. Open the file, then decide.', 5: "5 minutes: start one tiny thing. Most tasks feel lighter once they've begun.", 10: '10 minutes: a short sprint, a tidy-up, or a reply to one email.', 15: '15 minutes: an inbox pass, a kitchen reset, a creative burst.', 20: '20 minutes: reading, writing or a focused admin block.', 25: '25 minutes: one Pomodoro. Turn on rounds for a 5-minute break after.', 30: '30 minutes: a proper session to plan, write or study.', 45: '45 minutes: deep work. Try the halfway cue to check in.', 60: '60 minutes: a full hour. The whole circle, counting down.' };
  function useLine() { var m = S.total / MIN, el = $('vt-use'); if (el) el.textContent = USES[m] || (fmt(S.total) + ' on the clock. Press Start when you are ready.'); }
  function markPreset() {
    var m = S.total / MIN;
    document.querySelectorAll('.vt-presets [data-m]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.m === m)); });
    useLine();
  }
  function setTotal(ms, silent) {
    ms = Math.max(0, Math.min(ms, 12 * 3600000));
    S.total = S.remaining = S.focusTotal = ms; S.phase = 'focus';
    if (S.running) S.endAt = Date.now() + ms; else goBtn.textContent = 'Start';
    flags.half = flags.last = false;
    if (!silent) { hideEnd(); markPreset(); render(); save(); }
  }
  function addTime(ms) {
    var rem = remainingNow() + ms;
    if (S.running) S.endAt += ms; else S.remaining = rem;
    if (rem > S.total) S.total = rem;
    if (rem > S.total / 2) flags.half = false;
    if (rem > MIN) flags.last = false;
    hideEnd(); render();
  }

  // ---------- run ----------
  function start() {
    if (S.remaining <= 0) S.remaining = S.total;
    if (S.remaining <= 0) return;
    unlockAudio();
    S.running = true; S.endAt = Date.now() + S.remaining; pose('focus');
    goBtn.textContent = 'Pause'; hideEnd();
    startNoise(); keepAwake(true); loop();
    track('timer_start', { minutes: Math.round(S.total / MIN), phase: S.phase });
  }
  function pause() {
    if (!S.running) return;
    S.remaining = Math.max(0, S.endAt - Date.now()); S.running = false;
    goBtn.textContent = 'Resume'; stopNoise(); keepAwake(false); render();
  }
  function reset() {
    S.running = false; S.phase = 'focus'; S.total = S.remaining = S.focusTotal; flags.half = flags.last = false;
    goBtn.textContent = 'Start'; stopNoise(); keepAwake(false); hideEnd(); markPreset(); render();
  }
  function finish() {
    S.running = false; S.remaining = 0; flags.half = flags.last = false;
    stopNoise(); render(); playSound(S.sound, 2); pose('done');
    var wasBreak = S.phase === 'break';
    say(wasBreak ? 'Break is over.' : "Time's up.");
    if (S.notify && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification(wasBreak ? 'Break is over' : "Time's up", { body: S.step || 'FOCO visual timer', icon: favDefault }); } catch (e) {}
    }
    track('timer_end', { minutes: Math.round(S.total / MIN), phase: S.phase });
    if (S.loop) {
      S.phase = wasBreak ? 'focus' : 'break';
      S.total = S.remaining = wasBreak ? S.focusTotal : 5 * MIN;
      hubStep.textContent = S.phase === 'break' ? 'Break' : S.step;
      setTimeout(start, 1500);
      return;
    }
    keepAwake(false); goBtn.textContent = 'Start';
    $('vt-end-title').textContent = S.step ? 'Time is up for: ' + S.step : "Time's up.";
    controls.hidden = true; endBox.hidden = false; $('vt-more').focus({ preventScroll: true });
  }
  function hideEnd() { endBox.hidden = true; controls.hidden = false; pose('focus'); }
  var mascot = $('vt-mascot'), poses = mascot ? { focus: mascot.getAttribute('src'), done: mascot.getAttribute('data-done') || mascot.getAttribute('src') } : {};
  function pose(p) { if (mascot && poses[p] && mascot.getAttribute('src') !== poses[p]) mascot.setAttribute('src', poses[p]); }

  var rafId = 0, lastSaid = -1;
  function loop() { cancelAnimationFrame(rafId); if (S.running) rafId = requestAnimationFrame(function () { check(); loop(); }); }
  function check() {
    if (!S.running) return;
    var rem = S.endAt - Date.now();
    if (rem <= 0) { finish(); return; }
    if (S.halfway && !flags.half && S.total >= 2 * MIN && rem <= S.total / 2) { flags.half = true; playSound('cue', 1); say('Halfway.'); }
    if (S.lastMinute && !flags.last && S.total > 2 * MIN && rem <= MIN) { flags.last = true; playSound('cue', 2); say('One minute left.'); }
    var m = Math.ceil(rem / MIN);
    if (m !== lastSaid && rem > MIN) { lastSaid = m; if (m % 5 === 0) say(m + ' minutes left.'); }
    render();
  }
  setInterval(check, 500); // keeps going when rAF sleeps in a hidden tab
  function say(t) { live.textContent = t; }

  // ---------- audio (all synthesised) ----------
  var ac = null, master = null, noiseSrc = null, noiseGain = null;
  function unlockAudio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    if (master) master.gain.value = S.vol / 100;
  }
  function tone(freq, t0, dur, peak, type) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function knock(t0) {
    var len = Math.floor(ac.sampleRate * 0.12), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = 950; f.Q.value = 6; g.gain.value = 1.6;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  function playSound(kind, times) {
    if (kind === 'none' || !ac) return;
    var t = ac.currentTime + 0.02;
    for (var r = 0; r < (times || 1); r++) {
      var o = t + r * (kind === 'cue' ? 0.35 : 1.4);
      if (kind === 'bell') { tone(660, o, 2.4, 0.5); tone(1822, o, 1.4, 0.12); tone(3564, o, 0.6, 0.05); }
      else if (kind === 'chime') { tone(1046.5, o, 1.2, 0.35); tone(1318.5, o + 0.18, 1.4, 0.35); }
      else if (kind === 'wood') { knock(o); knock(o + 0.22); }
      else if (kind === 'rise') { tone(523.3, o, 0.9, 0.3); tone(659.3, o + 0.2, 0.9, 0.3); tone(784, o + 0.4, 1.3, 0.3); }
      else if (kind === 'cue') { tone(880, o, 0.6, 0.18); }
    }
  }
  function noiseBuffer(kind) {
    var len = ac.sampleRate * 4, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    var last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
    }
    return b;
  }
  function startNoise() {
    stopNoise();
    if (S.noise === 'off' || S.phase === 'break' || !ac) return;
    noiseSrc = ac.createBufferSource(); noiseSrc.buffer = noiseBuffer(S.noise); noiseSrc.loop = true;
    noiseGain = ac.createGain(); noiseGain.gain.setValueAtTime(0.0001, ac.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.5, ac.currentTime + 1.5);
    noiseSrc.connect(noiseGain); noiseGain.connect(master); noiseSrc.start();
  }
  function stopNoise() {
    if (!noiseSrc) return;
    var s = noiseSrc, g = noiseGain; noiseSrc = null;
    try { g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.25); s.stop(ac.currentTime + 1); } catch (e) {}
  }

  // ---------- wake lock ----------
  var lock = null;
  function keepAwake(on) {
    if (on && S.awake && 'wakeLock' in navigator && !lock) navigator.wakeLock.request('screen').then(function (l) { lock = l; lock.addEventListener('release', function () { lock = null; }); }).catch(function () {});
    if (!on && lock) { lock.release().catch(function () {}); lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && S.running) { keepAwake(true); loop(); } });

  // ---------- applying settings to the page ----------
  function applySettings() {
    root.style.setProperty('--w1', COLORS[S.color][0]); root.style.setProperty('--w2', COLORS[S.color][1]);
    document.querySelectorAll('#vt-swatches [data-c]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === S.color)); });
    document.querySelectorAll('#vt-face [data-face]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.face === S.face)); });
    document.querySelectorAll('#vt-noise [data-noise]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.noise === S.noise)); });
    $('vt-sound').value = S.sound; if (master) master.gain.value = S.vol / 100;
    var virtual = { brownNoise: S.noise === 'brown', hideDigits: !S.digits };
    document.querySelectorAll('[data-opt]').forEach(function (i) { var k = i.dataset.opt; i.checked = k in virtual ? virtual[k] : !!S[k]; });
    document.querySelectorAll('.vt-band').forEach(function (b) { var i = b.querySelector('input'); b.classList.toggle('is-on', i.checked); });
    root.classList.toggle('no-digits', !S.digits);
    hubStep.textContent = S.phase === 'break' ? 'Break' : S.step;
    drawNums(); render();
  }
  document.addEventListener('change', function (e) {
    var i = e.target; if (!i.dataset || !i.dataset.opt) return;
    var k = i.dataset.opt;
    if (k === 'brownNoise') S.noise = i.checked ? 'brown' : 'off';
    else if (k === 'hideDigits') S.digits = !i.checked;
    else S[k] = i.checked;
    if (k === 'halfway') S.lastMinute = i.checked;
    if (k === 'notify' && i.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if (k === 'awake') keepAwake(S.running && S.awake);
    if ((k === 'brownNoise') && S.running) { unlockAudio(); startNoise(); }
    track('timer_setting', { setting: k, on: i.checked });
    applySettings(); save();
  });

  // ---------- events ----------
  goBtn.addEventListener('click', function () { S.running ? pause() : start(); });
  var dockGo = $('vt-dock-go'); if (dockGo) dockGo.addEventListener('click', function () { S.running ? pause() : start(); render(); });
  $('vt-reset').addEventListener('click', reset);
  $('vt-plus5').addEventListener('click', function () { addTime(5 * MIN); });
  $('vt-more').addEventListener('click', function () { S.total = S.remaining = 5 * MIN; flags.half = flags.last = false; start(); track('timer_keep_going'); });
  $('vt-done').addEventListener('click', function () { reset(); say('Done. Nice work.'); track('timer_done'); });
  document.querySelectorAll('.vt-presets [data-m]').forEach(function (b) {
    b.addEventListener('click', function () { setTotal(+b.dataset.m * MIN); track('timer_preset', { minutes: +b.dataset.m }); });
  });
  var typeIn = $('vt-type');
  function takeTyped() { var ms = parseTime(typeIn.value); if (ms) { setTotal(ms); typeIn.value = ''; typeIn.placeholder = fmt(ms) + ' set'; } }
  typeIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { takeTyped(); typeIn.blur(); } });
  typeIn.addEventListener('blur', takeTyped);
  stepInput.addEventListener('input', function () { S.step = stepInput.value.trim(); if (S.phase !== 'break') hubStep.textContent = S.step; render(); });
  document.querySelectorAll('#vt-swatches [data-c]').forEach(function (b) { b.addEventListener('click', function () { S.color = b.dataset.c; applySettings(); save(); }); });
  document.querySelectorAll('#vt-face [data-face]').forEach(function (b) { b.addEventListener('click', function () { S.face = b.dataset.face; applySettings(); save(); }); });
  document.querySelectorAll('#vt-noise [data-noise]').forEach(function (b) { b.addEventListener('click', function () { S.noise = b.dataset.noise; unlockAudio(); if (S.running) startNoise(); applySettings(); save(); }); });
  $('vt-sound').addEventListener('change', function (e) { S.sound = e.target.value; save(); unlockAudio(); playSound(S.sound, 1); });
  var setBtn = $('vt-set-btn'), panel = $('vt-settings');
  function sheet(open) { panel.hidden = !open; setBtn.setAttribute('aria-expanded', String(open)); if (open) $('vt-sheet-done').focus(); else setBtn.focus(); }
  setBtn.addEventListener('click', function () { sheet(panel.hidden); });
  $('vt-sheet-done').addEventListener('click', function () { sheet(false); });
  var stage = $('vt-stage');
  function toggleFull() {
    var html = document.documentElement;
    if (html.classList.contains('vt-pseudo-full')) { html.classList.remove('vt-pseudo-full'); return; }
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); return; }
    track('timer_fullscreen');
    if (stage.requestFullscreen && document.fullscreenEnabled) stage.requestFullscreen().catch(function () { html.classList.add('vt-pseudo-full'); });
    else html.classList.add('vt-pseudo-full');
  }
  $('vt-full-btn').addEventListener('click', toggleFull);

  // drag around the disc to set minutes (60-minute scale), arrow keys on the focused disc
  var dragging = false;
  function angleToMs(ev) {
    var r = disc.getBoundingClientRect(), dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
    var deg = Math.atan2(-dx, -dy) * 180 / Math.PI; if (deg < 0) deg += 360;
    var min = deg / 6; min = min < 2 ? Math.round(min * 4) / 4 : Math.round(min);
    return min * MIN;
  }
  // crossing 12 o'clock while dragging pins the dial at full (60) or empty (15 s) instead of jumping around
  var lastDrag = 0;
  function dragTo(e) {
    var ms = angleToMs(e);
    if (lastDrag >= 45 * MIN && ms < 15 * MIN) ms = 60 * MIN;
    else if (lastDrag > 0 && lastDrag <= 15 * MIN && ms > 45 * MIN) ms = MIN / 4;
    ms = Math.max(ms, MIN / 4);
    lastDrag = ms; setTotal(ms);
  }
  disc.addEventListener('pointerdown', function (e) { dragging = true; lastDrag = 0; disc.setPointerCapture(e.pointerId); dragTo(e); });
  disc.addEventListener('pointermove', function (e) { if (dragging) dragTo(e); });
  disc.addEventListener('pointerup', function () { if (dragging) { dragging = false; track('timer_drag', { minutes: Math.round(S.total / MIN) }); } });
  disc.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); S.running ? addTime(MIN) : setTotal(Math.min(S.total + MIN, 12 * 3600000)); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); S.running ? addTime(-Math.min(MIN, remainingNow() - 1000)) : setTotal(Math.max(S.total - MIN, MIN)); }
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' && (tag !== 'button' || e.target === disc)) { e.preventDefault(); S.running ? pause() : start(); }
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === 'f' || e.key === 'F') toggleFull();
    else if (e.key === 'Escape' && !panel.hidden) sheet(false);
    else if (e.key === 'Escape' && document.documentElement.classList.contains('vt-pseudo-full')) toggleFull();
  });

  // ---------- how it works: one slider drives the clause and the mini timer ----------
  var STAGES = [
    { c: 'Name the one step', p: "Not the whole project. The first thing you'd touch: open the doc, fill the sink, find the form.", m: 5, t: '5:00' },
    { c: 'Pick the minutes', p: 'Tap a preset, drag around the circle, or type 7, 90s or 1h30. Five minutes is plenty to start.', m: 25, t: '25:00' },
    { c: 'Watch it shrink', p: 'The colour shrinks as time passes. A soft cue at halfway and at the last minute, and the tab shows it too.', m: 12.5, t: '12:34' },
    { c: 'Keep going or stop', p: "When time's up, add five more minutes if you're rolling, or call it done. Both count.", m: 0, t: '+5?' },
  ];
  document.querySelectorAll('[data-wedge-deg]').forEach(function (p) { p.setAttribute('d', wedgePath(+p.getAttribute('data-wedge-deg'))); });
  var howRange = $('vt-how-range'), how = document.querySelector('.vt-how');
  function showStage(i) {
    var s = STAGES[i];
    how.classList.add('is-swap');
    setTimeout(function () {
      $('vt-how-clause').textContent = s.c; $('vt-how-sub').textContent = s.p;
      var mw = $('vt-mini-wedge'); if (s.m > 0) { mw.setAttribute('d', wedgePath(s.m / 60 * 360)); mw.style.display = ''; } else mw.style.display = 'none';
      $('vt-mini-t').textContent = s.t;
      document.querySelectorAll('.vt-how-names li').forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      how.classList.remove('is-swap');
    }, 200);
  }
  if (howRange) howRange.addEventListener('input', function () { showStage(+howRange.value); });

  // ---------- FAQ: index + one answer on wide screens, accordion on phones ----------
  var faqBox = $('vt-faq-items'), pane = $('vt-faq-pane'), faq = document.querySelector('.vt-faq');
  if (faqBox && !faqBox.children.length && window.VT_FAQ) {
    faqBox.innerHTML = window.VT_FAQ.map(function (qa, i) {
      return '<h3 class="vt-faq-h"><button class="vt-faq-q" type="button" aria-expanded="false" aria-controls="vt-faq-a' + i + '" id="vt-faq-q' + i + '">' + qa[0] + '</button></h3><div class="vt-faq-a" id="vt-faq-a' + i + '" role="region" aria-labelledby="vt-faq-q' + i + '"><p>' + qa[1] + '</p></div>';
    }).join('');
  }
  var wide = window.matchMedia('(min-width: 901px)');
  var qs = Array.prototype.slice.call(document.querySelectorAll('.vt-faq-q'));
  function pick(i) {
    qs.forEach(function (q, k) { q.setAttribute('aria-expanded', String(k === i)); });
    if (wide.matches) { pane.style.opacity = 0; setTimeout(function () { pane.innerHTML = document.getElementById('vt-faq-a' + i).innerHTML; pane.style.opacity = 1; }, 150); }
    else qs.forEach(function (q, k) { document.getElementById('vt-faq-a' + k).hidden = k !== i; });
  }
  function faqMode() { faq.classList.toggle('has-pane', wide.matches); if (!wide.matches) qs.forEach(function (q, k) { document.getElementById('vt-faq-a' + k).hidden = k !== 0; }); pick(0); }
  qs.forEach(function (q, i) {
    q.addEventListener('click', function () { pick(i); });
    q.addEventListener('mouseenter', function () { if (wide.matches) pick(i); });
    q.addEventListener('focus', function () { if (wide.matches) pick(i); });
  });
  if (qs.length) { faqMode(); wide.addEventListener ? wide.addEventListener('change', faqMode) : wide.addListener(faqMode); }

  // ---------- entrances ----------
  var rise = [];
  document.querySelectorAll('.vt-how .vt-h2, .vt-steps li, .vt-sw-head, .vt-band, .vt-read-col > *, .vt-dock, .vt-faq-list, .vt-faq-pane, .vt-cta-text > *, .vt-cta-fig').forEach(function (el, i) {
    el.classList.add('vt-rise'); el.style.setProperty('--d', (i % 4) * 75 + 'ms'); rise.push(el);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { io.observe(el); });
  } else rise.forEach(function (el) { el.classList.add('is-in'); });

  document.querySelectorAll('#get-ios, #get-android').forEach(function (a) { a.addEventListener('click', function () { track('foco_cta_click', { store: a.id }); }); });

  // ---------- go ----------
  // ---------- embed mode (?embed=1): only the timer, height reported to the parent page ----------
  var EMBED = /[?&]embed=1/.test(location.search);
  if (EMBED) {
    document.documentElement.classList.add('vt-embed');
    var report = function () { try { parent.postMessage({ vtHeight: Math.ceil(stage.getBoundingClientRect().height) }, '*'); } catch (e) {} };
    if ('ResizeObserver' in window) new ResizeObserver(report).observe(stage); else setInterval(report, 1000);
    window.addEventListener('load', report);
  }
  var openFull = $('vt-open-full'); if (openFull) openFull.addEventListener('click', function () { openFull.href = location.origin + '/visual-timer/?min=' + (+(S.focusTotal / MIN).toFixed(2)); });

  load(); markPreset(); applySettings(); if (howRange) showStage(0);
  requestAnimationFrame(function () { root.classList.add('vt-ready'); });
})();
