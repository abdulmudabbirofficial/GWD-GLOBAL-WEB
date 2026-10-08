"""City, mobility, retail and stadium props for the product dioramas
(NestBridge, Torqio, DreamX, GWD Sports). Same conventions as gwd.py: the
camera looks in from the front-right, so facades worth detailing face -Y
(front) and +X (right)."""

import math
import random

import bmesh
import bpy
from mathutils import Matrix

from gwd import (
    ALU,
    CHROME,
    CLAY,
    CLAY_MID,
    CLAY_WARM,
    GLOW_RED,
    GLOW_WHITE,
    GRAPHITE,
    INK,
    RED_L,
    RUBBER,
    STONE,
    box,
    cyl,
    empty,
    hex_lin,
    mat,
    plane,
    screen_mat,
    sphere,
    torus,
    tube,
)

R = math.radians

GRASS = lambda: mat('grass', hex_lin('#a9bb93'), 0.9)  # noqa: E731
LEAF = lambda: mat('leaf_a', hex_lin('#7d9a63'), 0.75, sss=0.1)  # noqa: E731
LEAF_DARK = lambda: mat('leaf_b', hex_lin('#5a7a4c'), 0.75, sss=0.1)  # noqa: E731
LEAF_PALE = lambda: mat('leaf_c', hex_lin('#9db37c'), 0.75, sss=0.1)  # noqa: E731
TRUNK = lambda: mat('trunk', hex_lin('#6e5a49'), 0.8)  # noqa: E731
ASPHALT = lambda: mat('asphalt', hex_lin('#3b3c42'), 0.92)  # noqa: E731
PAVING = lambda: mat('paving', hex_lin('#d9d7d1'), 0.75)  # noqa: E731
KERB = lambda: mat('kerb', hex_lin('#bcbab4'), 0.7)  # noqa: E731
CONCRETE = lambda: mat('concrete', hex_lin('#c2c1bd'), 0.85)  # noqa: E731
WOOD = lambda: mat('wood', hex_lin('#b4875d'), 0.55)  # noqa: E731
POOL = lambda: mat('pool', hex_lin('#5fb4d3'), 0.04, coat=1.0)  # noqa: E731
PANE = lambda: mat('pane', hex_lin('#2b3644'), 0.06, coat=1.0)  # noqa: E731
PANE_LIT = lambda: mat('pane_lit', hex_lin('#ffe6bf'), 0.3, emission=hex_lin('#ffd9a0'), strength=2.2)  # noqa: E731
LINE = lambda: mat('road_line', hex_lin('#efefe9'), 0.6)  # noqa: E731
CARDBOARD = lambda: mat('cardboard', hex_lin('#cdb38a'), 0.75)  # noqa: E731


def glow(hexc, s=5):
    return mat(f'glow_{hexc}', hex_lin(hexc), 0.4, emission=hex_lin(hexc), strength=s)


def lacquer(hexc, rough=0.3):
    return mat(f'lacq_{hexc}', hex_lin(hexc), rough, coat=1.0)


def matte(hexc, rough=0.6):
    return mat(f'matte_{hexc}', hex_lin(hexc), rough)


# ── Nature and street ─────────────────────────────────────────


def tree(loc, s=1.0, kind='round', parent=None, seed=0):
    rnd = random.Random(seed)
    g = empty(loc, rnd.uniform(0, 6.28), s)
    g.parent = parent
    cyl(0.055, 0.7, (0, 0, 0.35), TRUNK(), parent=g, bevel=0.01, verts=16)
    leaves = [LEAF(), LEAF_DARK(), LEAF_PALE()]
    if kind == 'cone':
        for i, (r, z) in enumerate(((0.42, 0.75), (0.34, 1.05), (0.24, 1.32))):
            cyl(r, 0.5, (0, 0, z), leaves[(i + seed) % 3], r2=0.02, parent=g, bevel=0.02, verts=24)
    else:
        sphere(0.42, (0, 0, 1.0), leaves[seed % 3], seg=24, parent=g)
        for k in range(3):
            a = k * 2.1 + rnd.uniform(-0.3, 0.3)
            sphere(0.28, (math.cos(a) * 0.26, math.sin(a) * 0.26, 0.92 + rnd.uniform(-0.05, 0.2)), leaves[(seed + k + 1) % 3], seg=20, parent=g)
    return g


def hedge(loc, size, parent=None):
    return box(size, loc, LEAF_DARK(), bevel=0.06, parent=parent)


def lamp_post(loc, h=1.7, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    cyl(0.03, h, (0, 0, h / 2), GRAPHITE(), parent=g, verts=16)
    box((0.32, 0.04, 0.04), (0.14, 0, h), GRAPHITE(), bevel=0.01, parent=g)
    box((0.16, 0.09, 0.04), (0.28, 0, h - 0.02), INK(), bevel=0.01, parent=g)
    plane((0.12, 0.06), (0.28, 0, h - 0.045), GLOW_WHITE(12), rot=(R(180), 0, 0), parent=g)
    return g


def road(loc, length, width=1.6, rot_z=0.0, parent=None, dashes=True):
    """A street along local X: asphalt, kerbs and paving either side, a dashed centre line."""
    g = empty(loc, rot_z)
    g.parent = parent
    box((length, width, 0.04), (0, 0, 0.02), ASPHALT(), bevel=0.005, parent=g)
    if dashes:
        n = int(length / 0.7)
        for i in range(n):
            x = -length / 2 + 0.35 + i * 0.7
            box((0.36, 0.05, 0.005), (x, 0, 0.042), LINE(), bevel=0, parent=g)
    return g


def sidewalk(loc, size, parent=None):
    box((size[0], size[1], 0.08), (loc[0], loc[1], loc[2] + 0.04), PAVING(), bevel=0.01, parent=parent)


def bench(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.7, 0.24, 0.04), (0, 0, 0.24), WOOD(), bevel=0.01, parent=g)
    box((0.7, 0.04, 0.2), (0, 0.11, 0.38), WOOD(), bevel=0.01, parent=g)
    for sx in (-1, 1):
        box((0.04, 0.22, 0.24), (sx * 0.3, 0, 0.12), GRAPHITE(), bevel=0.005, parent=g)
    return g


