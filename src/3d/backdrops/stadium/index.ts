import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Quaternion,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';
import { Squad } from './rig';
import { beamMaterial, crowdMaterial, fireworksMaterial, pointsMaterial, skyMaterial } from './shaders';
import {
  BD,
  BK,
  HALF,
  LANE_W,
  R_IN,
  TN,
  VB,
  adsTexture,
  badmintonTexture,
  chaseTexture,
  courtTexture,
  cricketTexture,
  facadeTexture,
  glowTexture,
  lampBackTexture,
  hockeyTexture,
  lampTexture,
  lanePoint,
  pitchTexture,
  roofTexture,
  scoreboard,
  screenBackTexture,
  seatsTexture,
  setTextureDensity,
  tennisTexture,
  trackTexture,
  ttFloorTexture,
  ttTableTexture,
  volleyballTexture,
  windowsTexture,
} from './textures';

/**
 * GWD Sports: a floodlit sports complex at night, because the platform is for
 * every sport. The camera starts high over the whole complex, drops into the
 * main stadium (a full house doing the wave, floodlight masts throwing beams
 * through the haze, a red team working the ball into the net, the scoreboard
 * flashing GOAL and confetti over the roof), then travels venue by venue
 * through cricket, hockey, basketball, badminton, table tennis, tennis and
 * volleyball, each lit and playing, and rises over the whole complex again.
 * Crowd, sparks and confetti animate on the GPU; players share six instanced
 * meshes. Quality steps down on smaller devices.
 */

const UP = new Vector3(0, 1, 0);
const RED = '#d81f2c';
const WHITE = '#f1f1ee';

/** A rounded-rectangle ring around the track: half-length a = HALF + r, half-width b = r. */
function ringPoint(t: number, r: number, out: Vector3, y = 0) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const n = 2.6;
  const x = (HALF + r) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
  const z = r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
  return out.set(x, y, z);
}

/** A parabola from a to b peaking `lift` above the straight line, sampled at u. */
function arc(a: Vector3, b: Vector3, lift: number, u: number, out: Vector3) {
  out.lerpVectors(a, b, u);
  out.y += 4 * lift * u * (1 - u);
  return out;
}

/** A glowing line that can be redrawn every frame. */
function trail(color: string, n: number, opacity = 0.9) {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  geo.setDrawRange(0, 0);
  return new Line(geo, new LineBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }));
}

