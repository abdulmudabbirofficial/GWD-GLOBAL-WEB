// Every GWD render as a procedural scene. Each returns { scene, camera }.
// Studio language: one hero object per frame, monochrome clay / graphite /
// chrome / black lacquer, GWD red as the single accent, generous negative space.
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { G, M, THREE, camera, mesh, rng, studio } from './kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const group = (...children) => {
  const g = new THREE.Group();
  children.flat().forEach((c) => g.add(c));
  return g;
};

/* ── Shared props ────────────────────────────────────────── */

/** A browser window: a rounded slab with a top bar, three dots and content blocks. */
function browser(w, h, body = M.clay(), detail = M.clayMid()) {
  const g = new THREE.Group();
  g.add(mesh(G.slab(w, h, 0.08, 0.1), body));
  g.add(mesh(G.slab(w - 0.08, 0.16, 0.02, 0.05), detail, [0, h / 2 - 0.14, 0.05]));
  [0, 1, 2].forEach((i) =>
    g.add(mesh(G.cyl(0.035, 0.02), i === 0 ? M.red() : M.graphite(), [-w / 2 + 0.16 + i * 0.11, h / 2 - 0.14, 0.07], [Math.PI / 2, 0, 0])),
  );
  g.add(mesh(G.slab(w * 0.52, h * 0.34, 0.03, 0.06), detail, [-w * 0.18, h * 0.08, 0.05]));
  [0, 1, 2].forEach((i) => g.add(mesh(G.slab(w * 0.3, 0.06, 0.02, 0.03), detail, [w * 0.27, h * 0.2 - i * 0.14, 0.05])));
  [0, 1, 2].forEach((i) => g.add(mesh(G.slab(w * 0.26, h * 0.22, 0.03, 0.05), detail, [-w * 0.3 + i * w * 0.3, -h * 0.3, 0.05])));
  return g;
}

/** A phone: graphite body, glowing screen with simple UI blocks. */
function phone({ qr = false } = {}) {
  const g = new THREE.Group();
  g.add(mesh(G.slab(1.4, 2.9, 0.16, 0.22), M.graphite()));
  g.add(mesh(G.slab(1.28, 2.78, 0.02, 0.18), M.screen(1.1, '#eef0f5'), [0, 0, 0.08]));
  g.add(mesh(G.slab(0.42, 0.1, 0.02, 0.05), M.ink(), [0, 1.25, 0.095]));
  if (qr) {
    // A check-in screen: red header, a QR code, one confirm bar.
    g.add(mesh(G.slab(1.06, 0.34, 0.02, 0.08), M.screen(0.6, '#c8102e'), [0, 0.92, 0.095]));
    const r = rng(5);
    const q = 0.085;
    const finder = (i, j) => (i < 3 && j < 3) || (i > 7 && j < 3) || (i < 3 && j > 7);
    for (let i = 0; i < 11; i++)
      for (let j = 0; j < 11; j++)
        if (finder(i, j) || r() > 0.52) g.add(mesh(G.box(q * 0.92, q * 0.92, 0.012, 0.004), M.ink(), [-0.425 + i * q, 0.42 - j * q, 0.096]));
    g.add(mesh(G.slab(1.06, 0.26, 0.02, 0.13), M.ink(), [0, -0.98, 0.095]));
    return g;
  }
  g.add(mesh(G.slab(1.06, 0.62, 0.02, 0.1), M.screen(0.6, '#c8102e'), [0, 0.8, 0.095]));
  [0, 1, 2].forEach((i) => g.add(mesh(G.slab(1.06, 0.28, 0.02, 0.08), M.screen(0.35, '#9aa0aa'), [0, 0.18 - i * 0.38, 0.095])));
  return g;
}

/** A clay figure: capsule body, sphere head (the posters' people, as sculpture). */
function figure(mat, h = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CapsuleGeometry(0.2 * h, 0.5 * h, 12, 32), mat, [0, 0.45 * h, 0]));
  g.add(mesh(G.sphere(0.17 * h), mat, [0, 1.02 * h, 0]));
  return g;
}

/** The GWD mark as bevelled solids (letters and the two brackets), centred, ~4.6 units wide. */
function markSolids({ letters = M.chrome(), brackets = M.red(), depth = 26 } = {}) {
  const P = {
    g: 'M190 53H150A67 69.5 0 0 0 150 192H190V105H136V132H163V166H150A40 43.5 0 0 1 150 79H190Z',
    w: 'M213 79H241L258 125L285 53H314L340 125L357 79H384L342 192H338L300 89L260 192H256Z',
    d: 'M412 53H450A68 69.5 0 0 1 450 192H412V137H438V166H450A40 43.5 0 0 0 450 79H438V110H412Z',
    bl: 'M19 80H37V214H169V232H19Z',
    tr: 'M440 4H590V156H572V22H440Z',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 0 580 236">${Object.entries(P)
    .map(([k, d]) => `<path id="${k}" d="${d}"/>`)
    .join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const g = new THREE.Group();
  data.paths.forEach((p) => {
    const id = p.userData.node.id;
    const shapes = SVGLoader.createShapes(p);
    shapes.forEach((sh) => {
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 4, bevelSize: 2.5, bevelSegments: 6, curveSegments: 48 });
      g.add(new THREE.Mesh(geo, id === 'bl' || id === 'tr' ? brackets : letters));
    });
  });
  g.scale.set(0.008, -0.008, 0.008);
  g.position.set(-305 * 0.008, 118 * 0.008, 0);
  return group(g);
}

