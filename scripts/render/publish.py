"""Grade the path-traced renders and publish them for the site.

  python scripts/render/publish.py

For every scripts/render/out/<name>.png: a light denoise (the traces stop at a
few hundred samples), a gentle contrast curve, then
  public/media/renders/<name>.webp          full size
  public/media/renders/<name>-sm.webp       half width, for cards
and src/content/renders.json with each image's size, a tiny blur placeholder
and the colour of its backdrop (so the page can sit on the same tone).
"""

import base64
import io
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'scripts', 'render', 'out')
DST = os.path.join(ROOT, 'public', 'media', 'renders')
MANIFEST = os.path.join(ROOT, 'src', 'content', 'renders.json')
os.makedirs(DST, exist_ok=True)


def grade(rgb):
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    den = cv2.fastNlMeansDenoisingColored(bgr, None, h=4, hColor=4, templateWindowSize=7, searchWindowSize=21)
    f = cv2.cvtColor(den, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    # Soft S-curve around the mid-tones for a little more depth.
    k = 0.12
    f = f + k * (f - 0.5) * (1 - np.abs(2 * f - 1))
    return (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)


def backdrop(rgb):
    h, w, _ = rgb.shape
    patch = rgb[int(h * 0.02):int(h * 0.08), int(w * 0.02):int(w * 0.08)].reshape(-1, 3)
    r, g, b = np.median(patch, axis=0).astype(int)
    return '#%02x%02x%02x' % (r, g, b)


manifest = {}
for file in sorted(os.listdir(SRC)):
    if not file.endswith('.png'):
        continue
    name = file[:-4]
    rgb = np.array(Image.open(os.path.join(SRC, file)).convert('RGB'))
    out = Image.fromarray(grade(rgb))
    w, h = out.size
    out.save(os.path.join(DST, f'{name}.webp'), 'WEBP', quality=84, method=6)
    out.resize((w // 2, h // 2), Image.LANCZOS).save(os.path.join(DST, f'{name}-sm.webp'), 'WEBP', quality=82, method=6)
    tiny = out.resize((16, max(1, round(16 * h / w))), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, 'WEBP', quality=50)
    manifest[name] = {
        'width': w,
        'height': h,
        'blur': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(),
        'backdrop': backdrop(np.array(out)),
    }
    print(name, w, h, manifest[name]['backdrop'])

with open(MANIFEST, 'w', encoding='utf8') as fh:
    json.dump(manifest, fh, indent=2)
    fh.write('\n')