export function createStadium(ctx: WorldContext): WorldScene {
  const tier = ctx.tier;
  const hi = tier === 'high';
  const lo = tier === 'low';
  setTextureDensity(hi ? 26 : lo ? 14 : 20);

  const scene = new Scene();
  scene.fog = new Fog(new Color('#07080c'), 140, 520);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);
  const textures: Texture[] = [];
  const tex = <T extends Texture>(t: T) => (textures.push(t), t);
  const add = <T extends Object3D>(o: T) => (scene.add(o), o);

  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ── Light and sky ─────────────────────────────────────── */
  add(new HemisphereLight('#9db2dc', '#0b0b0f', 0.75));
  const key = add(new DirectionalLight('#fff3df', 2.2));
  key.position.set(40, 120, 70);
  key.target.position.set(0, 0, -110);
  add(key.target);
  const fill = add(new DirectionalLight('#dfe8ff', 0.8));
  fill.position.set(-80, 90, -160);

  const sky = add(new Mesh(keep(new SphereGeometry(900, 32, 16)), keep(skyMaterial())));
  sky.position.set(0, -60, -150);
  sky.renderOrder = -10;

  const glow = tex(glowTexture());
  const pts = (positions: number[], colors: number[], mode: 0 | 1 | 2 | 3, size: number, extra?: { v?: number[] }) => {
    const g = keep(new BufferGeometry());
    const n = positions.length / 3;
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setAttribute('aC', new Float32BufferAttribute(colors, 3));
    g.setAttribute('aR', new Float32BufferAttribute(Array.from({ length: n }, () => rnd()), 1));
    g.setAttribute('aV', new Float32BufferAttribute(extra?.v ?? new Array(n * 3).fill(0), 3));
    const m = keep(pointsMaterial(mode, glow, size));
    const p = add(new Points(g, m));
    p.frustumCulled = false;
    return m;
  };
  // Stars over the city.
  let starMat: ReturnType<typeof pointsMaterial>;
  {
    const p: number[] = [];
    const c: number[] = [];
    for (let i = 0; i < (lo ? 500 : 1400); i++) {
      const a = rnd() * Math.PI * 2;
      const e = 0.12 + rnd() * 1.3;
      const r = 820;
      p.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r - 60, Math.sin(a) * Math.cos(e) * r - 150);
      const w = 0.6 + rnd() * 0.4;
      c.push(w, w, w * (0.9 + rnd() * 0.1));
    }
    starMat = pts(p, c, 0, 3.2);
  }

  /* ── Ground and city ───────────────────────────────────── */
  const ground = add(new Mesh(keep(new PlaneGeometry(1400, 1400)), keep(new MeshStandardMaterial({ color: '#0d0f0e', roughness: 1 }))));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.06, -160);
  {
    const win = tex(windowsTexture());
    win.repeat.set(1, 2);
    const geo = keep(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const mat = keep(new MeshStandardMaterial({ color: '#0c0d11', roughness: 0.8, emissive: '#ffffff', emissiveMap: win, emissiveIntensity: 0.85 }));
    const n = lo ? 50 : hi ? 170 : 110;
    const city = add(new InstancedMesh(geo, mat, n));
    const m = new Matrix4();
    const q = new Quaternion();
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 300 + rnd() * 220;
      const h = 18 + Math.pow(rnd(), 2) * 120;
      q.setFromAxisAngle(UP, rnd() * Math.PI);
      m.compose(new Vector3(Math.cos(a) * r, 0, -160 + Math.sin(a) * r * 0.9), q, new Vector3(14 + rnd() * 22, h, 14 + rnd() * 22));
      city.setMatrixAt(i, m);
    }
  }

  const concrete = keep(new MeshStandardMaterial({ color: '#4c4e56', roughness: 0.85, envMap: ctx.envMap, envMapIntensity: 0.2 }));
  const darkSteel = keep(new MeshStandardMaterial({ color: '#202228', roughness: 0.45, metalness: 0.6, envMap: ctx.envMap, envMapIntensity: 0.5 }));
  const whitePaint = keep(new MeshStandardMaterial({ color: '#f4f4f1', roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.15 }));
  const flat = (t: Texture, w: number, h: number, x: number, z: number, y = 0.02, transparent = false) => {
    tex(t);
    const m = add(new Mesh(keep(new PlaneGeometry(w, h)), keep(new MeshBasicMaterial({ map: t, transparent, depthWrite: !transparent, color: '#e9e9e4' }))));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  };

  /* ── The crowd: one instanced mesh for every stand in the complex ── */
  const crowdAt: { x: number; y: number; z: number; yaw: number; t: number; col: string }[] = [];
  const crowdColour = (tifo: number) => {
    if (tifo >= 0) return tifo % 2 ? WHITE : RED;
    const r = rnd();
    return r < 0.34 ? RED : r < 0.56 ? WHITE : r < 0.7 ? '#1c2440' : r < 0.82 ? '#141417' : r < 0.9 ? '#f2c94c' : '#3d6fb6';
  };
  const spacing = hi ? 1.02 : lo ? 1.9 : 1.3;

  /* ── Main stadium ──────────────────────────────────────── */
  const V = {
    football: new Vector3(0, 0, 0),
    cricket: new Vector3(0, 0, -150),
    hockey: new Vector3(0, 0, -240),
    basketball: new Vector3(-40, 0, -306),
    badminton: new Vector3(8, 0, -306),
    tabletennis: new Vector3(46, 0, -306),
    tennis: new Vector3(-26, 0, -362),
    volleyball: new Vector3(28, 0, -362),
  };

  flat(pitchTexture(), 56, 38, 0, 0, 0.03);
  const track = trackTexture();
  flat(track.tex, track.w, track.h, 0, 0, 0.02, true);
  // The apron between the track and the stands.
  {
    const g = keep(new PlaneGeometry(2 * (HALF + 31), 62));
    const apron = add(new Mesh(g, keep(new MeshStandardMaterial({ color: '#1a1c1f', roughness: 0.9 }))));
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = 0.005;
  }

  /** A sloped tier of seating round the bowl, from (r0, y0) to (r1, y1). */
  const tierSurface = (r0: number, y0: number, r1: number, y1: number, rows: number, seats: Texture) => {
    const N = 220;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const a = new Vector3();
    const b = new Vector3();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      ringPoint(t, r0, a, y0);
      ringPoint(t, r1, b, y1);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      uv.push((i / N) * 46, 0, (i / N) * 46, rows / 16);
    }
    for (let i = 0; i < N; i++) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const g = keep(new BufferGeometry());
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    add(new Mesh(g, keep(new MeshStandardMaterial({ map: seats, roughness: 0.8, side: DoubleSide, envMap: ctx.envMap, envMapIntensity: 0.15 }))));
    // Spectators on every row.
    for (let r = 0; r < rows; r++) {
      const f = (r + 0.55) / rows;
      const rr = r0 + (r1 - r0) * f;
      const yy = y0 + (y1 - y0) * f;
      const perim = 2 * Math.PI * Math.sqrt(((HALF + rr) ** 2 + rr ** 2) / 2);
      const n = Math.floor(perim / spacing);
      for (let k = 0; k < n; k++) {
        if (rnd() < 0.06) continue;
        const t = (k / n) * Math.PI * 2 + rnd() * 0.004;
        ringPoint(t, rr, a, yy);
        // The home end's tifo: red and white stripes, row by row.
        const tifo = Math.cos(t) < -0.93 ? r : -1;
        crowdAt.push({ x: a.x, y: a.y, z: a.z, yaw: Math.atan2(-a.x, -a.z), t, col: crowdColour(tifo) });
      }
    }
  };
  const seats = tex(seatsTexture());
  tierSurface(31, 0.6, 41, 8.4, 12, seats);
  if (!lo) tierSurface(43.5, 12, 52, 22.5, 10, seats);
  // Front walls and the outer facade, lit from inside.
  const ringWall = (r: number, y0: number, y1: number, mat: Material, repeat = 46) => {
    const N = 220;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const a = new Vector3();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      ringPoint(t, r, a);
      pos.push(a.x, y0, a.z, a.x, y1, a.z);
      uv.push((i / N) * repeat, 0, (i / N) * repeat, 1);
    }
    for (let i = 0; i < N; i++) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
    const g = keep(new BufferGeometry());
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return add(new Mesh(g, mat));
  };
  ringWall(30.6, 0, 1.4, concrete);
  ringWall(42.6, 8.4, 12.2, concrete);
  const facade = tex(facadeTexture());
  ringWall(53, 0, 23.5, keep(new MeshStandardMaterial({ color: '#2a2c33', roughness: 0.6, map: facade, emissive: '#ffffff', emissiveMap: facade, emissiveIntensity: 0.9 })), 60);

  // The roof: a ring canopy over the stands with an LED band on its inner edge.
  const roofY = 29;
  let roofLightMat: ReturnType<typeof pointsMaterial>;
  {
    const N = 220;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const a = new Vector3();
    const b = new Vector3();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      ringPoint(t, 39, a, roofY);
      ringPoint(t, 56, b, roofY + 3.2);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      uv.push((i / N) * 40, 0, (i / N) * 40, 1);
    }
    for (let i = 0; i < N; i++) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const g = keep(new BufferGeometry());
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const membrane = tex(roofTexture());
    add(
      new Mesh(
        g,
        keep(new MeshStandardMaterial({ color: '#eceef4', map: membrane, roughness: 0.5, metalness: 0.28, emissive: '#2a2b33', emissiveMap: membrane, emissiveIntensity: 0.5, side: DoubleSide, envMap: ctx.envMap, envMapIntensity: 0.9 })),
      ),
    );

    // Radial trusses over the canopy, one instanced mesh.
    const ribs = hi ? 72 : lo ? 32 : 48;
    const rib = add(new InstancedMesh(keep(new BoxGeometry(0.32, 0.9, 1)), darkSteel, ribs));
    const m = new Matrix4();
    const q = new Quaternion();
    const mid = new Vector3();
    const along = new Vector3();
    for (let i = 0; i < ribs; i++) {
      const t = (i / ribs) * Math.PI * 2;
      ringPoint(t, 39.4, a, roofY + 0.55);
      ringPoint(t, 55.6, b, roofY + 3.75);
      mid.addVectors(a, b).multiplyScalar(0.5);
      along.subVectors(b, a);
      const len = along.length();
      q.setFromUnitVectors(new Vector3(0, 0, 1), along.normalize());
      m.compose(mid, q, new Vector3(1, 1, len));
      rib.setMatrixAt(i, m);
    }

    // Lights strung under the canopy's inner edge.
    const lp: number[] = [];
    const lc: number[] = [];
    const nl = hi ? 260 : lo ? 90 : 170;
    for (let i = 0; i < nl; i++) {
      ringPoint((i / nl) * Math.PI * 2, 39.6, a, roofY - 0.5);
      lp.push(a.x, a.y, a.z);
      lc.push(1, 0.96, 0.86);
    }
    roofLightMat = pts(lp, lc, 0, 2.4);
  }
  // The red LED chase round the roof's outer edge (it races faster after a goal).
  const chase = tex(chaseTexture());
  chase.repeat.set(70, 1);
  const chaseMat = keep(new MeshBasicMaterial({ map: chase, toneMapped: false, side: DoubleSide }));
  ringWall(56.1, roofY + 2.3, roofY + 3.25, chaseMat, 1);
  const ledMat = keep(new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  ringWall(38.8, roofY - 0.9, roofY - 0.2, ledMat);
  // Pylons carrying the roof.
  {
    const g = keep(new BoxGeometry(1.2, 1, 1.2).translate(0, 0.5, 0));
    const n = 16;
    const pylons = add(new InstancedMesh(g, darkSteel, n));
    const m = new Matrix4();
    const a = new Vector3();
    for (let i = 0; i < n; i++) {
      ringPoint((i / n) * Math.PI * 2 + 0.1, 55.5, a);
      m.compose(a, new Quaternion(), new Vector3(1, roofY + 3.4, 1));
      pylons.setMatrixAt(i, m);
    }
  }

  // Floodlight masts at the four corners, throwing beams onto the pitch.
  const lamps = tex(lampTexture());
  const lampMat = keep(new MeshBasicMaterial({ map: lamps, toneMapped: false }));
  const lampBack = keep(new MeshStandardMaterial({ map: tex(lampBackTexture()), roughness: 0.55, metalness: 0.4, envMap: ctx.envMap, envMapIntensity: 0.5 }));
  // Red aviation lights blink on top of every main mast.
  const beacons: Sprite[] = [];
  const coneGeo = keep(new ConeGeometry(1, 1, 40, 1, true));
  const beamMats: ReturnType<typeof beamMaterial>[] = [];
  const beam = (from: Vector3, to: Vector3, radius: number, strength: number) => {
    const m = keep(beamMaterial('#fff4dd', strength));
    beamMats.push(m);
    const mesh = add(new Mesh(coneGeo, m));
    const dir = new Vector3().subVectors(from, to);
    const len = dir.length();
    mesh.position.copy(to).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    mesh.scale.set(radius, len, radius);
    mesh.renderOrder = 5;
    return mesh;
  };
  const flare = (at: Vector3, size: number) => {
    const s = add(new Sprite(keep(new SpriteMaterial({ map: glow, color: '#fff6e6', blending: AdditiveBlending, depthWrite: false, transparent: true }))));
    s.position.copy(at);
    s.scale.setScalar(size);
    s.renderOrder = 6;
    return s;
  };
  const mast = (base: Vector3, h: number, look: Vector3, headW: number, withBeam: boolean, beamR: number) => {
    const col = add(new Mesh(keep(new CylinderGeometry(0.45, 1.1, h, 4, 1)), darkSteel));
    col.position.set(base.x, h / 2, base.z);
    col.rotation.y = Math.PI / 4;
    const head = new Vector3(base.x, h + headW * 0.25, base.z);
    const panel = add(new Mesh(keep(new BoxGeometry(headW, headW * 0.5, 0.5)), [darkSteel, darkSteel, darkSteel, darkSteel, lampMat, lampBack]));
    panel.position.copy(head);
    panel.lookAt(look);
    const beacon = flare(new Vector3(base.x, h + headW * 0.55, base.z), 4.5);
    beacon.material.color.set('#ff2a36');
    beacons.push(beacon);
    flare(head.clone().addScaledVector(new Vector3().subVectors(look, head).normalize(), 1.2), headW * 2.6);
    if (withBeam) beam(head, look, beamR, hi ? 0.15 : 0.12);
  };
  for (const t of [0.6, Math.PI - 0.6, Math.PI + 0.6, -0.6]) {
    const p = ringPoint(t, 64, new Vector3());
    const target = new Vector3(p.x * 0.18, 0, p.z * 0.18);
    mast(p, 54, target, 12, true, 26);
  }

  // LED boards round the pitch, scrolling.
  const adsBase = tex(adsTexture());
  const ads: Texture[] = [];
  const board = (x: number, z: number, len: number, yaw: number) => {
    const t = tex(adsBase.clone());
    t.repeat.set(len / 26, 1);
    t.needsUpdate = true;
    ads.push(t);
    const mesh = add(new Mesh(keep(new BoxGeometry(len, 0.75, 0.15)), [darkSteel, darkSteel, darkSteel, darkSteel, keep(new MeshBasicMaterial({ map: t, toneMapped: false })), darkSteel]));
    mesh.position.set(x, 0.38, z);
    mesh.rotation.y = yaw;
  };
  board(0, -19.6, 54, 0);
  board(0, 19.6, 54, Math.PI);
  board(-28.8, 0, 30, Math.PI / 2);
  board(28.8, 0, 30, -Math.PI / 2);

  // Two giant screens over the ends.
  const sb = scoreboard();
  tex(sb.tex);
  const screenMat = keep(new MeshBasicMaterial({ map: sb.tex, toneMapped: false }));
  const backMat = keep(new MeshBasicMaterial({ map: tex(screenBackTexture()), toneMapped: false, color: '#d9d9d9' }));
  for (const sx of [-1, 1]) {
    const scr = add(new Mesh(keep(new BoxGeometry(18, 6.75, 0.6)), [darkSteel, darkSteel, darkSteel, darkSteel, screenMat, backMat]));
    scr.position.set(sx * 67, roofY + 7, 0);
    scr.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    const legs = add(new Mesh(keep(new BoxGeometry(0.6, 8, 10)), darkSteel));
    legs.position.set(sx * 67.6, roofY + 1.5, 0);
  }

  // Goals with nets that billow when the ball goes in.
  const GOAL_W = 5.2;
  const GOAL_H = 1.75;
  const GOAL_D = 1.8;
  const post = keep(new CylinderGeometry(0.08, 0.08, 1, 10));
  const nets: { pos: BufferAttribute; rest: Float32Array; x: number }[] = [];
  const netMat = keep(new LineBasicMaterial({ color: '#e8e8e2', transparent: true, opacity: 0.55 }));
  for (const sx of [-1, 1]) {
    const gx = sx * 26;
    for (const z of [-GOAL_W / 2, GOAL_W / 2]) {
      const p = add(new Mesh(post, whitePaint));
      p.scale.y = GOAL_H;
      p.position.set(gx, GOAL_H / 2, z);
    }
    const bar = add(new Mesh(post, whitePaint));
    bar.scale.y = GOAL_W;
    bar.rotation.x = Math.PI / 2;
    bar.position.set(gx, GOAL_H, 0);
    // The net: a grid over the back, the roof and the sides.
    const seg: number[] = [];
    const step = 0.35;
    const back = gx + sx * GOAL_D;
    const P = (x: number, y: number, z: number) => seg.push(x, y, z);
    for (let z = -GOAL_W / 2; z <= GOAL_W / 2 + 1e-3; z += step) {
      P(back, 0, z);
      P(back, GOAL_H * 0.85, z);
      P(back, GOAL_H * 0.85, z);
      P(gx, GOAL_H, z);
    }
    for (let y = 0; y <= GOAL_H * 0.85 + 1e-3; y += step) {
      P(back, y, -GOAL_W / 2);
      P(back, y, GOAL_W / 2);
      for (const z of [-GOAL_W / 2, GOAL_W / 2]) {
        P(gx, y + (GOAL_H - GOAL_H * 0.85) * (y / (GOAL_H * 0.85)), z);
        P(back, y, z);
      }
    }
    const g = keep(new BufferGeometry());
    const arr = new Float32Array(seg);
    g.setAttribute('position', new BufferAttribute(arr, 3));
    add(new LineSegments(g, netMat));
    nets.push({ pos: g.getAttribute('position') as BufferAttribute, rest: arr.slice(), x: gx });
  }

  /* ── The other venues ──────────────────────────────────── */
  flat(cricketTexture(), 80, 72, V.cricket.x, V.cricket.z, 0.02);
  flat(hockeyTexture(), 59, 39, V.hockey.x, V.hockey.z, 0.02);
  flat(courtTexture(), 28 * BK + 4, 15 * BK + 4, V.basketball.x, V.basketball.z, 0.02);
  const bad = badmintonTexture();
  flat(bad.tex, bad.w, bad.h, V.badminton.x, V.badminton.z, 0.02);
  flat(ttFloorTexture(), 22, 14, V.tabletennis.x, V.tabletennis.z, 0.02);
  const ten = tennisTexture();
  flat(ten.tex, ten.w, ten.h, V.tennis.x, V.tennis.z, 0.02);
  const vol = volleyballTexture();
  flat(vol.tex, vol.w, vol.h, V.volleyball.x, V.volleyball.z, 0.02);

  /** A straight grandstand: stepped concrete with spectators, facing `yaw`. */
  const stand = (c: Vector3, along: number, rows: number, yaw: number, offset: number) => {
    const g = new Object3D();
    g.position.copy(c);
    g.rotation.y = yaw;
    g.updateMatrixWorld();
    const stepGeo = keep(new BoxGeometry(along, 1, 1.1));
    const local = new Vector3();
    for (let r = 0; r < rows; r++) {
      const s = new Mesh(stepGeo, concrete);
      s.scale.y = 0.6 + r * 0.6;
      s.position.set(0, s.scale.y / 2, offset + r * 1.1);
      g.add(s);
      const n = Math.floor(along / spacing);
      for (let k = 0; k < n; k++) {
        if (rnd() < 0.15) continue;
        local.set(-along / 2 + (k + 0.5) * (along / n), s.scale.y, offset + r * 1.1);
        const w = local.clone().applyMatrix4(g.matrixWorld);
        crowdAt.push({ x: w.x, y: w.y, z: w.z, yaw: yaw + Math.PI, t: (k / n) * 6 + r * 0.05, col: crowdColour(-1) });
      }
    }
    add(g);
  };
  stand(V.cricket, 46, lo ? 3 : 5, 0, 38);
  stand(V.cricket, 46, lo ? 3 : 5, Math.PI, 38);
  stand(V.hockey, 52, lo ? 3 : 4, 0, 21.5);
  stand(V.hockey, 52, lo ? 3 : 4, Math.PI, 21.5);
  stand(V.basketball, 40, 4, 0, 13.5);
  stand(V.basketball, 40, 4, Math.PI, 13.5);
  stand(V.badminton, 26, 3, 0, 9.5);
  stand(V.tabletennis, 20, 3, 0, 8.5);
  stand(V.tennis, 34, 4, 0, 12);
  stand(V.tennis, 34, 4, Math.PI, 12);
  stand(V.volleyball, 34, 4, 0, 13);
  stand(V.volleyball, 34, 4, Math.PI, 13);

  // Floodlights over every venue: columns and lamp heads instanced, beams on bigger devices.
  {
    const spots: { c: Vector3; hx: number; hz: number; h: number }[] = [
      { c: V.cricket, hx: 44, hz: 40, h: 30 },
      { c: V.hockey, hx: 34, hz: 24, h: 22 },
      { c: V.basketball, hx: 22, hz: 15, h: 16 },
      { c: V.badminton, hx: 17, hz: 11, h: 13 },
      { c: V.tabletennis, hx: 13, hz: 10, h: 12 },
      { c: V.tennis, hx: 23, hz: 15, h: 15 },
      { c: V.volleyball, hx: 22, hz: 15, h: 15 },
    ];
    const n = spots.length * 4;
    const colGeo = keep(new CylinderGeometry(0.3, 0.6, 1, 4).translate(0, 0.5, 0));
    const headGeo = keep(new BoxGeometry(5, 2.4, 0.4));
    const cols = add(new InstancedMesh(colGeo, darkSteel, n));
    const heads = add(new InstancedMesh(headGeo, lampMat, n));
    const beams = hi ? add(new InstancedMesh(coneGeo, keep(beamMaterial('#fff4dd', 0.1)), n)) : null;
    if (beams) {
      beamMats.push(beams.material as ReturnType<typeof beamMaterial>);
      beams.renderOrder = 5;
    }
    const m = new Matrix4();
    const q = new Quaternion();
    const o = new Object3D();
    const flarePos: number[] = [];
    const flareCol: number[] = [];
    let i = 0;
    for (const s of spots)
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        const x = s.c.x + sx * s.hx;
        const z = s.c.z + sz * s.hz;
        m.compose(new Vector3(x, 0, z), q.identity(), new Vector3(1, s.h, 1));
        cols.setMatrixAt(i, m);
        o.position.set(x, s.h + 0.6, z);
        o.lookAt(s.c.x, 0, s.c.z);
        o.updateMatrix();
        heads.setMatrixAt(i, o.matrix);
        flarePos.push(x - sx * 0.6, s.h + 0.6, z - sz * 0.6);
        flareCol.push(1, 0.97, 0.9);
        if (beams) {
          const from = new Vector3(x, s.h + 0.6, z);
          const to = new Vector3(s.c.x + sx * s.hx * 0.15, 0, s.c.z + sz * s.hz * 0.15);
          const dir = new Vector3().subVectors(from, to);
          const len = dir.length();
          o.position.copy(to).addScaledVector(dir, 0.5);
          o.quaternion.setFromUnitVectors(UP, dir.normalize());
          o.scale.set(len * 0.32, len, len * 0.32);
          o.updateMatrix();
          beams.setMatrixAt(i, o.matrix);
          o.scale.set(1, 1, 1);
        }
        i++;
      }
    pts(flarePos, flareCol, 0, 9);
  }

  // Equipment: stumps, hockey goals, hoops, nets, the table-tennis table.
  for (const z of [-10, 10])
    for (const x of [-0.3, 0, 0.3]) {
      const st = add(new Mesh(post, whitePaint));
      st.scale.set(0.9, 1.1, 0.9);
      st.position.set(V.cricket.x + x, 0.55, V.cricket.z + z);
    }
  for (const sx of [-1, 1]) {
    const gl = add(new Mesh(keep(new BoxGeometry(1.2, 2.1, 3.7)), keep(new MeshStandardMaterial({ color: '#e8e8e2', transparent: true, opacity: 0.35, roughness: 0.9 }))));
    gl.position.set(V.hockey.x + sx * 28.1, 1.05, V.hockey.z);
  }
  const hoops: Mesh[] = [];
  for (const side of [-1, 1]) {
    const bx = V.basketball.x + side * 13.7 * BK;
    const pole = add(new Mesh(keep(new BoxGeometry(0.4, 6.4, 0.4)), darkSteel));
    pole.position.set(bx + side * 1.6, 3.2, V.basketball.z);
    const bboard = add(new Mesh(keep(new BoxGeometry(0.12, 1.9, 3.1)), keep(new MeshStandardMaterial({ color: '#dfe6ee', transparent: true, opacity: 0.45, roughness: 0.1 }))));
    bboard.position.set(bx, 5.6, V.basketball.z);
    const ring = add(new Mesh(keep(new TorusGeometry(0.55, 0.07, 10, 28)), keep(new MeshStandardMaterial({ color: '#ff5a1f', emissive: '#ff3a0a', emissiveIntensity: 0.4 }))));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(V.basketball.x + side * (14 - 1.575) * BK, 4.9, V.basketball.z);
    hoops.push(ring);
  }
  const netPanel = keep(new MeshStandardMaterial({ color: '#f2f2ee', transparent: true, opacity: 0.4, side: DoubleSide, depthWrite: false, roughness: 1 }));
  const courtNet = (c: Vector3, width: number, top: number, height: number) => {
    const n = add(new Mesh(keep(new PlaneGeometry(width, height)), netPanel));
    n.rotation.y = Math.PI / 2;
    n.position.set(c.x, top - height / 2, c.z);
    const band = add(new Mesh(keep(new BoxGeometry(0.06, 0.08, width)), whitePaint));
    band.position.set(c.x, top, c.z);
    for (const sz of [-1, 1]) {
      const p = add(new Mesh(post, darkSteel));
      p.scale.set(0.8, top, 0.8);
      p.position.set(c.x, top / 2, c.z + (sz * width) / 2);
    }
  };
  courtNet(V.badminton, 6.1 * BD, 1.55 * BD, 0.76 * BD);
  courtNet(V.tennis, 12.8 * TN, 0.95 * TN, 0.9 * TN);
  courtNet(V.volleyball, 10 * VB, 2.43 * VB, 1 * VB);
  {
    const top = add(new Mesh(keep(new BoxGeometry(11, 0.3, 6.1)), keep(new MeshStandardMaterial({ color: '#1f4aa8', roughness: 0.5 }))));
    top.position.set(V.tabletennis.x, 2.9, V.tabletennis.z);
    const face = flat(ttTableTexture(), 11, 6.1, V.tabletennis.x, V.tabletennis.z, 3.06);
    face.renderOrder = 1;
    const legGeo = keep(new BoxGeometry(0.3, 2.8, 0.3));
    for (const sx of [-4.6, 4.6])
      for (const sz of [-2.4, 2.4]) {
        const leg = add(new Mesh(legGeo, darkSteel));
        leg.position.set(V.tabletennis.x + sx, 1.4, V.tabletennis.z + sz);
      }
    courtNet(V.tabletennis, 6.6, 3.45, 0.42);
  }

  /* ── Build the crowd ───────────────────────────────────── */
  let crowdMat: ReturnType<typeof crowdMaterial>;
  let flashMat: ReturnType<typeof pointsMaterial>;
  {
    // Kept light: a full house is thousands of these.
    const body = new CylinderGeometry(0.2, 0.24, 0.62, 6, 1, true).translate(0, 0.31, 0);
    const head = new IcosahedronGeometry(0.16, 0).translate(0, 0.8, 0);
    const armL = new BoxGeometry(0.09, 0.42, 0.09).translate(-0.31, 0.92, 0);
    const armR = new BoxGeometry(0.09, 0.42, 0.09).translate(0.31, 0.92, 0);
    const person = keep(mergeGeometries([body.toNonIndexed(), head.toNonIndexed(), armL.toNonIndexed(), armR.toNonIndexed()])!);
    [body, head, armL, armR].forEach((g) => g.dispose());
    crowdMat = keep(crowdMaterial());
    const n = crowdAt.length;
    const crowd = add(new InstancedMesh(person, crowdMat, n));
    crowd.frustumCulled = false;
    const aT = new Float32Array(n);
    const aR = new Float32Array(n);
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const c = new Color();
    const flashPos: number[] = [];
    const flashCol: number[] = [];
    crowdAt.forEach((p, i) => {
      q.setFromAxisAngle(UP, p.yaw);
      s.setScalar(0.95 + rnd() * 0.15);
      m.compose(new Vector3(p.x, p.y, p.z), q, s);
      crowd.setMatrixAt(i, m);
      crowd.setColorAt(i, c.set(p.col));
      aT[i] = p.t;
      aR[i] = rnd();
      if (rnd() < (hi ? 0.08 : 0.04)) {
        flashPos.push(p.x, p.y + 1.1, p.z);
        flashCol.push(1, 1, 1);
      }
    });
    person.setAttribute('aT', new InstancedBufferAttribute(aT, 1));
    person.setAttribute('aR', new InstancedBufferAttribute(aR, 1));
    if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
    flashMat = pts(flashPos, flashCol, 1, 2.6);
  }

  // Haze in the beams over the main pitch, and confetti waiting on the roof.
  let hazeMat: ReturnType<typeof pointsMaterial> | null = null;
  if (!lo) {
    const p: number[] = [];
    const c: number[] = [];
    for (let i = 0; i < (hi ? 900 : 450); i++) {
      p.push((rnd() - 0.5) * 120, 4 + rnd() * 34, (rnd() - 0.5) * 80);
      c.push(0.9, 0.88, 0.82);
    }
    hazeMat = pts(p, c, 2, 0.7);
  }
  let confettiMat: ReturnType<typeof pointsMaterial>;
  {
    const p: number[] = [];
    const c: number[] = [];
    const v: number[] = [];
    const a = new Vector3();
    const count = lo ? 300 : hi ? 1400 : 800;
    for (let i = 0; i < count; i++) {
      ringPoint(rnd() * Math.PI * 2, 40, a, roofY - 1);
      p.push(a.x, a.y, a.z);
      const red = rnd() < 0.55;
      c.push(red ? 0.85 : 0.97, red ? 0.12 : 0.97, red ? 0.17 : 0.95);
      v.push(-a.x * (0.04 + rnd() * 0.06), 1.5 + rnd() * 3, -a.z * (0.04 + rnd() * 0.06));
    }
    confettiMat = pts(p, c, 3, 1.4, { v });
  }

  // Searchlights: four beams from the roof crown, sweeping out over the city.
  const searchlights: { mesh: Mesh; at: Vector3; base: number; ph: number }[] = [];
  if (!lo) {
    const sMat = keep(beamMaterial('#e9f0ff', hi ? 0.11 : 0.09));
    beamMats.push(sMat);
    for (const [k, t] of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75].entries()) {
      const at = ringPoint(t, 56, new Vector3(), roofY + 3.6);
      const mesh = add(new Mesh(coneGeo, sMat));
      mesh.renderOrder = 5;
      searchlights.push({ mesh, at, base: Math.atan2(at.z, at.x), ph: k * 1.7 });
      flare(at, 5);
    }
  }
  const sweepDir = new Vector3();
  const SEARCH_LEN = 120;

  let fireworksMat: ReturnType<typeof fireworksMaterial>;
  {
    const shells = hi ? 9 : lo ? 5 : 7;
    const per = hi ? 220 : lo ? 90 : 150;
    const p: number[] = [];
    const v: number[] = [];
    const col: number[] = [];
    const r: number[] = [];
    const d: number[] = [];
    const palette = [
      [1, 0.16, 0.22],
      [1, 1, 1],
      [1, 0.72, 0.28],
      [1, 0.3, 0.36],
    ];
    const at = new Vector3();
    const dirv = new Vector3();
    for (let k = 0; k < shells; k++) {
      ringPoint((k / shells) * Math.PI * 2 + rnd() * 0.5, 22 + rnd() * 34, at, 66 + rnd() * 30);
      const hue = palette[k % palette.length]!;
      const speed = 30 + rnd() * 16;
      for (let i = 0; i < per; i++) {
        // An even sphere of directions, a little flattened.
        const u = rnd() * 2 - 1;
        const ang = rnd() * Math.PI * 2;
        const w = Math.sqrt(1 - u * u);
        dirv.set(w * Math.cos(ang), u * 0.85, w * Math.sin(ang)).multiplyScalar(speed * (0.82 + rnd() * 0.18));
        p.push(at.x, at.y, at.z);
        v.push(dirv.x, dirv.y, dirv.z);
        const white = rnd() < 0.18;
        col.push(white ? 1 : hue[0]!, white ? 1 : hue[1]!, white ? 1 : hue[2]!);
        r.push(rnd());
        d.push(0.2 + k * 0.38 + rnd() * 0.04);
      }
    }
    const g = keep(new BufferGeometry());
    g.setAttribute('position', new Float32BufferAttribute(p, 3));
    g.setAttribute('aV', new Float32BufferAttribute(v, 3));
    g.setAttribute('aC', new Float32BufferAttribute(col, 3));
    g.setAttribute('aR', new Float32BufferAttribute(r, 1));
    g.setAttribute('aD', new Float32BufferAttribute(d, 1));
    fireworksMat = keep(fireworksMaterial(glow, hi ? 6 : 6.5));
    const fw = add(new Points(g, fireworksMat));
    fw.frustumCulled = false;
    fw.renderOrder = 7;
  }

  /* ── Players ───────────────────────────────────────────── */
  const squad = new Squad(scene, 140, ctx.envMap);
  disposables.push(squad);
  const S = 1.35;
  // The match: 4-3-3 against 4-3-3. Positions are in the attacking team's frame (x toward the goal it attacks).
  const SHAPE: [number, number][] = [
    [-24, 0],
    [-15, -10],
    [-16, -3.5],
    [-16, 3.5],
    [-15, 10],
    [-7, -6],
    [-8, 0],
    [-7, 6],
    [2, -10],
    [3, 0],
    [2, 10],
  ];
  const team = (shirt: string, shorts: string, keeper: string) => SHAPE.map(([x, z], i) => squad.add(x, z, i === 0 ? keeper : shirt, shorts, S));
  const reds = team(RED, '#1d1d21', '#f2c94c');
  const whites = team(WHITE, '#e2e2e0', '#3dbb7a');
  const ref = squad.add(0, 6, '#16161a', '#16161a', S);
  const ballGeo = keep(new SphereGeometry(0.24, 18, 12));
  const ballMat = keep(new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.4 }));
  const ball = add(new Mesh(ballGeo, ballMat));
  const ballTrail = add(trail('#ffffff', 40, 0.85));
  const trailPts: Vector3[] = Array.from({ length: 40 }, () => new Vector3());

  // Runners lapping the track.
  const runners = Array.from({ length: 6 }, (_, i) => ({ id: squad.add(0, 0, i % 3 === 0 ? RED : '#2f5fb3', '#1d1d21', 1.25), lane: R_IN + (i + 0.5) * LANE_W, speed: 6.4 + rnd() * 1.4, s0: rnd() * 60 }));

  // Cricket: fielders around the ring, a batter, a bowler running in.
  const fielders = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 0.45 + rnd() * 0.4;
    return { id: squad.add(V.cricket.x + Math.cos(a) * 36 * r, V.cricket.z + Math.sin(a) * 32 * r, WHITE, WHITE, 1.4), a, r };
  });
  const batter = squad.add(V.cricket.x + 0.7, V.cricket.z - 10.6, '#2f5fb3', '#2f5fb3', 1.4);
  const bowler = squad.add(V.cricket.x, V.cricket.z + 16, '#2f5fb3', '#2f5fb3', 1.4);
  const cBall = add(new Mesh(keep(new SphereGeometry(0.2, 12, 8)), keep(new MeshStandardMaterial({ color: '#c8102e', emissive: '#c8102e', emissiveIntensity: 0.5 }))));
  const cShot = add(trail('#ff4b59', 64, 0.95));
  const cBat = new Vector3(V.cricket.x, 0.9, V.cricket.z - 9.6);
  const shotTo = new Vector3();
  let cCycle = -1;

  // Hockey: two teams weaving, the ball zipped between team-mates.
  const hockey = Array.from({ length: 12 }, (_, i) => ({
    id: squad.add(V.hockey.x, V.hockey.z, i < 6 ? RED : WHITE, '#1d1d21', 1.4),
    ax: 4 + rnd() * 18,
    az: 3 + rnd() * 12,
    fx: 0.25 + rnd() * 0.25,
    fz: 0.25 + rnd() * 0.3,
    ph: rnd() * 6,
    side: i < 6 ? -1 : 1,
  }));
  const hBall = add(new Mesh(keep(new SphereGeometry(0.16, 10, 8)), ballMat));
  const hPass = add(trail('#ffffff', 24, 0.9));
  const hFrom = new Vector3();
  const hTo = new Vector3();
  let hCycle = -1;

  // Basketball.
  const ballers = Array.from({ length: 10 }, (_, i) => ({
    id: squad.add(V.basketball.x, V.basketball.z, i < 5 ? RED : WHITE, i < 5 ? RED : WHITE, 1.45),
    ax: 3 + rnd() * 15,
    az: 2 + rnd() * 8,
    fx: 0.3 + rnd() * 0.3,
    fz: 0.35 + rnd() * 0.35,
    ph: rnd() * 6,
  }));
  const bBall = add(new Mesh(keep(new SphereGeometry(0.3, 14, 10)), keep(new MeshStandardMaterial({ color: '#ff7a2a', emissive: '#ff5a1a', emissiveIntensity: 0.35 }))));
  const bShot = add(trail('#ff8a3a', 48, 0.9));
  const bFrom = new Vector3();
  const bTo = new Vector3();
  let bCycle = -1;
  let bSide = 0;

  // Rallies: badminton, table tennis, tennis, volleyball.
  type Rally = { a: number; b: number; c: Vector3; spanX: number; spanZ: number; ball: Mesh; line: Line; lift: number; period: number; bounce: number; phase: number; hitY: number; bounceY: number; ph: [number, number] };
  const rallies: Rally[] = [];
  const rally = (c: Vector3, spanX: number, spanZ: number, lift: number, period: number, bounce: number, radius: number, ballColor: string, lineColor: string, hitY: number, bounceY = 0.1) => {
    const a = squad.add(c.x - spanX, c.z, RED, '#1d1d21', 1.45);
    const b = squad.add(c.x + spanX, c.z, WHITE, '#e2e2e0', 1.45);
    const ballMesh = add(new Mesh(keep(new SphereGeometry(radius, 12, 8)), keep(new MeshStandardMaterial({ color: ballColor, emissive: ballColor, emissiveIntensity: 0.5 }))));
    rallies.push({ a, b, c, spanX, spanZ, ball: ballMesh, line: add(trail(lineColor, 40, 0.9)), lift, period, bounce, phase: rnd() * 4, hitY, bounceY, ph: [rnd() * 6, rnd() * 6] });
  };
  rally(V.badminton, 8.5, 3.2, 7, 2.6, 0, 0.14, '#ffffff', '#ffffff', 2.6);
  rally(V.tabletennis, 7.2, 1.6, 1.2, 0.9, 0.55, 0.12, '#ffffff', '#ffb14a', 3.8, 3.12);
  rally(V.tennis, 18, 6, 3.2, 1.6, 0.62, 0.2, '#d8f04a', '#d8f04a', 1.6);
  for (let i = 0; i < 10; i++) squad.add(V.volleyball.x + (i < 5 ? -1 : 1) * (4 + (i % 3) * 5), V.volleyball.z + ((i % 5) - 2) * 3.5, i < 5 ? RED : WHITE, '#1d1d21', 1.45);
  rally(V.volleyball, 12, 6, 9, 2.2, 0, 0.3, '#ffd23a', '#ffd23a', 2.8);

  /* ── The camera's journey ──────────────────────────────── */
  const camPath = new CatmullRomCurve3([
    new Vector3(-70, 165, 170),
    new Vector3(-95, 72, 82),
    new Vector3(-48, 26, 4),
    new Vector3(-8, 8, 25),
    new Vector3(26, 11, 24),
    new Vector3(44, 62, -44),
    new Vector3(-34, 30, -120),
    new Vector3(34, 24, -212),
    new Vector3(-30, 34, -262),
    new Vector3(22, 36, -258),
    new Vector3(0, 38, -318),
    new Vector3(70, 175, -60),
  ]);
  const lookPath = new CatmullRomCurve3([
    new Vector3(0, 0, -20),
    new Vector3(0, 4, 0),
    new Vector3(2, 2, 0),
    new Vector3(8, 1.5, 0),
    new Vector3(20, 1.5, 0),
    new Vector3(0, 0, -130),
    new Vector3(0, 0, -150),
    new Vector3(0, 0, -240),
    V.basketball.clone().setY(2),
    V.tabletennis.clone().setY(3).lerp(V.badminton, 0.5),
    V.tennis.clone().lerp(V.volleyball, 0.5).setY(1),
    new Vector3(0, 0, -190),
  ]);
  const camera = new PerspectiveCamera(42, 1, 0.5, 1800);
  const look = new Vector3();
  let eased = 0;

  /* ── The match script ──────────────────────────────────── */
  const CYCLE = 16;
  let score: [number, number] = [2, 1];
  let lastCycle = -1;
  let goalAt = -100;
  let attackers = reds;
  let defenders = whites;
  let dir = 1;
  let minute = 67;
  let lastMinuteAt = 0;
  let screenState = '';
  const carriers = [3, 6, 5, 8, 9];
  const passTimes = [0, 2.0, 3.8, 5.6, 7.4];
  const shotT = 9.0;
  const shotDur = 0.75;
  const goalTarget = new Vector3();
  const tmp = new Vector3();
  const tmp2 = new Vector3();
  const ballPos = new Vector3();
  const passFrom = new Vector3();
  let passIdx = -1;
  let passStart = 0;

  const formation = (i: number, push: number, attacking: boolean) => {
    const [x, z] = SHAPE[i]!;
    // Attackers push up the pitch as the move goes on; defenders drop and narrow.
    const fx = attacking ? x + push * 12 : -(x + 4) - push * 5;
    const fz = attacking ? z : z * (1 - push * 0.25);
    return tmp.set(fx * dir, 0, fz);
  };

  return {
    scene,
    camera,
    update(s: ViewState) {
      const t = ctx.reduced ? 3 : s.time;
      const dt = ctx.reduced ? 0 : Math.min(0.05, s.dt);

      /* Football */
      const cycle = Math.floor(t / CYCLE);
      const ct = t - cycle * CYCLE;
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        const redAttack = cycle % 3 !== 2;
        attackers = redAttack ? reds : whites;
        defenders = redAttack ? whites : reds;
        dir = redAttack ? 1 : -1;
        goalTarget.set(dir * 26.4, 0.9 + rnd() * 0.6, (rnd() > 0.5 ? 1 : -1) * (1.2 + rnd() * 0.8));
        passIdx = -1;
      }
      const push = Math.min(1, ct / shotT);
      const scored = ct >= shotT + shotDur && ct < CYCLE;
      const celebrating = scored && ct < shotT + shotDur + 4;
      const resetting = ct > shotT + shotDur + 4;

      // The ball: dribbled, passed, then shot.
      let carrier = -1;
      for (let k = passTimes.length - 1; k >= 0; k--)
        if (ct >= passTimes[k]!) {
          carrier = k;
          break;
        }
      if (carrier !== passIdx && ct < shotT) {
        passFrom.copy(ballPos);
        passStart = ct;
        passIdx = carrier;
      }
      const cp = squad.get(attackers[carriers[Math.max(0, carrier)]!]!);
      if (ct < shotT) {
        const u = Math.min(1, (ct - passStart) / 0.8);
        tmp2.set(cp.x + dir * 0.7, 0.24, cp.z);
        if (u < 1 && passIdx >= 0) arc(passFrom, tmp2, 0.6, u, ballPos);
        else ballPos.copy(tmp2);
      } else if (ct < shotT + shotDur) {
        const striker = squad.get(attackers[carriers[carriers.length - 1]!]!);
        const u = (ct - shotT) / shotDur;
        tmp2.set(striker.x + dir * 0.7, 0.3, striker.z);
        arc(tmp2, goalTarget, 1.4, u, ballPos);
      } else if (!resetting) {
        ballPos.set(goalTarget.x + dir * 1.2, 0.3, goalTarget.z * 0.8);
      } else {
        ballPos.lerp(tmp2.set(0, 0.24, 0), Math.min(1, dt * 1.5));
      }
      ball.position.copy(ballPos);
      ball.rotation.x += dt * 8;
      for (let k = trailPts.length - 1; k > 0; k--) trailPts[k]!.copy(trailPts[k - 1]!);
      trailPts[0]!.copy(ballPos);
      const tp = ballTrail.geometry.attributes.position as BufferAttribute;
      trailPts.forEach((p, k) => tp.setXYZ(k, p.x, p.y, p.z));
      tp.needsUpdate = true;
      ballTrail.geometry.setDrawRange(0, trailPts.length);
      (ballTrail.material as LineBasicMaterial).opacity = ct >= shotT - 0.1 && ct < shotT + shotDur + 0.4 ? 0.95 : 0.25;

      // The goal moment.
      if (ct >= shotT + shotDur && goalAt < cycle * CYCLE + shotT) {
        goalAt = cycle * CYCLE + shotT + shotDur;
        score = dir > 0 ? [score[0] + 1, score[1]] : [score[0], score[1] + 1];
        if (score[0] + score[1] > 9) score = [2, 1];
        confettiMat.uniforms.uBurst!.value = t;
        fireworksMat.uniforms.uBurst!.value = t;
      }
      const sinceGoal = t - goalAt;
      const cheer = sinceGoal >= 0 && sinceGoal < 6 ? Math.max(0, 1 - sinceGoal / 6) : 0;
      crowdMat.uniforms.uCheer!.value = cheer;
      ledMat.color.set(cheer > 0.05 && Math.sin(t * 14) > 0 ? '#ff2433' : '#ffffff');
      chase.offset.x = (chase.offset.x - dt * (0.12 + cheer * 1.4)) % 1;
      chaseMat.color.setScalar(0.75 + cheer * 0.6 + 0.1 * Math.sin(t * 2));
      for (const [i, b] of beacons.entries()) b.material.opacity = Math.sin(t * 3.1 + i * 0.8) > 0.2 ? 1 : 0.08;

      // Players: attackers run the move, defenders track, keepers guard, the ref follows.
      const run = 7.2;
      attackers.forEach((id, i) => {
        if (celebrating) {
          const corner = tmp.set(dir * 24, 0, goalTarget.z > 0 ? 15 : -15);
          squad.steer(id, corner.x + (i % 3) * 1.2, corner.z - Math.sign(corner.z) * Math.floor(i / 3) * 1.2, i === 0 ? 0 : run, dt, { arms: i === 0 ? 0 : 1 });
          return;
        }
        const f = formation(i, resetting ? 0 : push, true);
        if (!resetting && i === carriers[Math.max(0, carrier)] && ct < shotT) f.x += dir * 2.5;
        squad.steer(id, f.x, f.z, resetting ? 4 : run, dt);
      });
      defenders.forEach((id, i) => {
        if (i === 0) {
          // The keeper tracks the ball across the goal, and dives at the shot.
          const gx = dir * 25.2;
          const diving = ct > shotT + 0.25 && ct < shotT + shotDur + 1.2;
          const side = goalTarget.z > 0 ? 1 : -1;
          const z = diving ? side * 1.4 : Math.max(-2, Math.min(2, ballPos.z * 0.15));
          squad.steer(id, gx, z, diving ? 6 : 3, dt, { side: diving ? -side * 1.1 : 0, y: diving ? 0.4 : 0, face: dir > 0 ? -Math.PI / 2 : Math.PI / 2 });
          return;
        }
        const f = formation(i, resetting ? 0 : push, false);
        // Mark the nearest attacker, goal-side.
        const target = squad.get(attackers[Math.min(10, i)]!);
        if (!resetting && !celebrating) f.lerp(tmp2.set(target.x + dir * 1.6, 0, target.z), 0.55);
        squad.steer(id, f.x, f.z, resetting ? 4 : run * 0.92, dt);
      });
      squad.steer(ref, ballPos.x * 0.7, ballPos.z * 0.6 + 6, 6, dt);

      // The nets billow when the ball goes in.
      for (const n of nets) {
        const hit = Math.sign(n.x) === dir && sinceGoal >= 0 && sinceGoal < 1.6 ? Math.sin(Math.min(1, sinceGoal / 1.6) * Math.PI) * (1 - sinceGoal / 1.6) : 0;
        for (let k = 0; k < n.pos.count; k++) {
          const x = n.rest[k * 3]!;
          const y = n.rest[k * 3 + 1]!;
          const z = n.rest[k * 3 + 2]!;
          const depth = Math.abs(x - n.x) / GOAL_D;
          const near = Math.exp(-((z - goalTarget.z) ** 2 + (y - goalTarget.y) ** 2) / 1.4);
          n.pos.setX(k, x + Math.sign(n.x) * hit * near * depth * 0.9);
        }
        n.pos.needsUpdate = true;
      }

      // The scoreboard: the clock ticks; GOAL flashes after a goal.
      if (t - lastMinuteAt > 9) {
        lastMinuteAt = t;
        minute = minute >= 90 ? 46 : minute + 1;
      }
      const state = sinceGoal >= 0 && sinceGoal < 3.2 ? `goal${Math.floor(sinceGoal * 3) % 2}` : `${score[0]}-${score[1]}-${minute}`;
      if (state !== screenState) {
        screenState = state;
        sb.draw(score[0], score[1], minute, state === 'goal0');
      }
      for (const a of ads) a.offset.x = (a.offset.x + dt * 0.05) % 1;

      // The athletics track.
      for (const r of runners) {
        lanePoint(r.s0 + t * r.speed, r.lane, tmp);
        squad.set(r.id, tmp.x, tmp.z);
      }

      // Cricket: one ball every 6 s, run in, struck to the rope.
      const cc = Math.floor(t / 6);
      const cct = t % 6;
      if (cc !== cCycle) {
        cCycle = cc;
        const a = rnd() * Math.PI * 2;
        shotTo.set(V.cricket.x + Math.cos(a) * 35, 0.3, V.cricket.z + Math.sin(a) * 31);
      }
      squad.set(bowler, V.cricket.x + 0.4, V.cricket.z + 9.6 + Math.max(0, 1.6 - cct) * 4.5);
      squad.set(batter, V.cricket.x + 0.7, V.cricket.z - 10.6, { face: 0, arms: cct > 1.5 && cct < 1.9 ? 0.6 : 0 });
      const shot = cShot.geometry.attributes.position as BufferAttribute;
      if (cct < 1.6) {
        cBall.position.set(V.cricket.x + 0.3, 2 - cct * 0.6, V.cricket.z + 9 - (cct / 1.6) * 18.6);
        cShot.geometry.setDrawRange(0, 0);
      } else {
        const u = Math.min(1, (cct - 1.6) / 2.4);
        const n = Math.max(2, Math.round(u * 63) + 1);
        for (let k = 0; k < n; k++) {
          arc(cBat, shotTo, 15, k / 63, tmp);
          shot.setXYZ(k, tmp.x, tmp.y, tmp.z);
        }
        shot.needsUpdate = true;
        cShot.geometry.setDrawRange(0, n);
        (cShot.material as LineBasicMaterial).opacity = cct > 4.6 ? Math.max(0, 1 - (cct - 4.6) / 1.2) : 0.95;
        arc(cBat, shotTo, 15, u, cBall.position);
      }
      // Fielders chase the ball once it's struck.
      fielders.forEach((f, i) => {
        const home = tmp.set(V.cricket.x + Math.cos(f.a) * 36 * f.r, 0, V.cricket.z + Math.sin(f.a) * 32 * f.r);
        const chase = cct > 1.8 && cct < 5 && i === Math.floor(((Math.atan2(shotTo.z - V.cricket.z, shotTo.x - V.cricket.x) + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / 9)) % 9;
        if (chase) squad.steer(f.id, shotTo.x, shotTo.z, 6, dt);
        else squad.steer(f.id, home.x, home.z, 3, dt);
      });

      // Hockey.
      for (const p of hockey) squad.set(p.id, V.hockey.x + p.side * 8 + Math.sin(t * p.fx + p.ph) * p.ax * 0.6, V.hockey.z + Math.cos(t * p.fz + p.ph * 1.3) * p.az);
      const hc = Math.floor(t / 1.4);
      const hu = (t % 1.4) / 0.7;
      if (hc !== hCycle) {
        hCycle = hc;
        const side = rnd() > 0.5 ? 0 : 6;
        const a = squad.get(hockey[side + Math.floor(rnd() * 6)]!.id);
        const b = squad.get(hockey[side + Math.floor(rnd() * 6)]!.id);
        hFrom.set(a.x, 0.2, a.z);
        hTo.set(b.x, 0.2, b.z);
      }
      const hp = hPass.geometry.attributes.position as BufferAttribute;
      const hn = Math.max(2, Math.round(Math.min(1, hu) * 23) + 1);
      for (let k = 0; k < hn; k++) {
        tmp.lerpVectors(hFrom, hTo, k / 23);
        hp.setXYZ(k, tmp.x, 0.2, tmp.z);
      }
      hp.needsUpdate = true;
      hPass.geometry.setDrawRange(0, hn);
      (hPass.material as LineBasicMaterial).opacity = hu > 1 ? Math.max(0, 1 - (hu - 1) * 2) : 0.9;
      hBall.position.lerpVectors(hFrom, hTo, Math.min(1, hu));

      // Basketball.
      for (const b of ballers) squad.set(b.id, V.basketball.x + Math.sin(t * b.fx + b.ph) * b.ax, V.basketball.z + Math.cos(t * b.fz + b.ph * 1.3) * b.az);
      const bc = Math.floor(t / 3.2);
      const bt = (t % 3.2) / 1.6;
      if (bc !== bCycle) {
        bCycle = bc;
        bSide = rnd() > 0.5 ? 1 : 0;
        const hoop = hoops[bSide]!.position;
        const d = bSide ? -1 : 1;
        bFrom.set(hoop.x + d * (4 + rnd() * 8), 2.6, V.basketball.z + (rnd() - 0.5) * 16);
        bTo.copy(hoop);
      }
      const bpos = bShot.geometry.attributes.position as BufferAttribute;
      const bu = Math.min(1, bt);
      const bn = Math.max(2, Math.round(bu * 47) + 1);
      for (let k = 0; k < bn; k++) {
        arc(bFrom, bTo, 4.5, k / 47, tmp);
        bpos.setXYZ(k, tmp.x, tmp.y, tmp.z);
      }
      bpos.needsUpdate = true;
      bShot.geometry.setDrawRange(0, bn);
      (bShot.material as LineBasicMaterial).opacity = bt > 1.2 ? Math.max(0, 1 - (bt - 1.2) * 1.5) : 0.9;
      arc(bFrom, bTo, 4.5, bu, bBall.position);
      hoops.forEach((h, i) => ((h.material as MeshStandardMaterial).emissiveIntensity = i === bSide && bt > 1 && bt < 1.5 ? 2.5 : 0.4));

      // Rallies.
      for (const r of rallies) {
        const pa = tmp.set(r.c.x - r.spanX, 0, r.c.z + Math.sin(t * 0.9 + r.ph[0]) * r.spanZ);
        squad.set(r.a, pa.x, pa.z, { face: Math.PI / 2 });
        const pb = tmp2.set(r.c.x + r.spanX, 0, r.c.z + Math.sin(t * 0.9 + r.ph[1]) * r.spanZ);
        squad.set(r.b, pb.x, pb.z, { face: -Math.PI / 2 });
        const A = squad.get(r.a);
        const B = squad.get(r.b);
        const k = (t + r.phase) / r.period;
        const leg = Math.floor(k);
        const u = k - leg;
        const from = new Vector3(leg % 2 ? B.x : A.x, r.hitY, leg % 2 ? B.z : A.z);
        const to = new Vector3(leg % 2 ? A.x : B.x, r.hitY, leg % 2 ? A.z : B.z);
        const sample = (v: number, out: Vector3) => {
          if (r.bounce > 0) {
            const at = new Vector3().lerpVectors(from, to, r.bounce).setY(r.bounceY);
            return v > r.bounce ? arc(at, to, r.lift * 0.35, (v - r.bounce) / (1 - r.bounce), out) : arc(from, at, r.lift, v / r.bounce, out);
          }
          return arc(from, to, r.lift, v, out);
        };
        const pos = r.line.geometry.attributes.position as BufferAttribute;
        const n = Math.max(2, Math.round(u * 39) + 1);
        for (let i = 0; i < n; i++) {
          sample(i / 39, tmp);
          pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
        }
        pos.needsUpdate = true;
        r.line.geometry.setDrawRange(0, n);
        sample(u, r.ball.position);
      }

      squad.commit(dt || 1 / 60);

      // Shared time for the GPU-animated crowd, beams and particles.
      crowdMat.uniforms.uTime!.value = t;
      flashMat.uniforms.uTime!.value = t;
      starMat.uniforms.uTime!.value = t;
      confettiMat.uniforms.uTime!.value = t;
      fireworksMat.uniforms.uTime!.value = t;
      roofLightMat.uniforms.uTime!.value = t * 0.35;
      for (const l of searchlights) {
        // Each beam leans out from the roof and swings slowly to and fro.
        const yaw = l.base + Math.sin(t * 0.21 + l.ph) * 0.7;
        const tilt = 0.55 + 0.2 * Math.sin(t * 0.17 + l.ph * 1.3);
        sweepDir.set(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw));
        l.mesh.position.copy(l.at).addScaledVector(sweepDir, SEARCH_LEN / 2);
        l.mesh.quaternion.setFromUnitVectors(UP, sweepDir.negate());
        l.mesh.scale.set(7 + cheer * 3, SEARCH_LEN, 7 + cheer * 3);
      }
      if (hazeMat) hazeMat.uniforms.uTime!.value = t;
      for (const m of beamMats) m.uniforms.uTime!.value = t;

      // Glide, not jump, between venues.
      eased += (s.progress - eased) * (ctx.reduced ? 1 : Math.min(1, (s.dt || 0.016) * 5));
      const p = Math.min(1, Math.max(0, eased));
      camPath.getPoint(p, camera.position);
      lookPath.getPoint(p, look);
      camera.position.x += s.pointer.x * 3;
      camera.position.y += s.pointer.y * 1.5;
      camera.lookAt(look);
    },
    dispose() {
      textures.forEach((x) => x.dispose());
      disposables.forEach((d) => d.dispose());
      scene.traverse((o) => {
        if (o instanceof Line) {
          o.geometry.dispose();
          (o.material as Material).dispose();
        }
      });
    },
  };
}