/** Truncated-icosahedron-like ball: white clay with darker seam rings. */
function ball(r = 0.5) {
  // Classic football: the 12 icosahedron vertices become black pentagons; every
  // face of a fine icosphere is assigned to pentagon (black), seam or panel (white).
  const base = new THREE.IcosahedronGeometry(1, 0);
  const bp = base.attributes.position;
  const centres = [];
  for (let i = 0; i < bp.count; i++) {
    const v = V(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize();
    if (!centres.some((c) => c.distanceTo(v) < 1e-3)) centres.push(v);
  }
  const frames = centres.map((c) => {
    const nb = centres.filter((o) => o !== c).sort((a, b) => a.distanceTo(c) - b.distanceTo(c))[0];
    const u = nb
      .clone()
      .sub(c.clone().multiplyScalar(nb.dot(c)))
      .normalize();
    return { c, u, w: c.clone().cross(u) };
  });
  const R0 = 0.369; // pentagon vertex: a third of the way along each icosahedron edge
  const geo = new THREE.IcosahedronGeometry(r, 40).toNonIndexed();
  const pos = geo.attributes.position;
  const black = [];
  const seam = [];
  for (let f = 0; f < pos.count / 3; f++) {
    const cen = V(0, 0, 0);
    for (let k = 0; k < 3; k++) cen.add(V(pos.getX(f * 3 + k), pos.getY(f * 3 + k), pos.getZ(f * 3 + k)));
    cen.normalize();
    let best = frames[0];
    let bd = -2;
    frames.forEach((fr) => {
      const d = fr.c.dot(cen);
      if (d > bd) {
        bd = d;
        best = fr;
      }
    });
    const ang = Math.acos(Math.min(1, bd));
    const th = Math.atan2(cen.dot(best.w), cen.dot(best.u));
    const seg = (2 * Math.PI) / 5;
    const local = (((th % seg) + seg) % seg) - seg / 2;
    const edge = (R0 * Math.cos(Math.PI / 5)) / Math.cos(local);
    if (ang < edge - 0.012) black.push(f);
    else if (ang < edge + 0.012) seam.push(f);
  }
  // One mesh per material: multi-material groups confuse the path tracer's material indices.
  const kind = new Uint8Array(pos.count / 3);
  black.forEach((f) => (kind[f] = 1));
  seam.forEach((f) => (kind[f] = 2));
  const split = (want) => {
    const out = [];
    for (let f = 0; f < kind.length; f++)
      if (kind[f] === want) for (let k = 0; k < 3; k++) out.push(pos.getX(f * 3 + k), pos.getY(f * 3 + k), pos.getZ(f * 3 + k));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    // Smooth normals straight from the sphere.
    const n = out.map((v) => v / r);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    return g;
  };
  const panel = new THREE.MeshPhysicalMaterial({ color: '#f3f3f1', roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const pent = new THREE.MeshPhysicalMaterial({ color: '#111114', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const line = new THREE.MeshPhysicalMaterial({ color: '#8c8d91', roughness: 0.6 });
  return group(new THREE.Mesh(split(0), panel), new THREE.Mesh(split(1), pent), new THREE.Mesh(split(2), line));
}

/* ── Scenes ──────────────────────────────────────────────── */
export const SCENES = {
  /* 01 Product Engineering: a precision arm setting the last red module onto a product stack. */
  'svc-product': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const stack = group(
      mesh(G.box(1.6, 0.36, 1.6, 0.08), M.clay(), [0, 0.18, 0]),
      mesh(G.box(1.4, 0.36, 1.4, 0.08), M.clayMid(), [0, 0.56, 0]),
      mesh(G.box(1.2, 0.36, 1.2, 0.08), M.clay(), [0, 0.94, 0]),
      mesh(G.box(0.9, 0.36, 0.9, 0.08), M.red(), [0, 1.62, 0]),
    );
    stack.position.set(-0.6, 0, 0.2);
    const arm = group(
      mesh(G.cyl(0.55, 0.3), M.graphite(), [0, 0.15, 0]),
      mesh(G.cyl(0.32, 0.5), M.brushed(), [0, 0.55, 0]),
      mesh(G.sphere(0.28), M.chrome(), [0, 0.85, 0]),
      mesh(G.box(0.34, 1.7, 0.34, 0.12), M.clay(), [-0.35, 1.6, 0], [0, 0, 0.45]),
      mesh(G.sphere(0.24), M.chrome(), [-0.72, 2.38, 0]),
      mesh(G.box(0.28, 1.3, 0.28, 0.1), M.clay(), [-1.25, 2.38, 0], [0, 0, Math.PI / 2 + 0.25]),
      mesh(G.sphere(0.18), M.chrome(), [-1.85, 2.2, 0]),
      mesh(G.box(0.08, 0.36, 0.3, 0.03), M.graphite(), [-1.97, 1.95, 0.0]),
      mesh(G.box(0.08, 0.36, 0.3, 0.03), M.graphite(), [-1.72, 1.95, 0.0]),
    );
    arm.position.set(1.5, 0, -0.3);
    const g = group(stack, arm);
    g.rotation.y = 0.35;
    scene.add(g);
    return { scene, camera: camera({ pos: [3.8, 3.4, 8.2], target: [0.1, 1.25, 0], fStop: 6, aspect, fov: 30 }) };
  },

  /* 02 Enterprise Software: a city of tiles (modules of one system), one red. */
  'svc-enterprise': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const r = rng(2);
    const g = new THREE.Group();
    g.add(mesh(G.box(4.2, 0.2, 4.2, 0.12), M.clay(), [0, 0.1, 0]));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const h = 0.2 + Math.floor(r() * 4) * 0.3;
        const red = i === 2 && j === 1;
        const top = 0.2 + h;
        g.add(mesh(G.box(0.86, h, 0.86, 0.1), red ? M.red() : r() > 0.7 ? M.clayMid() : M.clay(), [-1.5 + i, 0.2 + h / 2, -1.5 + j]));
        if (!red && r() > 0.6) g.add(mesh(G.slab(0.6, 0.36, 0.03, 0.05), M.screen(0.5, '#dfe2e8'), [-1.5 + i, top + 0.2, -1.5 + j], [-0.5, 0, 0]));
      }
    }
    g.rotation.y = Math.PI / 4;
    scene.add(g);
    return { scene, camera: camera({ pos: [7.6, 7.6, 8.8], target: [0, 0.8, 0], fStop: 7, aspect, fov: 28 }) };
  },

  /* 03 Websites & E-commerce: three windows floating in depth, a chrome cursor. */
  'svc-web': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const b1 = browser(3.2, 2.2);
    b1.position.set(-0.9, 2.2, -1.2);
    b1.rotation.set(0, 0.35, 0);
    const b2 = browser(2.6, 1.8, M.clayWarm());
    b2.position.set(0.7, 1.6, 0.2);
    b2.rotation.set(0, -0.25, 0);
    const b3 = browser(1.8, 1.2, M.frost(), M.clay());
    b3.position.set(1.6, 0.9, 1.4);
    b3.rotation.set(0, -0.45, 0);
    const arrow = new THREE.Shape([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, -0.9),
      new THREE.Vector2(0.24, -0.66),
      new THREE.Vector2(0.42, -1.02),
      new THREE.Vector2(0.56, -0.95),
      new THREE.Vector2(0.38, -0.6),
      new THREE.Vector2(0.7, -0.6),
    ]);
    const cursor = mesh(G.extrudeShape(arrow, 0.12, 0.03), M.red(), [0.6, 2.8, 1.2], [0.2, -0.4, -0.2]);
    scene.add(b1, b2, b3, cursor);
    return { scene, camera: camera({ pos: [2.4, 3.2, 11.4], target: [0.15, 1.7, 0], fStop: 4.5, aspect, fov: 32 }) };
  },

  /* 04 Mobile Apps: a phone, standing, with app tiles orbiting. */
  'svc-mobile': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2 });
    const p = phone();
    p.position.set(0, 1.75, 0);
    p.rotation.set(0, -0.35, 0.06);
    scene.add(p);
    const mats = [M.chrome(), M.red(), M.clay(), M.graphite(), M.chrome(), M.clay()];
    const pos = [
      [-1.6, 3.0, 0.4],
      [1.5, 2.6, 0.6],
      [-1.4, 1.0, 0.9],
      [1.7, 0.9, -0.2],
      [-0.4, 3.6, -0.8],
      [1.0, 3.7, -0.6],
    ];
    pos.forEach((q, i) => scene.add(mesh(G.box(0.62, 0.62, 0.16, 0.16), mats[i], q, [0.3 * (i % 2 ? 1 : -1), 0.5 * (i - 2), 0.2])));
    return { scene, camera: camera({ pos: [1.5, 2.6, 9], target: [0, 1.9, 0], fStop: 3.5, aspect, fov: 32 }) };
  },

  /* 05 AI & Automation: a neural sphere of chrome beads and threads around a red core. */
  'svc-ai': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 1.5 });
    const g = new THREE.Group();
    const n = 64;
    const R = 1.5;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      pts.push(V(Math.cos(golden * i) * rr * R, y * R, Math.sin(golden * i) * rr * R));
    }
    pts.forEach((p) => g.add(mesh(G.sphere(0.065, 24), M.chrome(), [p.x, p.y, p.z])));
    const thread = M.brushed();
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((o) => o.j > i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      near.forEach(({ j }) => {
        const q = pts[j];
        const len = p.distanceTo(q);
        const m = mesh(G.cyl(0.012, len, 0.012, 8), thread);
        m.position.copy(p.clone().add(q).multiplyScalar(0.5));
        m.quaternion.setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize());
        g.add(m);
      });
    });
    g.add(mesh(G.sphere(0.55), M.red()));
    g.add(mesh(G.sphere(0.2), M.glowRed(2.5)));
    g.add(mesh(G.sphere(0.85), M.glass()));
    g.position.set(0, 2, 0);
    scene.add(g);
    scene.add(mesh(G.cyl(1.1, 0.12), M.graphite(), [0, 0.06, 0]));
    return { scene, camera: camera({ pos: [0, 2.6, 8.5], target: [0, 1.9, 0], fStop: 3.2, aspect, fov: 32 }) };
  },

  /* 06 Cloud & DevOps: a clay cloud above a server tower, linked by chrome pipelines. */
  'svc-cloud': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const cloud = new THREE.Group();
    [
      [0, 0, 0, 0.75],
      [0.75, -0.1, 0.1, 0.6],
      [-0.75, -0.15, 0, 0.55],
      [0.35, 0.35, -0.1, 0.55],
      [-0.35, 0.3, 0.15, 0.5],
      [1.3, -0.3, 0, 0.38],
      [-1.25, -0.32, 0.05, 0.36],
    ].forEach(([x, y, z, r]) => cloud.add(mesh(G.sphere(r), M.clayWarm(), [x, y, z])));
    cloud.position.set(0, 3.4, 0);
    const tower = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      tower.add(mesh(G.box(1.5, 0.34, 1.1, 0.06), i === 2 ? M.graphite() : M.clay(), [0, 0.2 + i * 0.38, 0]));
      tower.add(mesh(G.box(0.5, 0.04, 0.02, 0.01), i === 2 ? M.glowRed(4) : M.screen(1.2, '#dfe9ff'), [-0.3, 0.2 + i * 0.38, 0.56]));
    }
    const pipes = [
      [V(-0.45, 2.0, 0), V(-0.6, 2.5, 0.1), V(-0.4, 3.0, 0.1)],
      [V(0.45, 2.0, 0), V(0.7, 2.55, 0.05), V(0.5, 3.05, 0)],
    ];
    pipes.forEach((pp) => scene.add(mesh(G.tube(pp, 0.04), M.chrome())));
    scene.add(cloud, tower);
    return { scene, camera: camera({ pos: [3.5, 3.5, 9.5], target: [0, 2.0, 0], fStop: 6, aspect, fov: 30 }) };
  },

  /* 07 Cybersecurity: a monumental padlock in black lacquer and chrome, a red keyhole glow. */
  'svc-cybersecurity': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 3, strips: 2.5 });
    const g = new THREE.Group();
    g.add(mesh(G.box(2.4, 2, 0.9, 0.22), M.ink(), [0, 1.2, 0]));
    g.add(mesh(G.torus(0.78, 0.17, Math.PI), M.chrome(), [0, 2.2, 0]));
    g.add(mesh(G.cyl(0.17, 0.5), M.chrome(), [-0.78, 2.2 - 0.05, 0]));
    g.add(mesh(G.cyl(0.17, 0.5), M.chrome(), [0.78, 2.2 - 0.05, 0]));
    g.add(mesh(G.cyl(0.16, 0.08), M.glowRed(8), [0, 1.35, 0.46], [Math.PI / 2, 0, 0]));
    g.add(mesh(G.box(0.12, 0.42, 0.08, 0.04), M.glowRed(8), [0, 1.08, 0.46]));
    g.rotation.y = -0.45;
    scene.add(g);
    const r = rng(7);
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const d = 2.6 + r() * 2.0;
      scene.add(
        mesh(
          G.box(0.3 + r() * 0.4, 0.04, 0.3 + r() * 0.4, 0.02),
          r() > 0.5 ? M.chrome() : M.graphite(),
          [Math.cos(a) * d, 0.4 + r() * 3.2, Math.sin(a) * d - 1.2],
          [r() * 2, r() * 3, r() * 2],
        ),
      );
    }
    return { scene, camera: camera({ pos: [3.5, 3.0, 9.5], target: [0, 1.5, 0], fStop: 4, aspect, fov: 32 }) };
  },

  /* 08 Data & Analytics: clay bar towers on a plinth, a chrome trend line across them. */
  'svc-data': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const g = new THREE.Group();
    g.add(mesh(G.box(4.6, 0.25, 3.2, 0.1), M.clay(), [0, 0.125, 0]));
    const hs = [0.6, 1.1, 0.8, 1.6, 1.3, 2.1, 1.8, 2.7];
    const pts = [];
    hs.forEach((h, i) => {
      const x = -1.85 + i * 0.53;
      const z = 0.35 * Math.sin(i * 1.3);
      g.add(mesh(G.box(0.36, h, 0.36, 0.05), i === hs.length - 1 ? M.red() : M.clay(), [x, 0.25 + h / 2, z]));
      pts.push(V(x, 0.25 + h + 0.35, z));
    });
    g.add(mesh(G.tube(pts, 0.035), M.chrome()));
    pts.forEach((p) => g.add(mesh(G.sphere(0.08), M.chrome(), [p.x, p.y, p.z])));
    g.rotation.y = 0.5;
    scene.add(g);
    return { scene, camera: camera({ pos: [6, 5.5, 10.5], target: [0, 1.3, 0], fStop: 6, aspect, fov: 30 }) };
  },

  /* 09 APIs & Integrations: three modules joined by chunky cables, one red plug. */
  'svc-api': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const mod = (x, z, mat) =>
      group(
        mesh(G.box(1.3, 0.9, 1.3, 0.16), mat, [x, 0.45, z]),
        mesh(G.slab(0.5, 0.16, 0.06, 0.05), M.graphite(), [x, 0.5, z + 0.65]),
        mesh(G.slab(0.5, 0.16, 0.06, 0.05), M.graphite(), [x + 0.65, 0.5, z], [0, Math.PI / 2, 0]),
        mesh(G.box(0.9, 0.04, 0.9, 0.02), M.clayMid(), [x, 0.91, z]),
      );
    scene.add(mod(-1.8, -0.4, M.clay()), mod(0.4, -1.4, M.clayMid()), mod(1.4, 1.0, M.clay()));
    scene.add(mesh(G.tube([V(-1.15, 0.5, -0.4), V(-0.4, 0.3, 0.2), V(0.4, 0.15, -0.3), V(0.4, 0.5, -0.75)], 0.09), M.ink()));
    scene.add(mesh(G.tube([V(1.05, 0.5, -1.4), V(1.6, 0.2, -0.6), V(1.2, 0.15, 0.0), V(1.4, 0.5, 0.35)], 0.09), M.ink()));
    scene.add(mesh(G.tube([V(-1.8, 0.5, 0.25), V(-1.6, 0.15, 1.2), V(-0.4, 0.15, 1.6), V(0.0, 1.5, 1.8)], 0.09), M.ink()));
    scene.add(mesh(G.box(0.34, 0.5, 0.34, 0.08), M.red(), [0.05, 1.75, 1.8], [0.2, 0, -0.3]));
    scene.add(mesh(G.cyl(0.03, 0.22), M.chrome(), [-0.02, 2.05, 1.75], [0.2, 0, -0.3]));
    scene.add(mesh(G.cyl(0.03, 0.22), M.chrome(), [0.14, 2.03, 1.85], [0.2, 0, -0.3]));
    return { scene, camera: camera({ pos: [4.5, 5.0, 9.0], target: [0, 0.8, 0], fStop: 6, aspect, fov: 32 }) };
  },

  /* 10 UX & Product Design: a fan of interface cards and a chrome stylus. */
  'svc-ux': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    // Cards fan from one bottom pivot like a hand; the front card carries the red block.
    const hand = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Group();
      const front = i === 4;
      c.add(mesh(G.slab(1.7, 2.5, 0.05, 0.14), front ? M.clayWarm() : M.clay(), [0, 1.25, 0]));
      c.add(mesh(G.slab(1.34, 0.78, 0.02, 0.08), front ? M.red() : M.clayMid(), [0, 1.85, 0.03]));
      [0, 1, 2].forEach((k) => c.add(mesh(G.slab(1.34 - k * 0.3, 0.09, 0.02, 0.04), M.clayMid(), [-(k * 0.15), 1.18 - k * 0.22, 0.03])));
      c.add(mesh(G.slab(0.66, 0.22, 0.02, 0.11), M.ink(), [-0.34, 0.36, 0.03]));
      c.position.z = i * 0.07;
      c.rotation.z = 0.56 - i * 0.28;
      hand.add(c);
    }
    hand.position.set(0, 0.55, 0);
    hand.rotation.set(-0.12, -0.2, 0);
    scene.add(hand);
    scene.add(mesh(G.box(2.6, 0.5, 1.4, 0.1), M.clay(), [0, 0.25, 0.2]));
    const pen = group(mesh(G.cyl(0.06, 2.4), M.chrome()), mesh(G.cyl(0.0, 0.24, 0.06), M.ink(), [0, -1.32, 0]), mesh(G.cyl(0.062, 0.3), M.red(), [0, 1.05, 0]));
    pen.position.set(0.2, 0.56, 1.25);
    pen.rotation.set(0, 0, Math.PI / 2 - 0.25);
    pen.rotateX(0.0);
    scene.add(pen);
    return { scene, camera: camera({ pos: [1.6, 3.2, 9.2], target: [0, 1.75, 0], fStop: 5, aspect, fov: 30 }) };
  },

  /* 11 Branding & Marketing: a swatch fan pivoting on a chrome pin, red among the neutrals. */
  'svc-branding': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2 });
    const mats = [M.ink(), M.graphite(), M.clayMid(), M.clay(), M.chrome(), M.clayWarm(), M.red()];
    const fan = new THREE.Group();
    mats.forEach((m, i) => {
      const s = mesh(G.slab(0.62, 2.7, 0.05, 0.1), m, [0, 1.2, i * 0.055]);
      const pivot = new THREE.Group();
      pivot.add(s);
      pivot.rotation.z = 0.84 - i * 0.28;
      fan.add(pivot);
    });
    fan.add(mesh(G.cyl(0.12, 0.6), M.chrome(), [0, 0, 0.18], [Math.PI / 2, 0, 0]));
    fan.position.set(0, 0.7, 0);
    fan.rotation.set(-0.15, -0.25, 0);
    scene.add(fan);
    return { scene, camera: camera({ pos: [0.5, 2.6, 10.5], target: [0, 1.85, 0], fStop: 4, aspect, fov: 32 }) };
  },

  /* 12 3D, Motion & VFX: a film strip twisting around a glossy sphere. */
  'svc-motion': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2.5 });
    scene.add(mesh(G.sphere(0.9), M.red(), [0, 2, 0]));
    const n = 30;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const a = t * Math.PI * 2;
      const y = 2 + Math.sin(a * 2) * 0.7;
      const R = 1.9;
      const f = new THREE.Group();
      f.add(mesh(G.slab(0.5, 0.36, 0.02, 0.03), M.ink()));
      f.add(mesh(G.slab(0.38, 0.24, 0.01, 0.02), i % 5 === 0 ? M.screen(1.4, '#ffffff') : M.graphite(), [0, 0, 0.012]));
      f.position.set(Math.cos(a) * R, y, Math.sin(a) * R);
      f.lookAt(0, y, 0);
      f.rotateY(Math.PI / 2);
      f.rotateX(Math.cos(a * 2) * 0.5);
      scene.add(f);
    }
    return { scene, camera: camera({ pos: [0.8, 3.4, 9], target: [0, 2.0, 0], fStop: 3.8, aspect, fov: 32 }) };
  },

  /* 13 Game Development: an arcade stick with a red ball top, voxels drifting. */
  'svc-games': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2 });
    const g = group(
      mesh(G.box(2.6, 0.5, 1.6, 0.18), M.ink(), [0, 0.25, 0]),
      mesh(G.cyl(0.22, 0.08), M.chrome(), [-0.6, 0.53, 0]),
      mesh(G.cyl(0.05, 1.0), M.chrome(), [-0.6, 1.05, 0], [0, 0, 0.12]),
      mesh(G.sphere(0.3), M.red(), [-0.66, 1.6, 0]),
      ...[
        [0.45, -0.25],
        [0.85, -0.25],
        [0.45, 0.2],
        [0.85, 0.2],
      ].map(([x, z], i) => mesh(G.cyl(0.13, 0.1), i === 0 ? M.red() : M.graphite(), [x, 0.53, z])),
    );
    g.rotation.y = -0.4;
    scene.add(g);
    const r = rng(13);
    for (let i = 0; i < 14; i++) {
      const s = 0.18 + r() * 0.22;
      scene.add(
        mesh(
          G.box(s, s, s, 0.03),
          r() > 0.75 ? M.red() : r() > 0.4 ? M.chrome() : M.graphite(),
          [-2.0 + r() * 4.0, 1.5 + r() * 2.1, -1.5 + r() * 2],
          [r() * 3, r() * 3, r() * 3],
        ),
      );
    }
    return { scene, camera: camera({ pos: [2.6, 3.2, 9.6], target: [0, 1.6, 0], fStop: 4, aspect, fov: 32 }) };
  },

  /* 14 Tech Consulting: a road of plinths rising to a red flag. */
  'svc-consulting': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const steps = [
      [-2.8, 0.2, 1.2],
      [-1.8, 0.5, 0.4],
      [-0.7, 0.85, 0.9],
      [0.3, 1.25, 0.1],
      [1.2, 1.7, -0.6],
    ];
    steps.forEach(([x, h, z], i) => scene.add(mesh(G.cyl(0.55, h, 0.55), i % 2 ? M.clayMid() : M.clay(), [x, h / 2, z])));
    scene.add(
      mesh(
        G.tube(
          steps.map(([x, h, z]) => V(x, h + 0.04, z)),
          0.05,
        ),
        M.chrome(),
      ),
    );
    scene.add(mesh(G.cyl(0.035, 1.6), M.chrome(), [1.2, 1.7 + 0.8, -0.6]));
    scene.add(mesh(G.slab(0.9, 0.56, 0.03, 0.03), M.red(), [1.67, 3.0, -0.6], [0, -0.3, 0]));
    scene.add(mesh(G.sphere(0.07), M.chrome(), [1.2, 3.32, -0.6]));
    return { scene, camera: camera({ pos: [4.6, 2.8, 10.6], target: [0.3, 1.6, -0.2], fStop: 6, aspect, fov: 30 }) };
  },

  /* 15 Managed Services: a server tower with status lights and an orbiting chrome ring. */
  'svc-managed': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 1.5, strips: 3 });
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      g.add(mesh(G.box(1.5, 0.42, 1.2, 0.05), M.ink(), [0, 0.25 + i * 0.46, 0]));
      for (let k = 0; k < 4; k++)
        g.add(mesh(G.sphere(0.03, 12), k === 0 && i === 4 ? M.glowRed(6) : M.screen(2.5, '#e9f0ff'), [-0.55 + k * 0.12, 0.25 + i * 0.46, 0.61]));
      g.add(mesh(G.box(0.6, 0.06, 0.02, 0.01), M.graphite(), [0.35, 0.25 + i * 0.46, 0.61]));
    }
    g.rotation.y = -0.35;
    scene.add(g);
    scene.add(mesh(G.torus(1.6, 0.035), M.chrome(), [0, 1.9, 0], [Math.PI / 2.4, 0.2, 0]));
    scene.add(mesh(G.torus(2.0, 0.02), M.brushed(), [0, 1.9, 0], [Math.PI / 1.8, -0.3, 0]));
    return { scene, camera: camera({ pos: [2.5, 3.0, 9], target: [0, 1.8, 0], fStop: 4, aspect, fov: 32 }) };
  },

  /* ── Products (wide) ──────────────────────────────────── */

  /* GWD Sports: a ball on a graphite pitch plinth, the passport card standing beside it. */
  'prod-sports': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2 });
    const pitch = new THREE.Group();
    pitch.add(mesh(G.box(5, 0.24, 3.2, 0.08), M.graphite(), [0, 0.12, 0]));
    const line = M.clay();
    pitch.add(mesh(G.box(0.03, 0.01, 3.0, 0.005), line, [0, 0.245, 0]));
    pitch.add(mesh(G.torus(0.5, 0.012), line, [0, 0.245, 0], [Math.PI / 2, 0, 0]));
    [-1, 1].forEach((s) => pitch.add(mesh(G.box(0.03, 0.01, 1.2, 0.005), line, [s * 2.0, 0.245, 0])));
    scene.add(pitch);
    const b = ball(0.42);
    b.position.set(-0.6, 0.66, 0.4);
    scene.add(b);
    const card = new THREE.Group();
    card.add(mesh(G.slab(1.5, 2.1, 0.05, 0.12), M.ink()));
    card.add(mesh(G.slab(1.36, 1.96, 0.02, 0.1), M.red(), [0, 0, 0.03]));
    card.add(mesh(G.slab(0.9, 0.9, 0.02, 0.45), M.clayWarm(), [0, 0.35, 0.05]));
    [0, 1, 2].forEach((k) => card.add(mesh(G.slab(1.0, 0.07, 0.02, 0.03), M.clay(), [0, -0.45 - k * 0.16, 0.05])));
    card.position.set(1.3, 1.35, -0.2);
    card.rotation.set(0, -0.4, 0.04);
    scene.add(card);
    return { scene, camera: camera({ pos: [1.2, 3.0, 8.5], target: [0.2, 1.0, 0], fStop: 4, aspect, fov: 28 }) };
  },

  /* NestBridge: an architectural model: houses on a base, a bridge arch linking two plinths. */
  'prod-nestbridge': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const house = (x, z, s, mat) => {
      const roof = new THREE.CylinderGeometry(0.0001, 0.62 * s, 0.5 * s, 4, 1);
      return group(
        mesh(G.box(0.9 * s, 0.8 * s, 0.9 * s, 0.04), mat, [x, 0.6 + 0.4 * s, z]),
        mesh(roof, mat, [x, 0.6 + 0.8 * s + 0.25 * s, z], [0, Math.PI / 4, 0]),
      );
    };
    scene.add(mesh(G.box(2.4, 0.6, 2.4, 0.08), M.clay(), [-1.8, 0.3, 0]));
    scene.add(mesh(G.box(2.0, 0.6, 2.0, 0.08), M.clay(), [2.0, 0.3, -0.3]));
    scene.add(house(-2.3, -0.4, 1, M.clayWarm()), house(-1.3, 0.5, 0.8, M.clay()), house(-1.6, -0.6, 0.7, M.clayMid()));
    scene.add(house(1.7, -0.6, 1.1, M.clayWarm()), house(2.5, 0.2, 0.75, M.red()));
    const arch = mesh(G.torus(1.25, 0.06, Math.PI), M.chrome(), [0.15, 0.6, -0.15], [0, 0.1, 0]);
    scene.add(arch);
    scene.add(mesh(G.box(2.6, 0.06, 0.4, 0.02), M.brushed(), [0.15, 0.62, -0.15], [0, 0.1, 0]));
    return { scene, camera: camera({ pos: [2, 4.2, 9.5], target: [0.1, 0.9, 0], fStop: 6, aspect, fov: 28 }) };
  },

  /* Torqio: a performance wheel, chrome spokes and a red caliper, on a dark studio floor. */
  'prod-torqio': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 1.5, strips: 4, front: 1.5 });
    const w = new THREE.Group();
    w.add(mesh(G.torus(1.55, 0.48), new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 })));
    w.add(mesh(G.torus(1.12, 0.07), M.chrome()));
    w.add(mesh(G.cyl(1.1, 0.2), M.graphite(), [0, 0, -0.1], [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const s = mesh(G.box(0.1, 1.0, 0.08, 0.03), M.chrome(), [Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.06]);
      s.rotation.z = a - Math.PI / 2 + (i % 2 ? 0.16 : -0.16);
      w.add(s);
    }
    w.add(mesh(G.cyl(0.28, 0.22), M.chrome(), [0, 0, 0.08], [Math.PI / 2, 0, 0]));
    w.add(mesh(G.box(0.5, 0.95, 0.4, 0.1), M.red(), [0.92, 0.6, -0.05], [0, 0, -0.55]));
    w.position.set(0, 2.03, 0);
    w.rotation.y = -0.55;
    scene.add(w);
    return { scene, camera: camera({ pos: [3.2, 2.6, 11.5], target: [0, 1.9, 0], fStop: 4, aspect, fov: 30 }) };
  },

  /* ── Sports, community, about (wide) ──────────────────── */

  /* Tournament OS: a chrome cup on a black plinth, a red ribbon. */
  'sports-trophy': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 1.5, strips: 5, front: 2.5 });
    const cup = G.lathe([
      [0.0, 0],
      [0.62, 0],
      [0.62, 0.08],
      [0.5, 0.14],
      [0.42, 0.22],
      [0.16, 0.3],
      [0.12, 0.6],
      [0.16, 0.9],
      [0.3, 1.0],
      [0.62, 1.2],
      [0.78, 1.6],
      [0.84, 2.1],
      [0.8, 2.12],
      [0.72, 1.62],
      [0.56, 1.24],
      [0.0, 1.1],
    ]);
    scene.add(mesh(cup, M.chrome(), [0, 1.0, 0]));
    scene.add(mesh(G.torus(0.42, 0.05, Math.PI * 1.2), M.chrome(), [-0.8, 2.6, 0], [0, 0, Math.PI / 2]));
    scene.add(mesh(G.torus(0.42, 0.05, Math.PI * 1.2), M.chrome(), [0.8, 2.6, 0], [0, Math.PI, Math.PI / 2]));
    scene.add(mesh(G.box(1.6, 1.0, 1.6, 0.08), M.ink(), [0, 0.5, 0]));
    scene.add(mesh(G.box(1.62, 0.12, 1.62, 0.02), M.red(), [0, 0.8, 0]));
    return { scene, camera: camera({ pos: [0.5, 2.0, 8.5], target: [0, 1.9, 0], fStop: 3.5, aspect, fov: 30 }) };
  },

  /* Academy OS: a phone showing a QR check-in beside a ball and a whistle. */
  'sports-academy': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    const p = phone({ qr: true });
    p.position.set(-0.6, 1.62, 0);
    p.rotation.set(-0.08, 0.28, 0.05);
    scene.add(p);
    const b = ball(0.5);
    b.position.set(1.4, 0.5, 0.6);
    scene.add(b);
    scene.add(mesh(G.cyl(0.18, 0.5), M.red(), [0.9, 0.18, 1.6], [0, 0.6, Math.PI / 2]));
    scene.add(mesh(G.torus(0.14, 0.03), M.chrome(), [0.62, 0.2, 1.44], [Math.PI / 2, 0, 0.6]));
    return { scene, camera: camera({ pos: [2.2, 3.0, 8.5], target: [0.2, 1.2, 0], fStop: 4.5, aspect, fov: 30 }) };
  },

  /* GWD Community: clay figures on stepped platforms; one red. */
  'community-people': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'light' });
    scene.add(mesh(G.box(6, 0.3, 2.4, 0.06), M.clay(), [0, 0.15, -0.6]));
    scene.add(mesh(G.box(4.4, 0.3, 1.6, 0.06), M.clay(), [0, 0.45, -1.0]));
    scene.add(mesh(G.box(2.6, 0.3, 1.0, 0.06), M.clay(), [0, 0.75, -1.3]));
    const spots = [
      [-2.2, 0.3, 0.2],
      [-1.2, 0.3, 0.4],
      [1.0, 0.3, 0.3],
      [2.3, 0.3, 0.1],
      [-1.6, 0.6, -0.8],
      [0.2, 0.6, -0.7],
      [1.6, 0.6, -0.9],
      [-0.6, 0.9, -1.3],
      [0.8, 0.9, -1.25],
    ];
    spots.forEach(([x, y, z], i) => {
      const f = figure(i === 5 ? M.red() : i % 3 === 0 ? M.clayMid() : M.clayWarm(), 0.9 + (i % 2) * 0.1);
      f.position.set(x, y, z);
      scene.add(f);
    });
    return { scene, camera: camera({ pos: [0.5, 3.4, 9.5], target: [0, 1.0, -0.5], fStop: 6, aspect, fov: 28 }) };
  },

  /* The GWD mark in chrome with red lacquer brackets, standing in a dark studio. */
  'gwd-mark': ({ aspect }) => {
    const scene = new THREE.Scene();
    studio(scene, { tone: 'dark', red: 2.5, strips: 5, front: 3 });
    const m = markSolids({ letters: new THREE.MeshPhysicalMaterial({ color: '#eceef2', roughness: 0.14, metalness: 1 }) });
    m.position.set(0, 1.95, 0);
    m.rotation.y = -0.18;
    scene.add(m);
    return { scene, camera: camera({ pos: [1.2, 2.3, 7.6], target: [0, 1.95, 0], fStop: 5, aspect, fov: 32 }) };
  },
};

export const SCENE_SIZES = { portrait: { w: 1080, h: 1350 }, wide: { w: 1920, h: 1080 } };
