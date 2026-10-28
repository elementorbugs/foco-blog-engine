// Live check against the real Firebase room: two separate browsers, presence, words, emoji, leave,
// and the security rules refusing bad writes. Uses roomId "qa" so it never touches the real room.
//   node tools/body-doubling-room/tests/room.live.cjs [baseUrl]
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../node_modules/playwright'));
const BASE = (process.argv[2] || 'http://localhost:5178/');
const results = [];
function check(name, ok, detail) { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : '  -> ' + JSON.stringify(detail))); }
async function open(browser, errs) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { Object.defineProperty(window, '__roomOverride', { value: 'qa' }); });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errs.push(e.message));
  // point the page at the qa room before room.js runs
  await p.route('**/config.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()) + "\nwindow.FOCO_ROOM_CONFIG.roomId = 'qa';\n";
    route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
  });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  return p;
}
async function sit(p, name, task) {
  await p.waitForSelector('#len-pick button');
  await p.fill('#f-name', name); await p.fill('#f-task', task); await p.click('#seat-submit');
  await p.waitForSelector('#seated:not([hidden])', { timeout: 30000 });
}
(async () => {
  const errs = [];
  const b1 = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const b2 = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const a = await open(b1, errs);
  const b = await open(b2, errs);
  await a.waitForFunction(() => !/Connecting/.test(document.querySelector('#finding').textContent), null, { timeout: 30000 });
  check('connects to the live room', !/Couldn/.test(await a.textContent('#finding')), await a.textContent('#finding'));
  await sit(a, 'QA Ana', 'Live test A');
  await sit(b, 'QA Ben', 'Live test B');
  const seen = await a.waitForFunction(() => /QA Ben/.test([...document.querySelectorAll('.bdr-seat-name')].map((x) => x.textContent).join('|')), null, { timeout: 20000 }).then(() => true).catch(() => false);
  check('two separate browsers see each other through Firebase', seen);
  await a.click('#emoji-row button');
  const flew = await b.waitForSelector('.bdr-flight', { timeout: 15000 }).then(() => true).catch(() => false);
  check('emoji travels between browsers', flew);
  await a.waitForTimeout(2700);
  await a.click('#phrases button');
  const bub = await b.waitForSelector('.bdr-bubble', { timeout: 15000 }).then((e) => e.textContent()).catch(() => null);
  check('kind word travels between browsers', !!bub, bub);
  // the rules: try writes the app never makes
  const rules = await a.evaluate(async () => {
    const d = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const db = d.getDatabase(appMod.getApp());
    const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const uid = authMod.getAuth(appMod.getApp()).currentUser.uid;
    const tryIt = (p) => p.then(() => 'ALLOWED', (e) => 'DENIED');
    return {
      freeText: await tryIt(d.push(d.ref(db, 'rooms/qa/chat'), { from: uid, name: 'QA Ana', hue: 1, pic: 0, kind: 'line', cat: 0, value: 0, at: d.serverTimestamp(), text: 'free text!' })),
      badIndex: await tryIt(d.push(d.ref(db, 'rooms/qa/chat'), { from: uid, name: 'QA Ana', hue: 1, pic: 0, kind: 'emoji', cat: 0, value: 99, at: d.serverTimestamp() })),
      fakeName: await tryIt(d.push(d.ref(db, 'rooms/qa/chat'), { from: uid, name: 'Someone Else', hue: 1, pic: 0, kind: 'emoji', cat: 0, value: 0, at: d.serverTimestamp() })),
      otherSeat: await tryIt(d.set(d.ref(db, 'rooms/qa/people/someone-else'), { name: 'x', task: 'y', hue: 1, status: 'focus', joinedAt: 1 })),
      longName: await tryIt(d.update(d.ref(db, 'rooms/qa/people/' + uid), { name: 'x'.repeat(40) })),
      readRoot: await tryIt(d.get(d.ref(db, '/'))),
      goodEmoji: await tryIt(d.push(d.ref(db, 'rooms/qa/chat'), { from: uid, name: 'QA Ana', hue: 1, pic: 0, kind: 'emoji', cat: 0, value: 1, at: d.serverTimestamp() })),
    };
  }).catch((e) => ({ error: e.message }));
  check('rules refuse free text in chat', rules.freeText === 'DENIED', rules);
  check('rules refuse an emoji outside the list', rules.badIndex === 'DENIED');
  check('rules refuse sending under someone else\u2019s name', rules.fakeName === 'DENIED');
  check('rules refuse writing someone else\u2019s seat', rules.otherSeat === 'DENIED');
  check('rules refuse a 40-character name', rules.longName === 'DENIED');
  check('rules refuse reading the whole database', rules.readRoot === 'DENIED');
  check('rules allow a normal emoji', rules.goodEmoji === 'ALLOWED');
  // leaving and closing
  await b.click('#leave');
  const gone = await a.waitForFunction(() => !/QA Ben/.test([...document.querySelectorAll('.bdr-seat-name')].map((x) => x.textContent).join('|')), null, { timeout: 15000 }).then(() => true).catch(() => false);
  check('leaving removes you for everyone', gone);
  await sit(b, 'QA Ben', 'Back again');
  await a.waitForTimeout(2000);
  await b2.close();
  const dropped = await a.waitForFunction(() => !/QA Ben/.test([...document.querySelectorAll('.bdr-seat-name')].map((x) => x.textContent).join('|')), null, { timeout: 90000 }).then(() => true).catch(() => false);
  check('closing the browser removes the person (onDisconnect)', dropped);
  await a.click('#leave');
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await b1.close();
  console.log('\n' + results.filter(Boolean).length + '/' + results.length + ' passed');
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('LIVE SUITE CRASHED', e); process.exit(2); });
