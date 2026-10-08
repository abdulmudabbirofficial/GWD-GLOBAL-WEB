import { Render } from '@/components/media/Render';
import { LitText } from '@/components/motion/LitText';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { TiltFrame } from '@/components/motion/TiltFrame';
import { TechStack } from '@/components/tech/TechStack';
import { Button } from '@/components/ui/Button';
import { TransitionLink } from '@/features/transition/TransitionLink';
import type { ServiceCapability } from '@/types/content';
import { DrawList } from './DrawList';
import styles from './ServiceDetail.module.css';

type Img = { name: string; alt: string } | undefined;

/** The labels every service page shares (edited in the admin as services.detail). */
export interface DetailCopy {
  back: string;
  request: string;
  talk: { label: string; href: string };
  promise: string;
  capabilities: string;
  capabilitiesTitle: string;
  deliverables: string;
  idealFor: string;
  tools: string;
  next: string;
}

/* A service page is the blueprint world: everything sits on dark glass over the drafting grid. */

export function ServiceHero(props: { n: string; total: string; group: string; name: string; headline: string; render: Img; request: string; copy: DetailCopy }) {
  return (
    <section className={styles.hero} aria-labelledby="service-title">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className={styles.crumbs}>
            <TransitionLink href="/services" className={styles.back}>
              {props.copy.back}
            </TransitionLink>
            <span className="meta">
              {props.n} / {props.total} · {props.group}
            </span>
          </p>
          <ScrambleText as="h1" id="service-title" text={props.name} className={styles.name} />
          <p className={`t-lead ${styles.headline}`}>{props.headline}</p>
          <div className={styles.actions}>
            <Button href={props.request}>{props.copy.request}</Button>
            <Button href={props.copy.talk.href} variant="outline">
              {props.copy.talk.label}
            </Button>
          </div>
        </div>
        {props.render && (
          <TiltFrame className={styles.heroMedia}>
            <Render name={props.render.name} alt={props.render.alt} sizes="(min-width: 960px) 46vw, 100vw" priority />
          </TiltFrame>
        )}
      </div>
    </section>
  );
}

export function Promise({ text, label }: { text: string; label: string }) {
  return (
    <section className={styles.promise} aria-label={label}>
      <div className="container">
        <p className="chapter-label">{label}</p>
        <LitText text={text} className={styles.promiseText} />
      </div>
    </section>
  );
}

export function Capabilities({ label, title, items }: { label: string; title: string; items: ServiceCapability[] }) {
  return (
    <section className={styles.caps} aria-labelledby="caps-title">
      <div className="container">
        <div className={styles.sectionHead}>
          <p className="chapter-label">{label}</p>
          <h2 id="caps-title" className="t-title">
            {title}
          </h2>
        </div>
        <DrawList items={items.map((c) => ({ title: c.title, body: c.detail }))} />
      </div>
    </section>
  );
}

export function Fit({
  deliverables,
  idealFor,
  technologies,
  copy,
}: {
  deliverables: string[];
  idealFor: string[];
  technologies: string[];
  copy: Pick<DetailCopy, 'deliverables' | 'idealFor' | 'tools'>;
}) {
  return (
    <section className={styles.fit} aria-label="What you get and who it is for">
      <div className={`container ${styles.fitGrid}`}>
        {deliverables.length > 0 && (
          <div className={styles.glass}>
            <p className="chapter-label">{copy.deliverables}</p>
            <ul role="list" className={styles.checks} data-fx="stagger">
              {deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        {idealFor.length > 0 && (
          <div className={styles.glass}>
            <p className="chapter-label">{copy.idealFor}</p>
            <ul role="list" className={styles.checks} data-fx="stagger">
              {idealFor.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        {technologies.length > 0 && (
          <div className={`${styles.glass} ${styles.stack}`}>
            <p className="chapter-label">{copy.tools}</p>
            <TechStack keys={technologies} />
          </div>
        )}
      </div>
    </section>
  );
}

export function NextService({ slug, name, n, render, label }: { slug: string; name: string; n: string; render: Img; label: string }) {
  return (
    <section className={styles.next} aria-label={label}>
      <div className="container">
        <TransitionLink href={`/services/${slug}`} className={styles.nextLink} data-cta="">
          <span className={styles.nextCopy}>
            <span className="chapter-label">{label}</span>
            <span className={styles.nextName}>{name}</span>
            <span className={`meta ${styles.nextN}`}>{n}</span>
          </span>
          {render && (
            <span className={styles.nextMedia}>
              <Render name={render.name} alt="" sizes="(min-width: 960px) 30vw, 70vw" />
            </span>
          )}
        </TransitionLink>
      </div>
    </section>
  );
}
