/* Brain dump tool. No "&&" anywhere: WordPress turns it into entities inside post content. Use nested ifs. */
(function () {
  var KEY = 'focoBrainDump.v2';
  var OLD = 'focoBrainDump.v1';
  var B = ['now', 'week', 'someday', 'drop'];
  var NAMES = { now: 'Now', week: 'This week', someday: 'Someday', drop: 'Trash' };
  var TIMER = 'https://www.tryfoco.com/visual-timer/5-minute/';
  var KW = {
    now: ['today', 'now', 'urgent', 'asap', 'eod', 'overdue', 'deadline', 'blocker', 'immediately', 'right away', 'tonight', 'this morning', 'this afternoon', 'on fire', 'past due', 'late fee', 'bill'],
    someday: ['someday', 'maybe', 'would be nice', 'eventually', 'one day', 'in the future', 'when i have time', 'bucket list', 'at some point', 'if i ever', 'dream', 'wishlist', 'learn '],
    drop: ['i hate', 'i should have', "i can't believe", 'why am i', 'why do i', 'i suck', "i'm so", 'worry:']
  };
  var root = document.getElementById('fbd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var input = $('fbd-input'), sortBtn = $('fbd-sort'), count = $('fbd-count'), groups = $('fbd-groups'), live = $('fbd-live');
  var S = { text: '', buckets: null, view: 'dump', pick: 0 };

  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v) { S.text = v.text || ''; S.buckets = v.buckets || null; S.view = v.view === 'sorted' ? 'sorted' : 'dump'; S.pick = v.pick || 0; }
      else { S.text = localStorage.getItem(OLD) || ''; }
    } catch (e) {}
    if (!S.buckets) S.view = 'dump';
  }
  function lines() { return input.value.split(/\n+/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; }); }
  function has(L, list) { for (var i = 0; i < list.length; i++) { if (L.indexOf(list[i]) > -1) return true; } return false; }
  function classify(line) {
    var L = line.toLowerCase();
    if (L.length < 3) return 'drop';
    if (has(L, KW.drop)) return 'drop';
    if (has(L, KW.now)) return 'now';
    if (has(L, KW.someday)) return 'someday';
    return 'week';
  }
  function updateCount() {
    var n = lines().length;
    count.innerHTML = '<b>' + n + '</b> ' + (n === 1 ? 'thought' : 'thoughts');
    sortBtn.disabled = n === 0;
    sortBtn.textContent = n > 1 ? 'Sort ' + n + ' thoughts' : 'Sort it';
  }
  function sort() {
    var seen = {}, b = { now: [], week: [], someday: [], drop: [] };
    lines().forEach(function (l) { var k = l.toLowerCase(); if (seen[k]) return; seen[k] = 1; b[classify(l)].push(l); });
    S.buckets = b; S.pick = 0; S.text = input.value;
    show('sorted', true);
  }
  function candidates() { return S.buckets.now.concat(S.buckets.week, S.buckets.someday); }
  function renderStart() {
    var c = candidates(), task = $('fbd-start-task'), go = $('fbd-go'), next = $('fbd-next');
    $('fbd-start').hidden = c.length === 0;
    if (!c.length) return;
    if (S.pick >= c.length) S.pick = 0;
    var t = c[S.pick];
    $('fbd-start-label').textContent = S.buckets.now.length ? 'Start here' : 'Nothing urgent. A gentle start:';
    task.textContent = t;
    go.href = TIMER + '?step=' + encodeURIComponent(t.replace(/^[A-Za-z ]{2,12}:\s*/, '').slice(0, 48));
    next.hidden = c.length < 2;
  }
  function icon() { return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M6 3v12M6 3L3 6M6 3l3 3M12 15V3M12 15l-3-3M12 15l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function renderGroups(flash) {
    groups.innerHTML = '';
    B.forEach(function (b) {
      var g = document.createElement('div'); g.className = 'fbd-group'; g.setAttribute('data-b', b);
      var items = S.buckets[b];
      var h = document.createElement('h4'); h.className = 'fbd-group-h'; h.textContent = NAMES[b];
      var n = document.createElement('span'); n.textContent = items.length; h.appendChild(n); g.appendChild(h);
      var ul = document.createElement('ul'); ul.className = 'fbd-list';
      if (!items.length) { var e = document.createElement('li'); e.className = 'fbd-item fbd-empty'; e.textContent = 'Nothing here.'; ul.appendChild(e); }
      items.forEach(function (t, i) {
        var li = document.createElement('li'); li.className = 'fbd-item';
        if (flash) { if (flash.b === b) { if (flash.t === t) li.className += ' fbd-flash'; } }
        var span = document.createElement('span'); span.className = 'fbd-item-t'; span.textContent = t; li.appendChild(span);
        var mv = document.createElement('span'); mv.className = 'fbd-move';
        var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Move "' + t + '" to');
        B.forEach(function (o) { var op = document.createElement('option'); op.value = o; op.textContent = (o === b ? '✓ ' : '') + NAMES[o]; if (o === b) op.selected = true; sel.appendChild(op); });
        sel.addEventListener('change', function () { move(b, i, sel.value); });
        mv.appendChild(sel);
        var ico = document.createElement('span'); ico.className = 'fbd-move-ico'; ico.innerHTML = icon(); mv.appendChild(ico);
        li.appendChild(mv); ul.appendChild(li);
      });
      g.appendChild(ul); groups.appendChild(g);
    });
  }
  function move(from, i, to) {
    if (from === to) return;
    var t = S.buckets[from].splice(i, 1)[0];
    S.buckets[to].push(t);
    live.textContent = 'Moved to ' + NAMES[to];
    renderGroups({ b: to, t: t }); renderStart(); save();
  }
  function show(view, scroll) {
    S.view = view;
    $('fbd-dump').hidden = view !== 'dump';
    $('fbd-sorted').hidden = view !== 'sorted';
    if (view === 'sorted') { renderStart(); renderGroups(); }
    save();
    if (scroll) {
      var r = root.getBoundingClientRect();
      if (r.top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function asText() {
    var out = [];
    B.forEach(function (b) { if (b === 'drop') return; if (!S.buckets[b].length) return; out.push(NAMES[b].toUpperCase()); S.buckets[b].forEach(function (t) { out.push('- ' + t); }); out.push(''); });
    return out.join('\n').trim();
  }

  input.addEventListener('input', function () { S.text = input.value; updateCount(); save(); });
  sortBtn.addEventListener('click', sort);
  $('fbd-back').addEventListener('click', function () { show('dump', true); input.focus({ preventScroll: true }); });
  $('fbd-next').addEventListener('click', function () { S.pick++; renderStart(); save(); });
  $('fbd-print').addEventListener('click', function () { window.print(); });
  $('fbd-copy').addEventListener('click', function () {
    var btn = this, txt = asText();
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy list'; }, 1600); };
    if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done, function () { window.prompt('Copy your list:', txt); }); }
    else { window.prompt('Copy your list:', txt); }
  });
  $('fbd-clear').addEventListener('click', function () {
    if (!window.confirm('Clear your brain dump and start over?')) return;
    input.value = ''; S = { text: '', buckets: null, view: 'dump', pick: 0 };
    try { localStorage.removeItem(OLD); } catch (e) {}
    updateCount(); show('dump', true);
  });
  Array.prototype.forEach.call(root.querySelectorAll('.fbd-chip'), function (c) {
    c.addEventListener('click', function () {
      var v = input.value;
      input.value = v + (v.length ? (/\n$/.test(v) ? '' : '\n') : '') + c.getAttribute('data-p');
      input.focus(); input.setSelectionRange(input.value.length, input.value.length);
      S.text = input.value; updateCount(); save();
    });
  });

  load();
  input.value = S.text;
  updateCount();
  show(S.view, false);
})();
