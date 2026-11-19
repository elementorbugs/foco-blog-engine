import sys
VID, POS = sys.argv[1], sys.argv[2]
INJ = ('<video class="fh-bgv" src="%s" poster="%s" autoplay muted loop playsinline aria-hidden="true"></video><div class="fh-bgv-scrim"></div>' % (VID, POS))
CSS = ('<style id="fh-hero-video">'
'.fh .hero{overflow:hidden !important;background:#0d0d0f !important}'
'.fh .hero .fh-bgv{position:absolute !important;top:0 !important;left:-16% !important;width:118% !important;max-width:none !important;height:100% !important;object-fit:cover !important;object-position:50% 40% !important;z-index:0 !important;pointer-events:none !important}'
'.fh .hero .fh-bgv-scrim{position:absolute !important;inset:0 !important;z-index:1 !important;background:linear-gradient(90deg,rgba(13,13,15,.92) 0%,rgba(13,13,15,.72) 38%,rgba(13,13,15,.18) 62%,rgba(13,13,15,.3) 100%),linear-gradient(0deg,rgba(13,13,15,.5) 0%,rgba(13,13,15,0) 35%) !important}'
'.fh .hero .wrap{position:relative !important;z-index:2 !important}'
'.fh .hero .phone{width:220px !important;border-radius:36px !important;padding:8px !important}.fh .hero .phone video{border-radius:29px !important}'
'.fh .hero h1{color:#fff !important}.fh .hero .accent{color:#A78BFA !important}.fh .hero h1 .accent{font-size:.68em !important;line-height:1.2 !important;display:inline-block !important;margin-top:6px !important}'
'.fh .hero .sub{color:rgba(255,255,255,.84) !important}'
'.fh .hero .micro,.fh .hero .micro span{color:rgba(255,255,255,.75) !important}.fh .hero .micro b{color:#fff !important}'
'.fh .hero .eyebrow{background:rgba(124,58,237,.28) !important;color:#ddd6fe !important;border-color:rgba(167,139,250,.4) !important}'
'@media (max-width:860px){.fh .hero{padding-top:calc(56.25vw - 6px) !important}.fh .hero .fh-bgv{left:0 !important;top:0 !important;width:100% !important;height:56.25vw !important;object-position:50% 50% !important}.fh .hero .fh-bgv-scrim{inset:0 0 auto 0 !important;height:56.25vw !important;background:linear-gradient(180deg,rgba(13,13,15,.25) 0%,rgba(13,13,15,0) 25%,rgba(13,13,15,0) 60%,rgba(13,13,15,1) 100%) !important}.fh .hero .hero-visual{position:absolute !important;top:calc(-56.25vw + 20px) !important;left:6vw !important;margin:0 !important;z-index:3 !important}.fh .hero .phone{width:min(100px,26vw) !important;border-radius:18px !important;padding:4px !important;box-shadow:0 14px 30px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.12) !important}.fh .hero .phone video{border-radius:14px !important}.fh .hero .phone::before{display:none !important}.fh .hero .chip{display:none !important}}'
'</style>')
def apply(s):
    if 'fh-hero-video' in s:
        import re
        return re.sub(r'<style id="fh-hero-video">[\s\S]*?</style>', lambda m: CSS, s, count=1)
    a = s.index('<header class="hero">') + len('<header class="hero">')
    s = s[:a] + INJ + s[a:]
    return s.replace('<header class="hero">', CSS + '<header class="hero">', 1)
if __name__ == '__main__':
    p = sys.argv[3]; t = open(p, encoding='utf8').read(); open(sys.argv[4], 'w', encoding='utf8').write(apply(t)); print('ok')