def sign_post(loc, tex, rot_z=0.0, w=0.8, h=0.4, z=0.75, parent=None, strength=0.7):
    g = empty(loc, rot_z)
    g.parent = parent
    for sx in (-1, 1):
        cyl(0.022, z + h / 2, (sx * w * 0.42, 0, (z + h / 2) / 2), GRAPHITE(), parent=g, verts=12)
    box((w + 0.04, 0.03, h + 0.04), (0, 0, z), INK(), bevel=0.006, parent=g)
    plane((w, h), (0, -0.017, z), screen_mat(tex, strength), rot=(R(90), 0, 0), parent=g)
    return g


def fascia(loc, tex, w, h, rot_z=0.0, parent=None, strength=1.0):
    """A shop sign: a thin dark box with the artwork on its front face (-Y)."""
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.04, 0.06, h + 0.04), (0, 0, 0), INK(), bevel=0.01, parent=g)
    plane((w, h), (0, -0.032, 0), screen_mat(tex, strength), rot=(R(90), 0, 0), parent=g)
    return g


def map_pin(loc, color='#e63946', s=1.0, parent=None):
    g = empty(loc, 0, s)
    g.parent = parent
    m = lacquer(color, 0.25)
    sphere(0.2, (0, 0, 0.42), m, seg=32, parent=g)
    cyl(0.17, 0.32, (0, 0, 0.2), m, r2=0.0, rot=(R(180), 0, 0), parent=g, verts=32, bevel=0)
    sphere(0.08, (0, -0.12, 0.44), GLOW_WHITE(3), seg=16, parent=g)
    torus(0.16, 0.012, (0, 0, -0.02), glow(color, 4), parent=g)
    return g


def route(points, color='#e63946', r=0.025, strength=5, parent=None):
    """A glowing path, laid just above the ground."""
    return tube(points, r, glow(color, strength), parent=parent)


# ── Buildings ─────────────────────────────────────────────────


def facade_windows(o_loc, w, d, h, floors, cols_front, cols_side, base=0.0, lit=0.25, parent=None, seed=1, frame=None):
    """Window panes on the two faces the camera sees, floor by floor."""
    rnd = random.Random(seed)
    fh = (h - base) / floors
    x0, y0, z0 = o_loc
    for f in range(floors):
        zc = z0 + base + fh * (f + 0.55)
        for c in range(cols_front):
            x = x0 - w / 2 + (c + 0.5) * w / cols_front
            m = PANE_LIT() if rnd.random() < lit else PANE()
            plane((w / cols_front * 0.62, fh * 0.52), (x, y0 - d / 2 - 0.006, zc), m, rot=(R(90), 0, 0), parent=parent)
            if frame is not None:
                box((w / cols_front * 0.7, 0.03, 0.025), (x, y0 - d / 2 - 0.012, zc - fh * 0.29), frame, bevel=0, parent=parent)
        for c in range(cols_side):
            y = y0 - d / 2 + (c + 0.5) * d / cols_side
            m = PANE_LIT() if rnd.random() < lit else PANE()
            plane((d / cols_side * 0.62, fh * 0.52), (x0 + w / 2 + 0.006, y, zc), m, rot=(R(90), 0, R(90)), parent=parent)
            if frame is not None:
                box((0.03, d / cols_side * 0.7, 0.025), (x0 + w / 2 + 0.012, y, zc - fh * 0.29), frame, bevel=0, parent=parent)


def apartment(loc, w, d, floors, fh=0.42, body=None, accent=None, lit=0.3, seed=1, balconies=True, parent=None):
    """A finished residential block: floor bands, windows, balconies on the front, roof kit."""
    x, y, z = loc
    h = floors * fh
    body = body or CLAY()
    box((w, d, h), (x, y, z + h / 2), body, bevel=0.04, parent=parent)
    band = CLAY_MID()
    for f in range(1, floors):
        box((w + 0.03, d + 0.03, 0.035), (x, y, z + f * fh), band, bevel=0.005, parent=parent)
    facade_windows((x, y, z), w, d, h, floors, max(2, int(w / 0.45)), max(2, int(d / 0.45)), lit=lit, seed=seed, parent=parent)
    if balconies:
        cols = max(2, int(w / 0.9))
        for f in range(1, floors):
            for c in range(cols):
                bx = x - w / 2 + (c + 0.5) * w / cols
                box((w / cols * 0.7, 0.22, 0.03), (bx, y - d / 2 - 0.11, z + f * fh + 0.02), body, bevel=0.005, parent=parent)
                box((w / cols * 0.7, 0.015, 0.12), (bx, y - d / 2 - 0.215, z + f * fh + 0.09), mat('rail_glass', hex_lin('#cfe0ea'), 0.05, transmission=0.8), bevel=0, parent=parent)
                if accent is not None and (c + f + seed) % 4 == 0:
                    box((w / cols * 0.3, 0.02, fh * 0.45), (bx + w / cols * 0.15, y - d / 2 - 0.02, z + f * fh + fh * 0.45), accent, bevel=0.005, parent=parent)
    box((w, d, 0.08), (x, y, z + h + 0.04), CLAY_MID(), bevel=0.02, parent=parent)
    for k, (dx, dy, s) in enumerate(((-0.25, 0.1, 0.35), (0.3, -0.05, 0.28))):
        box((s * w * 0.4, s * d * 0.5, 0.22), (x + dx * w, y + dy * d, z + h + 0.19), GRAPHITE() if k else STONE(), bevel=0.02, parent=parent)
    return h


