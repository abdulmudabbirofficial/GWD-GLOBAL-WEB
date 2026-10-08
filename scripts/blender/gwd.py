"""GWD diorama kit for Blender (Cycles).

Isometric miniature scenes in the GWD palette: white clay, graphite, black
lacquer, brushed aluminium, GWD red and the logo's maroon, with real UI on
every screen (scripts/screens/out). Run a scene file with:

  blender -b --factory-startup --python scripts/blender/render.py -- <scene> [size] [samples]
"""

import math
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCREENS = os.path.join(ROOT, 'scripts', 'screens', 'out')

RED = (0.79, 0.04, 0.06)  # #E63946 in linear-ish lacquer terms, tuned under AgX
LOGO_RED = (0.456, 0.0, 0.0)  # #B40001
MAROON = (0.184, 0.007, 0.008)  # #781215


def hex_lin(h):
    h = h.lstrip('#')
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


# ── Scene ────────────────────────────────────────────────────
def reset(samples=160, size=(1600, 1600), transparent=True):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.refresh_devices()
    for d in prefs.devices:
        d.use = d.type == 'OPTIX'
    sc.cycles.device = 'GPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPTIX'
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 8
    sc.cycles.glossy_bounces = 4
    sc.cycles.transmission_bounces = 8
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    sc.render.image_settings.color_depth = '16'
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass
    glow(sc)
    world = bpy.data.worlds.new('World')
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*hex_lin('#d9dadf'), 1)
    bg.inputs[1].default_value = 0.55
    return sc


def glow(sc, strength=0.32):
    """A soft bloom on everything brighter than white (screens, lamps, neon),
    keeping the cut-out's alpha so the diorama still floats on the page."""
    try:
        ng = bpy.data.node_groups.new('gwd_comp', 'CompositorNodeTree')
        ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        rl = ng.nodes.new('CompositorNodeRLayers')
        gl = ng.nodes.new('CompositorNodeGlare')
        gl.inputs['Type'].default_value = 'Bloom'
        gl.inputs['Threshold'].default_value = 1.0
        gl.inputs['Strength'].default_value = strength
        sa = ng.nodes.new('CompositorNodeSetAlpha')
        out = ng.nodes.new('NodeGroupOutput')
        ng.links.new(rl.outputs['Image'], gl.inputs['Image'])
        ng.links.new(gl.outputs['Image'], sa.inputs['Image'])
        ng.links.new(rl.outputs['Alpha'], sa.inputs['Alpha'])
        ng.links.new(sa.outputs['Image'], out.inputs[0])
        sc.compositing_node_group = ng
    except Exception as e:  # an older Blender: render without the bloom
        print('glow skipped:', e)


def practical(loc=(0, 0, 3.4), energy=320, size=5.0, color=(1, 0.9, 0.78)):
    """A warm ceiling light inside a room, so interiors glow rather than sit flat."""
    d = bpy.data.lights.new('practical', 'AREA')
    d.energy = energy
    d.size = size
    d.color = color
    o = bpy.data.objects.new('practical', d)
    o.location = loc
    bpy.context.collection.objects.link(o)
    return o


def lights(key=1.0, warm=False, dark=False):
    """Soft studio: a large key from the front-left, a fill, and a rim from behind."""
    def area(name, loc, energy, size, color=(1, 1, 1)):
        d = bpy.data.lights.new(name, 'AREA')
        d.energy = energy
        d.size = size
        d.color = color
        o = bpy.data.objects.new(name, d)
        o.location = loc
        bpy.context.collection.objects.link(o)
        direction = Vector((0, 0, 0.6)) - Vector(loc)
        o.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        return o

    area('key', (-6, -7, 11), 2600 * key, 9, (1, 0.97, 0.93) if warm else (1, 1, 1))
    area('fill', (9, -3, 5), 500 * key, 8, (0.92, 0.95, 1))
    area('rim', (2, 9, 8), 900 * key, 6)
    if dark:
        bpy.context.scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.12


def iso_camera(scale=10.0, target=(0, 0, 0.6), elevation=35.264, azimuth=45, lens=None):
    cam = bpy.data.cameras.new('cam')
    o = bpy.data.objects.new('cam', cam)
    bpy.context.collection.objects.link(o)
    bpy.context.scene.camera = o
    el = math.radians(elevation)
    az = math.radians(azimuth)
    dist = 40
    t = Vector(target)
    o.location = t + Vector((math.sin(az) * math.cos(el) * dist, -math.cos(az) * math.cos(el) * dist, math.sin(el) * dist))
    o.rotation_euler = (t - o.location).to_track_quat('-Z', 'Y').to_euler()
    if lens:
        cam.type = 'PERSP'
        cam.lens = lens
        o.location = t + (o.location - t).normalized() * (scale)
    else:
        cam.type = 'ORTHO'
        cam.ortho_scale = scale
    cam.clip_end = 200
    return o


