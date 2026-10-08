'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createStore } from '@/lib/store';
import { markWorldSettled } from './settled';
import type { SceneFactory, Tier, WorldScene } from './types';
import type { World } from './World';
import styles from './WorldCanvas.module.css';

export const worldStore = createStore<World | null>(null);

/** Laptop and phone graphics (shared memory): every effect, at a slightly lower internal resolution. */
let integratedGpu = false;

/** How much real-time rendering this device gets; null means none (static fallbacks). */
function detectTier(): Tier | null {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return null;
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  integratedGpu = /intel|iris|uhd|radeon\(tm\) graphics|radeon graphics|vega|mali|adreno|powervr|swiftshader|llvmpipe|basic render/.test(gpu);
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (memory <= 2 || cores <= 2) return 'low';
  if (coarse || memory <= 4 || cores <= 4) return 'mid';
  return 'high';
}

/** The site's single WebGL canvas, fixed behind every page. Mounted once in the site layout. */
export function WorldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let world: World | null = null;
    let cancelled = false;
    const id = requestAnimationFrame(async () => {
      const tier = detectTier();
      if (!tier || !ref.current) {
        // No real-time 3D on this device: nothing to wait for.
        markWorldSettled();
        return;
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const { World } = await import('./World');
      if (cancelled || !ref.current) return;
      world = new World(ref.current, tier, reduced, integratedGpu ? 1.25 : undefined);
      worldStore.set(world);
      document.documentElement.dataset.webgl = tier;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      worldStore.set(null);
      world?.dispose();
      delete document.documentElement.dataset.webgl;
    };
  }, []);
  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}

/**
 * Anchors a 3D scene to an element. The scene module is loaded when the
 * element nears the viewport; `sceneRef` exposes it for imperative calls
 * (e.g. switching a service's form). `active` is false when the device gets
 * no WebGL, so the caller can show its static fallback.
 */
export function useWorldView<S extends WorldScene>(
  ref: RefObject<HTMLElement | null>,
  load: () => Promise<SceneFactory<S>>,
  opts: { getProgress?: () => number; layer?: number; eager?: boolean } = {},
) {
  // The server (and hydration) never has a world; the client switches over after mount.
  const world = useSyncExternalStore(worldStore.subscribe, worldStore.get, () => null);
  const sceneRef = useRef<S | null>(null);
  const [ready, setReady] = useState(false);
  const loadRef = useRef(load);
  const progressRef = useRef(opts.getProgress);
  const eager = opts.eager ?? false;
  useEffect(() => {
    loadRef.current = load;
    progressRef.current = opts.getProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!world || !el) return;
    const layer = opts.layer;
    const id = world.add(el, async (ctx) => (await loadRef.current())(ctx), {
      layer,
      eager,
      getProgress: progressRef.current ? () => progressRef.current!() : undefined,
      onReady: (s) => {
        sceneRef.current = s as S;
        setReady(true);
      },
    });
    return () => {
      world.remove(id);
      sceneRef.current = null;
      setReady(false);
    };
  }, [world, ref, opts.layer, eager]);

  return { sceneRef, ready, active: world !== null };
}