def construction(loc, w, d, floors_done, floors_frame, fh=0.42, parent=None):
    """A tower going up: finished floors, then bare slabs on columns, scaffolding and a safety net."""
    x, y, z = loc
    apartment((x, y, z), w, d, floors_done, fh, body=CLAY_WARM(), lit=0.0, balconies=False, seed=5, parent=parent)
    top = z + floors_done * fh
    for f in range(floors_frame):
        sz = top + f * fh
        box((w, d, 0.06), (x, y, sz + fh - 0.03), CONCRETE(), bevel=0.01, parent=parent)
        for cx in (-1, -0.33, 0.33, 1):
            for cy in (-1, 1):
                box((0.08, 0.08, fh - 0.06), (x + cx * (w / 2 - 0.05), y + cy * (d / 2 - 0.05), sz + (fh - 0.06) / 2), CONCRETE(), bevel=0.005, parent=parent)
    # scaffolding on the front and right faces of the frame
    alu = ALU()
    zs = top - fh
    ze = top + floors_frame * fh + 0.2
    for i in range(int(w / 0.5) + 1):
        xx = x - w / 2 + i * 0.5
        cyl(0.012, ze - zs, (xx, y - d / 2 - 0.18, (zs + ze) / 2), alu, verts=8, bevel=0, parent=parent)
    for i in range(int(d / 0.5) + 1):
        yy = y - d / 2 + i * 0.5
        cyl(0.012, ze - zs, (x + w / 2 + 0.18, yy, (zs + ze) / 2), alu, verts=8, bevel=0, parent=parent)
    k = 0
    zz = zs
    while zz <= ze:
        cyl(0.012, w + 0.36, (x, y - d / 2 - 0.18, zz), alu, rot=(0, R(90), 0), verts=8, bevel=0, parent=parent)
        cyl(0.012, d + 0.36, (x + w / 2 + 0.18, y, zz), alu, rot=(R(90), 0, 0), verts=8, bevel=0, parent=parent)
        box((w + 0.3, 0.16, 0.015), (x, y - d / 2 - 0.1, zz - 0.01), WOOD(), bevel=0, parent=parent)
        zz += fh
        k += 1
    net = mat('net_red', hex_lin('#e63946'), 0.8, alpha=0.28)
    plane((w * 0.5, (floors_frame - 1) * fh), (x - w * 0.22, y - d / 2 - 0.2, top + (floors_frame - 1) * fh / 2 + 0.1), net, rot=(R(90), 0, 0), parent=parent)
    return top + floors_frame * fh


def crane(loc, h=6.0, jib=4.2, rot_z=0.0, load=True, parent=None):
    """A tower crane: lattice mast, cab, jib with trolley and hook, counter-jib with weights."""
    g = empty(loc, rot_z)
    g.parent = parent
    red = RED_L()
    s = 0.28
    for dx in (-1, 1):
        for dy in (-1, 1):
            cyl(0.018, h, (dx * s / 2, dy * s / 2, h / 2), red, verts=8, bevel=0, parent=g)
    zz = 0.3
    while zz < h:
        for a in range(4):
            ang = a * math.pi / 2
            cx, cy = math.cos(ang) * s / 2, math.sin(ang) * s / 2
            cyl(0.01, s * 1.4, (cx, cy, zz), red, rot=(R(45) if a % 2 == 0 else 0, R(45) if a % 2 else 0, ang + R(90)), verts=6, bevel=0, parent=g)
            box((s if a % 2 == 0 else 0.015, s if a % 2 else 0.015, 0.015), (cx, cy, zz + 0.15), red, bevel=0, parent=g)
        zz += 0.34
    box((0.38, 0.38, 0.3), (0.18, -0.22, h + 0.12), CLAY(), bevel=0.03, parent=g)
    plane((0.3, 0.18), (0.18, -0.415, h + 0.15), mat('cab_glass', hex_lin('#9fc4d6'), 0.05, coat=1.0), rot=(R(90), 0, 0), parent=g)
    box((jib, 0.16, 0.16), (jib / 2, 0, h + 0.36), red, bevel=0.01, parent=g)
    box((jib * 0.95, 0.03, 0.03), (jib * 0.5, 0, h + 0.5), red, bevel=0, parent=g)
    box((1.6, 0.2, 0.14), (-0.8, 0, h + 0.36), red, bevel=0.01, parent=g)
    for i in range(3):
        box((0.22, 0.34, 0.3), (-1.25 + i * 0.24, 0, h + 0.2), CONCRETE(), bevel=0.01, parent=g)
    cyl(0.04, 0.9, (0, 0, h + 0.8), red, verts=12, parent=g)
    tube([(0, 0, h + 1.25), (jib * 0.6, 0, h + 0.46)], 0.006, GRAPHITE(), parent=g)
    tube([(0, 0, h + 1.25), (-1.4, 0, h + 0.44)], 0.006, GRAPHITE(), parent=g)
    tx = jib * 0.62
    box((0.2, 0.2, 0.08), (tx, 0, h + 0.24), GRAPHITE(), bevel=0.01, parent=g)
    drop = h * 0.45
    cyl(0.006, drop, (tx, 0, h + 0.2 - drop / 2), GRAPHITE(), verts=6, bevel=0, parent=g)
    box((0.12, 0.08, 0.1), (tx, 0, h + 0.2 - drop), INK(), bevel=0.01, parent=g)
    if load:
        box((0.6, 0.4, 0.22), (tx, 0, h + 0.2 - drop - 0.2), CONCRETE(), bevel=0.01, parent=g)
    sphere(0.04, (jib, 0, h + 0.47), GLOW_RED(10), seg=12, parent=g)
    sphere(0.04, (0, 0, h + 1.27), GLOW_RED(10), seg=12, parent=g)
    return g


