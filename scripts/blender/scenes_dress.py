"""A finishing pass over the fifteen service dioramas: added, never removed.

Each room gets architectural finish (aluminium caps on the wall tops, a lit
cove along their inner edge, spotlights on the left wall throwing pools of
light), each plinth a raised GWD plaque with its service number, and each
scene one more piece of the work itself (a drone over the build table, a
neural net over the chip, product cards around the shop, data in flight).
"""

import math

import bpy

from gwd import ALU, CLAY, GLOW_RED, GLOW_WHITE, GRAPHITE, INK, RED_L, box, cyl, empty, hex_lin, mat, person, plane, screen_mat, sphere, torus, tube, back_y, left_x

R = math.radians
Z = 0.5
BY = back_y(8)
LX = left_x(8)


def _glow(hexc, s=4.0, name=None):
    return mat(name or f'dress_glow_{hexc}_{s}', hex_lin(hexc), 0.4, emission=hex_lin(hexc), strength=s)


def _spot(loc, target, energy=70, size=38, blend=0.6, color=(1, 0.93, 0.84)):
    d = bpy.data.lights.new('dress_spot', 'SPOT')
    d.energy = energy
    d.spot_size = R(size)
    d.spot_blend = blend
    d.shadow_soft_size = 0.12
    d.color = color
    o = bpy.data.objects.new('dress_spot', d)
    o.location = loc
    bpy.context.collection.objects.link(o)
    from mathutils import Vector

    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o


def text(body, loc, size=0.3, m=None, rot=(R(90), 0, 0), extrude=0.03, align='CENTER'):
    cu = bpy.data.curves.new('dress_text', 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = 0.004
    cu.align_x = align
    cu.align_y = 'CENTER'
    o = bpy.data.objects.new('dress_text', cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(m or RED_L())
    return o


# ── Shared finish ────────────────────────────────────────────
def room_finish(dark=False, w=8, d=8, h=3.0, thick=0.25):
    """Caps on the wall tops, a lit cove under them, three spotlights on the left wall."""
    top = Z + h
    box((w, thick + 0.04, 0.035), (0, d / 2 - thick / 2, top + 0.018), ALU(), bevel=0.008)
    box((thick + 0.04, d, 0.035), (-w / 2 + thick / 2, 0, top + 0.018), ALU(), bevel=0.008)
    cove = _glow('#ff2a3a', 5.0) if dark else _glow('#fff1dc', 2.2)
    box((w - thick - 0.05, 0.035, 0.035), (thick / 2, d / 2 - thick - 0.02, top - 0.08), cove, bevel=0)
    box((0.035, d - thick - 0.05, 0.035), (-w / 2 + thick + 0.02, -thick / 2, top - 0.08), cove, bevel=0)
    # Spot heads sit on the left wall's cap and lean into the room.
    for y in (-2.4, 0.0, 2.4):
        g = empty((-w / 2 + thick / 2, y, top + 0.04))
        box((0.12, 0.12, 0.08), (0, 0, 0.04), INK(), bevel=0.02, parent=g)
        head = cyl(0.09, 0.26, (0.22, 0, 0.12), INK(), rot=(0, R(62), 0), parent=g)
        cyl(0.07, 0.01, (0.33, 0, 0.06), GLOW_WHITE(8), rot=(0, R(62), 0), parent=g)
        _spot((-w / 2 + thick / 2 + 0.38, y, top + 0.02), (0.9, y * 0.6, Z), energy=90 if dark else 60, color=(1, 0.9, 0.82) if not dark else (1, 0.86, 0.8))
        del head


def plaque(number, dark=False, w=8, d=8, slab=0.5):
    """GWD and the service number, raised on the plinth's front face like a model label."""
    m = RED_L()
    x = w / 2 - 1.15
    y = -d / 2 - 0.012
    box((1.6, 0.02, 0.3), (x, y + 0.004, slab * 0.42), INK() if not dark else mat('plaque_plate', hex_lin('#26272d'), 0.35, metal=0.4), bevel=0.01)
    text(f'GWD  {number:02d}', (x, y - 0.012, slab * 0.42), size=0.19, m=m, extrude=0.012)


def stage_finish(w=9, d=9):
    """Open stages: brushed-aluminium corner posts with uplights at the back."""
    for (sx, sy) in ((-1, 1), (1, 1)):
        x, y = sx * (w / 2 - 0.25), sy * (d / 2 - 0.25)
        cyl(0.05, 0.9, (x, y, Z + 0.45), ALU())
        sphere(0.07, (x, y, Z + 0.95), GLOW_WHITE(10))
        _spot((x, y, Z + 1.0), (x * 0.3, y * 0.2, Z), energy=55, size=55)


# ── Hero pieces ──────────────────────────────────────────────
def drone(loc, s=1.0):
    g = empty(loc, R(18), s)
    box((0.5, 0.5, 0.14), (0, 0, 0), INK(), bevel=0.05, parent=g)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.42, 0.05, 0.04), (sx * 0.24, sy * 0.24, 0.02), GRAPHITE(), bevel=0.01, rot=(0, 0, R(45 * sx * sy)), parent=g)
            cyl(0.17, 0.012, (sx * 0.4, sy * 0.4, 0.07), mat('rotor', hex_lin('#9a9ba3'), 0.3, alpha=0.45), parent=g)
            cyl(0.03, 0.06, (sx * 0.4, sy * 0.4, 0.04), INK(), parent=g)
    sphere(0.05, (0, -0.26, 0), GLOW_RED(10), parent=g)
    box((0.22, 0.22, 0.16), (0, 0, -0.17), RED_L(), bevel=0.04, parent=g)
    return g


