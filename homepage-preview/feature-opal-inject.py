# Opal-level feature sections on the live homepage (page 4760).
# Desktop: a big realistic phone (titanium edge, dynamic island, side buttons) tilted in 3D that rotates with
# scroll, emerging from the dark: its lower part dissolves, so the visible screen reads large. Mobile: the phone
# stands straight above centred text and dissolves the same way. Idempotent (markers fh-feat-opal / -js).
import re, sys
CSS = ('<style id="fh-feat-opal">'
'.fh section:has(>.wrap>.feature){background:transparent !important;padding:20px 0 !important;overflow:hidden !important}'
'.fh .feature{grid-template-columns:.85fr 1.15fr !important;gap:40px !important;padding:70px 0 !important;align-items:center !important}'
'.fh .feature.rev{grid-template-columns:1.15fr .85fr !important}'
'.fh .feature h3{color:#fff !important;font-size:clamp(32px,3.4vw,46px) !important;line-height:1.12 !important;letter-spacing:-.01em !important}'
'.fh .feature h3 .accent{color:#A78BFA !important}'
'.fh .feature p{color:#a1a1aa !important;font-size:17px !important}'
'.fh .feature li{color:#d4d4d8 !important}.fh .feature li::before{color:#A78BFA !important}'
'.fh .feature .eyebrow{background:rgba(255,255,255,.06) !important;color:#d4d4d8 !important;border:1px solid rgba(255,255,255,.14) !important;text-transform:none !important;letter-spacing:0 !important;font-size:13px !important;font-weight:500 !important;padding:6px 12px !important}'
# the stage: glow behind, phone dissolving into the dark at the bottom
'.fh .f-visual{background:none !important;perspective:1700px !important;position:relative !important;height:640px !important;min-height:0 !important;display:flex !important;align-items:flex-start !important;justify-content:center !important;padding:40px 0 0 !important;'
'-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 66%,transparent 97%) !important;mask-image:linear-gradient(180deg,#000 0%,#000 66%,transparent 97%) !important}'
'.fh .f-visual::before{content:"" !important;position:absolute !important;left:50% !important;top:44% !important;width:520px !important;height:520px !important;transform:translate(-50%,-50%) !important;border-radius:50% !important;'
'background:radial-gradient(closest-side,rgba(124,58,237,.55),rgba(124,58,237,.16) 55%,transparent) !important;filter:blur(20px) !important;z-index:0 !important;pointer-events:none !important}'
'.fh .f-visual::after{display:none !important}'
# the device
'.fh .f-visual .phone{--ry:-24deg;--rx:10deg;--rz:-6deg;--ty:0px;position:relative !important;z-index:1 !important;width:340px !important;aspect-ratio:9/19.3 !important;padding:11px !important;border-radius:58px !important;'
'background:linear-gradient(150deg,#8a8a98 0%,#3a3a44 7%,#121216 22%,#0a0a0d 50%,#18181d 78%,#4a4a56 93%,#9a9aa8 100%) !important;'
'box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),inset 0 0 0 3px #050507,0 80px 120px -50px rgba(0,0,0,.95),0 0 140px -20px rgba(124,58,237,.6),'
'-3px 120px 0 -1px #2a2a32,-3px 175px 0 -1px #2a2a32 !important;'
'transform:rotateY(var(--ry)) rotateX(var(--rx)) rotateZ(var(--rz)) translateY(var(--ty)) !important;transform-style:preserve-3d !important;will-change:transform !important}'
'.fh .feature.rev .f-visual .phone{--ry:24deg;--rz:6deg}'
'.fh .f-visual .phone::before{display:block !important;content:"" !important;position:absolute !important;top:23px !important;left:50% !important;transform:translateX(-50%) !important;width:104px !important;height:30px !important;border-radius:20px !important;background:#000 !important;z-index:3 !important}'
'.fh .f-visual .phone::after{content:"" !important;position:absolute !important;inset:11px !important;border-radius:48px !important;z-index:2 !important;pointer-events:none !important;'
'background:linear-gradient(125deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 30%) !important}'
'.fh .f-visual .phone img,.fh .f-visual .phone video{display:block !important;width:100% !important;height:100% !important;object-fit:cover !important;object-position:top !important;border-radius:48px !important}'
# mobile: straight phone above centred copy, same dissolve
'@media (max-width:900px){.fh .feature,.fh .feature.rev{grid-template-columns:1fr !important;gap:0 !important;padding:44px 0 !important;text-align:center !important}'
'.fh .feature .f-visual{order:-1 !important;height:470px !important;padding-top:16px !important;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 60%,transparent 96%) !important;mask-image:linear-gradient(180deg,#000 0%,#000 60%,transparent 96%) !important}'
'.fh .feature.rev .f-copy{order:0 !important}'
'.fh .f-visual .phone,.fh .feature.rev .f-visual .phone{width:270px !important;border-radius:46px !important;padding:9px !important;--ry:0deg !important;--rx:0deg !important;--rz:0deg !important}'
'.fh .f-visual .phone img{border-radius:38px !important}.fh .f-visual .phone::after{inset:9px !important;border-radius:38px !important}.fh .f-visual .phone::before{top:18px !important;width:84px !important;height:24px !important}'
'.fh .f-visual::before{width:380px !important;height:380px !important}'
'.fh .feature h3{font-size:32px !important}.fh .feature p{margin-left:auto !important;margin-right:auto !important}'
'.fh .feature ul{display:inline-grid !important;justify-items:start !important;text-align:left !important;margin-left:auto !important;margin-right:auto !important}}'
'@media (prefers-reduced-motion:reduce){.fh .f-visual .phone{will-change:auto !important}}'
'</style>'
'<script id="fh-feat-opal-js">(function(){function go(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;'
'var ps=[].slice.call(document.querySelectorAll(".fh .f-visual .phone"));if(!ps.length)return;var tick=false;'
'function upd(){tick=false;var vh=innerHeight,mob=innerWidth<=900;ps.forEach(function(p){var r=p.getBoundingClientRect();var t=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));'
'if(mob){p.style.setProperty("--ty",((0.5-t)*40).toFixed(1)+"px");return;}'
'var rev=p.closest(".rev")?-1:1;var k=1.35-t*1.3;'
'p.style.setProperty("--ry",(-22*k*rev).toFixed(2)+"deg");p.style.setProperty("--rx",(12*k).toFixed(2)+"deg");p.style.setProperty("--rz",(-6*k*rev).toFixed(2)+"deg");p.style.setProperty("--ty",((0.5-t)*70).toFixed(1)+"px");});}'
'addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(upd);}},{passive:true});addEventListener("resize",upd);upd();}'
'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();})();</script>')
ANCHOR = '<section style="padding-top:40px !important">'
STATS_OLD = 'https://www.tryfoco.com/wp-content/uploads/2026/10/foco-home-shot-stats.jpg'


def apply(s, done_url=None):
    s = re.sub(r'<style id="fh-feat-opal">[\s\S]*?</style><script id="fh-feat-opal-js">[\s\S]*?</script>', '', s)
    if done_url:  # swap the stats screen (red "abandoned" bar) for the "You did it!" completion screen
        s = re.sub(re.escape(STATS_OLD) + r'" alt="[^"]*"', done_url + '" alt="FOCO completion screen: You did it, step complete, Reply to important emails"', s)
    i = s.index(ANCHOR)
    return s[:i] + CSS + s[i:]


if __name__ == '__main__':
    t = open(sys.argv[1], encoding='utf8').read()
    open(sys.argv[2], 'w', encoding='utf8').write(apply(t, sys.argv[3] if len(sys.argv) > 3 else None))
    print('ok')
