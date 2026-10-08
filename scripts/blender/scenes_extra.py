"""Small dioramas: the five steps of how GWD works, and the GWD Sports pillars."""

import math

import bpy

from gwd import (
    ALU,
    CLAY,
    CLAY_MID,
    CLAY_WARM,
    GLASS,
    GLOW_RED,
    GRAPHITE,
    INK,
    LOGO_RED_L,
    RED_L,
    box,
    chair,
    cyl,
    empty,
    hex_lin,
    iso_camera,
    laptop,
    lights,
    mat,
    person,
    plane,
    platform,
    screen_mat,
    server_rack,
    shadow_catcher,
    sphere,
    tablet,
    tube,
    wall_screen,
)
from props import football, headset, plant2
from scenes import BY, Z, cam, room, worker

R = math.radians


def mini(dark=False, size=4.4):
    lights(0.9 if dark else 1.0, dark=dark)
    shadow_catcher()
    platform(size, size, m=GRAPHITE() if dark else CLAY())


def step_brief():
    mini()
    box((1.6, 0.9, 0.06), (0, 0.2, Z + 0.75), CLAY_WARM(), bevel=0.02)
    for sx in (-1, 1):
        box((0.05, 0.8, 0.72), (sx * 0.72, 0.2, Z + 0.36), GRAPHITE(), bevel=0.01)
    laptop((-0.1, 0.25, Z + 0.78), 'code-editor', scale=0.5)
    chair((0, -0.55, Z))
    person((0, -0.45, Z), rot_z=R(180), pose='sit', body=RED_L())
    for i in range(4):
        box((0.42, 0.3, 0.012), (0.55, 0.05, Z + 0.79 + i * 0.012), CLAY(), bevel=0.002, rot=(0, 0, R(i * 7)))
    me = bpy.data.meshes.new('paperplane')
    verts = [(0, 0.6, 0), (-0.3, -0.3, 0), (0, -0.15, -0.08), (0.3, -0.3, 0), (0, -0.15, 0.05)]
    me.from_pydata(verts, [], [(0, 1, 2), (0, 2, 3), (0, 4, 1), (0, 3, 4)])
    o = bpy.data.objects.new('paperplane', me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(RED_L())
    o.location = (0.9, 1.4, Z + 2.2)
    o.rotation_euler = (R(15), R(-20), R(-30))
    o.scale = (0.9, 0.9, 0.9)
    tube([(0.05, 0.4, Z + 1.2), (0.3, 0.9, Z + 1.7), (0.85, 1.35, Z + 2.15)], 0.012, mat('trail', hex_lin('#c9c9ce'), 0.5))
    plant2((-1.8, 1.7, Z), 0.9)
    iso_camera(scale=6.0, target=(0, 0.3, 1.3))


def step_scope():
    mini()
    box((2.4, 1.6, 0.06), (0, 0, Z + 0.75), GRAPHITE(), bevel=0.02)
    for sx in (-1, 1):
        box((0.06, 1.4, 0.72), (sx * 1.1, 0, Z + 0.36), INK(), bevel=0.01)
    plane((2.0, 1.25), (0, 0, Z + 0.785), screen_mat('consulting-board', 0.8))
    box((1.2, 0.08, 0.02), (0.3, -0.45, Z + 0.8), ALU(), bevel=0.003, rot=(0, 0, R(25)))
    for k, (x, y, rz) in enumerate([(-1.5, -0.6, 300), (1.5, 0.7, 120)]):
        person((x, y, Z), rot_z=R(rz), pose='present' if k == 0 else 'stand', body=[RED_L(), CLAY_MID()][k])
    iso_camera(scale=6.0, target=(0, 0, 1.2))


def step_build():
    mini()
    for i, (x, y) in enumerate([(-0.4, -0.3), (0.4, -0.3), (-0.4, 0.5), (0.4, 0.5)]):
        box((0.75, 0.75, 0.6), (x, y, Z + 0.3), CLAY() if i % 2 else CLAY_MID(), bevel=0.05)
    box((0.75, 0.75, 0.6), (-0.4, -0.3, Z + 0.9), CLAY(), bevel=0.05)
    box((0.75, 0.75, 0.6), (0.4, 0.5, Z + 0.9), GRAPHITE(), bevel=0.05)
    box((0.7, 0.7, 0.55), (0.4, -0.3, Z + 1.95), RED_L(), bevel=0.05)
    cyl(0.07, 3.4, (1.6, 1.4, Z + 1.7), RED_L())
    box((2.7, 0.12, 0.12), (1.0, 0.55, Z + 3.4), RED_L(), bevel=0.02, rot=(0, 0, R(54.8)))
    tube([(0.4, -0.3, Z + 2.25), (0.4, -0.3, Z + 3.3)], 0.012, GRAPHITE())
    for k, (x, y, rz) in enumerate([(-1.6, -1.2, 200), (1.4, -1.4, 160)]):
        person((x, y, Z), rot_z=R(rz), body=[GRAPHITE(), CLAY_MID()][k])
    iso_camera(scale=6.6, target=(0, 0, 1.7))


def step_launch():
    mini(dark=True)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=1.8, location=(0, 0.2, Z + 1.3), vertices=64)
    body = bpy.context.object
    body.data.materials.append(CLAY())
    for p in body.data.polygons:
        p.use_smooth = True
    cyl(0.35, 0.7, (0, 0.2, Z + 2.55), RED_L(), r2=0.0)
    for a in (0, 120, 240):
        box((0.08, 0.5, 0.6), (math.cos(R(a)) * 0.38, 0.2 + math.sin(R(a)) * 0.38, Z + 0.6), LOGO_RED_L(), bevel=0.02, rot=(0, 0, R(a + 90)))
    sphere(0.14, (0, -0.15, Z + 1.7), GLASS(), seg=24)
    cyl(0.55, 0.2, (0, 0.2, Z + 0.1), INK())
    for i, (x, y, r) in enumerate([(0.5, -0.2, 0.35), (-0.5, -0.1, 0.32), (0.1, -0.6, 0.38), (-0.2, 0.7, 0.3), (0.7, 0.5, 0.28)]):
        sphere(r, (x, y + 0.2, Z + 0.15), CLAY_MID() if i % 2 else CLAY())
    sphere(0.22, (0, 0.2, Z + 0.15), GLOW_RED(10))
    from gwd import monitor

    monitor((-1.6, 1.3, Z), 'cloud-console', w=0.9, h=0.56)
    iso_camera(scale=6.0, target=(0, 0.2, 1.6))