def neural_net(c, layers=(3, 4, 2), gap=0.55, spread=0.5):
    nodes = []
    for li, n in enumerate(layers):
        col = []
        for k in range(n):
            p = (c[0] + (k - (n - 1) / 2) * spread, c[1], c[2] + li * gap)
            sphere(0.08, p, GLOW_RED(8) if li == len(layers) - 1 else mat('node', hex_lin('#f4f4f6'), 0.25, emission=hex_lin('#ffffff'), strength=1.2), seg=24)
            col.append(p)
        nodes.append(col)
    link = _glow('#ff3b4a', 2.2, 'nn_link')
    for a, b in zip(nodes, nodes[1:]):
        for p in a:
            for q in b:
                tube([p, q], 0.008, link)


def product_card(loc, rot, tex):
    g = empty(loc, 0)
    g.rotation_euler = rot
    box((0.8, 0.05, 1.05), (0, 0, 0), CLAY(), bevel=0.05, parent=g)
    plane((0.66, 0.5), (0, -0.03, 0.18), screen_mat(tex, 1.1), rot=(R(90), 0, 0), parent=g)
    box((0.5, 0.02, 0.07), (-0.05, -0.03, -0.18), GRAPHITE(), bevel=0.01, parent=g)
    box((0.3, 0.03, 0.14), (0.16, -0.035, -0.36), RED_L(), bevel=0.04, parent=g)
    return g


def bubble(loc, w=0.9, h=0.5, rot=(R(90), 0, 0), badge=True, m=None):
    g = empty(loc, 0)
    g.rotation_euler = rot
    box((w, h, 0.08), (0, 0, 0), m or CLAY(), bevel=0.18, parent=g)
    for i in range(2):
        box((w * (0.6 - i * 0.2), 0.05, 0.02), (-w * 0.08 - i * 0.05, h * (0.08 - i * 0.18), 0.045), GRAPHITE(), bevel=0.01, parent=g)
    if badge:
        sphere(0.09, (w / 2 - 0.02, h / 2 - 0.02, 0.06), GLOW_RED(6), parent=g)
    return g


def packet_trail(points, n=5, s=0.12, every=None):
    """Glowing data packets spaced along a path."""
    from mathutils import Vector

    pts = [Vector(p) for p in points]
    segs = list(zip(pts, pts[1:]))
    total = sum((b - a).length for a, b in segs)
    for k in range(n):
        t = (k + 0.5) / n * total
        for a, b in segs:
            L = (b - a).length
            if t <= L:
                p = a + (b - a) * (t / L)
                box((s, s, s), tuple(p), GLOW_RED(7) if k % 2 == 0 else GLOW_WHITE(5), bevel=s * 0.25)
                break
            t -= L