def villa(loc, rot_z=0.0, body=None, accent=None, pool=False, lit=0.4, parent=None, seed=2):
    """A modern two-storey villa on its plot: lawn, compound wall with a gate, a tree, maybe a pool."""
    g = empty(loc, rot_z)
    g.parent = parent
    body = body or CLAY()
    rnd = random.Random(seed)
    box((3.2, 3.0, 0.05), (0, 0, 0.025), GRASS(), bevel=0.01, parent=g)
    wall = CLAY_MID()
    box((3.2, 0.08, 0.28), (0, -1.46, 0.14), wall, bevel=0.01, parent=g)
    box((0.08, 3.0, 0.28), (1.56, 0, 0.14), wall, bevel=0.01, parent=g)
    box((0.7, 0.04, 0.26), (-0.6, -1.46, 0.15), GRAPHITE(), bevel=0.005, parent=g)
    box((1.0, 0.6, 0.02), (-0.6, -1.0, 0.055), PAVING(), bevel=0.005, parent=g)
    # ground floor, upper floor cantilevered, timber panel, big glass
    box((1.9, 1.5, 0.78), (-0.35, 0.55, 0.44), body, bevel=0.03, parent=g)
    box((2.1, 1.3, 0.7), (-0.15, 0.6, 1.18), body, bevel=0.03, parent=g)
    box((0.6, 0.04, 0.7), (-1.0, -0.21, 1.18), WOOD(), bevel=0.005, parent=g)
    box((2.2, 1.4, 0.06), (-0.15, 0.6, 1.56), GRAPHITE(), bevel=0.01, parent=g)
    lit_m = PANE_LIT() if rnd.random() < lit else PANE()
    plane((1.1, 0.55), (-0.15, -0.205, 0.42), PANE_LIT() if rnd.random() < lit else PANE(), rot=(R(90), 0, 0), parent=g)
    plane((1.2, 0.5), (0.3, -0.055, 1.18), lit_m, rot=(R(90), 0, 0), parent=g)
    plane((0.9, 0.5), (0.956, 0.6, 1.18), PANE(), rot=(R(90), 0, R(90)), parent=g)
    plane((0.7, 0.5), (0.606, 0.7, 0.44), PANE(), rot=(R(90), 0, R(90)), parent=g)
    box((0.3, 0.04, 0.6), (-1.0, -0.205, 0.35), accent or GRAPHITE(), bevel=0.005, parent=g)
    box((1.2, 0.3, 0.04), (0.3, -0.2, 0.85), body, bevel=0.005, parent=g)
    if pool:
        box((1.1, 0.9, 0.04), (0.85, -0.75, 0.06), POOL(), bevel=0.01, parent=g)
        box((1.25, 1.05, 0.05), (0.85, -0.75, 0.035), PAVING(), bevel=0.01, parent=g)
        for k in range(2):
            box((0.16, 0.42, 0.04), (0.2 + k * 0.22, -0.95, 0.1), CLAY_WARM(), bevel=0.01, rot=(R(10), 0, 0), parent=g)
    tree((1.1, 1.1, 0.05), 0.8, 'round', parent=g, seed=seed)
    hedge((-1.2, -1.2, 0.15), (0.6, 0.3, 0.22), parent=g)
    return g


def open_top(w, d, h, parent=None, m=None):
    """In place of a roof (which would hide the room from the camera): a front beam and a short strip at the back."""
    m = m or GRAPHITE()
    box((w + 0.12, 0.16, 0.14), (0, -d / 2 + 0.02, h + 0.07), m, bevel=0.02, parent=parent)
    box((w + 0.12, 0.5, 0.1), (0, d / 2 - 0.19, h + 0.05), m, bevel=0.02, parent=parent)
    box((0.16, d, 0.1), (-w / 2 + 0.02, 0, h + 0.05), m, bevel=0.02, parent=parent)


def kiosk(loc, tex, rot_z=0.0, w=1.8, d=1.3, h=1.1, parent=None, accent=None):
    """A small branded office or store, cut away at the front: back and side walls, roof, fascia."""
    g = empty(loc, rot_z)
    g.parent = parent
    floor = mat('kiosk_floor', hex_lin('#e8e6e1'), 0.4, coat=0.3)
    box((w, d, 0.05), (0, 0, 0.025), floor, bevel=0.01, parent=g)
    box((w, 0.08, h), (0, d / 2 - 0.04, h / 2), CLAY(), bevel=0.02, parent=g)
    box((0.08, d, h), (-w / 2 + 0.04, 0, h / 2), CLAY(), bevel=0.02, parent=g)
    open_top(w, d, h, parent=g)
    fascia((0, -d / 2 - 0.08, h - 0.12), tex, w * 0.86, w * 0.86 / 3, parent=g)
    for sx in (-1, 1):
        box((0.07, 0.07, h), (sx * (w / 2 - 0.035), -d / 2 + 0.035, h / 2), GRAPHITE(), bevel=0.01, parent=g)
    if accent is not None:
        box((w * 0.5, 0.3, 0.42), (0.1, 0.1, 0.26), accent, bevel=0.02, parent=g)
    return g


