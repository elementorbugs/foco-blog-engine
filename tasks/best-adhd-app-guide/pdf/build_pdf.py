import json, html, os, base64, sys
D = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(D)
sys.path.insert(0, os.path.join(S, 'guide'))
reviews = {r['name']: r for r in json.load(open(os.path.join(S, 'reviews.json')))}
src = open(os.path.join(S, 'guide', 'build.py')).read()
ns = {}; i0 = src.index('SHORT = {'); exec(src[i0:src.index('\n}\n', i0) + 3], ns)
SHORT = ns['SHORT']
BEST = {'Lofi Town': 'A cozy multiplayer study room in your browser'}
e = lambda s: html.escape(s, quote=True)

def utm(url, content):
    sep = '&' if '?' in url else '?'
    return f'{url}{sep}utm_source=pdf&utm_medium=referral&utm_campaign=adhd-app-list&utm_content={content}'
SITE = 'https://www.tryfoco.com'
GET = lambda c: utm(f'{SITE}/get-foco/', c)
APPSTORE = 'https://apps.apple.com/app/id6762489184'
PLAY = 'https://play.google.com/store/apps/details?id=com.adiben.foco'
LIVE = utm(f'{SITE}/best-adhd-app/', 'live-version')
rv = lambda name: utm(f'{SITE}/{reviews[name]["slug"]}/', 'review')
b64 = lambda p, mime: f'data:{mime};base64,' + base64.b64encode(open(os.path.join(D, p), 'rb').read()).decode()
ICON = b64('icon-foco-sm.png', 'image/png'); SHOT = b64('foco-screens-sm.jpg', 'image/jpeg'); QR = b64('qr.svg', 'image/svg+xml')

# need, text, [(link label, url)], ours
PICKS = [
 ("I know what to do and can't start", "FOCO, the app we make, breaks the task into small timed steps and keeps one step on screen.", [("Get FOCO", GET('flow-foco'))], True),
 ("Breaking the task down is enough", "Goblin Tools splits a task into steps, free on the web.", [("FOCO vs Goblin Tools", utm(f'{SITE}/foco-vs-goblin-tools/', 'flow'))], False),
 ("I lose track of my day", "Tiimo shows a visual timeline; Structured lays out time blocks.", [("Tiimo", rv('Tiimo')), ("Structured", rv('Structured'))], False),
 ("My head is too full to plan", "Ellie turns a brain dump into a day; Recordo works by voice.", [("Ellie", rv('Ellie')), ("Recordo", rv('Recordo'))], False),
 ("My phone keeps pulling me away", "Opal blocks apps on a schedule; ScreenZen is free; Brick is a physical lock.", [("Opal", rv('Opal')), ("ScreenZen", rv('ScreenZen')), ("Brick", rv('Brick'))], False),
 ("My computer is the problem", "Cold Turkey Blocker blocks websites on Windows and Mac.", [("Cold Turkey", rv('Cold Turkey Blocker'))], False),
 ("I work better with someone there", "Focusmate pairs you with one person by video; Flow Club runs groups.", [("Focusmate", rv('Focusmate')), ("Flow Club", rv('Flow Club'))], False),
 ("I need a timer, not a system", "Pomofocus is a free browser timer; Llama Life times every task.", [("Pomofocus", rv('Pomofocus')), ("Llama Life", rv('Llama Life'))], False),
 ("My routines fall apart", "Routinery runs a routine one timed step at a time.", [("Routinery", rv('Routinery'))], False),
 ("Streaks make me quit", "Finch has no penalty for missed days; Habitica turns habits into a game.", [("Finch", rv('Finch')), ("Habitica", rv('Habitica'))], False),
 ("Silence makes focus harder", "Endel has a free edition; Brain.fm is paid only.", [("Endel", rv('Endel')), ("Brain.fm", rv('Brain.fm'))], False),
 ("My work calendar runs my day", "Reclaim AI protects focus time; Sunsama guides a daily plan.", [("Reclaim AI", rv('Reclaim AI')), ("Sunsama", rv('Sunsama'))], False),
 ("I want to learn coping skills", "Inflow is a CBT-based program.", [("Inflow", rv('Inflow'))], False),
 ("I run a household", "RemindHer is a shared family calendar you can talk to.", [("Family calendar apps", utm(f'{SITE}/family-calendar-apps-for-adhd-moms/', 'flow'))], False),
 ("My child has ADHD", "Joon turns a child's routines into a game.", [("Joon", rv('Joon'))], False),
 ("I want a to-do list with no subscription", "Things 3 is a one-time purchase, Apple devices only.", [("Things 3", rv('Things 3'))], False),
]

def band(n, total):
    return (f'<div class="band"><img src="{ICON}" alt=""/><div class="bt"><b>Can\'t start?</b> FOCO breaks the task into tiny timed steps.</div>'
            f'<a class="bbtn" href="{GET("footer-p%d" % n)}">Get FOCO</a><span class="pn">{n} / {total}</span></div>')
