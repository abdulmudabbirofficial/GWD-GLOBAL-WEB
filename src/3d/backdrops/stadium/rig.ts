import { CanvasTexture, CapsuleGeometry, Color, DynamicDrawUsage, Euler, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SphereGeometry, Vector3, type BufferGeometry, type Scene, type Texture } from 'three';

/*
 * Every player in the complex, as six instanced body parts (torso, head, two
 * legs, two arms): a handful of draw calls for every sport. Scene code only
 * moves players around; each figure turns to face where it runs, swings its
 * legs and arms at its speed, and can lift its arms or lean into a dive.
 */

interface Player {
  x: number;
  z: number;
  y: number;
  px: number;
  pz: number;
  yaw: number;
  phase: number;
  speed: number;
  scale: number;
  lean: number;
  side: number;
  arms: number;
  face: number | null;
}

const PARTS = ['torso', 'head', 'legL', 'legR', 'armL', 'armR'] as const;

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export class Squad {
  readonly meshes: InstancedMesh[] = [];
  private shadow: InstancedMesh;
  private players: Player[] = [];
  private geos: BufferGeometry[] = [];
  private mat: MeshStandardMaterial;
  private shadowMat: MeshBasicMaterial;
  private shadowTex: Texture;
  private m = new Matrix4();
  private root = new Matrix4();
  private local = new Matrix4();
  private q = new Quaternion();
  private e = new Euler();
  private v = new Vector3();
  private s = new Vector3();

  constructor(scene: Scene, max: number, envMap: Texture | null) {
    const torso = new CapsuleGeometry(0.21, 0.4, 4, 10).translate(0, 1.02, 0);
    const head = new SphereGeometry(0.16, 14, 10).translate(0, 1.47, 0);
    const leg = new CapsuleGeometry(0.085, 0.5, 3, 8).translate(0, -0.33, 0);
    const arm = new CapsuleGeometry(0.065, 0.42, 3, 8).translate(0, -0.27, 0);
    this.geos = [torso, head, leg, leg.clone(), arm, arm.clone()];
    this.mat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0, envMap, envMapIntensity: 0.35 });
    for (const [i, g] of this.geos.entries()) {
      const mesh = new InstancedMesh(g, this.mat, max);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.name = PARTS[i]!;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
    this.shadowTex = blobTexture();
    this.shadowMat = new MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false });
    const sg = new PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2);
    this.geos.push(sg);
    this.shadow = new InstancedMesh(sg, this.shadowMat, max);
    this.shadow.count = 0;
    this.shadow.frustumCulled = false;
    this.shadow.renderOrder = -1;
    scene.add(this.shadow);
  }

  /** Adds a player; returns its index. Shirt for torso and arms, shorts for legs. */
  add(x: number, z: number, shirt: string, shorts = '#1d1d21', scale = 1.5, skin = '#c99a7a') {
    const i = this.players.length;
    this.players.push({ x, z, y: 0, px: x, pz: z, yaw: 0, phase: Math.random() * 6, speed: 0, scale, lean: 0, side: 0, arms: 0, face: null });
    const c = new Color();
    const set = (part: number, col: string) => this.meshes[part]!.setColorAt(i, c.set(col));
    set(0, shirt);
    set(1, skin);
    set(2, shorts);
    set(3, shorts);
    set(4, shirt);
    set(5, shirt);
    for (const mesh of this.meshes) {
      mesh.count = this.players.length;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.shadow.count = this.players.length;
    return i;
  }

  get(i: number) {
    return this.players[i]!;
  }

  /** Moves a player. `face` fixes the facing (radians) instead of following the motion. */
  set(i: number, x: number, z: number, opts: { y?: number; arms?: number; lean?: number; side?: number; face?: number | null } = {}) {
    const p = this.players[i]!;
    p.x = x;
    p.z = z;
    p.y = opts.y ?? 0;
    p.arms = opts.arms ?? 0;
    p.lean = opts.lean ?? 0;
    p.side = opts.side ?? 0;
    p.face = opts.face ?? null;
  }

  /** Steers a player toward a point at up to `speed` units a second. */
  steer(i: number, tx: number, tz: number, speed: number, dt: number, opts?: Parameters<Squad['set']>[3]) {
    const p = this.players[i]!;
    const dx = tx - p.x;
    const dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    const step = Math.min(d, speed * dt);
    this.set(i, p.x + (d > 1e-4 ? (dx / d) * step : 0), p.z + (d > 1e-4 ? (dz / d) * step : 0), opts);
  }

  /** Builds this frame's matrices from positions; call once per frame. */
  commit(dt: number) {
    const d = Math.max(dt, 1e-3);
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i]!;
      const vx = (p.x - p.px) / d;
      const vz = (p.z - p.pz) / d;
      const sp = Math.hypot(vx, vz);
      p.speed += (Math.min(sp, 9) - p.speed) * Math.min(1, d * 8);
      if (p.face !== null) p.yaw = p.face;
      else if (sp > 0.3) {
        const target = Math.atan2(vx, vz);
        let dy = target - p.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        p.yaw += dy * Math.min(1, d * 10);
      }
      p.phase += p.speed * d * 1.9;
      p.px = p.x;
      p.pz = p.z;
      const run = Math.min(1, p.speed / 5);
      const swing = Math.sin(p.phase) * (0.15 + 0.75 * run);
      const bob = Math.abs(Math.cos(p.phase)) * 0.06 * run;

      this.e.set(p.lean + run * 0.18, p.yaw, p.side, 'YXZ');
      this.q.setFromEuler(this.e);
      this.root.compose(this.v.set(p.x, p.y + bob, p.z), this.q, this.s.setScalar(p.scale));

      const part = (k: number, px: number, py: number, rx: number, rz = 0) => {
        this.e.set(rx, 0, rz);
        this.q.setFromEuler(this.e);
        this.local.compose(this.v.set(px, py, 0), this.q, this.s.setScalar(1));
        this.m.multiplyMatrices(this.root, this.local);
        this.meshes[k]!.setMatrixAt(i, this.m);
      };
      part(0, 0, 0, 0);
      part(1, 0, 0, 0);
      part(2, -0.11, 0.76, swing);
      part(3, 0.11, 0.76, -swing);
      // Arms swing opposite the legs; lifted arms rise overhead.
      const up = p.arms * Math.PI * 0.92;
      part(4, -0.29, 1.24, -swing * 0.9 * (1 - p.arms) + up, -0.12 - p.arms * 0.25);
      part(5, 0.29, 1.24, swing * 0.9 * (1 - p.arms) + up, 0.12 + p.arms * 0.25);

      this.m.compose(this.v.set(p.x, 0.03, p.z), this.q.identity(), this.s.set(p.scale, 1, p.scale));
      this.shadow.setMatrixAt(i, this.m);
    }
    for (const mesh of this.meshes) mesh.instanceMatrix.needsUpdate = true;
    this.shadow.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.geos.forEach((g) => g.dispose());
    this.mat.dispose();
    this.shadowMat.dispose();
    this.shadowTex.dispose();
    this.meshes.forEach((m) => m.dispose());
    this.shadow.dispose();
  }
}
