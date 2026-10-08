// Path-traces one scene into the canvas. The driver (render.mjs) reads the
// pixels once `window.__done` is set.
//   ?scene=<name>&w=1600&h=2000&samples=400
import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { SCENES } from './scenes.js';

const q = new URLSearchParams(location.search);
const name = q.get('scene');
const W = Number(q.get('w') || 1600);
const H = Number(q.get('h') || 2000);
const SAMPLES = Number(q.get('samples') || 400);

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = Number(q.get('exposure') || 1);
document.body.appendChild(renderer.domElement);

const build = SCENES[name];
if (!build) {
  window.__error = `unknown scene ${name}`;
  throw new Error(window.__error);
}
const { scene, camera, exposure } = await build({ aspect: W / H });
if (exposure) renderer.toneMappingExposure = exposure;
camera.aspect = W / H;
camera.updateProjectionMatrix();

const tracer = new WebGLPathTracer(renderer);
tracer.renderDelay = 0;
tracer.fadeDuration = 0;
tracer.minSamples = 0;
tracer.dynamicLowRes = false;
tracer.rasterizeScene = false;
tracer.bounces = 7;
tracer.transmissiveBounces = 8;
tracer.filterGlossyFactor = 0.35;
tracer.multipleImportanceSampling = true;
tracer.tiles.set(3, 3);
tracer.setScene(scene, camera);

const started = performance.now();
function frame() {
  tracer.renderSample();
  window.__samples = tracer.samples;
  if (tracer.samples >= SAMPLES) {
    window.__ms = performance.now() - started;
    window.__done = true;
    return;
  }
  requestAnimationFrame(frame);
}
frame();
