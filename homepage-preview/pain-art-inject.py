# Pain section on the live homepage (page 4760), Forest-style: no cards. FOCO cut-outs (Gemini scenes drawn from the
# official refs, black keyed out) float on a deep purple atmosphere with light beams, a glowing spot under each,
# a gentle float, staggered entrance. Idempotent (markers fh-pain-art / fh-pain-js / vig-artw / vig-time).
import re, sys

CSS = ('<style id="fh-pain-art">'
'.fh section:has(.vignettes){position:relative !important;overflow:hidden !important;isolation:isolate !important;padding:110px 0 120px !important;'
'background:radial-gradient(70% 55% at 50% 0%,rgba(124,58,237,.38),transparent 70%),radial-gradient(45% 45% at 8% 95%,rgba(124,58,237,.16),transparent 70%),radial-gradient(45% 45% at 92% 90%,rgba(167,139,250,.12),transparent 70%),linear-gradient(180deg,#0d0d0f 0%,#150a2b 45%,#0d0d0f 100%) !important}'
'.fh section:has(.vignettes)::before{content:"" !important;position:absolute !important;inset:-10% -10% 0 !important;z-index:-1 !important;pointer-events:none !important;'
'background:linear-gradient(105deg,transparent 18%,rgba(196,181,253,.07) 22%,transparent 27%,transparent 46%,rgba(196,181,253,.06) 50%,transparent 55%,transparent 70%,rgba(196,181,253,.05) 74%,transparent 79%) !important;filter:blur(14px) !important;animation:fhRays 9s ease-in-out infinite !important}'
'@keyframes fhRays{0%,100%{opacity:.6}50%{opacity:1}}'
'.fh section:has(.vignettes) h2{color:#fff !important}.fh section:has(.vignettes) .accent{color:#A78BFA !important}'
'.fh section:has(.vignettes) .eyebrow{background:rgba(255,255,255,.06) !important;color:#c4b5fd !important;border:1px solid rgba(255,255,255,.12) !important}'
'.fh section:has(.vignettes) .because{color:#fff !important;font-size:20px !important;margin-top:56px !important}'
'.fh .vignettes{margin-top:56px !important;gap:28px !important;align-items:start !important}'
'.fh .vig{background:none !important;border:0 !important;box-shadow:none !important;padding:0 !important;text-align:center !important;'
'opacity:0;transform:translateY(36px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1) !important}'
'.fh .vignettes.in .vig{opacity:1;transform:none}'
'.fh .vignettes.in .vig:nth-child(2){transition-delay:.18s !important}.fh .vignettes.in .vig:nth-child(3){transition-delay:.36s !important}.fh .vignettes.in .vig:nth-child(4){transition-delay:.54s !important}'
'.fh .vig-artw{position:relative !important;height:230px !important;margin:0 auto 18px !important;display:flex !important;align-items:flex-end !important;justify-content:center !important}'
'.fh .vig-artw::before{content:"" !important;position:absolute !important;left:50% !important;bottom:6px !important;width:78% !important;height:46px !important;transform:translateX(-50%) !important;border-radius:50% !important;'
'background:radial-gradient(closest-side,rgba(196,181,253,.55),rgba(124,58,237,.25) 55%,transparent) !important;filter:blur(4px) !important;animation:fhSpot 4.5s ease-in-out infinite !important}'
'.fh .vig-artw::after{content:"" !important;position:absolute !important;left:50% !important;top:46% !important;width:82% !important;height:82% !important;transform:translate(-50%,-50%) !important;border-radius:50% !important;z-index:-1 !important;'
'background:radial-gradient(closest-side,rgba(124,58,237,.42),transparent 72%) !important;animation:fhSpot 4.5s ease-in-out infinite !important}'
'.fh .vig:nth-child(2) .vig-artw::before,.fh .vig:nth-child(2) .vig-artw::after{animation-delay:-1.1s !important}'
'.fh .vig:nth-child(3) .vig-artw::before,.fh .vig:nth-child(3) .vig-artw::after{animation-delay:-2.2s !important}'
'.fh .vig:nth-child(4) .vig-artw::before,.fh .vig:nth-child(4) .vig-artw::after{animation-delay:-3.3s !important}'
'@keyframes fhSpot{0%,100%{opacity:.7}50%{opacity:1}}'
'.fh .vig .vig-art{position:relative !important;z-index:1 !important;display:block !important;width:auto !important;max-width:100% !important;height:100% !important;margin:0 !important;object-fit:contain !important;'
'animation:fhFloat 6s ease-in-out infinite !important;transition:transform .45s cubic-bezier(.2,.7,.2,1) !important}'
'.fh .vig:nth-child(2) .vig-art{animation-delay:-1.5s !important}.fh .vig:nth-child(3) .vig-art{animation-delay:-3s !important}.fh .vig:nth-child(4) .vig-art{animation-delay:-4.5s !important}'
'.fh .vig:hover .vig-art{animation-play-state:paused !important;transform:translateY(-8px) scale(1.05) !important}'
'@keyframes fhFloat{0%,100%{translate:0 0}50%{translate:0 -9px}}'
'.fh .vig .vig-time{display:block !important;font:600 13px/1 Lexend,"Plus Jakarta Sans",sans-serif !important;letter-spacing:.04em !important;color:#A78BFA !important;margin-bottom:8px !important}'
'.fh .vig:nth-child(3) .vig-time{color:#a1a1aa !important}.fh .vig:nth-child(4) .vig-time{color:#71717a !important}'
'.fh .vig h3{color:#fff !important;font-size:20px !important;margin-bottom:6px !important}'
'.fh .vig p{color:#a1a1aa !important;font-size:15px !important;line-height:1.55 !important;max-width:250px !important;margin:0 auto !important}'
'@media (max-width:900px){.fh section:has(.vignettes){padding:72px 0 80px !important}.fh .vignettes{grid-template-columns:1fr 1fr !important;gap:28px 14px !important;margin-top:36px !important}'
'.fh .vig-artw{height:150px !important;margin-bottom:12px !important}.fh .vig h3{font-size:16.5px !important}.fh .vig p{font-size:13.5px !important}.fh section:has(.vignettes) .because{font-size:17px !important;margin-top:36px !important}}'
'@media (prefers-reduced-motion:reduce){.fh .vig{opacity:1 !important;transform:none !important;transition:none !important}.fh .vig-art,.fh .vig-artw::before,.fh .vig-artw::after,.fh section:has(.vignettes)::before{animation:none !important}}'
'</style>'
'<script id="fh-pain-js">(function(){function go(){var v=document.querySelector(".fh .vignettes");if(!v)return;'
'if(!("IntersectionObserver" in window)){v.classList.add("in");return;}'
'var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){v.classList.add("in");o.disconnect();}});},{threshold:.2});o.observe(v);'
'setTimeout(function(){if(v.getBoundingClientRect().top<innerHeight)v.classList.add("in");},1200);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();})();</script>')