# ── Vehicles ──────────────────────────────────────────────────


def wheel(loc, r, wdt, parent=None):
    cyl(r, wdt, loc, RUBBER(), rot=(R(90), 0, 0), parent=parent, verts=32)
    cyl(r * 0.55, wdt * 1.02, loc, ALU(), rot=(R(90), 0, 0), parent=parent, verts=24)


def suv(loc, rot_z=0.0, body=None, scale=1.0, parent=None):
    g = empty(loc, rot_z, scale)
    g.parent = parent
    b = body or CLAY()
    tint = mat('tint', hex_lin('#1a1c22'), 0.08, coat=1.0)
    box((2.3, 1.05, 0.6), (0, 0, 0.58), b, bevel=0.16, parent=g)
    box((1.6, 1.0, 0.5), (-0.2, 0, 1.05), b, bevel=0.16, parent=g)
    box((1.42, 1.02, 0.36), (-0.2, 0, 1.06), tint, bevel=0.08, parent=g)
    box((2.0, 0.9, 0.04), (-0.2, 0, 1.33), GRAPHITE(), bevel=0.01, parent=g)
    for x in (-0.75, 0.75):
        for y in (-0.5, 0.5):
            wheel((x, y, 0.3), 0.3, 0.22, parent=g)
    for y in (-0.35, 0.35):
        box((0.04, 0.2, 0.08), (1.15, y, 0.66), GLOW_WHITE(3), bevel=0.01, parent=g)
        box((0.04, 0.16, 0.08), (-1.15, y, 0.66), GLOW_RED(4), bevel=0.01, parent=g)
    return g


def sedan(loc, rot_z=0.0, body=None, scale=1.0, parent=None):
    g = empty(loc, rot_z, scale)
    g.parent = parent
    b = body or CLAY()
    tint = mat('tint', hex_lin('#1a1c22'), 0.08, coat=1.0)
    box((2.6, 1.0, 0.42), (0, 0, 0.45), b, bevel=0.17, parent=g)
    box((1.3, 0.92, 0.42), (-0.1, 0, 0.82), b, bevel=0.2, parent=g)
    box((1.12, 0.94, 0.3), (-0.1, 0, 0.84), tint, bevel=0.1, parent=g)
    for x in (-0.85, 0.85):
        for y in (-0.48, 0.48):
            wheel((x, y, 0.25), 0.25, 0.2, parent=g)
    for y in (-0.33, 0.33):
        box((0.04, 0.2, 0.06), (1.3, y, 0.5), GLOW_WHITE(3), bevel=0.01, parent=g)
        box((0.04, 0.2, 0.06), (-1.3, y, 0.5), GLOW_RED(4), bevel=0.01, parent=g)
    return g


def hatch(loc, rot_z=0.0, body=None, scale=1.0, parent=None):
    from props import car

    return car(loc, rot_z=rot_z, body=body, scale=scale, parent=parent)


def truck(loc, rot_z=0.0, body=None, cargo=None, stripe=None, scale=1.0, parent=None):
    """A light commercial truck: cab, chassis, a box body with a stripe, twin rear wheels."""
    g = empty(loc, rot_z, scale)
    g.parent = parent
    b = body or CLAY()
    tint = mat('tint', hex_lin('#1a1c22'), 0.08, coat=1.0)
    box((3.4, 0.9, 0.14), (-0.2, 0, 0.42), GRAPHITE(), bevel=0.02, parent=g)
    box((0.95, 1.1, 1.05), (1.15, 0, 0.98), b, bevel=0.12, parent=g)
    box((0.06, 0.95, 0.4), (1.62, 0, 1.15), tint, bevel=0.02, parent=g)
    box((0.6, 1.12, 0.32), (1.2, 0, 1.15), tint, bevel=0.04, parent=g)
    box((2.3, 1.15, 1.25), (-0.55, 0, 1.12), cargo or CLAY_WARM(), bevel=0.04, parent=g)
    box((2.32, 1.17, 0.12), (-0.55, 0, 0.82), stripe or RED_L(), bevel=0.01, parent=g)
    for x in (1.15, -0.9, -1.3):
        for y in (-0.48, 0.48):
            wheel((x, y, 0.3), 0.3, 0.2, parent=g)
    for y in (-0.38, 0.38):
        box((0.04, 0.18, 0.1), (1.63, y, 0.62), GLOW_WHITE(3), bevel=0.01, parent=g)
    return g


