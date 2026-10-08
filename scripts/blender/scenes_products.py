"""The four product dioramas, each a small living world rather than a single
object: the GWD Sports stadium on match night, a NestBridge neighbourhood
where homes are sold, rented, built and maintained, a Torqio mobility hub
(showroom, service bay, spare parts) and DreamX's city stores delivering to
doorsteps inside a 30-minute ring.

  blender -b --factory-startup --python scripts/blender/render.py -- prod-sports,prod-nestbridge,prod-torqio,prod-dreamx 1600 192
"""

import math
import random

from gwd import (
    CLAY,
    CLAY_MID,
    CLAY_WARM,
    GLOW_RED,
    GLOW_WHITE,
    GRAPHITE,
    INK,
    RED_L,
    box,
    cyl,
    empty,
    hex_lin,
    iso_camera,
    lights,
    mat,
    person,
    phone,
    plane,
    screen_mat,
    shadow_catcher,
    sphere,
    torus,
    wall_screen,
)
from props import floodlight, football, goal, plant2, van
from props_city import (
    ASPHALT,
    CONCRETE,
    PAVING,
    apartment,
    awning,
    bench,
    boutique,
    car_lift,
    construction,
    crane,
    fascia,
    glow,
    hatch,
    kiosk,
    lacquer,
    lamp_post,
    map_pin,
    matte,
    motorbike,
    open_top,
    parts_shelf,
    road,
    route,
    scooter,
    sedan,
    sidewalk,
    sign_post,
    stand,
    suv,
    tool_cabinet,
    tree,
    truck,
    tyre_stack,
    villa,
)
from gwd import parcel

R = math.radians
Z = 0.5
DREAMX = '#B4005A'


def base(w, d, top, plinth=None):
    box((w, d, 0.5), (0, 0, 0.25), top, bevel=0.12)
    box((w - 0.4, d - 0.4, 0.25), (0, 0, -0.1), plinth or GRAPHITE(), bevel=0.08)


def lean(g, deg):
    g.rotation_euler.x = R(deg)
    return g


def street_trees(points, kind='round', s=0.85, seed=0):
    for i, (x, y) in enumerate(points):
        tree((x, y, Z + 0.08), s, kind, seed=seed + i)


def big_phone(loc, tex, rot_z, scale=2.5):
    phone(loc, tex, rot=(0, 0, rot_z), scale=scale)
    box((0.9 * scale * 0.72, 0.5, 0.05), (loc[0], loc[1] + 0.1, loc[2] + 0.025), INK(), bevel=0.02, rot=(0, 0, rot_z))


