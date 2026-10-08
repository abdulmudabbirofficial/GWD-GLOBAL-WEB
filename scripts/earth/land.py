"""Bake the Earth textures for the home globe from world-atlas (Natural Earth).

  python scripts/earth/land.py

Writes public/media/earth/land-4k.webp (and a 2048 copy), an equirectangular map:
  R  land mask (anti-aliased)
  G  distance inland from the coast (0 at the coast, 1 deep inland)
  B  distance offshore from the coast (1 at the coast, fading to 0 at sea)

and public/media/earth/countries-2k.webp, a greyscale mask of the ten
countries GWD works in.
"""

import json
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'node_modules', 'world-atlas', 'land-50m.json')
OUT = os.path.join(ROOT, 'public', 'media', 'earth')
os.makedirs(OUT, exist_ok=True)

W, H = 4096, 2048
SS = 2  # supersample the mask for clean coastlines

topo = json.load(open(SRC, encoding='utf8'))
sx, sy = topo['transform']['scale']
tx, ty = topo['transform']['translate']

arcs = []
for arc in topo['arcs']:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def ring_points(ring):
    out = []
    for i in ring:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts[1:] if out else pts)
    return out


def geoms(obj):
    if obj['type'] == 'GeometryCollection':
        for g in obj['geometries']:
            yield from geoms(g)
    elif obj['type'] == 'Polygon':
        yield obj['arcs']
    elif obj['type'] == 'MultiPolygon':
        yield from obj['arcs']


GWD_COUNTRIES = {'356', '784', '682', '634', '414', '792', '826', '276', '702', '124'}

mask = Image.new('L', (W * SS, H * SS), 0)
draw = ImageDraw.Draw(mask)
PX = lambda lon: (lon + 180) / 360 * W * SS  # noqa: E731
PY = lambda lat: (90 - lat) / 180 * H * SS  # noqa: E731

for poly in geoms(topo['objects']['land']):
    for k, ring in enumerate(poly):
        pts = ring_points(ring)
        # Unwrap longitudes so rings that cross the antimeridian stay continuous.
        un = [pts[0]]
        for lon, lat in pts[1:]:
            plon = un[-1][0]
            while lon - plon > 180:
                lon -= 360
            while lon - plon < -180:
                lon += 360
            un.append((lon, lat))
        span = un[-1][0] - un[0][0]
        xy = [(PX(lon), PY(lat)) for lon, lat in un]
        if abs(span) > 350:
            # A ring around a pole (Antarctica): close it along the bottom edge.
            edge = H * SS if un[0][1] < 0 else 0
            xy += [(xy[-1][0], edge), (xy[0][0], edge)]
        fill = 255 if k == 0 else 0
        for off in (-W * SS, 0, W * SS):
            draw.polygon([(x + off, y) for x, y in xy], fill=fill)

mask = mask.resize((W, H), Image.LANCZOS)
m = np.array(mask)


def draw_polys(topo_obj, keep, img_draw):
    for geom in topo_obj['geometries']:
        if geom.get('id') not in keep:
            continue
        polys = [geom['arcs']] if geom['type'] == 'Polygon' else geom['arcs']
        for poly in polys:
            for k, ring in enumerate(poly):
                pts = ring_points(ring)
                un = [pts[0]]
                for lon, lat in pts[1:]:
                    plon = un[-1][0]
                    while lon - plon > 180:
                        lon -= 360
                    while lon - plon < -180:
                        lon += 360
                    un.append((lon, lat))
                xy = [(PX(lon), PY(lat)) for lon, lat in un]
                for off in (-W * SS, 0, W * SS):
                    img_draw.polygon([(x + off, y) for x, y in xy], fill=255 if k == 0 else 0)


ctopo = json.load(open(os.path.join(ROOT, 'node_modules', 'world-atlas', 'countries-50m.json'), encoding='utf8'))
sx, sy = ctopo['transform']['scale']
tx, ty = ctopo['transform']['translate']
arcs.clear()
for arc in ctopo['arcs']:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
cmask = Image.new('L', (W * SS, H * SS), 0)
draw_polys(ctopo['objects']['countries'], GWD_COUNTRIES, ImageDraw.Draw(cmask))
cm = np.array(cmask.resize((W, H), Image.LANCZOS))
# Singapore is a few pixels wide: give it a visible dot.
sgx, sgy = int((103.82 + 180) / 360 * W), int((90 - 1.35) / 180 * H)
cv2.circle(cm, (sgx, sgy), max(3, W // 1200), 255, -1)
binary = (m > 127).astype(np.uint8)
inland = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
offshore = cv2.distanceTransform(1 - binary, cv2.DIST_L2, 5)
g = np.clip(inland / 120.0, 0, 1) ** 0.6
b = np.clip(1 - offshore / 60.0, 0, 1) ** 2
rgb = np.dstack([m, (g * 255).astype(np.uint8), (b * 255).astype(np.uint8)])
img = Image.fromarray(rgb)
img.save(os.path.join(OUT, 'land-4k.webp'), 'WEBP', quality=90, method=6)
img.resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(OUT, 'land-2k.webp'), 'WEBP', quality=90, method=6)
Image.fromarray(cm).resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(OUT, 'countries-2k.webp'), 'WEBP', quality=90, method=6)
print('land-4k.webp / land-2k.webp / countries-2k.webp written')
