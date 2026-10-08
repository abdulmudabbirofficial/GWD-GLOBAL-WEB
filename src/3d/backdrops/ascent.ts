import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * About: the ascent. A snow-capped mountain at sunset, pine forests and
 * boulders on its slopes, lakes in the valleys and ranges fading into the
 * haze, with a red path winding up its face and a beacon at each milestone. Mist drifts through the valleys,
 * snow blows off the ridges, birds wheel overhead, and a light climbs the path
 * ahead of you. The camera follows the path as you read the story; at the end
 * of the page it reaches the summit, where a red flag is flying.
 */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < 5; i++) {
    s += a * noise(x, y);
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s;
}
/** Sharp-crested noise: ridges where plain noise has its midpoints. */
function ridged(x: number, y: number) {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < 4; i++) {
    const n = 1 - Math.abs(noise(x, y) * 2 - 1);
    s += a * n * n;
    x *= 2.1;
    y *= 2.1;
    a *= 0.5;
  }
  return s;
}
// The mountain: a broad peak with ridgelines running down from the summit.
const heightAt = (x: number, z: number) => {
  const d = Math.sqrt(x * x + (z + 8) * (z + 8));
  const peak = Math.max(0, 22 - d * 0.62) ** 1.15;
  const angle = Math.atan2(z + 8, x);
  const aretes = Math.pow(1 - Math.abs(Math.sin(angle * 2.5 + fbm(x * 0.05, z * 0.05) * 2.2)), 3) * Math.min(peak, 26) * 0.16;
  return peak + aretes + fbm(x * 0.08 + 3, z * 0.08) * 6 + ridged(x * 0.045, z * 0.045) * 3.5 - 4.2;
};

const skyVert = /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const skyFrag = /* glsl */ `
varying vec3 vP; uniform vec3 uSun;
void main(){
  float h = vP.y;
  vec3 top = vec3(0.10, 0.10, 0.16);
  vec3 mid = vec3(0.36, 0.27, 0.36);
  vec3 low = vec3(0.98, 0.58, 0.42);
  vec3 col = mix(low, mid, smoothstep(-0.02, 0.22, h));
  col = mix(col, top, smoothstep(0.2, 0.75, h));
  float sd = max(dot(vP, normalize(uSun)), 0.0);
  col += vec3(1.0, 0.62, 0.38) * pow(sd, 18.0) * 0.6 + vec3(1.0, 0.85, 0.7) * pow(sd, 600.0) * 2.0;
  gl_FragColor = vec4(col, 1.0);
}`;

function softTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function createAscent(ctx: WorldContext): WorldScene {
  const scene = new Scene();
  const haze = new Color('#5a4b58');
  scene.fog = new Fog(haze, 60, 230);
  const low = ctx.tier === 'low';
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Sky: a sunset gradient dome with the sun low on the horizon.
  const sunDir = new Vector3(-0.8, 0.12, -0.6).normalize();
  const skyGeo = new SphereGeometry(400, 32, 16);
  const skyMat = new ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: { uSun: { value: sunDir } }, side: BackSide, depthWrite: false, fog: false });
  const sky = new Mesh(skyGeo, skyMat);
  scene.add(sky);

  // The mountain, coloured by height and slope: dusk valleys, rock, snow on the heights.
  const seg = ctx.tier === 'high' ? 200 : low ? 90 : 130;
  const geo = new PlaneGeometry(220, 220, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const normal = geo.attributes.normal!;
  const colors = new Float32Array(pos.count * 3);
  const valley = new Color('#2d3a36');
  const meadow = new Color('#4a5a45');
  const rockWarm = new Color('#7b6660');
  const rockCool = new Color('#8b8390');
  const snow = new Color('#f6f3f6');
  const c = new Color();
  const c2 = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const flat = normal.getY(i);
    const n = fbm(pos.getX(i) * 0.3, pos.getZ(i) * 0.3);
    const streak = noise(pos.getX(i) * 0.9, pos.getY(i) * 0.6);
    // Forest and meadow below, warm rock on the steep faces, cooler rock higher up.
    c.copy(valley).lerp(meadow, Math.min(1, Math.max(0, (flat - 0.75) / 0.2)) * Math.min(1, Math.max(0, 1 - y / 12)));
    c2.copy(rockWarm).lerp(rockCool, Math.min(1, Math.max(0, (y - 8) / 18)));
    c2.offsetHSL(0, 0, (streak - 0.5) * 0.08);
    const rocky = Math.min(1, Math.max(0, (y - 3) / 9 + (0.8 - flat) * 1.6));
    c.lerp(c2, rocky);
    const snowLine = 18 + n * 7;
    const snowy = Math.min(1, Math.max(0, (y - snowLine) / 3.5)) * Math.min(1, Math.max(0, (flat - 0.4) / 0.28));
    c.lerp(snow, snowy);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  const groundMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  const ground = new Mesh(geo, groundMat);
  scene.add(ground);
  scene.add(new HemisphereLight('#c8bcd8', '#2e2734', 0.85));
  const sun = new DirectionalLight('#ffc39a', 3.2);
  sun.position.copy(sunDir).multiplyScalar(100);
  scene.add(sun);

  // The climbing path spirals in from radius 27 to 1 around the peak; the
  // camera rides 16 units outside it, so keep that whole band clear.
  const pathNear = (x: number, z: number) => {
    const d = Math.hypot(x, z + 8);
    return d < 46;
  };
  // Pine forests on the gentler lower slopes, boulders scattered higher up.
  const dummy = new Object3D();
  const pineCount = low ? 260 : 900;
  const pineGeo = new ConeGeometry(0.45, 1.7, 6);
  pineGeo.translate(0, 1.15, 0);
  const trunkGeo = new CylinderGeometry(0.06, 0.08, 0.4, 5);
  trunkGeo.translate(0, 0.2, 0);
  const pineMat = new MeshStandardMaterial({ color: '#2f4038', roughness: 0.9, flatShading: true });
  const trunkMat = new MeshStandardMaterial({ color: '#3a2c26', roughness: 0.95 });
  const pines = new InstancedMesh(pineGeo, pineMat, pineCount);
  const trunks = new InstancedMesh(trunkGeo, trunkMat, pineCount);
  let placed = 0;
  for (let tries = 0; tries < pineCount * 8 && placed < pineCount; tries++) {
    const x = (rnd() - 0.5) * 200;
    const z = -8 + (rnd() - 0.5) * 200;
    const y = heightAt(x, z);
    const slope = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
    if (y < 0.4 || y > 15 + fbm(x * 0.2, z * 0.2) * 4 || slope > 1.6) continue;
    // Keep the climbing path itself clear.
    const d = Math.hypot(x, z + 8);
    // and the ground right under the camera's climb, so trees never fill the view.
    if (d < 7 || pathNear(x, z)) continue;
    const sc = 0.55 + rnd() * 0.7;
    dummy.position.set(x, y - 0.15, z);
    dummy.rotation.set(0, rnd() * Math.PI, 0);
    dummy.scale.set(sc, sc * (0.8 + rnd() * 0.5), sc);
    dummy.updateMatrix();
    pines.setMatrixAt(placed, dummy.matrix);
    trunks.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  pines.count = trunks.count = placed;
  scene.add(pines, trunks);
  const rockCount = low ? 80 : 240;
  const rockGeo = new DodecahedronGeometry(0.5, 0);
  const rockMat = new MeshStandardMaterial({ color: '#6c6370', roughness: 0.95, flatShading: true });
  const rocks = new InstancedMesh(rockGeo, rockMat, rockCount);
  for (let i = 0; i < rockCount; i++) {
    const x = (rnd() - 0.5) * 120;
    const z = -8 + (rnd() - 0.5) * 120;
    const sc = 0.3 + rnd() * 1.1;
    dummy.position.set(x, heightAt(x, z) + sc * 0.2, z);
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    dummy.scale.set(sc, sc * 0.7, sc);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  scene.add(rocks);

  // Water in the low valleys, catching the sunset.
  const waterGeo = new PlaneGeometry(240, 240);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new MeshStandardMaterial({ color: '#3d3550', roughness: 0.08, metalness: 0.85, envMap: ctx.envMap, envMapIntensity: 0.6, transparent: true, opacity: 0.92 });
  const water = new Mesh(waterGeo, waterMat);
  water.position.set(0, -0.6, -8);
  scene.add(water);

  // Distant ranges: jagged ridgelines in four layers, each further one paler in
  // the haze; the side facing the sun catches warm light, the tallest carry snow.
  const rangeMats: MeshBasicMaterial[] = [];
  const ranges = new Group();
  const layers = low ? 2 : 4;
  const hazeTop = new Color('#b88a86');
  for (let ring = 0; ring < layers; ring++) {
    const N = 360;
    const r = 150 + ring * 62;
    const amp = 18 + ring * 9;
    const posArr: number[] = [];
    const colArr: number[] = [];
    const idx: number[] = [];
    const near = new Color(['#3b3346', '#54445a', '#77606f', '#9a7a80'][ring]!);
    const lit = near.clone().lerp(new Color('#e39a78'), 0.35);
    const top = new Color();
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = -8 + Math.sin(a) * r;
      const h = 4 + ridged(a * 5 + ring * 13, ring * 3.1) * amp + noise(a * 40, ring) * 2.2;
      const sunSide = Math.max(0, Math.cos(a - Math.atan2(sunDir.z, sunDir.x)));
      top.copy(near).lerp(lit, sunSide * 0.8);
      if (h > amp * 0.78) top.lerp(new Color('#f1e6ea'), Math.min(0.75, ((h - amp * 0.78) / (amp * 0.3)) * (0.5 + ring * 0.12)));
      posArr.push(x, -6, z, x, h, z);
      colArr.push(hazeTop.r, hazeTop.g, hazeTop.b, top.r, top.g, top.b);
    }
    for (let k = 0; k < N; k++) {
      const i = k * 2;
      idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(posArr), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(colArr), 3));
    g.setIndex(idx);
    const m = new MeshBasicMaterial({ vertexColors: true, fog: false, side: DoubleSide });
    rangeMats.push(m);
    const mesh = new Mesh(g, m);
    mesh.renderOrder = -5 + ring;
    ranges.add(mesh);
  }
  scene.add(ranges);

  // Sunset clouds: long soft streaks, lit orange from below, drifting.
  const cloudTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const g = cv.getContext('2d')!;
    for (let i = 0; i < 70; i++) {
      const x = 40 + Math.random() * 432;
      const y = 50 + (Math.random() - 0.5) * 40;
      const rx = 40 + Math.random() * 90;
      const ry = 8 + Math.random() * 16;
      const grd = g.createRadialGradient(x, y, 0, x, y, rx);
      grd.addColorStop(0, 'rgba(255,255,255,0.32)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.save();
      g.translate(x, y);
      g.scale(1, ry / rx);
      g.translate(-x, -y);
      g.beginPath();
      g.arc(x, y, rx, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    const t = new CanvasTexture(cv);
    t.colorSpace = SRGBColorSpace;
    return t;
  })();
  const clouds: { m: Mesh; a: number; r: number; h: number; sp: number }[] = [];
  const cloudGeo = new PlaneGeometry(1, 1);
  for (let i = 0; i < (low ? 5 : 11); i++) {
    const warm = rnd();
    const m = new Mesh(
      cloudGeo,
      new MeshBasicMaterial({ map: cloudTex, color: new Color('#ffd0b0').lerp(new Color('#c8a7c0'), warm), transparent: true, opacity: 0.55 + rnd() * 0.3, depthWrite: false, fog: false }),
    );
    const w = 120 + rnd() * 140;
    m.scale.set(w, w * 0.22, 1);
    m.renderOrder = -6;
    scene.add(m);
    clouds.push({ m, a: rnd() * Math.PI * 2, r: 300 + rnd() * 60, h: 45 + rnd() * 70, sp: 0.004 + rnd() * 0.006 });
  }

  // The path: spirals up the face to the summit.
  const pts: Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const r = 26 * (1 - t) + 1;
    const a = -0.6 + t * Math.PI * 2.1;
    const x = Math.sin(a) * r;
    const z = -8 + Math.cos(a) * r;
    pts.push(new Vector3(x, heightAt(x, z) + 0.35, z));
  }
  const path = new CatmullRomCurve3(pts);
  const tubeGeo = new TubeGeometry(path, 400, 0.18, 8, false);
  const tubeMat = new MeshBasicMaterial({ color: '#ff3b4a' });
  scene.add(new Mesh(tubeGeo, tubeMat));
  const glowGeo = new TubeGeometry(path, 400, 0.6, 8, false);
  const glowMat = new MeshBasicMaterial({ color: '#ff3b4a', transparent: true, opacity: 0.18, blending: AdditiveBlending, depthWrite: false });
  scene.add(new Mesh(glowGeo, glowMat));

  // A beacon at every milestone: a pulsing light with a beam into the dusk.
  const soft = softTexture();
  const beacons: { glow: Mesh; beam: Mesh; at: number }[] = [];
  const glowPlane = new PlaneGeometry(3.2, 3.2);
  const beamGeo = new PlaneGeometry(0.35, 14);
  beamGeo.translate(0, 7, 0);
  for (let i = 1; i <= 7; i++) {
    const at = i / 8;
    const p = path.getPointAt(at);
    const glow = new Mesh(glowPlane, new MeshBasicMaterial({ map: soft, color: '#ffd6c9', transparent: true, depthWrite: false, blending: AdditiveBlending }));
    glow.position.copy(p).add(new Vector3(0, 0.9, 0));
    scene.add(glow);
    const beam = new Mesh(beamGeo, new MeshBasicMaterial({ map: soft, color: '#ff5a66', transparent: true, opacity: 0.25, depthWrite: false, blending: AdditiveBlending, side: DoubleSide }));
    beam.position.copy(p);
    scene.add(beam);
    beacons.push({ glow, beam, at });
  }

  // The climber's light, always a little ahead of you on the path.
  const climber = new Mesh(new PlaneGeometry(2.4, 2.4), new MeshBasicMaterial({ map: soft, color: '#ffffff', transparent: true, depthWrite: false, blending: AdditiveBlending }));
  scene.add(climber);

  // The summit flag, in GWD red, flying.
  const summit = path.getPointAt(1);
  const flagGroup = new Group();
  flagGroup.position.copy(summit);
  const poleGeo = new PlaneGeometry(0.12, 4.2);
  poleGeo.translate(0, 2.1, 0);
  flagGroup.add(new Mesh(poleGeo, new MeshBasicMaterial({ color: '#e8e4e8', side: DoubleSide })));
  const flagGeo = new PlaneGeometry(2.6, 1.5, 16, 4);
  flagGeo.translate(1.3, 3.4, 0);
  const flagBase = Float32Array.from(flagGeo.attributes.position!.array);
  const flagMat = new MeshStandardMaterial({ color: '#c8101e', roughness: 0.6, side: DoubleSide });
  const flag = new Mesh(flagGeo, flagMat);
  flagGroup.add(flag);
  scene.add(flagGroup);

  // Mist banks drifting through the valleys.
  const mist: { m: Mesh; speed: number; base: Vector3 }[] = [];
  const mistGeo = new PlaneGeometry(1, 1);
  for (let i = 0; i < (low ? 8 : 18); i++) {
    const s = 26 + rnd() * 34;
    const m = new Mesh(mistGeo, new MeshBasicMaterial({ map: soft, color: '#f4d9d2', transparent: true, opacity: 0.1 + rnd() * 0.1, depthWrite: false, fog: false }));
    m.scale.set(s * 1.8, s * 0.55, 1);
    const a = rnd() * Math.PI * 2;
    const r = 30 + rnd() * 55;
    const base = new Vector3(Math.cos(a) * r, 4 + rnd() * 10, -8 + Math.sin(a) * r);
    m.position.copy(base);
    scene.add(m);
    mist.push({ m, speed: 0.4 + rnd() * 0.8, base });
  }

  // Snow blowing on the wind.
  const snowCount = low ? 500 : 1400;
  const snowPos = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) snowPos.set([(rnd() - 0.5) * 120, rnd() * 60, -8 + (rnd() - 0.5) * 120], i * 3);
  const snowGeo = new BufferGeometry();
  snowGeo.setAttribute('position', new BufferAttribute(snowPos, 3));
  const snowMat = new PointsMaterial({ color: '#ffffff', size: 0.22, transparent: true, opacity: 0.75, depthWrite: false });
  const snowPts = new Points(snowGeo, snowMat);
  scene.add(snowPts);

  // Birds wheeling over the ridges: small Vs that flap.
  const birdCount = low ? 6 : 12;
  const birdGeo = new BufferGeometry();
  birdGeo.setAttribute('position', new BufferAttribute(new Float32Array(birdCount * 4 * 3), 3));
  const birdMat = new LineBasicMaterial({ color: '#2a2230' });
  const birds = new LineSegments(birdGeo, birdMat);
  birds.frustumCulled = false;
  scene.add(birds);
  const birdData = Array.from({ length: birdCount }, () => ({ r: 12 + rnd() * 18, h: 30 + rnd() * 14, sp: 0.12 + rnd() * 0.1, ph: rnd() * 6.28, flap: 5 + rnd() * 3 }));

  const camera = new PerspectiveCamera(48, 1, 0.5, 900);
  const look = new Vector3();
  const tmp = new Vector3();

  return {
    scene,
    camera,
    update(s: ViewState) {
      const time = s.time;
      const t = Math.min(0.97, 0.02 + s.progress * 0.95);
      const p = path.getPointAt(t);
      const ahead = path.getPointAt(Math.min(1, t + 0.05));
      // Follow from behind and above, looking up the path.
      const back = p.clone().sub(ahead).normalize();
      camera.position.set(p.x + back.x * 16 + s.pointer.x * 2, p.y + 9 + s.pointer.y, p.z + back.z * 16);
      look.lerp(ahead.clone().add(new Vector3(0, 2, 0)), 0.12);
      camera.lookAt(look);
      sky.position.copy(camera.position);

      // Beacons: reached ones burn bright and pulse; the ones ahead wait.
      beacons.forEach((b, i) => {
        const reached = t > b.at - 0.02;
        const pulse = 0.85 + 0.15 * Math.sin(time * 2.4 + i);
        b.glow.scale.setScalar((reached ? 1.5 : 0.8) * pulse);
        b.glow.lookAt(camera.position);
        (b.beam.material as MeshBasicMaterial).opacity = reached ? 0.32 : 0.1;
        b.beam.lookAt(camera.position.x, b.beam.position.y, camera.position.z);
      });
      path.getPointAt(Math.min(1, t + 0.035 + ((time * 0.02) % 0.04)), climber.position);
      climber.position.y += 0.7;
      climber.lookAt(camera.position);
      climber.scale.setScalar(0.9 + 0.2 * Math.sin(time * 5));

      // The flag ripples in the wind.
      const fp = flagGeo.attributes.position as BufferAttribute;
      for (let i = 0; i < fp.count; i++) {
        const x = flagBase[i * 3]!;
        fp.setZ(i, Math.sin(x * 2.2 - time * 6) * 0.18 * (x / 2.6));
      }
      fp.needsUpdate = true;
      flagGeo.computeVertexNormals();
      flagGroup.lookAt(camera.position.x, flagGroup.position.y, camera.position.z);
      flagGroup.rotateY(Math.PI / 2);

      // Clouds drift slowly round the sky, always facing the climber.
      for (const cl of clouds) {
        const a = cl.a + time * cl.sp;
        cl.m.position.set(camera.position.x + Math.cos(a) * cl.r, cl.h, camera.position.z + Math.sin(a) * cl.r);
        cl.m.lookAt(camera.position);
      }

      // Mist drifts; snow blows; birds wheel.
      mist.forEach((m, i) => {
        m.m.position.x = m.base.x + Math.sin(time * 0.05 * m.speed + i) * 12;
        m.m.position.z = m.base.z + Math.cos(time * 0.04 * m.speed + i) * 6;
        m.m.lookAt(camera.position);
      });
      const sp = snowGeo.attributes.position as BufferAttribute;
      for (let i = 0; i < snowCount; i++) {
        let x = sp.getX(i) + s.dt * 4.5;
        let y = sp.getY(i) - s.dt * 1.4;
        if (x > 60) x -= 120;
        if (y < 0) y += 60;
        sp.setXY(i, x, y);
      }
      sp.needsUpdate = true;
      const bp = birdGeo.attributes.position as BufferAttribute;
      birdData.forEach((b, i) => {
        const a = b.ph + time * b.sp;
        tmp.set(Math.cos(a) * b.r, b.h + Math.sin(time * 0.3 + i) * 2, -8 + Math.sin(a) * b.r);
        const dir = new Vector3(-Math.sin(a), 0, Math.cos(a));
        const side = new Vector3(dir.z, 0, -dir.x).multiplyScalar(0.7);
        const wing = Math.sin(time * b.flap + i) * 0.35;
        const k = i * 4;
        bp.setXYZ(k, tmp.x + side.x, tmp.y + wing, tmp.z + side.z);
        bp.setXYZ(k + 1, tmp.x, tmp.y, tmp.z);
        bp.setXYZ(k + 2, tmp.x, tmp.y, tmp.z);
        bp.setXYZ(k + 3, tmp.x - side.x, tmp.y + wing, tmp.z - side.z);
      });
      bp.needsUpdate = true;
    },
    dispose() {
      [geo, tubeGeo, glowGeo, glowPlane, beamGeo, mistGeo, snowGeo, birdGeo, skyGeo, poleGeo, flagGeo, pineGeo, trunkGeo, rockGeo, waterGeo].forEach((g) => g.dispose());
      [groundMat, tubeMat, glowMat, skyMat, snowMat, birdMat, flagMat, pineMat, trunkMat, rockMat, waterMat, ...rangeMats].forEach((m) => m.dispose());
      ranges.children.forEach((c) => (c as Mesh).geometry.dispose());
      cloudGeo.dispose();
      cloudTex.dispose();
      soft.dispose();
      scene.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof MeshBasicMaterial) o.material.dispose();
      });
    },
  };
}
