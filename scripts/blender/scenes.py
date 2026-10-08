"""The GWD dioramas: one miniature isometric world per service and product,
each showing the work itself. Screens carry real UI from scripts/screens.

Conventions: the platform top is z=0.5; cut-away walls stand at the back
(+Y) and left (-X); the camera looks in from the front-right. Things that
face the camera face -Y; rot_z=90° turns them to face +X (into the room from
the left wall); people sitting at a desk face +Y (rot_z=180°).
"""

import math

import bpy

from gwd import (
    practical,
    ALU,
    CLAY,
    CLAY_MID,
    CLAY_WARM,
    GLOW_RED,
    GLOW_WHITE,
    GRAPHITE,
    INK,
    MAROON_L,
    RED_L,
    SHIELD,
    STONE,
    box,
    chair,
    cyl,
    desk,
    empty,
    hex_lin,
    iso_camera,
    laptop,
    lights,
    mat,
    monitor,
    person,
    phone,
    plane,
    platform,
    screen_mat,
    server_rack,
    shadow_catcher,
    sphere,
    tablet,
    torus,
    tube,
    wall_screen,
    walls,
    whiteboard,
    back_y,
    left_x,
)
from props import (
    bag,
    billboard,
    car,
    cart,
    chip,
    cloud,
    controller,
    conveyor,
    database,
    door,
    floodlight,
    football,
    frame,
    goal,
    headset,
    keyboard,
    lamp,
    mug,
    plant2,
    robot_arm,
    rug,
    shelf,
    softbox,
    sofa,
    sticky_wall,
    tripod_camera,
    van,
    window,
)

R = math.radians
Z = 0.5  # platform top


def shield(loc, size=1.0, m=None, rot=(0, 0, 0), depth=0.18):
    """A heater shield with a glowing check mark."""
    cu = bpy.data.curves.new('shield', 'CURVE')
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.extrude = depth / 2
    cu.bevel_depth = 0.03
    sp = cu.splines.new('BEZIER')
    pts = [(0, 1.0), (0.8, 0.82), (0.75, 0.1), (0, -1.0), (-0.75, 0.1), (-0.8, 0.82)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, (x, y) in zip(sp.bezier_points, pts):
        bp.co = (x * size, y * size, 0)
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    sp.use_cyclic_u = True
    o = bpy.data.objects.new('shield', cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m or RED_L())
    o.location = loc
    o.rotation_euler = rot
    ck = bpy.data.curves.new('check', 'CURVE')
    ck.dimensions = '3D'
    ck.bevel_depth = 0.07 * size
    sp2 = ck.splines.new('POLY')
    sp2.points.add(2)
    for p, (x, y) in zip(sp2.points, [(-0.35, 0.05), (-0.08, -0.25), (0.38, 0.32)]):
        p.co = (x * size, y * size, depth / 2 + 0.04, 1)
    c = bpy.data.objects.new('check', ck)
    bpy.context.collection.objects.link(c)
    c.data.materials.append(mat('white_glow', (1, 1, 1), 0.3, emission=(1, 1, 1), strength=2.5))
    c.parent = o
    return o


def dome(loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=64, ring_count=32)
    o = bpy.context.object
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.001], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def ring(loc, R_, r, m, rot=(0, 0, 0)):
    return torus(R_, r, loc, m, rot=rot)


def packets(points, m, every=3):
    """Glowing data packets along a path."""
    for i, p in enumerate(points):
        if i % every == 0:
            box((0.16, 0.16, 0.16), p, m, bevel=0.03)


def worker(loc, rot_z, pose='sit', body=None, desk_screens=None, chair_m=None):
    """A person at a desk: desk, chair, person facing the desk, optional monitors."""
    g = empty(loc, rot_z)
    desk((0, 0.55, 0), w=1.7, d=0.85, parent=g)
    if desk_screens:
        for i, tex in enumerate(desk_screens):
            off = (i - (len(desk_screens) - 1) / 2) * 0.82
            monitor((off, 0.78, 0.81), tex, w=0.78, h=0.5, parent=g)
    keyboard((0, 0.42, 0.795), parent=g)
    mug((0.62, 0.4, 0.84), parent=g)
    chair((0, -0.2, 0), rot_z=0, parent=g, m=chair_m)
    person((0, -0.1, 0), rot_z=R(180), pose=pose, body=body, parent=g)
    return g



# ── Rooms ────────────────────────────────────────────────────
BY = back_y(8)  # back wall inner face
LX = left_x(8)  # left wall inner face
DARK_FLOOR = lambda: mat('dark_floor', hex_lin('#18181c'), 0.45, coat=0.4)  # noqa: E731


def tile_floor():
    """Large pale tiles with hairline joints: a finished floor rather than flat clay."""
    m = bpy.data.materials.get('tile_floor')
    if m:
        return m
    m = bpy.data.materials.new('tile_floor')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*hex_lin('#ebebee'), 1)
    br.inputs['Color2'].default_value = (*hex_lin('#e3e3e7'), 1)
    br.inputs['Mortar'].default_value = (*hex_lin('#cfcfd4'), 1)
    br.inputs['Scale'].default_value = 0.9
    br.inputs['Mortar Size'].default_value = 0.008
    br.inputs['Brick Width'].default_value = 1.0
    br.inputs['Row Height'].default_value = 1.0
    br.offset = 0.0
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.32
    b.inputs['Coat Weight'].default_value = 0.25
    return m


def room(dark=False, w=8, d=8, h=3.0):
    if dark:
        lights(0.75, dark=True)
    else:
        lights(1.0)
    shadow_catcher()
    platform(w, d, m=GRAPHITE() if dark else CLAY())
    walls(w, d, h=h, m=GRAPHITE() if dark else CLAY(), floor=DARK_FLOOR() if dark else tile_floor())
    practical((0.4, 0.4, 0.5 + h + 0.4), energy=260 if dark else 200, size=w * 0.6)


def open_stage(w=9, d=9, dark=False):
    lights(0.8 if dark else 1.0, dark=dark)
    shadow_catcher()
    platform(w, d, m=GRAPHITE() if dark else CLAY())
    practical((0, 0, 6.5), energy=420, size=w * 0.7)


def cam(scale=11.6, target=(0, 0, 1.5)):
    iso_camera(scale=scale, target=target)


