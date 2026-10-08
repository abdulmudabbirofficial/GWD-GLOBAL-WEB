import { jsonLd } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { content } from '@/server/modules/content/service';

/** schema.org Organization + WebSite, built from the same content the page renders. */
export async function OrganizationJsonLd() {
  const [company, locations] = await Promise.all([content.company(), content.locations()]);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: company.legalName,
        alternateName: 'GWD, Get Work Done',
        slogan: company.tagline,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/gwd-mark.svg`,
        foundingDate: company.incorporatedOn,
        taxID: company.gstin,
        identifier: [{ '@type': 'PropertyValue', propertyID: 'CIN', value: company.cin }],
        address: { '@type': 'PostalAddress', addressLocality: `${company.locality}, ${company.city}`, addressRegion: company.region, addressCountry: 'IN' },
        areaServed: locations.map((l) => ({ '@type': 'Country', name: l.country })),
        ...(company.email ? { email: company.email } : {}),
        ...(company.socials.length ? { sameAs: company.socials.map((s) => s.url) } : {}),
      },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, publisher: { '@id': `${SITE_URL}/#organization` } },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}
