'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger } from './gsap';

/**
 * Page-wide scroll choreography, declared with attributes:
 *  - data-fx="rise"     the element glides up and fades in as it enters, tied to the scroll
 *  - data-fx="stagger"  its children settle in one after another as they reach the screen
 *  - data-speed="0.9"   parallax: below 1 the element trails the scroll, above 1 it leads
 * Re-applied on every route; everything is reverted when the page changes.
 * Reduced motion leaves the page as it is.
 */
export function ScrollFX() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    let id = 0;
    let frames = 0;
    // The page streams in under its own Suspense boundary, so it can hydrate after this
    // layout effect. Wait until React has claimed the marked elements (or give up after
    // ~3s) before touching their styles, so hydration never sees a mutated DOM.
    const claimed = (el: Element) => Object.keys(el).some((k) => k.startsWith('__reactFiber'));
    const waitForHydration = () => {
      const marked = document.querySelectorAll('main [data-fx], main [data-speed]');
      if ((marked.length && !Array.from(marked).every(claimed)) || (!marked.length && frames < 30)) {
        if (frames++ < 180) {
          id = requestAnimationFrame(waitForHydration);
          return;
        }
      }
      setup();
    };
    const setup = () => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('main [data-fx="rise"]').forEach((el) => {
          gsap.fromTo(
            el,
            { y: 70, opacity: 0, filter: 'blur(6px)' },
            { y: 0, opacity: 1, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: 0.8 } },
          );
        });

        gsap.utils.toArray<HTMLElement>('main [data-fx="stagger"]').forEach((group) => {
          const items = Array.from(group.children) as HTMLElement[];
          gsap.set(items, { y: 50, opacity: 0 });
          ScrollTrigger.batch(items, {
            start: 'top 92%',
            once: true,
            onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.3, stagger: 0.09, ease: 'gwd', overwrite: true }),
          });
        });

        gsap.utils.toArray<HTMLElement>('main [data-speed]').forEach((el) => {
          const speed = Number(el.dataset.speed) || 1;
          gsap.fromTo(
            el,
            { y: () => (1 - speed) * -window.innerHeight * 0.5 },
            {
              y: () => (1 - speed) * window.innerHeight * 0.5,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          );
        });
      });
      ScrollTrigger.refresh();
    };
    id = requestAnimationFrame(waitForHydration);
    return () => {
      cancelAnimationFrame(id);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
