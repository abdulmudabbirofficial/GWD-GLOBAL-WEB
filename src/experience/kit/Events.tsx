import { Button } from '@/components/ui/Button';
import { formatEventDate } from '@/lib/format';
import type { SiteEvent } from '@/types/content';
import styles from './Events.module.css';

interface EventsProps {
  events: SiteEvent[];
  title: string;
  lead: string;
  /** Without an empty state, the section is omitted when nothing is scheduled. */
  empty?: { title: string; body: string; action: { label: string; href: string } };
  tone?: 'dark' | 'pale';
  /** Let the page's live backdrop show through; the rows turn to glass. */
  seeThrough?: boolean;
  /** Sports speaks in its condensed matchday face. */
  voice?: 'stadium';
}

/**
 * Upcoming events from the CMS as large dated rows. With nothing scheduled it
 * says so plainly and offers the next step, never invented listings.
 */
export function Events({ events, title, lead, empty, tone = 'pale', seeThrough = false, voice }: EventsProps) {
  if (!events.length && !empty) return null;
  return (
    <section
      id="events"
      className={`chapter ${styles.events}`}
      data-tone={tone}
      data-sheet={!seeThrough || undefined}
      data-see-through={seeThrough || undefined}
      data-voice={voice}
      aria-labelledby="events-title"
    >
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">Events</p>
          <h2 id="events-title" className="t-title">
            {title}
          </h2>
          <p className="t-lead">{lead}</p>
        </div>
        {events.length ? (
          <ol role="list" className={styles.list} data-fx="stagger">
            {events.map((e) => (
              <li key={e.id} className={styles.event}>
                <time dateTime={e.startsAt} className={styles.date}>
                  {formatEventDate(e.startsAt)}
                </time>
                <div className={styles.body}>
                  <h3 className="t-h3">{e.title}</h3>
                  <p className="t-body">{e.summary}</p>
                  {e.venue && <p className="meta">{e.venue}</p>}
                </div>
                {e.registrationUrl && (
                  <Button href={e.registrationUrl} external={e.registrationUrl.startsWith('http')} variant="outline" size="sm">
                    Register
                  </Button>
                )}
              </li>
            ))}
          </ol>
        ) : empty ? (
          <div className={styles.empty}>
            <span className={styles.pulse} aria-hidden="true" />
            <div>
              <h3 className="t-h3">{empty.title}</h3>
              <p className="t-body">{empty.body}</p>
            </div>
            <Button href={empty.action.href} external={empty.action.href.startsWith('http')} variant="outline">
              {empty.action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