def shadow_catcher(size=60):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    p = bpy.context.object
    p.is_shadow_catcher = True
    p.name = 'shadow'
    return p


# ── Materials ────────────────────────────────────────────────
_mats = {}
# Flat artwork composited after render, exactly as drawn (the logo): each entry
# is {'image': <file in out/>, 'corners': [top-left, top-right, bottom-right, bottom-left]}.
OVERLAYS = []


def mat(name, color, rough=0.5, metal=0.0, coat=0.0, coat_rough=0.05, emission=None, strength=1.0, transmission=0.0, alpha=1.0, sss=0.0):
    key = (name, color, rough, metal, coat, emission, strength, transmission, alpha)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = coat_rough
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.6, 0.4, 0.3)
        b.inputs['Subsurface Scale'].default_value = 0.05
    if transmission:
        b.inputs['Transmission Weight'].default_value = transmission
        b.inputs['IOR'].default_value = 1.45
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1)
        b.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    _mats[key] = m
    return m


CLAY = lambda: mat('clay', hex_lin('#efeff1'), 0.55, sss=0.15)  # noqa: E731
CLAY_WARM = lambda: mat('clay_warm', hex_lin('#f3f1ee'), 0.5, sss=0.15)  # noqa: E731
CLAY_MID = lambda: mat('clay_mid', hex_lin('#c4c5ca'), 0.55)  # noqa: E731
STONE = lambda: mat('stone', hex_lin('#9c9da3'), 0.6)  # noqa: E731
GRAPHITE = lambda: mat('graphite', hex_lin('#2c2d33'), 0.45, coat=0.3)  # noqa: E731
INK = lambda: mat('ink', hex_lin('#0f0f12'), 0.3, coat=1.0)  # noqa: E731
ALU = lambda: mat('alu', hex_lin('#d4d6db'), 0.28, metal=1.0)  # noqa: E731
CHROME = lambda: mat('chrome', hex_lin('#eef0f4'), 0.08, metal=1.0)  # noqa: E731
RED_L = lambda: mat('red', hex_lin('#e63946'), 0.32, coat=1.0)  # noqa: E731
LOGO_RED_L = lambda: mat('logo_red', hex_lin('#b40001'), 0.3, coat=1.0)  # noqa: E731
MAROON_L = lambda: mat('maroon', hex_lin('#781215'), 0.32, coat=1.0)  # noqa: E731
RUBBER = lambda: mat('rubber', hex_lin('#1b1b1e'), 0.75)  # noqa: E731
GLASS = lambda: mat('glass', (1, 1, 1), 0.02, transmission=1.0)  # noqa: E731
FROST = lambda: mat('frost', hex_lin('#f4f6fa'), 0.35, transmission=1.0)  # noqa: E731
GLOW_RED = lambda s=6: mat('glow_red', hex_lin('#ff2a3a'), 0.4, emission=hex_lin('#ff2a3a'), strength=s)  # noqa: E731
GLOW_WHITE = lambda s=4: mat('glow_white', (1, 1, 1), 0.4, emission=(1, 1, 1), strength=s)  # noqa: E731
GLOW_GREEN = lambda s=3: mat('glow_green', hex_lin('#41d17a'), 0.4, emission=hex_lin('#41d17a'), strength=s)  # noqa: E731
SHIELD = lambda: mat('shield', hex_lin('#ff3343'), 0.15, transmission=0.85, emission=hex_lin('#ff2a3a'), strength=0.6)  # noqa: E731


