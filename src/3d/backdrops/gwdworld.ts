import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Fog,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  RectAreaLight,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { MARK } from '@/components/brand/mark';
import { renderUrl } from '@/lib/media';
import { SERVICE_RENDER, STEP_RENDER } from '@/lib/renders';
import { loadTexture } from '@/3d/world/loadTexture';
import { readWorldPayload, type ViewState, type WorldContext, type WorldScene } from '@/3d/world/types';
import type { GalleryPhoto } from '@/types/content';

/**
 * Home: the GWD world. One continuous place the camera travels through as you
 * read the page, chapter by chapter (each chapter is a DOM section marked
 * `data-zone`):
 *
 *   hero      the GWD mark as a monument in its exact colours, GET WORK DONE
 *             beneath it, red light behind, a black mirror floor. On scroll the
 *             brackets open and the camera passes through the mark.
 *   network   the people: 50+ red nodes (the team) at the core and 650+ white
 *             ones (curated freelancers) around them, connecting as you read.
 *   services  the fifteen services as dioramas on a ring; the camera turns to
 *             face each one in turn.
 *   process   a red road past the five steps, Brief to Run.
 *   clients   the camera rises to see the whole world from above.
 *   earth     it looks up into the night while the planet chapter plays.
 *   team      a ring of the team's own photos, orbited slowly.
 *   products  the approach back to the mark, waiting at the end of the world.
 *   finale    the brackets close around GWD again: full circle.
 */
const ZONES = ['hero', 'network', 'services', 'process', 'clients', 'earth', 'team', 'products', 'finale'] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* Shared shaders: soft round points that fade in by a per-point threshold. */
const pointVert = /* glsl */ `
attribute float aSize; attribute float aT; attribute vec3 aColor;
uniform float uReveal; uniform float uScale; uniform float uTime;
varying vec3 vColor; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vA = smoothstep(aT, aT + 0.08, uReveal);
  vColor = aColor;
  float tw = 0.82 + 0.18 * sin(uTime * 1.7 + position.x * 2.3 + position.y * 1.1);
  gl_PointSize = aSize * uScale * tw / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const pointFrag = /* glsl */ `