def head():
    return f'<div class="head"><span>ADHD Apps List · November 2026</span><a href="{LIVE}">Latest version: tryfoco.com/best-adhd-app</a></div>'

rows = [('FOCO', GET('table-foco'), '$59/year with a 7-day free trial, or $9/month', 'Starting the task you keep putting off (the app we make)', 'iPhone, Android', ICON, True)]
for n in sorted(reviews, key=str.lower):
    r = reviews[n]; p, pl = SHORT[n]
    rows.append((n, rv(n), p, r.get('Best for') or BEST[n], pl, b64('icons/' + r['slug'] + '.png', 'image/png'), False))
PER = 14
chunks = [rows[i:i + PER] for i in range(0, len(rows), PER)]
TOTAL = 3 + len(chunks)

pages = []
# Page 1: cover + 60 seconds
pages.append(f'''<section class="page">{head()}<div class="body">
<div class="kicker">Free guide · Updated November 2026</div>
<h1>ADHD Apps List</h1>
<p class="sub">40 apps we reviewed, matched to the part of your day they help with.</p>
<p class="intro">There is no single best ADHD app. Find the line that sounds like you on page 2, then use the table to compare price and platforms. Every app name links to our full review.</p>
<ul class="inside"><li><b>Page 2:</b> Which app fits you?</li><li><b>Pages 3 to {2 + len(chunks)}:</b> All 40 apps compared</li><li><b>Page {TOTAL}:</b> FOCO, the app we make</li></ul>
<div class="stuck"><div class="sk">Stuck right now? Try this in 60 seconds</div>
<ol><li>Write the task down in a few words.</li><li>Shrink it to a first step you could do in 2 minutes, like "open the document".</li><li>Set a timer for 2 minutes and do only that step.</li></ol>
<p class="skf">FOCO does steps 2 and 3 for you: it splits the task into timed steps and starts the timer. <a href="{GET('cover-60s')}">Get FOCO</a></p></div>
<p class="disc">How we made this list: we read each app's store listings, its own site and independent sources, and wrote a full review. We did not test the apps hands-on. We make FOCO, so weigh its pick with that in mind. Prices change; each review shows the date we checked.</p>
</div>{band(1, TOTAL)}</section>''')

# Page 2: which app fits you
items = []
for need, text, links, ours in PICKS:
    ls = ' '.join(f'<a class="{"go" if ours else "lk"}" href="{e(u)}">{e(l)} →</a>' for l, u in links)
    items.append(f'<div class="pick{" ours" if ours else ""}"><div class="need">{e(need)}</div><div class="ptxt">{e(text)}</div><div class="plinks">{ls}</div></div>')
pages.append(f'<section class="page">{head()}<div class="body"><h2>Which app fits you?</h2><p class="lead">Find the line that sounds most like you. Tap a name to read its review.</p><div class="picks">{"".join(items)}</div></div>{band(2, TOTAL)}</section>')

# Table pages
for i, ch in enumerate(chunks):
    trs = ''.join(f'<tr class="{"ours" if o else ""}"><td class="app"><img src="{e(ic)}" alt=""/><div><a href="{e(u)}">{e(n)}</a><small>{e(p)}</small></div></td><td>{e(b)}</td><td>{e(pl)}</td></tr>' for n, u, p, b, pl, ic, o in ch)
    title = '<h2>All 40 apps compared</h2><p class="lead">Prices come from each review\'s at-a-glance table. Tap a name for the full review and the date we checked.</p>' if i == 0 else '<h2 class="cont">All 40 apps compared, continued</h2>'
    pages.append(f'<section class="page">{head()}<div class="body">{title}<table><thead><tr><th>App and price</th><th>Best for</th><th>Platforms</th></tr></thead><tbody>{trs}</tbody></table></div>{band(3 + i, TOTAL)}</section>')

# Last page: FOCO
pages.append(f'''<section class="page">{head()}<div class="body">
<div class="kicker">The app we make</div><h2 class="big">FOCO: for the moment you can't start</h2>
<img class="shot" src="{SHOT}" alt="FOCO app screens: a day calendar, a task split into timed steps, and focus mode soundscapes"/>
<ul class="feat"><li><b>Say, type or snap it.</b> Add a task by voice, text or a photo of a handwritten list, and it lands in your calendar.</li>
<li><b>AI splits it into timed steps.</b> Each step gets a time estimate, so the first one feels small enough to start.</li>
<li><b>Focus with company.</b> A focus timer with calm music and an AI companion on screen.</li></ul>
<div class="cta"><div class="ctl"><div class="price">$59/year with a 7-day free trial, or $9/month</div><div class="plat">iPhone and Android</div>
<a class="store" href="{utm(APPSTORE, 'last-appstore')}">Download on the App Store</a> <a class="store" href="{utm(PLAY, 'last-play')}">Get it on Google Play</a></div>
<div class="qr"><img src="{QR}" alt="QR code to download FOCO"/><span>Reading on a computer?<br/>Scan to get FOCO on your phone</span></div></div>
</div>{band(TOTAL, TOTAL)}</section>''')

