import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/** Canvas pixels per world unit (higher on capable devices, for crisp lines). */
export let PX = 24;
export const setTextureDensity = (px: number) => (PX = px);

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * PX);
  c.height = Math.round(h * PX);
  return [c, c.getContext('2d')!] as const;
}
export function toTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
const LINE = 'rgba(248,247,242,0.95)';
const line = (g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
};
/** A soft pool of floodlight baked over a surface: bright in the middle, falling off to the edges. */
function floodPool(g: CanvasRenderingContext2D, w: number, h: number, strength = 0.22) {
  const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * 0.62);
  r.addColorStop(0, `rgba(255,252,240,${strength})`);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
}
/** Fine grain so large surfaces do not read as flat colour. */
function grain(g: CanvasRenderingContext2D, w: number, h: number, amount = 0.05, n = 4000) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount * 1.4})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

/* ── Football pitch 52 × 34, mown in stripes, floodlit ── */
export function pitchTexture() {
  const [c, g] = canvas(56, 38);
  const W = c.width;
  const H = c.height;
  g.fillStyle = '#163d22';
  g.fillRect(0, 0, W, H);
  const m = 2 * PX;
  for (let i = 0; i < 18; i++) {
    g.fillStyle = i % 2 ? '#1d5a2d' : '#226632';
    g.fillRect(m + (i * (W - 2 * m)) / 18, m, (W - 2 * m) / 18 + 1, H - 2 * m);
  }
  grain(g, W, H, 0.035, 9000);
  floodPool(g, W, H, 0.2);
  g.strokeStyle = LINE;
  g.lineWidth = Math.max(3, PX * 0.22);
  g.strokeRect(m, m, W - 2 * m, H - 2 * m);
  line(g, W / 2, m, W / 2, H - m);
  g.beginPath();
  g.arc(W / 2, H / 2, 4.6 * PX, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = LINE;
  g.beginPath();
  g.arc(W / 2, H / 2, PX * 0.3, 0, Math.PI * 2);
  g.fill();
  for (const side of [0, 1]) {
    const x = side ? W - m - 8.3 * PX : m;
    g.strokeRect(x, H / 2 - 10 * PX, 8.3 * PX, 20 * PX);
    g.strokeRect(side ? W - m - 2.8 * PX : m, H / 2 - 4.6 * PX, 2.8 * PX, 9.2 * PX);
    const spot = side ? W - m - 5.6 * PX : m + 5.6 * PX;
    g.beginPath();
    g.arc(spot, H / 2, PX * 0.25, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(spot, H / 2, 4.6 * PX, side ? Math.PI - 0.93 : -0.93, side ? Math.PI + 0.93 : 0.93);
    g.stroke();
  }
  return toTexture(c);
}

/* ── Athletics track around the pitch ── */
export const HALF = 26;
export const R_IN = 18.5;
export const LANES = 8;
export const LANE_W = 1.22;
function stadiumPath(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.beginPath();
  g.moveTo(cx - HALF * PX, cy - r * PX);
  g.lineTo(cx + HALF * PX, cy - r * PX);
  g.arc(cx + HALF * PX, cy, r * PX, -Math.PI / 2, Math.PI / 2);
  g.lineTo(cx - HALF * PX, cy + r * PX);
  g.arc(cx - HALF * PX, cy, r * PX, Math.PI / 2, (Math.PI * 3) / 2);
  g.closePath();
}
export function trackTexture() {
  const outer = R_IN + LANES * LANE_W;
  const [c, g] = canvas(2 * (HALF + outer) + 2, 2 * outer + 2);
  const cx = c.width / 2;
  const cy = c.height / 2;
  stadiumPath(g, cx, cy, outer);
  g.fillStyle = '#7a1f26';
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  stadiumPath(g, cx, cy, R_IN);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(250,245,240,0.6)';
  g.lineWidth = 2.5;
  for (let k = 0; k <= LANES; k++) {
    stadiumPath(g, cx, cy, R_IN + k * LANE_W);
    g.stroke();
  }
  return { tex: toTexture(c), w: c.width / PX, h: c.height / PX };
}
export function lanePoint(s: number, r: number, out: { set(x: number, y: number, z: number): unknown }) {
  const L = 4 * HALF + 2 * Math.PI * r;
  s = ((s % L) + L) % L;
  const straight = 2 * HALF;
  const bend = Math.PI * r;
  if (s < straight) return out.set(-HALF + s, 0, -r);
  s -= straight;
  if (s < bend) {
    const a = -Math.PI / 2 + s / r;
    return out.set(HALF + r * Math.cos(a), 0, r * Math.sin(a));
  }
  s -= bend;
  if (s < straight) return out.set(HALF - s, 0, r);
  s -= straight;
  const a = Math.PI / 2 + s / r;
  return out.set(-HALF + r * Math.cos(a), 0, r * Math.sin(a));
}

/* ── Cricket ground 80 × 72 ── */
export function cricketTexture() {
  const [c, g] = canvas(80, 72);
  const cx = c.width / 2;
  const cy = c.height / 2;
  const rx = 38 * PX;
  const ry = 34 * PX;
  for (let k = 14; k >= 1; k--) {
    g.beginPath();
    g.ellipse(cx, cy, (rx * k) / 14, (ry * k) / 14, 0, 0, Math.PI * 2);
    g.fillStyle = k % 2 ? '#1b4a28' : '#215a30';
    g.fill();
  }
  grain(g, c.width, c.height, 0.03, 9000);
  floodPool(g, c.width, c.height, 0.2);
  g.strokeStyle = 'rgba(245,245,240,0.85)';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(cx, cy, rx - 30, ry - 30, 0, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([18, 16]);
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(cx, cy, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#a58a5c';
  g.fillRect(cx - 1.6 * PX, cy - 10.5 * PX, 3.2 * PX, 21 * PX);
  g.strokeStyle = LINE;
  g.lineWidth = 3;
  for (const z of [-9.2, 9.2]) line(g, cx - 1.6 * PX, cy + z * PX, cx + 1.6 * PX, cy + z * PX);
  return toTexture(c);
}

/* ── Hockey: blue turf 55 × 35 ── */
export function hockeyTexture() {
  const W = 55;
  const H = 35;
  const [c, g] = canvas(W + 4, H + 4);
  g.fillStyle = '#123a26';
  g.fillRect(0, 0, c.width, c.height);
  const ox = 2 * PX;
  const oy = 2 * PX;
  for (let i = 0; i < 12; i++) {
    g.fillStyle = i % 2 ? '#1a4f86' : '#1d5895';
    g.fillRect(ox + (i * W * PX) / 12, oy, (W * PX) / 12 + 1, H * PX);
  }
  floodPool(g, c.width, c.height, 0.18);
  g.strokeStyle = LINE;
  g.lineWidth = 4;
  g.strokeRect(ox, oy, W * PX, H * PX);
  for (const f of [0.25, 0.5, 0.75]) line(g, ox + f * W * PX, oy, ox + f * W * PX, oy + H * PX);
  for (const side of [0, 1]) {
    const gx = side ? ox + W * PX : ox;
    const dir = side ? -1 : 1;
    g.beginPath();
    g.arc(gx, oy + (H * PX) / 2, 8.8 * PX, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : (Math.PI * 3) / 2);
    g.stroke();
    g.setLineDash([14, 12]);
    g.beginPath();
    g.arc(gx, oy + (H * PX) / 2, 11.8 * PX, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : (Math.PI * 3) / 2);
    g.stroke();
    g.setLineDash([]);
  }
  return toTexture(c);
}

/* ── Basketball 28 × 15 at 1.6× ── */
export const BK = 1.6;
export function courtTexture() {
  const [c, g] = canvas(28 * BK + 4, 15 * BK + 4);
  g.fillStyle = '#121212';
  g.fillRect(0, 0, c.width, c.height);
  const ox = 2 * PX;
  const oy = 2 * PX;
  const u = BK * PX;
  for (let i = 0; i < 70; i++) {
    g.fillStyle = ['#a8693a', '#b47442', '#9f6235'][i % 3]!;
    g.fillRect(ox, oy + (i * 15 * u) / 70, 28 * u, (15 * u) / 70 + 1);
  }
  floodPool(g, c.width, c.height, 0.25);
  g.strokeStyle = LINE;
  g.lineWidth = 4;
  g.strokeRect(ox, oy, 28 * u, 15 * u);
  line(g, ox + 14 * u, oy, ox + 14 * u, oy + 15 * u);
  g.beginPath();
  g.arc(ox + 14 * u, oy + 7.5 * u, 1.8 * u, 0, Math.PI * 2);
  g.stroke();
  for (const side of [0, 1]) {
    const bx = side ? ox + 28 * u : ox;
    const dir = side ? -1 : 1;
    g.fillStyle = 'rgba(190,30,40,0.8)';
    g.fillRect(side ? bx - 5.8 * u : bx, oy + 5.05 * u, 5.8 * u, 4.9 * u);
    g.strokeRect(side ? bx - 5.8 * u : bx, oy + 5.05 * u, 5.8 * u, 4.9 * u);
    g.beginPath();
    g.arc(bx + dir * 5.8 * u, oy + 7.5 * u, 1.8 * u, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    const hx = bx + dir * 1.575 * u;
    g.arc(hx, oy + 7.5 * u, 6.75 * u, side ? Math.PI / 2 + 0.2 : -Math.PI / 2 + 0.2, side ? (Math.PI * 3) / 2 - 0.2 : Math.PI / 2 - 0.2, side === 1);
    g.stroke();
  }
  return toTexture(c);
}

function courtLines(w: number, h: number, surround: string, surface: string, draw: (g: CanvasRenderingContext2D, x: (v: number) => number, y: (v: number) => number) => void) {
  const pad = 3;
  const [c, g] = canvas(w + pad * 2, h + pad * 2);
  g.fillStyle = surround;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = surface;
  g.fillRect(pad * PX, pad * PX, w * PX, h * PX);
  floodPool(g, c.width, c.height, 0.2);
  g.strokeStyle = LINE;
  g.lineWidth = 3.5;
  draw(
    g,
    (v) => (pad + v) * PX,
    (v) => (pad + v) * PX,
  );
  return { tex: toTexture(c), w: w + pad * 2, h: h + pad * 2 };
}
export const BD = 2;
export function badmintonTexture() {
  const W = 13.4 * BD;
  const H = 6.1 * BD;
  return courtLines(W, H, '#1a1a1e', '#1f6b45', (g, x, y) => {
    g.strokeRect(x(0), y(0), W * PX, H * PX);
    line(g, x(0), y(0.46 * BD), x(W), y(0.46 * BD));
    line(g, x(0), y(H - 0.46 * BD), x(W), y(H - 0.46 * BD));
    for (const s of [W / 2 - 1.98 * BD, W / 2 + 1.98 * BD, 0.76 * BD, W - 0.76 * BD]) line(g, x(s), y(0), x(s), y(H));
    line(g, x(0), y(H / 2), x(W / 2 - 1.98 * BD), y(H / 2));
    line(g, x(W / 2 + 1.98 * BD), y(H / 2), x(W), y(H / 2));
  });
}
export const TN = 1.6;
export function tennisTexture() {
  const W = 23.77 * TN;
  const H = 10.97 * TN;
  return courtLines(W, H, '#2a6a4e', '#2f62a3', (g, x, y) => {
    g.strokeRect(x(0), y(0), W * PX, H * PX);
    const alley = 1.37 * TN;
    line(g, x(0), y(alley), x(W), y(alley));
    line(g, x(0), y(H - alley), x(W), y(H - alley));
    const svc = 5.49 * TN;
    line(g, x(W / 2 - svc), y(alley), x(W / 2 - svc), y(H - alley));
    line(g, x(W / 2 + svc), y(alley), x(W / 2 + svc), y(H - alley));
    line(g, x(W / 2 - svc), y(H / 2), x(W / 2 + svc), y(H / 2));
  });
}
export const VB = 2;
export function volleyballTexture() {
  const W = 18 * VB;
  const H = 9 * VB;
  return courtLines(W, H, '#244d78', '#c8652f', (g, x, y) => {
    g.strokeRect(x(0), y(0), W * PX, H * PX);
    line(g, x(W / 2), y(0), x(W / 2), y(H));
    line(g, x(W / 2 - 3 * VB), y(0), x(W / 2 - 3 * VB), y(H));
    line(g, x(W / 2 + 3 * VB), y(0), x(W / 2 + 3 * VB), y(H));
  });
}
export function ttFloorTexture() {
  const [c, g] = canvas(22, 14);
  g.fillStyle = '#6a1f26';
  g.fillRect(0, 0, c.width, c.height);
  floodPool(g, c.width, c.height, 0.22);
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 3;
  g.strokeRect(1.2 * PX, 1.2 * PX, 19.6 * PX, 11.6 * PX);
  return toTexture(c);
}
export function ttTableTexture() {
  const [c, g] = canvas(11, 6.1);
  g.fillStyle = '#1f4aa8';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = LINE;
  g.lineWidth = 4;
  g.strokeRect(3, 3, c.width - 6, c.height - 6);
  line(g, 0, c.height / 2, c.width, c.height / 2);
  return toTexture(c);
}

/* ── Stadium surfaces ── */

/** Seating rows: red seats with concrete risers, tiled around the bowl. */
export function seatsTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d')!;
  const rows = 16;
  for (let r = 0; r < rows; r++) {
    const y = (r * c.height) / rows;
    g.fillStyle = '#4a4b52';
    g.fillRect(0, y, c.width, c.height / rows);
    g.fillStyle = r % 5 === 0 ? '#2b2c31' : '#8e1c25';
    g.fillRect(0, y + 4, c.width, c.height / rows - 8);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = 0; x < c.width; x += 8) g.fillRect(x, y + 4, 1, c.height / rows - 8);
  }
  return toTexture(c, true);
}

/** The bowl's outer wall: glazed concourse bands, lit from inside. */
export function facadeTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b1c21';
  g.fillRect(0, 0, c.width, c.height);
  for (const [y, h, col] of [
    [18, 22, '#ffd8a0'],
    [62, 16, '#f2f4ff'],
    [96, 10, '#ff3b4a'],
  ] as const) {
    for (let x = 0; x < c.width; x += 16) {
      g.fillStyle = col;
      g.globalAlpha = 0.35 + Math.random() * 0.65;
      g.fillRect(x + 2, y, 12, h);
    }
  }
  g.globalAlpha = 1;
  return toTexture(c, true);
}

/** A bank of floodlamps: rows of hot white discs. */
export function lampTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#16171b';
  g.fillRect(0, 0, c.width, c.height);
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 8; k++) {
      const x = 16 + k * 31;
      const y = 16 + r * 31;
      const grd = g.createRadialGradient(x, y, 1, x, y, 13);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.55, '#fff3d6');
      grd.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = grd;
      g.fillRect(x - 14, y - 14, 28, 28);
    }
  return toTexture(c);
}