def scooter(loc, rot_z=0.0, body=None, box_tex=None, rider=None, parent=None):
    """A scooter along local X, optionally with a branded delivery box and a rider."""
    g = empty(loc, rot_z)
    g.parent = parent
    b = body or RED_L()
    for x in (-0.42, 0.45):
        cyl(0.16, 0.08, (x, 0, 0.16), RUBBER(), rot=(R(90), 0, 0), parent=g, verts=24)
        cyl(0.08, 0.085, (x, 0, 0.16), ALU(), rot=(R(90), 0, 0), parent=g, verts=16)
    box((0.7, 0.26, 0.08), (0, 0, 0.26), GRAPHITE(), bevel=0.03, parent=g)
    box((0.42, 0.3, 0.24), (-0.28, 0, 0.38), b, bevel=0.1, parent=g)
    box((0.4, 0.24, 0.06), (-0.25, 0, 0.53), INK(), bevel=0.03, parent=g)
    box((0.12, 0.26, 0.5), (0.36, 0, 0.45), b, bevel=0.05, rot=(0, R(-18), 0), parent=g)
    cyl(0.015, 0.5, (0.43, 0, 0.74), GRAPHITE(), rot=(R(90), 0, 0), parent=g, verts=8)
    sphere(0.05, (0.46, 0, 0.62), GLOW_WHITE(4), seg=12, parent=g)
    if box_tex:
        bx = empty((-0.52, 0, 0.78), 0)
        bx.parent = g
        box((0.44, 0.44, 0.4), (0, 0, 0), lacquer('#B4005A'), bevel=0.04, parent=bx)
        plane((0.32, 0.11), (0, -0.224, 0.03), screen_mat(box_tex, 0.8), rot=(R(90), 0, 0), parent=bx)
        plane((0.32, 0.11), (0.224, 0, 0.03), screen_mat(box_tex, 0.8), rot=(R(90), 0, R(90)), parent=bx)
    if rider is not None:
        from gwd import person

        p = person((-0.12, 0, 0.0), rot_z=R(90), pose='sit', body=rider, scale=0.95, parent=g)
        p.location.z = -0.05
        sphere(0.16, (-0.17, 0.0, 1.22), lacquer('#141418', 0.2), seg=24, scale=(1, 1, 0.9), parent=g)
    return g


def motorbike(loc, rot_z=0.0, body=None, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    b = body or INK()
    for x in (-0.48, 0.5):
        cyl(0.2, 0.09, (x, 0, 0.2), RUBBER(), rot=(R(90), 0, 0), parent=g, verts=28)
        cyl(0.11, 0.095, (x, 0, 0.2), ALU(), rot=(R(90), 0, 0), parent=g, verts=16)
    box((0.5, 0.2, 0.2), (0.02, 0, 0.4), CHROME(), bevel=0.05, parent=g)
    box((0.42, 0.26, 0.18), (0.12, 0, 0.6), b, bevel=0.08, parent=g)
    box((0.42, 0.2, 0.07), (-0.25, 0, 0.6), INK(), bevel=0.03, parent=g)
    box((0.06, 0.06, 0.5), (0.42, 0, 0.45), GRAPHITE(), bevel=0.01, rot=(0, R(-25), 0), parent=g)
    cyl(0.015, 0.5, (0.48, 0, 0.76), GRAPHITE(), rot=(R(90), 0, 0), parent=g, verts=8)
    sphere(0.06, (0.55, 0, 0.66), GLOW_WHITE(4), seg=12, parent=g)
    return g


def car_lift(loc, rot_z=0.0, raised=0.9, car_body=None, parent=None):
    """A two-post lift with a car raised on its arms."""
    g = empty(loc, rot_z)
    g.parent = parent
    for sy in (-1, 1):
        box((0.22, 0.22, 2.0), (0, sy * 0.85, 1.0), RED_L(), bevel=0.02, parent=g)
        box((0.4, 0.4, 0.04), (0, sy * 0.85, 0.02), GRAPHITE(), bevel=0.01, parent=g)
        for sx in (-1, 1):
            box((0.9, 0.08, 0.06), (sx * 0.42, sy * 0.6, raised - 0.04), GRAPHITE(), bevel=0.01, rot=(0, 0, R(sy * sx * 12)), parent=g)
    box((0.1, 1.9, 0.12), (0, 0, 2.02), RED_L(), bevel=0.02, parent=g)
    from props import car

    car((0, 0, raised - 0.1), rot_z=0, body=car_body or CLAY(), parent=g)
    return g


def tyre_stack(loc, n=4, parent=None):
    for i in range(n):
        cyl(0.24, 0.14, (loc[0], loc[1], loc[2] + 0.07 + i * 0.145), RUBBER(), parent=parent, verts=28)
        cyl(0.12, 0.145, (loc[0], loc[1], loc[2] + 0.07 + i * 0.145), INK(), parent=parent, verts=20)


def parts_shelf(loc, w=1.6, levels=4, rot_z=0.0, parent=None, seed=3):
    """Metal shelving stocked with boxed parts, discs and filters."""
    rnd = random.Random(seed)
    g = empty(loc, rot_z)
    g.parent = parent
    d = 0.42
    h = 0.42 * levels + 0.1
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.035, 0.035, h), (sx * w / 2, sy * d / 2, h / 2), GRAPHITE(), bevel=0.003, parent=g)
    colours = [CARDBOARD(), RED_L(), GRAPHITE(), CLAY(), CARDBOARD(), STONE()]
    for l in range(levels):
        z = 0.08 + l * 0.42
        box((w, d, 0.025), (0, 0, z), ALU(), bevel=0.003, parent=g)
        x = -w / 2 + 0.06
        while x < w / 2 - 0.15:
            kind = rnd.random()
            if kind < 0.6:
                bw = rnd.uniform(0.14, 0.26)
                bh = rnd.uniform(0.12, 0.28)
                box((bw, d * 0.8, bh), (x + bw / 2, 0, z + 0.0125 + bh / 2), rnd.choice(colours), bevel=0.01, parent=g)
                x += bw + 0.03
            elif kind < 0.8:
                cyl(0.1, 0.03, (x + 0.1, 0, z + 0.12), ALU(), rot=(R(90), 0, 0), parent=g, verts=24)
                x += 0.22
            else:
                cyl(0.06, 0.16, (x + 0.06, 0, z + 0.093), RED_L() if rnd.random() < 0.5 else INK(), parent=g, verts=16)
                x += 0.15
    return g