def step_run():
    mini(dark=True)
    server_rack((-1.2, 1.0, Z), units=5, h=1.6)
    server_rack((-0.25, 1.0, Z), units=5, h=1.6, alert=2)
    pts = [(-1.8, -0.6, Z + 1.2), (-1.0, -0.6, Z + 1.2), (-0.7, -0.6, Z + 1.7), (-0.4, -0.6, Z + 0.8), (-0.1, -0.6, Z + 1.4), (0.3, -0.6, Z + 1.2), (1.6, -0.6, Z + 1.2)]
    tube(pts, 0.03, GLOW_RED(8))
    worker((1.2, 0.6, Z), R(-30), body=CLAY_MID(), desk_screens=['noc-monitor'])
    headset((1.2, 0.54, Z + 1.32))
    iso_camera(scale=6.0, target=(0, 0.2, 1.1))


def sports_academy():
    lights(0.9, dark=True)
    shadow_catcher()
    box((8, 7, 0.5), (0, 0, 0.25), mat('pitch', hex_lin('#1d2620'), 0.85), bevel=0.12)
    box((7.6, 6.6, 0.25), (0, 0, -0.1), INK(), bevel=0.08)
    line = mat('line', hex_lin('#e9e9ea'), 0.6, emission=(1, 1, 1), strength=0.5)
    box((7.0, 0.05, 0.01), (0, 2.9, Z + 0.006), line, bevel=0)
    box((0.05, 5.8, 0.01), (-3.5, 0, Z + 0.006), line, bevel=0)
    for i in range(6):
        cyl(0.12, 0.25, (-2.2 + i * 0.8, 0.6 + (i % 2) * 0.4, Z + 0.125), RED_L(), r2=0.02)
    for k, (x, y, rz) in enumerate([(-2.0, -0.2, 20), (-0.8, -0.6, 340), (0.6, -0.1, 30), (1.8, -0.6, 350), (0.0, 1.6, 180)]):
        person((x, y, Z), rot_z=R(rz), body=RED_L() if k < 4 else CLAY(), scale=0.62, legs=GRAPHITE())
    football((-1.4, -0.8, Z + 0.1), r=0.1)
    person((2.8, 1.4, Z), rot_z=R(220), body=GRAPHITE(), pose='phone')
    tablet((2.6, 1.15, Z + 1.18), 'phone-sports', rot=(R(-60), 0, R(220)), scale=0.3)
    g = empty((-3.0, -2.4, Z), R(30))
    cyl(0.05, 1.1, (0, 0, 0.55), ALU(), parent=g)
    box((0.6, 0.06, 0.8), (0, 0, 1.35), INK(), bevel=0.04, parent=g)
    plane((0.5, 0.7), (0, -0.035, 1.35), screen_mat('phone-sports', 1.4), rot=(R(90), 0, 0), parent=g)
    person((-1.8, -2.8, Z), rot_z=R(160), body=CLAY_MID(), pose='phone')
    for i, x in enumerate((2.2, 3.0)):
        box((0.7, 1.6, 0.3 + i * 0.4), (x, -2.4, Z + 0.15 + i * 0.2), GRAPHITE(), bevel=0.04)
    iso_camera(scale=9.6, target=(0, 0, 1.0))


