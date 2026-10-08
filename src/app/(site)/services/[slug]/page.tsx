import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/experience/kit/PageShell';
import { Capabilities, Fit, NextService, Promise as ServicePromise, ServiceHero } from '@/experience/services/ServiceDetail';
import { registerHref } from '@/features/register/intents';
import { PRACTICE_GROUPS, practiceNumber } from '@/lib/practices';
import { SERVICE_RENDER } from '@/lib/renders';
import { pageMetadata } from '@/lib/seo';
import { fill } from '@/content/copy/fill';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await content.services();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await content.service(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.shortName || service.name,
    description: `${service.headline || service.summary} ${service.summary}`.trim(),
    path: `/services/${slug}`,
  });
}

/**
 * One service, in the blueprint world: its diorama and decoded name, the
 * promise, what GWD does, what you get and who it suits, the tools behind
 * it, and the next service.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, services, c] = await Promise.all([content.service(slug), content.services(), siteCopy()]);
  if (!service) notFound();

  const i = services.findIndex((s) => s.slug === slug);
  const name = service.shortName || service.name;
  const next = services[(i + 1) % services.length]!;
  const copy = c.doc('services.detail');

  return (
    <PageShell world="service" tone="dark">
      <ServiceHero
        n={practiceNumber(i)}
        total={String(services.length).padStart(2, '0')}
        group={PRACTICE_GROUPS[service.group].title}
        name={name}
        headline={service.headline || service.summary}
        render={SERVICE_RENDER[slug]}
        request={registerHref('service', { service: slug })}
        copy={copy}
      />
      {service.description && <ServicePromise text={service.description} label={copy.promise} />}
      {service.capabilities.length > 0 && <Capabilities label={copy.capabilities} title={fill(copy.capabilitiesTitle, { name })} items={service.capabilities} />}
      {(service.deliverables.length > 0 || service.idealFor.length > 0 || service.technologies.length > 0) && (
        <Fit deliverables={service.deliverables} idealFor={service.idealFor} technologies={service.technologies} copy={copy} />
      )}
      <NextService slug={next.slug} name={next.shortName || next.name} n={practiceNumber((i + 1) % services.length)} render={SERVICE_RENDER[next.slug]} label={copy.next} />
    </PageShell>
  );
}