varying vec3 vColor; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor * a * vA, a * vA);
}`;
const lineVert = /* glsl */ `
attribute float aT; uniform float uReveal; varying float vA;
void main(){ vA = smoothstep(aT, aT + 0.06, uReveal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const lineFrag = /* glsl */ `
uniform vec3 uColor; uniform float uAlpha; varying float vA;
void main(){ gl_FragColor = vec4(uColor * uAlpha * vA, uAlpha * vA); }`;

function glowTexture(inner: string, outer: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
function rayTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const g = c.getContext('2d')!;
  const v = g.createLinearGradient(0, 0, 0, 512);
  v.addColorStop(0, 'rgba(255,40,52,0)');
  v.addColorStop(0.5, 'rgba(255,40,52,1)');
  v.addColorStop(1, 'rgba(255,40,52,0)');
  g.fillStyle = v;
  g.fillRect(0, 0, 64, 512);
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(0.5, 'rgba(0,0,0,1)');
  h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h;
  g.fillRect(0, 0, 64, 512);
  return new CanvasTexture(c);
}
/** "GET WORK DONE", spaced wide, in the page's own sans. */
function fullFormTexture() {
  const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-geist').trim() || 'Helvetica Neue';
  const c = document.createElement('canvas');
  c.width = 2400;
  c.height = 180;
  const g = c.getContext('2d')!;
  g.font = `500 112px ${fam}, Arial, sans-serif`;
  g.fillStyle = '#f3f3f1';
  g.textBaseline = 'middle';
  const text = 'GET WORK DONE';
  const track = 46;
  const widths = [...text].map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  let x = (c.width - total) / 2;
  [...text].forEach((ch, i) => {
    g.fillText(ch, x, c.height / 2);
    x += widths[i]! + track;
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export async function createGwdWorld(ctx: WorldContext): Promise<WorldScene> {
  RectAreaLightUniformsLib.init();
  const scene = new Scene();
  const bg = new Color('#050506');
  scene.background = bg;
  scene.fog = new Fog(bg, 26, 120);
  scene.environment = ctx.envMap;
  const high = ctx.tier === 'high';
  const low = ctx.tier === 'low';
  const textures: Texture[] = [];
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);
  const load = (url: string) =>
    loadTexture(url).then((t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      textures.push(t);
      return t;
    });
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* ── The floor: a black mirror (dimmed), or matte black on smaller devices. ── */
  const floorGeo = keep(new PlaneGeometry(220, 480));
  let mirror: Reflector | null = null;
  if (high) {
    // The reflection is rendered at about half the screen's resolution (it sits under a dark veil, so it reads
    // the same) and skips the particle clouds, which keeps the effect without doubling the frame's cost.
    const size = Math.round(Math.min(1024, Math.max(512, (window.innerWidth * Math.min(ctx.renderer.getPixelRatio(), 1.5)) / 2)));
    mirror = new Reflector(floorGeo, { textureWidth: size, textureHeight: size, color: new Color('#6a6a72') });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, 0, -170);
    scene.add(mirror);
    const m = mirror;
    disposables.push({ dispose: () => m.dispose() });
    // Keep the GET WORK DONE line out of the reflection, so it never sits under the headline.
    // The reflection pass redraws the whole world, so it only runs when the floor is actually in sight
    // (three.js would run it whenever the floor's huge bounding sphere touches the view, i.e. always),
    // and past the opening, where the floor sits far under the veil, at half the resolution (every frame,
    // so frames stay evenly paced rather than alternating heavy and light).
    const reflect = m.onBeforeRender.bind(m);
    const dir = new Vector3();
    const target = m.getRenderTarget();
    const soft = Math.max(256, Math.round(size / 2));
    m.onBeforeRender = (...args) => {
      const cam = args[2] as PerspectiveCamera;
      cam.getWorldDirection(dir);
      const lowestRay = Math.asin(Math.max(-1, Math.min(1, dir.y))) - (cam.fov * Math.PI) / 360;
      if (lowestRay > -0.02) return;
      const res = shown > 1.1 ? soft : size;
      if (target.width !== res) target.setSize(res, res);
      const was = fullForm.visible;
      fullForm.visible = false;
      reflect(...args);
      fullForm.visible = was;
    };
    const veil = new Mesh(floorGeo, keep(new MeshBasicMaterial({ color: bg, transparent: true, opacity: 0.78, depthWrite: false })));
    veil.rotation.x = -Math.PI / 2;
    veil.position.set(0, 0.01, -170);
    // Always drawn first among the see-through things: sorted by distance like
    // the rest, this huge plane would sometimes land on top of the dioramas and
    // shade everything below the horizon.
    veil.renderOrder = -10;
    scene.add(veil);
  } else {
    // Unlit: a glossy floor would mirror the studio lights as hard rectangles.
    const floor = new Mesh(floorGeo, keep(new MeshBasicMaterial({ color: '#08080a' })));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -170);
    scene.add(floor);
  }

  /* ── The mark: extruded from the logo paths, letters #B40001, brackets #781215. ── */
  const curve = high ? 36 : low ? 10 : 20;
  const extrude = (d: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
    const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
    return keep(new ExtrudeGeometry(shapes, { depth: 34, bevelEnabled: true, bevelThickness: 5, bevelSize: 3, bevelSegments: low ? 2 : 4, curveSegments: curve }));
  };
  const red = keep(new MeshPhysicalMaterial({ color: new Color('#b40001'), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.55 }));
  const maroon = keep(new MeshPhysicalMaterial({ color: new Color('#781215'), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.5 }));
  const S = 0.0175; // the 580-wide artwork becomes ~10 units
  const art = new Group();
  art.scale.set(S, -S, S);
  art.position.set(-305 * S, 3.9 + 118 * S, -17 * S);
  const piece = (d: string, m: Material) => {
    const mesh = new Mesh(extrude(d), m);
    const c = new Box3().setFromObject(mesh).getCenter(new Vector3());
    mesh.geometry.translate(-c.x, -c.y, -c.z);
    const g = new Group();
    g.position.copy(c);
    g.add(mesh);
    art.add(g);
    return { g, home: c.clone() };
  };
  const G = piece(MARK.letters.g, red);
  const W = piece(MARK.letters.w, red);
  const D = piece(MARK.letters.d, red);
  const BL = piece(MARK.brackets.bottomLeft, maroon);
  const TR = piece(MARK.brackets.topRight, maroon);
  const mark = new Group();
  mark.add(art);
  scene.add(mark);
  // Studio light on the lacquer, travelling with the mark.
  const key = new RectAreaLight('#ffffff', 6, 6, 3);
  key.position.set(-4, 7, 6);
  key.lookAt(0, 3.9, 0);
  const sweep = new RectAreaLight('#ffffff', 22, 0.5, 7);
  sweep.position.set(-8, 4.1, 4);
  sweep.lookAt(0, 3.9, 0);
  const rim = new RectAreaLight('#ff3040', 10, 8, 4);
  rim.position.set(0, 4.5, -3.5);
  rim.lookAt(0, 3.9, 2);
  mark.add(key, sweep, rim);
  // Red light behind, like the poster: a soft glow and slow rays.
  const glowTex = glowTexture('rgba(255,46,58,0.95)', 'rgba(180,0,1,0.45)');
  textures.push(glowTex);
  const glow = new Mesh(keep(new PlaneGeometry(30, 22)), keep(new MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.85 })));
  glow.position.set(0, 4.1, -2.2);
  mark.add(glow);
  const rayTex = rayTexture();
  textures.push(rayTex);
  const rayGeo = keep(new PlaneGeometry(1.4, 26));
  const rays = new Group();
  rays.position.set(0, 4.1, -2.6);
  const rayMats: MeshBasicMaterial[] = [];
  for (let i = 0; i < 7; i++) {
    const m = keep(new MeshBasicMaterial({ map: rayTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.12 + rnd() * 0.12, side: DoubleSide }));
    rayMats.push(m);
    const r = new Mesh(rayGeo, m);
    r.rotation.z = (i / 7) * Math.PI + rnd() * 0.3;
    rays.add(r);
  }
  mark.add(rays);
  // GET WORK DONE, set under the mark (and reflected in the floor).
  const ffTex = fullFormTexture();
  textures.push(ffTex);
  const fullForm = new Mesh(keep(new PlaneGeometry(9.2, 0.69)), keep(new MeshBasicMaterial({ map: ffTex, transparent: true, depthWrite: false, opacity: 0.92 })));
  fullForm.position.set(0, 1.12, 0.6);
  mark.add(fullForm);
  const markEnd = new Vector3(0, 0, -372);

  /* ── Dust in the air, the whole length of the world. ── */
  const pointsMat = (scale: number) =>
    keep(
      new ShaderMaterial({
        vertexShader: pointVert,
        fragmentShader: pointFrag,
        uniforms: { uReveal: { value: 1 }, uScale: { value: scale }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
  // Point sizes are in pixels at 10 units, scaled to the device and viewport each frame.
  const clouds: { mat: ShaderMaterial; base: number }[] = [];
  const cloud = (positions: number[], sizes: number[], colors: number[], ts: number[], scale: number) => {
    const geo = keep(new BufferGeometry());
    geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('aSize', new BufferAttribute(new Float32Array(sizes), 1));
    geo.setAttribute('aColor', new BufferAttribute(new Float32Array(colors), 3));
    geo.setAttribute('aT', new BufferAttribute(new Float32Array(ts), 1));
    const mat = pointsMat(scale);
    const pts = new Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    clouds.push({ mat, base: scale });
    return { pts, mat, geo };
  };
  const dust = (() => {
    const n = low ? 500 : 1100;
    const p: number[] = [];
    const sz: number[] = [];
    const col: number[] = [];
    const t: number[] = [];
    for (let i = 0; i < n; i++) {
      p.push((rnd() - 0.5) * 70, 0.4 + rnd() * 16, 22 - rnd() * 410);
      sz.push(0.5 + rnd() * 1.4);
      const r = rnd() < 0.18;
      col.push(r ? 1 : 0.75, r ? 0.24 : 0.75, r ? 0.28 : 0.78);
      t.push(0);
    }
    return cloud(p, sz, col, t, 30).pts;
  })();

  /* ── Network: the team at the core, curated freelancers around it. ── */
  const NC = new Vector3(0, 5.2, -42);
  const team: Vector3[] = [];
  const free: Vector3[] = [];
  for (let i = 0; i < 56; i++) {
    const v = new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(1.2 + rnd() * 4.2);
    v.y *= 0.75;
    team.push(v.add(NC));
  }
  const freeCount = low ? 320 : 660;
  for (let i = 0; i < freeCount; i++) {
    const v = new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(7 + Math.pow(rnd(), 0.7) * 15);
    v.y *= 0.55;
    free.push(v.add(NC));
  }
  const nodes = (() => {
    const p: number[] = [];
    const sz: number[] = [];
    const col: number[] = [];
    const t: number[] = [];
    team.forEach((v, i) => {
      p.push(v.x, v.y, v.z);
      sz.push(5.5 + rnd() * 3);
      col.push(1, 0.2, 0.25);
      t.push(0.05 + (i / team.length) * 0.22);
    });
    free.forEach((v) => {
      p.push(v.x, v.y, v.z);
      sz.push(2.6 + rnd() * 2.4);
      col.push(0.95, 0.95, 0.98);
      t.push(0.22 + (v.distanceTo(NC) / 22) * 0.25);
    });
    return cloud(p, sz, col, t, 58);
  })();
  const nearest = (v: Vector3, list: Vector3[], skip?: Vector3) => {
    let best = list[0]!;
    let d = Infinity;
    for (const o of list) {
      if (o === skip) continue;
      const dd = o.distanceToSquared(v);
      if (dd < d) {
        d = dd;
        best = o;
      }
    }
    return best;
  };
  const edges: [Vector3, Vector3][] = [];
  free.forEach((v) => edges.push([v, nearest(v, team)]));
  team.forEach((v) => edges.push([v, nearest(v, team, v)]));
  edges.sort((a, b) => a[0].distanceTo(NC) - b[0].distanceTo(NC));
  const edgeGeo = keep(new BufferGeometry());
  {
    const p = new Float32Array(edges.length * 6);
    const t = new Float32Array(edges.length * 2);
    edges.forEach(([a, b], i) => {
      p.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
      t[i * 2] = t[i * 2 + 1] = 0.35 + (i / edges.length) * 0.4;
    });
    edgeGeo.setAttribute('position', new BufferAttribute(p, 3));
    edgeGeo.setAttribute('aT', new BufferAttribute(t, 1));
  }
  const edgeMat = keep(
    new ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      uniforms: { uReveal: { value: 0 }, uColor: { value: new Color('#ff4b59') }, uAlpha: { value: 0.4 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  // A soft red core where the team sits.
  const core = new Mesh(keep(new PlaneGeometry(18, 18)), keep(new MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 })));
  core.position.copy(NC);
  scene.add(core);
  const edgeLines = new LineSegments(edgeGeo, edgeMat);
  edgeLines.frustumCulled = false;
  scene.add(edgeLines);
  // Work flowing in: pulses that travel the edges toward the core.
  const pulseCount = low ? 60 : 150;
  const pulseEdges = Array.from({ length: pulseCount }, () => edges[Math.floor(rnd() * freeCount)]!);
  const pulseSpeed = Array.from({ length: pulseCount }, () => 0.25 + rnd() * 0.5);
  const pulsePhase = Array.from({ length: pulseCount }, () => rnd());
  const pulses = cloud(
    Array.from({ length: pulseCount * 3 }, () => 0),
    Array.from({ length: pulseCount }, () => 2.6),
    Array.from({ length: pulseCount }, () => [1, 0.55, 0.5]).flat(),
    Array.from({ length: pulseCount }, () => 0.8),
    58,
  );

  /* ── Services: fifteen dioramas on a ring. ── */
  const RC = new Vector3(0, 4.4, -102);
  const RR = 15;
  const zoneEl = (id: string) => document.querySelector<HTMLElement>(`[data-zone="${id}"]`);
  const serviceNames = (zoneEl('services')?.dataset.renders?.split(',') ?? Object.values(SERVICE_RENDER).map((r) => r.name)).filter(Boolean);
  const SN = serviceNames.length || 15;
  const panelAt = (i: number) => {
    const th = (i / SN) * Math.PI * 2;
    return { th, pos: new Vector3(RC.x + Math.sin(th) * RR, RC.y, RC.z - Math.cos(th) * RR) };
  };
  // The dioramas and photos stream in after the first frame, so the logo
  // arrives at once instead of waiting for every image.
  const panels: { m: Mesh; mat: MeshBasicMaterial; base: number }[] = [];
  serviceNames.forEach((n, i) => {
    load(renderUrl(n, true))
      .then((tex) => {
        const img = tex.image as { width: number; height: number };
        const h = 5.2;
        const w = (h * img.width) / img.height;
        const mat = keep(new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
        const m = new Mesh(keep(new PlaneGeometry(w, h)), mat);
        const { pos } = panelAt(i);
        m.position.copy(pos);
        m.lookAt(RC.x, RC.y, RC.z);
        scene.add(m);
        panels[i] = { m, mat, base: pos.y };
      })
      .catch(() => {});
  });
  // The ring's floor: two thin red circles and a faint disc.
  const ringMat = keep(new MeshBasicMaterial({ color: '#ff2d3c', transparent: true, opacity: 0.55, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }));
  for (const [r0, r1] of [
    [RR - 0.06, RR + 0.06],
    [RR * 0.55 - 0.04, RR * 0.55 + 0.04],
  ] as const) {
    const ring = new Mesh(keep(new RingGeometry(r0, r1, 160)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(RC.x, 0.03, RC.z);
    scene.add(ring);
  }

  /* ── Process: a red road past the five steps. ── */
  const stations = STEP_RENDER.map((_, k) => new Vector3(4.6, 0, -140 - k * 18));
  const road = new CatmullRomCurve3([
    new Vector3(0, 0.05, -122),
    new Vector3(-1.2, 0.05, -140),
    new Vector3(0.8, 0.05, -158),
    new Vector3(-1, 0.05, -176),
    new Vector3(0.9, 0.05, -194),
    new Vector3(-0.6, 0.05, -212),
    new Vector3(0, 0.05, -226),
  ]);
  const roadMat = keep(new MeshBasicMaterial({ color: '#ff2d3c', transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }));
  scene.add(new Mesh(keep(new TubeGeometry(road, 240, 0.05, 6, false)), roadMat));
  const roadGlowMat = keep(new MeshBasicMaterial({ color: '#ff2d3c', transparent: true, opacity: 0.12, blending: AdditiveBlending, depthWrite: false }));
  scene.add(new Mesh(keep(new TubeGeometry(road, 240, 0.32, 6, false)), roadGlowMat));
  const runner = new Mesh(keep(new PlaneGeometry(3.4, 3.4)), keep(new MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: AdditiveBlending })));
  scene.add(runner);
  // A second light that leads the camera from the ring down the road to the first step.
  const leadMat = keep(new MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
  const lead = new Mesh(runner.geometry, leadMat);
  lead.scale.setScalar(1.25);
  scene.add(lead);
  const plinthGeo = keep(new CylinderGeometry(2.4, 2.6, 0.5, 48));
  const plinthMat = keep(new MeshStandardMaterial({ color: '#0c0c0f', roughness: 0.25, metalness: 0.6, envMapIntensity: 0.5 }));
  const steps: { m: Mesh; mat: MeshBasicMaterial }[] = [];
  stations.forEach((st, k) => {
    const plinth = new Mesh(plinthGeo, plinthMat);
    plinth.position.set(st.x, 0.25, st.z);
    scene.add(plinth);
    const rim = new Mesh(keep(new RingGeometry(2.55, 2.68, 64)), ringMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(st.x, 0.52, st.z);
    scene.add(rim);
    load(renderUrl(STEP_RENDER[k]!.name, true))
      .then((tex) => {
        const img = tex.image as { width: number; height: number };
        const h = 4.2;
        const mat = keep(new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
        const m = new Mesh(keep(new PlaneGeometry((h * img.width) / img.height, h)), mat);
        m.position.set(st.x, 0.52 + h / 2, st.z);
        m.rotation.y = -0.5;
        scene.add(m);
        steps[k] = { m, mat };
      })
      .catch(() => {});
  });

  /* ── The night sky, for the planet chapter. ── */
  {
    const p: number[] = [];
    const sz: number[] = [];
    const col: number[] = [];
    const t: number[] = [];
    for (let i = 0; i < (low ? 700 : 1600); i++) {
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(1 - rnd() * 0.9);
      const r = 240;
      p.push(Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r + 10, -260 + Math.sin(ph) * Math.sin(th) * r);
      sz.push(0.8 + rnd() * 2.2);
      const c = 0.7 + rnd() * 0.3;
      col.push(c, c, c * 1.05);
      t.push(0);
    }
    cloud(p, sz, col, t, 240);
  }

  /* ── The team: their photos on a ring. ── */
  const TC = new Vector3(0, 5, -302);
  const TRR = 10.5;
  const photoRing = new Group();
  photoRing.position.copy(TC);
  scene.add(photoRing);
  {
    const list = readWorldPayload<{ ring: GalleryPhoto[] }>()?.ring ?? [];
    list.forEach((p, i) => {
      load(p.smallUrl ?? `/_next/image?url=${encodeURIComponent(p.url)}&w=640&q=75`)
        .then((t) => {
          const th = (i / list.length) * Math.PI * 2;
          const h = 3.6;
          const w = Math.min(6.2, (h * p.width) / p.height);
          const m = new Mesh(keep(new PlaneGeometry(w, h)), keep(new MeshBasicMaterial({ map: t, side: DoubleSide, toneMapped: false })));
          m.position.set(Math.sin(th) * TRR, (i % 2 ? 0.9 : -0.9) + 0.4, Math.cos(th) * TRR);
          m.lookAt(Math.sin(th) * TRR * 2, m.position.y, Math.cos(th) * TRR * 2);
          photoRing.add(m);
        })
        .catch(() => {});
    });
  }
  const teamRing = new Mesh(keep(new RingGeometry(TRR + 1.4, TRR + 1.55, 140)), ringMat);
  teamRing.rotation.x = -Math.PI / 2;
  teamRing.position.set(TC.x, 0.03, TC.z);
  scene.add(teamRing);

  /* ── The camera's journey, keyed to the chapters. ── */
  type Key = { s: number; pos: Vector3; look: Vector3 };
  let keys: Key[] = [];
  let zoom = 1;
  const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const build = () => {
    const k: Key[] = [];
    const add = (s: number, pos: Vector3, look: Vector3) => k.push({ s, pos, look });
    // hero: in front of the mark, then through it
    add(0, V(0, 3.3, 19 * zoom), V(0, 3.3, 0));
    add(0.42, V(0, 3.45, 15 * zoom), V(0, 3.55, 0));
    add(1, V(0, 3.8, -4), V(0, 4.6, -42));
    // network: around and through the people
    add(1.22, V(5, 5.6, -27), NC);
    add(1.58, V(-8, 6.4, -34), NC);
    add(1.9, V(-2, 5.2, -51), V(0, 5, -80));
    // services: face each diorama on the ring in turn
    const view = (i: number) => {
      const th = (i / SN) * Math.PI * 2;
      const off = th - 0.24;
      return {
        pos: V(RC.x - Math.sin(th) * 2.2, RC.y + 0.5, RC.z + Math.cos(th) * 2.2),
        look: V(RC.x + Math.sin(off) * RR, RC.y - 0.1, RC.z - Math.cos(off) * RR),
      };
    };
    for (let i = 0; i < SN; i++) {
      const v = view(i);
      add(2 + (i + 0.12) / SN, v.pos, v.look);
      add(2 + (i + 0.62) / SN, v.pos, v.look);
    }
    // Out over the ring's far edge and down onto the red road: a low glide that follows the light
    // running down the road to the first step (the pause between chapters lands on this road-level shot).
    add(2.985, V(-3.4, 6, -109), V(0.4, 0.6, -128));
    add(3, V(-2.3, 2.7, -120.5), V(2.6, 1.7, -141));
    // process: walk the road, stopping beside each step
    stations.forEach((st, i) => {
      const pos = V(-1.4, 3.3, st.z + 10.5);
      const look = V(st.x * 0.72, 2.3, st.z);
      add(3 + (i + 0.12) / 5, pos, look);
      add(3 + (i + 0.62) / 5, pos, look);
      // Between steps, swing out wide so the camera never skims a diorama.
      const next = stations[i + 1];
      if (next) add(3 + (i + 0.87) / 5, V(-6.5, 4.6, (st.z + next.z) / 2 + 9), V(st.x * 0.6, 2, (st.z + next.z) / 2));
    });
    // clients: rise and see the world from above
    add(4.15, V(2, 30, -176), V(0, 0, -150));
    add(4.95, V(10, 52, -128), V(0, 0, -150));
    // earth: look up into the night
    add(5.2, V(0, 30, -205), V(0, 170, -330));
    add(5.85, V(0, 24, -232), V(30, 160, -370));
    // team: orbit the ring of photos
    add(6.08, V(-22, 7.5, -284), TC);
    add(6.5, V(-8, 6.2, -280), TC);
    add(6.95, V(19, 6.8, -291), TC);
    // products: the approach back to the mark
    add(7.15, V(13, 5.2, -318), V(0, 3.9, markEnd.z));
    add(7.9, V(5, 4.4, -338), V(0, 3.9, markEnd.z));
    // finale: in front of the mark again
    add(8.2, V(0, 3.3, markEnd.z + 19 * zoom), V(0, 3.3, markEnd.z));
    add(9.5, V(0, 3.3, markEnd.z + 19 * zoom), V(0, 3.3, markEnd.z));
    keys = k;
  };
  build();
  const camera = new PerspectiveCamera(40, 1, 0.1, 600);
  // Particle clouds are seen by the eye but not drawn again in the mirror (the veil hides them there).
  if (mirror) {
    scene.traverse((o) => {
      if ((o as { isPoints?: boolean }).isPoints) o.layers.set(1);
    });
    camera.layers.enable(1);
  }
  const pos = new Vector3();
  const look = new Vector3();
  const sample = (s: number) => {
    let i = 0;
    while (i < keys.length - 2 && s > keys[i + 1]!.s) i++;
    const a = keys[i]!;
    const b = keys[i + 1]!;
    const u = smooth(a.s, b.s, s);
    pos.lerpVectors(a.pos, b.pos, u);
    look.lerpVectors(a.look, b.look, u);
  };

  // Chapter position from the DOM: the sum of each zone's progress through its
  // sticky stretch (top at the viewport top → bottom at the viewport bottom).
  let zoneEls: (HTMLElement | null)[] = [];
  const story = () => {
    if (!zoneEls.length || zoneEls.some((e) => e && !e.isConnected)) zoneEls = ZONES.map((z) => zoneEl(z));
    let s = 0;
    for (const el of zoneEls) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      s += clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    }
    return s;
  };
  let shown = story();
  let introAt = -1;
  let markAtEnd = false;

  return {
    scene,
    camera,
    resize(w, h) {
      const aspect = w / h;
      zoom = aspect < 1 ? Math.min(2.4, 1.15 / Math.max(0.42, aspect)) : 1;
      camera.fov = aspect < 0.8 ? 48 : 40;
      // On portrait screens the copy sits low, so lift the whole view: the mark lands in the upper third.
      if (aspect < 0.9) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      build();
    },
    update(s: ViewState) {
      const t = s.time;
      const px = ctx.renderer.getPixelRatio() * (s.height / 900);
      for (const c of clouds) (c.mat.uniforms.uScale as { value: number }).value = c.base * px;
      const target = story();
      shown = s.reduced ? target : shown + (target - shown) * (1 - Math.exp(-Math.max(0.001, s.dt) * 6));
      const st = shown;

      // The arrival (first ~3 s): the red light charges up from nothing, the
      // brackets slam in from far apart, then G, W and D drop into place one
      // after another with a little overshoot, and GET WORK DONE types in.
      // Timed from this scene's first frame once the page is uncovered, not page load (assets may take a moment).
      // The mark assembles as the first-visit curtain lifts (at once for returning visitors).
      if (introAt < 0 && !document.documentElement.classList.contains('intro')) introAt = t;
      const intro = s.reduced ? 1 : introAt < 0 ? 0 : clamp01((t - introAt - 0.25) / 2.8);
      const charge = smooth(0, 0.35, intro);
      const back = (v: number) => {
        const c = 1.9;
        const x = clamp01(v) - 1;
        return 1 + (c + 1) * x * x * x + c * x * x;
      };
      const bIn = back((intro - 0.12) / 0.32);
      const gIn = back((intro - 0.4) / 0.25);
      const wIn = back((intro - 0.5) / 0.25);
      const dIn = back((intro - 0.6) / 0.25);
      const ffIn = smooth(0.78, 1, intro);
      // The mark: brackets open as you pass through, close again at the end.
      const open = st < 5 ? smooth(0.32, 0.95, st) : 1 - smooth(7.75, 8.3, st);
      const atEnd = st > 5.5;
      if (atEnd !== markAtEnd) {
        markAtEnd = atEnd;
        mark.position.copy(atEnd ? markEnd : new Vector3());
      }
      // Waiting at the far end, the mark stays hidden until it starts to close: no stray letters in the distance.
      mark.visible = !atEnd || open < 0.65;
      const bOff = 1 - bIn;
      BL.g.position.set(BL.home.x - 240 * open - 420 * bOff, BL.home.y + 150 * open + 260 * bOff, BL.home.z);
      TR.g.position.set(TR.home.x + 240 * open + 420 * bOff, TR.home.y - 150 * open - 260 * bOff, TR.home.z);
      G.g.position.set(G.home.x - 190 * open, G.home.y + 40 * open - 260 * (1 - gIn), G.home.z + 60 * open);
      D.g.position.set(D.home.x + 190 * open, D.home.y - 40 * open - 260 * (1 - dIn), D.home.z + 60 * open);
      W.g.position.set(W.home.x, W.home.y + 170 * open - 260 * (1 - wIn), W.home.z - 120 * open);
      G.g.scale.setScalar(Math.max(0.001, clamp01(gIn * 1.4)));
      W.g.scale.setScalar(Math.max(0.001, clamp01(wIn * 1.4)));
      D.g.scale.setScalar(Math.max(0.001, clamp01(dIn * 1.4)));
      const idle = s.reduced ? 0 : Math.sin(t * 0.4) * 0.05;
      art.rotation.y = idle + s.pointer.x * 0.12 * (1 - open) + (1 - intro) * 0.5;
      art.rotation.x = -s.pointer.y * 0.05;
      (fullForm.material as MeshBasicMaterial).opacity = 0.92 * ffIn * (1 - smooth(0.2, 0.6, open));
      fullForm.scale.x = 0.6 + 0.4 * ffIn;
      // Gone before the camera reaches it, so passing through never floods the screen red.
      (glow.material as MeshBasicMaterial).opacity = 0.85 * charge * (1 - smooth(0.25, 0.8, open)) * (1 + 0.6 * Math.max(0, 1 - Math.abs(intro - 0.36) * 8));
      rays.rotation.z = s.reduced ? 0 : t * 0.03;
      rayMats.forEach((m, i) => (m.opacity = (0.1 + 0.08 * Math.sin(t * 0.6 + i * 1.7)) * charge * (1 - smooth(0.2, 0.75, open))));
      sweep.position.x = -9 + ((t * 0.12) % 1) * 18;
      sweep.intensity = 22 * Math.sin(((t * 0.12) % 1) * Math.PI);

      // Network reveal and the work flowing in.
      const reveal = clamp01((st - 0.55) / 0.7);
      (nodes.mat.uniforms.uReveal as { value: number }).value = reveal;
      (core.material as MeshBasicMaterial).opacity = 0.55 * smooth(0.02, 0.3, reveal) * (1 - smooth(1.9, 2.1, st));
      core.lookAt(camera.position);
      (edgeMat.uniforms.uReveal as { value: number }).value = reveal;
      for (const c of [nodes.mat, pulses.mat]) (c.uniforms.uTime as { value: number }).value = t;
      (pulses.mat.uniforms.uReveal as { value: number }).value = reveal;
      const pp = pulses.geo.attributes.position as BufferAttribute;
      for (let i = 0; i < pulseCount; i++) {
        const [a, b] = pulseEdges[i]!;
        const u = (pulsePhase[i]! + t * pulseSpeed[i]! * 0.3) % 1;
        pp.setXYZ(i, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
      }
      pp.needsUpdate = true;

      // Services: the active diorama comes forward.
      const active = Math.round((st - 2) * SN - 0.37);
      panels.forEach((p, i) => {
        if (!p) return;
        const on = i === active && st > 1.8 && st < 3.2;
        p.mat.opacity += ((on ? 1 : 0.42) - p.mat.opacity) * 0.08;
        const sc = p.m.scale.x + ((on ? 1.12 : 1) - p.m.scale.x) * 0.08;
        p.m.scale.setScalar(sc);
        p.m.position.y = p.base + (s.reduced ? 0 : Math.sin(t * 0.8 + i) * 0.12);
      });
      // Process: the step you are at lights up; a light runs the road.
      const step = Math.round((st - 3) * 5 - 0.37);
      steps.forEach((p, i) => p && (p.mat.opacity += ((i === step && st > 2.9 && st < 4.1 ? 1 : 0.5) - p.mat.opacity) * 0.08));
      road.getPoint(s.reduced ? 0.5 : (t * 0.06) % 1, runner.position);
      runner.position.y = 0.12;
      runner.lookAt(camera.position);
      // The lead light: from the start of the road to the first step as the chapters change.
      const leadU = clamp01((st - 2.93) / 0.11);
      leadMat.opacity = Math.sin(leadU * Math.PI) * 0.95 + (leadU >= 1 && st < 3.1 ? 0.35 * (1 - (st - 3.04) / 0.06) : 0);
      lead.visible = leadMat.opacity > 0.01;
      if (lead.visible) {
        road.getPoint(0.17 * (1 - Math.pow(1 - leadU, 2)), lead.position);
        lead.position.y = 0.14;
        lead.lookAt(camera.position);
      }
      // Team: the ring turns slowly.
      photoRing.rotation.y = (s.reduced ? 0 : t * 0.05) + st * 0.6;
      dust.rotation.y = s.reduced ? 0 : Math.sin(t * 0.05) * 0.02;

      sample(st);
      camera.position.copy(pos);
      camera.position.x += s.pointer.x * 0.6;
      camera.position.y += s.pointer.y * 0.3;
      camera.lookAt(look);
    },
    dispose() {
      textures.forEach((tx) => tx.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };
}