def pie(loc, r=0.6, parts=((0.0, 0.46, 'red'), (0.46, 0.78, 'clay'), (0.78, 1.0, 'ink')), tilt=R(58)):
    g = empty(loc, R(-30))
    g.rotation_euler = (tilt, 0, R(-35))
    for (a0, a1, col) in parts:
        m = RED_L() if col == 'red' else CLAY() if col == 'clay' else INK()
        verts = [(0, 0, -0.08), (0, 0, 0.08)]
        faces = []
        steps = max(4, int(64 * (a1 - a0)))
        for i in range(steps + 1):
            a = 2 * math.pi * (a0 + (a1 - a0) * i / steps)
            verts += [(math.cos(a) * r, math.sin(a) * r, -0.08), (math.cos(a) * r, math.sin(a) * r, 0.08)]
        for i in range(steps):
            b = 2 + i * 2
            faces += [(0, b + 2, b), (1, b + 1, b + 3), (b, b + 2, b + 3, b + 1)]
        faces += [(0, 2, 3, 1), (0, 1, 2 + steps * 2 + 1, 2 + steps * 2)]
        me = bpy.data.meshes.new('pie')
        me.from_pydata(verts, [], faces)
        me.update()
        ob = bpy.data.objects.new('pie', me)
        bpy.context.collection.objects.link(ob)
        ob.data.materials.append(m)
        ob.parent = g
        # The lead slice stands proud of the rest.
        if col == 'red':
            mid = 2 * math.pi * (a0 + a1) / 2
            ob.location = (math.cos(mid) * 0.12, math.sin(mid) * 0.12, 0.02)
    return g


def clock(loc, rot_z=R(90), r=0.32):
    g = empty(loc, rot_z)
    cyl(r, 0.05, (0, 0, 0), CLAY(), rot=(R(90), 0, 0), parent=g)
    torus(r, 0.025, (0, -0.02, 0), INK(), rot=(R(90), 0, 0), parent=g)
    box((0.025, 0.012, r * 0.62), (0, -0.04, r * 0.26), INK(), bevel=0, parent=g)
    box((r * 0.5, 0.012, 0.025), (r * 0.22, -0.04, 0), RED_L(), bevel=0, rot=(0, R(-30), 0), parent=g)
    return g


def easel(loc, tex, rot_z=0.0, w=1.1, h=0.8):
    g = empty(loc, rot_z)
    for sx in (-1, 1):
        cyl(0.025, 1.9, (sx * 0.38, 0.1, 0.92), ALU(), rot=(R(-6), R(sx * 8), 0), parent=g)
    cyl(0.025, 1.8, (0, 0.38, 0.86), ALU(), rot=(R(14), 0, 0), parent=g)
    box((w + 0.06, 0.04, h + 0.06), (0, 0, 1.45), CLAY(), bevel=0.01, parent=g)
    plane((w, h), (0, -0.025, 1.45), screen_mat(tex, 0.8), rot=(R(90), 0, 0), parent=g)
    box((w * 0.9, 0.12, 0.04), (0, -0.03, 1.02), ALU(), bevel=0.01, parent=g)
    return g


def clapper(loc, rot_z=0.0):
    g = empty(loc, rot_z)
    box((0.5, 0.04, 0.36), (0, 0, 0.18), INK(), bevel=0.01, parent=g)
    top = empty((-0.25, 0, 0.38), 0)
    top.parent = g
    top.rotation_euler = (0, R(-18), 0)
    box((0.5, 0.045, 0.08), (0.25, 0, 0.04), INK(), bevel=0.005, parent=top)
    for i in range(5):
        box((0.06, 0.05, 0.08), (0.05 + i * 0.1, -0.002, 0.04), CLAY(), bevel=0, rot=(0, R(30), 0), parent=top)
    return g


def crane(loc, rot_z=0.0):
    g = empty(loc, rot_z)
    cyl(0.32, 0.06, (0, 0, 0.03), INK(), parent=g)
    cyl(0.06, 1.6, (0, 0, 0.83), ALU(), parent=g)
    arm = empty((0, 0, 1.65), 0)
    arm.parent = g
    arm.rotation_euler = (0, R(-14), 0)
    box((3.0, 0.08, 0.08), (0.6, 0, 0), GRAPHITE(), bevel=0.01, parent=arm)
    box((0.3, 0.3, 0.3), (-0.95, 0, -0.1), INK(), bevel=0.03, parent=arm)
    g2 = empty((2.05, 0, -0.18), 0)
    g2.parent = arm
    box((0.34, 0.24, 0.24), (0, 0, 0), INK(), bevel=0.03, parent=g2)
    cyl(0.08, 0.16, (0, -0.18, 0), GRAPHITE(), rot=(R(90), 0, 0), parent=g2)
    sphere(0.03, (0.12, -0.12, 0.1), GLOW_RED(10), parent=g2)
    return g


