'use client';

import { useEffect, useRef, useState } from 'react';
import type { PassportScene } from '@/3d/scenes/passport';
import { useWorldView } from '@/3d/world/WorldCanvas';
import { Render } from '@/components/media/Render';
import styles from './PassportChapter.module.css';

interface PassportChapterProps {
  label: string;
  title: string;
  body: string;
  note: string;
  facts: readonly { value: string; label: string }[];
  editions: readonly string[];
}

/**
 * Three screens of scroll, one card: the Passport turns to each earned
 * edition in turn while the copy holds still beside it.
 */
export function PassportChapter({ label, title, body, note, facts, editions }: PassportChapterProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [edition, setEdition] = useState(0);

  const progress = () => {
    const el = rootRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
  };
  const { sceneRef, active } = useWorldView<PassportScene>(
    stageRef,
    () => import('@/3d/scenes/passport').then((m) => (ctx) => m.createPassportScene(ctx, { mode: 'scroll' })),
    { getProgress: progress },
  );

  // Mirror the card's edition in the list beside it.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const e = sceneRef.current?.edition;
      if (e !== undefined) setEdition((prev) => (prev === e ? prev : e));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneRef]);

  return (
    <section
      ref={rootRef}
      className={`chapter ${styles.passport}`}
      data-tone="dark"
      data-see-through
      data-flush
      data-webgl={active || undefined}
      aria-labelledby="passport-title"
    >
      <div className={styles.sticky}>
        <div className={`container ${styles.grid}`}>
          <div className={styles.copy}>
            <p className="chapter-label">{label}</p>
            <h2 id="passport-title" className={`t-title ${styles.title}`}>
              {title}
            </h2>
            <p className="t-body">{body}</p>
            <ol role="list" className={styles.editions} aria-label="Card editions">
              {editions.map((e, i) => (
                <li key={e} data-on={active ? i === edition || undefined : undefined}>
                  <span className="meta">{String(i + 1).padStart(2, '0')}</span>
                  {e}
                </li>
              ))}
            </ol>
          </div>
          <div ref={stageRef} className={styles.stage} aria-hidden="true">
            {!active && <Render name="prod-sports" alt="" sizes="(min-width: 960px) 45vw, 100vw" fill />}
          </div>
        </div>
        <dl className={`container ${styles.facts}`}>
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="meta">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <p className={`meta ${styles.note}`}>{note}</p>
      </div>
    </section>
  );
}
