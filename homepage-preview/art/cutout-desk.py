# Pain-scene set 2 (FOCO behind a desk): key out the black background and normalise the CHARACTER, so FOCO is
# the same size and stands at the same height in all four images. The desk front fades out at the bottom.
# Usage: python homepage-preview/art/cutout-desk.py <src_dir> <out_dir>
import sys
from PIL import Image
import numpy as np

src, out = sys.argv[1], sys.argv[2]
CW, CH = 560, 440          # output canvas
BODY_H, BODY_TOP = 236, 96  # every FOCO body: same height, same top line
for i in range(1, 5):
    im = Image.open('%s/p%d.png' % (src, i)).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    purple = (b > 120) & (b > g * 1.7) & (r > 45) & (r < b)
    rows = np.where(purple.sum(axis=1) > a.shape[1] * .06)[0]
    cols = np.where(purple.sum(axis=0) > a.shape[0] * .05)[0]
    top, bot = rows.min(), rows.max()
    cx = (cols.min() + cols.max()) / 2
    m = a.max(axis=2)
    alpha = np.clip((m - 42) / 40.0, 0, 1)  # drops the black and the dark purple haze, keeps body, props and desk
    rgb = np.clip(a / np.maximum(alpha[..., None], 1e-3), 0, 255)
    rgba = Image.fromarray(np.dstack([np.where(alpha[..., None] > 0, rgb, 0), alpha * 255]).astype(np.uint8), 'RGBA')
    k = BODY_H / float(bot - top)
    rgba = rgba.resize((round(rgba.width * k), round(rgba.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    canvas.alpha_composite(rgba, (round(CW / 2 - cx * k), round(BODY_TOP - top * k))) if False else None
    x, y = round(CW / 2 - cx * k), round(BODY_TOP - top * k)
    big = Image.new('RGBA', (max(CW, rgba.width + abs(x) + CW), max(CH, rgba.height + abs(y) + CH)), (0, 0, 0, 0))
    ox, oy = CW, CH
    big.alpha_composite(rgba, (ox + x, oy + y))
    canvas = big.crop((ox, oy, ox + CW, oy + CH))
    arr = np.asarray(canvas).astype(np.float32)
    fade = np.ones(CH, np.float32)
    start = BODY_TOP + BODY_H + 20
    fade[start:] = np.clip(1 - (np.arange(start, CH) - start) / (CH - start), 0, 1)
    arr[..., 3] *= fade[:, None]
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save('%s/foco-pain-desk-%d.png' % (out, i), optimize=True)
    print(i, 'body', bot - top, 'scale', round(k, 3))