def game_block(loc, m, mark=True):
    box((0.42, 0.42, 0.42), loc, m, bevel=0.05)
    if mark:
        text('?', (loc[0], loc[1] - 0.215, loc[2]), size=0.3, m=GLOW_WHITE(3), extrude=0.01)


def padlock(loc, s=1.0):
    g = empty(loc, R(10), s)
    box((0.5, 0.22, 0.42), (0, 0, 0), RED_L(), bevel=0.06, parent=g)
    torus(0.17, 0.045, (0, 0, 0.27), ALU(), rot=(R(90), 0, 0), parent=g)
    cyl(0.05, 0.05, (0, -0.12, 0.03), INK(), rot=(R(90), 0, 0), parent=g)
    return g


def check_badge(loc, s=1.0):
    g = empty(loc, R(-30), s)
    g.rotation_euler = (R(80), 0, R(-30))
    cyl(0.26, 0.05, (0, 0, 0), CLAY(), parent=g)
    torus(0.26, 0.02, (0, 0, 0.0), GLOW_RED(5), parent=g)
    box((0.08, 0.2, 0.03), (-0.06, -0.01, 0.035), RED_L(), bevel=0.01, rot=(0, 0, R(45)), parent=g)
    box((0.08, 0.32, 0.03), (0.06, 0.03, 0.035), RED_L(), bevel=0.01, rot=(0, 0, R(-40)), parent=g)
    return g


def flip_chart(loc, rot_z=0.0):
    return easel(loc, 'consulting-board', rot_z, w=0.9, h=1.1)


# ── Per scene ────────────────────────────────────────────────
def d_product():
    room_finish()
    plaque(1)
    drone((0.6, 0.1, Z + 2.5), 0.9)
    tube([(0.6, 0.1, Z + 2.2), (0.55, 0.05, Z + 1.3)], 0.006, _glow('#ff3b4a', 3, 'tether'))


def d_enterprise():
    room_finish()
    plaque(2)
    clock((LX + 0.03, -1.8, Z + 2.5))
    for k, (x, y) in enumerate([(-1.6, 1.4), (2.8, -0.9)]):
        check_badge((x, y + 0.55, Z + 2.25), 0.75)


def d_web():
    stage_finish()
    plaque(3, w=9, d=9)
    for k, (x, y, z, rz) in enumerate([(-2.9, 0.9, 3.2, 20), (2.6, 1.6, 3.6, -25), (2.9, -0.6, 2.4, -40), (-2.6, -0.6, 2.2, 35)]):
        product_card((x, y, Z + z), (R(4), R(-6 if k % 2 else 6), R(rz)), ['shop-site', 'phone-app', 'shop-site', 'design-tool'][k])
    drone((1.4, -2.9, Z + 2.3), 0.85)


def d_mobile():
    stage_finish()
    plaque(4, w=9, d=9)
    for k, (x, y, z, rz) in enumerate([(-3.0, 0.2, 2.9, 25), (-0.9, 0.9, 4.9, 5), (1.2, 1.0, 5.0, -5), (3.2, 0.0, 3.1, -25)]):
        bubble((x, y, Z + z), rot=(R(90), 0, R(rz)), badge=k % 2 == 0, m=RED_L() if k == 2 else None)


def d_ai():
    room_finish(dark=True)
    plaque(5, dark=True)
    neural_net((-2.5, 2.1, Z + 1.55))


def d_cloud():
    room_finish(dark=True, h=2.8)
    plaque(6, dark=True)
    for k in range(3):
        x = -2.8 + k * 0.98
        packet_trail([(x, 1.2, Z + 1.95), (x * 0.7 - 0.5, 0.6, Z + 2.95), (-1.8, -0.3, Z + 3.6)], n=3, s=0.09)


def d_cyber():
    room_finish(dark=True)
    plaque(7, dark=True)
    padlock((0.9, -2.6, Z + 2.2), 1.1)
    for (x, y, z) in [(-0.4, -2.2, 1.1), (-3.0, -3.0, 0.9), (-0.6, 0.9, 1.7)]:
        sphere(0.13, (x, y, Z + z), GLOW_RED(6), seg=12)
        torus(0.22, 0.012, (x, y, Z + z), _glow('#ff3b4a', 3, 'threat_ring'), rot=(R(70), 0, R(30)))