/** A soft round glow for lamp flares and sparks. */
export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.2, 'rgba(255,248,230,0.7)');
  grd.addColorStop(0.5, 'rgba(255,235,200,0.18)');
  grd.addColorStop(1, 'rgba(255,230,200,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The LED advertising strip around the pitch: scrolls by moving its texture offset. */
export function adsTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 96;
  const g = c.getContext('2d')!;
  const words = ['GWD SPORTS', 'ACADEMIES', 'TOURNAMENTS', 'SPORTS PASSPORT', 'LIVE SCORES', 'HYDERABAD'];
  let x = 0;
  let i = 0;
  while (x < c.width) {
    const red = i % 2 === 0;
    g.fillStyle = red ? '#d61f2c' : '#0c0c0f';
    const w = 340;
    g.fillRect(x, 0, w, c.height);
    g.fillStyle = red ? '#ffffff' : '#ff3b4a';
    g.font = '800 46px Arial, sans-serif';
    g.textBaseline = 'middle';
    g.fillText(words[i % words.length]!, x + 24, c.height / 2 + 2);
    x += w;
    i++;
  }
  return toTexture(c, true);
}

/** The scoreboard screen; redrawn when the score, clock or state changes. */
export function scoreboard() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const g = c.getContext('2d')!;
  const tex = toTexture(c);
  const draw = (home: number, away: number, minute: number, goal: boolean) => {
    g.fillStyle = goal ? '#c41422' : '#07070a';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = goal ? '#ffffff' : '#ff3b4a';
    g.lineWidth = 8;
    g.strokeRect(10, 10, c.width - 20, c.height - 20);
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    if (goal) {
      g.fillStyle = '#ffffff';
      g.font = '900 210px Arial, sans-serif';
      g.fillText('GOAL', c.width / 2, c.height / 2 + 8);
    } else {
      g.fillStyle = '#ffffff';
      g.font = '800 54px Arial, sans-serif';
      g.fillText('GWD SPORTS', c.width / 2, 70);
      g.font = '900 150px Arial, sans-serif';
      g.fillText(`${home}  –  ${away}`, c.width / 2, 210);
      g.font = '700 46px Arial, sans-serif';
      g.fillStyle = '#ff3b4a';
      g.fillText(`● LIVE  ${String(minute).padStart(2, '0')}'`, c.width / 2, 320);
    }
    tex.needsUpdate = true;
  };
  draw(2, 1, 67, false);
  return { tex, draw };
}

