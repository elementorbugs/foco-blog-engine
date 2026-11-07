#!/usr/bin/env python3
"""Writes posts-new/post-<slug>.html for the ADHD planner kit page (/adhd-planner/).

    python3 tools/adhd-planner-kit/write-post.py [slug]

Media are {{media:...}} placeholders for post-media/adhd-planner/ (copy that folder for a preview slug).
"""
import sys
from urllib.parse import quote

slug = sys.argv[1] if len(sys.argv) > 1 else 'adhd-planner'
PAGE_URL = 'https://www.tryfoco.com/adhd-planner/'
CMP = 'style="background:#7C3AED !important;color:#ffffff !important"'
PIN = 'style="background:#E60023 !important;color:#ffffff !important"'


def ver(key):
    # Bump a file's version whenever it changes: the uploader reuses media with the same name.
    return 'v4'


def pin(key, desc):
    return ('https://www.pinterest.com/pin/create/button/?url=' + quote(PAGE_URL, safe='')
            + '&amp;media={{mediaenc:adhd-planner-kit-pin-' + key + '-' + ver(key) + '.png}}&amp;description=' + quote(desc, safe=''))


CARDS = [
    ('daily', 'daily', 'Daily planner', 'Your Top 3 for today, with the first tiny step written under each one, plus rough morning, afternoon and evening blocks, a brain-dump space and a body-basics check.'),
    ('task-breakdown', 'task-breakdown', 'Task breakdown', 'For the task you keep avoiding: shrink step one until it takes 2 minutes, then list the next steps with a guess in minutes.'),
    ('brain-dump', 'brain-dump', 'Brain dump & sort', 'Write everything down, then sort it into four boxes: do today, schedule it, ask or hand off, and let it go.'),
    ('time-block', 'time-block', 'Time-block day', 'An hour-by-hour plan from 7am to 10pm with a guess and an actual column, so you can see how long things really take.'),
    ('weekly', 'weekly', 'Weekly planner', 'One big thing for the week, three lines a day, a can\'t-miss box, and a ring to fill on any day you showed up.'),
    ('monthly', 'monthly', 'Monthly planner', 'An undated month grid you can use any month, plus dates you can\'t miss, bills and renewals.'),
    ('habit-tracker', 'habit-tracker', 'Habit tracker', 'Five habits and 31 circles each. You count good days instead of keeping a streak, so a missed day costs nothing.'),
]

grid_css = ('<style>.foco-kit-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px;margin:28px 0}.foco-kit-card{margin:0}'
            '.foco-kit-card img{width:100%;max-width:400px;height:auto;display:block;border-radius:12px;margin:0 auto}'
            '.foco-kit-card h3{margin:14px 0 6px !important;font-size:20px !important}.foco-kit-card p{margin:0 0 12px !important;font-size:16px !important;line-height:1.55 !important}'
            '.foco-kit-btns{display:flex;flex-wrap:wrap;gap:8px}.foco-kit-btns a{display:inline-block;font-weight:700;font-size:14px;padding:9px 16px;border-radius:10px;text-decoration:none !important;border:0 !important}'
            '@media(max-width:640px){.foco-kit-grid{grid-template-columns:1fr}}</style>')
cards = ''.join(
    f'<figure class="foco-kit-card"><img src="{{{{media:adhd-planner-kit-{img}-{ver(key)}.webp}}}}" alt="Free ADHD planner printable: {title.lower()} page" width="816" height="1056" loading="lazy"/>'
    f'<h3>{title}</h3><p>{text}</p><div class="foco-kit-btns">'
    f'<a href="{{{{media:foco-adhd-{key}-planner-{ver(key)}.pdf}}}}" target="_blank" rel="noopener" {CMP}>Download PDF</a>'
    f'<a href="{pin(key, title + ": free ADHD planner printable")}" target="_blank" rel="noopener" {PIN}>Pin it</a></div></figure>'
    for key, img, title, text in CARDS)

BTN = 'display:inline-block;font-weight:700;padding:14px 22px;border-radius:12px;text-decoration:none !important;border:0 !important'

