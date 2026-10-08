import type { Metadata } from 'next';
import { fill } from '@/content/copy/fill';
import { AltimeterStory, People, PurposeStack, Registry, WindowHero, type Milestone } from '@/experience/about/AboutWorld';
import { PageShell } from '@/experience/kit/PageShell';
import { OrganizationJsonLd } from '@/layouts/OrganizationJsonLd';
import { formatIsoDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('about.seo');
  return pageMetadata({ title, description, path: '/about' });
}

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

/**
 * About is the ascent: an evening mountain behind the whole page, climbed as
 * you read where GWD came from, why it exists, who built it, and the
 * registered company behind the work. Every line is from the GWD Global deck,
 * editable in the admin (src/content/copy/about.ts), with live facts filled
 * in from the Company profile, Locations and Products.
 */
export default async function AboutPage() {
  const [c, company, core, recognitions, products, locations] = await Promise.all([
    siteCopy(),
    content.company(),
    content.team('core'),
    content.recognitions(),
    content.products(),
    content.locations(),
  ]);
  const hero = c.doc('about.hero');
  const story = c.doc('about.story');
  const purpose = c.doc('about.purpose');
  const people = c.doc('about.people');
  const registry = c.doc('about.company');

  // Side by side, as listed: Rahman (CEO) first, then Mudabbir.
  const founders = core.filter((m) => m.tier === 'founder');
  const members = core.filter((m) => m.tier !== 'founder');
  const notes = Object.fromEntries(people.notes.map((n) => [n.slug, n.note]));

  const live = products.find((p) => p.status === 'live');
  const upcoming = products.filter((p) => p.status !== 'live');
  const names = upcoming.map((p) => p.name);
  const vars = {
    legalName: company.legalName,
    city: company.city,
    region: company.region,
    locality: company.locality,
    founded: formatIsoDate(company.foundedIdea),
    incorporated: formatIsoDate(company.incorporatedOn),
    countries: locations.length,
    recognitions: recognitions.map((r) => r.title).join(' and '),
    live: live?.name ?? '',
    upcomingNames: names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''),
    upcomingCount: COUNT[upcoming.length] ?? String(upcoming.length),
    upcomingList: upcoming.map((p) => `${p.name}, ${p.tagline.replace(/\.$/, '').replace(/^./, (ch) => ch.toLowerCase())}`).join('; '),
  };

  // A milestone that speaks of something missing (no recognitions, no live product, nothing upcoming) is left out.
  const milestones: Milestone[] = story.milestones
    .filter((m) => !(m.body.includes('{recognitions}') && !recognitions.length))
    .filter((m) => !(m.title.includes('{live}') && !live))
    .filter((m) => !(m.title.includes('{upcomingNames}') && !upcoming.length))
    .map((m) => ({ when: fill(m.when, vars), title: fill(m.title, vars), body: fill(m.body, vars), highlight: /^(yes|true|1)$/i.test(m.highlight ?? '') }));

  return (
    <PageShell world="about" tone="dusk">
      <OrganizationJsonLd />
      <WindowHero
        label={hero.label}
        title={fill(hero.title, vars)}
        lead={fill(hero.lead, vars)}
        facts={[
          { value: vars.founded, label: hero.started },
          { value: vars.incorporated, label: hero.incorporated },
          { value: company.city, label: hero.headquarters },
        ]}
      />
      <AltimeterStory label={story.label} title={fill(story.title, vars)} milestones={milestones} />
      <PurposeStack
        mission={fill(purpose.mission, vars)}
        vision={fill(purpose.vision, vars)}
        stages={purpose.stages.map((s) => ({ label: fill(s.label, vars), statement: fill(s.statement, vars) }))}
      />
      <People label={people.label} title={people.title} boardTitle={people.boardTitle} founders={founders} members={members} notes={notes} />
      <Registry label={registry.label} title={fill(registry.title, vars)} company={company} locations={locations} />
    </PageShell>
  );
}
