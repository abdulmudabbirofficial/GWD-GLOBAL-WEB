'use client';

import { useRef } from 'react';
import type { SceneFactory } from './types';
import { useWorldView } from './WorldCanvas';
import styles from './PageBackdrop.module.css';

/**
 * Every page has its own live 3D world running behind it for the whole
 * scroll. The scene is drawn into a fixed, full-screen anchor on the shared
 * canvas (layer -1, so anchored scenes draw over it), and gets the page's
 * scroll position as its progress. Without WebGL the page keeps its CSS
 * backdrop.
 */
export type BackdropName = 'home' | 'services' | 'service' | 'products' | 'sports' | 'community' | 'about' | 'contact';

const LOADERS: Record<BackdropName, () => Promise<SceneFactory>> = {
  home: () => import('@/3d/backdrops/gwdworld').then((m) => m.createGwdWorld),
  services: () => import('@/3d/backdrops/isogrid').then((m) => m.createIsogrid),
  service: () => import('@/3d/backdrops/blueprint').then((m) => m.createBlueprint),
  products: () => import('@/3d/backdrops/hall').then((m) => m.createHall),
  sports: () => import('@/3d/backdrops/stadium').then((m) => m.createStadium),
  community: () => import('@/3d/backdrops/photos').then((m) => m.createPhotos),
  about: () => import('@/3d/backdrops/ascent').then((m) => m.createAscent),
  contact: () => import('@/3d/backdrops/ripple').then((m) => m.createRipple),
};

const pageProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
};

export function PageBackdrop({ name }: { name: BackdropName }) {
  const ref = useRef<HTMLDivElement>(null);
  const { active, ready } = useWorldView(ref, LOADERS[name], { getProgress: pageProgress, layer: -1 });
  return <div ref={ref} className={styles.backdrop} data-name={name} data-webgl={active || undefined} data-ready={ready || undefined} aria-hidden="true" />;
}
