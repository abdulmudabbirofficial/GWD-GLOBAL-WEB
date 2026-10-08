'use client';

import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('gwd', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('gwd-in-out', 'M0,0 C0.76,0 0.24,1 1,1');
  gsap.defaults({ ease: 'gwd', duration: 1.1 });
}

export { gsap, ScrollTrigger, SplitText };

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs GSAP code in a context scoped to an element; everything it creates
 * (tweens, ScrollTriggers, SplitTexts) is reverted when the component unmounts
 * or the dependencies change.
 */
export function useGsap(
  setup: (ctx: { reduced: boolean; scope: HTMLElement }) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
) {
  const setupRef = useRef(setup);
  useIsoLayoutEffect(() => {
    setupRef.current = setup;
  });
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const ctx = gsap.context(() => {
      cleanup = setupRef.current({ reduced: prefersReducedMotion(), scope: el });
    }, el);
    return () => {
      cleanup?.();
      ctx.revert();
    };
  }, deps);
}
