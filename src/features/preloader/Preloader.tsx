'use client';

import { useEffect, useRef } from 'react';
import { MARK, MARK_VIEWBOX } from '@/components/brand/mark';
import { whenWorldSettled } from '@/3d/world/settled';
import { gsap } from '@/features/motion/gsap';
import { finishIntro, introRunning } from './intro';
import styles from './Preloader.module.css';

/**
 * First visit only: a counter runs to 100% while the GWD mark assembles,
 * then the haze lifts off the page. Shown by CSS (html.intro, set before
 * paint), so returning visitors never see a flash of it. The last few percent
 * wait for the 3D world to be ready (at most a few seconds), so the lift and
 * the world's intro play without a stall.
 */
export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !introRunning()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishIntro();
      return;
    }
    const counter = { v: 0 };
    const show = () => {
      if (countRef.current) countRef.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
    };
    const bar = root.querySelector('[data-bar]');
    const HOLD = 92;
    // The world may be ready before the counter gets there (then it runs straight through) or after (it waits).
    let ready = false;
    let atHold = false;
    const tl = gsap.timeline({ paused: true });
    tl.to(counter, { v: HOLD, duration: 1.9, ease: 'power2.inOut', onUpdate: show })
      .from(
        root.querySelectorAll('[data-piece]'),
        { opacity: 0, x: (i) => (i === 0 ? -60 : i === 1 ? 60 : 0), y: (i) => (i === 0 ? 40 : i === 1 ? -40 : 20), stagger: 0.12, duration: 1.2 },
        0.1,
      )
      .to(bar, { scaleX: HOLD / 100, duration: 1.9, ease: 'power2.inOut' }, 0)
      .addPause('hold', () => {
        atHold = true;
        // Resumed just after GSAP has finished pausing here.
        if (ready) window.setTimeout(() => tl.play(), 0);
      })
      .to(counter, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: show })
      .to(bar, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, '<')
      .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'gwd-in-out', onStart: finishIntro }, '+=0.15')
      .set(root, { display: 'none' });

    // The hold ends when the world is ready, or after a few seconds whatever happens.
    const release = () => {
      if (ready) return;
      ready = true;
      if (atHold) tl.play();
    };
    const cancelSettled = whenWorldSettled(release);
    const failsafe = window.setTimeout(release, 6500);

    // Start once fonts are in (or after a short wait), so the page behind is settled.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      tl.play();
    };
    document.fonts?.ready.then(start);
    const t = window.setTimeout(start, 900);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(failsafe);
      cancelSettled();
      tl.kill();
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.preloader} aria-hidden="true">
      <svg viewBox={MARK_VIEWBOX} className={styles.mark}>
        <path data-piece="" d={MARK.brackets.bottomLeft} className={styles.bracket} />
        <path data-piece="" d={MARK.brackets.topRight} className={styles.bracket} />
        <g data-piece="" className={styles.letters}>
          <path d={MARK.letters.g} />
          <path d={MARK.letters.w} />
          <path d={MARK.letters.d} />
        </g>
      </svg>
      <p className={styles.count}>
        <span ref={countRef}>000</span>
        <i>%</i>
      </p>
      <p className={styles.caption}>GWD Global · Get Work Done</p>
      <span className={styles.track}>
        <span data-bar="" className={styles.bar} />
      </span>
    </div>
  );
}