/** The roof canopy: brushed membrane panels with seams and a lit inner edge, repeated round the ring. */
export function roofTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, c.height);
  grd.addColorStop(0, '#9a9ca6');
  grd.addColorStop(0.18, '#6c6e78');
  grd.addColorStop(1, '#3c3e46');
  g.fillStyle = grd;
  g.fillRect(0, 0, c.width, c.height);
  // Panels: a slight tone shift each, with dark seams between.
  for (let x = 0; x < c.width; x += 32) {
    g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`;
    g.fillRect(x, 0, 32, c.height);
    g.fillStyle = 'rgba(10,10,14,0.55)';
    g.fillRect(x, 0, 2, c.height);
  }
  for (const y of [40, 84]) {
    g.fillStyle = 'rgba(10,10,14,0.4)';
    g.fillRect(0, y, c.width, 2);
  }
  // The inner edge catches the floodlights.
  g.fillStyle = 'rgba(255,250,235,0.55)';
  g.fillRect(0, 0, c.width, 5);
  grain(g, c.width, c.height, 0.04, 1600);
  return toTexture(c, true);
}

/** A running LED strip: red dashes that chase round the roof's outer edge. */
export function chaseTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#16060a';
  g.fillRect(0, 0, c.width, c.height);
  for (let x = 0; x < c.width; x += 64) {
    const grd = g.createLinearGradient(x, 0, x + 48, 0);
    grd.addColorStop(0, 'rgba(255,40,56,0)');
    grd.addColorStop(0.75, 'rgba(255,40,56,1)');
    grd.addColorStop(1, 'rgba(255,220,220,1)');
    g.fillStyle = grd;
    g.fillRect(x, 3, 48, 10);
  }
  return toTexture(c, true);
}

/** The back of each giant screen faces the city: the GWD Sports mark, lit. */
export function screenBackTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, c.width, c.height);
  grd.addColorStop(0, '#0d0d11');
  grd.addColorStop(1, '#1b0b0e');
  g.fillStyle = grd;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#d61f2c';
  g.lineWidth = 10;
  g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = '900 150px Arial, sans-serif';
  g.fillText('GWD', c.width / 2, c.height / 2 - 40);
  g.fillStyle = '#ff3b4a';
  g.font = '800 64px Arial, sans-serif';
  g.fillText('S P O R T S', c.width / 2, c.height / 2 + 90);
  return toTexture(c);
}

/** The back of a floodlight bank: a steel frame of struts and service ladders. */
export function lampBackTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#26282f';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#4a4d57';
  g.lineWidth = 5;
  g.strokeRect(4, 4, c.width - 8, c.height - 8);
  g.lineWidth = 3;
  for (let x = 0; x <= c.width; x += 32) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, c.height);
    g.stroke();
  }
  // Cross-bracing between the struts.
  g.strokeStyle = 'rgba(110,114,126,0.7)';
  g.lineWidth = 2;
  for (let x = 0; x < c.width; x += 32) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 32, c.height);
    g.moveTo(x + 32, 0);
    g.lineTo(x, c.height);
    g.stroke();
  }
  g.fillStyle = 'rgba(255,214,150,0.85)';
  for (let x = 16; x < c.width; x += 64) g.fillRect(x - 3, c.height - 18, 6, 6);
  return toTexture(c);
}

/** City windows for the skyline around the complex. */
export function windowsTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0b0c10';
  g.fillRect(0, 0, c.width, c.height);
  for (let y = 4; y < c.height; y += 10)
    for (let x = 4; x < c.width; x += 9) {
      if (Math.random() < 0.38) {
        g.fillStyle = Math.random() < 0.8 ? `rgba(255,${200 + Math.floor(Math.random() * 40)},${130 + Math.floor(Math.random() * 60)},${0.5 + Math.random() * 0.5})` : 'rgba(170,200,255,0.8)';
        g.fillRect(x, y, 5, 6);
      }
    }
  return toTexture(c, true);
}

export type { Texture };