def sports_tournament():
    room(dark=True)
    wall_screen((0.2, BY - 0.04, Z), 'phone-sports', w=1.5, h=2.3, z=1.8)
    wall_screen((2.4, BY - 0.04, Z), 'analytics-dashboard', w=2.0, h=1.15, z=2.1)
    for row in range(2):
        for k in range(3):
            x = -0.8 + k * 1.3
            y = -0.4 - row * 1.6
            box((1.0, 0.6, 0.06), (x, y + 0.4, Z + 0.72), CLAY_WARM(), bevel=0.02)
            box((0.06, 0.5, 0.7), (x, y + 0.4, Z + 0.36), GRAPHITE(), bevel=0.01)
            chair((x, y - 0.2, Z), rot_z=0)
            person((x, y - 0.1, Z), rot_z=R(180), pose='sit', body=[RED_L(), CLAY_MID(), GRAPHITE()][(row + k) % 3])
            if (row + k) % 2 == 0:
                cyl(0.015, 0.45, (x + 0.25, y - 0.05, Z + 1.4), GRAPHITE())
                cyl(0.15, 0.02, (x + 0.25, y - 0.05, Z + 1.66), RED_L(), rot=(R(90), 0, 0))
    box((0.7, 0.5, 1.0), (-2.6, 2.2, Z + 0.5), RED_L(), bevel=0.04)
    person((-2.6, 2.7, Z), rot_z=R(200), pose='present', body=GRAPHITE())
    chrome = mat('chrome', hex_lin('#eef0f4'), 0.08, metal=1.0)
    cyl(0.25, 0.5, (2.8, -2.6, Z + 0.25), INK())
    cyl(0.32, 0.45, (2.8, -2.6, Z + 0.95), chrome, r2=0.12)
    cyl(0.05, 0.25, (2.8, -2.6, Z + 0.62), chrome)
    cam()


EXTRA = {
    'step-brief': {'build': step_brief},
    'step-scope': {'build': step_scope},
    'step-build': {'build': step_build},
    'step-launch': {'build': step_launch},
    'step-run': {'build': step_run},
    'sports-academy': {'build': sports_academy},
    'sports-tournament': {'build': sports_tournament},
}
