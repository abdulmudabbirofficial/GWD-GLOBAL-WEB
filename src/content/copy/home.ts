import { PROCESS } from '@/content/process';
import { doc, seo } from './define';

const P = 'home' as const;

/** Home: the one-camera journey through the GWD world. */
export const homeCopy = {
  'home.seo': seo(
    P,
    'GWD Global - Get Work Done',
    'GWD Global designs, builds and runs software, platforms and digital products: 200+ projects delivered for businesses in ten countries, by a 50+ member team and 650+ curated freelancers. Fifteen services under one team.',
  ),
  'home.hero': doc(
    P,
    'Arrival',
    'Hero',
    {
      brandLine: 'Get Work Done',
      title: 'Software that gets work done.',
      lead: '{projects} projects delivered for businesses in {countries} countries. GWD Global designs, builds and runs software, platforms and digital products.',
      primary: { label: 'Send a brief', href: '?register=project' },
      secondary: { label: 'Explore services', href: '/services' },
      scrollCue: 'Scroll to enter',
    },
    '{projects} and {countries} fill in the live numbers from Stats and Locations.',
  ),
  'home.network': doc(
    P,
    'The network',
    'The people behind the work',
    {
      label: 'The network',
      title: 'The people behind the work.',
      facts: [
        { stat: 'core_team', label: 'Team members', body: 'At the core, working across GWD’s departments on its growth.' },
        { stat: 'freelance_network', label: 'Curated freelancers', body: 'Around the world, each one selected through an interview. No one simply signs up.' },
        { stat: 'projects_delivered', label: 'Projects delivered', body: 'Shipped and signed off, from local businesses to global enterprises.' },
        { stat: 'countries', label: 'Countries', body: 'Clients across the Gulf, Europe, South-East Asia and North America.' },
      ],
    },
    '“stat” is the key of a number in Stats (or “countries”, counted from Locations).',
  ),
  'home.services': doc(P, 'Services ring', 'Services ring', {
    label: 'Services',
    title: 'Fifteen services. One team.',
    explore: 'Explore',
    all: { label: 'All fifteen services', href: '/services' },
  }),
  'home.process': doc(P, 'How we work', 'The red road', {
    label: 'How we work',
    title: 'From a brief to software that keeps running.',
    steps: PROCESS.map((s) => ({ title: s.title, body: s.body })),
  }),
  'home.clients': doc(P, 'Clients', 'Client wall', { label: 'Clients', title: 'Trusted by teams in ten countries.' }),
  'home.earth': doc(P, 'Where we work', 'The globe', {
    label: 'Where we work',
    title: 'From Hyderabad to ten countries.',
    lead: 'The team works from Hyderabad with clients across the Gulf, Europe, South-East Asia and North America.',
  }),
  'home.team': doc(
    P,
    'The people',
    'Team and community',
    {
      label: 'The people',
      title: 'The people who get work done.',
      communityLabel: 'GWD Community',
      communityLine: 'Where students build for real: tech, startups and a direct line into industry, for students, by students.',
      primary: { label: 'Explore the community', href: '/community' },
      secondary: { label: 'About GWD', href: '/about' },
      photos: ['gwd-shirts', 'courtyard', 'club-launch-vjit', 'workshop-lab', 'team-turf'],
      ring: [
        'team-auditorium-above',
        'team-auditorium',
        'courtyard',
        'team-stairwell',
        'team-steps',
        'team-red-wall',
        'team-stairs',
        'team-portico',
        'team-turf',
        'community-hall',
        'team-campus',
        'gwd-shirts',
      ],
    },
    '“photos” is the strip beside the community line, “ring” the photos circling the 3D world. Both are album photos.',
  ),
  'home.products': doc(P, 'Products', 'Products', {
    label: 'Products',
    title: 'What we build for ourselves.',
    lead: 'Alongside client work, GWD builds and runs its own products. One is live today; the rest are on the way.',
  }),
  'home.finale': doc(P, 'Finale', 'The last word', { title: 'Let’s get work done.' }),
};
