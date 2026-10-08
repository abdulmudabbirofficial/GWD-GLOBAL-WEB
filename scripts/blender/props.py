"""More diorama props for the GWD kit (see gwd.py)."""

import math

from gwd import (
    ALU,
    CLAY,
    CLAY_MID,
    GLASS,
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
)

R = math.radians


def plant2(loc, s=1.0, parent=None, leaf=None):
    """A potted plant with long leaves fanning out."""
    g = empty(loc, 0, s)
    g.parent = parent
    cyl(0.18, 0.34, (0, 0, 0.17), GRAPHITE(), r2=0.14, parent=g)
    lm = leaf or mat('leaf', hex_lin('#5f6b62'), 0.6)
    for i in range(9):
        a = i * 2.4
        tilt = 0.35 + (i % 3) * 0.18
        o = sphere(0.09, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.62 + (i % 3) * 0.08), lm, seg=20, scale=(1, 0.45, 4.2), parent=g)
        o.rotation_euler = (math.cos(a) * tilt, math.sin(a) * -tilt, a)
    return g


def keyboard(loc, rot_z=0.0, parent=None):
    return box((0.55, 0.18, 0.025), loc, GRAPHITE(), bevel=0.008, rot=(0, 0, rot_z), parent=parent)


def mug(loc, m=None, parent=None):
    return cyl(0.05, 0.11, loc, m or RED_L(), parent=parent, bevel=0.005)


def lamp(loc, parent=None):
    g = empty(loc)
    g.parent = parent
    cyl(0.12, 0.03, (0, 0, 0.015), GRAPHITE(), parent=g)
    cyl(0.015, 0.45, (0, 0, 0.24), ALU(), rot=(R(10), 0, 0), parent=g)
    cyl(0.12, 0.14, (0, 0.06, 0.48), RED_L(), r2=0.05, rot=(R(150), 0, 0), parent=g)
    return g


def shelf(loc, w=1.6, levels=3, rot_z=0.0, parent=None, items=True):
    g = empty(loc, rot_z)
    g.parent = parent
    for i in range(levels):
        box((w, 0.35, 0.04), (0, 0, 0.4 + i * 0.5), CLAY(), bevel=0.01, parent=g)
        if items:
            for k in range(4):
                x = -w / 2 + 0.2 + k * (w - 0.4) / 3
                kind = (i * 4 + k) % 4
                if kind == 0:
                    box((0.06, 0.25, 0.3), (x, 0, 0.57 + i * 0.5), GRAPHITE(), bevel=0.005, parent=g)
                    box((0.06, 0.25, 0.26), (x + 0.07, 0, 0.55 + i * 0.5), RED_L(), bevel=0.005, parent=g)
                elif kind == 1:
                    box((0.22, 0.2, 0.18), (x, 0, 0.51 + i * 0.5), CLAY_MID(), bevel=0.02, parent=g)
                elif kind == 2:
                    sphere(0.09, (x, 0, 0.51 + i * 0.5), INK(), parent=g)
                else:
                    cyl(0.07, 0.22, (x, 0, 0.53 + i * 0.5), STONE(), parent=g)
    for sx in (-1, 1):
        box((0.04, 0.35, levels * 0.5), (sx * w / 2, 0, 0.15 + levels * 0.25), GRAPHITE(), bevel=0.005, parent=g)
    return g


def frame(loc, tex, w=0.8, h=0.6, rot_z=0.0, parent=None, z=2.0):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.06, 0.04, h + 0.06), (0, 0, z), INK(), bevel=0.005, parent=g)
    plane((w, h), (0, -0.025, z), screen_mat(tex, 0.6), rot=(R(90), 0, 0), parent=g)
    return g


def rug(loc, w, d, m=None, parent=None):
    return box((w, d, 0.02), loc, m or CLAY_MID(), bevel=0.01, parent=parent)


def sofa(loc, rot_z=0.0, m=None, parent=None, w=1.8):
    g = empty(loc, rot_z)
    g.parent = parent
    c = m or GRAPHITE()
    box((w, 0.8, 0.35), (0, 0, 0.22), c, bevel=0.08, parent=g)
    box((w, 0.22, 0.45), (0, 0.32, 0.55), c, bevel=0.08, parent=g)
    for sx in (-1, 1):
        box((0.2, 0.8, 0.5), (sx * (w / 2 - 0.1), 0, 0.3), c, bevel=0.08, parent=g)
    return g


