'use client';

import { useEffect, useRef } from 'react';
import styles from './DrawList.module.css';

/**
 * Numbered points that are drafted onto the page: as each one reaches the
 * screen, a red rule draws across from its number and the text follows it in.
 */
export function DrawList({ items }: { items: { title: string; body: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target as HTMLElement).setAttribute('data-drawn', '')),
      { rootMargin: '0px 0px -18% 0px' },
    );
    el.querySelectorAll('li').forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);
  return (
    <ol ref={ref} role="list" className={styles.list}>
      {items.map((it, i) => (
        <li key={it.title} className={styles.item}>
          <span className={styles.n}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.rule} aria-hidden="true" />
          <div className={styles.text}>
            <h3 className="t-h3">{it.title}</h3>
            <p className="t-body">{it.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
