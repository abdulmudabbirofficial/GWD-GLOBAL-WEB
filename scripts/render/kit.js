// GWD render kit: the studio (cyclorama, softboxes, environment), the material
// palette and the geometry helpers every scene is built from. The look follows
// the GWD service posters: monochrome clay, graphite and chrome, one red accent.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { PhysicalCamera } from 'three-gpu-pathtracer';

export { THREE };

/* ── Materials ───────────────────────────────────────────── */
export const M = {
  clay: () => new THREE.MeshPhysicalMaterial({ color: '#e9e9ea', roughness: 0.62, metalness: 0 }),
  clayWarm: () => new THREE.MeshPhysicalMaterial({ color: '#f1efec', roughness: 0.55 }),
  clayMid: () => new THREE.MeshPhysicalMaterial({ color: '#b9babd', roughness: 0.6 }),
  graphite: () => new THREE.MeshPhysicalMaterial({ color: '#2a2b2f', roughness: 0.42, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  ink: () => new THREE.MeshPhysicalMaterial({ color: '#0d0d0f', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }),
  chrome: () => new THREE.MeshPhysicalMaterial({ color: '#f2f3f5', roughness: 0.06, metalness: 1 }),
  brushed: () => new THREE.MeshPhysicalMaterial({ color: '#c9cbcf', roughness: 0.28, metalness: 1 }),
  red: () => new THREE.MeshPhysicalMaterial({ color: '#d8202f', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 }),
  redMatte: () => new THREE.MeshPhysicalMaterial({ color: '#c81b2a', roughness: 0.6 }),
  glass: () =>
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.4, ior: 1.45, transparent: true }),
  frost: () => new THREE.MeshPhysicalMaterial({ color: '#f4f6fa', roughness: 0.35, transmission: 1, thickness: 0.3, ior: 1.4, transparent: true }),
  screen: (intensity = 1.6, color = '#f7f8fb') =>
    new THREE.MeshPhysicalMaterial({ color: '#111', emissive: color, emissiveIntensity: intensity, roughness: 0.2 }),
  glowRed: (intensity = 6) => new THREE.MeshPhysicalMaterial({ color: '#ff2a3a', emissive: '#ff2a3a', emissiveIntensity: intensity }),
  backdrop: (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.9 }),
};

/* ── Geometry helpers ────────────────────────────────────── */
export const G = {
  box: (w, h, d, r = 0.06, seg = 5) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)),
  cyl: (r, h, rt = r, seg = 64) => new THREE.CylinderGeometry(rt, r, h, seg, 1),
  sphere: (r, seg = 64) => new THREE.SphereGeometry(r, seg, seg / 2),
  torus: (R, r, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, 32, 128, arc),
  tube: (pts, r = 0.03, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, 'centripetal'), 200, r, 24, closed),
  /** A flat rounded rectangle extruded with a soft bevel (cards, screens, panels). */
  slab: (w, h, d, r = 0.08, bevel = 0.015) => {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(0.001, d - bevel * 2),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 24,
    });
    g.translate(0, 0, -(d - bevel * 2) / 2);
    return g;
  },
  lathe: (pts, seg = 96) =>
    new THREE.LatheGeometry(
      pts.map(([x, y]) => new THREE.Vector2(x, y)),
      seg,
    ),
  /** Extrude an SVG-like path list (from the GWD mark) into a bevelled solid. */
  extrudeShape: (shape, depth, bevel = 0.02) =>
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 32 }),
};

export function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  if (Array.isArray(scale)) m.scale.set(...scale);
  else m.scale.setScalar(scale);
  return m;
}

/** A seeded PRNG so every render is reproducible. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Studio ──────────────────────────────────────────────── */
/**
 * A procedural studio HDRI: a dark (or pale) vertical gradient with soft
 * rectangular softboxes, so chrome and lacquer reflect real light shapes.
 * Boxes are placed by longitude/latitude in degrees (three's equirect convention:
 * lon = atan2(z, x), lat = asin(y); the camera sits on +z, i.e. lon 90).
 */
