import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { fill } from '@/content/copy/fill';
import { EarthChapter } from '@/experience/home/EarthChapter';
import { ChapterExits, ClientAssembly, Finale, NetworkChapter, ProcessRoad, ServiceRing, TeamChapter, WorldHero } from '@/experience/home/HomeWorld';
import { ProductTilt } from '@/experience/home/ProductTilt';
import { PageShell } from '@/experience/kit/PageShell';
import { OrganizationJsonLd } from '@/layouts/OrganizationJsonLd';
import { formatStat } from '@/lib/format';
import { practiceNumber } from '@/lib/practices';
import { STATUS_LABEL } from '@/lib/products';
import { PRODUCT_RENDER, SERVICE_RENDER } from '@/lib/renders';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content, statsByKey } from '@/server/modules/content/service';
import styles from './home.module.css';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('home.seo');
  return { ...pageMetadata({ title, description, path: '/' }), title: { absolute: title } };
}

/*
 * Home is one journey through the GWD world: the mark in its exact colours
 * with GET WORK DONE beneath it, through the mark into the network of people,
 * round the ring of fifteen services, down the red road of how we work, up
 * over the world for the clients, out to the planet, round the team, and back
 * to the mark at the end. Each section below is a chapter of that journey;
 * every word and photo choice is editable in the admin (src/content/copy/home.ts).
 */
export default async function HomePage() {
  const [c, company, services, locations, products, clients, stats, album] = await Promise.all([
    siteCopy(),
    content.company(),
    content.services(),
    content.locations(),
    content.products(),
    content.organizations('client'),
    statsByKey('company'),
    content.gallery(),
  ]);
  const hero = c.doc('home.hero');
  const network = c.doc('home.network');
  const team = c.doc('home.team');
  const process = c.doc('home.process');
  const earth = c.doc('home.earth');
  const productsCopy = c.doc('home.products');

  const hq = locations.find((l) => l.isHq);
  const projects = stats.projects_delivered;
  const countries = locations.length;
  const vars = { projects: projects ? formatStat(projects) : undefined, countries };

  // Each fact names its number: a key in Stats, or "countries" (counted from Locations).
  const facts = network.facts.flatMap((f) => {
    if (f.stat === 'countries') return [{ value: countries, suffix: '', label: f.label, body: f.body }];
    const st = stats[f.stat];
    return st ? [{ value: st.value, suffix: st.suffix, label: f.label, body: f.body }] : [];
  });
  const teamFacts = network.facts.flatMap((f) => {
    const st = f.stat === 'core_team' || f.stat === 'freelance_network' ? stats[f.stat] : undefined;
    return st ? [{ value: formatStat(st), label: f.label }] : [];
  });

  const ring = services.map((s, i) => ({ slug: s.slug, n: practiceNumber(i), name: s.shortName || s.name, summary: s.summary, render: SERVICE_RENDER[s.slug]?.name ?? '' }));

  const byPhoto = new Map(album.map((p) => [p.slug, p]));
  const strip = team.photos.map((s) => byPhoto.get(s)).filter((p) => p !== undefined);
  const teamRing = team.ring.map((s) => byPhoto.get(s)).filter((p) => p !== undefined);

  return (
    <PageShell world="home" tone="dark" payload={{ ring: teamRing }}>
      <OrganizationJsonLd />
      <ChapterExits />
      <WorldHero
        title={hero.title}
        lead={fill(hero.lead, vars)}
        place={hq ? `${hq.city}, ${hq.country}` : `${company.city}, ${company.country}`}
        brandLine={hero.brandLine}
        scrollCue={hero.scrollCue}
      >
        <Button href={hero.primary.href}>{hero.primary.label}</Button>
        <Button href={hero.secondary.href} variant="outline">
          {hero.secondary.label}
        </Button>
      </WorldHero>

      <NetworkChapter label={network.label} title={network.title} facts={facts} />

      <ServiceRing items={ring} copy={c.doc('home.services')} />

      <ProcessRoad label={process.label} title={process.title} steps={process.steps} />

      {clients.length > 0 && <ClientAssembly label={c.doc('home.clients').label} title={fill(c.doc('home.clients').title, vars)} orgs={clients} />}

      <div data-zone="earth">
        <EarthChapter
          label={earth.label}
          title={fill(earth.title, vars)}
          lead={fill(earth.lead, vars)}
          places={locations.map((l) => ({ id: l.id, city: l.city, country: l.country, latitude: l.latitude, longitude: l.longitude, isHq: l.isHq }))}
        />
      </div>

      {strip.length > 0 && <TeamChapter copy={team} facts={teamFacts} photos={strip} />}

      <section className={styles.products} data-zone="products" aria-labelledby="home-products-title">
        <div className={`container ${styles.head}`}>
          <div>
            <p className="chapter-label">{productsCopy.label}</p>
            <h2 id="home-products-title" className={styles.productsTitle}>
              {productsCopy.title}
            </h2>
          </div>
          <p className="t-lead">{productsCopy.lead}</p>
        </div>
        <div className="container">
          <ProductTilt
            items={products.map((p) => ({
              slug: p.slug,
              name: p.name,
              category: p.category,
              tagline: p.tagline,
              status: STATUS_LABEL[p.status],
              href: p.href ?? `/products#${p.slug}`,
              render: PRODUCT_RENDER[p.slug],
            }))}
          />
        </div>
      </section>

      <Finale motto={company.motto} title={c.doc('home.finale').title} />
    </PageShell>
  );
}