# ── 01 Product Engineering: a product studio mid-build ──────
def svc_product():
    room()
    whiteboard((-0.4, BY - 0.05, Z), 'saas-product', w=3.0, h=1.6)
    person((-2.2, 2.6, Z), rot_z=R(25), pose='present', body=RED_L())
    sticky_wall((2.4, BY, Z), cols=4, rows=4, z=1.4)
    # The build table: prototypes in progress.
    box((3.0, 1.5, 0.08), (0.4, 0.0, Z + 0.8), CLAY_WARM(), bevel=0.03)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.07, 0.07, 0.8), (0.4 + sx * 1.35, sy * 0.65, Z + 0.4), GRAPHITE(), bevel=0.01)
    phone((-0.6, 0.15, Z + 0.84), 'phone-app', rot=(R(-75), 0, R(10)), scale=0.5)
    tablet((0.35, -0.05, Z + 0.85), 'design-tool', rot=(0, 0, R(-8)), scale=0.6)
    laptop((1.35, 0.25, Z + 0.84), 'code-editor', rot_z=R(-20), scale=0.7)
    box((0.32, 0.32, 0.32), (-1.05, -0.35, Z + 1.0), RED_L(), bevel=0.06)
    mug((1.6, -0.45, Z + 0.89))
    for k, (x, y, rz, b, pose) in enumerate([(-0.9, -1.1, 175, GRAPHITE(), 'stand'), (0.5, -1.15, 185, CLAY_MID(), 'phone'), (1.9, 1.15, 200, CLAY(), 'stand')]):
        person((x, y, Z), rot_z=R(rz), body=b, pose=pose)
    # A 3D printer making a red part.
    g = empty((LX + 0.6, -1.6, Z))
    box((0.9, 0.9, 1.2), (0, 0, 0.6), INK(), bevel=0.04, parent=g)
    box((0.02, 0.75, 0.85), (0.46, 0, 0.7), mat('smoke', hex_lin('#2a2a30'), 0.05, transmission=0.6), bevel=0, parent=g)
    box((0.28, 0.28, 0.22), (0, 0, 0.4), RED_L(), bevel=0.04, parent=g)
    shelf((LX + 0.2, 1.4, Z), w=1.6, rot_z=R(90))
    plant2((3.3, 3.2, Z), 1.2)
    plant2((3.3, -3.2, Z), 0.9)
    lamp((-0.95, 0.5, Z + 0.84))
    cam()


# ── 02 Enterprise Software: one system, run across an office ─
def svc_enterprise():
    room()
    wall_screen((0.6, BY - 0.04, Z), 'erp-dashboard', w=4.0, h=2.25, z=1.85)
    window((LX, 1.6, Z), w=1.8, h=1.3, rot_z=R(90))
    for i, (x, y) in enumerate([(-1.6, 1.4), (0.6, 1.4), (2.8, 1.4), (-1.6, -0.9), (0.6, -0.9), (2.8, -0.9)]):
        worker((x, y, Z), 0, body=[GRAPHITE(), CLAY_MID(), RED_L(), CLAY(), CLAY_MID(), GRAPHITE()][i], desk_screens=['erp-dashboard'] if i % 2 else ['analytics-dashboard', 'saas-product'])
    cyl(0.55, 0.05, (-2.6, -2.8, Z + 0.72), CLAY_WARM())
    cyl(0.05, 0.7, (-2.6, -2.8, Z + 0.36), GRAPHITE())
    for a in (30, 150, 270):
        person((-2.6 + math.cos(R(a)) * 0.85, -2.8 + math.sin(R(a)) * 0.85, Z), rot_z=R(a + 90), pose='sit', body=CLAY_MID())
    server_rack((3.3, 3.2, Z), units=6, h=1.9)
    plant2((3.3, -3.3, Z), 1.1)
    cam(12.2)


