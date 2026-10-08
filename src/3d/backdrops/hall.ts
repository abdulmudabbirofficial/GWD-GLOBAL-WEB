import {
  BoxGeometry,
  Color,
  Fog,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';
import { renderUrl } from '@/lib/media';

/**
 * Products: the hall. A long dark gallery with a mirror-black floor, ranks of
 * light columns on both sides, and the products hanging in the air as lit
 * frames. Scrolling walks you down the hall past each one; the frames turn
 * gently towards you as you pass.
 */
const FRAMES = ['prod-sports', 'prod-nestbridge', 'prod-torqio', 'prod-dreamx', 'sports-academy', 'sports-tournament'];

export async function createHall(ctx: WorldContext): Promise<WorldScene> {
  const scene = new Scene();
  const dark = new Color('#08080a');
  scene.fog = new Fog(dark, 10, 42);
  const LEN = 70;

  // The floor: a real mirror on capable devices, polished black otherwise.
  let floor: Mesh;
  if (ctx.tier === 'high') {
    const r = new Reflector(new PlaneGeometry(14, LEN + 20), { textureWidth: 1024, textureHeight: 1024, color: new Color('#3a3a40') });
    floor = r;
  } else {
    floor = new Mesh(new PlaneGeometry(14, LEN + 20), new MeshStandardMaterial({ color: '#0e0e11', roughness: 0.25, metalness: 0.6, envMap: ctx.envMap }));
  }
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -LEN / 2 + 6;
  scene.add(floor);

  // Columns of light, receding.
  const colGeo = new BoxGeometry(0.08, 6, 0.08);
  const colMat = new MeshBasicMaterial({ color: new Color('#f3f3f1') });
  const cols = new InstancedMesh(colGeo, colMat, 2 * 28);
  const d = new Object3D();
  for (let i = 0; i < 28; i++) {
    for (const side of [-1, 1]) {
      d.position.set(side * 5.5, 3, 4 - i * 2.6);
      d.updateMatrix();
      cols.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), d.matrix);
      cols.setColorAt(i * 2 + (side > 0 ? 1 : 0), i % 6 === 2 ? new Color('#ff3b4a') : new Color('#d9dadf'));
    }
  }
  scene.add(cols);
  const ceiling = new Mesh(new PlaneGeometry(14, LEN + 20), new MeshBasicMaterial({ color: '#050506' }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.2, -LEN / 2 + 6);
  scene.add(ceiling);

  // The product frames.
  const loader = new TextureLoader();
  const textures: Texture[] = await Promise.all(FRAMES.map((n) => loader.loadAsync(renderUrl(n, true)).catch(() => loader.loadAsync(renderUrl(n)))));
  const frames = new Group();
  scene.add(frames);
  const frameList: Mesh[] = [];
  textures.forEach((tex, i) => {
    tex.colorSpace = SRGBColorSpace;
    const img = tex.image as { width: number; height: number };
    const aspect = img.width / img.height;
    const h = 3.2;
    // The dioramas are cut out (alpha), so they float in the hall like exhibits.
    const m = new Mesh(new PlaneGeometry(h * aspect, h), new MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, depthWrite: false }));
    m.position.set(i % 2 ? 3.4 : -3.4, 2.8, -6 - i * 12);
    m.rotation.y = i % 2 ? -0.35 : 0.35;
    frames.add(m);
    frameList.push(m);
  });

  const camera = new PerspectiveCamera(50, 1, 0.1, 120);

  return {
    scene,
    camera,
    update(s: ViewState) {
      const z = 6 - s.progress * (FRAMES.length * 12 + 2);
      camera.position.set(s.pointer.x * 0.6, 2.6 + s.pointer.y * 0.3, z);
      camera.lookAt(s.pointer.x * 0.3, 2.4, z - 10);
      frameList.forEach((m, i) => {
        const near = Math.max(0, 1 - Math.abs(m.position.z - (z - 6)) / 10);
        m.rotation.y = (i % 2 ? -0.35 : 0.35) * (1 - near * 0.8);
        // Exhibits fade before the camera reaches them, so none crowds the copy.
        const ahead = z - m.position.z;
        (m.material as MeshBasicMaterial).opacity = Math.min(1, Math.max(0, (ahead - 4) / 5));
        m.position.y = 2.8 + Math.sin((ctx.reduced ? 0 : s.time) * 0.5 + i) * 0.08;
      });
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      colGeo.dispose();
      colMat.dispose();
      floor.geometry.dispose();
      if ('dispose' in floor && typeof (floor as Reflector).dispose === 'function') (floor as Reflector).dispose();
      frameList.forEach((m) => m.geometry.dispose());
    },
  };
}
