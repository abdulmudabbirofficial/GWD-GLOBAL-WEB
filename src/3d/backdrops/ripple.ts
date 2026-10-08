import { Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector4 } from 'three';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * Contact: still water. A dark surface that ripples where the pointer moves
 * and with every key typed into the form, catching a soft red light from
 * below the horizon. (Keystrokes arrive as a 'gwd:keystroke' window event.)
 */
const MAX = 16;
const frag = /* glsl */ `
uniform vec4 uDrops[${MAX}]; uniform float uTime; uniform vec2 uRes;
varying vec2 vUv;
float h(vec2 p){
  float s = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    vec4 d = uDrops[i];
    float age = uTime - d.z;
    if (age < 0.0 || age > 6.0) continue;
    float r = length(p - d.xy);
    float wave = sin(r * 38.0 - age * 9.0) * exp(-age * 0.8) * exp(-abs(r - age * 0.24) * 12.0);
    s += wave * d.w;
  }
  s += sin(p.x * 6.0 + uTime * 0.4) * 0.006 + sin(p.y * 9.0 - uTime * 0.3) * 0.004;
  return s;
}
void main(){
  vec2 p = vec2(vUv.x * uRes.x / uRes.y, vUv.y);
  float e = 0.002;
  float c = h(p);
  vec3 n = normalize(vec3(h(p + vec2(e, 0.0)) - c, h(p + vec2(0.0, e)) - c, e * 0.6));
  vec3 l = normalize(vec3(0.0, 0.6, 0.8));
  float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
  float glow = smoothstep(1.2, 0.0, vUv.y) * 0.25;
  vec3 base = mix(vec3(0.035, 0.035, 0.042), vec3(0.09, 0.02, 0.03), glow);
  vec3 col = base + vec3(0.9, 0.22, 0.27) * spec * 0.8 + vec3(1.0) * pow(max(n.y, 0.0), 2.0) * 0.08;
  gl_FragColor = vec4(col, 1.0);
}`;

export function createRipple(ctx: WorldContext): WorldScene {
  const scene = new Scene();
  const drops = Array.from({ length: MAX }, () => new Vector4(0, 0, -100, 0));
  const uniforms = { uDrops: { value: drops }, uTime: { value: 0 }, uRes: { value: new Vector2(1, 1) } };
  const quad = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: frag, depthTest: false, depthWrite: false }));
  quad.frustumCulled = false;
  scene.add(quad);
  const camera = new PerspectiveCamera();
  let next = 0;
  let clock = 0;
  const drop = (x: number, y: number, strength: number) => {
    drops[next] = new Vector4(x, y, clock, strength);
    next = (next + 1) % MAX;
  };
  let lastDrop = 0;
  let lastPointer = { x: 0, y: 0 };
  const onKey = (e: Event) => {
    const aspect = uniforms.uRes.value.x / uniforms.uRes.value.y;
    const at = (e as CustomEvent<{ x: number; y: number } | undefined>).detail;
    if (at) drop(at.x * aspect, at.y, 0.03);
    else drop(aspect * (0.3 + Math.random() * 0.4), 0.3 + Math.random() * 0.4, 0.025);
  };
  window.addEventListener('gwd:keystroke', onKey);
  if (!ctx.reduced) drop(0.9, 0.5, 0.03);

  return {
    scene,
    camera,
    resize(w, h) {
      uniforms.uRes.value.set(w, h);
    },
    update(s: ViewState) {
      clock = s.time;
      uniforms.uTime.value = s.time;
      const aspect = uniforms.uRes.value.x / uniforms.uRes.value.y;
      const px = ((s.pointer.x + 1) / 2) * aspect;
      const py = (s.pointer.y + 1) / 2;
      const moved = Math.hypot(px - lastPointer.x, py - lastPointer.y);
      if (!ctx.reduced && moved > 0.03 && s.time - lastDrop > 0.12) {
        drop(px, py, 0.012);
        lastDrop = s.time;
        lastPointer = { x: px, y: py };
      }
      if (!ctx.reduced && s.time - lastDrop > 3.5) {
        drop(aspect * (0.2 + Math.random() * 0.6), 0.2 + Math.random() * 0.6, 0.02);
        lastDrop = s.time;
      }
    },
    dispose() {
      window.removeEventListener('gwd:keystroke', onKey);
      quad.geometry.dispose();
      (quad.material as ShaderMaterial).dispose();
    },
  };
}
