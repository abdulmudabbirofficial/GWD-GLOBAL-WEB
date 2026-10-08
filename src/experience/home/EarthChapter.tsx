'use client';

import { useEffect, useRef } from 'react';
import type { EarthPlace, EarthScene } from '@/3d/scenes/earth';
import { useWorldView } from '@/3d/world/WorldCanvas';
import styles from './EarthChapter.module.css';

interface EarthChapterProps {
  label: string;
  places: (EarthPlace & { city: string; country: string })[];
  title: string;
  lead: string;
}

/**
 * The planet, Mont-Fort style. The chapter is three screens tall and its
 * stage holds still: the scroll starts in the clouds above Hyderabad, then
 * pulls back to the whole Earth as the cities GWD works with light up.
 */
export function EarthChapter({ places, label, title, lead }: EarthChapterProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

  const progress = () => {
    const el = rootRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
  };

  const { sceneRef, ready, active } = useWorldView<EarthScene>(
    stageRef,
    () => import('@/3d/scenes/earth').then((m) => (ctx) => m.createEarthScene(ctx, places)),
    // Prepared while the visitor reads the opening chapters, so the globe is ready long before it is reached.
    { getProgress: progress, eager: true },
  );

  useEffect(() => {
    if (ready) sceneRef.current?.setLabels(labelRefs.current);
  }, [ready, sceneRef]);

  // The copy follows the same progress (CSS reads --p).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      el.style.setProperty('--p', progress().toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const hq = places.find((p) => p.isHq);
  const others = places.filter((p) => !p.isHq);

  return (
    <section
      ref={rootRef}
      className={`chapter ${styles.earth}`}
      data-tone="dark"
      data-see-through
      data-flush
      data-webgl={active || undefined}
      aria-labelledby="earth-title"
    >
      <div className={styles.sticky}>
        <div ref={stageRef} className={styles.stage} aria-hidden="true">
          {places.map((p, i) => (
            <span
              key={p.id}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className={styles.label}
              data-hq={p.isHq || undefined}
            >
              {p.isHq ? `${p.country} · HQ` : p.country}
            </span>
          ))}
        </div>

        <div className={`container ${styles.overlay}`}>
          {hq && (
            <p className={styles.opening}>
              <span className="meta">
                {hq.city}, {hq.country}
              </span>
              <span className={styles.coords}>
                {hq.latitude.toFixed(2)}° N · {hq.longitude.toFixed(2)}° E
              </span>
            </p>
          )}

          <div className={styles.copy} data-exit="">
            <p className="chapter-label">{label}</p>
            <h2 id="earth-title" className={`t-title ${styles.title}`}>
              {title}
            </h2>
            <p className="t-lead">{lead}</p>
            <ul role="list" className={styles.list}>
              {others.map((p) => (
                <li key={p.id}>
                  <span>{p.country}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
