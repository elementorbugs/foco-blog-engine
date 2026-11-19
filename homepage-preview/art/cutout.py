from PIL import Image
import numpy as np
# Black-background Gemini scenes -> transparent PNG cutouts (alpha from brightness), tightly cropped, same scale.
for i in range(1, 5):
    im = Image.open('.tmp/hp/pain/p%d.png' % i).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    m = a.max(axis=2)
    alpha = np.clip((m - (62 if i == 3 else 26)) / 40.0, 0, 1)  # near-black -> transparent, body/props opaque
    rgb = a / np.maximum(alpha[..., None], 1e-3)  # un-premultiply so edges don't go dark
    rgb = np.clip(np.where(alpha[..., None] > 0, rgb, 0), 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    W, H = im.size
    box = (int(W*.06), int(H*.12), int(W*.94), int(H*.88))  # same box for every scene = same character scale
    c = img.crop(box)
    c.thumbnail((520, 520), Image.LANCZOS)
    c.save('.tmp/hp/livepv/foco-pain-cut-%d.png' % i, optimize=True)
    print(i, c.size)
