import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TorusGeometry,
  type BufferGeometry,
} from 'three';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * A service page: the blueprint. An endless drafting grid recedes into the
 * dark while wireframe primitives (the parts of a build, in white with a few
 * in GWD red) drift and turn above it; scrolling lowers the camera through
 * them like moving down a technical drawing.
 */
const gridFrag = /* glsl */ `
varying vec3 vW; uniform float uTime;
float line(float v, float w){ float g = abs(fract(v - 0.5) - 0.5) / fwidth(v); return 1.0 - min(g / w, 1.0); }
void main(){
  float minor = max(line(vW.x, 1.0), line(vW.z, 1.0)) * 0.18;
  float major = max(line(vW.x / 5.0, 1.2), line(vW.z / 5.0, 1.2)) * 0.45;
  float red = line(vW.x / 20.0 + 0.25, 1.4) * 0.9;
  float d = length(vW.xz) ;
  float fade = smoothstep(60.0, 8.0, d);
  vec3 col = vec3(0.72, 0.73, 0.78) * max(minor, major) + vec3(0.9, 0.22, 0.27) * red;
  gl_FragColor = vec4(col, max(max(minor, major), red) * fade);
}`;
const gridVert = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

export function createBlueprint(ctx: WorldContext): WorldScene {
  const scene = new Scene();
  const grid = new Mesh(
    new PlaneGeometry(200, 200),
    new ShaderMaterial({ vertexShader: gridVert, fragmentShader: gridFrag, uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, extensions: {} as never }),
  );
  grid.rotation.x = -Math.PI / 2;
  scene.add(grid);

  const shapes: BufferGeometry[] = [
    new BoxGeometry(1.4, 1.4, 1.4),
    new IcosahedronGeometry(0.9, 1),
    new TorusGeometry(0.8, 0.22, 10, 32),
    new CylinderGeometry(0.6, 0.6, 1.4, 16),
    new ConeGeometry(0.7, 1.4, 12),
    new OctahedronGeometry(0.9),
  ];
  const white = new LineBasicMaterial({ color: new Color('#d9dade'), transparent: true, opacity: 0.55 });
  const red = new LineBasicMaterial({ color: new Color('#ff4b59'), transparent: true, opacity: 0.9, blending: AdditiveBlending });
  const group = new Group();
  scene.add(group);
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const items: { o: LineSegments; spin: number; bob: number; y: number }[] = [];
  const count = ctx.tier === 'low' ? 18 : 34;
  for (let i = 0; i < count; i++) {
    const g = new EdgesGeometry(shapes[i % shapes.length]!);
    const o = new LineSegments(g, i % 7 === 0 ? red : white);
    const y = 0.8 + rnd() * 14;
    o.position.set(-12 + rnd() * 24, y, -16 + rnd() * 20);
    o.scale.setScalar(0.6 + rnd() * 1.1);
    o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    group.add(o);
    items.push({ o, spin: 0.1 + rnd() * 0.3, bob: rnd() * 6, y });
  }

  const camera = new PerspectiveCamera(42, 1, 0.1, 150);

  return {
    scene,
    camera,
    update(s: ViewState) {
      const t = ctx.reduced ? 0 : s.time;
      for (const it of items) {
        it.o.rotation.y += 0.002 * it.spin * 60 * Math.min(s.dt, 0.05);
        it.o.rotation.x += 0.001 * it.spin * 60 * Math.min(s.dt, 0.05);
        it.o.position.y = it.y + Math.sin(t * 0.4 + it.bob) * 0.25;
      }
      const y = 12 - s.progress * 10;
      camera.position.set(s.pointer.x * 1.5, y + 2 + s.pointer.y, 14);
      camera.lookAt(0, y - 1.5, -6);
    },
    dispose() {
      shapes.forEach((g) => g.dispose());
      items.forEach((it) => it.o.geometry.dispose());
      white.dispose();
      red.dispose();
      grid.geometry.dispose();
      (grid.material as ShaderMaterial).dispose();
    },
  };
}
