"""Render one or more GWD dioramas.

  blender -b --factory-startup --python scripts/blender/render.py -- <scene[,scene]> [size=1600] [samples=160]

Writes scripts/blender/out/<scene>.png (RGBA, with shadows on a shadow catcher), and
<scene>.overlay.json when the scene places flat artwork (see overlay.py).
"""

import importlib
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gwd  # noqa: E402
import scenes  # noqa: E402
import scenes_extra  # noqa: E402
import props_city  # noqa: E402
import scenes_products  # noqa: E402
import scenes_dress  # noqa: E402

importlib.reload(gwd)
importlib.reload(scenes)
importlib.reload(scenes_extra)
importlib.reload(props_city)
importlib.reload(scenes_products)
importlib.reload(scenes_dress)
ALL = scenes_dress.dressed({**scenes.SCENES, **scenes_extra.EXTRA, **scenes_products.PRODUCTS})

argv = sys.argv[sys.argv.index('--') + 1 :] if '--' in sys.argv else []
names = argv[0].split(',') if argv else list(ALL)
size = int(argv[1]) if len(argv) > 1 else 1600
samples = int(argv[2]) if len(argv) > 2 else 160
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')

for name in names:
    spec = ALL[name]
    w, h = spec.get('aspect', (1, 1))
    t0 = time.time()
    gwd._mats.clear()
    gwd.OVERLAYS.clear()
    gwd.reset(samples=samples, size=(size, round(size * h / w)), transparent=spec.get('transparent', True))
    spec['build']()
    gwd.save(os.path.join(out, f'{name}.png'))
    print(f'RENDERED {name} {time.time() - t0:.0f}s', flush=True)
