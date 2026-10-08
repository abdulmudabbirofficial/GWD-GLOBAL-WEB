'use client';

import { Fragment, useRef } from 'react';
import type { PassportScene } from '@/3d/scenes/passport';
import { useWorldView } from '@/3d/world/WorldCanvas';
import { Render } from '@/components/media/Render';
import { Button } from '@/components/ui/Button';
import styles from './SportsHero.module.css';

/**
 * GWD Sports opens under the floodlights: the title walks out word by word
 * from alternate touchlines while the Passport turns through its editions.
 */
interface HeroCopy {
  kicker: string;
  title: string;
  lead: string;
  proof: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

export function SportsHero({ copy }: { copy: HeroCopy }) {
  const { title, lead, proof } = copy;
  const stageRef = useRef<HTMLDivElement>(null);
  const { active } = useWorldView<PassportScene>(stageRef, () =>
    import('@/3d/scenes/passport').then((m) => (ctx) => m.createPassportScene(ctx, { mode: 'auto' })),
  );
  const words = title.split(' ');

  return (
    <section className={styles.hero} aria-labelledby="sports-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>
            <span className={styles.live} aria-hidden="true" />
            {copy.kicker}
          </p>
          <h1 id="sports-title" className={styles.title} aria-label={title}>
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className={styles.word} data-side={i % 2 ? 'r' : 'l'} style={{ animationDelay: `${0.15 + i * 0.07}s` }} aria-hidden="true">
                  {w}
                </span>
                {i < words.length - 1 && ' '}
              </Fragment>
            ))}
          </h1>
          <p className={`t-lead ${styles.lead}`}>{lead}</p>
          <div className={styles.actions}>
            <Button href={copy.primary.href}>{copy.primary.label}</Button>
            <Button href={copy.secondary.href} variant="outline">
              {copy.secondary.label}
            </Button>
          </div>
          <p className={`meta ${styles.proof}`}>{proof}</p>
        </div>
        <div ref={stageRef} className={styles.stage} aria-hidden="true">
          {!active && <Render name="prod-sports" alt="" sizes="(min-width: 960px) 45vw, 100vw" fill priority />}
        </div>
      </div>
    </section>
  );
}