def d_data():
    room_finish()
    plaque(8)
    pie((-0.9, -2.5, Z + 2.5), r=0.62)
    torus(0.42, 0.11, (0.6, -2.7, Z + 2.0), RED_L(), rot=(R(62), 0, R(-35)))


def d_api():
    plaque(9, w=3.0, d=3.0, slab=0.4)
    text('{ }', (0, 0.35, 3.3), size=0.9, m=GLOW_RED(4), extrude=0.06, rot=(R(80), 0, R(45)))
    for x, y in [(-3.6, 2.4), (3.4, 2.4), (-3.6, -2.8), (3.4, -2.8)]:
        packet_trail([(x * 0.22, y * 0.22, 0.6), (x * 0.5, y * 0.5, 1.13), (x * 0.78, y * 0.78, 0.6)], n=2, s=0.1)


def d_ux():
    room_finish()
    plaque(10)
    easel((-2.7, 0.9, Z), 'design-tool', rot_z=R(-35))


def d_branding():
    stage_finish()
    plaque(11, w=9, d=9)
    g = empty((3.4, 1.6, Z), R(-30))
    for i, tex in enumerate(['brand-board', 'billboard']):
        box((0.8, 0.05, 1.15), (i * 0.9 - 0.45, 0, 0.95), CLAY(), bevel=0.02, parent=g)
        plane((0.7, 1.05), (i * 0.9 - 0.45, -0.03, 0.95), screen_mat(tex, 0.9), rot=(R(90), 0, 0), parent=g)
        cyl(0.025, 0.4, (i * 0.9 - 0.45, 0.04, 0.2), ALU(), parent=g)
    for i in range(6):
        box((0.14, 0.02, 0.62), (-1.0, -1.1, Z + 1.3), [RED_L(), CLAY(), INK(), RED_L(), CLAY(), GRAPHITE()][i], bevel=0.01, rot=(R(10), R(-60 + i * 22), R(-20)))


def d_motion():
    stage_finish()
    plaque(12, w=9, d=9)
    clapper((1.9, -2.6, Z), rot_z=R(-30))
    crane((2.9, 1.2, Z), rot_z=R(160))


def d_games():
    room_finish(dark=True)
    plaque(13, dark=True)
    for k, (x, y, z) in enumerate([(-0.6, 0.6, 3.0), (0.0, 0.6, 3.0), (0.6, 0.6, 3.0)]):
        game_block((x + 0.6, y - 1.5, Z + z - 0.4), RED_L() if k == 1 else CLAY(), mark=k == 1)
    torus(0.2, 0.06, (2.0, -1.0, Z + 2.9), mat('coin', hex_lin('#f2c94c'), 0.2, metal=1.0), rot=(R(90), 0, R(30)))
    torus(0.2, 0.06, (2.5, -0.6, Z + 3.1), mat('coin', hex_lin('#f2c94c'), 0.2, metal=1.0), rot=(R(90), 0, R(50)))


def d_consulting():
    room_finish()
    plaque(14)
    flip_chart((-3.0, 1.6, Z), rot_z=R(-50))
    clock((LX + 0.03, -1.7, Z + 2.5))


def d_managed():
    room_finish(dark=True)
    plaque(15, dark=True)
    clock((LX + 0.03, 2.6, Z + 2.55))
    for (x, y) in [(-1.2, 1.3), (1.0, 1.3), (3.0, 1.3)]:
        check_badge((x + 0.5, y + 0.1, Z + 2.45), 0.6)


DRESS = {
    'svc-product': d_product,
    'svc-enterprise': d_enterprise,
    'svc-web': d_web,
    'svc-mobile': d_mobile,
    'svc-ai': d_ai,
    'svc-cloud': d_cloud,
    'svc-cybersecurity': d_cyber,
    'svc-data': d_data,
    'svc-api': d_api,
    'svc-ux': d_ux,
    'svc-branding': d_branding,
    'svc-motion': d_motion,
    'svc-games': d_games,
    'svc-consulting': d_consulting,
    'svc-managed': d_managed,
}


def dressed(scenes):
    """The scene table with each service's build followed by its finishing pass."""
    out = dict(scenes)
    for name, extra in DRESS.items():
        if name in out:
            base = out[name]['build']
            out[name] = {**out[name], 'build': (lambda b=base, e=extra: (b(), e()))}
    return out
