import json, re, html, sys, os
D = os.path.dirname(os.path.abspath(__file__))
S = os.path.dirname(D)
REPO = '/home/claude/foco-blog-engine'
reviews = {r['name']: r for r in json.load(open(os.path.join(S, 'reviews.json')))}

# name: (short price, short platforms). Prices come from each review's at-a-glance table.
SHORT = {
 'Aligned': ('Free download; coaching from $9.99/week', 'iPhone, iPad, Mac, Android'),
 'AppBlock': ('Free plan; Premium from $4.99/month', 'Android, iPhone, iPad, browser'),
 'BePresent': ('Free download; mostly $59.99/year', 'iPhone, iPad'),
 'Bloom': ('Card $39 to $69 once; app free', 'iPhone, Android'),
 'Brain.fm': ('$14.99/month or $99.99/year', 'Web, iPhone, iPad, Android, desktop'),
 'Brainrot': ('From $3.99/month or $19.99/year', 'iPhone'),
 'Brainway': ('Subscription: $29.99 or $59.99', 'iPhone, Android'),
 'Brick': ('$59 device; app free', 'iPhone, Android'),
 'Chillio': ('$19.99/month or $89.99/year', 'iPhone, iPad, Android'),
 'Clarify': ('$19.99/month or from $39.99/year', 'iPhone, Android'),
 'Cold Turkey Blocker': ('Free; Pro $45 once', 'Windows, Mac'),
 'Ellie': ('Free plan; Pro $9.99/month or $99.99/year', 'iPhone, iPad, Mac, Windows, web'),
 'Endel': ('Free edition; $19.99/month or $119.99/year', 'iPhone, iPad, Mac, Apple Watch, Android'),
 'Fabulous': ('Free basics; Premium $16.99 to $59.99', 'iPhone, Android, web'),
 'Finch': ('Free; optional Plus', 'iPhone, iPad, Android'),
 'Flow Club': ('$40/month or $400/year; 7-day trial', 'Computer, in the browser'),
 'Focus Friend': ('Free; Pro $3.99/month or $19.99/year', 'iPhone, iPad, Mac, Android'),
 'Focusmate': ('3 free sessions a week; Plus $8 to $12/month', 'Web'),
 'Habitica': ('Free; optional subscription', 'Web, iPhone, Android'),
 'Habitify': ('Free for 3 habits; Plus $29.99/year', 'iPhone, iPad, Mac, Apple Watch, Android'),
 'Inflow': ('$22.49/month or $95.99/year', 'iPhone, Android'),
 'Joon': ('Free version; $12.99/month', 'iOS, Android, Fire, Chromebook'),
 'Liven': ('$7.99/week to $89.99/year', 'iPhone, iPad, Apple Watch, Android'),
 'Llama Life': ('$6/month or $39/year after a 7-day trial', 'Web, iPhone, Android'),
 'Lofi Town': ('Free; Supporter from $2.99/month', 'Browser'),
 'Mindflow AI': ('Premium from $17.99/month', 'iPhone, Android'),
 'Numo': ('Plans from $7.99 to $59.99', 'iPhone, Android'),
 'Opal': ('Free plan; Pro $19.99/month or $99.99/year', 'iPhone, Android, Mac'),
 'Pomofocus': ('Free; Premium $3/month or $18/year', 'Browser, Mac, Windows, Linux'),
 'Reclaim AI': ('Free plan; from $10/month', 'Web, with Google Calendar or Outlook'),
 'Recordo': ('Free; Pro $9.99/month or $59.99/year', 'iPhone, Android'),
 'RoutineFlow': ('Free; Pro from $5.99/week', 'iPhone, Android'),
 'Routinery': ('Free for 2 routines; $5/month or $36/year', 'iPhone, iPad, Mac, Apple Watch, Android'),
 'Saner.AI': ('Free plan; $8 or $16/month', 'Web, Chrome, iPhone, iPad, Android'),
 'ScreenZen': ('Free', 'iPhone, iPad, Android, Mac, Windows'),
 'Structured': ('Free; Pro from $2.99/month', 'iPhone, iPad, Mac, Apple Watch, Android, web'),
 'Sunsama': ('$22/month or $204/year', 'Web, Mac, Windows, Linux, iPhone, iPad, Android'),
 'Things 3': ('$9.99 iPhone, $49.99 Mac, one-time', 'iPhone, iPad, Mac, Apple Watch'),
 'Tiimo': ('Free; Pro $7 to $48 in-app', 'iPhone, iPad, Apple Watch, Android, web'),
 'Wisey': ('Subscription: $9.99 or $99.99', 'iPhone, iPad, Android'),
}
BEST = {'Lofi Town': 'A cozy multiplayer study room in your browser'}
assert set(SHORT) == set(reviews), set(SHORT) ^ set(reviews)