html = f'''<h1>ADHD Planner Printable: Free 7-Page Kit (PDF)</h1>
<div class="foco-tldr"><p>A free ADHD planner printable works best when it is undated, fits on one page, and helps you start, not just schedule. FOCO's free 7-page kit has a daily page with a first tiny step, a task breakdown, a brain dump, time blocks, weekly and monthly pages and a habit tracker with no streaks, in US Letter or A4.</p></div>

<div class="foco-key-takeaways">
<h2>Key Takeaways</h2>
<ul>
<li>The kit is free, with no email or signup: seven pages plus a cover, as one PDF or page by page.</li>
<li>Every page is undated, so a skipped day or week leaves nothing to catch up on.</li>
<li>Each page is built around one ADHD sticking point: starting, seeing time, holding too much in your head, or keeping a habit.</li>
<li>It comes in US Letter and A4, in a dark version for tablets and an ink-saver version for printing.</li>
<li>If you want more, we compare paid printable, digital and paper ADHD planners, with prices, further down.</li>
<li>Every page has a QR code to the free FOCO focus room, and the FOCO app breaks any task on your list into tiny steps.</li>
</ul>
</div>

<h2 id="free-kit">What's in the free ADHD planner kit?</h2>

<p>Seven printable pages for brains that plan fine and still can't start. Download the whole kit, or just the page you need below.</p>

<!-- wp:html --><figure class="foco-kit-hero" style="margin:24px 0 8px"><img src="{{{{media:adhd-planner-kit-hero-v4.webp}}}}" alt="Free ADHD planner printable kit: daily, task breakdown, brain dump, weekly and habit tracker pages" width="1600" height="860" style="width:100%;height:auto;border-radius:18px;display:block"/></figure><!-- /wp:html -->

<!-- wp:html --><div class="foco-kit-dl" style="display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 8px"><a href="{{{{media:foco-adhd-planner-kit-ink-saver-letter-v4.pdf}}}}" target="_blank" rel="noopener" style="{BTN};background:#7C3AED !important;color:#ffffff !important">Download the kit to print (PDF)</a><a href="{{{{media:foco-adhd-planner-kit-letter-v4.pdf}}}}" target="_blank" rel="noopener" style="{BTN};background:#160F22 !important;color:#ffffff !important">Tablet version (dark PDF)</a><a href="{pin('kit', 'The ADHD planner kit: 7 free printable pages')}" target="_blank" rel="noopener" style="{BTN};background:#E60023 !important;color:#ffffff !important">Save the kit on Pinterest</a></div><!-- /wp:html -->

<p>Printing on A4? Get the <a href="{{{{media:foco-adhd-planner-kit-ink-saver-a4-v4.pdf}}}}" target="_blank" rel="noopener">A4 kit to print</a> or the <a href="{{{{media:foco-adhd-planner-kit-a4-v4.pdf}}}}" target="_blank" rel="noopener">A4 tablet version</a>.</p>

<p>The print version is white, uses little ink and works in black and white, with 7 mm writing lines. The dark version is for a tablet or a note-taking app like GoodNotes.</p>

<h2 id="pick-a-page">Which planner page should you start with?</h2>

<p>Start with the page that matches what goes wrong most often. One page you use beats seven you don't.</p>

<div class="foco-table-wrap foco-cmp2 multi">
<table>
<thead><tr><th scope="col"><span class="cm-label">If you often...</span></th><th scope="col"><span class="cm-label">Start with</span></th><th scope="col"><span class="cm-label">Why it helps</span></th></tr></thead>
<tbody>
<tr><th scope="row">Know what to do and still can't start</th><td data-label="Start with">Task breakdown</td><td data-label="Why it helps">Step one gets small enough to start in 2 minutes</td></tr>
<tr><th scope="row">Wake up with no idea where to begin</th><td data-label="Start with">Daily planner</td><td data-label="Why it helps">Three things, each with its first step written down</td></tr>
<tr><th scope="row">Feel like your head is too full</th><td data-label="Start with">Brain dump &amp; sort</td><td data-label="Why it helps">Everything lands on paper, then in one of four boxes</td></tr>
<tr><th scope="row">Run late or lose whole afternoons</th><td data-label="Start with">Time-block day</td><td data-label="Why it helps">Guess vs. actual shows where the time went</td></tr>
<tr><th scope="row">Lose track of the week</th><td data-label="Start with">Weekly planner</td><td data-label="Why it helps">One big thing and only three lines a day</td></tr>
<tr><th scope="row">Forget bills and appointments</th><td data-label="Start with">Monthly planner</td><td data-label="Why it helps">Dates you can't miss in one place</td></tr>
<tr><th scope="row">Drop habits after one missed day</th><td data-label="Start with">Habit tracker</td><td data-label="Why it helps">It counts good days, so there's no streak to break</td></tr>
</tbody>
</table>
</div>

<h2 id="pages">What does each page in the kit do?</h2>

<p>Each page solves one kind of stuck. Every page ends with a fill-in line, so you finish your plan with a decision, like when you will start.</p>

<!-- wp:html --><div class="foco-kit-grid">{grid_css}{cards}</div><!-- /wp:html -->

<p>Single-page PDFs are the print version, on white.</p>

<p>Want more layouts for one format? See the <a href="https://www.tryfoco.com/adhd-daily-planner/">ADHD daily planner</a>, the <a href="https://www.tryfoco.com/adhd-weekly-planner/">ADHD weekly planner</a> and the <a href="https://www.tryfoco.com/adhd-habit-tracker-printable/">ADHD habit tracker printable</a>.</p>

<h2 id="paid-planners">What are the best paid ADHD planners?</h2>

<p>If you want more than a free kit, there are three kinds of paid planner: printable PDFs, digital planners for a tablet, and bound paper planners. Start with the free kit above, then pay only if you need more.</p>

<h3 id="printable-planners">Printable ADHD planners</h3>

<p>You download a PDF once and print as many pages as you like.</p>

<!-- wp:html --><div class="foco-pp"><style>.foco-pp{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0 28px}}.foco-pp .pp{{position:relative;background:#fff;border:1px solid #E7DFF7;border-radius:18px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px -18px rgba(76,29,149,.35)}}.foco-pp .pp.foco{{background:linear-gradient(135deg,#160B26,#3B1873);border:0;color:#fff}}.foco-pp .top{{display:flex;gap:12px;align-items:center}}.foco-pp .ic{{width:46px;height:46px;border-radius:14px;background:#F1EAFC;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none}}.foco-pp .foco .ic{{background:rgba(255,255,255,.12)}}.foco-pp .nm{{font-weight:800;font-size:16.5px;line-height:1.25;color:#160F22}}.foco-pp .foco .nm{{color:#fff}}.foco-pp .by{{font-size:13px;color:#6E6684;margin-top:2px}}.foco-pp .foco .by{{color:#C9B8FF}}.foco-pp .pr{{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}}.foco-pp .pr b{{font-size:24px;font-weight:800;color:#160F22;letter-spacing:-.02em}}.foco-pp .foco .pr b{{color:#fff}}.foco-pp .pr span{{font-size:13px;color:#6E6684}}.foco-pp .pr s{{font-size:14px;color:#9A92AE}}.foco-pp .ch{{display:flex;flex-wrap:wrap;gap:6px}}.foco-pp .ch span{{font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:99px;background:#F4F0FB;color:#3A3352}}.foco-pp .foco .ch span{{background:rgba(255,255,255,.12);color:#EDE6FF}}.foco-pp .nt{{font-size:14px;line-height:1.5;color:#4A4266}}.foco-pp .foco .nt{{color:#DCD2F5}}.foco-pp .bd{{position:absolute;top:14px;right:14px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:#FB923C;color:#1E0F00}}.foco-pp a.bt{{margin-top:auto;display:block;text-align:center;font-weight:700;font-size:14.5px;padding:11px 14px;border-radius:12px;text-decoration:none !important;border:1.5px solid #D6CCF2 !important;color:#5B21B6 !important;background:#fff !important}}.foco-pp .foco a.bt{{background:#FB923C !important;border-color:#FB923C !important;color:#1E0F00 !important}}@media(max-width:640px){{.foco-pp{{grid-template-columns:1fr}}}}</style><div class="pp foco"><span class="bd">Free</span><div class="top"><div class="ic">🖨️</div><div><div class="nm">FOCO ADHD planner kit</div><div class="by">Made by FOCO</div></div></div><div class="pr"><b>Free</b></div><div class="ch"><span>7 pages</span><span>Letter + A4</span><span>Undated</span></div><div class="nt">A daily page with a first tiny step, task breakdown, brain dump, time blocks, weekly, monthly and a no-streak habit tracker.</div><a class="bt" href="{{{{media:foco-adhd-planner-kit-ink-saver-letter-v4.pdf}}}}" target="_blank" rel="noopener">Download free (PDF)</a></div><div class="pp"><div class="top"><div class="ic">📄</div><div><div class="nm">2026 + 2027 ADHD Printable Planner</div><div class="by">FutureADHD on Etsy</div></div></div><div class="pr"><b>$16.34</b><s>$25.14</s><span>on sale</span></div><div class="ch"><span>205 pages</span><span>Letter + A4</span><span>Dated</span></div><div class="nt">⭐ 4.9 from 543 reviews. ADHD extras like an impulse-buy checklist and a chore chopper.</div><a class="bt" href="https://www.etsy.com/listing/1257544669/adhd-printable-planner-adult-daily" target="_blank" rel="nofollow noopener">View on Etsy</a></div><div class="pp"><div class="top"><div class="ic">🗂️</div><div><div class="nm">Digital Mega Planner ADHD Set</div><div class="by">DesignAuraStudio on Etsy</div></div></div><div class="pr"><b>$6.49</b><s>$12.98</s><span>on sale</span></div><div class="ch"><span>754 pages</span><span>A4, A5, Letter</span><span>Undated</span></div><div class="nt">⭐ 4.6 from 67 reviews. A big minimal bundle: daily, weekly, monthly, habits, finance and goals.</div><a class="bt" href="https://www.etsy.com/listing/1680000702/digital-mega-planner-adhd-set-for" target="_blank" rel="nofollow noopener">View on Etsy</a></div></div><!-- /wp:html -->

<h3 id="digital-planners">Digital planners for GoodNotes and iPad</h3>

<p>A <strong>digital planner</strong> is a linked PDF you write on with a stylus in an app like GoodNotes or Notability. It feels like paper, but you never run out of pages.</p>

<!-- wp:html --><div class="foco-pp"><style>.foco-pp{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0 28px}}.foco-pp .pp{{position:relative;background:#fff;border:1px solid #E7DFF7;border-radius:18px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px -18px rgba(76,29,149,.35)}}.foco-pp .pp.foco{{background:linear-gradient(135deg,#160B26,#3B1873);border:0;color:#fff}}.foco-pp .top{{display:flex;gap:12px;align-items:center}}.foco-pp .ic{{width:46px;height:46px;border-radius:14px;background:#F1EAFC;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none}}.foco-pp .foco .ic{{background:rgba(255,255,255,.12)}}.foco-pp .nm{{font-weight:800;font-size:16.5px;line-height:1.25;color:#160F22}}.foco-pp .foco .nm{{color:#fff}}.foco-pp .by{{font-size:13px;color:#6E6684;margin-top:2px}}.foco-pp .foco .by{{color:#C9B8FF}}.foco-pp .pr{{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}}.foco-pp .pr b{{font-size:24px;font-weight:800;color:#160F22;letter-spacing:-.02em}}.foco-pp .foco .pr b{{color:#fff}}.foco-pp .pr span{{font-size:13px;color:#6E6684}}.foco-pp .pr s{{font-size:14px;color:#9A92AE}}.foco-pp .ch{{display:flex;flex-wrap:wrap;gap:6px}}.foco-pp .ch span{{font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:99px;background:#F4F0FB;color:#3A3352}}.foco-pp .foco .ch span{{background:rgba(255,255,255,.12);color:#EDE6FF}}.foco-pp .nt{{font-size:14px;line-height:1.5;color:#4A4266}}.foco-pp .foco .nt{{color:#DCD2F5}}.foco-pp .bd{{position:absolute;top:14px;right:14px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:#FB923C;color:#1E0F00}}.foco-pp a.bt{{margin-top:auto;display:block;text-align:center;font-weight:700;font-size:14.5px;padding:11px 14px;border-radius:12px;text-decoration:none !important;border:1.5px solid #D6CCF2 !important;color:#5B21B6 !important;background:#fff !important}}.foco-pp .foco a.bt{{background:#FB923C !important;border-color:#FB923C !important;color:#1E0F00 !important}}@media(max-width:640px){{.foco-pp{{grid-template-columns:1fr}}}}</style><div class="pp foco"><span class="bd">Free</span><div class="top"><div class="ic">📱</div><div><div class="nm">FOCO ADHD planner kit</div><div class="by">Tablet version, made by FOCO</div></div></div><div class="pr"><b>Free</b></div><div class="ch"><span>GoodNotes</span><span>Notability</span><span>Undated</span></div><div class="nt">The dark tablet version of the kit. Duplicate any page as often as you like.</div><a class="bt" href="{{{{media:foco-adhd-planner-kit-letter-v4.pdf}}}}" target="_blank" rel="noopener">Download free (PDF)</a></div><div class="pp"><div class="top"><div class="ic">✍️</div><div><div class="nm">ADHD Digital Planner 2026 2027</div><div class="by">DigitizedPlanner on Etsy</div></div></div><div class="pr"><b>$23.56</b><s>$47.12</s><span>on sale</span></div><div class="ch"><span>GoodNotes</span><span>Notability</span><span>Android</span></div><div class="nt">⭐ Shop rated 4.9 from 1.4k reviews, but only 3 on this listing. Undated option and 200+ templates.</div><a class="bt" href="https://www.etsy.com/listing/4330385814/adhd-digital-planner-2026-lifetime" target="_blank" rel="nofollow noopener">View on Etsy</a></div><div class="pp"><div class="top"><div class="ic">🧠</div><div><div class="nm">ADHD Digital Planner</div><div class="by">phenixdigital on Etsy</div></div></div><div class="pr"><b>$3.96</b><span>often on sale</span></div><div class="ch"><span>GoodNotes</span><span>Notability</span><span>Dated 2025-2026</span></div><div class="nt">⭐ 4.8 from 107 reviews. About 130 ADHD templates for habits, focus, meals and projects.</div><a class="bt" href="https://www.etsy.com/listing/1788285396/adhd-digital-planner-2025-2026-goodnotes" target="_blank" rel="nofollow noopener">View on Etsy</a></div><div class="pp"><div class="top"><div class="ic">📅</div><div><div class="nm">ADHD Digital Daily Planner</div><div class="by">iPad Planner</div></div></div><div class="pr"><b>$39.95</b></div><div class="ch"><span>GoodNotes</span><span>Noteshelf</span><span>Dated 2026-2028</span></div><div class="nt">About 1,350 linked pages from July 2026 to June 2028. The page doesn't list ADHD-specific features.</div><a class="bt" href="https://ipadplanner.com/products/digital-daily-planners" target="_blank" rel="nofollow noopener">View the planner</a></div></div><!-- /wp:html -->

<h3 id="paper-planners">Paper planners for ADHD adults</h3>

<p>A bound planner works when your phone is the distraction. Look for undated pages, so a skipped week doesn't leave a trail of blank days.</p>

<!-- wp:html --><div class="foco-pp"><style>.foco-pp{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0 28px}}.foco-pp .pp{{position:relative;background:#fff;border:1px solid #E7DFF7;border-radius:18px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px -18px rgba(76,29,149,.35)}}.foco-pp .pp.foco{{background:linear-gradient(135deg,#160B26,#3B1873);border:0;color:#fff}}.foco-pp .top{{display:flex;gap:12px;align-items:center}}.foco-pp .ic{{width:46px;height:46px;border-radius:14px;background:#F1EAFC;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none}}.foco-pp .foco .ic{{background:rgba(255,255,255,.12)}}.foco-pp .nm{{font-weight:800;font-size:16.5px;line-height:1.25;color:#160F22}}.foco-pp .foco .nm{{color:#fff}}.foco-pp .by{{font-size:13px;color:#6E6684;margin-top:2px}}.foco-pp .foco .by{{color:#C9B8FF}}.foco-pp .pr{{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}}.foco-pp .pr b{{font-size:24px;font-weight:800;color:#160F22;letter-spacing:-.02em}}.foco-pp .foco .pr b{{color:#fff}}.foco-pp .pr span{{font-size:13px;color:#6E6684}}.foco-pp .pr s{{font-size:14px;color:#9A92AE}}.foco-pp .ch{{display:flex;flex-wrap:wrap;gap:6px}}.foco-pp .ch span{{font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:99px;background:#F4F0FB;color:#3A3352}}.foco-pp .foco .ch span{{background:rgba(255,255,255,.12);color:#EDE6FF}}.foco-pp .nt{{font-size:14px;line-height:1.5;color:#4A4266}}.foco-pp .foco .nt{{color:#DCD2F5}}.foco-pp .bd{{position:absolute;top:14px;right:14px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:#FB923C;color:#1E0F00}}.foco-pp a.bt{{margin-top:auto;display:block;text-align:center;font-weight:700;font-size:14.5px;padding:11px 14px;border-radius:12px;text-decoration:none !important;border:1.5px solid #D6CCF2 !important;color:#5B21B6 !important;background:#fff !important}}.foco-pp .foco a.bt{{background:#FB923C !important;border-color:#FB923C !important;color:#1E0F00 !important}}@media(max-width:640px){{.foco-pp{{grid-template-columns:1fr}}}}</style><div class="pp foco"><span class="bd">Free</span><div class="top"><div class="ic">📒</div><div><div class="nm">FOCO ADHD planner kit</div><div class="by">Print it before you buy a book</div></div></div><div class="pr"><b>Free</b></div><div class="ch"><span>Undated</span><span>Letter + A4</span></div><div class="nt">Test whether paper sticks for you with a week of printed pages.</div><a class="bt" href="{{{{media:foco-adhd-planner-kit-ink-saver-letter-v4.pdf}}}}" target="_blank" rel="noopener">Download free (PDF)</a></div><div class="pp"><div class="top"><div class="ic">🐼</div><div><div class="nm">Panda Planner Classic</div><div class="by">Guided daily page</div></div></div><div class="pr"><b>$24.99</b></div><div class="ch"><span>Undated</span><span>3 months</span><span>5.25 x 8.25 in</span></div><div class="nt">Each day has a morning review, a schedule, top priorities and an end-of-day review.</div><a class="bt" href="https://pandaplanner.com/products/panda-planner-classic-original" target="_blank" rel="nofollow noopener">View Panda Planner</a></div><div class="pp"><div class="top"><div class="ic">🌈</div><div><div class="nm">Happy Planner</div><div class="by">Disc-bound, customizable</div></div></div><div class="pr"><b>$29.99</b></div><div class="ch"><span>Dated or undated</span><span>Add or move pages</span></div><div class="nt">Undated Classic, regular price; often on sale. Great for sticker lovers, but decorating can become a way to avoid the plan.</div><a class="bt" href="https://thehappyplanner.com/" target="_blank" rel="nofollow noopener">View Happy Planner</a></div><div class="pp"><div class="top"><div class="ic">📓</div><div><div class="nm">Bullet Journal Edition 2</div><div class="by">Leuchtturm1917</div></div></div><div class="pr"><b>$31.50</b></div><div class="ch"><span>206 dot-grid pages</span><span>You date it</span></div><div class="nt">Draw your own layouts. Fresh for novelty seekers, but only as good as your last spread.</div><a class="bt" href="https://bulletjournal.com/" target="_blank" rel="nofollow noopener">About the method</a></div><div class="pp"><div class="top"><div class="ic">🔻</div><div><div class="nm">Planner Pads</div><div class="by">Funnel system</div></div></div><div class="pr"><b>$33.49</b></div><div class="ch"><span>Weekly spread</span><span>Dated or undated</span></div><div class="nt">Tasks by category funnel down to each day. ADDA reviewed it for adults with ADHD; price from that review.</div><a class="bt" href="https://www.plannerpads.com/" target="_blank" rel="nofollow noopener">View Planner Pads</a></div><div class="pp"><div class="top"><div class="ic">🦊</div><div><div class="nm">Clever Fox Planner PRO</div><div class="by">Goals plus a weekly plan</div></div></div><div class="pr"><b>$39.99</b></div><div class="ch"><span>Undated</span><span>12 months</span><span>8.5 x 11 in</span></div><div class="nt">12 monthly pages up front, then 52 weekly pages with goal tracking. Price at Walmart.</div><a class="bt" href="https://www.walmart.com/ip/1283550823" target="_blank" rel="nofollow noopener">View at Walmart</a></div><div class="pp"><div class="top"><div class="ic">🗓️</div><div><div class="nm">Laurel Denise</div><div class="by">Week and day on one spread</div></div></div><div class="pr"><b>$11-$62</b></div><div class="ch"><span>Mostly dated</span><span>Some undated</span></div><div class="nt">Shows the week and today together. Premium price, so best if you already know you stick with paper.</div><a class="bt" href="https://laureldenise.com/" target="_blank" rel="nofollow noopener">View Laurel Denise</a></div></div><!-- /wp:html -->

<p><strong>Planner Pads</strong> uses a "funnel" spread, from tasks by category down to each day's priorities and appointments. <a href="https://add.org/planner-pads-review/" target="_blank" rel="noopener">ADDA reviewed it</a> and says the funnel gives adults with ADHD outside structure for sorting and prioritizing.</p>

<p>Prices are from each maker's, retailer's or Etsy listing on November 7, 2026, in US dollars. Prices and sales change often, so check before you buy.</p>

<h2 id="adhd-friendly">What makes a printable planner work for ADHD?</h2>

<p>It asks for fewer decisions and gives you a clear first move. Most planners do the opposite: lots of empty boxes and nothing that helps you begin.</p>

<p>Planning, prioritizing and starting all lean on <strong>executive function</strong>, and differences in executive function are central to ADHD, as described in <a href="https://pubmed.ncbi.nlm.nih.gov/9000892/" target="_blank" rel="noopener">Russell Barkley's model of ADHD</a>.</p>

<p>The kit is built on five rules:</p>

<ul>
<li><strong>Undated.</strong> A blank week in a dated planner can feel like a failure. Undated pages just wait for you.</li>
<li><strong>One page, one job.</strong> No setup and no system to maintain.</li>
<li><strong>A first step, not just a task.</strong> The gap between knowing and starting is what FOCO calls a <strong>task initiation deficit</strong>, explained in <a href="https://www.tryfoco.com/task-initiation-deficit-explained/">task initiation deficit explained</a>.</li>
<li><strong>Time you can see.</strong> Rough blocks and minute guesses help with <strong>time blindness</strong>, the trouble sensing how much time is passing. More in <a href="https://www.tryfoco.com/time-blindness-adhd/">time blindness and ADHD</a>.</li>
<li><strong>No streaks.</strong> The habit tracker and weekly page count good days, so one missed day doesn't erase the rest.</li>
</ul>

<h2 id="how-to-use">How do you use the ADHD planner kit in 5 minutes a day?</h2>

<p>Keep it short enough to do on a bad day. Five minutes is the whole job.</p>

<ol>
<li><strong>Pick one page.</strong> Use the table above and print a few copies of just that page.</li>
<li><strong>Put it where you already look.</strong> Next to the coffee maker, on your keyboard, on the fridge.</li>
<li><strong>Fill it in at the same moment each day.</strong> Tie it to something you already do, like your first coffee or plugging in your phone at night.</li>
<li><strong>Finish with the fill-in line.</strong> Write when you'll start, or the one thing you'll do first. That line is the part that gets you moving.</li>
</ol>

<p>Missed a day? Don't catch up: take a fresh page, write today's date and start there.</p>

<h2 id="keep-using">How do you keep using a paper planner after the first week?</h2>

<p>Make it hard to forget and easy to restart. Most paper planners die in a drawer, not from bad design.</p>

<p>Keep it visible, and keep one spare copy where you spend most of your time. If a page sits blank for a week, that's information, not failure: try a different page from the kit.</p>

<p>If you plan well but freeze at the first task, the planner isn't the problem. A timer can give the task a clear end, like the <a href="https://www.tryfoco.com/10-minute-timer-adhd/">10-minute timer method</a>.</p>

<h2 id="paper-or-app">Should you use a paper planner or an app for ADHD?</h2>

<p>Paper is better when your phone is the distraction, and an app is better when you need reminders. Many people use both.</p>

<p>If you'd rather plan on your phone, we compare 9 apps, plus the paper planners worth buying, in the <a href="https://www.tryfoco.com/best-adhd-planner/">best ADHD planner apps</a> guide.</p>

<h2 id="body-doubling">Can body doubling help you start what you planned?</h2>

<p>For many people with ADHD, yes. <strong>Body doubling</strong> means working while someone else is present, in person or on a screen.</p>

<p>Every page in the kit has a QR code to the <a href="https://www.tryfoco.com/body-doubling/">FOCO focus room</a>, a free live room where you set a timer and work next to other people. For why it helps, read <a href="https://www.tryfoco.com/body-doubling-adhd/">body doubling for ADHD</a>.</p>

<h2 id="faq">FAQ</h2>

<h3>Is there a free printable ADHD planner?</h3>
<p>Yes, FOCO's ADHD planner kit is free to download with no email or signup. It has seven undated pages in US Letter and A4, in a dark version and an ink-saver version.</p>

<h3>Should I use a dated or undated planner?</h3>
<p>Undated is usually easier with ADHD, because skipped days don't leave blank pages behind. Dated planners help if seeing the day of the week is what keeps you oriented.</p>

<h3>How do I stop abandoning planners after a few days?</h3>
<p>Keep it where you already look, fill it in at the same moment each day, and use only one page at first. If you miss a day, start again from today instead of catching up.</p>

<h3>Can I use the planner on an iPad or tablet?</h3>
<p>Yes, open the dark PDF in a note-taking app like GoodNotes or Notability and write on it with a stylus. You can duplicate a page as often as you like.</p>

<h3>Will the planner print on A4 paper?</h3>
<p>Yes, there is a separate A4 version of the full kit, in dark and ink-saver. Print at 100% or "actual size" so the margins stay right.</p>

<h3>Do bullet journals work for ADHD?</h3>
<p>The simple version can, because it is fast and flexible. Elaborate spreads tend to need more upkeep, so if you try one, keep the layouts plain.</p>

<h2>The Bottom Line</h2>

<p>A planner helps with ADHD when it makes the next step obvious and forgives missed days. That's what this kit is for.</p>

<p>Pick the one page that matches your hardest moment, print a few copies, and keep them where you'll see them. When starting is the real problem, the <a href="https://apps.apple.com/app/id6762489184" target="_blank" rel="noopener">FOCO app</a> breaks any task on your list into tiny steps.</p>

<h2>References</h2>
<ul class="foco-references">
<li><a href="https://pubmed.ncbi.nlm.nih.gov/9000892/" target="_blank" rel="noopener">Barkley RA. Behavioral inhibition, sustained attention, and executive functions: constructing a unifying theory of ADHD. Psychol Bull. 1997;121(1):65-94.</a></li>
<li><a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" target="_blank" rel="noopener">National Institute of Mental Health. Attention-Deficit/Hyperactivity Disorder.</a></li>
<li><a href="https://www.cdc.gov/adhd/about/index.html" target="_blank" rel="noopener">CDC. About ADHD.</a></li>
<li><a href="https://chadd.org/about-adhd/overview/" target="_blank" rel="noopener">CHADD. ADHD Overview.</a></li>
</ul>
'''
assert '—' not in html
open(f'posts-new/post-{slug}.html', 'w').write(html)
print('wrote', slug, len(html))
