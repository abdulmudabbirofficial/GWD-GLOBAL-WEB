'use client';

import { useEffect, useRef, useState } from 'react';
import { Render } from '@/components/media/Render';
import { Button } from '@/components/ui/Button';
import { gsap, useGsap } from '@/features/motion/gsap';
import styles from './ProductLaunch.module.css';

export interface LaunchProduct {
  slug: string;
  index: number;
  /** The last product holds longest: nothing follows it to read on. */
  last?: boolean;
  name: string;
  category: string;
  status: string;
  tagline: string;
  description: string;
  features: string[];
  render?: { name: string; alt: string };
  actions: { label: string; href: string; variant?: 'primary' | 'outline' }[];
}

/* Where each feature pin sits on the diorama (percent of the image box). */
const SPOTS = [
  { x: 22, y: 30 },
  { x: 74, y: 22 },
  { x: 82, y: 62 },
  { x: 30, y: 72 },
  { x: 56, y: 44 },
  { x: 12, y: 54 },
];

/**
 * One product, launched: a red scan line sweeps slowly across the chapter and
 * leaves the product behind it; the chapter then holds on screen for a long
 * read while the diorama floats with the scroll and its features pin out from
 * it one after another.
 */
export function ProductLaunch({ p }: { p: LaunchProduct }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setSeen(true), io.disconnect()), { rootMargin: '0px 0px -45% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGsap(({ reduced, scope }) => {
    if (reduced) return;
    gsap.fromTo(
      scope.querySelector('[data-float]'),
      { y: 80, rotate: p.index % 2 ? 2 : -2 },
      { y: -60, rotate: p.index % 2 ? -1 : 1, ease: 'none', scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  }, ref);

  const flip = p.index % 2 === 1;
  return (
    <section ref={ref} id={p.slug} className={styles.launch} data-seen={seen || undefined} data-flip={flip || undefined} data-last={p.last || undefined} aria-labelledby={`${p.slug}-name`}>
      <div className={styles.hold}>
        <span className={styles.scan} aria-hidden="true" />
        <div className={`container ${styles.grid}`}>
          <div className={styles.copy}>
            <p className={styles.top}>
              <span className={styles.idx}>{String(p.index + 1).padStart(2, '0')}</span>
              <span className="meta">{p.category}</span>
              <span className={styles.status}>
                <i />
                {p.status}
              </span>
            </p>
            <h2 id={`${p.slug}-name`} className={styles.name}>
              {p.name}
            </h2>
            <p className={styles.tagline}>{p.tagline}</p>
            <p className="t-body">{p.description}</p>
            <div className={styles.actions}>
              {p.actions.map((a) => (
                <Button key={a.href} href={a.href} variant={a.variant ?? 'primary'} size="sm">
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
          <div className={styles.stage}>
            <div className={styles.float} data-float="">
              {p.render && <Render name={p.render.name} alt={p.render.alt} sizes="(min-width: 960px) 50vw, 92vw" />}
            </div>
            <ul role="list" className={styles.spots} aria-label={`${p.name} features`}>
              {p.features.slice(0, SPOTS.length).map((f, i) => (
                <li
                  key={f}
                  className={styles.spot}
                  style={{ left: `${SPOTS[i]!.x}%`, top: `${SPOTS[i]!.y}%`, ['--d' as string]: `${1.3 + i * 0.45}s` }}
                  data-side={SPOTS[i]!.x > 50 ? 'r' : 'l'}
                >
                  <span className={styles.pin} />
                  <span className={styles.tag}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
