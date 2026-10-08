import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * Services: a modular landscape. An isometric field of clay tiles breathes in
 * slow waves; as you scroll, the camera glides across it and the field
 * re-forms (a ripple from the centre, then terraces, then a skyline), with a
 * scatter of GWD-red modules among the white. Pale studio fog.
 */
export function createIsogrid(ctx: WorldContext): WorldScene {
  const scene = new Scene();
  const bg = new Color('#cbccd0');
  scene.fog = new Fog(bg, 18, 46);
  scene.background = bg;
  const N = ctx.tier === 'high' ? 44 : ctx.tier === 'mid' ? 34 : 24;
  const size = 0.92;
  const geo = new RoundedBoxGeometry(size, 1, size, 2, 0.06);
  geo.translate(0, 0.5, 0);
  const white = new MeshStandardMaterial({ color: '#eeeef0', roughness: 0.6, metalness: 0 });
  const tiles = new InstancedMesh(geo, white, N * N);
  const reds = new Set<number>();
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const red = new Color('#e63946');
  const grey = new Color('#cfd0d4');
  const base = new Color('#f1f1f3');
  for (let i = 0; i < N * N; i++) {
    const r = rnd();
    const c = r < 0.035 ? red : r < 0.2 ? grey : base;
    if (c === red) reds.add(i);
    tiles.setColorAt(i, c);
  }
  scene.add(tiles);

  scene.add(new HemisphereLight('#ffffff', '#9a9ba3', 1.4));
  scene.add(new AmbientLight('#ffffff', 0.3));
  const sun = new DirectionalLight('#ffffff', 2.2);
  sun.position.set(-8, 14, 6);
  scene.add(sun);

  const camera = new PerspectiveCamera(30, 1, 0.1, 120);
  const dummy = new Object3D();
  const half = (N - 1) / 2;

  return {
    scene,
    camera,
    update(s: ViewState) {
      const t = ctx.reduced ? 0 : s.time;
      const p = s.progress;
      // Three formations, blended by scroll.
      const w1 = Math.max(0, 1 - Math.abs(p - 0.1) * 3);
      const w2 = Math.max(0, 1 - Math.abs(p - 0.5) * 3);
      const w3 = Math.max(0, 1 - Math.abs(p - 0.9) * 3);
      for (let x = 0; x < N; x++) {
        for (let z = 0; z < N; z++) {
          const i = x * N + z;
          const dx = x - half;
          const dz = z - half;
          const d = Math.sqrt(dx * dx + dz * dz);
          const ripple = 0.35 + 0.3 * Math.sin(d * 0.55 - t * 0.9);
          const terrace = 0.25 + Math.floor((Math.sin(dx * 0.22) + Math.cos(dz * 0.18) + 2) * 1.2) * 0.35;
          const sky = d < 9 ? 0.3 + Math.max(0, Math.sin(i * 12.9898) * 43758.5453 % 1) * (2.8 - d * 0.25) : 0.25;
          const breath = 0.06 * Math.sin(t * 0.6 + x * 0.4 + z * 0.3);
          const h = Math.max(0.12, (ripple * w1 + terrace * w2 + Math.abs(sky) * w3) / Math.max(0.0001, w1 + w2 + w3) + breath + (reds.has(i) ? 0.35 : 0));
          dummy.position.set(dx, 0, dz);
          dummy.scale.set(1, h, 1);
          dummy.updateMatrix();
          tiles.setMatrixAt(i, dummy.matrix);
        }
      }
      tiles.instanceMatrix.needsUpdate = true;
      // The camera glides across the field, leaning with the pointer.
      const panX = -6 + p * 12;
      camera.position.set(panX + 16 + s.pointer.x * 1.2, 15 + s.pointer.y * 0.8, 16 - p * 6);
      camera.lookAt(panX, 0, -p * 6);
    },
    dispose() {
      geo.dispose();
      white.dispose();
      tiles.dispose();
    },
  };
}
