import { Color, DataTexture, Fog, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace } from 'three';
import { loadTexture } from '@/3d/world/loadTexture';
import { readWorldPayload, type ViewState, type WorldContext, type WorldScene } from '@/3d/world/types';
import type { GalleryPhoto } from '@/types/content';

/** A texture-sized copy: the small variant when there is one, otherwise the image optimizer. */
const textureUrl = (p: GalleryPhoto) => p.smallUrl ?? `/_next/image?url=${encodeURIComponent(p.url)}&w=640&q=75`;

/** Photos fetched ahead of the camera, and how many download at once. */
const AHEAD = 16;
const PARALLEL = 3;

/**
 * GWD Community: a flight through the album. The community's own photos hang
 * in the air at different depths; scrolling flies you forward through them,
 * each one turning slightly to meet you, then drifting away into the haze.
 * The whole album is placed at once, but photos stream in just ahead of the
 * camera (decoded off the main thread), so the page never waits for all of
 * them and each one is ready before it surfaces from the haze.
 */
export async function createPhotos(ctx: WorldContext): Promise<WorldScene> {
  const scene = new Scene();
  const haze = new Color('#d6d3cf');
  scene.fog = new Fog(haze, 9, 36);
  scene.background = haze;
  const photos = readWorldPayload<{ album: GalleryPhoto[] }>()?.album ?? [];
  // The whole album (photos stream in as the camera nears them); a shorter flight on low-end devices.
  const take = photos.slice(0, ctx.tier === 'low' ? 30 : photos.length);
  const group = new Group();
  scene.add(group);
  let seed = 19;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  type Plane = { m: Mesh; mat: MeshBasicMaterial; base: { x: number; y: number }; phase: number; state: 'idle' | 'loading' | 'ready' | 'failed'; fade: number };
  const planes: Plane[] = [];
  // Close enough together that a handful of photos are always in the air, never a crowd.
  const DEPTH = 1.9;
  // Every material starts with a 1×1 stand-in map, so the shader compiled up front already samples a
  // texture and a photo arriving mid-scroll is a plain map swap, never a recompile.
  const blank = new DataTexture(new Uint8Array([214, 211, 207, 255]), 1, 1);
  blank.needsUpdate = true;
  take.forEach((ph, i) => {
    const aspect = ph.width / ph.height;
    const h = 1.2 + rnd() * 0.8;
    const mat = new MeshBasicMaterial({ map: blank, toneMapped: false, transparent: true, opacity: 0 });
    const m = new Mesh(new PlaneGeometry(h * aspect, h), mat);
    // Hidden until its photo arrives; the first stays in the scene so the shared shader compiles up front.
    m.visible = i === 0;
    const side = i % 2 ? 1 : -1;
    const x = side * (2.6 + rnd() * 3.2);
    const y = -2 + rnd() * 4;
    m.position.set(x, y, -i * DEPTH);
    m.rotation.y = -side * (0.25 + rnd() * 0.2);
    group.add(m);
    planes.push({ m, mat, base: { x, y }, phase: rnd() * 6, state: 'idle', fade: 0 });
  });

  let active = 0;
  let disposed = false;
  const queue: number[] = [];
  const pump = () => {
    while (active < PARALLEL && queue.length) {
      const i = queue.shift()!;
      const pl = planes[i]!;
      active++;
      loadTexture(textureUrl(take[i]!))
        .then((tex) => {
          if (disposed) return tex.dispose();
          tex.colorSpace = SRGBColorSpace;
          pl.mat.map = tex;
          pl.m.visible = true;
          pl.state = 'ready';
        })
        .catch(() => (pl.state = 'failed'))
        .finally(() => {
          active--;
          pump();
        });
    }
  };
  const want = (from: number) => {
    for (let i = Math.max(0, from); i < Math.min(planes.length, from + AHEAD); i++) {
      const pl = planes[i]!;
      if (pl.state !== 'idle') continue;
      pl.state = 'loading';
      queue.push(i);
    }
    pump();
  };
  want(0);

  const camera = new PerspectiveCamera(45, 1, 0.1, 80);
  const far = planes.length * DEPTH;

  return {
    scene,
    camera,
    update(s: ViewState) {
      const t = ctx.reduced ? 0 : s.time;
      const z = 6 - s.progress * far;
      camera.position.set(s.pointer.x * 0.8, s.pointer.y * 0.5, z);
      camera.lookAt(s.pointer.x * 0.4, 0, z - 10);
      // Keep the next few photos on their way.
      want(Math.floor((6 - z) / DEPTH));
      const dt = Math.min(0.1, s.dt || 0.016);
      for (const pl of planes) {
        if (pl.state !== 'ready') continue;
        // A photo that arrives late eases in rather than popping.
        pl.fade = ctx.reduced ? 1 : Math.min(1, pl.fade + dt * 2.5);
        // Distance ahead of the camera: photos surface out of the haze, then
        // fade before they reach the lens so none ever fills the screen.
        const ahead = z - pl.m.position.z;
        const near = Math.min(1, Math.max(0, (ahead - 2.5) / 3));
        const away = Math.min(1, Math.max(0, 1 - (ahead - 18) / 8));
        pl.mat.opacity = 0.55 * near * away * pl.fade;
        pl.m.position.x = pl.base.x + Math.sin(t * 0.3 + pl.phase) * 0.15;
        pl.m.position.y = pl.base.y + Math.cos(t * 0.25 + pl.phase) * 0.12;
      }
    },
    dispose() {
      disposed = true;
      blank.dispose();
      planes.forEach((pl) => {
        if (pl.mat.map !== blank) pl.mat.map?.dispose();
        pl.m.geometry.dispose();
        pl.mat.dispose();
      });
    },
  };
}
