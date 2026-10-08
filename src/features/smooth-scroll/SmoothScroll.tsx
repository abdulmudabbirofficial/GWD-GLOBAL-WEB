'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/features/motion/gsap';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { createStore } from '@/lib/store';

/*
 * Lenis smooths wheel input with inertia; touch keeps native momentum. It is
 * driven by GSAP's ticker and feeds ScrollTrigger, so pinned and scrubbed
 * sequences stay in lockstep with the smoothed scroll. Disabled for reduced motion.
 */
export const lenisStore = createStore<Lenis | null>(null);

export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // A heavier, slower glide: the page carries a little momentum after each flick of the wheel.
    const lenis = new Lenis({ lerp: 0.065, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false, autoRaf: false });
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisStore.set(lenis);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisStore.set(null);
    };
  }, [reduced]);

  return null;
}

/** Scrolls smoothly when Lenis is active, natively otherwise. */
export function scrollToTarget(target: number | string | HTMLElement, options: { immediate?: boolean; offset?: number } = {}) {
  const lenis = lenisStore.get();
  if (lenis) {
    lenis.scrollTo(target, { immediate: options.immediate, offset: options.offset ?? 0, force: true });
    return;
  }
  const behavior: ScrollBehavior = options.immediate ? 'instant' : 'smooth';
  if (typeof target === 'number') window.scrollTo({ top: target, behavior });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior, block: 'start' });
  }
}