# ── 03 Websites & E-commerce: a giant laptop shop ────────────
def svc_web():
    open_stage(9, 9)
    laptop((-0.4, 1.0, Z), 'shop-site', rot_z=0, scale=3.8)
    for k, (x, y, rz) in enumerate([(0.6, -1.3, 200), (1.8, -2.1, 160), (-1.5, -1.9, 190), (2.8, -0.4, 120), (-2.8, -0.9, 200)]):
        person((x, y, Z), rot_z=R(rz), body=[RED_L(), GRAPHITE(), CLAY_MID(), CLAY(), RED_L()][k], scale=0.85, pose='phone' if k == 3 else 'stand')
        bag((x + 0.28, y - 0.05, Z + 0.2), m=RED_L() if k % 2 else CLAY(), s=0.8)
    cart((-0.7, -3.0, Z), rot_z=R(20))
    van((2.7, -3.2, Z), rot_z=R(180))
    for i, (x, y) in enumerate([(-3.4, -3.2), (-2.9, -3.4), (-3.2, -2.7), (-3.1, -3.0)]):
        box((0.5, 0.42, 0.36), (x, y, Z + 0.18 + (0.36 if i == 3 else 0)), mat('card', hex_lin('#d9c6a5'), 0.7), bevel=0.02, rot=(0, 0, R(i * 17)))
    cu = bpy.data.curves.new('cursor', 'CURVE')
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.extrude = 0.08
    cu.bevel_depth = 0.02
    sp = cu.splines.new('POLY')
    pts = [(0, 0), (0, -0.9), (0.24, -0.66), (0.42, -1.02), (0.56, -0.95), (0.38, -0.6), (0.7, -0.6)]
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    o = bpy.data.objects.new('cursor', cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(RED_L())
    o.location = (0.4, -0.6, Z + 3.3)
    o.rotation_euler = (R(80), 0, R(-10))
    plant2((3.6, 3.4, Z), 1.3)
    plant2((-3.6, 3.4, Z), 1.0)
    cam(12.4, (0, 0, 1.8))


# ── 04 Mobile Apps: phones as towers, people tapping ─────────
def svc_mobile():
    open_stage(9, 9)
    for k, (x, y, tex, rz, s) in enumerate([(-2.1, 1.0, 'phone-app', 12, 2.8), (0.0, 2.0, 'phone-chat', 0, 3.2), (2.2, 0.8, 'phone-sports', -12, 2.8)]):
        phone((x, y, Z), tex, rot=(0, 0, R(rz)), scale=s)
        box((1.1, 0.45, 0.12), (x, y - 0.18, Z + 0.06), GRAPHITE(), bevel=0.04, rot=(0, 0, R(rz)))
    for k, (x, y, rz) in enumerate([(-1.0, -1.4, 170), (1.1, -1.6, 200), (-2.8, -2.4, 150), (3.0, -2.0, 210), (0.1, -3.0, 180)]):
        person((x, y, Z), rot_z=R(rz), body=[RED_L(), GRAPHITE(), CLAY_MID(), CLAY(), RED_L()][k], scale=0.9, pose='phone')
    for k, (x, y, z, m) in enumerate([(-3.2, 2.4, 3.2, RED_L()), (-1.0, 3.2, 4.0, CLAY()), (1.4, 3.1, 4.2, GRAPHITE()), (3.4, 2.2, 3.4, RED_L()), (-0.2, 0.0, 4.0, CLAY_MID()), (2.8, -0.6, 2.6, CLAY())]):
        box((0.55, 0.55, 0.13), (x, y, z), m, bevel=0.15, rot=(R(70), R(10 * k), R(15 * k)))
    cam(12.4, (0, 0.3, 2.2))


# ── 05 AI & Automation: a model running a production line ────
def svc_ai():
    room(dark=True)
    wall_screen((0.6, BY - 0.04, Z), 'ai-workflow', w=4.0, h=2.25, z=1.9)
    conveyor((0.4, -0.7, Z), length=5.6)
    for i, x in enumerate([-1.9, -1.0, -0.1, 0.8, 1.7, 2.6]):
        if i < 3:
            box((0.4, 0.52, 0.06), (x, -0.7, Z + 0.7), CLAY(), bevel=0.01, rot=(0, 0, R(8 * i)))
            box((0.4, 0.52, 0.06), (x, -0.7, Z + 0.76), CLAY_MID(), bevel=0.01, rot=(0, 0, R(-6 * i)))
        else:
            box((0.46, 0.46, 0.4), (x, -0.7, Z + 0.86), RED_L() if i == 4 else mat('card', hex_lin('#d9c6a5'), 0.7), bevel=0.04)
    g = empty((-0.55, -0.7, Z))
    for sx in (-1, 1):
        box((0.16, 0.16, 1.7), (0, sx * 0.55, 0.85), INK(), bevel=0.04, parent=g)
    box((0.28, 1.26, 0.28), (0, 0, 1.75), INK(), bevel=0.06, parent=g)
    plane((0.18, 1.0), (0, 0, 1.6), GLOW_RED(12), rot=(R(180), 0, 0), parent=g)
    plane((0.9, 1.0), (0, 0, 0.8), mat('beam', hex_lin('#ff2a3a'), 0.3, emission=hex_lin('#ff2a3a'), strength=1.5, alpha=0.18), rot=(0, R(90), 0), parent=g)
    robot_arm((1.3, 0.4, Z), rot_z=R(-90))
    robot_arm((2.4, -1.9, Z), rot_z=R(90))
    box((1.4, 1.4, 0.85), (-2.5, 2.1, Z + 0.42), INK(), bevel=0.06)
    chip((-2.5, 2.1, Z + 0.86), s=1.0)
    tube([(-2.5, 1.3, Z + 0.3), (-2.0, 0.2, Z + 0.08), (-1.0, -0.15, Z + 0.06), (-0.6, -0.15, Z + 0.4)], 0.05, GLOW_RED(5))
    worker((2.4, 2.1, Z), 0, body=RED_L(), desk_screens=['ai-workflow'])
    phone((-3.0, -2.4, Z), 'phone-chat', rot=(0, 0, R(20)), scale=1.5)
    cam()


# ── 06 Cloud & DevOps: racks, the cloud, a CI/CD line ────────
def svc_cloud():
    room(dark=True, h=2.8)
    wall_screen((1.2, BY - 0.04, Z), 'cloud-console', w=3.6, h=2.0, z=1.7)
    for row in range(2):
        for k in range(3):
            server_rack((-2.8 + k * 0.98, 1.2 - row * 1.9, Z), units=6, h=1.9, alert=3 if (row, k) == (0, 1) else -1)
    cloud((-1.8, -0.3, Z + 4.2), s=1.15)
    for k in range(3):
        x = -2.8 + k * 0.98
        tube([(x, 1.2, Z + 1.9), (x * 0.7 - 0.5, 0.6, Z + 2.9), (-1.8, -0.3, Z + 3.6)], 0.035, GLOW_RED(5) if k == 1 else ALU())
    conveyor((1.4, -2.7, Z), length=4.4)
    for i, x in enumerate([-0.3, 0.8, 1.9, 3.0]):
        box((0.5, 0.42, 0.38), (x, -2.7, Z + 0.85), [CLAY(), CLAY_MID(), GRAPHITE(), RED_L()][i], bevel=0.04)
    for x in (0.25, 1.35, 2.45):
        g = empty((x, -2.7, Z))
        for sy in (-1, 1):
            box((0.09, 0.09, 1.35), (0, sy * 0.44, 0.68), ALU(), bevel=0.01, parent=g)
        box((0.11, 0.98, 0.11), (0, 0, 1.38), GLOW_RED(4) if x > 2 else mat('green_glow', hex_lin('#41d17a'), 0.4, emission=hex_lin('#41d17a'), strength=3), bevel=0.03, parent=g)
    worker((2.6, 1.2, Z), 0, body=RED_L(), desk_screens=['cloud-console', 'code-editor'])
    cam(12.0, (0, 0, 2.0))


# ── 07 Cybersecurity: a security operations room under a shield ─
def svc_cybersecurity():
    room(dark=True)
    wall_screen((1.0, BY - 0.04, Z), 'soc-dashboard', w=4.4, h=2.45, z=1.95)
    for i, x in enumerate((0.1, 2.5)):
        worker((x, 1.1, Z), 0, body=GRAPHITE() if i == 0 else CLAY_MID(), desk_screens=['soc-dashboard', 'code-editor'] if i == 0 else ['cloud-console', 'soc-dashboard'])
    worker((1.3, -1.3, Z), 0, body=RED_L(), desk_screens=['noc-monitor', 'soc-dashboard'])
    for k in range(3):
        server_rack((-2.5, -1.6 + k * 0.95, Z), units=5, rot_z=R(-90), alert=2 if k == 1 else -1, h=1.45)
    dome((-2.5, -0.65, Z), 1.95, SHIELD())
    torus(1.95, 0.035, (-2.5, -0.65, Z + 0.02), GLOW_RED(6))
    torus(1.45, 0.03, (-2.5, -0.65, Z + 1.3), GLOW_RED(6))
    shield((-2.5, -0.65, Z + 2.9), 0.6, RED_L(), rot=(R(90), 0, R(45)))
    shelf((LX + 0.2, 2.6, Z), w=1.4, rot_z=R(90))
    plant2((3.3, -3.3, Z), 1.1)
    cam(12.0)


# ── 08 Data & Analytics: a chart grown out of the floor ──────
def svc_data():
    room()
    wall_screen((0.8, BY - 0.04, Z), 'analytics-dashboard', w=4.2, h=2.35, z=1.95)
    hs = [0.6, 1.0, 0.8, 1.4, 1.15, 1.8, 1.55, 2.4]
    pts = []
    for i, h in enumerate(hs):
        x = -1.3 + i * 0.5
        box((0.38, 0.38, h), (x, -0.5, Z + h / 2), RED_L() if i == len(hs) - 1 else CLAY(), bevel=0.04)
        pts.append((x, -0.5, Z + h + 0.3))
    chrome = mat('chrome', hex_lin('#eef0f4'), 0.08, metal=1.0)
    tube(pts, 0.035, chrome)
    for p in pts:
        sphere(0.07, p, chrome)
    database((-2.8, 2.4, Z), s=0.9)
    database((-2.8, 1.0, Z), s=0.8, n=2)
    tube([(-2.8, 1.8, Z + 0.9), (-2.3, 0.6, Z + 0.12), (-1.5, -0.5, Z + 0.1)], 0.05, GLOW_RED(4))
    for k, (x, y, rz) in enumerate([(2.1, -2.2, 150), (3.0, -1.4, 200)]):
        person((x, y, Z), rot_z=R(rz), body=[GRAPHITE(), CLAY_MID()][k], pose='phone')
        tablet((x - 0.22, y - 0.28, Z + 1.18), 'analytics-dashboard', rot=(R(-60), 0, R(rz)), scale=0.32)
    worker((2.4, 1.7, Z), 0, body=RED_L(), desk_screens=['analytics-dashboard', 'erp-dashboard'])
    plant2((-3.3, -3.3, Z), 1.1)
    cam()


# ── 09 APIs & Integrations: systems joined by bridges of data ─
def svc_api():
    lights(1.0)
    shadow_catcher()

    def island(x, y, s=3.0, dark=False):
        box((s, s, 0.4), (x, y, 0.2), GRAPHITE() if dark else CLAY(), bevel=0.1)
        box((s - 0.3, s - 0.3, 0.2), (x, y, -0.05), INK() if dark else GRAPHITE(), bevel=0.06)

    island(0, 0, 3.0, dark=True)
    monitor((0, 0.35, 0.4), 'api-console', w=1.9, h=1.2)
    person((0.6, -0.7, 0.4), rot_z=R(160), body=RED_L())
    isl = [(-3.6, 2.4, 'shop-site'), (3.4, 2.4, 'erp-dashboard'), (-3.6, -2.8, 'phone-chat'), (3.4, -2.8, 'analytics-dashboard')]
    for x, y, tex in isl:
        island(x, y, 2.2)
        if tex.startswith('phone'):
            phone((x, y + 0.2, 0.4), tex, scale=1.1)
        else:
            monitor((x, y + 0.25, 0.4), tex, w=1.4, h=0.88)
        tube([(x * 0.22, y * 0.22, 0.42), (x * 0.5, y * 0.5, 0.95), (x * 0.78, y * 0.78, 0.42)], 0.07, INK())
        for t in (0.36, 0.56):
            box((0.15, 0.15, 0.15), (x * t, y * t, 0.97 - abs(t - 0.5) * 0.6 + 0.06), GLOW_RED(6), bevel=0.03)
        person((x + 0.6, y - 0.5, 0.4), rot_z=R(180), body=[CLAY_MID(), GRAPHITE(), CLAY(), CLAY_MID()][isl.index((x, y, tex))], scale=0.8)
    box((0.28, 0.4, 0.28), (1.4, -1.4, 1.35), RED_L(), bevel=0.06, rot=(R(20), 0, R(-30)))
    for dx in (-0.06, 0.06):
        cyl(0.02, 0.2, (1.4 + dx, -1.3, 1.56), ALU(), rot=(R(20), 0, R(-30)))
    cam(12.8, (0, -0.2, 0.8))


# ── 10 UX & Product Design: a studio with a testing corner ───
def svc_ux():
    room()
    sticky_wall((0.4, BY, Z), cols=9, rows=5, z=1.3)
    frame((LX, 2.0, Z), 'design-tool', w=1.4, h=0.9, rot_z=R(90), z=2.1)
    frame((LX, 0.2, Z), 'brand-board', w=1.4, h=0.9, rot_z=R(90), z=2.1)
    worker((0.9, 1.5, Z), 0, body=RED_L(), desk_screens=['design-tool', 'design-tool'])
    person((-1.4, 2.8, Z), rot_z=R(170), pose='present', body=GRAPHITE())
    sofa((-2.2, -1.9, Z), rot_z=R(0))
    person((-2.2, -1.85, Z + 0.2), rot_z=0, pose='sit', body=CLAY_MID())
    phone((-2.0, -2.25, Z + 1.0), 'phone-app', rot=(R(60), 0, 0), scale=0.24)
    person((-0.2, -2.9, Z), rot_z=R(120), body=GRAPHITE(), pose='phone')
    rug((2.0, -2.0, Z + 0.01), 2.6, 1.8, m=CLAY_WARM())
    box((1.3, 0.75, 0.42), (2.0, -2.0, Z + 0.23), GRAPHITE(), bevel=0.05)
    for i in range(5):
        box((0.38, 0.28, 0.01), (1.6 + i * 0.18, -2.0 + (i % 2) * 0.1, Z + 0.45 + i * 0.005), [CLAY(), RED_L(), CLAY_MID()][i % 3], bevel=0, rot=(0, 0, R(i * 13)))
    plant2((3.3, 3.2, Z), 1.2)
    lamp((1.5, 1.85, Z + 0.78))
    cam()


# ── 11 Branding & Marketing: a launch, built and broadcast ───
def svc_branding():
    open_stage(9, 9)
    billboard((0.4, 2.6, Z), 'billboard', w=4.0, h=2.0, z=1.9)
    box((2.8, 1.1, 0.78), (-1.4, -0.2, Z + 0.39), GRAPHITE(), bevel=0.05)
    for i, (x, h, m) in enumerate([(-2.3, 0.75, RED_L()), (-1.75, 0.55, CLAY()), (-1.2, 0.95, INK()), (-0.65, 0.48, RED_L())]):
        box((0.46, 0.46, h), (x, -0.2, Z + 0.78 + h / 2), m, bevel=0.04)
    for i in range(4):
        box((0.34, 0.2, 0.01), (-1.7 + i * 0.23, -0.6, Z + 0.79 + i * 0.002), [RED_L(), CLAY(), INK(), CLAY()][i], bevel=0.003, rot=(0, 0, R(i * 9)))
    cyl(0.12, 0.6, (2.6, -0.5, Z + 1.05), RED_L(), r2=0.42, rot=(R(70), 0, R(40)))
    person((2.2, -0.1, Z), rot_z=R(220), body=GRAPHITE())
    phone((3.2, -2.5, Z), 'brand-board', rot=(0, 0, R(-15)), scale=1.4)
    tripod_camera((0.4, -2.4, Z), rot_z=R(200))
    person((1.2, -3.1, Z), rot_z=R(200), body=CLAY_MID(), pose='phone')
    softbox((-3.2, 2.0, Z), rot_z=R(-40))
    softbox((-3.4, -2.6, Z), rot_z=R(-120))
    cam(12.4, (0, 0, 1.9))


# ── 12 3D, Motion & VFX: a film set around the hero object ───
def svc_motion():
    open_stage(9, 9)
    cyc = empty((-0.6, 1.4, Z))
    box((4.6, 0.2, 2.8), (0, 1.5, 1.4), CLAY(), bevel=0.05, parent=cyc)
    box((4.6, 1.8, 0.08), (0, 0.5, 0.04), CLAY(), bevel=0.04, parent=cyc)
    cyl(0.85, 0.16, (-0.6, 1.8, Z + 0.1), GRAPHITE())
    sphere(0.7, (-0.6, 1.8, Z + 0.9), RED_L())
    torus(1.1, 0.04, (-0.6, 1.8, Z + 0.9), mat('chrome', hex_lin('#eef0f4'), 0.08, metal=1.0), rot=(R(70), R(20), 0))
    tripod_camera((1.0, -0.5, Z), rot_z=R(150))
    for sy in (-0.25, 0.25):
        box((3.2, 0.05, 0.05), (0.7, -1.3 + sy, Z + 0.04), ALU(), bevel=0.01, rot=(0, 0, R(20)))
    softbox((-3.2, 0.2, Z), rot_z=R(-60))
    softbox((2.6, 2.6, Z), rot_z=R(60))
    worker((-2.3, -2.5, Z), R(-30), body=RED_L(), desk_screens=['video-editor', 'video-editor'])
    person((2.9, -1.6, Z), rot_z=R(140), pose='present', body=GRAPHITE())
    cam(12.4)


# ── 13 Game Development: play-testing a build ────────────────
def svc_games():
    room(dark=True)
    wall_screen((0.6, BY - 0.04, Z), 'game-screen', w=3.8, h=2.15, z=1.75)
    sofa((0.6, 1.3, Z), rot_z=R(180), w=2.2)
    for k, x in enumerate((0.15, 1.05)):
        person((x, 1.4, Z + 0.2), rot_z=R(180), pose='sit', body=[RED_L(), CLAY_MID()][k])
        controller((x, 0.98, Z + 1.0), rot=(R(20), 0, R(180)), s=0.45)
    g = empty((LX + 0.5, 2.0, Z), R(90))
    box((0.9, 0.8, 2.0), (0, 0, 1.0), INK(), bevel=0.05, parent=g)
    plane((0.72, 0.54), (0, -0.41, 1.5), screen_mat('game-screen', 1.6), rot=(R(80), 0, 0), parent=g)
    box((0.9, 0.45, 0.12), (0, -0.5, 0.95), RED_L(), bevel=0.03, parent=g)
    worker((2.2, -1.9, Z), R(-20), body=GRAPHITE(), desk_screens=['code-editor', 'game-screen'])
    for i, (x, y, z, m) in enumerate([(-2.2, -2.4, 0.22, RED_L()), (-1.75, -2.4, 0.22, CLAY()), (-1.98, -2.4, 0.66, INK()), (-2.2, -2.85, 0.22, CLAY_MID())]):
        box((0.44, 0.44, 0.44), (x, y, Z + z), m, bevel=0.04)
    shelf((LX + 0.2, -0.6, Z), w=1.6, rot_z=R(90))
    cam()


# ── 14 Tech Consulting: the strategy room ────────────────────
def svc_consulting():
    room()
    wall_screen((0.6, BY - 0.04, Z), 'consulting-board', w=4.2, h=2.35, z=1.95)
    box((4.0, 1.6, 0.08), (0.6, 0.4, Z + 0.78), CLAY_WARM(), bevel=0.04)
    for sx in (-1, 1):
        box((0.12, 1.1, 0.76), (0.6 + sx * 1.6, 0.4, Z + 0.38), GRAPHITE(), bevel=0.02)
    for k, x in enumerate([-0.6, 0.6, 1.8]):
        for side in (-1, 1):
            chair((x, 0.4 + side * 1.12, Z), rot_z=R(180 if side < 0 else 0))
            person((x, 0.4 + side * 1.02, Z), rot_z=R(180) if side < 0 else 0, pose='sit', body=[CLAY_MID(), GRAPHITE(), CLAY()][k] if side < 0 else [GRAPHITE(), RED_L(), CLAY_MID()][k])
        laptop((x, 0.4 - 0.4, Z + 0.82), 'consulting-board', rot_z=0, scale=0.42)
        laptop((x, 0.4 + 0.4, Z + 0.82), 'analytics-dashboard', rot_z=R(180), scale=0.42)
    person((-2.2, 2.6, Z), rot_z=R(40), pose='present', body=RED_L())
    window((LX, 0.4, Z), w=2.2, h=1.4, rot_z=R(90))
    plant2((3.3, -3.2, Z), 1.2)
    plant2((-3.3, -3.2, Z), 1.0)
    cam()


# ── 15 Managed Services: the support and monitoring desk ─────
def svc_managed():
    room(dark=True)
    wall_screen((-0.8, BY - 0.04, Z), 'noc-monitor', w=3.0, h=1.7, z=2.05)
    wall_screen((2.3, BY - 0.04, Z), 'cloud-console', w=2.6, h=1.46, z=2.05)
    for i, (x, y) in enumerate([(-1.2, 1.3), (1.0, 1.3), (3.0, 1.3), (-1.2, -1.0), (1.0, -1.0)]):
        worker((x, y, Z), 0, body=[RED_L(), GRAPHITE(), CLAY_MID(), CLAY(), GRAPHITE()][i], desk_screens=['noc-monitor'] if i % 2 else ['noc-monitor', 'cloud-console'])
        headset((x, y - 0.06, Z + 1.32))
    for k in range(3):
        server_rack((-3.2, -1.6 + k * 0.95, Z), units=6, rot_z=R(-90), alert=1 if k == 2 else -1, h=1.8)
    torus(1.4, 0.03, (-3.1, -0.65, Z + 2.2), GLOW_RED(5), rot=(R(80), 0, R(90)))
    plant2((3.3, -3.3, Z), 1.1)
    cam()


# ── Products ─────────────────────────────────────────────────
def prod_sports():
    lights(0.8, dark=True)
    shadow_catcher()
    box((10, 6.8, 0.5), (0, 0, 0.25), mat('pitch', hex_lin('#1d2620'), 0.85), bevel=0.12)
    box((9.6, 6.4, 0.25), (0, 0, -0.1), INK(), bevel=0.08)
    for i in range(10):
        box((0.96, 6.4, 0.004), (-4.5 + i * 1.0, 0, Z + 0.002), mat('stripe', hex_lin('#222c25') if i % 2 else hex_lin('#1a221d'), 0.85), bevel=0)
    line = mat('line', hex_lin('#e9e9ea'), 0.6, emission=(1, 1, 1), strength=0.5)
    for y in (2.9, -2.9):
        box((9.0, 0.05, 0.01), (0, y, Z + 0.006), line, bevel=0)
    box((0.05, 5.8, 0.01), (0, 0, Z + 0.006), line, bevel=0)
    for sx in (-1, 1):
        box((0.05, 5.8, 0.01), (sx * 4.5, 0, Z + 0.006), line, bevel=0)
        goal((sx * 4.4, 0, Z), rot_z=R(90 * -sx), w=1.7, h=0.8)
        box((0.05, 2.6, 0.01), (sx * 3.6, 0, Z + 0.006), line, bevel=0)
        for y in (1.3, -1.3):
            box((0.9, 0.05, 0.01), (sx * 4.05, y, Z + 0.006), line, bevel=0)
    torus(0.9, 0.025, (0, 0, Z + 0.006), line)
    for k, (x, y, rz, m) in enumerate([(-1.1, 0.5, 30, RED_L()), (0.9, -0.7, 200, CLAY()), (-2.4, -1.3, 60, RED_L()), (2.2, 1.4, 230, CLAY()), (-0.3, 2.0, 0, RED_L()), (2.8, -1.6, 160, CLAY()), (-3.6, 0.6, 90, RED_L())]):
        person((x, y, Z), rot_z=R(rz), body=m, scale=0.75, legs=GRAPHITE())
    football((-0.4, 0.05, Z + 0.13), r=0.13)
    for x, y, rz in [(-5.0, 3.4, 135), (5.0, 3.4, 225), (-5.0, -3.4, 45), (5.0, -3.4, -45)]:
        floodlight((x, y, 0), rot_z=R(rz + 180), h=3.8)
    phone((2.0, -4.3, 0), 'phone-sports', rot=(0, 0, R(-10)), scale=2.3)
    card = empty((-2.2, -4.2, 0), R(10))
    box((1.05, 0.06, 1.42), (0, 0, 0.85), mat('gold', hex_lin('#d9a645'), 0.25, metal=0.6, coat=1.0), bevel=0.06, parent=card)
    plane((0.9, 1.28), (0, -0.035, 0.85), screen_mat('phone-sports', 1.0), rot=(R(90), 0, 0), parent=card)
    person((-3.6, -3.2, 0), rot_z=R(160), body=GRAPHITE(), pose='phone')
    iso_camera(scale=14.0, target=(0, -0.8, 1.0))


def prod_nestbridge():
    lights(1.0, warm=True)
    shadow_catcher()
    platform(9, 9, m=CLAY())
    for floor in range(3):
        z = Z + floor * 1.25
        box((4.8, 3.3, 0.14), (-0.9, 1.1, z + 0.07), CLAY(), bevel=0.03)
        for u in range(3):
            x = -2.5 + u * 1.6
            box((0.07, 3.1, 1.1), (x - 0.78, 1.1, z + 0.69), CLAY_WARM(), bevel=0.01)
            sofa((x, 1.75, z + 0.14), rot_z=R(180), w=0.85, m=[GRAPHITE(), CLAY_MID(), RED_L()][(u + floor) % 3])
            box((0.46, 0.7, 0.46), (x - 0.3, 0.4, z + 0.37), CLAY_MID(), bevel=0.05)
            if (u + floor) % 2 == 0:
                person((x + 0.3, 0.5, z + 0.14), rot_z=R(200), body=[GRAPHITE(), RED_L(), CLAY_MID()][u], scale=0.6)
        box((4.8, 0.12, 1.1), (-0.9, 2.7, z + 0.69), CLAY_WARM(), bevel=0.01)
    box((5.0, 3.5, 0.18), (-0.9, 1.1, Z + 3.85), GRAPHITE(), bevel=0.04)
    phone((3.0, -0.5, Z), 'phone-nestbridge', rot=(0, 0, R(-20)), scale=2.5)
    person((1.8, -2.4, Z), rot_z=R(200), body=RED_L(), pose='phone')
    brass = mat('brass', hex_lin('#c9a24a'), 0.25, metal=1.0)
    torus(0.16, 0.035, (-2.8, -2.8, Z + 0.04), brass)
    box((0.45, 0.07, 0.035), (-2.48, -2.8, Z + 0.035), brass, bevel=0.01)
    person((-1.2, -2.6, Z), rot_z=R(160), body=GRAPHITE())
    box((0.46, 0.24, 0.28), (-0.8, -2.9, Z + 0.14), RED_L(), bevel=0.03)
    plant2((3.6, 3.5, Z), 1.3)
    plant2((-3.7, -3.5, Z), 1.0)
    iso_camera(scale=12.6, target=(0, 0, 2.0))


def prod_torqio():
    room(dark=True, h=2.8)
    cyl(1.8, 0.08, (0, 0.3, Z + 0.04), INK())
    torus(1.8, 0.02, (0, 0.3, Z + 0.08), GLOW_RED(4))
    car((0, 0.3, Z + 0.08), rot_z=R(15), body=CLAY(), scale=1.2)
    g = empty((0.4, 0.3, Z), R(15))
    torus(1.85, 0.06, (0, 0, 1.25), INK(), rot=(0, R(90), 0), parent=g)
    torus(1.85, 0.02, (0.04, 0, 1.25), GLOW_RED(9), rot=(0, R(90), 0), parent=g)
    plane((0.02, 3.4), (0.05, 0, 1.25), mat('scan', hex_lin('#ff2a3a'), 0.3, emission=hex_lin('#ff2a3a'), strength=2, alpha=0.25), rot=(0, 0, 0), parent=g)
    shield((0, 0.3, Z + 3.0), 0.5, RED_L(), rot=(R(90), 0, R(45)))
    person((-2.1, -1.6, Z), rot_z=R(140), body=GRAPHITE())
    box((0.46, 0.24, 0.28), (-2.6, -1.9, Z + 0.14), RED_L(), bevel=0.03)
    person((2.2, -2.0, Z), rot_z=R(200), body=CLAY_MID(), pose='phone')
    phone((3.0, -3.0, Z), 'phone-torqio', rot=(0, 0, R(-15)), scale=1.8)
    wall_screen((0.8, BY - 0.04, Z), 'phone-torqio', w=1.3, h=1.9, z=1.6)
    shelf((LX + 0.2, 1.4, Z), w=1.8, rot_z=R(90))
    for i in range(3):
        cyl(0.28, 0.18, (-3.1 + i * 0.08, -3.1, Z + 0.09 + i * 0.18), mat('rubber2', hex_lin('#1b1b1e'), 0.75))
    cam(12.0)


# ── About: the GWD studio in Madhapur ────────────────────────
def plank_floor():
    """Pale timber planks, kept in the clay palette."""
    m = bpy.data.materials.get('plank_floor')
    if m:
        return m
    m = bpy.data.materials.new('plank_floor')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*hex_lin('#e9e3da'), 1)
    br.inputs['Color2'].default_value = (*hex_lin('#ddd5ca'), 1)
    br.inputs['Mortar'].default_value = (*hex_lin('#c9c0b4'), 1)
    br.inputs['Scale'].default_value = 1.6
    br.inputs['Mortar Size'].default_value = 0.006
    br.inputs['Brick Width'].default_value = 2.2
    br.inputs['Row Height'].default_value = 0.3
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.38
    return m