def sticky_wall(loc, cols=6, rows=4, rot_z=0.0, parent=None, z=1.3):
    g = empty(loc, rot_z)
    g.parent = parent
    palette = [RED_L(), CLAY(), CLAY_MID(), mat('note_y', hex_lin('#f2e6c9'), 0.7), GRAPHITE()]
    for i in range(cols):
        for j in range(rows):
            box((0.22, 0.02, 0.22), (-cols * 0.14 + i * 0.28, 0, z + j * 0.28), palette[(i * 3 + j * 2) % len(palette)], bevel=0.003, parent=g)
    return g


def door(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.95, 0.06, 2.1), (0, 0, 1.05), CLAY_MID(), bevel=0.01, parent=g)
    cyl(0.03, 0.12, (0.35, -0.06, 1.0), ALU(), rot=(R(90), 0, 0), parent=g)
    return g


def window(loc, w=1.6, h=1.2, rot_z=0.0, parent=None, z=1.8):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.1, 0.08, h + 0.1), (0, 0, z), ALU(), bevel=0.01, parent=g)
    plane((w, h), (0, -0.045, z), mat('sky', hex_lin('#dfe6ee'), 0.2, emission=hex_lin('#eef3f8'), strength=1.4), rot=(R(90), 0, 0), parent=g)
    box((0.04, 0.09, h), (0, -0.01, z), ALU(), bevel=0, parent=g)
    return g


def van(loc, rot_z=0.0, parent=None, body=None):
    g = empty(loc, rot_z)
    g.parent = parent
    b = body or CLAY()
    box((1.9, 0.9, 0.8), (0, 0, 0.6), b, bevel=0.12, parent=g)
    box((0.55, 0.88, 0.55), (1.15, 0, 0.47), b, bevel=0.12, parent=g)
    plane((0.42, 0.36), (1.43, 0, 0.62), GLASS(), rot=(R(90), 0, R(90)), parent=g)
    box((1.92, 0.02, 0.12), (0, -0.46, 0.5), RED_L(), bevel=0, parent=g)
    for x in (-0.6, 0.9):
        for y in (-0.45, 0.45):
            cyl(0.2, 0.14, (x, y, 0.2), RUBBER(), rot=(R(90), 0, 0), parent=g)
    return g


def car(loc, rot_z=0.0, parent=None, body=None, scale=1.0):
    """A friendly clay hatchback: rounded body, tinted cabin, chunky wheels."""
    g = empty(loc, rot_z, scale)
    g.parent = parent
    b = body or CLAY()
    tint = mat('tint', hex_lin('#1a1c22'), 0.08, coat=1.0)
    box((2.2, 1.0, 0.5), (0, 0, 0.5), b, bevel=0.2, parent=g)
    box((1.25, 0.92, 0.5), (-0.15, 0, 0.92), b, bevel=0.22, parent=g)
    box((1.05, 0.94, 0.34), (-0.15, 0, 0.95), tint, bevel=0.1, parent=g)
    box((0.06, 0.8, 0.3), (0.42, 0, 0.93), tint, bevel=0.02, rot=(0, R(-30), 0), parent=g)
    for x in (-0.72, 0.72):
        for y in (-0.48, 0.48):
            cyl(0.27, 0.2, (x, y, 0.27), RUBBER(), rot=(R(90), 0, 0), parent=g)
            cyl(0.15, 0.21, (x, y, 0.27), ALU(), rot=(R(90), 0, 0), parent=g)
    for y in (-0.33, 0.33):
        sphere(0.07, (1.1, y, 0.55), GLOW_WHITE(3), seg=16, parent=g)
        sphere(0.06, (-1.1, y, 0.55), GLOW_RED(4), seg=16, parent=g)
    return g


def robot_arm(loc, rot_z=0.0, parent=None, reach=1.0):
    g = empty(loc, rot_z)
    g.parent = parent
    cyl(0.32, 0.18, (0, 0, 0.09), GRAPHITE(), parent=g)
    cyl(0.2, 0.4, (0, 0, 0.38), RED_L(), parent=g)
    sphere(0.17, (0, 0, 0.62), ALU(), parent=g)
    box((0.18, 0.18, 1.0 * reach), (0.25, 0, 1.05), CLAY(), bevel=0.06, rot=(0, R(30), 0), parent=g)
    sphere(0.14, (0.5, 0, 1.48), ALU(), parent=g)
    box((0.14, 0.14, 0.8 * reach), (0.85, 0, 1.3), CLAY(), bevel=0.05, rot=(0, R(120), 0), parent=g)
    for s in (-1, 1):
        box((0.04, 0.05, 0.22), (1.15, s * 0.07, 1.02), GRAPHITE(), bevel=0.01, parent=g)
    return g