CSS = '''@page{size:Letter;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;color:#2A2340;-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:#6D28D9;text-decoration:none}.page{width:8.5in;height:11in;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.head{display:flex;justify-content:space-between;align-items:center;padding:0.32in 0.6in 0;font-size:10px;color:#625A78;letter-spacing:.02em}.head a{font-weight:600}
.body{padding:0.3in 0.6in 0}
.band{position:absolute;left:0;right:0;bottom:0;height:0.78in;background:linear-gradient(135deg,#1a0a2e,#4C1D95);display:flex;align-items:center;gap:14px;padding:0 0.6in;color:#fff}
.band img{width:34px;height:34px;border-radius:9px}.band .bt{font-size:12.5px;flex:1}.band .bt b{font-weight:800}
.bbtn{background:#fff;color:#4C1D95!important;font-weight:800;font-size:12.5px;padding:9px 16px;border-radius:999px}.pn{font-size:10px;color:#C4B5FD;margin-left:6px}
.kicker{display:inline-block;background:#F3EEFF;color:#6D28D9;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-top:0.35in}
h1{font-size:54px;line-height:1.02;margin:16px 0 10px;letter-spacing:-.02em;color:#160F22}.sub{font-size:19px;color:#4C1D95;font-weight:600;margin:0 0 18px}
.intro{font-size:14px;line-height:1.6;color:#4B4360;margin:0 0 14px;max-width:6.4in}.inside{margin:0 0 22px;padding-left:18px;font-size:13px;line-height:1.8;color:#4B4360}
.stuck{border:1.5px solid #DDD3F7;background:#FAF7FF;border-radius:18px;padding:18px 22px}.sk{font-weight:800;font-size:16px;color:#160F22;margin-bottom:8px}
.stuck ol{margin:0 0 10px;padding-left:20px;font-size:13.5px;line-height:1.75}.skf{margin:0;font-size:13px;color:#4B4360}.skf a{font-weight:700}
.disc{font-size:10.5px;line-height:1.55;color:#7d738f;margin-top:20px}
h2{font-size:28px;margin:0.12in 0 6px;color:#160F22;letter-spacing:-.01em}h2.cont{font-size:18px;margin-bottom:12px}h2.big{font-size:32px;margin:10px 0 14px}.lead{font-size:12.5px;color:#625A78;margin:0 0 14px}
.picks{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pick{border:1px solid #ECE6F7;border-radius:12px;padding:9px 12px;background:#fff}
.pick.ours{grid-column:1/-1;background:#F6F2FD;border-color:#C4B5FD}.need{font-weight:800;font-size:12.5px;color:#160F22;margin-bottom:2px}.ptxt{font-size:11px;line-height:1.45;color:#4B4360}
.plinks{margin-top:5px;font-size:11px}.plinks .lk{font-weight:700;margin-right:10px}.go{display:inline-block;background:#6D28D9;color:#fff!important;font-weight:800;padding:6px 14px;border-radius:999px}
table{width:100%;border-collapse:collapse;font-size:10.5px;border:1px solid #ECE6F7;border-radius:12px;overflow:hidden}th{background:#F6F2FD;text-align:left;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#625A78;padding:8px 10px}
td{padding:7px 10px;border-top:1px solid #F1ECF9;vertical-align:middle;line-height:1.35;color:#4B4360}tr.ours td{background:#F6F2FD}
td.app{display:flex;gap:8px;align-items:center;width:2.6in}td.app img{width:26px;height:26px;border-radius:7px;border:1px solid #eee;flex:none}td.app a{font-weight:800;font-size:12px}td.app small{display:block;color:#625A78;font-size:9.5px}
.shot{width:100%;border-radius:14px;display:block;margin:0 0 14px}.feat{margin:0 0 16px;padding-left:18px;font-size:13px;line-height:1.6}.feat li{margin-bottom:5px}
.cta{display:flex;gap:20px;align-items:center;border:1.5px solid #DDD3F7;border-radius:18px;padding:16px 20px;background:#FAF7FF}.ctl{flex:1}.price{font-weight:800;font-size:16px;color:#160F22}.plat{font-size:12px;color:#625A78;margin:2px 0 10px}
.store{display:inline-block;background:#160F22;color:#fff!important;font-weight:700;font-size:12px;padding:9px 14px;border-radius:10px;margin:0 6px 6px 0}
.qr{text-align:center;font-size:10px;color:#625A78;width:1.5in}.qr img{width:1.15in;height:1.15in;display:block;margin:0 auto 6px}'''
doc = f'<!doctype html><html><head><meta charset="utf-8"><title>ADHD Apps List 2026: 40 Apps Compared by Need</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
open(os.path.join(D, 'adhd-app-list.html'), 'w').write(doc)
print('pages', TOTAL, 'rows', len(rows))
