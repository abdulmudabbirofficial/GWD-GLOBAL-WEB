import type { Camera, Scene, Texture, WebGLRenderer } from 'three';

export type Tier = 'low' | 'mid' | 'high';

/** What a scene gets every frame. */
export interface ViewState {
  /** Seconds since the world started, and since the previous frame. */
  time: number;
  dt: number;
  /** 0 when the anchor's top meets the viewport bottom, 1 when its bottom leaves the top (or a custom progress). */
  progress: number;
  /** The anchor's size in CSS pixels. */
  width: number;
  height: number;
  /** Pointer relative to the anchor, -1..1 (eased); 0,0 when the pointer is elsewhere. */
  pointer: { x: number; y: number };
  tier: Tier;
  reduced: boolean;
}

export interface WorldContext {
  renderer: WebGLRenderer;
  /** A procedural studio environment for glossy materials. */
  envMap: Texture;
  /** Being prepared ahead of time: heavy one-off work may wait for quiet moments. */
  idle?: boolean;
  tier: Tier;
  reduced: boolean;
}

export interface WorldScene {
  scene: Scene;
  camera: Camera;
  update(state: ViewState): void;
  resize?(width: number, height: number): void;
  /** True while this scene paints every pixel of its view opaquely (the world can skip what lies beneath it). */
  covers?(): boolean;
  dispose(): void;
}

export type SceneFactory<S extends WorldScene = WorldScene> = (ctx: WorldContext) => S | Promise<S>;

/** The current page's world payload (PageShell `payload`), or null. */
export function readWorldPayload<T>(): T | null {
  const el = typeof document !== 'undefined' ? document.getElementById('gwd-world-payload') : null;
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return null;
  }
}