def gwd_office():
    """The GWD studio: desks under pendant lights, a glass meeting room, a
    lounge, a coffee bar, a dashboard wall, shelves, and the GWD lockup on the
    back wall (composited flat after render, so its colours stay exact)."""
    lights(1.0, warm=True)
    shadow_catcher()
    W = 10
    platform(W, W)
    walls(W, W, h=3.3, floor=plank_floor())
    by = back_y(W)
    lx = left_x(W)
    import gwd

    # The sign: a white board with the mark and GET WORK DONE (overlay.py).
    cx, cz, fy = 0.2, Z + 2.3, by - 0.05
    box((3.7, 0.05, 2.3), (cx, by - 0.02, cz), mat('plate', hex_lin('#f7f7f8'), 0.6), bevel=0.02)
    lw = 3.3
    lh = lw * 1340 / 2320
    gwd.OVERLAYS.append(
        {
            'image': 'gwd-lockup.png',
            'corners': [(cx - lw / 2, fy, cz + lh / 2), (cx + lw / 2, fy, cz + lh / 2), (cx + lw / 2, fy, cz - lh / 2), (cx - lw / 2, fy, cz - lh / 2)],
        }
    )
    # A low credenza under it, with a trophy, books and a plant.
    box((3.2, 0.5, 0.62), (cx, by - 0.3, Z + 0.31), GRAPHITE(), bevel=0.03)
    cyl(0.12, 0.05, (cx - 0.9, by - 0.3, Z + 0.65), INK())
    cyl(0.16, 0.34, (cx - 0.9, by - 0.3, Z + 0.84), mat('chrome', hex_lin('#eef0f4'), 0.08, metal=1.0), r2=0.06)
    for k in range(4):
        box((0.08, 0.32, 0.36 - k * 0.03), (cx + 0.3 + k * 0.1, by - 0.3, Z + 0.8 - k * 0.015), [RED_L(), CLAY(), GRAPHITE(), CLAY_MID()][k], bevel=0.005)
    plant2((cx + 1.3, by - 0.3, Z + 0.62), 0.55)
    # Back wall, right: a tall bookshelf.
    shelf((3.7, by - 0.2, Z), w=1.5, levels=5)
    # Back wall, left: the planning wall and a server rack in the corner.
    sticky_wall((-2.5, by, Z), cols=5, rows=3, z=1.55)
    server_rack((lx + 0.55, by - 0.5, Z), units=6, h=1.9)

    # The desks: two rows of three, each under a long pendant light, on a soft grey runner.
    rug((1.3, 0.15, Z + 0.006), 6.6, 3.6, m=mat('desk_rug', hex_lin('#cfcfd3'), 0.95))
    rows = [1.2, -0.9]
    screens = [['code-editor', 'api-console'], ['design-tool'], ['analytics-dashboard'], ['shop-site'], ['saas-product', 'ai-workflow'], ['cloud-console']]
    bodies = [RED_L(), GRAPHITE(), CLAY_MID(), CLAY(), GRAPHITE(), RED_L()]
    for r, y in enumerate(rows):
        for c, x in enumerate((-0.9, 1.3, 3.5)):
            i = r * 3 + c
            worker((x, y, Z), 0, body=bodies[i], desk_screens=screens[i])
        # A small round pendant over each desk.
        for x in (-0.9, 1.3, 3.5):
            cyl(0.006, 0.9, (x, y + 0.55, Z + 2.95), GRAPHITE())
            cyl(0.26, 0.2, (x, y + 0.55, Z + 2.4), GRAPHITE(), r2=0.08)
            cyl(0.2, 0.01, (x, y + 0.55, Z + 2.295), GLOW_WHITE(6))

    # The glass meeting room, front left.
    gx0, gx1, gy0, gy1 = -4.7, -1.7, -4.7, -1.9
    glass = mat('glass_room', hex_lin('#dfe8ee'), 0.05, alpha=0.16)
    box((0.05, gy1 - gy0, 2.6), (gx1, (gy0 + gy1) / 2, Z + 1.3), glass, bevel=0)
    box((gx1 - gx0, 0.05, 2.6), ((gx0 + gx1) / 2, gy1, Z + 1.3), glass, bevel=0)
    for (a, b2, vertical) in ((gx1, (gy0 + gy1) / 2, True), ((gx0 + gx1) / 2, gy1, False)):
        span = (gy1 - gy0) if vertical else (gx1 - gx0)
        size = (0.07, span, 0.06) if vertical else (span, 0.07, 0.06)
        box(size, (a, b2, Z + 2.6), ALU(), bevel=0.01)
        box(size, (a, b2, Z + 0.03), ALU(), bevel=0.01)
    box((0.07, 0.07, 2.6), (gx1, gy1, Z + 1.3), ALU(), bevel=0.01)
    mx, my = (gx0 + gx1) / 2, (gy0 + gy1) / 2
    box((1.9, 1.0, 0.06), (mx, my, Z + 0.76), CLAY_WARM(), bevel=0.03)
    cyl(0.06, 0.74, (mx, my, Z + 0.37), GRAPHITE())
    for k, (dx, dy, rz) in enumerate([(-0.55, 0.75, 180), (0.55, 0.75, 180), (-0.55, -0.75, 0), (0.55, -0.75, 0)]):
        chair((mx + dx, my + dy, Z), rot_z=R(rz))
        if k != 3:
            person((mx + dx, my + dy * 0.9, Z), rot_z=R(rz), pose='sit', body=[CLAY_MID(), RED_L(), GRAPHITE()][k])
    laptop((mx - 0.5, my + 0.15, Z + 0.79), 'saas-product', rot_z=R(180), scale=0.55)
    monitor((gx0 + 0.25, my, Z + 0.4), 'consulting-board', w=1.3, h=0.75, rot_z=R(-90))
    box((0.4, 0.9, 0.4), (gx0 + 0.25, my, Z + 0.2), GRAPHITE(), bevel=0.02)
    person((gx0 + 0.75, my - 0.9, Z), rot_z=R(-60), pose='present', body=GRAPHITE())

    # The lounge, front right.
    rug((3.4, -3.3, Z + 0.01), 2.8, 2.2, m=mat('rug', hex_lin('#bdbec4'), 0.9))
    sofa((3.4, -2.55, Z), rot_z=R(180), w=2.0, m=GRAPHITE())
    box((1.0, 0.6, 0.32), (3.4, -3.4, Z + 0.16), CLAY_WARM(), bevel=0.04)
    mug((3.2, -3.4, Z + 0.36))
    laptop((3.6, -3.4, Z + 0.33), 'brand-board', rot_z=R(10), scale=0.45)
    person((3.0, -2.6, Z + 0.2), rot_z=R(180), pose='sit', body=CLAY())
    person((4.4, -4.1, Z), rot_z=R(135), pose='phone', body=RED_L())
    plant2((4.5, -2.1, Z), 1.2)
    for (px, py, ps) in ((-4.55, -0.9, 1.05), (4.6, 2.3, 1.15), (-1.1, -4.6, 0.85), (2.1, 3.9, 0.75)):
        plant2((px, py, Z), ps)
    practical((0.3, 0.2, Z + 3.7), energy=260, size=6.0)
    cyl(0.02, 1.6, (2.0, -2.3, Z + 0.8), GRAPHITE())
    cyl(0.2, 0.25, (2.0, -2.3, Z + 1.65), CLAY(), r2=0.12)

    # The coffee bar along the left wall, and a chat by it.
    box((0.65, 2.4, 0.95), (lx + 0.35, 2.6, Z + 0.475), GRAPHITE(), bevel=0.03)
    box((0.7, 2.45, 0.05), (lx + 0.35, 2.6, Z + 0.97), CLAY_WARM(), bevel=0.01)
    box((0.4, 0.4, 0.5), (lx + 0.35, 3.3, Z + 1.24), INK(), bevel=0.04)
    sphere(0.03, (lx + 0.56, 3.3, Z + 1.35), GLOW_RED(8), seg=12)
    for k in range(3):
        mug((lx + 0.35, 2.0 + k * 0.25, Z + 1.03))
    person((lx + 1.3, 2.1, Z), rot_z=R(240), pose='stand', body=CLAY_MID())
    person((lx + 1.6, 2.9, Z), rot_z=R(150), pose='stand', body=RED_L())
    frame((lx, 2.6, Z), 'brand-board', w=1.2, h=0.8, rot_z=R(90), z=2.35)
    # The dashboard wall.
    wall_screen((lx + 0.04, -0.3, Z), 'analytics-dashboard', w=2.6, h=1.5, rot_z=R(90), z=1.95)
    plant2((lx + 0.45, 4.2, Z), 1.0)
    plant2((lx + 0.45, -1.5, Z), 0.9)
    iso_camera(scale=15.2, target=(0, 0, 1.7))


SCENES = {
    'svc-product': {'build': svc_product},
    'svc-enterprise': {'build': svc_enterprise},
    'svc-web': {'build': svc_web},
    'svc-mobile': {'build': svc_mobile},
    'svc-ai': {'build': svc_ai},
    'svc-cloud': {'build': svc_cloud},
    'svc-cybersecurity': {'build': svc_cybersecurity},
    'svc-data': {'build': svc_data},
    'svc-api': {'build': svc_api},
    'svc-ux': {'build': svc_ux},
    'svc-branding': {'build': svc_branding},
    'svc-motion': {'build': svc_motion},
    'svc-games': {'build': svc_games},
    'svc-consulting': {'build': svc_consulting},
    'svc-managed': {'build': svc_managed},
    'prod-sports': {'build': prod_sports},
    'prod-nestbridge': {'build': prod_nestbridge},
    'prod-torqio': {'build': prod_torqio},
    'gwd-office': {'build': gwd_office},
}
