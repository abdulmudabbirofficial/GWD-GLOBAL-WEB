import { ACESFilmicToneMapping, HalfFloatType, Mesh, PerspectiveCamera, PMREMGenerator, SRGBColorSpace, WebGLRenderer, WebGLRenderTarget, type Material, type Object3D, type Texture } from 'three';
import { nextIdle, nextQuiet, scrollPaused } from './quiet';
import { markWorldSettled } from './settled';
import { studioEnvironmentScene } from './studioEnv';
import type { SceneFactory, Tier, ViewState, WorldScene } from './types';

interface View {
  el: HTMLElement;
  factory: SceneFactory;
  getProgress?: () => number;
  scene: WorldScene | null;
  loading: boolean;
  near: boolean;
  onReady?: (scene: WorldScene) => void;
  /** Lower layers draw first (a page backdrop is -1). */
  layer: number;
  /** Prepared in idle time once the page's first scenes are ready, not only when scrolled near. */
  eager: boolean;
  pointer: { x: number; y: number };
  size: { w: number; h: number };
}

const DPR: Record<Tier, number> = { low: 1, mid: 1.5, high: 1.75 };

const nextFrame = () => new Promise((res) => requestAnimationFrame(() => res(null)));
/** The first-visit preloader is up: heavy work done now is never seen. */
const covered = () => document.documentElement.classList.contains('intro');



/**
 * One WebGL renderer for the whole site. Each 3D scene is anchored to a DOM
 * element and drawn into that element's rectangle (viewport + scissor), so
 * scenes scroll with the page, sit behind its text, and only the ones on
 * screen are rendered. Scenes are created when their anchor comes near the
 * viewport and disposed when the anchor unmounts.
 */
export class World {
  readonly renderer: WebGLRenderer;
  readonly envMap: Texture;
  private views = new Map<number, View>();
  private nextId = 1;
  private raf = 0;
  private start = performance.now();
  private last = performance.now();
  private pointer = { x: -1, y: -1 };
  private io: IntersectionObserver;
  private width = 0;
  private height = 0;
  /* Frame-rate governor: the render resolution steps down when a device cannot hold its frame rate. */
  private ratio = 1;
  private maxRatio = 1;
  private minRatio = 1;
  private frameMs = 16.7;
  private frames = 0;
  private settleUntil = 0;
  private stepsUp = 0;
  private slowWindows = 0;
  private goodWindows = 0;
  /** Set once the page has gone idle after loading: eager views may start then. */
  private idle = false;
  /** Eager views also wait out the first scenes' opening moments (an intro plays then). */
  private eagerAfter = 0;
  private warmTarget: WebGLRenderTarget | null = null;
  private disposed = false;
  /** The page's own (non-eager) scenes have been ready at least once. */
  private firstReady = false;

