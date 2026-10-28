// FOCO body doubling room.
//
// One shared room, open 24/7. Sessions are aligned to the clock for everyone:
// 25 minutes of focus from :00 and :30, then a 5 minute break. People take a seat
// with a name, a seat picture and one line about what they are working on.
//
// The room chat only carries ready-made lines and emoji, sent as indexes (never
// free text), so there is nothing to moderate in it. Every emoji flies from the
// sender's seat to FOCO in the middle of the table.
//
// Backends:
//   window.FOCO_ROOM_CONFIG = { firebase: {...}, roomId: 'main', shareUrl: '...' } -> Firebase Realtime Database
//   no config                                                                     -> local backend (tabs of this browser)
//   ?demo                                                                         -> local backend seeded with sample people (preview only)
(function () {
  'use strict';

  var CFG = window.FOCO_ROOM_CONFIG || {};
  var params = new URLSearchParams(location.search);
  // ?tv is the recording mode for YouTube videos: sample people, a 1920x1080 stage, never the live room.
  var TV = params.has('tv');
  var DEMO = TV || (params.has('demo') && params.get('demo') !== 'alone');

  var SESSION_MIN = 30;
  var FOCUS_MIN = 25;
  var COOLDOWN_MS = 2500;
  var CHAT_KEEP = 30;
  var MAX_SEATS = 12;
  var RING_R = 150;
  var CIRC = 2 * Math.PI * RING_R;

  // Seat looks, sent as an index (never an upload): 32 people in a warm 3D style, generated for FOCO and
  // approved one by one, then 13 photos of things (CC0). Nobody can put an image of their own here.
  var AVATARS = 32;
  var AVATAR_HUES = [276, 25, 146, 203, 203, 357, 44, 148, 357, 45, 146, 44, 150, 276, 357, 271, 267, 21, 149, 203, 358, 44, 267, 22, 152, 203, 356, 45, 267, 22, 150, 204];
  var PICS = ['cat', 'dog', 'coffee', 'plant', 'books', 'headphones', 'desk', 'guitar', 'sunflower', 'lake', 'waves', 'rain', 'stars'];
  var PIC_NAMES = ['A sleeping cat', 'A black dog', 'A coffee cup', 'A house plant', 'A stack of books', 'Headphones', 'A desk lamp and laptop', 'A guitar', 'A sunflower', 'A mountain lake', 'Ocean waves', 'A rainy window', 'Stars over a lake'];
  var LOOKS = AVATARS + PICS.length;
  // On the site, images come from the WordPress media library: config.js maps each local path to its URL.
  function asset(p) { var m = CFG.assets; return (m && m[p]) || p; }
  function lookUrl(i) {
    if (typeof i !== 'number' || i < 0 || i >= LOOKS) return null;
    return asset(i < AVATARS ? 'img/avatars/p' + (i < 9 ? '0' : '') + (i + 1) + '.jpg' : 'img/pics/' + PICS[i - AVATARS] + '.jpg');
  }
  function lookHue(i) { return i >= 0 && i < AVATARS ? AVATAR_HUES[i] : [265, 330, 18, 145, 185, 215][Math.abs(i) % 6]; }
  // Radio: FOCO's own focus music first (always embeddable), then other stations. Each one was checked
  // playing through the YouTube player on 2026-10-25; if one fails later, the player skips it by itself.
  var STATIONS = [
    { name: 'Stop' },
    { name: 'Body double with me', id: 'gE0E_wOKmMM', by: 'FOCO', foco: true },
    { name: 'Study music', id: '7PPubXQWc3Y', by: 'FOCO', foco: true },
    { name: 'Brown noise', id: 'BVNvoA3gbb4', by: 'FOCO', foco: true, sync: true },
    { name: 'Brown + pink noise', id: 'NiaMczqrrxg', by: 'FOCO', foco: true, sync: true },
    { name: 'Chillhop', id: '5yx6BWlEVcY', by: 'Chillhop Music' },
    { name: 'Jazz piano', id: 'Dx5qFachd3A', by: 'Cafe Music BGM' },
    { name: 'Synthwave', id: '4xDzrJKXOOY', by: 'Lofi Girl' },
    { name: 'Classical', id: 'RGyC8xunN3o', by: 'Baroque Echoes' },
    { name: 'Rain', id: '9QneqUhCVtU', by: 'The Relaxed Guy' },
  ];
  var EMOJI = ['❤️', '🔥', '💪', '👏', '✨', '🎯', '☕', '🧠']; // taste-skill-ignore: the reactions are the product's content
  var EMOJI_NAMES = ['a heart', 'fire', 'strength', 'applause', 'sparkles', 'a target', 'coffee', 'a brain'];
  var LINES = [
    { tab: 'Love', items: [
      'Sending you love from my desk',
      "You're not alone in this",
      'Be gentle with yourself today',
      'Proud of everyone in here',
      'Your pace is a good pace',
      'So glad you showed up',
    ] },
    { tab: 'Focus', items: [
      'Phone face down. Let’s go.',
      'One tab. One task.',
      'Back to it, together',
      'Just the next tiny step',
      'Deep breath, then start',
      'Locking in for this session',
    ] },
    { tab: 'You can', items: [
      'You can do hard things',
      'Starting is the hardest part, and you started',
      'Done is better than perfect',
      'Five minutes. You can do five minutes.',
      'Your brain isn’t broken, just stuck for a sec',
      "You've got this",
    ] },
  ];
  var MASCOT_LINES = [
    "I'm right here with you.",
    'Just the next small step.',
    'You started. That was the hard part.',
    "If you drifted, that's okay. Come back to one tiny thing.",
    'Shoulders down, breathe out. Keep going.',
  ];
  // Names and tasks are the only free text. Mask the obvious, the rest is handled by Hide.
  var LILAC = '#a78bfa'; // taste-skill-ignore: FOCO brand lilac, used on the invite card
  var BLOCKED = /\b(fuck|shit|cunt|nigg|fag|porn|sex|nazi|rape|kill yourself|kys)\w*/i;

  // ---------- small helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem('foco-bdr-' + key));
      localStorage.setItem('foco-bdr-' + key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function clean(s, max) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max); }
  function safeName(p) { return BLOCKED.test(p.name) ? 'Someone' : p.name; }
  function safeTask(p) { return BLOCKED.test(p.task) ? 'Focusing' : p.task; }
  function hueStyle(node, hue) {
    node.style.background = 'hsl(' + hue + ' 45% 24%)';
    node.style.color = 'hsl(' + hue + ' 90% 84%)';
  }
  function avStyle(node, p) {
    hueStyle(node, p.hue);
    var url = lookUrl(p.pic);
    if (url) {
      node.style.backgroundImage = 'url(' + url + ')';
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center';
      node.textContent = '';
    }
  }
  function avatar(p, cls) {
    var av = el('span', cls || 'bdr-av', initial(safeName(p)));
    avStyle(av, p);
    return av;
  }
  function initial(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?'; }
  function hhmm(ms) { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function ago(ms) {
    var s = Math.round(ms / 1000);
    if (s < 45) return 'now';
    return Math.round(s / 60) + ' min';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function lineText(m) {
    if (m.kind === 'emoji') return EMOJI[m.value];
    var cat = LINES[m.cat];
    return cat ? cat.items[m.value] : null;
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Everyone keeps their own clock at the same table. A block is the focus length you picked, then a
  // short break, then the next block, worked out from when you started, so every screen agrees.
  var LENGTHS = [15, 25, 45, 60, 90];
  function breakFor(len) { return len >= 90 ? 15 : len >= 45 ? 10 : 5; }
  function blockOf(p, now) {
    var len = LENGTHS.indexOf(p.len) >= 0 ? p.len : 25;
    var f = len * 60000;
    var cycle = f + breakFor(len) * 60000;
    var start0 = p.blockStart || p.joinedAt || now;
    var n = Math.max(0, Math.floor((now - start0) / cycle));
    var start = start0 + n * cycle;
    var e = now - start;
    var focus = e < f;
    return { len: len, focus: focus, start: start, focusEnd: start + f, end: start + cycle, elapsed: focus ? e : e - f, total: focus ? f : cycle - f, remaining: focus ? f - e : cycle - e, cycle: n };
  }
  // Epoch-aligned (kept for the synced FOCO tracks and the demo).
  function phaseAt(ms) {
    var sessionMs = SESSION_MIN * 60000;
    var focusMs = FOCUS_MIN * 60000;
    var start = Math.floor(ms / sessionMs) * sessionMs;
    var inCycle = ms - start;
    var focus = inCycle < focusMs;
    return {
      focus: focus,
      start: start,
      focusEnd: start + focusMs,
      end: start + sessionMs,
      elapsed: inCycle,
      remaining: focus ? focusMs - inCycle : sessionMs - inCycle,
    };
  }

  // ---------- backends ----------
  function LocalBackend(demo) {
    var self = this;
    var chan = 'BroadcastChannel' in window ? new BroadcastChannel('foco-bdr-2') : null;
    var people = {};
    var mine = null;
    var peopleCbs = [];
    var chatCbs = [];
    var viewerCbs = [];
    var dailyCbs = [];
    var viewers = {};
    var daily = demo ? 142 : 0;
    var id = null;
    try { id = sessionStorage.getItem('foco-bdr-id'); } catch (e) {}
    id = id || ('t' + Math.random().toString(36).slice(2, 10));
    try { sessionStorage.setItem('foco-bdr-id', id); } catch (e) {}
    self.id = id;
    self.now = function () { return Date.now(); };

    function emit() {
      var list = Object.keys(people).map(function (k) { return people[k]; });
      peopleCbs.forEach(function (cb) { cb(list); });
    }
    function chat(m) { chatCbs.forEach(function (cb) { cb(m); }); }
    function post(msg) { if (chan) chan.postMessage(msg); }
    if (chan) {
      chan.onmessage = function (e) {
        var m = e.data || {};
        if (m.type === 'presence' && m.person && m.person.id !== id) {
          m.person.seen = Date.now();
          people[m.person.id] = m.person;
          emit();
        } else if (m.type === 'leave' && people[m.id]) {
          delete people[m.id];
          emit();
        } else if (m.type === 'hello' && mine) {
          post({ type: 'presence', person: mine });
        } else if (m.type === 'chat' && m.msg) {
          chat(m.msg);
        } else if (m.type === 'view' && m.id !== id) {
          viewers[m.id] = Date.now();
          emitViewers();
        } else if (m.type === 'unview') {
          delete viewers[m.id];
          emitViewers();
        } else if (m.type === 'daily') {
          daily = Math.max(daily, m.n);
          dailyCbs.forEach(function (cb) { cb(daily); });
        }
      };
    }
    function emitViewers() {
      var cutV = Date.now() - 15000;
      Object.keys(viewers).forEach(function (k) { if (viewers[k] < cutV) delete viewers[k]; });
      var n = Object.keys(viewers).length + 1 + (demo ? 9 : 0);
      viewerCbs.forEach(function (cb) { cb(n); });
    }
    setInterval(function () {
      post({ type: 'view', id: id });
      emitViewers();
      if (mine) post({ type: 'presence', person: mine });
      var cut = Date.now() - 15000;
      var changed = false;
      Object.keys(people).forEach(function (k) {
        if (!people[k].fake && k !== id && people[k].seen < cut) { delete people[k]; changed = true; }
      });
      if (changed) emit();
    }, 5000);
    window.addEventListener('pagehide', function () {
      post({ type: 'unview', id: id });
      if (mine) post({ type: 'leave', id: id });
    });
    self.onViewers = function (cb) { viewerCbs.push(cb); post({ type: 'view', id: id }); emitViewers(); };
    self.onDaily = function (cb) { dailyCbs.push(cb); cb(daily); };
    self.finishSession = function () {
      daily += 1;
      post({ type: 'daily', n: daily });
      dailyCbs.forEach(function (cb) { cb(daily); });
      return Promise.resolve();
    };

    self.init = function () {
      post({ type: 'hello' });
      if (demo) seedDemo();
      return Promise.resolve();
    };
    self.onPeople = function (cb) { peopleCbs.push(cb); emit(); };
    self.onChat = function (cb) { chatCbs.push(cb); };
    self.join = function (p) {
      mine = Object.assign({}, p, { id: id, joinedAt: Date.now() });
      people[id] = mine;
      post({ type: 'presence', person: mine });
      emit();
      return Promise.resolve();
    };
    self.update = function (partial) {
      if (!mine) return Promise.resolve();
      Object.assign(mine, partial);
      post({ type: 'presence', person: mine });
      emit();
      return Promise.resolve();
    };
    self.leave = function () {
      mine = null;
      delete people[id];
      post({ type: 'leave', id: id });
      emit();
      return Promise.resolve();
    };
    self.post = function (msg) {
      var m = Object.assign({ id: 'm' + Math.random().toString(36).slice(2, 10), from: id, at: Date.now() }, msg);
      post({ type: 'chat', msg: m });
      chat(m);
      return Promise.resolve();
    };

    // Preview only: sample people so the room can be seen at full density.
    function seedDemo() {
      var now = Date.now();
      var sample = [
        ['Maya', 'Inbox to under 20', 330, 3, 0, 1],
        ['Jonah', 'Chapter 3 reading notes', 200, 1, 1, 5],
        ['Priya', 'Quarterly report draft', 350, 2, 6, 0],
        ['Sam', 'Laundry, then the dishes', 48, 0, 3, 7],
        ['Leah', 'Tax receipts pile', 200, 4, 14, 2],
        ['Theo', 'Portfolio site copy', 215, 1, 7, 6],
      ];
      sample.forEach(function (s, i) {
        var pid = 'demo' + i;
        var len = [25, 45, 90, 15, 60, 25][i];
        people[pid] = { id: pid, name: s[0], task: s[1], hue: s[2], sessions: s[3], pic: s[4], sound: s[5], status: 'focus', len: len, blockStart: now - [9, 31, 52, 4, 64, 27][i] * 60000, joinedAt: now - (i + 2) * 240000, fake: true };
      });
      emit();
      function say(i, kind, cat, value, at) {
        var p = people['demo' + i];
        chat({ id: 'd' + Math.random().toString(36).slice(2, 9), from: p.id, name: p.name, hue: p.hue, pic: p.pic, kind: kind, cat: cat, value: value, at: at });
      }
      say(0, 'line', 1, 5, now - 540000);
      say(4, 'emoji', 0, 0, now - 420000);
      say(2, 'line', 0, 3, now - 300000);
      say(5, 'emoji', 0, 1, now - 120000);
      if (params.has('crowd')) {
        ['Ana', 'Ben', 'Chen', 'Dana', 'Eli', 'Fatima', 'Gil', 'Hana'].forEach(function (n, k) {
          people['crowd' + k] = { id: 'crowd' + k, name: n, task: 'Sample task ' + (k + 1), hue: AVATAR_HUES[k], sessions: 0, pic: k + 4, sound: 0, status: 'focus', len: 25, blockStart: now - k * 60000, joinedAt: now - k * 1000, fake: true };
        });
        emit();
      }
      if (params.has('arrive')) setTimeout(function () {
        people.demo6 = { id: 'demo6', name: 'Noa', task: 'Thesis intro, first paragraph', hue: 268, sessions: 0, pic: 10, sound: 3, status: 'focus', joinedAt: Date.now(), fake: true };
        emit();
      }, 5000);
      (function loop() {
        setTimeout(function () {
          var i = Math.floor(Math.random() * sample.length);
          if (Math.random() < 0.65) say(i, 'emoji', 0, Math.floor(Math.random() * EMOJI.length), Date.now());
          else { var c = Math.floor(Math.random() * LINES.length); say(i, 'line', c, Math.floor(Math.random() * LINES[c].items.length), Date.now()); }
          loop();
        }, TV ? 20000 + Math.random() * 30000 : 4000 + Math.random() * 7000);
      })();
    }
  }

  function FirebaseBackend(cfg) {
    var self = this;
    var V = '10.12.2';
    var base = 'https://www.gstatic.com/firebasejs/' + V + '/';
    var room = cfg.roomId || 'main';
    var fb = {};
    var offset = 0;
    var peopleCbs = [];
    var chatCbs = [];
    var viewerCbs = [];
    var dailyCbs = [];
    var dayRef = null;
    var meRef = null;
    function dayKey() { return new Date(self.now()).toISOString().slice(0, 10); }
    self.now = function () { return Date.now() + offset; };

    self.init = function () {
      return Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js'),
        import(base + 'firebase-database.js'),
      ]).then(function (mods) {
        fb.app = mods[0]; fb.auth = mods[1]; fb.db = mods[2];
        var app = fb.app.initializeApp(cfg.firebase);
        self.database = fb.db.getDatabase(app);
        return fb.auth.signInAnonymously(fb.auth.getAuth(app));
      }).then(function (cred) {
        var d = fb.db;
        var db = self.database;
        self.id = cred.user.uid;
        d.onValue(d.ref(db, '.info/serverTimeOffset'), function (s) { offset = s.val() || 0; });
        d.onValue(d.ref(db, 'rooms/' + room + '/people'), function (snap) {
          var val = snap.val() || {};
          var list = Object.keys(val).map(function (k) { return Object.assign({ id: k }, val[k]); });
          peopleCbs.forEach(function (cb) { cb(list); });
        });
        var chatRef = d.ref(db, 'rooms/' + room + '/chat');
        d.onChildAdded(d.query(chatRef, d.limitToLast(CHAT_KEEP)), function (snap) {
          var m = Object.assign({ id: snap.key }, snap.val());
          chatCbs.forEach(function (cb) { cb(m); });
        });
        // Everyone with the page open counts as watching; Firebase drops them when they close it.
        var vRef = d.ref(db, 'rooms/' + room + '/viewers/' + self.id);
        d.onDisconnect(vRef).remove();
        d.set(vRef, { at: d.serverTimestamp() });
        d.onValue(d.ref(db, 'rooms/' + room + '/viewers'), function (s) {
          var n = s.size || 0;
          viewerCbs.forEach(function (cb) { cb(n); });
        });
        // Today's finished sessions at this table (UTC day), counted one at a time.
        dayRef = d.ref(db, 'rooms/' + room + '/daily/' + dayKey());
        d.onValue(dayRef, function (s) {
          var n = s.val() || 0;
          dailyCbs.forEach(function (cb) { cb(n); });
        });
        // Anyone may clear chat older than an hour (the rules allow only that), so the room stays small.
        d.get(d.query(chatRef, d.orderByChild('at'), d.endAt(self.now() - 3600000))).then(function (snap) {
          snap.forEach(function (c) { d.remove(c.ref); });
        }).catch(function () {});
      });
    };
    self.onPeople = function (cb) { peopleCbs.push(cb); };
    self.onChat = function (cb) { chatCbs.push(cb); };
    self.onViewers = function (cb) { viewerCbs.push(cb); };
    self.onDaily = function (cb) { dailyCbs.push(cb); };
    self.finishSession = function () {
      if (!dayRef) return Promise.resolve();
      dayRef = fb.db.ref(self.database, 'rooms/' + room + '/daily/' + dayKey());
      return fb.db.runTransaction(dayRef, function (v) { return (v || 0) + 1; }).catch(function () {});
    };
    self.join = function (p) {
      var d = fb.db;
      meRef = d.ref(self.database, 'rooms/' + room + '/people/' + self.id);
      var data = { name: p.name, task: p.task, hue: p.hue, pic: typeof p.pic === 'number' ? p.pic : -1, sound: p.sound || 0, sessions: p.sessions || 0, status: p.status, len: p.len || 25, blockStart: Math.round(p.blockStart || self.now()), joinedAt: d.serverTimestamp() };
      return d.onDisconnect(meRef).remove().then(function () { return d.set(meRef, data); });
    };
    self.update = function (partial) {
      if (!meRef) return Promise.resolve();
      return fb.db.update(meRef, partial);
    };
    self.leave = function () {
      if (!meRef) return Promise.resolve();
      var r = meRef;
      meRef = null;
      return fb.db.remove(r);
    };
    self.post = function (msg) {
      var d = fb.db;
      return d.push(d.ref(self.database, 'rooms/' + room + '/chat'), Object.assign({ from: self.id, at: d.serverTimestamp() }, msg));
    };
  }

  // ---------- session chime (Web Audio, only once the radio is on, so a gesture already happened) ----------
  var audio = null;
  function chime(focusStarts) {
    if (!audio || !radioOn) return;
    var t = audio.currentTime;
    (focusStarts ? [67, 72] : [72, 67]).forEach(function (m, k) {
      var o = audio.createOscillator();
      var g = audio.createGain();
      var at = t + k * 0.35;
      o.type = 'sine';
      o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.25, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
      o.connect(g); g.connect(audio.destination);
      o.start(at); o.stop(at + 1.3);
    });
  }

  // ---------- state ----------
  // The demo and ?local never touch the live room.
  var LIVE = !!CFG.firebase && !DEMO && !params.has('local') && !params.has('demo');
  var backend = LIVE ? new FirebaseBackend(CFG) : new LocalBackend(DEMO);
  var people = [];
  var hidden = {};
  var me = null; // { name, task, hue, pic, sound, sessions, status, seatedAt }
  var messages = [];
  var seen = {};
  var lastSent = 0;
  var lastPhase = null;
  var popTarget = null;
  var popAnchor = null;
  var mascotTimer = 0;
  var radioOn = 0;
  var loadedAt = Date.now();
  var watching = 1;
  var dailyDone = 0;
  var prevBlocks = {}; // last known block of each person, to notice when someone finishes or starts

  var saved = store('profile') || {};
  var today = new Date().toDateString();
  var sessionsToday = (store('sessions') || {})[today] || 0;

  // ---------- seat look picker: 16 people up front, photos of things behind a disclosure ----------
  var pickedPic = typeof saved.pic === 'number' && lookUrl(saved.pic) ? saved.pic : Math.floor(Math.random() * AVATARS);
  var pickedHue = lookHue(pickedPic);
  function lookOption(row, i, label) {
    var lab = el('label', 'bdr-hue');
    var inp = el('input');
    inp.type = 'radio';
    inp.name = 'look';
    inp.checked = pickedPic === i;
    inp.setAttribute('aria-label', label);
    var sw = el('span');
    sw.style.backgroundImage = 'url(' + lookUrl(i) + ')';
    inp.addEventListener('change', function () { pickedPic = i; pickedHue = lookHue(i); });
    lab.appendChild(inp);
    lab.appendChild(sw);
    row.appendChild(lab);
  }
  for (var a = 0; a < AVATARS; a++) lookOption($('pic-row'), a, 'Person ' + (a + 1));
  (function () {
    var more = el('details', 'bdr-pic-more');
    if (pickedPic >= AVATARS) more.open = true;
    more.appendChild(el('summary', null, 'Or pick a picture of something'));
    var row = el('div', 'bdr-pic-row');
    PICS.forEach(function (n, k) { lookOption(row, AVATARS + k, PIC_NAMES[k]); });
    more.appendChild(row);
    $('hue-row').replaceWith(more);
  })();
  if (saved.name) $('f-name').value = saved.name;
  if (saved.task) $('f-task').value = saved.task;
  // ---------- people ----------
  function others() {
    return people.filter(function (p) { return p.id !== backend.id && !hidden[p.id]; });
  }
  function seated() {
    var list = others().slice().sort(function (a, b) { return (a.joinedAt || 0) - (b.joinedAt || 0); });
    if (me) list.unshift(Object.assign({ id: backend.id, isMe: true }, me));
    return list;
  }
  function personById(id) {
    if (me && id === backend.id) return Object.assign({ id: id, isMe: true }, me);
    return people.filter(function (p) { return p.id === id; })[0];
  }

  function renderPeople() {
    var list = seated();
    var ul = $('people');
    ul.textContent = '';
    list.forEach(function (p) {
      var li = el('li');
      var b = el('button', 'bdr-person' + (p.isMe ? ' is-me' : ''));
      b.type = 'button';
      if (p.isMe) b.setAttribute('aria-disabled', 'true');
      else b.setAttribute('aria-label', safeName(p) + ', working on ' + safeTask(p));
      var mid = el('span', 'bdr-person-mid');
      mid.appendChild(el('span', 'bdr-person-name', p.isMe ? (TV ? 'Your seat' : safeName(p) + ' (you)') : safeName(p)));
      var station = STATIONS[p.sound] && p.sound ? ' · ' + STATIONS[p.sound].name : '';
      mid.appendChild(el('span', 'bdr-person-task', safeTask(p) + station));
      var side = el('span', 'bdr-person-side');
      var n = p.sessions || 0;
      side.textContent = n ? n + ' today' : '';
      b.appendChild(avatar(p));
      b.appendChild(mid);
      b.appendChild(side);
      if (!p.isMe) b.addEventListener('click', function () { openPop(p, b); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    $('people-count').textContent = list.length ? String(list.length) : '';
    $('people-empty').hidden = others().length > 0;
    renderBadges();
    renderSeats(list);
  }

  function seatPoint(i, slots) {
    // Seats start at the bottom (where "you" sit) and go round clockwise.
    var a = Math.PI / 2 + (i * 2 * Math.PI) / Math.max(slots, 6);
    var r = (RING_R / 400) * 100;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }

  var knownIds = null; // ids seen at the table, to notice arrivals
  function renderSeats(list) {
    var wrap = $('seats');
    wrap.textContent = '';
    var threads = $('threads');
    threads.textContent = '';
    var ids = {};
    var arrivals = [];
    list.forEach(function (p) {
      ids[p.id] = true;
      // Only people who arrive after the page has settled get a welcome, not everyone already here.
      if (knownIds && Date.now() - loadedAt > 4000 && !knownIds[p.id] && !p.isMe) arrivals.push(p);
    });
    knownIds = ids;
    if (!me) list = [{ id: '__empty', empty: true }].concat(list);
    var shown = list.slice(0, list.length > MAX_SEATS ? MAX_SEATS - 1 : MAX_SEATS);
    var extra = list.length - shown.length;
    var slots = shown.length + (extra > 0 ? 1 : 0);
    for (var i = 0; i < slots; i++) {
      var pt = seatPoint(i, slots);
      var b;
      if (i < shown.length && shown[i].empty) {
        b = el('button', 'bdr-seat-av is-empty', '+');
        b.type = 'button';
        b.setAttribute('aria-label', 'Your empty seat. Sit down at the table');
        b.style.setProperty('--d', '0s');
        var etag = el('span', 'bdr-seat-name', 'Your seat');
        b.appendChild(etag);
        b.addEventListener('click', goToSeat);
      } else if (i < shown.length) {
        var p = shown[i];
        b = el('button', 'bdr-seat-av' + (p.isMe ? ' is-me' : '') + (p.isMe && TV ? ' is-empty' : '') + (blockOf(p, backend.now()).focus ? '' : ' is-break'), p.isMe && TV ? '+' : initial(safeName(p)));
        b.type = 'button';
        b.dataset.id = p.id;
        if (!(p.isMe && TV)) avStyle(b, p);
        b.title = safeName(p) + ': ' + safeTask(p);
        b.style.setProperty('--halo', 'hsl(' + p.hue + ' 85% 72%)');
        b.style.setProperty('--d', (-(i * 0.83) % 5) + 's');
        var prog = el('span', 'bdr-seat-prog');
        prog.dataset.id = p.id;
        b.appendChild(prog);
        var tag = el('span', 'bdr-seat-name');
        tag.appendChild(el('span', null, p.isMe ? (TV ? 'Your seat' : 'You') : safeName(p)));
        var mins = el('span', 'bdr-seat-min num', '');
        mins.dataset.id = p.id;
        tag.appendChild(mins);
        b.appendChild(tag);
        if (arrivals.indexOf(p) >= 0) b.classList.add('is-new');
        // A thread of light from this seat to FOCO.
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pt.x * 4); line.setAttribute('y1', pt.y * 4);
        line.setAttribute('x2', 200); line.setAttribute('y2', 200);
        line.setAttribute('class', 'bdr-thread');
        line.style.setProperty('--halo', 'hsl(' + p.hue + ' 85% 72%)');
        line.dataset.id = p.id;
        threads.appendChild(line);
        if (p.isMe) { b.setAttribute('aria-label', 'Your seat'); b.tabIndex = -1; }
        else {
          b.setAttribute('aria-label', safeName(p) + ', working on ' + safeTask(p));
          (function (pp, bb) { bb.addEventListener('click', function () { openPop(pp, bb); }); })(p, b);
        }
      } else {
        b = el('span', 'bdr-seat-av bdr-seat-more', '+' + extra);
        b.setAttribute('aria-label', extra + ' more people');
      }
      b.style.left = pt.x + '%';
      b.style.top = pt.y + '%';
      wrap.appendChild(b);
    }
    updateMinutes();
    if (arrivals.length === 1) toast(arrivals[0], safeName(arrivals[0]) + ' sat down at the table, working on ' + safeTask(arrivals[0]));
    else if (arrivals.length > 1) toast(arrivals[0], plural(arrivals.length, 'person', 'people') + ' just sat down at the table');
    if (arrivals.length) {
      mascotSay('Welcome, ' + safeName(arrivals[0]) + '. Glad you’re here.');
      feed(safeName(arrivals[0]) + ' just sat down · ' + safeTask(arrivals[0]), arrivals[0]);
    }
    arrivals.forEach(function (p) {
      var seat = document.querySelector('.bdr-seat-av[data-id="' + p.id + '"]');
      if (seat) burst({ x: parseFloat(seat.style.left), y: parseFloat(seat.style.top) }, 'hsl(' + p.hue + ' 85% 72%)', 10);
    });
    warmth();
  }
  function updateMinutes() {
    Array.prototype.forEach.call(document.querySelectorAll('.bdr-seat-prog'), function (g) {
      var p = personById(g.dataset.id);
      if (!p) return;
      var bl = blockOf(p, backend.now());
      g.style.setProperty('--p', Math.min(1, bl.elapsed / bl.total).toFixed(4));
      g.classList.toggle('is-break', !bl.focus);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.bdr-seat-min'), function (m) {
      var p = personById(m.dataset.id);
      if (!p) return;
      var bl = blockOf(p, backend.now());
      m.textContent = bl.focus ? ' · ' + Math.max(1, Math.ceil(bl.remaining / 60000)) + 'm' : ' · break';
      m.parentNode.parentNode.title = safeName(p) + ': ' + safeTask(p) + (bl.focus ? ' · ' + Math.ceil(bl.remaining / 60000) + ' minutes left' : ' · on a break');
    });
  }
  // The more people at the table, the warmer FOCO glows.
  function warmth() {
    var n = seated().length;
    document.querySelector('.bdr-centre').style.setProperty('--warm', String(Math.min(1, 0.35 + n * 0.09)));
    motesTarget = 16 + n * 7;
  }

  // ---------- clock ----------
  // Your block, or a preview of the length you picked while you are not sitting yet.
  function myPhase() {
    var now = backend.now();
    if (me) return blockOf(me, now);
    var f = pickedLen * 60000;
    return { preview: true, len: pickedLen, focus: true, start: now, focusEnd: now + f, end: now + f, elapsed: 0, total: f, remaining: f, cycle: -1 };
  }
  function tick() {
    var now = backend.now();
    var ph = myPhase();
    var done = ph.total ? Math.min(1, ph.elapsed / ph.total) * CIRC : 0;
    // The ring is your block: lilac fills while you focus, orange fills through the break.
    var arc = $('ring-arc');
    arc.style.strokeDasharray = (ph.focus ? done : 0) + ' ' + CIRC;
    arc.style.opacity = ph.focus && done > 4 ? 1 : 0;
    $('ring-zone').style.opacity = 0;
    var brk = $('ring-break');
    brk.style.strokeDasharray = (ph.focus ? 0 : done) + ' ' + CIRC;
    brk.style.strokeDashoffset = 0;
    brk.style.opacity = !ph.focus && done > 4 ? 1 : 0;

    $('clock').textContent = mmss(ph.remaining);
    $('phase').textContent = ph.preview ? 'pick your time, then sit down' : ph.focus ? 'left of your ' + ph.len + ' minutes' : 'left in your break';
    document.querySelector('.bdr-table-label').textContent = ph.preview ? 'Your time' : ph.focus ? 'Your focus' : 'Your break';
    $('session-range').textContent = ph.preview ? ph.len + ' minutes, then a ' + breakFor(ph.len) + ' minute break' : hhmm(ph.start) + ' to ' + hhmm(ph.focusEnd);
    // a recording is watched at any hour, so no clock times; count the sessions instead
    if (TV && !ph.preview) {
      var cyc = Math.floor((backend.now() - me.blockStart) / ((ph.len + breakFor(ph.len)) * 60000)) + 1;
      var total = Number(params.get('sessions')) || 2;
      $('phase').textContent = (ph.focus ? 'focus' : 'break') + ' · session ' + Math.min(cyc, total) + ' of ' + total;
      $('next-line').textContent = ph.focus ? 'Then a ' + breakFor(ph.len) + ' minute break, together' : 'Stretch, drink some water. We start again soon.';
    } else $('next-line').textContent = ph.preview
      ? 'Start whenever you like. Everyone keeps their own time, side by side.'
      : ph.focus
        ? 'Your break starts at ' + hhmm(ph.focusEnd) + ' · ' + breakFor(ph.len) + ' minutes'
        : 'Your next ' + ph.len + ' minutes start at ' + hhmm(ph.end) + '. Stretch, drink some water.';

    var mascot = $('mascot');
    var want = asset(!ph.focus ? 'img/foco_state_5_completion.png' : (me ? 'img/foco_state_3_focus.png' : 'img/foco_state_1_presence.png'));
    if (mascot.getAttribute('src') !== want) {
      mascot.setAttribute('src', want);
      mascot.alt = ph.focus ? 'FOCO, focusing' : 'FOCO, on a break';
    }

    renderFinding(ph);
    $('stage').classList.toggle('is-break', !ph.focus);
    breathe(ph);

    var key = ph.preview ? null : ph.start + (ph.focus ? 'f' : 'b');
    if (key && lastPhase && lastPhase !== key) onPhaseChange(ph);
    lastPhase = key;
    updateMinutes();
    watchBlocks(now);
  }
  function feed(text, person) {
    var f = $('livefeed');
    f.textContent = '';
    if (person) f.appendChild(avatar(person, 'bdr-av bdr-av-xs'));
    f.appendChild(el('span', null, text));
    f.classList.remove('is-new');
    void f.offsetWidth;
    f.classList.add('is-new');
  }
  function celebrate(p) {
    var seat = document.querySelector('.bdr-seat-av[data-id="' + p.id + '"]');
    if (!seat) return;
    var at = { x: parseFloat(seat.style.left), y: parseFloat(seat.style.top) };
    burst(at, 'rgb(251,146,60)', 14);
    setTimeout(function () { burst(at, 'hsl(' + p.hue + ' 85% 72%)', 10); }, 180);
    seat.classList.remove('is-touched');
    void seat.offsetWidth;
    seat.classList.add('is-touched');
  }
  function watchBlocks(now) {
    others().forEach(function (p) {
      var bl = blockOf(p, now);
      var prev = prevBlocks[p.id];
      prevBlocks[p.id] = { focus: bl.focus, start: p.blockStart, sound: p.sound, cycle: bl.cycle };
      if (!prev) return;
      if (prev.focus && !bl.focus && prev.start === p.blockStart) {
        feed(safeName(p) + ' just finished ' + bl.len + ' minutes', p);
        celebrate(p);
      } else if (prev.start !== p.blockStart) {
        feed(safeName(p) + ' started a fresh ' + bl.len + ' minutes', p);
      } else if (prev.sound !== p.sound && p.sound && STATIONS[p.sound]) {
        feed(safeName(p) + ' put on ' + STATIONS[p.sound].name, p);
      }
    });
  }

  function breathe(ph) {
    var b = $('breath');
    if (ph.focus) { b.hidden = true; delete b.dataset.synced; return; }
    if (!b.dataset.synced) {
      // Start everyone's aura breath on the same beat as the words.
      $('aura').style.animationDelay = -((backend.now() / 1000) % 10) + 's';
      b.dataset.synced = '1';
    }
    b.hidden = false;
    // 4 seconds in, 6 seconds out, the same for everyone at the table.
    var t = (backend.now() / 1000) % 10;
    var txt = t < 4 ? 'Breathe in' : 'Breathe out';
    if (b.textContent !== txt) b.textContent = txt;
  }
  function renderFinding(ph) {
    var n = others().length;
    var line;
    var all = seated();
    var w = Math.max(0, watching - all.length);
    $('together').textContent = [
      all.length ? all.length + ' at the table' : 'Table open',
      w ? w + ' watching' : '',
      dailyDone ? plural(dailyDone, 'session', 'sessions') + ' finished today' : '',
    ].filter(Boolean).join(' · ');
    if (me && !ph.focus) {
      line = 'You\u2019re on a break until ' + hhmm(ph.end) + (n ? ' · ' + plural(n, 'person is', 'people are') + ' still at the table' : '');
    } else if (me) {
      line = n ? 'You and ' + plural(n, 'kind soul', 'kind souls') + ', focusing together' : 'FOCO is focusing with you';
    } else {
      line = n ? plural(n, 'person', 'people') + ' focusing right now, each on their own time'
               : 'Quiet right now. Take a seat and FOCO will focus with you.';
    }
    $('finding').textContent = line;
    $('bar-scope').textContent = n ? (n + (me ? 1 : 0)) + ' live now · open 24/7' : 'Live room · open 24/7';
  }

  function onPhaseChange(ph) {
    chime(ph.focus);
    renderTally();
    if (!me) return;
    if (!ph.focus) {
      // A focus block just ended. Count it if you sat through at least 5 minutes of it.
      var satMs = ph.focusEnd - Math.max(me.seatedAt, me.blockStart || 0, ph.start);
      if (satMs >= 5 * 60000) {
        sessionsToday += 1;
        var all = {};
        all[today] = sessionsToday;
        store('sessions', all);
        me.sessions = sessionsToday;
        backend.update({ sessions: sessionsToday, status: 'break' });
        backend.finishSession();
        showRecap(Math.round(satMs / 60000), ph);
      } else {
        backend.update({ status: 'break' });
      }
      me.status = 'break';
    } else {
      me.status = 'focus';
      backend.update({ status: 'focus' });
      toast(null, 'Your next ' + ph.len + ' minutes start now. One small step.');
    }
    renderSeated();
  }

  // ---------- seat ----------
  function renderSeated() {
    var on = !!me;
    $('seat-form').hidden = on;
    $('seated').hidden = !on;
    $('seat-h').textContent = on ? 'Your seat' : 'Take a seat';
    $('composer').classList.toggle('is-locked', !on);
    $('composer-lock').hidden = on;
    $('stage').classList.toggle('is-locked', !on);
    $('reactbar-hint').textContent = on ? 'Tap to send to the whole table. It flies to FOCO and everyone feels it.' : 'Take a seat, then send love to the whole table.';
    if (!on) return;
    var av = $('me-av');
    av.textContent = initial(me.name);
    avStyle(av, me);
    $('me-name').textContent = me.name;
    $('me-task').textContent = me.task;
    $('me-sessions').textContent = String(sessionsToday);
    markLengths();
  }

  // ---------- focus length: picked before you sit, changeable any time (it starts a fresh block) ----------
  var pickedLen = LENGTHS.indexOf(saved.len) >= 0 ? saved.len : 25;
  function lengthRow(box, onPick) {
    LENGTHS.forEach(function (n) {
      var b = el('button', 'bdr-len', n + ' min');
      b.type = 'button';
      b.dataset.len = n;
      b.addEventListener('click', function () { onPick(n); });
      box.appendChild(b);
    });
  }
  function markLengths() {
    var cur = me ? me.len : pickedLen;
    Array.prototype.forEach.call(document.querySelectorAll('.bdr-len'), function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.len) === cur ? 'true' : 'false');
    });
  }
  lengthRow($('len-pick'), function (n) { pickedLen = n; markLengths(); tick(); });
  lengthRow($('len-change'), function (n) {
    if (!me || me.len === n && blockOf(me, backend.now()).focus) return;
    var now = backend.now();
    me.len = n;
    me.blockStart = now;
    me.seatedAt = now;
    me.status = 'focus';
    lastPhase = null;
    store('profile', { name: me.name, task: me.task, hue: me.hue, pic: me.pic, len: n });
    backend.update({ len: n, blockStart: now, status: 'focus' });
    markLengths();
    renderPeople();
    tick();
    toast(null, 'A fresh ' + n + ' minutes, starting now.');
  });
  markLengths();

  $('seat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = clean($('f-name').value, 20);
    var task = clean($('f-task').value, 60);
    if (!name || !task) return;
    var now = backend.now();
    me = { name: name, task: task, hue: pickedHue, pic: pickedPic, sound: radioOn, sessions: sessionsToday, status: 'focus', len: pickedLen, blockStart: now, seatedAt: now };
    store('profile', { name: name, task: task, hue: pickedHue, pic: pickedPic, len: pickedLen });
    backend.join(me).then(function () {
      renderSeated();
      renderPeople();
      document.querySelector('.bdr-centre').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (isPhone()) showPanel('panel-words');
      if (!others().length) mascotSay('I’ll focus with you. Start with the smallest piece of it.');
      scheduleMascot();
    }).catch(function () {
      me = null;
      toast(null, 'Couldn’t take a seat. Check your connection and try again.');
    });
  });

  $('sit-cta').addEventListener('click', function () { goToSeat(); });
  function goToSeat() {
    showPanel('panel-seat', true);
    $('panel-seat').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { ($('f-name').value ? $('f-task') : $('f-name')).focus({ preventScroll: true }); }, 380);
  }
  $('leave').addEventListener('click', leave);
  $('edit-task').addEventListener('click', function () {
    var t = clean(window.prompt('What are you working on now?', me.task), 60);
    if (!t) return;
    me.task = t;
    store('profile', { name: me.name, task: t, hue: me.hue, pic: me.pic, len: me.len });
    backend.update({ task: t });
    renderSeated();
    renderPeople();
  });
  function leave() {
    backend.leave();
    me = null;
    renderSeated();
    renderPeople();
  }

  // ---------- person popover (who they are, and Hide) ----------
  function openPop(p, anchor) {
    popTarget = p;
    popAnchor = anchor;
    var pop = $('pop');
    $('pop-h').textContent = safeName(p);
    var st = STATIONS[p.sound] && p.sound ? ' · listening to ' + STATIONS[p.sound].name : '';
    $('pop-task').textContent = 'Working on: ' + safeTask(p) + st;
    pop.hidden = false;
    var r = anchor.getBoundingClientRect();
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;
    pop.style.left = Math.min(window.innerWidth - w - 16, Math.max(16, r.left + r.width / 2 - w / 2)) + 'px';
    pop.style.top = (r.bottom + 8 + h > window.innerHeight ? Math.max(16, r.top - h - 8) : r.bottom + 8) + 'px';
    $('pop-hide').focus({ preventScroll: true });
  }
  function closePop() {
    $('pop').hidden = true;
    if (popAnchor && document.body.contains(popAnchor)) popAnchor.focus({ preventScroll: true });
    popTarget = null;
    popAnchor = null;
  }
  $('pop-hide').addEventListener('click', function () {
    if (!popTarget) return;
    var t = popTarget;
    hidden[t.id] = true;
    closePop();
    renderPeople();
    renderChat();
    toast(null, safeName(t) + ' is hidden for you.');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('pop').hidden) closePop();
    if (!$('share').hidden) $('share').hidden = true;
    if (!$('recap').hidden) $('recap').hidden = true;
  });
  document.addEventListener('pointerdown', function (e) {
    if (!$('pop').hidden && !e.target.closest('#pop') && !e.target.closest('.bdr-person') && !e.target.closest('.bdr-seat-av')) closePop();
  });

  // ---------- room chat: ready-made lines and emoji ----------
  var activeTab = 0;
  EMOJI.forEach(function (e, i) {
    var b = el('button', 'bdr-emoji-btn', e);
    b.type = 'button';
    b.setAttribute('aria-label', 'Send ' + EMOJI_NAMES[i] + ' to the room');
    b.addEventListener('click', function () { send({ kind: 'emoji', cat: 0, value: i }); });
    $('emoji-row').appendChild(b);
  });
  LINES.forEach(function (cat, c) {
    var t = el('button', 'bdr-tab', cat.tab);
    t.type = 'button';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-selected', c === 0 ? 'true' : 'false');
    t.addEventListener('click', function () { activeTab = c; renderPhrases(); });
    $('phrase-tabs').appendChild(t);
  });
  function renderPhrases() {
    Array.prototype.forEach.call($('phrase-tabs').children, function (t, k) { t.setAttribute('aria-selected', k === activeTab ? 'true' : 'false'); });
    var box = $('phrases');
    box.textContent = '';
    LINES[activeTab].items.forEach(function (line, v) {
      var b = el('button', 'bdr-phrase', line);
      b.type = 'button';
      b.addEventListener('click', function () { send({ kind: 'line', cat: activeTab, value: v }); });
      box.appendChild(b);
    });
  }
  renderPhrases();

  function send(msg) {
    if (!me) { goToSeat(); return; }
    if (Date.now() - lastSent < COOLDOWN_MS) return;
    lastSent = Date.now();
    var composer = $('composer');
    var stage = $('stage');
    composer.classList.add('is-cooling');
    stage.classList.add('is-cooling');
    setTimeout(function () { composer.classList.remove('is-cooling'); stage.classList.remove('is-cooling'); }, COOLDOWN_MS);
    backend.post(Object.assign({ name: me.name, hue: me.hue, pic: typeof me.pic === 'number' ? me.pic : -1 }, msg)).catch(function () {
      toast(null, 'That didn’t send. Try again in a moment.');
    });
  }

  backend.onChat(function (m) {
    if (!m || seen[m.id] || lineText(m) == null) return;
    seen[m.id] = true;
    messages.push(m);
    messages.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
    if (messages.length > CHAT_KEEP) messages = messages.slice(-CHAT_KEEP);
    renderChat();
    renderTally();
    renderTicker(m);
    var fresh = (m.at || 0) > loadedAt - 3000 || m.from === backend.id;
    if (fresh && m.from !== backend.id && (shownPanel !== 'panel-words' || !isPhone())) { unseenWords++; renderBadges(); }
    if (!fresh || hidden[m.from]) return;
    if (m.kind === 'emoji') fly(m.from, EMOJI[m.value]);
    else bubble(m.from, lineText(m));
  });

  // Kind words: the last six, newest on top, older ones fading. The table shows them live as bubbles.
  function renderChat() {
    var ol = $('chat');
    ol.textContent = '';
    var shown = messages.filter(function (m) { return !hidden[m.from]; });
    shown.slice(-6).reverse().forEach(function (m) {
      var who = personById(m.from) || { name: m.name || 'Someone', hue: m.hue || 265, pic: m.pic };
      var li = el('li', m.kind === 'emoji' ? 'is-emoji' : null);
      li.appendChild(avatar(who));
      var body = el('span', 'bdr-word');
      body.appendChild(el('span', 'bdr-word-name', (m.from === backend.id ? 'You' : safeName(who)) + ' · ' + ago(backend.now() - (m.at || 0))));
      body.appendChild(el('span', 'bdr-word-text', lineText(m)));
      li.appendChild(body);
      ol.appendChild(li);
    });
    $('chat-empty').hidden = shown.length > 0;
    $('chat-count').textContent = shown.length ? plural(shown.length, 'message', 'messages') + ' this hour' : '';
  }
  setInterval(renderChat, 60000);

  // The tally under the clock: this session's emoji, most sent first.
  function renderTally() {
    var start = me ? blockOf(me, backend.now()).start : backend.now() - 30 * 60000;
    var counts = {};
    messages.forEach(function (m) {
      if (m.kind === 'emoji' && (m.at || 0) >= start && !hidden[m.from]) counts[m.value] = (counts[m.value] || 0) + 1;
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
    $('tally').textContent = top.map(function (k) { return EMOJI[k] + ' ' + counts[k]; }).join('   ');
  }

  // ---------- the flight: an emoji travels from the sender's seat to FOCO ----------
  function seatPos(id) {
    var seat = document.querySelector('.bdr-seat-av[data-id="' + id + '"]');
    if (seat) return { x: parseFloat(seat.style.left), y: parseFloat(seat.style.top) };
    return { x: 50, y: 100 };
  }
  function bump() {
    var m = $('mascot');
    if (!m.animate) return;
    m.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.14) rotate(-5deg)' },
      { transform: 'scale(0.96) rotate(3deg)' },
      { transform: 'scale(1)' },
    ], { duration: 420, easing: 'ease-out' });
  }
  function fly(fromId, glyph) {
    var wrap = $('ring-wrap');
    var size = wrap.clientWidth;
    var from = seatPos(fromId);
    var to = { x: 50, y: 40 };
    var f = el('span', 'bdr-flight', glyph);
    f.style.left = from.x + '%';
    f.style.top = from.y + '%';
    $('flights').appendChild(f);
    if (reduceMotion || !f.animate) {
      f.remove();
      bump();
      return;
    }
    var dx = (to.x - from.x) / 100 * size;
    var dy = (to.y - from.y) / 100 * size;
    // Curve the path: push the midpoint sideways, away from the straight line.
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var bend = (Math.random() < 0.5 ? -1 : 1) * Math.min(70, len * 0.35);
    var mx = dx * 0.5 + (-dy / len) * bend;
    var my = dy * 0.5 + (dx / len) * bend;
    var anim = f.animate([
      { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(0.5)', opacity: 0 },
      { transform: 'translate(-50%, -50%) translate(0px, -14px) scale(1.35)', opacity: 1, offset: 0.14 },
      { transform: 'translate(-50%, -50%) translate(' + mx + 'px, ' + my + 'px) scale(1.15)', opacity: 1, offset: 0.55 },
      { transform: 'translate(-50%, -50%) translate(' + dx + 'px, ' + dy + 'px) scale(0.45)', opacity: 0.2 },
    ], { duration: 1150 + Math.random() * 250, easing: 'cubic-bezier(.45,.05,.4,1)' });
    anim.onfinish = function () {
      f.remove();
      bump();
      burst(to);
      ripple();
    };
    glowThread(fromId);
  }
  function glowThread(id) {
    var t = document.querySelector('.bdr-thread[data-id="' + id + '"]');
    if (!t) return;
    t.classList.remove('is-lit');
    void t.getBoundingClientRect();
    t.classList.add('is-lit');
    setTimeout(function () { t.classList.remove('is-lit'); }, 1600);
  }
  // A wave from FOCO out to the ring: everyone at the table feels it.
  function ripple() {
    if (reduceMotion) return;
    var r = el('span', 'bdr-ripple');
    $('ripples').appendChild(r);
    setTimeout(function () { r.remove(); }, 1300);
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.bdr-seat-av'), function (s) {
        s.classList.remove('is-touched');
        void s.offsetWidth;
        s.classList.add('is-touched');
      });
    }, 520);
  }
  // A small burst of light where something lands.
  function burst(at, colour, count) {
    if (reduceMotion) return;
    count = count || 7;
    for (var i = 0; i < count; i++) {
      var d = el('span', 'bdr-spark');
      if (colour) d.style.background = colour;
      d.style.left = at.x + '%';
      d.style.top = at.y + '%';
      $('flights').appendChild(d);
      var a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      var r = 34 + Math.random() * 18;
      var an = d.animate([
        { transform: 'translate(-50%, -50%) translate(0, 0) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) translate(' + Math.cos(a) * r + 'px, ' + Math.sin(a) * r + 'px) scale(0.2)', opacity: 0 },
      ], { duration: 520, easing: 'ease-out' });
      (function (node) { an.onfinish = function () { node.remove(); }; })(d);
    }
  }
  // A line shows as a speech bubble over the sender's seat for a few seconds.
  function bubble(fromId, text) {
    var at = seatPos(fromId);
    var b = el('span', 'bdr-bubble', text);
    b.style.left = Math.min(78, Math.max(22, at.x)) + '%';
    b.style.top = at.y + '%';
    if (at.y > 60) b.classList.add('is-above');
    $('flights').appendChild(b);
    setTimeout(function () { b.classList.add('is-out'); }, 3600);
    setTimeout(function () { b.remove(); }, 4100);
  }

  function toast(person, text) {
    if (TV) return;
    var t = el('div', 'bdr-toast');
    if (person) t.appendChild(avatar(person));
    else {
      var img = el('img');
      img.src = asset('img/foco_state_1_presence.png');
      img.alt = '';
      img.width = 32;
      t.appendChild(img);
    }
    t.appendChild(el('span', null, text));
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  // ---------- motes: small points of light drifting up around the table ----------
  var motesTarget = 16;
  (function motes() {
    var c = $('motes');
    if (!c.getContext || reduceMotion) return;
    var x = c.getContext('2d');
    var dots = [];
    var w = 0, h = 0, dpr = 1;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.08 + Math.random() * 0.32,
        sway: Math.random() * Math.PI * 2,
        tw: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.25,
      };
    }
    size();
    window.addEventListener('resize', size);
    var brk = false;
    (function frame() {
      requestAnimationFrame(frame);
      if (document.hidden || !w) return;
      while (dots.length < motesTarget) dots.push(spawn(dots.length < 8));
      if (dots.length > motesTarget + 4) dots.length = motesTarget;
      brk = $('stage').classList.contains('is-break');
      x.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.y -= d.vy;
        d.sway += 0.01;
        d.tw += 0.03;
        var px = d.x + Math.sin(d.sway) * 6;
        if (d.y < -10) { dots[i] = spawn(false); continue; }
        var a = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(d.tw))) * Math.min(1, d.y / (h * 0.25));
        x.beginPath();
        x.fillStyle = (brk || d.warm ? 'rgba(251,146,60,' : 'rgba(196,181,253,') + a.toFixed(3) + ')';
        x.arc(px, d.y, d.r, 0, Math.PI * 2);
        x.fill();
      }
    })();
  })();

  // ---------- FOCO, when you are alone ----------
  function mascotSay(text) {
    var b = $('mascot-say');
    b.textContent = text;
    b.hidden = false;
    clearTimeout(b._t);
    b._t = setTimeout(function () { b.hidden = true; }, 8000);
  }
  function scheduleMascot() {
    clearTimeout(mascotTimer);
    mascotTimer = setTimeout(function () {
      if (me && blockOf(me, backend.now()).focus && !others().length) {
        mascotSay(MASCOT_LINES[Math.floor(Math.random() * MASCOT_LINES.length)]);
      }
      if (me) scheduleMascot();
    }, 180000 + Math.random() * 120000);
  }

  // ---------- focus radio (YouTube's player API, so a station that fails is caught and skipped) ----------
  var yt = null;
  var ytReady = null;
  var broken = {};
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(function (res, rej) {
      if (window.YT && window.YT.Player) return res();
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) prev(); res(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return ytReady;
  }
  setTimeout(function () { loadYT().catch(function () {}); }, 3000);
  function stationBtn(s, i) {
    var b = el('button', 'bdr-station' + (s.foco ? ' is-foco' : ''), s.name);
    b.type = 'button';
    b.dataset.i = i;
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    if (s.by) b.title = s.name + ' · ' + s.by;
    b.addEventListener('click', function () { tune(i); });
    return b;
  }
  (function buildStations() {
    var box = $('stations');
    [['From FOCO', function (s) { return s.foco; }], ['More stations', function (s) { return s.id && !s.foco; }]].forEach(function (g, gi) {
      var wrap = el('div', 'bdr-station-group');
      wrap.appendChild(el('p', 'bdr-station-label', g[0]));
      var row = el('div', 'bdr-stations-row');
      if (gi === 0) row.appendChild(stationBtn(STATIONS[0], 0));
      STATIONS.forEach(function (s, i) { if (g[1](s)) row.appendChild(stationBtn(s, i)); });
      wrap.appendChild(row);
      box.appendChild(wrap);
    });
  })();
  function markStations() {
    Array.prototype.forEach.call(document.querySelectorAll('.bdr-station'), function (b) {
      var k = Number(b.dataset.i);
      b.setAttribute('aria-pressed', k === radioOn ? 'true' : 'false');
      b.disabled = !!broken[k];
    });
  }
  function tune(i) {
    radioOn = i;
    var s = STATIONS[i];
    markStations();
    var player = $('player');
    if (yt) { try { yt.destroy(); } catch (e) {} yt = null; }
    player.textContent = '';
    player.hidden = !s.id;
    // The 25 minute FOCO tracks start at the same second for everyone, so the whole table hears the same moment.
    $('radio-now').textContent = s.id ? (s.sync ? 'In time with the table' : s.name) : '';
    musicButton();
    store('station', i);
    if (me) { me.sound = i; backend.update({ sound: i }); renderPeople(); }
    if (!s.id) return;
    if (!audio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    }
    var holder = el('div');
    player.appendChild(holder);
    loadYT().then(function () {
      if (radioOn !== i) return;
      // Demo only: ?demo&badradio swaps Chillhop for a video that refuses embedding, to test the skip.
      var vid = DEMO && params.has('badradio') && i === 5 ? 'jfKfPfyJRdk' : s.id;
      yt = new YT.Player(holder, {
        videoId: vid,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: function (e) {
            if (s.sync) {
              var d = e.target.getDuration();
              if (d > 60) e.target.seekTo(Math.floor((backend.now() / 1000) % d), true);
            }
            e.target.playVideo();
          },
          onError: function () { broken[i] = true; skip(i); },
        },
      });
    }).catch(function () { broken[i] = true; skip(i); });
  }
  // The big button under the table: one tap starts FOCO's brown noise, another stops the music.
  function musicButton() {
    var on = radioOn > 0;
    var s = STATIONS[radioOn];
    $('music-btn').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('music-main').textContent = on ? s.name : 'Play focus music';
    $('music-sub').textContent = on ? (s.sync ? 'In time with the table · tap to stop' : s.by + ' · tap to stop') : 'FOCO brown noise, in time with the table';
  }
  $('music-btn').addEventListener('click', function () {
    if (radioOn) tune(0);
    else tune(3);
  });
  $('music-more').addEventListener('click', function () {
    showPanel('panel-radio', true);
    if (!isPhone()) $('panel-radio').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  function skip(from) {
    if (radioOn !== from) return;
    var next = 0;
    for (var k = 1; k < STATIONS.length; k++) {
      var c = (from + k) % STATIONS.length;
      if (c && STATIONS[c].id && !broken[c]) { next = c; break; }
    }
    toast(null, STATIONS[from].name + ' isn’t playing right now' + (next ? ', so we switched to ' + STATIONS[next].name + '.' : '.'));
    tune(next);
  }

  // ---------- recap ----------
  function showRecap(minutes, ph) {
    if (TV) return;
    var n = others().length;
    var reactions = messages.filter(function (m) { return m.kind === 'emoji' && (m.at || 0) >= ph.start && (m.at || 0) < ph.focusEnd; }).length;
    $('recap-line').textContent = 'You focused for ' + minutes + ' minutes' + (n ? ' with ' + plural(n, 'other person', 'other people') : ' with FOCO') + '. ' +
      (reactions ? 'The room sent ' + plural(reactions, 'reaction', 'reactions') + '.' : 'That’s ' + plural(sessionsToday, 'session', 'sessions') + ' today.');
    lastRecap = { minutes: minutes, people: n, reactions: reactions };
    $('recap').hidden = false;
    $('recap-share').focus();
  }
  $('recap-close').addEventListener('click', function () { $('recap').hidden = true; });
  var lastRecap = null;
  $('recap-share').addEventListener('click', function () { $('recap').hidden = true; openShare('done'); });
  $('recap-app').addEventListener('click', function () { $('recap').hidden = true; });

  // ---------- share: an invite or an "I focused" card, as a Story (9:16) or a Post (4:5) ----------
  var shareKind = 'invite';
  var shareFormat = 'story';
  var cardBlob = null;
  var drawToken = 0;
  function shareBase() { return CFG.shareUrl || (location.origin + location.pathname); }
  function shareUrl() {
    var b = shareBase();
    return b + (b.indexOf('?') < 0 ? '?' : '&') + 'utm_source=share&utm_medium=social&utm_campaign=body_doubling_room&utm_content=' + shareKind;
  }
  function shortUrl() { return CFG.displayUrl || shareBase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); }
  // No clock times in what people share: it is read later, in other timezones.
  function shareText() {
    if (shareKind === 'done') {
      var with_ = lastRecap && lastRecap.people ? plural(lastRecap.people, 'other person', 'other people') : 'other people';
      return 'I just finished a focus session with ' + with_ + ' in a free live body doubling room. Come focus with me next time: ';
    }
    return 'Come focus with me in a free, live body doubling room. Pick 15 to 90 minutes and start whenever you like, no sign up: ';
  }
  function loadImg(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
  }
  function wrapText(ctx, text, maxW) {
    var words = text.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function roundRect(x, l, t, w, h, r) {
    x.beginPath();
    x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
    x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
  }
  function seededRandom(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  function drawCard() {
    var story = shareFormat === 'story';
    var W = 1080;
    var H = story ? 1920 : 1350;
    var c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    var x = c.getContext('2d');
    var others6 = seated().filter(function (p) { return !p.isMe; }).slice(0, 6);
    // Fill empty chairs with sample faces so the table never looks empty on a card.
    var fill = [1, 6, 3, 14, 7, 10];
    var faces = [];
    for (var k = 0; k < 6; k++) faces.push(others6[k] ? others6[k].pic : fill[k]);
    var myLook = me ? me.pic : pickedPic;
    var fonts = document.fonts && document.fonts.load ? Promise.all([
      document.fonts.load('500 120px Fraunces'), document.fonts.load('italic 400 120px Fraunces'),
      document.fonts.load('600 44px Figtree'), document.fonts.load('700 44px Figtree'),
    ]) : Promise.resolve();
    var imgs = [loadImg(asset('img/foco_state_' + (shareKind === 'done' ? '5_completion' : '3_focus') + '.png')), loadImg(asset('img/foco-logo.png')), loadImg(lookUrl(myLook) || lookUrl(0))]
      .concat(faces.map(function (f) { return loadImg(lookUrl(f) || lookUrl(0)); }));
    return Promise.all([fonts].concat(imgs)).then(function (r) {
      var mascot = r[1], logo = r[2], mine = r[3], faceImgs = r.slice(4);
      var rnd = seededRandom(7);
      // Night, with a violet glow where the table is and a warm one low down.
      x.fillStyle = '#06030c';
      x.fillRect(0, 0, W, H);
      var cx = W / 2, cy = story ? 700 : 450, R = story ? 300 : 236;
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
      g.addColorStop(0, 'rgba(124,58,237,0.75)'); g.addColorStop(0.45, 'rgba(124,58,237,0.22)'); g.addColorStop(1, 'rgba(124,58,237,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var g2 = x.createRadialGradient(cx, H, 0, cx, H, H * 0.55);
      g2.addColorStop(0, 'rgba(124,58,237,0.25)'); g2.addColorStop(1, 'rgba(124,58,237,0)');
      x.fillStyle = g2; x.fillRect(0, 0, W, H);
      for (var m = 0; m < 90; m++) {
        x.fillStyle = 'rgba(' + (rnd() < 0.25 ? '251,146,60' : '196,181,253') + ',' + (0.15 + rnd() * 0.5).toFixed(2) + ')';
        x.beginPath(); x.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2.4, 0, Math.PI * 2); x.fill();
      }
      // Top: logo and a live dot
      var lh = story ? 64 : 54;
      if (logo) x.drawImage(logo, 80, story ? 96 : 70, logo.width * (lh / logo.height), lh);
      x.font = '600 ' + (story ? 34 : 30) + 'px Figtree';
      x.textAlign = 'right'; x.textBaseline = 'middle';
      x.fillStyle = '#f6f3ff';
      var liveY = (story ? 96 : 70) + lh / 2;
      x.fillText(shareKind === 'done' ? 'Session complete' : 'Live now', W - 80, liveY);
      var tw = x.measureText(shareKind === 'done' ? 'Session complete' : 'Live now').width;
      x.fillStyle = shareKind === 'done' ? '#fb923c' : '#4ade80';
      x.beginPath(); x.arc(W - 80 - tw - 22, liveY, 9, 0, Math.PI * 2); x.fill();
      // Threads from each seat to the middle
      var seats = [];
      for (var s = 0; s < 7; s++) {
        var a = Math.PI / 2 + s * Math.PI * 2 / 7;
        seats.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
      }
      x.setLineDash([4, 14]); x.lineWidth = 2; x.strokeStyle = 'rgba(196,181,253,0.35)';
      seats.forEach(function (p) { x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(cx, cy); x.stroke(); });
      x.setLineDash([]);
      // The ring
      x.lineWidth = story ? 14 : 12; x.lineCap = 'round';
      x.strokeStyle = 'rgba(255,255,255,0.08)';
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
      x.save();
      x.shadowColor = 'rgba(196,181,253,0.9)'; x.shadowBlur = 30;
      x.strokeStyle = shareKind === 'done' ? '#fb923c' : '#c4b5fd';
      x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (shareKind === 'done' ? 1 : 0.66)); x.stroke();
      x.restore();
      // Seats: you at the bottom, six people around
      function seat(img, p, size, ring) {
        x.save();
        x.shadowColor = ring; x.shadowBlur = 34;
        x.fillStyle = '#06030c'; x.beginPath(); x.arc(p.x, p.y, size / 2 + 12, 0, Math.PI * 2); x.fill();
        x.restore();
        x.lineWidth = 4; x.strokeStyle = ring;
        x.beginPath(); x.arc(p.x, p.y, size / 2 + 9, 0, Math.PI * 2); x.stroke();
        x.save(); x.beginPath(); x.arc(p.x, p.y, size / 2, 0, Math.PI * 2); x.clip();
        x.fillStyle = '#1a1226'; x.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        if (img) x.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
        x.restore();
      }
      var rings = ['#f9a8d4', '#7dd3fc', '#fde68a', '#86efac', '#c4b5fd', '#fdba74'];
      for (var q = 1; q < 7; q++) seat(faceImgs[q - 1], seats[q], story ? 96 : 78, rings[q - 1]);
      seat(mine, seats[0], story ? 124 : 100, '#ffffff');
      // FOCO in the middle, glowing
      if (mascot) {
        var mh = story ? 300 : 236, mw = mascot.width * (mh / mascot.height);
        x.save(); x.shadowColor = 'rgba(124,58,237,0.9)'; x.shadowBlur = 60;
        x.drawImage(mascot, cx - mw / 2, cy - mh / 2 - 10, mw, mh);
        x.restore();
      }
      // Words
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      var hs = story ? 124 : 104;
      var y = story ? 1230 : 846;
      var mins = lastRecap ? lastRecap.minutes : me ? me.len : 25;
      var l1 = shareKind === 'done' ? mins + ' minutes.' : 'Come focus';
      var l2 = shareKind === 'done' ? 'Done, together.' : 'with me.';
      x.fillStyle = '#f6f3ff';
      x.font = '500 ' + hs + 'px Fraunces';
      x.fillText(l1, cx, y);
      x.fillStyle = '#c4b5fd';
      x.font = 'italic 400 ' + hs + 'px Fraunces';
      x.fillText(l2, cx, y + hs * 1.02);
      var sub;
      if (shareKind === 'done') {
        var n = lastRecap ? lastRecap.people : others().length;
        sub = (n ? 'Focused with ' + plural(n, 'other person', 'other people') : 'Focused with the FOCO table') + (sessionsToday > 1 ? ' · ' + plural(sessionsToday, 'session', 'sessions') + ' today' : '');
      } else {
        sub = me ? 'Working on: ' + safeTask(me) : 'A live body doubling room for ADHD brains';
      }
      x.fillStyle = '#b9b1cf';
      x.font = '500 ' + (story ? 44 : 38) + 'px Figtree';
      var sy = y + hs * 1.02 + (story ? 96 : 76);
      wrapText(x, sub, W - 200).slice(0, 2).forEach(function (line) { x.fillText(line, cx, sy); sy += story ? 58 : 50; });
      // The way in: a white pill with the address
      var pill = 'Join free at ' + shortUrl();
      x.font = '700 ' + (story ? 46 : 40) + 'px Figtree';
      var pw = Math.min(W - 160, x.measureText(pill).width + 110), ph = story ? 112 : 96;
      var py = story ? H - 300 : H - 200;
      x.save(); x.shadowColor = 'rgba(196,181,253,0.7)'; x.shadowBlur = 40;
      x.fillStyle = '#ffffff'; roundRect(x, cx - pw / 2, py, pw, ph, ph / 2); x.fill();
      x.restore();
      x.fillStyle = '#120a1f'; x.textBaseline = 'middle';
      x.fillText(pill, cx, py + ph / 2 + 2);
      x.fillStyle = '#b9b1cf';
      x.font = '500 ' + (story ? 34 : 30) + 'px Figtree';
      x.fillText('Pick 15 to 90 minutes · no sign up', cx, py + ph + (story ? 70 : 54));
      return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, url: c.toDataURL('image/png') }); }, 'image/png'); });
    });
  }
  function refreshCard() {
    var token = ++drawToken;
    cardBlob = null;
    $('share-img').style.opacity = '.4';
    drawCard().then(function (r) {
      if (token !== drawToken) return;
      cardBlob = r.blob;
      $('share-img').src = r.url;
      $('share-img').style.opacity = '1';
    }).catch(function () { toast(null, 'Couldn’t draw the card. The link still works.'); });
  }
  function updateLinks() {
    var text = shareText();
    var url = shareUrl();
    $('share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(text + url);
    $('share-x').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
    $('share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    $('share-tg').href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
    $('share-url-short').textContent = shortUrl();
  }
  function setSeg(id, attr, val) {
    Array.prototype.forEach.call($(id).children, function (b) { b.setAttribute('aria-pressed', b.dataset[attr] === val ? 'true' : 'false'); });
  }
  function openShare(kind) {
    shareKind = kind || 'invite';
    setSeg('share-kind', 'kind', shareKind);
    setSeg('share-format', 'format', shareFormat);
    $('share').hidden = false;
    refreshCard();
    updateLinks();
    var canFiles = false;
    try { canFiles = !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.png', { type: 'image/png' })] })); } catch (e) {}
    $('share-native').hidden = !navigator.share;
    $('share-native').textContent = canFiles ? 'Share card' : 'Share link';
    $('share-close').focus();
  }
  $('share-kind').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    shareKind = b.dataset.kind; setSeg('share-kind', 'kind', shareKind); refreshCard(); updateLinks();
  });
  $('share-format').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    shareFormat = b.dataset.format; setSeg('share-format', 'format', shareFormat); refreshCard();
  });
  $('invite').addEventListener('click', function () { openShare('invite'); });
  $('share-top').addEventListener('click', function () { openShare('invite'); });
  $('invite-inline').addEventListener('click', function () { openShare('invite'); });
  $('share-close').addEventListener('click', function () { $('share').hidden = true; });
  $('share').addEventListener('click', function (e) { if (e.target === $('share')) $('share').hidden = true; });
  $('share-native').addEventListener('click', function () {
    var data = { title: 'Focus with me', text: shareText(), url: shareUrl() };
    try {
      var file = cardBlob && new File([cardBlob], 'foco-focus-' + shareKind + '.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
    } catch (e) {}
    navigator.share(data).catch(function () {});
  });
  $('share-download').addEventListener('click', function () {
    if (!cardBlob) return;
    var a = el('a');
    a.href = URL.createObjectURL(cardBlob);
    a.download = 'foco-focus-' + shareKind + '-' + shareFormat + '.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  $('share-copy').addEventListener('click', function () {
    var text = shareText() + shareUrl();
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
      toast(null, 'Link copied. Paste it anywhere.');
    }).catch(function () { window.prompt('Copy this link:', shareUrl()); });
  });

  // ---------- phone tabs: one panel at a time under the table ----------
  var shownPanel = 'panel-seat';
  var unseenWords = 0;
  function isPhone() { return window.matchMedia('(max-width: 760px)').matches; }
  function showPanel(id, scroll) {
    shownPanel = id;
    if (id === 'panel-words') { unseenWords = 0; renderBadges(); }
    if (scroll && isPhone()) {
      var top = $(id).getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    Array.prototype.forEach.call(document.querySelectorAll('#mobtabs button'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.panel === id ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.bdr-panel'), function (p) { p.classList.toggle('is-shown', p.id === id); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('#mobtabs button'), function (b) {
    b.addEventListener('click', function () { showPanel(b.dataset.panel, true); });
  });

  function renderBadges() {
    var wb = $('words-badge');
    wb.textContent = unseenWords > 9 ? '9+' : String(unseenWords);
    wb.hidden = !unseenWords;
    var n = seated().length;
    var pb = $('people-badge');
    pb.textContent = String(n);
    pb.hidden = !n;
  }
  function renderTicker(m) {
    var t = $('ticker');
    var who = personById(m.from) || { name: m.name || 'Someone', hue: m.hue || 265, pic: m.pic };
    t.textContent = '';
    t.appendChild(avatar(who));
    var s = el('span', 'bdr-ticker-text');
    s.appendChild(el('b', null, (m.from === backend.id ? 'You' : safeName(who)) + ' '));
    s.appendChild(document.createTextNode(lineText(m)));
    t.appendChild(s);
    t.appendChild(el('span', 'bdr-ticker-go', 'Reply'));
    t.hidden = false;
    t.classList.remove('is-new');
    void t.offsetWidth;
    t.classList.add('is-new');
  }
  $('ticker').addEventListener('click', function () { showPanel('panel-words', true); });

  // ---------- get FOCO: this device's store first, and a QR code on computers ----------
  function deviceKind() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    return 'desktop';
  }
  function setupGetFoco() {
    var kind = deviceKind();
    var ios = $('get-ios');
    var android = $('get-android');
    if (kind === 'android') { android.classList.add('is-best'); android.parentNode.insertBefore(android, ios); }
    if (kind === 'ios') ios.classList.add('is-best');
    if (kind !== 'desktop') { $('qr-wrap').hidden = true; return; }
    function draw() {
      if (!window.qrcode) return false;
      if ($('qr').firstChild) return true;
      var q = window.qrcode(0, 'M');
      q.addData(CFG.getUrl || 'https://www.tryfoco.com/get-foco/');
      q.make();
      $('qr').innerHTML = q.createSvgTag(4, 0);
      return true;
    }
    // Loaded only here, on computers, and never in a way that holds up the room.
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.async = true;
    s.onload = function () { if (!draw()) $('qr-wrap').hidden = true; };
    s.onerror = function () { $('qr-wrap').hidden = true; };
    document.head.appendChild(s);
  }

  // ---------- go ----------
  backend.onPeople(function (list) {
    people = list;
    renderPeople();
    renderChat();
  });
  backend.onViewers(function (n) { watching = n; renderFinding(myPhase()); });
  backend.onDaily(function (n) { dailyDone = n; renderFinding(myPhase()); });
  backend.init().then(function () {
    tick();
    setInterval(tick, 1000);
  }).catch(function () {
    $('finding').textContent = 'Couldn’t reach the room. Refresh to try again.';
  });
  renderSeated();
  renderChat();
  showPanel('panel-seat');
  setupGetFoco();

  if (TV) {
    document.documentElement.classList.add('is-tv');
    // layer=bg records the room without the timer, layer=fg renders only the timer (for looped videos)
    if (params.get('layer')) document.documentElement.classList.add('tv-' + params.get('layer'));
    var stage = document.querySelector('.bdr-scene');
    var badge = el('p', 'bdr-tv-badge');
    badge.innerHTML = '<i></i>Session recording · live room at <b>tryfoco.com/body-doubling</b>';
    document.getElementById('bdr').appendChild(badge);
    var title = el('div', 'bdr-tv-title');
    title.innerHTML = '<span>Body double with me</span><em>ADHD · ' + (params.get('tv') || '1 hour pomodoro 25/5') + '</em>';
    document.getElementById('bdr').appendChild(title);
    var cta = el('section', 'bdr-tv-cta');
    cta.innerHTML = '<p class="bdr-tv-cta-k">Focus with real people</p><h2>Join the live table, free</h2>' +
      '<p class="bdr-tv-cta-sub">Real people, right now. Pick 15 to 90 minutes, no camera, no sign up.</p>' +
      '<div class="bdr-tv-qr" id="tv-qr"></div><p class="bdr-tv-url">tryfoco.com/body-doubling</p><p class="bdr-tv-cta-sub">Link in the description</p>';
    document.querySelector('.bdr-rail-right').prepend(cta);
    var how = el('section', 'bdr-tv-how');
    how.innerHTML = '<h2>How to body double</h2><ol>' +
      '<li><b>Pick one small task.</b> Write it down or say it out loud.</li>' +
      '<li><b>Start when the timer starts.</b> Phone face down.</li>' +
      '<li><b>Stay until the break.</b> Drifted? Come back, no shame.</li>' +
      '<li><b>Want real people?</b> The live room is free, link below.</li></ol>';
    document.querySelector('.bdr-rail-left').appendChild(how);
    var q = document.createElement('script');
    q.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    q.async = true;
    q.onload = function () {
      var code = window.qrcode(0, 'M');
      code.addData('https://www.tryfoco.com/body-doubling/?utm_source=youtube&utm_medium=video&utm_campaign=' + (params.get('utm') || 'bd_with_me_1h'));
      code.make();
      $('tv-qr').innerHTML = code.createSvgTag(5, 0);
    };
    document.head.appendChild(q);
    // the host seat that runs the clock; it starts at 0:00 of the recording
    setTimeout(function () {
      var now = backend.now();
      me = { name: 'You', task: 'Your one small task', hue: 265, pic: -1, sound: 0, sessions: 0, status: 'focus', len: Number(params.get('len')) || 25, blockStart: params.get('phase') === 'break' ? now - (Number(params.get('len')) || 25) * 60000 : now, seatedAt: now };
      window.__tvStart = now;
      backend.join(me).then(function () { renderSeated(); renderPeople(); tick(); });
    }, Number(params.get('hold')) || 50);
  }

  // Preview hooks for the design checks (demo only).
  if (DEMO && params.has('seated')) {
    $('f-name').value = $('f-name').value || 'Adi';
    $('f-task').value = $('f-task').value || 'Write the launch email';
    setTimeout(function () { $('seat-form').requestSubmit(); }, 50);
    if (params.has('recap')) setTimeout(function () { showRecap(25, myPhase()); }, 400);
    if (params.has('share')) setTimeout(function () { openShare(params.get('share') === 'done' ? 'done' : 'invite'); }, 600);
    if (params.has('fly')) setTimeout(function () { fly('demo2', EMOJI[0]); fly('demo4', EMOJI[1]); bubble('demo0', LINES[2].items[0]); }, 600);
  }
})();
