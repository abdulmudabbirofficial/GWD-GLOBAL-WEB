'use client';

import { useEffect, useRef, useState } from 'react';
import { Render } from '@/components/media/Render';
import { Button } from '@/components/ui/Button';
import { TransitionLink } from '@/features/transition/TransitionLink';
import styles from './ServiceShowcase.module.css';

export interface ShowcaseService {
  slug: string;
  n: string;
  name: string;
  group: string;
  summary: string;
  headline: string;
  capabilities: string[];
  render?: { name: string; alt: string };
}

/**
 * All fifteen services as a gallery you walk through. The dioramas scroll on
 * the right; the panel on the left holds still and turns over to whichever
 * one is in front of you (number, name, promise, what it covers), while an
 * index rail marks your place among the fifteen.
 */
export function ServiceShowcase({ services, explore = 'Explore' }: { services: ShowcaseService[]; explore?: string }) {
  const [active, setActive] = useState(0);
  const cards = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    cards.current.forEach((c) => c && io.observe(c));
    return () => io.disconnect();
  }, []);

  const s = services[active]!;

  return (
    <div className={styles.showcase}>
      <aside className={styles.panel} aria-live="polite">
        <ol role="list" className={styles.rail} aria-label="Services">
          {services.map((sv, i) => (
            <li key={sv.slug} data-on={i === active || undefined}>
              <button type="button" onClick={() => cards.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })} aria-label={sv.name}>
                {sv.n}
              </button>
            </li>
          ))}
        </ol>
        <div key={s.slug} className={styles.info}>
          <p className={styles.meta}>
            <span className={styles.n}>{s.n}</span>
            <span className="meta">{s.group}</span>
          </p>
          <h2 className={styles.name}>{s.name}</h2>
          <p className={styles.headline}>{s.headline}</p>
          <ul role="list" className={styles.caps}>
            {s.capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button href={`/services/${s.slug}`} size="sm">
            {explore} {s.name}
          </Button>
        </div>
      </aside>

      <div className={styles.gallery}>
        {services.map((sv, i) => (
          <article
            key={sv.slug}
            ref={(el) => {
              cards.current[i] = el;
            }}
            data-index={i}
            className={styles.card}
            data-on={i === active || undefined}
          >
            <TransitionLink href={`/services/${sv.slug}`} className={styles.cardLink} aria-label={sv.name} data-cta="">
              {sv.render && <Render name={sv.render.name} alt={sv.render.alt} sizes="(min-width: 960px) 52vw, 92vw" />}
            </TransitionLink>
            {/* On phones the panel is not sticky, so each card carries its own caption. */}
            <div className={styles.caption}>
              <span className={styles.n}>{sv.n}</span>
              <h3 className={styles.capName}>{sv.name}</h3>
              <p className="t-small">{sv.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