# ── GWD Sports: a stadium on match night ──────────────────────
def prod_sports():
    lights(0.7, dark=True)
    shadow_catcher()
    W, D = 13.0, 10.4
    base(W, D, GRAPHITE(), INK())
    px, py = 0.7, -0.9
    PW, PD = 8.2, 5.0
    turf = [mat('turf_a', hex_lin('#2f5b38'), 0.85), mat('turf_b', hex_lin('#356842'), 0.85)]
    box((PW + 1.0, PD + 0.9, 0.04), (px, py, Z + 0.02), mat('turf_edge', hex_lin('#284d30'), 0.9), bevel=0.01)
    n = 12
    for i in range(n):
        box((PW / n, PD, 0.012), (px - PW / 2 + (i + 0.5) * PW / n, py, Z + 0.046), turf[i % 2], bevel=0)
    line = mat('pitch_line', hex_lin('#f4f4f0'), 0.6, emission=(1, 1, 1), strength=0.35)
    lz = Z + 0.055
    for y in (py - PD / 2, py + PD / 2):
        box((PW, 0.045, 0.006), (px, y, lz), line, bevel=0)
    for x in (px - PW / 2, px, px + PW / 2):
        box((0.045, PD, 0.006), (x, py, lz), line, bevel=0)
    torus(0.75, 0.022, (px, py, lz), line)
    sphere(0.05, (px, py, lz), line, seg=12, scale=(1, 1, 0.1))
    for sx in (-1, 1):
        gx = px + sx * PW / 2
        box((0.045, 2.6, 0.006), (gx - sx * 1.25, py, lz), line, bevel=0)
        for y in (py - 1.3, py + 1.3):
            box((1.25, 0.045, 0.006), (gx - sx * 0.625, y, lz), line, bevel=0)
        box((0.045, 1.3, 0.006), (gx - sx * 0.5, py, lz), line, bevel=0)
        for y in (py - 0.65, py + 0.65):
            box((0.5, 0.045, 0.006), (gx - sx * 0.25, y, lz), line, bevel=0)
        goal((gx + sx * 0.05, py, Z + 0.05), rot_z=R(90 * -sx), w=1.3, h=0.62)
    # Players: home in GWD red, away in white, keepers apart, a referee in black.
    home, away = RED_L(), CLAY()
    shorts = mat('shorts', hex_lin('#1d1d21'), 0.6)
    rnd = random.Random(4)
    ball = (px + 0.9, py - 0.4)
    spots = [(-3.0, 0, home, 0), (-2.0, -1.4, home, 1), (-2.1, 1.3, home, 1), (-0.8, -0.6, home, 1), (-0.6, 1.6, home, 1), (0.6, -0.2, home, 1), (1.6, -1.7, home, 1),
             (3.4, 0.1, away, 0), (2.2, 1.2, away, 1), (2.0, -0.9, away, 1), (1.1, 0.7, away, 1), (0.2, -1.9, away, 1), (-1.4, 0.4, away, 1), (1.3, -0.35, away, 1)]
    for x, y, m, run in spots:
        loc = (px + x, py + y, Z + 0.05)
        face = math.atan2(ball[1] - loc[1], ball[0] - loc[0]) + R(90)
        keeper = mat('keeper', hex_lin('#f2c94c'), 0.5) if not run else m
        g = person(loc, rot_z=face + rnd.uniform(-0.3, 0.3), body=keeper, scale=0.62, legs=shorts if m is home else mat('shorts_w', hex_lin('#e4e4e6'), 0.6))
        if run:
            lean(g, rnd.uniform(6, 14))
    person((px - 0.2, py + 1.1, Z + 0.05), rot_z=R(200), body=INK(), scale=0.62)
    football((ball[0], ball[1], Z + 0.13), r=0.08)
    # Grandstands: a deep stand behind the far touchline, another behind the left goal.
    back_y = py + PD / 2 + 0.75
    top = stand((px - 0.2, back_y, Z), 10.6, 6, axis='x', facing=-1, seed=21)
    left_x = px - PW / 2 - 0.75
    stand((left_x, py - 0.2, Z), 5.6, 5, axis='y', facing=1, seed=22)
    # Roof canopies with a strip of light along the leading edge.
    roof = mat('roof', hex_lin('#26272d'), 0.4, coat=0.5)
    rz = top + 1.1
    box((10.8, 2.0, 0.08), (px - 0.2, back_y + 1.6, rz), roof, bevel=0.02, rot=(R(-6), 0, 0))
    plane((10.6, 0.06), (px - 0.2, back_y + 0.62, rz - 0.12), GLOW_WHITE(14), rot=(R(180), 0, 0))
    for i in range(5):
        cyl(0.06, rz - Z, (px - 5.0 + i * 2.4, back_y + 2.55, (rz + Z) / 2), INK(), verts=16)
    box((2.0, 5.8, 0.08), (left_x - 1.5, py - 0.2, rz - 0.3), roof, bevel=0.02, rot=(0, R(6), 0))
    plane((0.06, 5.6), (left_x - 0.55, py - 0.2, rz - 0.42), GLOW_WHITE(14), rot=(R(180), 0, 0))
    for i in range(3):
        cyl(0.06, rz - Z - 0.3, (left_x - 2.4, py - 2.6 + i * 2.4, (rz - 0.3 + Z) / 2), INK(), verts=16)
    # Floodlight masts at the corners.
    for x, y, rz_ in [(-W / 2 + 0.5, D / 2 - 0.5, -45), (W / 2 - 0.5, D / 2 - 0.5, 45), (W / 2 - 0.5, -D / 2 + 0.5, 135), (-W / 2 + 0.5, -D / 2 + 0.5, -135)]:
        floodlight((x, y, Z), rot_z=R(rz_ + 180), h=6.2)
    # Scoreboard on the corner between the stands, facing the camera.
    sb = empty((-W / 2 + 1.4, D / 2 - 1.2, Z), R(45))
    for sx in (-1, 1):
        cyl(0.06, 4.3, (sx * 1.0, 0.1, 2.15), INK(), verts=16, parent=sb)
    wall_screen((0, 0, 0), 'board-sports', w=2.9, h=1.0, z=4.6, parent=sb, strength=2.2)
    # LED advertising boards along the near touchline and the right goal line.
    for k in range(4):
        b = empty((px - PW / 2 + 1.05 + k * 2.05, py - PD / 2 - 0.42, Z), 0)
        box((1.9, 0.06, 0.24), (0, 0, 0.14), INK(), bevel=0.01, parent=b)
        plane((1.86, 0.2), (0, -0.032, 0.14), screen_mat('ads-sports', 1.6), rot=(R(90), 0, 0), parent=b)
    b = empty((px + PW / 2 + 0.45, py, Z), R(90))
    box((4.0, 0.06, 0.24), (0, 0, 0.14), INK(), bevel=0.01, parent=b)
    plane((3.96, 0.2), (0, -0.032, 0.14), screen_mat('ads-sports', 1.6), rot=(R(90), 0, 0), parent=b)
    # Dugouts and the bench, a coach with the app.
    for k, x in enumerate((px - 1.6, px + 1.2)):
        d = empty((x, py - PD / 2 - 1.15, Z), 0)
        box((1.3, 0.5, 0.05), (0, 0, 0.03), CONCRETE(), bevel=0.01, parent=d)
        box((1.2, 0.3, 0.06), (0, 0.08, 0.3), RED_L() if k == 0 else CLAY(), bevel=0.02, parent=d)
        box((1.3, 0.55, 0.04), (0, 0.05, 0.85), mat('dug_glass', hex_lin('#d6e4ec'), 0.05, transmission=0.85), bevel=0.01, rot=(R(-8), 0, 0), parent=d)
        for sx in (-1, 1):
            box((0.04, 0.5, 0.85), (sx * 0.64, 0.05, 0.43), mat('dug_glass', hex_lin('#d6e4ec'), 0.05, transmission=0.85), bevel=0.005, parent=d)
        for i in range(3):
            person((-0.4 + i * 0.4, 0.05, 0.0), rot_z=0, pose='sit', body=RED_L() if k == 0 else CLAY(), scale=0.55, parent=d)
    person((px + 2.9, py - PD / 2 - 1.1, Z), rot_z=R(160), body=GRAPHITE(), pose='phone', scale=0.75)
    # A broadcast camera on the halfway line.
    c = empty((px + 0.1, py - PD / 2 - 1.0, Z), R(180))
    for a in range(3):
        cyl(0.015, 0.75, (math.cos(a * 2.09) * 0.12, math.sin(a * 2.09) * 0.12, 0.36), GRAPHITE(), rot=(math.sin(a * 2.09) * 0.25, -math.cos(a * 2.09) * 0.25, 0), verts=8, parent=c)
    box((0.22, 0.42, 0.2), (0, 0, 0.82), INK(), bevel=0.03, parent=c)
    cyl(0.07, 0.2, (0, 0.28, 0.84), INK(), rot=(R(90), 0, 0), verts=20, parent=c)
    # The app and a player card at the front corner.
    big_phone((W / 2 - 1.3, -D / 2 + 1.0, Z), 'phone-sports', R(38), 2.3)
    card = empty((W / 2 - 3.1, -D / 2 + 0.85, Z), R(30))
    box((1.0, 0.06, 1.38), (0, 0, 0.72), mat('gold', hex_lin('#d9a645'), 0.25, metal=0.6, coat=1.0), bevel=0.06, parent=card)
    plane((0.86, 1.24), (0, -0.035, 0.72), screen_mat('phone-sports', 1.0), rot=(R(90), 0, 0), parent=card)
    iso_camera(scale=17.2, target=(0.2, 0.3, 2.1))


