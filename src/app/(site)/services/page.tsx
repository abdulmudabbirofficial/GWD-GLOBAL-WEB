import type { Metadata } from 'next';
import { SplitText } from '@/components/motion/SplitText';
import { PageShell } from '@/experience/kit/PageShell';
import { WaysIn } from '@/experience/kit/WaysIn';
import { ServiceShowcase } from '@/experience/services/ServiceShowcase';
import { practiceNumber } from '@/lib/practices';
import { SERVICE_RENDER } from '@/lib/renders';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';
import type { ServiceGroup } from '@/types/content';
import styles from './services.module.css';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('services.seo');
  return pageMetadata({ title, description, path: '/services' });
}

/*
 * Services is the modular world: a pale field of tiles that re-forms as you
 * scroll, the fifteen services as a walk-through gallery of their dioramas,
 * and the ways in.
 */
export default async function ServicesPage() {
  const [services, c] = await Promise.all([content.services(), siteCopy()]);
  const hero = c.doc('services.hero');
  const ways = c.doc('services.ways');
  const groupCopy = hero.groups as Record<ServiceGroup, { title: string; intro: string }>;
  const items = services.map((s, i) => ({
    slug: s.slug,
    n: practiceNumber(i),
    name: s.shortName || s.name,
    group: groupCopy[s.group].title,
    groupKey: s.group,
    summary: s.summary,
    headline: s.headline || s.summary,
    capabilities: s.capabilities.slice(0, 4).map((c) => c.title),
    render: SERVICE_RENDER[s.slug],
  }));
  const groups = (Object.keys(groupCopy) as ServiceGroup[]).map((key) => {
    const list = items.filter((s) => s.groupKey === key);
    return { key, title: groupCopy[key].title, intro: groupCopy[key].intro, range: `${list[0]?.n ?? ''}–${list[list.length - 1]?.n ?? ''}` };
  });

  return (
    <PageShell world="services" tone="pale">
      <section className={styles.hero} aria-labelledby="services-title">
        <div className="container">
          <p className="chapter-label">{hero.label}</p>
          <SplitText as="h1" id="services-title" text={hero.title} mode="chars" immediate className={styles.title} />
          <div className={styles.heroFoot}>
            <p className="t-lead">{hero.lead}</p>
            <dl className={styles.groups}>
              {groups.map((g) => (
                <div key={g.key}>
                  <dt className="meta">{g.range}</dt>
                  <dd>
                    <span className={styles.groupTitle}>{g.title}</span>
                    <span className="t-small">{g.intro}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className={styles.catalog} aria-label="All fifteen services">
        <div className="container">
          <ServiceShowcase services={items} explore={hero.explore} />
        </div>
      </section>

      <WaysIn
        label={ways.label}
        title={ways.title}
        lead={ways.lead}
        ways={[{ intent: 'service' }, { intent: 'project' }, { intent: 'freelancer' }]}
        sheet={false}
        seeThrough
      />
    </PageShell>
  );
}