def tool_cabinet(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.7, 0.45, 0.85), (0, 0, 0.48), RED_L(), bevel=0.02, parent=g)
    for i in range(5):
        box((0.62, 0.02, 0.012), (0, -0.23, 0.2 + i * 0.15), CHROME(), bevel=0, parent=g)
    for sx in (-1, 1):
        cyl(0.04, 0.04, (sx * 0.28, -0.15, 0.04), RUBBER(), rot=(R(90), 0, 0), parent=g, verts=12)
    box((0.3, 0.2, 0.06), (0.1, 0, 0.94), GRAPHITE(), bevel=0.01, parent=g)
    return g


# ── Retail ────────────────────────────────────────────────────


def garment(loc, colour, kind='shirt', parent=None, rot_z=0.0):
    m = matte(colour, 0.85)
    if kind == 'dress':
        cyl(0.12, 0.42, (loc[0], loc[1], loc[2] - 0.24), m, r2=0.05, rot=(0, 0, rot_z), parent=parent, verts=20, bevel=0.01)
    else:
        box((0.04, 0.24, 0.32), (loc[0], loc[1], loc[2] - 0.18), m, bevel=0.015, rot=(0, 0, rot_z), parent=parent)
        box((0.04, 0.36, 0.08), (loc[0], loc[1], loc[2] - 0.06), m, bevel=0.015, rot=(0, 0, rot_z), parent=parent)
    cyl(0.006, 0.06, (loc[0], loc[1], loc[2] + 0.02), CHROME(), parent=parent, verts=6, bevel=0)


def clothing_rack(loc, w=1.0, rot_z=0.0, colours=None, kind='shirt', parent=None, seed=4):
    """A chrome rail of garments, hung side-on (across local Y)."""
    rnd = random.Random(seed)
    g = empty(loc, rot_z)
    g.parent = parent
    colours = colours or ['#20283a', '#e9e4da', '#7a1f45', '#5b6e8c', '#c9b79c']
    for sx in (-1, 1):
        cyl(0.015, 1.05, (sx * w / 2, 0, 0.53), CHROME(), parent=g, verts=8)
        box((0.04, 0.36, 0.02), (sx * w / 2, 0, 0.01), CHROME(), bevel=0.005, parent=g)
    cyl(0.012, w, (0, 0, 1.04), CHROME(), rot=(0, R(90), 0), parent=g, verts=8)
    n = int(w / 0.09)
    for i in range(n):
        x = -w / 2 + 0.08 + i * (w - 0.16) / max(1, n - 1)
        garment((x, 0, 1.0), rnd.choice(colours), kind if rnd.random() < 0.8 else ('dress' if kind == 'shirt' else 'shirt'), parent=g)
    return g