def conveyor(loc, length=4.0, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((length, 0.7, 0.08), (0, 0, 0.62), RUBBER(), bevel=0.03, parent=g)
    for sy in (-1, 1):
        box((length, 0.06, 0.18), (0, sy * 0.38, 0.62), ALU(), bevel=0.01, parent=g)
    n = max(2, int(length // 1.0) + 1)
    for x in range(n):
        for sy in (-1, 1):
            box((0.06, 0.06, 0.58), (-length / 2 + 0.1 + x * (length - 0.2) / (n - 1), sy * 0.33, 0.29), GRAPHITE(), bevel=0.005, parent=g)
    return g


def cloud(loc, s=1.0, m=None, parent=None):
    g = empty(loc, 0, s)
    g.parent = parent
    for x, y, z, r in [(0, 0, 0, 0.75), (0.75, -0.05, -0.1, 0.6), (-0.75, 0.05, -0.15, 0.55), (0.35, 0.1, 0.35, 0.55), (-0.3, -0.1, 0.3, 0.5), (1.3, 0, -0.3, 0.38), (-1.25, 0, -0.32, 0.36)]:
        sphere(r, (x, y, z), m or CLAY(), parent=g)
    return g


def chip(loc, s=1.0, parent=None):
    """A processor: black package, metal lid with a glowing red core, pins all round."""
    g = empty(loc, 0, s)
    g.parent = parent
    box((1.2, 1.2, 0.12), (0, 0, 0.06), INK(), bevel=0.03, parent=g)
    box((0.8, 0.8, 0.06), (0, 0, 0.15), ALU(), bevel=0.02, parent=g)
    box((0.42, 0.42, 0.04), (0, 0, 0.19), GLOW_RED(4), bevel=0.01, parent=g)
    for i in range(10):
        t = -0.5 + i * 0.111
        for (x, y, a) in ((t, 0.66, 0), (t, -0.66, 0), (0.66, t, 90), (-0.66, t, 90)):
            box((0.04, 0.12, 0.03), (x, y, 0.03), ALU(), bevel=0, rot=(0, 0, R(a)), parent=g)
    return g


def tripod_camera(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    for a in (0, 120, 240):
        r = R(a)
        cyl(0.025, 1.3, (math.cos(r) * 0.22, math.sin(r) * 0.22, 0.62), GRAPHITE(), rot=(math.sin(r) * 0.32, -math.cos(r) * 0.32, 0), parent=g)
    box((0.42, 0.24, 0.28), (0, 0, 1.38), INK(), bevel=0.04, parent=g)
    cyl(0.1, 0.3, (0, -0.26, 1.38), GRAPHITE(), rot=(R(90), 0, 0), parent=g)
    sphere(0.05, (0.12, 0.08, 1.56), GLOW_RED(6), seg=12, parent=g)
    return g


def softbox(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    cyl(0.02, 1.8, (0, 0, 0.9), GRAPHITE(), parent=g)
    for a in (0, 120, 240):
        r = R(a)
        cyl(0.015, 0.5, (math.cos(r) * 0.15, math.sin(r) * 0.15, 0.2), GRAPHITE(), rot=(math.sin(r) * 0.8, -math.cos(r) * 0.8, 0), parent=g)
    box((0.9, 0.3, 0.7), (0, 0, 1.95), INK(), bevel=0.04, rot=(R(-15), 0, 0), parent=g)
    plane((0.8, 0.6), (0, -0.16, 1.92), GLOW_WHITE(5), rot=(R(75), 0, 0), parent=g)
    return g


def controller(loc, rot=(0, 0, 0), s=1.0, parent=None):
    g = empty(loc, 0, s)
    g.rotation_euler = rot
    g.parent = parent
    box((0.7, 0.32, 0.1), (0, 0, 0), INK(), bevel=0.06, parent=g)
    for sx in (-1, 1):
        sphere(0.17, (sx * 0.28, 0.1, -0.02), INK(), scale=(1, 1, 0.5), parent=g)
    cyl(0.05, 0.05, (-0.16, 0, 0.06), GRAPHITE(), parent=g)
    for k, (x, y) in enumerate([(0.2, 0.05), (0.26, -0.01), (0.14, -0.01), (0.2, -0.07)]):
        cyl(0.025, 0.03, (x, y, 0.06), RED_L() if k == 0 else GRAPHITE(), parent=g)
    return g


def billboard(loc, tex, w=3.2, h=1.6, rot_z=0.0, parent=None, z=2.4):
    g = empty(loc, rot_z)
    g.parent = parent
    for sx in (-1, 1):
        cyl(0.05, z, (sx * w * 0.32, 0, z / 2), GRAPHITE(), parent=g)
    box((w + 0.12, 0.1, h + 0.12), (0, 0, z + h / 2 - 0.2), INK(), bevel=0.02, parent=g)
    plane((w, h), (0, -0.055, z + h / 2 - 0.2), screen_mat(tex, 1.5), rot=(R(90), 0, 0), parent=g)
    return g


def football(loc, r=0.2, parent=None):
    o = sphere(r, loc, mat('ball', hex_lin('#f4f4f2'), 0.4, coat=0.5), parent=parent)
    for i in range(5):
        a = i * 1.2566
        sphere(r * 0.32, (loc[0] + math.cos(a) * r * 0.78, loc[1] + math.sin(a) * r * 0.78, loc[2] + r * 0.45), INK(), scale=(1, 1, 0.5), parent=parent)
    sphere(r * 0.32, (loc[0], loc[1], loc[2] + r * 0.96), INK(), scale=(1, 1, 0.3), parent=parent)
    return o


def floodlight(loc, rot_z=0.0, parent=None, h=3.4):
    g = empty(loc, rot_z)
    g.parent = parent
    cyl(0.06, h, (0, 0, h / 2), GRAPHITE(), parent=g)
    box((0.7, 0.12, 0.5), (0, 0, h + 0.2), INK(), bevel=0.03, rot=(R(-20), 0, 0), parent=g)
    for i in range(2):
        for j in range(3):
            plane((0.16, 0.14), (-0.22 + j * 0.22, -0.08, h + 0.1 + i * 0.2), GLOW_WHITE(9), rot=(R(70), 0, 0), parent=g)
    return g


def goal(loc, rot_z=0.0, parent=None, w=1.6, h=0.8):
    g = empty(loc, rot_z)
    g.parent = parent
    for sx in (-1, 1):
        cyl(0.035, h, (sx * w / 2, 0, h / 2), CLAY(), parent=g)
    cyl(0.035, w, (0, 0, h), CLAY(), rot=(0, R(90), 0), parent=g)
    plane((w, h), (0, 0.3, h / 2), mat('net', hex_lin('#e8e8ea'), 0.8, alpha=0.35), rot=(R(90), 0, 0), parent=g)
    return g


def headset(loc, parent=None):
    return torus(0.11, 0.015, loc, GRAPHITE(), rot=(R(90), 0, 0), parent=parent)


def bag(loc, m=None, parent=None, s=1.0):
    g = empty(loc, 0, s)
    g.parent = parent
    box((0.36, 0.16, 0.42), (0, 0, 0.21), m or RED_L(), bevel=0.01, parent=g)
    torus(0.09, 0.012, (0, 0, 0.45), GRAPHITE(), rot=(R(90), 0, 0), parent=g)
    return g


def cart(loc, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.8, 0.5, 0.04), (0, 0, 0.42), ALU(), bevel=0.01, parent=g)
    for sx in (-1, 1):
        box((0.02, 0.5, 0.35), (sx * 0.4, 0, 0.6), ALU(), bevel=0, parent=g)
        box((0.8, 0.02, 0.35), (0, sx * 0.25, 0.6), ALU(), bevel=0, parent=g)
    cyl(0.015, 0.5, (-0.45, 0, 0.85), RED_L(), rot=(R(90), 0, 0), parent=g)
    for x in (-0.3, 0.3):
        for y in (-0.2, 0.2):
            cyl(0.06, 0.04, (x, y, 0.06), RUBBER(), rot=(R(90), 0, 0), parent=g)
    return g


def database(loc, s=1.0, parent=None, n=3):
    g = empty(loc, 0, s)
    g.parent = parent
    for i in range(n):
        cyl(0.5, 0.3, (0, 0, 0.17 + i * 0.36), CLAY() if i != n - 1 else RED_L(), parent=g, bevel=0.04)
        torus(0.5, 0.012, (0, 0, 0.32 + i * 0.36), GRAPHITE(), parent=g)
    return g
