"""Composite flat artwork (the GWD mark) onto rendered dioramas, exactly as drawn.

  python scripts/blender/overlay.py <scene[,scene]>

Reads scripts/blender/out/<scene>.overlay.json (written by render.py: the image
and the four projected corners of the surface it sits on) and warps each image
onto out/<scene>.png in place. Run it after render.py and before publish.py.
"""

import json
import os
import sys

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def coeffs(dst, src):
    """Perspective coefficients mapping output (dst) points back to input (src) points."""
    rows = []
    for (x, y), (u, v) in zip(dst, src):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    a = np.array(rows, dtype=float)
    b = np.array(src, dtype=float).reshape(8)
    return np.linalg.solve(a, b).tolist()


def composite(name):
    spec_path = os.path.join(OUT, f'{name}.overlay.json')
    if not os.path.exists(spec_path):
        print(f'{name}: no overlay')
        return
    base = Image.open(os.path.join(OUT, f'{name}.png')).convert('RGBA')
    for o in json.load(open(spec_path)):
        art = Image.open(os.path.join(OUT, o['image'])).convert('RGBA')
        w, h = art.size
        quad = [tuple(p) for p in o['quad']]
        # Supersample the warp for clean edges, then bring it down to size.
        k = 3
        big = (base.width * k, base.height * k)
        warped = art.transform(big, Image.PERSPECTIVE, coeffs([(x * k, y * k) for x, y in quad], [(0, 0), (w, 0), (w, h), (0, h)]), Image.BICUBIC)
        warped = warped.resize(base.size, Image.LANCZOS)
        base = Image.alpha_composite(base, warped)
    base.save(os.path.join(OUT, f'{name}.png'))
    print(f'{name}: composited')


if __name__ == '__main__':
    for n in sys.argv[1].split(','):
        composite(n)
