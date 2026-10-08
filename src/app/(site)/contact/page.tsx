import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LocalTime } from '@/components/ui/LocalTime';
import { DropTitle, KeystrokeRelay, RippleGroup } from '@/experience/contact/ContactWorld';
import { PageShell } from '@/experience/kit/PageShell';
import { ContactForm } from '@/features/contact/ContactForm';
import { INTENT_GROUPS, intentByKey, registerHref } from '@/features/register/intents';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';
import styles from './contact.module.css';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('contact.seo');
  return pageMetadata({ title, description, path: '/contact' });
}

/**
 * Contact is still water: a dark surface behind the page that ripples under
 * the pointer and with every key typed into the form, from the field being
 * typed in. One message to the team, then every direct form by page.
 */
export default async function ContactPage() {
  const [c, company, services, locations] = await Promise.all([siteCopy(), content.company(), content.services(), content.locations()]);
  const hero = c.doc('contact.hero');
  const directory = c.doc('contact.directory');
  const hq = locations.find((l) => l.isHq);
  const serviceNames = Object.fromEntries(services.map((s) => [s.slug, s.shortName || s.name]));

  return (
    <PageShell world="contact" tone="dark">
      <section className={`chapter ${styles.hero}`} data-tone="dark" data-see-through aria-labelledby="contact-title">
        <div className={`container ${styles.grid}`}>
          <div className={styles.intro}>
            <p className="chapter-label">{hero.label}</p>
            <DropTitle id="contact-title" text={hero.title} className={styles.title} letterClass={styles.drop} />
            <p className="t-lead">{hero.lead}</p>
            <dl className={styles.details}>
              <div>
                <dt className="meta">{hero.hq}</dt>
                <dd>
                  {company.legalName}
                  <br />
                  {company.locality}, {company.city}, {company.region}
                </dd>
              </div>
              {hq && (
                <div>
                  <dt className="meta">{hero.time}</dt>
                  <dd>
                    <LocalTime timeZone={hq.timezone} /> IST
                  </dd>
                </div>
              )}
              {company.email && (
                <div>
                  <dt className="meta">{hero.email}</dt>
                  <dd>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <KeystrokeRelay className={styles.sheetWrap}>
            <div id="form" className={styles.sheet} data-tone="pale">
              <Suspense fallback={null}>
                <ContactForm services={serviceNames} />
              </Suspense>
            </div>
          </KeystrokeRelay>
        </div>
      </section>

      <section className={`chapter ${styles.directory}`} data-tone="dark" data-see-through aria-labelledby="directory-title">
        <div className="container">
          <div className={styles.dirHead}>
            <p className="chapter-label">{directory.label}</p>
            <h2 id="directory-title" className="t-title">
              {directory.title}
            </h2>
          </div>
          <RippleGroup className={styles.groups}>
            {INTENT_GROUPS.map((group) => (
              <div key={group.href} className={styles.group}>
                <TransitionLink href={group.href} className={styles.groupLabel}>
                  {group.label} →
                </TransitionLink>
                <ul role="list" className={styles.links}>
                  {group.intents.map((key) => {
                    const intent = intentByKey(key)!;
                    return (
                      <li key={key}>
                        <TransitionLink href={registerHref(key)} className={styles.link}>
                          <span className={styles.linkTitle}>{intent.title}</span>
                          <span className={styles.linkFor}>{intent.audience}</span>
                          <span className={styles.linkArrow} aria-hidden="true">
                            →
                          </span>
                        </TransitionLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </RippleGroup>
        </div>
      </section>
    </PageShell>
  );
}