def screen_mat(name, strength=1.6):
    """An emissive screen showing scripts/screens/out/<name>.png, with a faint glossy coat."""
    key = ('screen', name, strength)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(f'screen_{name}')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(SCREENS, f'{name}.png'))
    tex.interpolation = 'Cubic'
    nt.links.new(tex.outputs['Color'], b.inputs['Emission Color'])
    nt.links.new(tex.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Emission Strength'].default_value = strength
    b.inputs['Roughness'].default_value = 0.18
    b.inputs['Coat Weight'].default_value = 0.4
    _mats[key] = m
    return m


# ── Geometry ─────────────────────────────────────────────────
def _finish(o, m, bevel=0.02, segments=4, smooth=True, parent=None):
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = 'ANGLE'
        mod.harden_normals = False
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    if m is not None:
        o.data.materials.append(m)
    if parent is not None:
        o.parent = parent
    return o


def box(size, loc, m, bevel=0.02, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, m, bevel, parent=parent)


def cyl(r, h, loc, m, rot=(0, 0, 0), verts=64, bevel=0.01, r2=None, parent=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, location=loc, rotation=rot, vertices=verts)
    return _finish(bpy.context.object, m, bevel, parent=parent)


def sphere(r, loc, m, seg=48, scale=(1, 1, 1), parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.object
    o.scale = scale
    return _finish(o, m, 0, parent=parent)


def torus(R, r, loc, m, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=96, minor_segments=24)
    return _finish(bpy.context.object, m, 0, parent=parent)


def plane(size, loc, m, rot=(0, 0, 0), parent=None):
    """A plane of size (w, h), facing +Y after rot=(90°,0,0) style rotations; UVs fill 0..1."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, m, 0, smooth=False, parent=parent)


def tube(points, r, m, parent=None):
    cu = bpy.data.curves.new('tube', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 6
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(points) - 1)
    for bp, p in zip(sp.bezier_points, points):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new('tube', cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    if parent is not None:
        o.parent = parent
    return o


def empty(loc=(0, 0, 0), rot_z=0.0, scale=1.0):
    o = bpy.data.objects.new('group', None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    o.scale = (scale, scale, scale)
    return o


# ── Props ────────────────────────────────────────────────────
def platform(w=8, d=8, h=0.5, m=None, step=True):
    """The diorama base: a thick rounded slab, with a darker plinth step beneath."""
    box((w, d, h), (0, 0, h / 2), m or CLAY(), bevel=0.12)
    if step:
        box((w - 0.4, d - 0.4, 0.25), (0, 0, -0.1), GRAPHITE(), bevel=0.08)
    # A thin GWD-red band round the plinth, like an inlay on a model base.
    band = mat('plinth_band', hex_lin('#e63946'), 0.3, coat=1.0, emission=hex_lin('#e63946'), strength=0.6)
    for (sx, sy, lx, ly) in ((0, -1, w - 0.1, 0.03), (0, 1, w - 0.1, 0.03), (-1, 0, 0.03, d - 0.1), (1, 0, 0.03, d - 0.1)):
        box((lx, ly, 0.05), (sx * (w / 2 + 0.006), sy * (d / 2 + 0.006), h * 0.62), band, bevel=0)


def monitor(loc, tex, w=1.6, h=1.0, rot_z=0.0, parent=None, stand=True, strength=1.6):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.06, 0.06, h + 0.06), (0, 0, h / 2 + 0.35), INK(), bevel=0.02, parent=g)
    plane((w, h), (0, -0.035, h / 2 + 0.35), screen_mat(tex, strength), rot=(math.radians(90), 0, 0), parent=g)
    if stand:
        box((0.08, 0.06, 0.35), (0, 0.04, 0.17), ALU(), bevel=0.01, parent=g)
        box((0.45, 0.28, 0.03), (0, 0.04, 0.015), ALU(), bevel=0.01, parent=g)
    return g


def laptop(loc, tex, rot_z=0.0, scale=1.0, parent=None):
    g = empty(loc, rot_z, scale)
    g.parent = parent
    box((1.4, 0.95, 0.05), (0, 0, 0.025), ALU(), bevel=0.02, parent=g)
    box((1.2, 0.5, 0.005), (0, 0.12, 0.052), GRAPHITE(), bevel=0, parent=g)
    lid = empty((0, 0.47, 0.05), 0)
    lid.parent = g
    lid.rotation_euler = (math.radians(-12), 0, 0)
    box((1.4, 0.04, 0.92), (0, 0, 0.46), ALU(), bevel=0.02, parent=lid)
    plane((1.28, 0.8), (0, -0.022, 0.47), screen_mat(tex), rot=(math.radians(90), 0, 0), parent=lid)
    return g


def phone(loc, tex, rot=(0, 0, 0), scale=1.0, parent=None, body=None):
    g = empty(loc, 0, scale)
    g.rotation_euler = rot
    g.parent = parent
    box((0.72, 0.08, 1.48), (0, 0, 0.74), body or INK(), bevel=0.06, parent=g)
    plane((0.66, 1.42), (0, -0.042, 0.74), screen_mat(tex, 1.4), rot=(math.radians(90), 0, 0), parent=g)
    return g


def tablet(loc, tex, rot=(0, 0, 0), scale=1.0, parent=None):
    g = empty(loc, 0, scale)
    g.rotation_euler = rot
    g.parent = parent
    box((1.6, 1.1, 0.05), (0, 0, 0.025), INK(), bevel=0.05, parent=g)
    plane((1.5, 1.0), (0, 0, 0.051), screen_mat(tex, 1.3), parent=g)
    return g


def desk(loc, w=2.2, d=1.0, rot_z=0.0, parent=None, top=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w, d, 0.06), (0, 0, 0.75), top or CLAY(), bevel=0.02, parent=g)
    for sx in (-1, 1):
        box((0.05, d - 0.1, 0.72), (sx * (w / 2 - 0.08), 0, 0.36), GRAPHITE(), bevel=0.01, parent=g)
    return g


def chair(loc, rot_z=0.0, parent=None, m=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.5, 0.5, 0.08), (0, 0, 0.46), m or GRAPHITE(), bevel=0.03, parent=g)
    box((0.5, 0.06, 0.5), (0, 0.24, 0.76), m or GRAPHITE(), bevel=0.03, parent=g)
    cyl(0.04, 0.42, (0, 0, 0.23), ALU(), parent=g)
    cyl(0.24, 0.03, (0, 0, 0.02), ALU(), parent=g)
    return g


def person(loc, rot_z=0.0, pose='stand', body=None, scale=1.0, parent=None, hair=None, legs=None):
    """A clay figure: tapered torso, shoulders, neck, head with a hair cap, limbs."""
    g = empty(loc, rot_z, scale)
    g.parent = parent
    b = body or CLAY_WARM()
    skin = mat('skin', hex_lin('#e9dfd6'), 0.5, sss=0.25)
    hr = hair or mat('hair', hex_lin('#232327'), 0.6)
    lg = legs or mat('legs', hex_lin('#3a3b42'), 0.55)
    if pose == 'sit':
        cyl(0.17, 0.42, (0, 0.05, 0.88), b, r2=0.2, parent=g, bevel=0.08)
        for sx in (-1, 1):
            sphere(0.085, (sx * 0.2, 0.05, 1.07), b, parent=g)
            cyl(0.075, 0.46, (sx * 0.1, -0.18, 0.62), lg, rot=(math.radians(90), 0, 0), parent=g, bevel=0.03)
            cyl(0.07, 0.5, (sx * 0.1, -0.42, 0.37), lg, parent=g, bevel=0.03)
            box((0.12, 0.2, 0.07), (sx * 0.1, -0.48, 0.11), INK(), bevel=0.03, parent=g)
            cyl(0.058, 0.44, (sx * 0.22, -0.16, 0.9), b, rot=(math.radians(68), 0, 0), parent=g, bevel=0.025)
        cyl(0.05, 0.1, (0, 0.05, 1.14), skin, parent=g, bevel=0)
        sphere(0.155, (0, 0.05, 1.31), skin, parent=g)
        sphere(0.16, (0, 0.08, 1.35), hr, scale=(1, 1, 0.72), parent=g)
    else:
        cyl(0.17, 0.5, (0, 0, 1.12), b, r2=0.21, parent=g, bevel=0.08)
        for sx in (-1, 1):
            sphere(0.085, (sx * 0.21, 0, 1.33), b, parent=g)
            cyl(0.078, 0.82, (sx * 0.1, 0, 0.47), lg, parent=g, bevel=0.03)
            box((0.12, 0.22, 0.07), (sx * 0.1, -0.04, 0.04), INK(), bevel=0.03, parent=g)
        cyl(0.05, 0.1, (0, 0, 1.42), skin, parent=g, bevel=0)
        sphere(0.155, (0, 0, 1.6), skin, parent=g)
        sphere(0.16, (0, 0.03, 1.64), hr, scale=(1, 1, 0.72), parent=g)
        if pose == 'present':
            cyl(0.058, 0.56, (-0.25, 0, 1.08), b, parent=g, bevel=0.025)
            cyl(0.058, 0.56, (0.36, -0.1, 1.45), b, rot=(math.radians(-30), math.radians(45), 0), parent=g, bevel=0.025)
        elif pose == 'phone':
            cyl(0.058, 0.56, (-0.25, 0, 1.08), b, parent=g, bevel=0.025)
            cyl(0.058, 0.4, (0.2, -0.16, 1.18), b, rot=(math.radians(70), 0, 0), parent=g, bevel=0.025)
        else:
            for sx in (-1, 1):
                cyl(0.058, 0.56, (sx * 0.25, 0, 1.08), b, parent=g, bevel=0.025)
    return g


def plant(loc, s=1.0, parent=None):
    g = empty(loc, 0, s)
    g.parent = parent
    cyl(0.2, 0.35, (0, 0, 0.175), GRAPHITE(), r2=0.16, parent=g)
    for i, (x, y, z, r) in enumerate([(0, 0, 0.62, 0.28), (0.14, 0.06, 0.82, 0.2), (-0.12, -0.05, 0.86, 0.18), (0.02, -0.1, 1.0, 0.15)]):
        sphere(r, (x, y, z), mat('leaf', hex_lin('#dcdcdf'), 0.7), parent=g)
    return g


def server_rack(loc, units=7, rot_z=0.0, parent=None, alert=-1, h=2.2):
    g = empty(loc, rot_z)
    g.parent = parent
    box((0.9, 0.8, h), (0, 0, h / 2), INK(), bevel=0.03, parent=g)
    step = (h - 0.2) / units
    for i in range(units):
        z = 0.15 + i * step + step / 2
        box((0.8, 0.02, step * 0.78), (0, -0.405, z), GRAPHITE(), bevel=0.005, parent=g)
        for k in range(4):
            sphere(0.018, (-0.3 + k * 0.06, -0.42, z), GLOW_RED(8) if (i == alert and k == 0) else GLOW_GREEN(4) if k < 2 else GLOW_WHITE(3), seg=12, parent=g)
        box((0.3, 0.01, 0.02), (0.18, -0.42, z), STONE(), bevel=0, parent=g)
    return g


def whiteboard(loc, tex, w=2.4, h=1.4, rot_z=0.0, parent=None):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.08, 0.05, h + 0.08), (0, 0, 0.9 + h / 2), ALU(), bevel=0.01, parent=g)
    plane((w, h), (0, -0.03, 0.9 + h / 2), screen_mat(tex, 0.9), rot=(math.radians(90), 0, 0), parent=g)
    for sx in (-1, 1):
        cyl(0.03, 0.9, (sx * (w / 2 - 0.1), 0, 0.45), ALU(), parent=g)
    return g


def wall_screen(loc, tex, w=4.0, h=2.25, rot_z=0.0, parent=None, z=1.6, strength=1.7):
    g = empty(loc, rot_z)
    g.parent = parent
    box((w + 0.1, 0.08, h + 0.1), (0, 0, z), INK(), bevel=0.02, parent=g)
    plane((w, h), (0, -0.045, z), screen_mat(tex, strength), rot=(math.radians(90), 0, 0), parent=g)
    return g


def walls(w=8, d=8, h=3.0, m=None, thick=0.25, floor=None):
    """Two back walls of a cut-away room (the classic isometric diorama corner),
    with a skirting line. Wall items go at y = d/2 - thick - 0.02 (back) and
    x = -w/2 + thick + 0.02 (left)."""
    wm = m or CLAY()
    box((w, thick, h), (0, d / 2 - thick / 2, 0.5 + h / 2), wm, bevel=0.04)
    box((thick, d, h), (-w / 2 + thick / 2, 0, 0.5 + h / 2), wm, bevel=0.04)
    sk = mat('skirting', hex_lin('#b9babf'), 0.5) if wm is not GRAPHITE() else INK()
    box((w - thick, 0.03, 0.12), (thick / 2, d / 2 - thick - 0.015, 0.56), sk, bevel=0)
    box((0.03, d - thick, 0.12), (-w / 2 + thick + 0.015, -thick / 2, 0.56), sk, bevel=0)
    if floor is not None:
        box((w - 0.02, d - 0.02, 0.02), (0, 0, 0.5), floor, bevel=0.01)


def back_y(d=8, thick=0.25):
    return d / 2 - thick - 0.03


def left_x(w=8, thick=0.25):
    return -w / 2 + thick + 0.03


def parcel(loc, s=0.5, m=None, rot_z=0.0, parent=None):
    o = box((s, s * 0.8, s * 0.7), loc, m or mat('card', hex_lin('#d9c6a5'), 0.7), bevel=0.02, rot=(0, 0, rot_z), parent=parent)
    box((s * 0.18, s * 0.81, s * 0.71), loc, mat('tape', hex_lin('#b9a684'), 0.5), bevel=0, rot=(0, 0, rot_z), parent=parent)
    return o


def save(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    if OVERLAYS:
        import json

        from bpy_extras.object_utils import world_to_camera_view

        sc = bpy.context.scene
        w = sc.render.resolution_x
        h = sc.render.resolution_y
        spec = []
        for o in OVERLAYS:
            pts = [world_to_camera_view(sc, sc.camera, Vector(c)) for c in o['corners']]
            spec.append({'image': o['image'], 'quad': [[p.x * w, (1 - p.y) * h] for p in pts]})
        with open(path.replace('.png', '.overlay.json'), 'w') as f:
            json.dump(spec, f)
