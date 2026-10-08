import { BackSide, BoxGeometry, Color, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three';

/**
 * A dark photographic studio for reflections, the real-time twin of the
 * render kit's softbox HDRI (scripts/render/kit.js): a near-black room with a
 * large key softbox high front-left, two tall strip lights at the sides, a
 * wide card above the camera and a rim behind. Chrome picks these up as long
 * clean highlights; nothing in it is visible directly.
 */
export function studioEnvironmentScene() {
  const scene = new Scene();
  const room = new Mesh(new BoxGeometry(20, 12, 20), new MeshBasicMaterial({ color: new Color('#060607'), side: BackSide }));
  room.position.y = 3;
  scene.add(room);

  const box = (w: number, h: number, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(intensity, intensity, intensity) }));
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  box(6, 4, 9, [-6, 6, 5]); // key
  box(1.1, 8, 6, [8, 1.5, 3]); // strip right
  box(1.1, 8, 4.5, [-8, 1.5, 2]); // strip left
  box(10, 1.6, 3, [0, 5, 9]); // card above the camera
  box(9, 1.2, 4, [0, 7, -8]); // rim
  // A graded wall behind the camera: front-facing chrome reads bright at the top, falling to dark.
  box(16, 1.6, 3.2, [0, 3.4, 9.5], [0, 1, 0]);
  box(16, 1.6, 1.1, [0, 1.8, 9.5], [0, 0.5, 0]);
  box(16, 1.6, 0.3, [0, 0.2, 9.5], [0, 0, 0]);
  box(16, 1.6, 0.06, [0, -1.4, 9.5], [0, -0.5, 0]);
  box(30, 30, 0.012, [0, -5.9, 0], [0, 10, 0]); // a faint floor bounce
  return scene;
}
