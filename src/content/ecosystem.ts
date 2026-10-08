import type { EcosystemEntity, EcosystemLink } from '@/types/content';

/** Entities in the GWD ecosystem map and how they connect. */
export const ecosystemEntities: Omit<EcosystemEntity, 'id'>[] = [
  {
    slug: 'gwd-global',
    name: 'GWD Global',
    kind: 'core',
    summary: 'The parent company. Registered in Madhapur, Hyderabad on 12 June 2025.',
    facts: ['230+ projects delivered', '10 countries', '₹7.3Cr collective valuation & assets'],
    href: '/about',
  },
  {
    slug: 'technology',
    name: 'Technology',
    kind: 'capability',
    summary: 'The services division: fifteen practices across engineering, experience, growth and advisory.',
    facts: ['15 practices', '₹1.78Cr revenue booked'],
    href: '/services',
  },
  {
    slug: 'gwd-sports',
    name: 'GWD Sports',
    kind: 'venture',
    summary: 'Grassroots sports infrastructure. Live and earning.',
    facts: ['₹1.25L current MRR', '10 clubs on one live league'],
    href: '/sports',
  },
  {
    slug: 'ventures',
    name: 'Ventures',
    kind: 'venture',
    summary: 'Products built in-house: NestBridge (real estate and property) and Torqio (pre-owned mobility).',
    facts: ['NestBridge, 2026 launch', 'Torqio, Q3 target build'],
    href: '/products',
  },
  {
    slug: 'gwd-community',
    name: 'GWD Community',
    kind: 'community',
    summary: 'A non-commercial platform where students become professionals before they graduate, launched at VJIT.',
    facts: ['30+ team members', 'Launched at VJIT'],
    href: '/community',
  },
  {
    slug: 'talent',
    name: 'Talent',
    kind: 'community',
    summary: 'A 50+ member team and a network of 650+ curated, interviewed freelancers.',
    facts: ['650+ curated freelancers', '50+ team members'],
    href: '/about#leadership',
  },
  {
    slug: 'events',
    name: 'Events',
    kind: 'community',
    summary: 'Community built one event at a time, run by GWD’s event and production leads.',
    facts: ['GWD Community events', 'Sports tournaments'],
    href: '/community#events',
  },
  {
    slug: 'network',
    name: 'Network',
    kind: 'network',
    summary: 'Government innovation bodies, incubators and startup ecosystems backing the build.',
    facts: ['TGIC · T-Hub · K-Tech', 'Edventure Park · Studlyf · TG10X'],
    href: '/community#network',
  },
  {
    slug: 'clients',
    name: 'Clients',
    kind: 'network',
    summary: 'Enterprise and growth-stage clients across ten countries and three continents.',
    facts: ['24 clients & partners', 'India · GCC · Europe · North America · Singapore'],
    href: '/#clients',
  },
];

export const ecosystemLinks: EcosystemLink[] = [
  ...['technology', 'gwd-sports', 'ventures', 'gwd-community', 'talent', 'events', 'network', 'clients'].map((to) => ({ from: 'gwd-global', to })),
  { from: 'clients', to: 'technology' },
  { from: 'technology', to: 'ventures' },
  { from: 'technology', to: 'gwd-sports' },
  { from: 'talent', to: 'technology' },
  { from: 'gwd-community', to: 'talent' },
  { from: 'gwd-community', to: 'events' },
  { from: 'network', to: 'gwd-community' },
  { from: 'events', to: 'gwd-sports' },
];
