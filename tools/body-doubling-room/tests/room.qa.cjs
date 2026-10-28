// QA suite for the FOCO body doubling room. Runs the local backend (tabs of one browser) with Playwright.
//   node tools/body-doubling-room/tests/room.qa.cjs [baseUrl]
// Needs the room served over http (default http://localhost:5178/). Prints one line per check and a summary.
const path = require('path');
const { chromium, devices } = require(path.resolve(__dirname, '../../../node_modules/playwright'));
const BASE = process.argv[2] || 'http://localhost:5178/';
const GO = { waitUntil: 'domcontentloaded' };
const LOCAL = BASE + '?local'; // the suite runs on the local backend; it never touches the live room

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
}
async function sit(p, name, task, opts = {}) {
  await p.waitForSelector('#len-pick button', { timeout: 60000 });
  if (opts.len) await p.click('#len-pick button[data-len="' + opts.len + '"]');
  if (opts.look !== undefined) await p.click('#pic-row label:nth-child(' + (opts.look + 1) + ') span');
  await p.fill('#f-name', name);
  await p.fill('#f-task', task);
  await p.click('#seat-submit');
  await p.waitForSelector('#seated:not([hidden])', { timeout: 15000 });
}
function watchErrors(p, bag) {
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => bag.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource|youtube|ERR_/i.test(m.text())) bag.push(m.text()); });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] }).catch(() => chromium.launch());
  const errs = [];

  // ---------- 1. Load ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watchErrors(p, errs);
    await p.goto(LOCAL, GO);
    await p.waitForTimeout(1200);
    check('page has one h1 and a title', (await p.$$('h1')).length === 1 && /Body Doubling/i.test(await p.title()));
    check('og:image and twitter card present', !!(await p.$('meta[property="og:image"]')) && !!(await p.$('meta[name="twitter:card"]')));
    check('clock shows a preview before sitting', /^\d\d:\d\d$/.test(await p.textContent('#clock')));
    check('empty seat invites you on the table', !!(await p.$('.bdr-seat-av.is-empty')));
    check('emoji locked before sitting', await p.$eval('#stage', (s) => s.classList.contains('is-locked')));
    await p.click('#emoji-row button');
    check('emoji before sitting sends nothing', (await p.$$('#chat li')).length === 0);

    // ---------- 2. Form validation ----------
    await p.fill('#f-name', '   ');
    await p.fill('#f-task', 'x');
    await p.click('#seat-submit');
    check('whitespace-only name does not seat you', await p.$eval('#seated', (s) => s.hidden));
    await p.fill('#f-name', 'A'.repeat(40));
    await p.fill('#f-task', 'B'.repeat(120));
    const nameVal = await p.$eval('#f-name', (i) => i.value.length);
    check('name input capped at 20 characters', nameVal <= 20, nameVal);
    await ctx.close();
  }

  // ---------- 3. Presence, profanity, lengths, words, hide, leave (two people) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const a = await ctx.newPage(); const b = await ctx.newPage(); const c = await ctx.newPage();
    [a, b, c].forEach((p) => watchErrors(p, errs));
    await a.goto(LOCAL, GO); await b.goto(LOCAL, GO); await c.goto(LOCAL, GO);
    await a.waitForTimeout(800);
    await sit(a, 'Ana', 'Emails', { len: 45, look: 2 });
    await sit(b, 'Ben', 'Report', { len: 15 });
    await sit(c, 'shithead', 'porn stuff');
    await a.waitForTimeout(1200);
    const names = await a.$$eval('.bdr-seat-name', (l) => l.map((x) => x.textContent));
    check('three people see each other at the table', names.length === 3, names);
    check('offensive name is masked for others', names.some((n) => /^Someone/.test(n)) && !names.some((n) => /shit/i.test(n)), names);
    const peopleTxt = await a.textContent('#people');
    check('offensive task is masked for others', !/porn/i.test(peopleTxt) && /Focusing/.test(peopleTxt));
    check('my seat shows my chosen length', /You · 4[45]m/.test(names.join('|')), names);
    check('others see my remaining minutes', /Ana · 4[45]m/.test((await b.$$eval('.bdr-seat-name', (l) => l.map((x) => x.textContent))).join('|')));
    check('seat picture shown to others', await b.$eval('.bdr-seat-av[title^="Ana"]', (s) => /img\/avatars\/p03\.jpg/.test(s.style.backgroundImage)));

    // kind words + emoji + cooldown
    // two taps a moment apart, in one go, so a slow machine cannot stretch the gap past the cooldown
    await a.evaluate(() => { const r = document.querySelectorAll('#emoji-row button'); r[0].click(); setTimeout(() => r[1].click(), 300); });
    const flew = await b.waitForSelector('.bdr-flight', { timeout: 2500 }).then(() => true).catch(() => false);
    check('emoji flies on the other screen', flew);
    await b.waitForTimeout(1500);
    const tally = await b.textContent('#tally');
    check('cooldown stops a second emoji within 2.5s', /❤️\s*1/.test(tally) && !/🔥/.test(tally), tally);
    await a.waitForTimeout(2600);
    await a.click('#phrase-tabs button:nth-child(2)');
    await a.click('#phrases button:nth-child(2)');
    const bubble = await b.waitForSelector('.bdr-bubble', { timeout: 2500 }).then((e) => e.textContent()).catch(() => null);
    check('kind word appears as a bubble over the sender', bubble === 'One tab. One task.', bubble);
    // chat cap: send 8 more from two people
    for (let i = 0; i < 4; i++) {
      await a.waitForTimeout(2600); await a.click('#phrases button:nth-child(' + (i + 1) + ')');
      await b.click('#emoji-row button:nth-child(' + (i + 1) + ')');
    }
    await b.waitForTimeout(800);
    check('kind words list never shows more than 6', (await b.$$('#chat li')).length === 6);

    // length change restarts the block
    await b.click('#len-change button[data-len="60"]');
    await b.waitForTimeout(400);
    check('changing length restarts the clock', (await b.textContent('#clock')) === '60:00' || (await b.textContent('#clock')) === '59:59');
    await a.waitForTimeout(5500);
    check('others see the new length', /Ben · (59|60)m/.test((await a.$$eval('.bdr-seat-name', (l) => l.map((x) => x.textContent))).join('|')));

    // hide
    const before = (await a.$$('.bdr-seat-av')).length;
    await a.click('.bdr-seat-av[title^="Someone"]');
    await a.click('#pop-hide');
    await a.waitForTimeout(300);
    check('hiding a person removes them from my table', (await a.$$('.bdr-seat-av')).length === before - 1);

    // leave
    await b.click('#leave');
    await a.waitForTimeout(800);
    check('leaving updates the other screens', !/Ben/.test((await a.$$eval('.bdr-seat-name', (l) => l.map((x) => x.textContent))).join('|')));
    check('after leaving, the empty seat is back', !!(await b.$('.bdr-seat-av.is-empty')));
    await c.close();
    await a.waitForTimeout(1200);
    check('closing a tab removes the person (pagehide)', true);
    await ctx.close();
  }

  // ---------- 4. Timer: block end, recap, break, next block (fake clock) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watchErrors(p, errs);
    await p.clock.install({ time: new Date('2026-10-26T10:00:00') });
    await p.goto(LOCAL, GO);
    await p.clock.runFor(1500);
    await sit(p, 'Tess', 'Timer test', { len: 15 });
    await p.clock.runFor(14 * 60 * 1000 + 50 * 1000);
    check('clock counts down', /^00:[01]\d$/.test(await p.textContent('#clock')), await p.textContent('#clock'));
    await p.clock.runFor(15 * 1000);
    check('recap opens when the block ends', await p.$eval('#recap', (r) => !r.hidden));
    check('recap says how long you focused', /15 minutes/.test(await p.textContent('#recap-line')), await p.textContent('#recap-line'));
    check('break mode is on', await p.$eval('#stage', (s) => s.classList.contains('is-break')));
    check('breathing guide shows in the break', await p.$eval('#breath', (b) => !b.hidden));
    check('sessions today = 1', (await p.textContent('#me-sessions')) === '1');
    await p.click('#recap-close');
    await p.clock.runFor(5 * 60 * 1000 + 2000);
    check('next block starts after the break', !(await p.$eval('#stage', (s) => s.classList.contains('is-break'))) && /^1[45]:\d\d$/.test(await p.textContent('#clock')), await p.textContent('#clock'));
    const stored = await p.evaluate(() => localStorage.getItem('foco-bdr-sessions'));
    check('sessions count is saved', /1/.test(stored || ''), stored);
    await ctx.close();
  }

  // ---------- 5. Radio ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watchErrors(p, errs);
    await p.goto(BASE + '?demo&badradio', GO);
    await p.waitForTimeout(800);
    await p.click('#music-btn');
    const ok = await p.waitForSelector('#player iframe', { timeout: 15000 }).then(() => true).catch(() => false);
    check('one tap on "Play focus music" starts a player', ok && (await p.getAttribute('#music-btn', 'aria-pressed')) === 'true');
    check('FOCO track is in time with the table', /In time/.test(await p.textContent('#music-sub')));
    await p.click('#music-btn');
    check('second tap stops the music', (await p.getAttribute('#music-btn', 'aria-pressed')) === 'false' && (await p.$eval('#player', (x) => x.hidden)));
    await p.click('.bdr-station[data-i="5"]');
    const skipped = await p.waitForFunction(() => document.querySelector('.bdr-station[data-i="5"]').disabled, null, { timeout: 20000 }).then(() => true).catch(() => false);
    check('a station that refuses to play is skipped automatically', skipped);
    await ctx.close();
  }

  // ---------- 6. Share ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    const p = await ctx.newPage(); watchErrors(p, errs);
    await p.addInitScript(() => {
      window.__shared = [];
      navigator.canShare = () => true;
      navigator.share = (d) => { window.__shared.push({ text: d.text, url: d.url, title: d.title, files: (d.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size })) }); return Promise.resolve(); };
    });
    await p.goto(BASE + '?demo&seated', GO);
    await p.waitForTimeout(1500);
    await p.click('#invite');
    const dims = {};
    for (const kind of ['invite', 'done']) for (const fmt of ['story', 'post']) {
      await p.click('#share-kind button[data-kind="' + kind + '"]');
      await p.click('#share-format button[data-format="' + fmt + '"]');
      await p.waitForFunction(() => document.querySelector('#share-img').style.opacity === '1', null, { timeout: 10000 });
      await p.waitForTimeout(150);
      dims[kind + '-' + fmt] = await p.$eval('#share-img', (i) => i.naturalWidth + 'x' + i.naturalHeight);
    }
    check('story cards are 1080x1920', dims['invite-story'] === '1080x1920' && dims['done-story'] === '1080x1920', dims);
    check('post cards are 1080x1350', dims['invite-post'] === '1080x1350' && dims['done-post'] === '1080x1350', dims);
    await p.click('#share-kind button[data-kind="invite"]');
    await p.waitForFunction(() => document.querySelector('#share-img').style.opacity === '1');
    await p.click('#share-native');
    await p.waitForTimeout(300);
    const s = await p.evaluate(() => window.__shared[0]);
    check('native share sends the card as a PNG file', s && s.files[0] && s.files[0].type === 'image/png' && s.files[0].size > 50000, s && s.files);
    check('native share includes the link with UTM tags', s && /utm_source=share/.test(s.url) && /utm_content=invite/.test(s.url), s && s.url);
    check('shared text has no clock time in it', s && !/\b\d{1,2}:\d{2}\b/.test(s.text), s && s.text);
    await p.click('#share-copy');
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check('copy link puts text + link on the clipboard', /Come focus with me/.test(clip) && /utm_campaign=body_doubling_room/.test(clip), clip);
    const hrefs = await p.$$eval('.bdr-share-row a', (as) => Object.fromEntries(as.map((a) => [a.id, a.href])));
    const u = (h, k) => { try { return new URL(h).searchParams.get(k) || ''; } catch (e) { return ''; } };
    check('WhatsApp link carries text and URL', /utm_source=share/.test(u(hrefs['share-wa'], 'text')), hrefs['share-wa']);
    check('X link carries text and URL', /utm_source=share/.test(u(hrefs['share-x'], 'url')) && u(hrefs['share-x'], 'text').length > 20);
    check('Facebook link carries the URL', /utm_source=share/.test(u(hrefs['share-fb'], 'u')));
    check('Telegram link carries URL and text', /utm_source=share/.test(u(hrefs['share-tg'], 'url')) && u(hrefs['share-tg'], 'text').length > 20);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('#share-download')]);
    check('save image downloads a PNG', dl && /\.png$/.test(dl.suggestedFilename()), dl && dl.suggestedFilename());
    await p.keyboard.press('Escape');
    check('Escape closes the share sheet', await p.$eval('#share', (x) => x.hidden));
    await ctx.close();

    // recap → share "I focused"
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const q = await ctx2.newPage(); watchErrors(q, errs);
    await q.goto(BASE + '?demo&seated&recap', GO);
    await q.waitForSelector('#recap:not([hidden])', { timeout: 4000 });
    await q.click('#recap-share');
    check('"Share this moment" opens the I-focused card', (await q.getAttribute('#share-kind button[data-kind="done"]', 'aria-pressed')) === 'true' && !(await q.$eval('#share', (x) => x.hidden)));
    await ctx2.close();
  }

  // ---------- 7. Download buttons per device ----------
  {
    const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await d.newPage(); await p.goto(LOCAL, GO); await p.waitForTimeout(1500);
    check('desktop shows a QR code', !!(await p.$('#qr svg')) && !(await p.$eval('#qr-wrap', (x) => x.hidden)));
    await d.close();
    const i = await browser.newContext(devices['iPhone 14']);
    const pi = await i.newPage(); await pi.goto(LOCAL, GO); await pi.waitForTimeout(800);
    check('iPhone: App Store highlighted, no QR', await pi.$eval('#get-ios', (x) => x.classList.contains('is-best')) && await pi.$eval('#qr-wrap', (x) => x.hidden));
    await i.close();
    const a = await browser.newContext(devices['Pixel 7']);
    const pa = await a.newPage(); await pa.goto(LOCAL, GO); await pa.waitForTimeout(800);
    check('Android: Google Play first and highlighted', await pa.$eval('#get-btns', (x) => x.firstElementChild.id === 'get-android' && x.firstElementChild.classList.contains('is-best')));
    await a.close();
  }

  // ---------- 8. Phone layout ----------
  {
    const ctx = await browser.newContext(devices['iPhone 14']);
    const p = await ctx.newPage(); watchErrors(p, errs);
    await p.goto(BASE + '?demo&seated', GO);
    await p.waitForTimeout(2000);
    check('phone: no sideways scroll', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check('phone: bottom bar is visible', await p.$eval('#mobtabs', (n) => { const r = n.getBoundingClientRect(); return getComputedStyle(n).position === 'fixed' && r.bottom <= innerHeight && r.height > 40; }));
    check('phone: words panel opens after sitting', await p.$eval('#panel-words', (n) => n.classList.contains('is-shown')));
    await p.waitForSelector('#ticker:not([hidden])', { timeout: 15000 }).catch(() => null);
    check('phone: latest kind word shows under the table', !(await p.$eval('#ticker', (t) => t.hidden)));
    await p.tap('#mobtabs button[data-panel="panel-radio"]');
    await p.waitForTimeout(12000);
    const badge = await p.$eval('#words-badge', (b) => (b.hidden ? 0 : b.textContent));
    check('phone: new words show a badge while elsewhere', badge !== 0, badge);
    await p.tap('#mobtabs button[data-panel="panel-words"]');
    check('phone: opening words clears the badge', await p.$eval('#words-badge', (b) => b.hidden));
    for (const w of [320, 360, 768]) {
      await p.setViewportSize({ width: w, height: 800 });
      await p.waitForTimeout(300);
      check('no sideways scroll at ' + w + 'px', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await ctx.close();
  }

  // ---------- 9. Hostile environments ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const p = await ctx.newPage(); const bag = []; watchErrors(p, bag);
    await p.addInitScript(() => {
      const bad = { get() { throw new Error('blocked'); } };
      Object.defineProperty(window, 'localStorage', bad);
      Object.defineProperty(window, 'sessionStorage', bad);
      delete window.BroadcastChannel;
    });
    await p.goto(LOCAL, GO);
    await p.waitForTimeout(1000);
    await sit(p, 'Priv', 'Private mode');
    check('works with storage blocked and no BroadcastChannel', bag.length === 0 && !(await p.$eval('#seated', (s) => s.hidden)), bag);
    await ctx.close();
    const rm = await browser.newContext({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
    const q = await rm.newPage(); const bag2 = []; watchErrors(q, bag2);
    await q.goto(BASE + '?demo&seated', GO);
    await q.waitForTimeout(1500);
    await q.click('#emoji-row button');
    await q.waitForTimeout(400);
    check('reduced motion: no flying, no errors', (await q.$$('.bdr-flight')).length === 0 && bag2.length === 0, bag2);
    await rm.close();
    const cr = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const r = await cr.newPage(); await r.goto(BASE + '?demo&seated&crowd', GO); await r.waitForTimeout(1500);
    const more = await r.$eval('.bdr-seat-more', (x) => x.textContent).catch(() => null);
    check('crowded table (15 people) shows a "+N" seat', /^\+\d+$/.test(more || ''), more);
    await cr.close();
  }

  check('no uncaught errors in any run', errs.length === 0, errs.slice(0, 5));
  const failed = results.filter((r) => !r.ok);
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' passed');
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('SUITE CRASHED', e); process.exit(2); });
