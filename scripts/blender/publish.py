"""Publish the Blender dioramas for the site.

  python scripts/blender/publish.py [name,name]

scripts/blender/out/<name>.png (RGBA) → public/media/renders/<name>.<hash>.webp
(with alpha, trimmed to the content plus a margin) and <name>.<hash>-sm.webp,
merged into src/content/renders.json (alpha: true, `file` = the versioned stem).
Names replace older renders; the hash changes whenever the image does.
"""

import base64
import io
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media'))
from versioned import webp_bytes, write_versioned  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'scripts', 'blender', 'out')
DST = os.path.join(ROOT, 'public', 'media', 'renders')
MANIFEST = os.path.join(ROOT, 'src', 'content', 'renders.json')

only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
manifest = json.load(open(MANIFEST, encoding='utf8')) if os.path.exists(MANIFEST) else {}
for file in sorted(os.listdir(SRC)):
    if not file.endswith('.png'):
        continue
    name = file[:-4]
    if only and name not in only:
        continue
    im = Image.open(os.path.join(SRC, file)).convert('RGBA')
    # Trim to the visible content (including soft shadows) with an even margin.
    bbox = im.getchannel('A').point(lambda a: 255 if a > 6 else 0).getbbox()
    if bbox:
        m = int(max(im.size) * 0.03)
        bbox = (max(0, bbox[0] - m), max(0, bbox[1] - m), min(im.width, bbox[2] + m), min(im.height, bbox[3] + m))
        im = im.crop(bbox)
    w, h = im.size
    sm = im.copy()
    sm.thumbnail((w // 2, h // 2), Image.LANCZOS)
    big_name = write_versioned(DST, name, webp_bytes(im, 88), webp_bytes(sm, 86))
    tiny = im.copy()
    tiny.thumbnail((16, 16), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, 'WEBP', quality=50)
    manifest[name] = {
        'file': big_name[:-5],
        'width': w,
        'height': h,
        'blur': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(),
        'backdrop': 'transparent',
        'alpha': True,
    }
    print(name, w, h)

with open(MANIFEST, 'w', encoding='utf8') as fh:
    json.dump(manifest, fh, indent=2)
    fh.write('\n')
