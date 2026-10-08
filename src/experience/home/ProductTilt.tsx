'use client';

import { useRef, type PointerEvent } from 'react';
import { Render } from '@/components/media/Render';
import { gsap, useGsap } from '@/features/motion/gsap';
import { TransitionLink } from '@/features/transition/TransitionLink';
import styles from './ProductTilt.module.css';

export interface TiltItem {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  status: string;
  href: string;
  render?: { name: string; alt: string };
}

/** Product cards that lean toward the pointer in 3D, with a moving sheen. */
function Card({ item }: { item: TiltItem }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const move = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <TransitionLink ref={ref} href={item.href} className={styles.card} onPointerMove={move} onPointerLeave={leave} data-cta="">
      <span className={styles.media}>{item.render && <Render name={item.render.name} alt={item.render.alt} sizes="(min-width: 960px) 30vw, 90vw" />}</span>
      <span className={styles.sheen} aria-hidden="true" />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className="meta">{item.category}</span>
          <span className={styles.status}>{item.status}</span>
        </span>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.tagline}>{item.tagline}</span>
      </span>
    </TransitionLink>
  );
}

/**
 * The cards rise out of depth one after another as the section scrolls in,
 * then the columns drift gently against each other while it is in view.
 */
export function ProductTilt({ items }: { items: TiltItem[] }) {
  const ref = useRef<HTMLUListElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      const cards = gsap.utils.toArray<HTMLElement>(':scope > li', scope);
      gsap.from(cards, {
        y: 180,
        rotateX: 34,
        scale: 0.9,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: { trigger: scope, start: 'top 96%', end: 'top 38%', scrub: 0.9 },
      });
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { yPercent: i % 2 ? 7 : -3 },
          { yPercent: i % 2 ? -7 : 3, ease: 'none', scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });
    },
    ref,
  );
  return (
    <ul ref={ref} role="list" className={styles.grid}>
      {items.map((it) => (
        <li key={it.slug}>
          <Card item={it} />
        </li>
      ))}
    </ul>
  );
}
