# Night theme for the live homepage (page 4760): one continuous purple atmosphere from hero to FAQ.
# Flips the page's colour variables to dark, makes every section transparent over a page-long gradient with
# drifting light orbs, soft light beams and faint stars. Idempotent (marker fh-night).
import re, sys

CSS = ('<style id="fh-night">'
# dark variables (later in the document than the original .fh{} so these win)
'.fh{--bg:#0b0912;--bg-2:#120a22;--surface:rgba(255,255,255,.045);--ink:#ffffff;--ink-2:#e4e4e7;--muted:#a1a1aa;--line:rgba(167,139,250,.18)}'
'html:has(body.page-id-4760),html body.page-id-4760,html body.page-id-4760 .blog-single,html body.page-id-4760 .foco-app{background:#0b0912 !important}'
# the world
'.fh{position:relative !important;isolation:isolate !important;background:#0b0912 !important;overflow:hidden !important}'
'.fh::before{content:"" !important;position:absolute !important;inset:0 !important;z-index:-2 !important;pointer-events:none !important;background:'
'radial-gradient(900px 700px at 88% 6%,rgba(124,58,237,.30),transparent 70%),'
'radial-gradient(800px 640px at 8% 18%,rgba(124,58,237,.22),transparent 70%),'
'radial-gradient(900px 720px at 92% 33%,rgba(167,139,250,.15),transparent 70%),'
'radial-gradient(900px 760px at 10% 48%,rgba(124,58,237,.24),transparent 70%),'
'radial-gradient(900px 700px at 85% 63%,rgba(124,58,237,.22),transparent 70%),'
'radial-gradient(800px 700px at 15% 78%,rgba(167,139,250,.16),transparent 70%),'
'radial-gradient(1100px 760px at 60% 95%,rgba(124,58,237,.26),transparent 70%),'
'linear-gradient(180deg,#0b0912 0%,#120a24 22%,#0d0a18 44%,#150a2c 66%,#0e0a1c 84%,#0b0912 100%) !important;'
'animation:fhGlow 14s ease-in-out infinite alternate !important}'
'@keyframes fhGlow{0%{filter:saturate(1) brightness(1)}100%{filter:saturate(1.25) brightness(1.12)}}'
'.fh::after{content:"" !important;position:absolute !important;inset:0 !important;z-index:-1 !important;pointer-events:none !important;background:'
'radial-gradient(1.2px 1.2px at 30px 40px,rgba(255,255,255,.55),transparent 60%),'
'radial-gradient(1px 1px at 160px 120px,rgba(196,181,253,.6),transparent 60%),'
'radial-gradient(1.4px 1.4px at 90px 210px,rgba(255,255,255,.4),transparent 60%),'
'radial-gradient(1px 1px at 210px 260px,rgba(196,181,253,.45),transparent 60%),'
'repeating-linear-gradient(104deg,transparent 0 260px,rgba(196,181,253,.05) 300px,transparent 360px) !important;'
'background-size:240px 300px,240px 300px,240px 300px,240px 300px,auto !important;animation:fhTwinkle 7s ease-in-out infinite alternate !important}'
'@keyframes fhTwinkle{0%{opacity:.55}100%{opacity:1}}'
'.fh-orb{position:absolute !important;z-index:-1 !important;border-radius:50% !important;pointer-events:none !important;filter:blur(60px) !important;opacity:.55 !important;'
'background:radial-gradient(closest-side,rgba(124,58,237,.55),transparent) !important;animation:fhOrb 18s ease-in-out infinite alternate !important}'
'.fh-orb.o1{width:520px !important;height:520px !important;left:-140px !important;top:30% !important}'
'.fh-orb.o2{width:620px !important;height:620px !important;right:-180px !important;top:55% !important;animation-delay:-6s !important;background:radial-gradient(closest-side,rgba(167,139,250,.4),transparent) !important}'
'.fh-orb.o3{width:560px !important;height:560px !important;left:20% !important;top:82% !important;animation-delay:-12s !important}'
'@keyframes fhOrb{0%{transform:translate(0,0) scale(1)}100%{transform:translate(80px,-60px) scale(1.15)}}'
# every section transparent so the world shows through (hero keeps its video)
'.fh section:not(#fhx){background:transparent !important}'
'.fh section:has(.vignettes):not(#fhx)::before{display:none !important}'
# type + components on dark
'.fh h2,.fh h3,.fh summary{color:#fff !important}'
'.fh .accent{color:#A78BFA !important}'
'.fh .sub,.fh p{color:var(--muted)}'
'.fh .eyebrow{background:rgba(255,255,255,.06) !important;color:#c4b5fd !important;border:1px solid rgba(255,255,255,.12) !important}'
'.fh .score,.fh .quote,.fh .stat,.fh details,.fh .plan:not(.best){background:rgba(255,255,255,.045) !important;border:1px solid rgba(167,139,250,.18) !important;'
'-webkit-backdrop-filter:blur(8px) !important;backdrop-filter:blur(8px) !important;transition:border-color .3s ease,box-shadow .3s ease,transform .3s ease !important}'
'.fh .score:hover,.fh .quote:hover,.fh .stat:hover,.fh details:hover,.fh .plan:hover{border-color:rgba(167,139,250,.5) !important;box-shadow:0 0 50px -12px rgba(124,58,237,.6) !important}'
'.fh .score .big,.fh .stat b,.fh .plan .price{color:#fff !important}'
'.fh .stat b{background:linear-gradient(90deg,#fff,#c4b5fd) !important;-webkit-background-clip:text !important;background-clip:text !important;color:transparent !important}'
'.fh .score small,.fh .stat small,.fh .quote .who,.fh .quote .src{color:#a1a1aa !important}'
'.fh .quote p,.fh .stat p,.fh details p,.fh .plan:not(.best) li{color:#d4d4d8 !important}'
'.fh .plan:not(.best),.fh .plan:not(.best) div{color:#fff !important}'
'.fh .plan.best{box-shadow:0 0 90px -20px rgba(124,58,237,.9) !important}'
'.fh .plan:not(.best) .btn{background:transparent !important;color:#fff !important;border:1px solid rgba(255,255,255,.45) !important}.fh .plan:not(.best) .btn:hover{background:rgba(255,255,255,.08) !important}'
'.fh details a{color:#c4b5fd !important}'
'.fh details[open]{border-color:rgba(167,139,250,.45) !important}'
'.fh .yt{box-shadow:0 0 60px -20px rgba(124,58,237,.7) !important;border:1px solid rgba(167,139,250,.2) !important}'
'.fh .because{color:#fff !important}'
'@media (max-width:900px){.fh-orb{display:none !important}}'
'@media (prefers-reduced-motion:reduce){.fh::before,.fh::after,.fh-orb{animation:none !important}}'
'</style>'
'<div class="fh-orb o1" aria-hidden="true"></div><div class="fh-orb o2" aria-hidden="true"></div><div class="fh-orb o3" aria-hidden="true"></div>')

INLINE_BG = [' style="background:#fff !important"', ' style="background:var(--bg) !important"']


def _boost(css):
    # put 'html body ' before every .fh selector so these rules beat the page's own (which load later)
    return re.sub(r'(?<=[}>,])\.fh(?=[ :{.\[])', 'html body .fh', css)


def apply(s):
    s = re.sub(r'<style id="fh-night">[\s\S]*?</style>(<div class="fh-orb[^"]*" aria-hidden="true"></div>)*', '', s)
    for a in INLINE_BG:
        s = s.replace('<section class="center"' + a + '>', '<section class="center">')
        s = s.replace('<section class="pricing center"' + a + '>', '<section class="pricing center">')
    s = s.replace('Quick <span class="accent">answers.</span>', 'FOCO answers, <span class="accent">in one place.</span>')
    i = s.index('<div class="fh">') + len('<div class="fh">')
    return s[:i] + _boost(CSS) + s[i:]


if __name__ == '__main__':
    t = open(sys.argv[1], encoding='utf8').read()
    open(sys.argv[2], 'w', encoding='utf8').write(apply(t))
    print('ok')
