import {
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RectAreaLight,
  Scene,
  Shape,
  SRGBColorSpace,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { MARK } from '@/components/brand/mark';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * The GWD Sports Passport as an object: a lacquered card in the four earned
 * editions (Bronze, Silver, Gold, Signature). It flips to the next edition
 * while its face is turned away, so the change is never seen happening.
 *  mode 'auto'   : turns on its own (the page hero)
 *  mode 'scroll' : one edition per quarter of the chapter's scroll
 * The card is an illustration: the name, numbers and ID on it are samples.
 */
export interface PassportScene extends WorldScene {
  edition: number;
}

const EDITIONS = [
  { name: 'Bronze', from: '#3b2416', to: '#c2844f', ink: '#fff4ea', foil: '#e0a26b' },
  { name: 'Silver', from: '#4b4f56', to: '#e4e7ec', ink: '#101114', foil: '#f4f6fa' },
  { name: 'Gold', from: '#5c3f0c', to: '#f0c75e', ink: '#1a1203', foil: '#ffe08a' },
  { name: 'Signature', from: '#0b0b0d', to: '#7d0f1c', ink: '#ffffff', foil: '#ff4b59' },
] as const;

const W = 768;
const H = 1024;

function path2d(d: string) {
  return new Path2D(d);
}

/** next/font hashes family names; read the real ones from the page's variables. */
const families = () => {
  const css = getComputedStyle(document.documentElement);
  return {
    sans: `${css.getPropertyValue('--font-geist').trim() || 'Helvetica Neue'}, Arial, sans-serif`,
    mono: `${css.getPropertyValue('--font-geist-mono').trim() || 'ui-monospace'}, monospace`,
  };
};

function drawFace(ed: (typeof EDITIONS)[number]) {
  const { sans, mono } = families();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = 64;
  g.beginPath();
  g.roundRect(0, 0, W, H, r);
  g.clip();
  const grad = g.createLinearGradient(0, H, W * 0.8, 0);
  grad.addColorStop(0, ed.from);
  grad.addColorStop(1, ed.to);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  // Fine diagonal foil lines.
  g.globalAlpha = 0.08;
  g.strokeStyle = ed.foil;
  g.lineWidth = 2;
  for (let i = -H; i < W; i += 18) {
    g.beginPath();
    g.moveTo(i, H);
    g.lineTo(i + H, 0);
    g.stroke();
  }
  g.globalAlpha = 1;
  // The crowned shield.
  g.save();
  g.strokeStyle = ed.ink;
  g.globalAlpha = 0.5;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(60, 120);
  g.lineTo(250, 120);
  g.lineTo(300, 70);
  g.lineTo(384, 110);
  g.lineTo(468, 70);
  g.lineTo(518, 120);
  g.lineTo(708, 120);
  g.lineTo(708, 760);
  g.quadraticCurveTo(708, 860, 384, 960);
  g.quadraticCurveTo(60, 860, 60, 760);
  g.closePath();
  g.stroke();
  g.restore();
  // Portrait silhouette.
  g.save();
  g.globalAlpha = 0.28;
  g.fillStyle = ed.ink;
  g.beginPath();
  g.arc(470, 330, 112, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(290, 640);
  g.bezierCurveTo(300, 470, 640, 470, 650, 640);
  g.closePath();
  g.fill();
  g.restore();
  // Rating and position.
  g.fillStyle = ed.ink;
  g.font = `300 150px ${sans}`;
  g.textBaseline = 'alphabetic';
  g.fillText('78', 110, 330);
  g.font = `500 44px ${mono}`;
  g.fillText('MID', 116, 395);
  // Name and stats.
  g.textAlign = 'center';
  g.font = `400 58px ${sans}`;
  g.fillText('YOUR NAME', W / 2, 720);
  g.globalAlpha = 0.4;
  g.fillRect(140, 750, W - 280, 2);
  g.globalAlpha = 1;
  const stats = [
    ['APP', '24'],
    ['GLS', '11'],
    ['INV', '17'],
    ['DIS', '88'],
  ];
  stats.forEach(([k, v], i) => {
    const x = 165 + i * 146;
    g.font = `300 64px ${sans}`;
    g.fillText(v!, x, 838);
    g.font = `500 26px ${mono}`;
    g.globalAlpha = 0.7;
    g.fillText(k!, x, 876);
    g.globalAlpha = 1;
  });
  g.font = `500 28px ${mono}`;
  g.globalAlpha = 0.85;
  g.fillText(`GWD-ZRKZB8  ·  ${ed.name.toUpperCase()}`, W / 2, 935);
  g.globalAlpha = 1;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function drawBack() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.beginPath();
  g.roundRect(0, 0, W, H, 64);
  g.clip();
  g.fillStyle = '#0c0c0e';
  g.fillRect(0, 0, W, H);
  g.translate(W / 2 - 290 * 0.62, H / 2 - 118 * 0.62);
  g.scale(0.62, 0.62);
  g.translate(-15, 0);
  g.fillStyle = '#e63946';
  g.fill(path2d(MARK.brackets.bottomLeft));
  g.fill(path2d(MARK.brackets.topRight));
  g.fillStyle = '#f3f3f1';
  g.fill(path2d(MARK.letters.g));
  g.fill(path2d(MARK.letters.w));
  g.fill(path2d(MARK.letters.d));
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export async function createPassportScene(ctx: WorldContext, { mode }: { mode: 'auto' | 'scroll' }): Promise<PassportScene> {
  RectAreaLightUniformsLib.init();
  await document.fonts?.ready;
  const scene = new Scene();
  scene.environment = ctx.envMap;

  const cw = 2.4;
  const ch = 3.2;
  const depth = 0.05;
  const shape = new Shape();
  const r = 0.2;
  shape.moveTo(-cw / 2 + r, -ch / 2);
  shape.lineTo(cw / 2 - r, -ch / 2);
  shape.quadraticCurveTo(cw / 2, -ch / 2, cw / 2, -ch / 2 + r);
  shape.lineTo(cw / 2, ch / 2 - r);
  shape.quadraticCurveTo(cw / 2, ch / 2, cw / 2 - r, ch / 2);
  shape.lineTo(-cw / 2 + r, ch / 2);
  shape.quadraticCurveTo(-cw / 2, ch / 2, -cw / 2, ch / 2 - r);
  shape.lineTo(-cw / 2, -ch / 2 + r);
  shape.quadraticCurveTo(-cw / 2, -ch / 2, -cw / 2 + r, -ch / 2);
  const body = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  body.translate(0, 0, -depth / 2);

  const edge = new MeshPhysicalMaterial({ color: new Color('#c9cbd0'), metalness: 1, roughness: 0.22 });
  const faces = EDITIONS.map(drawFace);
  const front = new MeshPhysicalMaterial({ map: faces[0], roughness: 0.3, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true });
  const back = new MeshPhysicalMaterial({ map: drawBack(), roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true });

  const card = new Group();
  card.add(new Mesh(body, edge));
  const frontMesh = new Mesh(new PlaneGeometry(cw, ch), front);
  frontMesh.position.z = depth / 2 + 0.013;
  card.add(frontMesh);
  const backMesh = new Mesh(new PlaneGeometry(cw, ch), back);
  backMesh.position.z = -depth / 2 - 0.013;
  backMesh.rotation.y = Math.PI;
  card.add(backMesh);
  scene.add(card);

  const sweep = new RectAreaLight('#ffffff', 14, 0.8, 7);
  sweep.position.set(-4, 0.5, 3.5);
  sweep.lookAt(0, 0, 0);
  scene.add(sweep);
  const kick = new RectAreaLight('#ff2a3c', 4, 2, 5);
  kick.position.set(4, -1, -2);
  kick.lookAt(0, 0, 0);
  scene.add(kick);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8.4);

  let shown = 0;
  const api: PassportScene = {
    scene,
    camera,
    edition: 0,
    resize(w, h) {
      const aspect = w / h;
      camera.position.z = aspect < 0.75 ? 8.4 * (0.75 / aspect) * 0.9 : 8.4;
    },
    update(s: ViewState) {
      let turns: number;
      let edition: number;
      if (mode === 'auto') {
        // Hold each edition for a few seconds, then flip to the next.
        const period = 4.5;
        const t = s.time / period;
        const k = Math.floor(t);
        const f = t - k;
        const flip = smooth(0.72, 1, f);
        turns = k + flip;
        edition = (k + (flip > 0.5 ? 1 : 0)) % EDITIONS.length;
      } else {
        const seg = Math.min(3.999, s.progress * 4.6 - 0.3);
        const k = Math.max(0, Math.floor(seg));
        const f = seg - k;
        const flip = k >= 3 ? 0 : smooth(0.6, 0.95, f);
        turns = k + flip;
        edition = Math.min(3, k + (flip > 0.5 ? 1 : 0));
      }
      if (edition !== shown) {
        shown = edition;
        front.map = faces[edition]!;
        front.needsUpdate = true;
        api.edition = edition;
      }
      const sway = ctx.reduced ? 0 : Math.sin(s.time * 0.6) * 0.12;
      card.rotation.y = turns * Math.PI * 2 + sway + s.pointer.x * 0.35 - 0.25;
      card.rotation.x = -s.pointer.y * 0.2 + (ctx.reduced ? 0 : Math.sin(s.time * 0.45) * 0.05);
      card.position.y = ctx.reduced ? 0 : Math.sin(s.time * 0.8) * 0.06;
      sweep.position.x = MathUtils.lerp(-5, 5, (Math.sin(s.time * 0.35) + 1) / 2);
      sweep.lookAt(0, 0, 0);
    },
    dispose() {
      body.dispose();
      faces.forEach((f) => f.dispose());
      back.map?.dispose();
      [edge, front, back].forEach((m) => m.dispose());
      frontMesh.geometry.dispose();
      backMesh.geometry.dispose();
    },
  };
  return api;
}