function studioEnv(dark) {
  const W = 1024;
  const H = 512;
  const data = new Float32Array(W * H * 4);
  const top = dark ? [0.03, 0.032, 0.04] : [0.92, 0.93, 0.95];
  const bot = dark ? [0.004, 0.004, 0.005] : [0.22, 0.225, 0.24];
  const boxes = [
    // lon, lat, width, height (deg), intensity
    [146, 45, 34, 26, dark ? 9 : 5], // key, high front-left
    [26, 18, 9, 60, dark ? 5 : 3], // strip right
    [154, 18, 9, 60, dark ? 4 : 2.5], // strip left
    [90, 30, 70, 10, dark ? 2.2 : 1.6], // wide card above the camera
    [-90, 55, 50, 14, dark ? 3 : 2], // rim, behind
  ];
  const soft = (d, half) => {
    const e = Math.abs(d) - half;
    return e <= 0 ? 1 : Math.max(0, 1 - e / 3);
  };
  for (let y = 0; y < H; y++) {
    const lat = (y / (H - 1)) * 180 - 90;
    const t = Math.pow((lat + 90) / 180, 1.4);
    for (let x = 0; x < W; x++) {
      const lon = (x / (W - 1)) * 360 - 180;
      let add = 0;
      boxes.forEach(([bl, bt, bw, bh, k]) => {
        let dl = lon - bl;
        if (dl > 180) dl -= 360;
        if (dl < -180) dl += 360;
        add += k * soft(dl, bw / 2) * soft(lat - bt, bh / 2);
      });
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = bot[c] + (top[c] - bot[c]) * t + add;
      data[i + 3] = 1;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * A seamless photographic cyclorama (floor curving into the back wall), a key
 * softbox, a fill and a rim light, and a gradient environment.
 *  tone 'light': pale grey studio (the posters' white clay look)
 *  tone 'dark' : near-black studio with a cool rim and an optional red kicker
 */
export function studio(scene, { tone = 'light', key = 1, red = 0, strips = 0, front = 0, floorY = 0, wallZ = -6 } = {}) {
  const dark = tone === 'dark';
  const bg = dark ? '#0b0b0d' : '#cdced2';
  const env = studioEnv(dark);
  scene.environment = env;
  scene.background = new THREE.Color(bg);
  scene.environmentIntensity = dark ? 0.35 : 0.3;
  scene.backgroundIntensity = 1;

  // Cyclorama: floor, a quarter-cylinder cove, and the back wall.
  const R = 3;
  const shape = [];
  const W = 60;
  const cove = new THREE.Shape();
  cove.moveTo(-0.01, 0);
  const pts = [new THREE.Vector2(30, 0), new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * (Math.PI / 2);
    pts.push(new THREE.Vector2(-Math.sin(a) * R, R - Math.cos(a) * R));
  }
  pts.push(new THREE.Vector2(-R, 40));
  void shape;
  void cove;
  const profile = new THREE.BufferGeometry();
  const verts = [];
  const idx = [];
  pts.forEach((p, i) => {
    verts.push(-W / 2, p.y, p.x, W / 2, p.y, p.x);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  profile.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  profile.setIndex(idx);
  profile.computeVertexNormals();
  const cyc = new THREE.Mesh(mergeVertices(profile), M.backdrop(bg));
  cyc.material.side = THREE.DoubleSide;
  cyc.position.set(0, floorY, wallZ + R);
  scene.add(cyc);

  // Key softbox (top left, large), fill (right, dim), rim (behind, high).
  const keyL = new THREE.RectAreaLight('#ffffff', (dark ? 9 : 14) * key, 5, 4);
  keyL.position.set(-6, 8, 4);
  keyL.lookAt(0, 0.6, 0);
  scene.add(keyL);
  const fill = new THREE.RectAreaLight(dark ? '#cfd6ff' : '#ffffff', dark ? 1.4 : 0.55, 6, 4);
  fill.position.set(7, 3, 4);
  fill.lookAt(0, 0.8, 0);
  scene.add(fill);
  const rim = new THREE.RectAreaLight('#ffffff', dark ? 7 : 4, 8, 1.4);
  rim.position.set(1, 6, -4);
  rim.lookAt(0, 1, 0);
  scene.add(rim);
  // Tall strip softboxes either side (out of frame) give chrome its long highlights.
  if (strips) {
    [-1, 1].forEach((side) => {
      const st = new THREE.RectAreaLight('#ffffff', strips, 0.9, 7);
      st.position.set(side * 5.2, 3, 2.5);
      st.lookAt(0, 2, 0);
      scene.add(st);
    });
  }
  // A wide card light above and behind the camera, reflected in front-facing chrome.
  if (front) {
    const fr = new THREE.RectAreaLight('#ffffff', front, 9, 2.2);
    fr.position.set(0, 6.5, 11);
    fr.lookAt(0, 1.8, 0);
    scene.add(fr);
  }
  if (red) {
    const kick = new THREE.RectAreaLight('#ff2438', red, 3, 3);
    kick.position.set(6, 1.5, -1);
    kick.lookAt(0, 1, 0);
    scene.add(kick);
  }
  return { bg };
}

/** A physical camera with depth of field, aimed at a target. */
export function camera({ fov = 30, pos = [6, 5, 9], target = [0, 0.8, 0], fStop = 5.6, aspect = 0.8 } = {}) {
  const cam = new PhysicalCamera(fov, aspect, 0.05, 200);
  cam.position.set(...pos);
  const t = new THREE.Vector3(...target);
  cam.lookAt(t);
  cam.focusDistance = cam.position.distanceTo(t);
  cam.fStop = fStop;
  cam.apertureBlades = 6;
  return cam;
}