  constructor(
    private canvas: HTMLCanvasElement,
    readonly tier: Tier,
    readonly reduced: boolean,
    /** A lower resolution ceiling for shared-memory graphics (all effects stay on). */
    dprCap?: number,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' });
    this.maxRatio = Math.min(window.devicePixelRatio || 1, DPR[tier], dprCap ?? Infinity);
    this.minRatio = Math.min(this.maxRatio, tier === 'low' ? 0.75 : 1);
    this.ratio = this.maxRatio;
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    // Reading a shader's error log makes the driver finish compiling it on the spot, which undoes
    // parallel compilation and stalls scrolling; the shaders are checked in development only.
    this.renderer.debug.checkShaderErrors = process.env.NODE_ENV !== 'production';

    const pmrem = new PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(studioEnvironmentScene(), 0.02).texture;
    pmrem.dispose();

    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          for (const v of this.views.values()) if (v.el === e.target) v.near = e.isIntersecting;
        }
        this.ensureScenes();
      },
      { rootMargin: '140% 0px 140% 0px' },
    );

    nextIdle(3000).then(() => {
      this.idle = true;
      this.ensureScenes();
    });

    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize();
    this.loop();
  }

  add(el: HTMLElement, factory: SceneFactory, opts: { getProgress?: () => number; onReady?: (s: WorldScene) => void; layer?: number; eager?: boolean } = {}) {
    const id = this.nextId++;
    this.views.set(id, {
      el,
      factory,
      getProgress: opts.getProgress,
      onReady: opts.onReady,
      layer: opts.layer ?? 0,
      eager: opts.eager ?? false,
      scene: null,
      loading: false,
      near: false,
      pointer: { x: 0, y: 0 },
      size: { w: 0, h: 0 },
    });
    this.io.observe(el);
    return id;
  }

  remove(id: number) {
    const v = this.views.get(id);
    if (!v) return;
    this.io.unobserve(v.el);
    v.scene?.dispose();
    this.views.delete(id);
  }

  dispose() {
    this.disposed = true;
    this.warmTarget?.dispose();
    cancelAnimationFrame(this.raf);
    this.io.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    for (const v of this.views.values()) v.scene?.dispose();
    this.views.clear();
    this.envMap.dispose();
    this.renderer.dispose();
  }

  /**
   * Gets a scene ready before its first frame, so it never stalls the page:
   * shaders compile in parallel off the main thread, and textures upload a
   * few per frame. (Done on the first render instead, a scene can freeze the
   * page for a second or more.)
   */
  private async prepare(scene: WorldScene, idle = false) {
    const r = this.renderer;
    try {
      await r.compileAsync(scene.scene, scene.camera);
    } catch {
      // Older drivers: shaders compile on first use instead.
    }
    const textures = new Set<Texture>();
    scene.scene.traverse((o) => {
      const mats = (o as Mesh).material as Material | Material[] | undefined;
      if (!mats) return;
      for (const m of Array.isArray(mats) ? mats : [mats]) {
        for (const v of Object.values(m)) if ((v as Texture | null)?.isTexture) textures.add(v as Texture);
        const uniforms = (m as Material & { uniforms?: Record<string, { value: unknown }> }).uniforms;
        if (uniforms) for (const u of Object.values(uniforms)) if ((u.value as Texture | null)?.isTexture) textures.add(u.value as Texture);
      }
    });
    let n = 0;
    for (const t of textures) {
      if (!t.image) continue;
      r.initTexture(t);
      // A couple of uploads per frame keeps scrolling smooth while a scene loads.
      if (++n % 2 === 0) await new Promise((res) => requestAnimationFrame(() => res(null)));
    }
    await this.warm(scene, idle ? nextQuiet : nextFrame);
  }

  /**
   * Some graphics drivers (Chrome's Direct3D backend on Windows among them)
   * finish building a shader only when it first draws, which can hold the
   * page for a tenth of a second or more per shader. Each of the scene's
   * shaders is drawn once here, into a single off-screen pixel, one per frame,
   * so the scene's first real frames (an intro, a scroll) never wait on one.
   * Scenes with a mirror also warm the variants their reflection pass uses.
   */
  private async warm(scene: WorldScene, step: () => Promise<unknown>) {
    const r = this.renderer;
    const root = scene.scene;
    const items: Object3D[] = [];
    let reflects = false;
    root.traverse((o) => {
      const k = o as Object3D & { isMesh?: boolean; isPoints?: boolean; isLine?: boolean; isSprite?: boolean; isReflector?: boolean };
      if (k.isReflector) reflects = true;
      if (k.isMesh || k.isPoints || k.isLine || k.isSprite) items.push(o);
    });
    const reps = new Map<string, Object3D>();
    for (const o of items) {
      const m = (o as Mesh).material as Material | Material[] | undefined;
      const list = Array.isArray(m) ? m : [m];
      const key = `${o.type}|${(o as { isInstancedMesh?: boolean }).isInstancedMesh ? 1 : 0}|${list.map((x) => x?.uuid).join(',')}`;
      if (!reps.has(key)) reps.set(key, o);
    }
    for (const rep of reps.values()) {
      if (this.disposed) return;
      // Snapshot now, not once up front: between steps the scene may show things itself (a photo that has
      // just loaded), and restoring an older snapshot would hide them again.
      const saved = items.map((o) => [o, o.visible, o.frustumCulled] as const);
      for (const o of items) o.visible = false;
      const parents: [Object3D, boolean][] = [];
      for (let a = rep.parent; a; a = a.parent) {
        parents.push([a, a.visible]);
        a.visible = true;
      }
      rep.visible = true;
      rep.frustumCulled = false;
      try {
        r.setRenderTarget(null);
        r.setScissorTest(true);
        r.setViewport(0, 0, 1, 1);
        r.setScissor(0, 0, 1, 1);
        r.render(root, scene.camera);
        if (reflects) {
          this.warmTarget ??= new WebGLRenderTarget(2, 2, { samples: 4, type: HalfFloatType });
          r.setRenderTarget(this.warmTarget);
          r.render(root, scene.camera);
          r.setRenderTarget(null);
        }
      } catch {
        // A shader that fails here fails the same way in the real frame; nothing to add.
      }
      for (const [a, v] of parents) a.visible = v;
      for (const [o, v, f] of saved) {
        o.visible = v;
        o.frustumCulled = f;
      }
      await step();
    }
  }

  private ensureScenes() {
    // Eager views start behind the first-visit preloader once the page's own scenes are ready, or later,
    // once the page is idle, its opening has played and the visitor pauses scrolling.
    const busy = [...this.views.values()].some((v) => v.loading && !(v.eager && !v.near));
    const hidden = covered();
    for (const v of this.views.values()) {
      if (v.scene || v.loading) continue;
      const due = !v.near && v.eager && !busy && (hidden ? this.firstReady : this.idle && performance.now() >= this.eagerAfter);
      const early = due && (hidden || scrollPaused());
      // Waiting only for the visitor to stop scrolling: look again shortly.
      if (due && !early) {
        setTimeout(() => this.ensureScenes(), 400);
        continue;
      }
      if (!v.near && !early) continue;
      v.loading = true;
      const quiet = early && !hidden;
      Promise.resolve(v.factory({ renderer: this.renderer, envMap: this.envMap, tier: this.tier, reduced: this.reduced, idle: quiet }))
        .then(async (scene) => {
          await this.prepare(scene, quiet);
          // Loading a scene is not a sign of a slow device.
          this.settleUntil = performance.now() + 2500;
          this.frames = 0;
          // The anchor may have unmounted while the scene module loaded.
          if (![...this.views.values()].includes(v)) {
            scene.dispose();
            return;
          }
          v.scene = scene;
          v.onReady?.(scene);
          if (!v.eager) {
            this.firstReady = true;
            const EAGER_DELAY = 4500;
            this.eagerAfter = performance.now() + EAGER_DELAY;
            setTimeout(() => nextIdle(1000).then(() => this.ensureScenes()), EAGER_DELAY + 20);
          }
        })
        .catch((err) => console.error('[world] scene failed', err))
        .finally(() => {
          v.loading = false;
          this.checkSettled();
          // A scene finishing may free the way for an eager one.
          if (this.idle && [...this.views.values()].some((x) => x.eager && !x.scene && !x.loading)) this.ensureScenes();
        });
    }
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  };

  private onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(this.raf);
    else {
      this.last = performance.now();
      this.loop();
    }
  };

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    // Sized to the visual viewport in CSS too, so mobile address-bar changes never stretch it.
    this.renderer.setSize(w, h, true);
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.resize();

    const vh = this.height;
    const r = this.renderer;
    r.setScissorTest(false);
    r.clear();
    r.setScissorTest(true);

    const ordered = [...this.views.values()].sort((a, b) => a.layer - b.layer);
    // A scene that paints its whole (full-screen) view hides everything below it: skip those.
    let floor = -Infinity;
    for (const v of ordered) {
      if (!v.scene?.covers?.()) continue;
      const rc = v.el.getBoundingClientRect();
      if (rc.top <= 0.5 && rc.left <= 0.5 && rc.bottom >= vh - 0.5 && rc.right >= window.innerWidth - 0.5) floor = Math.max(floor, v.layer);
    }
    let drew = false;
    for (const v of ordered) {
      if (!v.scene || v.layer < floor) continue;
      const rect = v.el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= vh || rect.width === 0 || rect.height === 0) continue;

      // Pointer, local to the anchor and eased.
      const inside = this.pointer.x >= rect.left && this.pointer.x <= rect.right && this.pointer.y >= rect.top && this.pointer.y <= rect.bottom;
      const tx = inside ? ((this.pointer.x - rect.left) / rect.width) * 2 - 1 : 0;
      const ty = inside ? -(((this.pointer.y - rect.top) / rect.height) * 2 - 1) : 0;
      const k = 1 - Math.exp(-dt * 4);
      v.pointer.x += (tx - v.pointer.x) * k;
      v.pointer.y += (ty - v.pointer.y) * k;

      if (v.size.w !== rect.width || v.size.h !== rect.height) {
        v.size.w = rect.width;
        v.size.h = rect.height;
        const cam = v.scene.camera;
        if (cam instanceof PerspectiveCamera) {
          cam.aspect = rect.width / rect.height;
          cam.updateProjectionMatrix();
        }
        v.scene.resize?.(rect.width, rect.height);
      }

      const progress = v.getProgress ? v.getProgress() : Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const state: ViewState = {
        time: this.reduced ? 0 : (now - this.start) / 1000,
        dt: this.reduced ? 0 : dt,
        progress,
        width: rect.width,
        height: rect.height,
        pointer: v.pointer,
        tier: this.tier,
        reduced: this.reduced,
      };
      v.scene.update(state);

      const y = vh - rect.bottom;
      r.setViewport(rect.left, y, rect.width, rect.height);
      r.setScissor(rect.left, y, rect.width, rect.height);
      // Each view draws over the ones before it (a page backdrop first, then
      // anchored scenes), so it starts from a clean depth buffer in its rect.
      r.clearDepth();
      r.render(v.scene.scene, v.scene.camera);
      drew = true;
    }
    if (drew) this.govern(now, dt);
  };

  /**
   * The world counts as settled (the preloader may lift) once the scenes in
   * view are ready and, while the preloader is still up, the eager ones too.
   */
  private checkSettled() {
    const views = [...this.views.values()];
    if (!views.some((v) => v.scene)) return;
    if (views.some((v) => v.near && !v.scene)) return;
    if (covered() && views.some((v) => v.eager && !v.scene)) {
      this.ensureScenes();
      return;
    }
    markWorldSettled();
  }

  /**
   * Keeps motion smooth on every device: if frames run long for a second, the
   * canvas renders at a lower resolution (the page's text is unaffected); once
   * frames are comfortably on time again for a while, it steps back up.
   */
  private govern(now: number, dt: number) {
    if (this.reduced || now < this.settleUntil || dt >= 1 / 20) return;
    this.frameMs += (dt * 1000 - this.frameMs) * 0.03;
    if (++this.frames < 120) return;
    this.frames = 0;
    let next = this.ratio;
    // Two slow windows in a row (about four seconds) before stepping down; a long good run before stepping up.
    this.slowWindows = this.frameMs > 24 ? this.slowWindows + 1 : 0;
    this.goodWindows = this.frameMs < 17.2 ? this.goodWindows + 1 : 0;
    if (this.slowWindows >= 2 && this.ratio > this.minRatio) {
      next = Math.max(this.minRatio, this.ratio - 0.25);
      this.slowWindows = 0;
    } else if (this.goodWindows >= 8 && this.ratio < this.maxRatio && this.stepsUp < 2) {
      next = Math.min(this.maxRatio, this.ratio + 0.125);
      this.goodWindows = 0;
      this.stepsUp++;
    }
    if (next === this.ratio) return;
    this.ratio = next;
    this.renderer.setPixelRatio(next);
    this.width = 0;
    this.resize();
    this.frameMs = 16.7;
    this.settleUntil = now + 1500;
  }
}