# ── NestBridge: a neighbourhood that buys, sells, rents, builds and maintains ──
def prod_nestbridge():
    lights(1.0, warm=True)
    shadow_catcher()
    W, D = 13.0, 13.0
    base(W, D, CLAY())
    # The street across the middle, with paving on both sides.
    sy = -1.0
    road((0, sy, Z), W - 0.2, 1.6)
    sidewalk((0, sy - 1.05, Z), (W - 0.2, 0.5))
    sidewalk((0, sy + 1.05, Z), (W - 0.2, 0.5))
    for x in (-5.2, -1.8, 1.8, 5.2):
        lamp_post((x, sy + 1.15, Z + 0.08), rot_z=R(-90))
    street_trees([(-3.5, sy - 1.05), (0.0, sy - 1.05), (3.6, sy - 1.05), (-5.6, sy + 1.05), (5.6, sy + 1.05)], seed=3)
    # Back left: a tower going up, with its crane and the launch hoarding.
    box((4.0, 3.8, 0.04), (-3.9, 3.9, Z + 0.02), mat('site', hex_lin('#cbbfae'), 0.95), bevel=0.01)
    ctop = construction((-4.0, 4.2, Z), 2.6, 2.4, floors_done=5, floors_frame=4)
    crane((-1.9, 5.3, Z), h=ctop - Z + 2.0, jib=4.0, rot_z=R(200))
    for k in range(3):
        hz = empty((-5.4 + k * 1.3, 1.95, Z), 0)
        box((1.24, 0.06, 0.62), (0, 0, 0.36), INK(), bevel=0.01, parent=hz)
        plane((1.2, 0.58), (0, -0.032, 0.36), screen_mat('sign-launch' if k == 1 else 'sign-nestbridge', 0.9), rot=(R(90), 0, 0), parent=hz)
    for i in range(6):
        box((0.6, 0.6, 0.2 + (i % 3) * 0.1), (-2.4 + (i % 2) * 0.5, 2.6 + (i // 2) * 0.55, Z + 0.1 + (i % 3) * 0.05), CONCRETE(), bevel=0.01)
    person((-2.6, 3.2, Z), rot_z=R(200), body=mat('hiviz', hex_lin('#f2b632'), 0.5), scale=0.75)
    sphere(0.12, (-2.6, 3.2, Z + 1.27), mat('hardhat', hex_lin('#f6f6f2'), 0.3, coat=1.0), seg=16, scale=(1, 1, 0.6))
    # Back right: a finished block, with a home for rent.
    apartment((3.4, 3.6, Z), 3.4, 2.8, 7, body=CLAY(), accent=RED_L(), lit=0.35, seed=8)
    banner = empty((3.4 - 0.9, 3.6 - 1.4 - 0.25, Z + 2.3), 0)
    box((1.36, 0.04, 0.7), (0, 0.03, 0), INK(), bevel=0.01, parent=banner)
    plane((1.3, 0.65), (0, 0, 0), screen_mat('sign-rent', 1.1), rot=(R(90), 0, 0), parent=banner)
    hedge = mat('hedge', hex_lin('#5a7a4c'), 0.75)
    box((3.6, 0.3, 0.25), (3.4, 1.9, Z + 0.125), hedge, bevel=0.06)
    # Between them, NestBridge on the ground: a local office with an agent at the desk.
    kiosk((0.25, 1.9, Z + 0.08), 'sign-nestbridge', w=2.0, d=1.3, h=1.15, accent=RED_L())
    person((0.4, 2.1, Z + 0.08), rot_z=R(180 + 0), body=GRAPHITE(), scale=0.8)
    # Front left: a villa with a pool, for sale.
    villa((-3.5, -4.3, Z), body=CLAY(), accent=RED_L(), pool=True, seed=2)
    sign_post((-2.6, -5.85, Z + 0.05), 'sign-sale', rot_z=R(-10), w=0.8, h=0.4, z=0.6)
    # Front middle: a villa being looked after: the NestBridge van, a technician on a ladder.
    villa((0.6, -4.3, Z), body=CLAY_WARM(), accent=GRAPHITE(), seed=6)
    van((0.9, sy - 0.35, Z + 0.04), rot_z=R(0), body=CLAY())
    plane((0.9, 0.3), (0.75, sy - 0.35 - 0.452, Z + 0.68), screen_mat('sign-nestbridge', 0.9), rot=(R(90), 0, 0))
    lad = empty((1.5, -2.95, Z + 0.05), 0)
    for sx in (-1, 1):
        box((0.03, 0.03, 1.5), (sx * 0.16, 0, 0.75), mat('ladder', hex_lin('#d4d6db'), 0.3, metal=1.0), bevel=0, rot=(R(-12), 0, 0), parent=lad)
    for i in range(7):
        box((0.32, 0.025, 0.02), (0, 0.02 * i, 0.15 + i * 0.2), mat('ladder', hex_lin('#d4d6db'), 0.3, metal=1.0), bevel=0, rot=(R(-12), 0, 0), parent=lad)
    person((1.5, -3.05, Z + 0.55), rot_z=R(180), body=RED_L(), scale=0.75)
    box((0.36, 0.2, 0.22), (1.9, -3.0, Z + 0.16), RED_L(), bevel=0.02)
    # Front right: the agent showing a family around, and the app.
    person((3.2, -2.9, Z + 0.08), rot_z=R(150), body=GRAPHITE(), pose='present', scale=0.82)
    person((3.9, -3.6, Z + 0.08), rot_z=R(-30), body=CLAY_MID(), scale=0.82)
    person((4.35, -3.4, Z + 0.08), rot_z=R(-50), body=RED_L(), scale=0.78)
    person((4.1, -3.95, Z + 0.08), rot_z=R(-40), body=mat('kid', hex_lin('#f2c94c'), 0.5), scale=0.5)
    big_phone((5.3, -5.6, Z), 'phone-nestbridge', R(38), 2.4)
    # Listings go out digitally: pins above each home, linked back to the app.
    pins = [((-3.5, -4.3), 3.0), ((3.4, 3.6), 4.3), ((-4.0, 4.2), ctop - Z + 0.9)]
    for (x, y), h in pins:
        map_pin((x, y, Z + h), '#e63946', 0.9)
    for (x, y), h in pins:
        route([(5.3, -5.55, Z + 3.5), ((5.3 + x) / 2, (-5.55 + y) / 2, Z + h + 1.6), (x, y, Z + h + 0.15)], r=0.012, strength=3)
    plant2((-6.0, -6.0, Z), 0.9)
    iso_camera(scale=16.6, target=(0, -0.2, 2.3))


# ── Torqio: buy, sell, service and source parts, in one place ──
def prod_torqio():
    lights(1.0)
    shadow_catcher()
    W, D = 13.0, 12.0
    base(W, D, mat('torq_base', hex_lin('#45464d'), 0.6), INK())
    sy = -1.5
    road((0, sy, Z), W - 0.2, 1.8)
    sidewalk((0, sy - 1.15, Z), (W - 0.2, 0.5))
    sidewalk((0, sy + 1.15, Z), (W - 0.2, 0.5))
    for x in (-5.0, -0.6, 3.8):
        lamp_post((x, sy + 1.25, Z + 0.08), rot_z=R(-90))
    # Back left: the showroom, cut away at the front.
    sx0, sy0 = -2.9, 3.0
    sw, sd, sh = 5.6, 3.4, 2.1
    shine = mat('showroom_floor', hex_lin('#141418'), 0.12, coat=1.0)
    box((sw, sd, 0.06), (sx0, sy0, Z + 0.03), shine, bevel=0.01)
    box((sw, 0.12, sh), (sx0, sy0 + sd / 2 - 0.06, Z + sh / 2), CLAY(), bevel=0.02)
    box((0.12, sd, sh), (sx0 - sw / 2 + 0.06, sy0, Z + sh / 2), CLAY(), bevel=0.02)
    show = empty((sx0, sy0, Z), 0)
    open_top(sw, sd, sh, parent=show)
    fascia((sx0 + 0.6, sy0 - sd / 2 - 0.09, Z + sh - 0.2), 'sign-torqio', 2.4, 0.8)
    for x in (sx0 - sw / 2 + 0.06, sx0 + sw / 2 - 0.06):
        box((0.1, 0.1, sh), (x, sy0 - sd / 2 + 0.05, Z + sh / 2), GRAPHITE(), bevel=0.01)
    cyl(1.0, 0.07, (sx0 + 0.3, sy0 + 0.1, Z + 0.095), INK(), verts=64)
    torus(1.0, 0.018, (sx0 + 0.3, sy0 + 0.1, Z + 0.13), GLOW_RED(5))
    suv((sx0 + 0.3, sy0 + 0.1, Z + 0.13), rot_z=R(-25), body=RED_L(), scale=0.9)
    hatch((sx0 - 1.9, sy0 + 0.7, Z + 0.06), rot_z=R(-90), body=CLAY(), scale=0.85)
    sedan((sx0 + 2.0, sy0 + 0.9, Z + 0.06), rot_z=R(0), body=mat('silver', hex_lin('#9ea2aa'), 0.25, metal=0.6, coat=1.0), scale=0.85)
    box((1.7, 0.8, 0.12), (sx0 + 1.6, sy0 - 1.1, Z + 0.12), GRAPHITE(), bevel=0.03)
    motorbike((sx0 + 1.15, sy0 - 1.1, Z + 0.18), rot_z=R(-20), body=RED_L())
    scooter((sx0 + 2.05, sy0 - 1.1, Z + 0.18), rot_z=R(-20), body=CLAY())
    wall_screen((sx0 - 0.3, sy0 + sd / 2 - 0.14, Z), 'phone-torqio', w=0.75, h=1.4, z=1.15, strength=1.4)
    person((sx0 - 1.2, sy0 - 0.9, Z + 0.06), rot_z=R(-60), body=GRAPHITE(), pose='present', scale=0.82)
    person((sx0 - 0.4, sy0 - 1.2, Z + 0.06), rot_z=R(120), body=CLAY_MID(), scale=0.82)
    # Back right: the service bay, a car up on the lift, a mechanic underneath.
    bx, by = 3.6, 3.0
    bw, bd, bh = 3.6, 3.4, 2.5
    box((bw, bd, 0.05), (bx, by, Z + 0.025), mat('bay_floor', hex_lin('#9fa1a6'), 0.6), bevel=0.01)
    box((bw, 0.12, bh), (bx, by + bd / 2 - 0.06, Z + bh / 2), CLAY_MID(), bevel=0.02)
    box((0.12, bd, bh), (bx - bw / 2 + 0.06, by, Z + bh / 2), CLAY_MID(), bevel=0.02)
    bay = empty((bx, by, Z), 0)
    open_top(bw, bd, bh, parent=bay)
    fascia((bx + 0.2, by - bd / 2 - 0.09, Z + bh - 0.2), 'sign-service', 1.8, 0.68)
    box((0.1, 0.1, bh), (bx + bw / 2 - 0.05, by - bd / 2 + 0.05, Z + bh / 2), GRAPHITE(), bevel=0.01)
    car_lift((bx + 0.2, by + 0.2, Z + 0.05), rot_z=R(90), raised=1.15, car_body=CLAY())
    person((bx + 0.5, by - 0.2, Z + 0.05), rot_z=R(90), body=mat('overall', hex_lin('#2f3e5c'), 0.6), scale=0.8)
    tool_cabinet((bx - bw / 2 + 0.5, by + bd / 2 - 0.5, Z + 0.05), rot_z=R(0))
    tyre_stack((bx - bw / 2 + 0.4, by - 0.9, Z + 0.05), 5)
    tyre_stack((bx - bw / 2 + 0.85, by - 1.1, Z + 0.05), 3)
    # Front left: commercial vehicles on the lot.
    box((5.4, 3.2, 0.03), (-3.2, -4.6, Z + 0.015), mat('lot', hex_lin('#2a2b30'), 0.8), bevel=0.01)
    for i in range(5):
        box((0.04, 1.2, 0.005), (-5.6 + i * 1.3, -4.6, Z + 0.032), mat('lot_line', hex_lin('#e4e4e6'), 0.6), bevel=0)
    truck((-3.6, -4.3, Z + 0.03), rot_z=R(0), body=CLAY(), cargo=CLAY_WARM(), stripe=RED_L(), scale=0.95)
    plane((1.2, 0.36), (-4.1, -4.3 - 0.58, Z + 1.1), screen_mat('sign-torqio', 0.8), rot=(R(90), 0, 0))
    suv((-1.2, -4.8, Z + 0.03), rot_z=R(90), body=CLAY_WARM(), scale=0.8)
    sign_post((-5.4, -5.7, Z + 0.05), 'sign-torqio', rot_z=R(-10), w=0.9, h=0.3, z=0.65)
    # Front right: the spare-parts store, stocked and serving.
    kx, ky = 3.7, -4.3
    kw, kd, kh = 3.4, 2.6, 1.9
    box((kw, kd, 0.05), (kx, ky, Z + 0.025), mat('parts_floor', hex_lin('#e6e4df'), 0.45), bevel=0.01)
    box((kw, 0.1, kh), (kx, ky + kd / 2 - 0.05, Z + kh / 2), CLAY(), bevel=0.02)
    box((0.1, kd, kh), (kx - kw / 2 + 0.05, ky, Z + kh / 2), CLAY(), bevel=0.02)
    parts = empty((kx, ky, Z), 0)
    open_top(kw, kd, kh, parent=parts)
    fascia((kx + 0.1, ky - kd / 2 - 0.09, Z + kh - 0.18), 'sign-parts', 1.9, 0.62)
    parts_shelf((kx + 0.2, ky + kd / 2 - 0.35, Z + 0.05), w=2.6, levels=4)
    parts_shelf((kx - kw / 2 + 0.35, ky - 0.1, Z + 0.05), w=1.8, levels=4, rot_z=R(90), seed=8)
    box((1.6, 0.5, 0.75), (kx + 0.5, ky - 0.4, Z + 0.43), RED_L(), bevel=0.03)
    box((1.7, 0.6, 0.05), (kx + 0.5, ky - 0.4, Z + 0.83), CLAY(), bevel=0.01)
    person((kx + 0.5, ky + 0.15, Z + 0.05), rot_z=R(180), body=GRAPHITE(), scale=0.8)
    for i in range(3):
        parcel((kx + 0.1 + i * 0.35, ky - 0.4, Z + 0.95), 0.26)
    scooter((kx - 1.3, sy - 0.4, Z + 0.04), rot_z=R(180), body=RED_L(), rider=CLAY())
    # On the street: a hatchback and a bike in traffic.
    hatch((-0.2, sy + 0.42, Z + 0.04), rot_z=R(180), body=mat('blue', hex_lin('#3c5a8a'), 0.3, coat=1.0), scale=0.8)
    motorbike((1.6, sy - 0.45, Z + 0.04), rot_z=R(0), body=INK())
    # The app, and pins over the nearest mechanic and parts store.
    big_phone((1.0, -5.0, Z), 'phone-torqio', R(40), 2.4)
    for (x, y), h in (((bx + 0.2, by + 0.2), 3.4), ((kx + 0.2, ky), 2.8)):
        map_pin((x, y, Z + h), '#e63946', 0.9)
        route([(0.9, -4.95, Z + 3.5), ((0.9 + x) / 2, (-4.95 + y) / 2, Z + h + 1.4), (x, y, Z + h + 0.15)], r=0.012, strength=3)
    iso_camera(scale=15.8, target=(0, 0, 1.8))


# ── DreamX: the city's clothing stores, delivered in 30 minutes ──
def prod_dreamx():
    lights(1.0, warm=True)
    shadow_catcher()
    W, D = 13.0, 13.0
    base(W, D, CLAY_WARM())
    sy = 0.2
    road((0, sy, Z), W - 0.2, 1.6)
    sidewalk((0, sy - 1.05, Z), (W - 0.2, 0.5))
    sidewalk((0, sy + 1.05, Z), (W - 0.2, 0.5))
    for x in (-5.4, -2.0, 2.4, 5.6):
        lamp_post((x, sy + 1.15, Z + 0.08), rot_z=R(-90))
    # The 30-minute ring around the stores, drawn on the ground.
    ring = glow(DREAMX, 4)
    torus(5.6, 0.03, (0.0, 0.6, Z + 0.09), ring)
    for k in range(48):
        a = k / 48 * 2 * math.pi
        sphere(0.035, (math.cos(a) * 5.85, 0.6 + math.sin(a) * 5.85, Z + 0.09), ring, seg=8)
    # Back row: local stores for men, women and kids, then the DreamX hub.
    boutique((-4.4, 3.2, Z + 0.08), 'sign-men', w=2.6, d=2.0, h=1.9, colours=['#20283a', '#5b6e8c', '#e9e4da', '#3a3b42', '#c9b79c'], accent='#20283a', awning_cols=('#20283a', '#e9e4da'), kind='shirt', seed=11)
    boutique((-1.5, 3.2, Z + 0.08), 'sign-women', w=2.6, d=2.0, h=1.9, colours=['#B4005A', '#f3d9e4', '#7a1f45', '#e9c46a', '#f6f2ea'], accent=DREAMX, awning_cols=('#f6e3ea', DREAMX), kind='dress', seed=12)
    boutique((1.4, 3.2, Z + 0.08), 'sign-kids', w=2.6, d=2.0, h=1.9, colours=['#2f6b47', '#f2c94c', '#5fb4d3', '#f28c8c', '#fdf0c9'], accent='#2f6b47', awning_cols=('#fdf0c9', '#2f6b47'), kind='shirt', seed=13)
    hub = kiosk((4.6, 3.2, Z + 0.08), 'sign-dreamx', w=2.6, d=2.0, h=1.9)
    for i in range(3):
        for j in range(2):
            parcel((4.0 + i * 0.4, 3.9 - j * 0.0, Z + 0.35 + j * 0.3), 0.32, m=lacquer(DREAMX))
    for k in range(2):
        scooter((4.2 + k * 0.85, 2.0, Z + 0.08), rot_z=R(90), body=CLAY(), box_tex='sign-dreamx')
    person((5.4, 2.7, Z + 0.08), rot_z=R(200), body=lacquer(DREAMX), scale=0.8)
    # Shoppers on the pavement.
    for x, rz, m in ((-3.2, 160, CLAY_MID()), (-0.6, 210, RED_L()), (0.4, 180, GRAPHITE())):
        person((x, sy + 1.1, Z + 0.08), rot_z=R(rz), body=m, scale=0.8)
    for x in (-2.95, 0.15):
        box((0.3, 0.12, 0.34), (x + 0.15, sy + 1.0, Z + 0.62), matte(DREAMX, 0.5), bevel=0.02)
    # Front: homes inside the ring, and an order arriving at one of them.
    apartment((-3.6, -4.4, Z), 3.2, 2.6, 4, body=CLAY(), accent=lacquer(DREAMX), lit=0.4, seed=4)
    villa((2.1, -4.3, Z), body=CLAY(), accent=lacquer(DREAMX), seed=9)
    person((1.55, -2.65, Z + 0.06), rot_z=R(-30), body=matte('#5b6e8c'), pose='phone', scale=0.82)
    path = [(-1.5, 2.15, Z + 0.12), (-1.2, sy + 0.5, Z + 0.12), (0.2, sy - 0.3, Z + 0.12), (1.0, sy - 0.4, Z + 0.12), (1.4, -1.6, Z + 0.12), (1.5, -2.45, Z + 0.12)]
    route(path, DREAMX, r=0.03, strength=5)
    scooter((0.55, sy - 0.38, Z + 0.04), rot_z=R(-10), body=CLAY(), box_tex='sign-dreamx', rider=lacquer(DREAMX))
    map_pin((-1.5, 3.2, Z + 2.9), DREAMX, 0.9)
    map_pin((1.5, -2.6, Z + 1.9), DREAMX, 0.8)
    sign_post((-5.3, -1.6, Z + 0.08), 'sign-30', rot_z=R(-15), w=1.3, h=1.3, z=1.2, strength=0.9)
    street_trees([(-5.6, sy - 1.05), (-1.8, sy - 1.05), (4.2, sy - 1.05)], seed=21)
    bench((3.0, sy - 1.05, Z + 0.08), rot_z=R(180))
    tree((-5.6, -6.0, Z), 0.9, 'cone', seed=2)
    big_phone((5.0, -5.4, Z), 'phone-dreamx', R(38), 2.5)
    iso_camera(scale=16.4, target=(0, -0.2, 2.0))


PRODUCTS = {
    'prod-sports': {'build': prod_sports},
    'prod-nestbridge': {'build': prod_nestbridge},
    'prod-torqio': {'build': prod_torqio},
    'prod-dreamx': {'build': prod_dreamx},
}
