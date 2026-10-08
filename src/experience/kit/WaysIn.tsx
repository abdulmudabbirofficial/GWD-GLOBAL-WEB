import { Button } from '@/components/ui/Button';
import { intentByKey, registerHref, type IntentKey } from '@/features/register/intents';
import styles from './WaysIn.module.css';

interface WaysInProps {
  label: string;
  title: string;
  lead: string;
  ways: { intent: IntentKey; title?: string; cta?: string }[];
  tone?: 'dark' | 'pale';
  sheet?: boolean;
  /** Let the page's live backdrop show through; the cards turn to glass. */
  seeThrough?: boolean;
}

/** The ways to start with GWD from this page: each a short form that goes straight to the team. */
export function WaysIn({ label, title, lead, ways, tone = 'pale', sheet = true, seeThrough = false }: WaysInProps) {
  return (
    <section
      id="ways-in"
      className={`chapter ${styles.ways}`}
      data-tone={tone}
      data-sheet={sheet || undefined}
      data-see-through={seeThrough || undefined}
      aria-labelledby="ways-title"
    >
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="ways-title" className={`t-title ${styles.title}`}>
            {title}
          </h2>
          <p className="t-lead">{lead}</p>
        </div>
        <ul role="list" className={styles.grid} data-fx="stagger">
          {ways.map((w, i) => {
            const intent = intentByKey(w.intent);
            if (!intent) return null;
            return (
              <li key={w.intent} className={styles.card}>
                <span className={`meta ${styles.n}`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="t-h3">{w.title ?? intent.title}</h3>
                <p className="t-body">{intent.summary}</p>
                <p className={`meta ${styles.audience}`}>{intent.audience}</p>
                <Button href={registerHref(w.intent)} variant={i === 0 ? 'primary' : 'outline'} size="sm" className={styles.action}>
                  {w.cta ?? intent.cta}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