def mannequin(loc, rot_z=0.0, dress='#B4005A', kind='dress', parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    form = mat('mannequin', hex_lin('#f1eee8'), 0.35, coat=0.4)
    cyl(0.14, 0.03, (0, 0, 0.015), CHROME(), parent=g, verts=24)
    cyl(0.012, 0.5, (0, 0, 0.27), CHROME(), parent=g, verts=8)
    m = matte(dress, 0.8)
    if kind == 'dress':
        cyl(0.24, 0.62, (0, 0, 0.78), m, r2=0.11, parent=g, verts=28, bevel=0.02)
        cyl(0.11, 0.3, (0, 0, 1.24), m, r2=0.13, parent=g, verts=24, bevel=0.03)
    else:
        cyl(0.1, 0.55, (0, 0, 0.78), matte('#2b2f3a'), r2=0.12, parent=g, verts=24, bevel=0.02)
        cyl(0.15, 0.42, (0, 0, 1.22), m, r2=0.17, parent=g, verts=24, bevel=0.04)
        for sx in (-1, 1):
            cyl(0.045, 0.4, (sx * 0.19, 0, 1.18), m, parent=g, verts=12, bevel=0.01)
    cyl(0.04, 0.08, (0, 0, 1.45), form, parent=g, verts=12)
    sphere(0.1, (0, 0, 1.56), form, seg=24, scale=(0.9, 0.9, 1.1), parent=g)
    return g


def awning(loc, w, depth=0.5, colours=('#ffffff', '#e63946'), rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    n = max(4, int(w / 0.18))
    sw = w / n
    for i in range(n):
        box((sw, depth, 0.025), (-w / 2 + sw * (i + 0.5), -depth / 2, 0), matte(colours[i % 2], 0.7), bevel=0.004, rot=(R(-18), 0, 0), parent=g)
    return g


def boutique(loc, sign_tex, w=2.4, d=1.8, h=1.7, rot_z=0.0, colours=None, accent='#B4005A', awning_cols=None, kind='shirt', parent=None, seed=5):
    """An open-fronted clothing store: back and left walls, shopfront fascia, an awning, racks and a mannequin."""
    g = empty(loc, rot_z)
    g.parent = parent
    floor = mat('shop_floor', hex_lin('#efebe4'), 0.35, coat=0.3)
    box((w, d, 0.05), (0, 0, 0.025), floor, bevel=0.01, parent=g)
    box((w, 0.1, h), (0, d / 2 - 0.05, h / 2), CLAY_WARM(), bevel=0.02, parent=g)
    box((0.1, d, h), (-w / 2 + 0.05, 0, h / 2), CLAY_WARM(), bevel=0.02, parent=g)
    open_top(w, d, h, parent=g)
    fascia((0, -d / 2 - 0.09, h - 0.15), sign_tex, w * 0.8, w * 0.8 * 3 / 8, parent=g, strength=0.9)
    for sx in (-1, 1):
        box((0.08, 0.08, h), (sx * (w / 2 - 0.04), -d / 2 + 0.04, h / 2), GRAPHITE(), bevel=0.01, parent=g)
    awning((0, -d / 2 - 0.06, h - 0.42), w * 0.92, 0.55, awning_cols or ('#f6f2ea', accent), parent=g)
    clothing_rack((-0.2, d / 2 - 0.35, 0.05), w=w * 0.6, colours=colours, kind=kind, parent=g, seed=seed)
    clothing_rack((-w / 2 + 0.35, -0.05, 0.05), w=d * 0.55, rot_z=R(90), colours=colours, kind=kind, parent=g, seed=seed + 1)
    mannequin((w / 2 - 0.45, -d / 2 + 0.45, 0.05), R(20), dress=accent, kind='dress' if kind == 'dress' else 'top', parent=g)
    box((0.5, 0.4, 0.5), (w / 2 - 0.4, d / 2 - 0.4, 0.3), GRAPHITE(), bevel=0.02, parent=g)
    for i in range(3):
        box((0.3, 0.25, 0.04), (w / 2 - 0.4, d / 2 - 0.4, 0.57 + i * 0.045), matte((colours or ['#20283a', '#e9e4da', '#7a1f45'])[i % 3], 0.8), bevel=0.01, parent=g)
    return g


# ── Stadium ───────────────────────────────────────────────────


def crowd(points, palette, scale=1.0, cheer=0.25, name='crowd', seed=7):
    """Hundreds of spectators as one mesh: a torso, a head, and for some a raised arm."""
    rnd = random.Random(seed)
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    mats = [mat(f'crowd_{c}', hex_lin(c), 0.6) for c in palette]
    skin = [mat(f'crowd_skin_{c}', hex_lin(c), 0.5, sss=0.2) for c in ('#e3c7b0', '#c9a083', '#a87b5e', '#7d5a45')]
    hair = mat('crowd_hair', hex_lin('#1d1d21'), 0.6)

    def tag(res, index):
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = index

    for x, y, z in points:
        s = scale * rnd.uniform(0.9, 1.08)
        ci = rnd.randrange(len(mats))
        tag(bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, z + 0.17 * s)) @ Matrix.Diagonal((0.22 * s, 0.15 * s, 0.32 * s, 1))), ci)
        tag(bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.085 * s, matrix=Matrix.Translation((x, y, z + 0.43 * s))), len(mats) + rnd.randrange(len(skin)))
        if rnd.random() < 0.6:
            tag(bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.088 * s, matrix=Matrix.Translation((x, y + 0.012, z + 0.47 * s)) @ Matrix.Diagonal((1, 1, 0.65, 1))), len(mats) + len(skin))
        if rnd.random() < cheer:
            side = rnd.choice((-1, 1))
            tag(bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x + side * 0.12 * s, y, z + 0.5 * s)) @ Matrix.Diagonal((0.05 * s, 0.05 * s, 0.3 * s, 1))), ci)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for m in mats + skin + [hair]:
        o.data.materials.append(m)
    return o


def stand(origin, length, rows, axis='x', facing=-1, step_d=0.42, step_h=0.26, seat='#2c2d33', palette=None, fill=0.9, seed=11, scale=0.82):
    """A tiered grandstand along an axis. facing is the direction the crowd looks
    (-1 toward -Y / -X). Returns the top height."""
    rnd = random.Random(seed)
    ox, oy, oz = origin
    seat_m = lacquer(seat, 0.4)
    pts = []
    for r in range(rows):
        z = oz + (r + 1) * step_h
        off = -facing * (r + 0.5) * step_d
        if axis == 'x':
            box((length, step_d, (r + 1) * step_h), (ox, oy + off, oz + (r + 1) * step_h / 2), CONCRETE(), bevel=0.01)
            box((length, 0.08, 0.06), (ox, oy + off + facing * step_d * 0.3, z + 0.03), seat_m, bevel=0.005)
        else:
            box((step_d, length, (r + 1) * step_h), (ox + off, oy, oz + (r + 1) * step_h / 2), CONCRETE(), bevel=0.01)
            box((0.08, length, 0.06), (ox + off + facing * step_d * 0.3, oy, z + 0.03), seat_m, bevel=0.005)
        n = int(length / 0.27)
        for i in range(n):
            if rnd.random() > fill:
                continue
            t = -length / 2 + 0.15 + i * (length - 0.3) / max(1, n - 1)
            jitter = rnd.uniform(-0.03, 0.03)
            if axis == 'x':
                pts.append((ox + t + jitter, oy + off - facing * 0.04, z + 0.02))
            else:
                pts.append((ox + off - facing * 0.04, oy + t + jitter, z + 0.02))
    crowd(pts, palette or ['#e63946', '#f2f2f0', '#2c2d33', '#e63946', '#b40001', '#5b6e8c', '#f2f2f0'], scale=scale, seed=seed)
    return oz + rows * step_h