TITLES = ['20 minutes.', 'Anything else.', 'An hour gone.', 'Later.']
TIMES = ['9:00 AM', '9:20 AM', '10:20 AM', 'Tomorrow']
ALTS = ['FOCO staring at an empty page while the clock ticks', 'FOCO busy sorting pencils instead of the real task',
        'FOCO dazed by a phone while the clock spins', 'FOCO sleepily flipping the calendar to tomorrow']


def apply(s, urls):
    s = re.sub(r'<style id="fh-pain-art">[\s\S]*?</style>(<script id="fh-pain-js">[\s\S]*?</script>)?', '', s)
    s = re.sub(r'<span class="vig-time">[^<]*</span>', '', s)
    s = re.sub(r'<div class="vig-artw">\s*<img[^>]*class="vig-art"[^>]*>\s*</div>', '', s)
    s = re.sub(r'<img[^>]*class="vig-art"[^>]*>', '', s)
    for t, tm, u, a in zip(TITLES, TIMES, urls, ALTS):
        k = '<div class="vig"><h3>' + t + '</h3>'
        assert k in s, k
        s = s.replace(k, '<div class="vig"><div class="vig-artw"><img class="vig-art" src="%s" alt="%s" width="560" height="440" loading="lazy"></div>'
                         '<span class="vig-time">%s</span><h3>%s</h3>' % (u, a, tm, t), 1)
    i = s.index('<div class="vignettes"')
    a = s.rfind('<section', 0, i)
    return s[:a] + CSS + s[a:]


if __name__ == '__main__':
    t = open(sys.argv[1], encoding='utf8').read()
    open(sys.argv[2], 'w', encoding='utf8').write(apply(t, sys.argv[3:7]))
    print('ok')