def e(s): return html.escape(s, quote=True)
def row(name, href, icon, price, best, plat, ours=False):
    cls = ' class="cm-ours"' if ours else ''
    return (f'<tr{cls}><th scope="row"><span class="cm-app"><img src="{e(icon)}" alt="{e(name)} app icon" width="36" height="36" loading="lazy"/>'
            f'<span><b><a href="{e(href)}">{e(name)}</a></b><small>{e(price)}</small></span></span></th>'
            f'<td data-label="Best for">{e(best)}</td><td data-label="Platforms">{e(plat)}</td></tr>')

rows = [row('FOCO', 'https://www.tryfoco.com/', 'https://www.tryfoco.com/wp-content/uploads/2026/10/app-icon-foco.png',
            '$59/year with a 7-day free trial, or $9/month', 'Starting the task you keep putting off (the app we make)', 'iPhone, Android', True)]
for name in sorted(reviews, key=str.lower):
    r = reviews[name]; price, plat = SHORT[name]
    rows.append(row(name, f'https://www.tryfoco.com/{r["slug"]}/', r['icon'], price, r.get('Best for') or BEST[name], plat))
table = ('<div class="foco-table-wrap foco-cmp2 multi">\n<table>\n<thead><tr><th scope="col"><span class="cm-label">App and price</span></th>'
         '<th scope="col"><span class="cm-label">Best for</span></th><th scope="col"><span class="cm-label">Platforms</span></th></tr></thead>\n<tbody>\n'
         + '\n'.join(rows) + '\n</tbody>\n</table>\n</div>')

top = open(os.path.join(D, 'top.html')).read().replace('{{TABLE}}', table)
rest = open(os.path.join(D, 'rest.html')).read()

# FAQ schema from the FAQ section
faq = rest[rest.index('<h2 id="faq">'):]
qs = [(q, ' '.join(re.findall(r'<p>(.*?)</p>', a, re.S))) for q, a in re.findall(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', faq, re.S)]
txt = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()
schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": txt(q), "acceptedAnswer": {"@type": "Answer", "text": txt(a)}} for q, a in qs]}

live = open(os.path.join(REPO, 'posts-new/post-best-adhd-app.html')).read()
lines = live.split('\n')
old_tldr = live[live.index('<div class="foco-tldr">'):live.index('</div>', live.index('<div class="foco-tldr">')) + 6]
g0 = live.index('<h2>Table of Contents</h2>'); g1 = live.index('<h2 id="related-reading">')
old_guide = live[g0:g1]
m = re.search(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>', live, re.S)
old_schema = m.group(0)
new_schema = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False, separators=(',', ':')) + '</script>'
for o in (old_tldr, old_guide, old_schema): assert live.count(o) == 1
patch = [{"old": old_tldr, "new": top.strip()}, {"old": old_guide, "new": rest.strip() + '\n'}, {"old": old_schema, "new": new_schema}]
new = live.replace(old_tldr, top.strip()).replace(old_guide, rest.strip() + '\n').replace(old_schema, new_schema)
open(os.path.join(S, 'best-adhd-app.new.html'), 'w').write(new)
json.dump(patch, open(os.path.join(S, 'best-adhd-app.patch.json'), 'w'), ensure_ascii=False, indent=1)
print('rows', len(rows), 'faq', len(qs), 'chars', len(live), '->', len(new))
