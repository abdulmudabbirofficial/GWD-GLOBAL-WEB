import type { Highlight } from '@/types/content';

type Seed = Omit<Highlight, 'id'>;

/** The GWD operating model: how a brief becomes delivered work, products and ecosystem. */
const operatingModel: Seed[] = [
  {
    group: 'operating_model',
    slug: 'clients',
    title: 'Clients',
    summary: 'It starts with a brief.',
    detail: 'Enterprise and growth-stage clients across ten countries and three continents, from Accenture and FedEx to Unifonic and Synthesia.',
    metric: '10 countries',
  },
  {
    group: 'operating_model',
    slug: 'technology',
    title: 'Technology',
    summary: 'Scoped into a build.',
    detail: 'Fifteen practices under one roof (engineering, AI, cloud, security, data, design, growth and media), so a client briefs once.',
    metric: '15 practices',
  },
  {
    group: 'operating_model',
    slug: 'talent',
    title: 'Talent',
    summary: 'Staffed by people who show up.',
    detail: 'A 50+ member team across GWD’s departments, and a network of 650+ curated freelancers worldwide, each selected through an interview.',
    metric: '650+ network',
  },
  {
    group: 'operating_model',
    slug: 'execution',
    title: 'Execution',
    summary: 'Shipped, not promised.',
    detail: 'Work that leaves the building. More than 230 projects delivered since the idea took shape in March 2024.',
    metric: '230+ delivered',
  },
  {
    group: 'operating_model',
    slug: 'products',
    title: 'Products',
    summary: 'What we learn becomes product.',
    detail: 'GWD Sports is live and earning. NestBridge and Torqio are next in line.',
    metric: '3 ventures',
  },
  {
    group: 'operating_model',
    slug: 'ecosystems',
    title: 'Ecosystems',
    summary: 'And it compounds.',
    detail: 'GWD Community grows the next generation of builders, while T-Hub, TGIC and K-Tech back the build, feeding talent straight back into the loop.',
    metric: '9 network partners',
  },
];

/** What every member of GWD Community gets (from the club's general meeting deck). `metric` marks free benefits. */
const clubPillars: Seed[] = [
  {
    group: 'club_pillar',
    slug: 'real-projects',
    title: 'Training on real projects',
    summary: 'Learn on live work GWD Global Private Limited delivers for clients.',
    detail: 'Not case studies or dummy briefs: the projects the company is actually shipping, with the people shipping them.',
    metric: 'Free',
  },
  {
    group: 'club_pillar',
    slug: 'workshops',
    title: 'Technology workshops',
    summary: 'Hands-on sessions across different technologies.',
    detail: 'Run for members, across the disciplines GWD delivers: web, mobile, AI, design, cloud and more.',
    metric: 'Free',
  },
  {
    group: 'club_pillar',
    slug: 'internships',
    title: 'Internships',
    summary: 'Through our channels, and at GWD for genuine interest and talent.',
    detail: 'Placements through GWD’s channels and partner network, and internships with GWD itself for members who show real interest and talent.',
    metric: null,
  },
  {
    group: 'club_pillar',
    slug: 'industry-visits',
    title: 'Industry visits',
    summary: 'Companies and events. Every visit teaches something new.',
    detail: 'Inside companies to see how real work gets done, and at startup events, incubators and expos where the industry meets.',
    metric: null,
  },
  {
    group: 'club_pillar',
    slug: 'events-across-colleges',
    title: 'Events across colleges',
    summary: 'Exposure and a network on other Hyderabad campuses.',
    detail: 'The club co-hosts events on other campuses, so members build a network well beyond their own college.',
    metric: null,
  },
  {
    group: 'club_pillar',
    slug: 'idea-backing',
    title: 'Backing for your ideas',
    summary: 'Refinement, mentorship, network and investment.',
    detail: 'Any member or lead with a startup idea gets it pressure-tested, mentored by GWD’s founders, connected to the network and, if it proves itself, backed.',
    metric: null,
  },
];

/** GWD Sports, "One stack. Four layers." `detail` carries the layer's two tags. */
const sportsLayers: Seed[] = [
  {
    group: 'sports_module',
    slug: 'discovery',
    title: 'Discovery',
    summary: 'A public portal where parents actually find academies, the consumer entry point to the entire ecosystem.',
    detail: 'Search · Ranking',
    metric: 'Layer 01',
  },
  {
    group: 'sports_module',
    slug: 'identity',
    title: 'Identity',
    summary: 'The Student Sports Passport, a permanent, verifiable record of an athlete’s journey across every academy they train at.',
    detail: 'Passport · Verified',
    metric: 'Layer 02',
  },
  {
    group: 'sports_module',
    slug: 'operations',
    title: 'Operations',
    summary: 'The academy operating system: registration, attendance, fees, trainers, and parent visibility in one place.',
    detail: 'Attendance · Payments',
    metric: 'Layer 03',
  },
  {
    group: 'sports_module',
    slug: 'competition',
    title: 'Competition',
    summary: 'GWD Leagues and tournaments: structured competition with live brackets, standings, and real match data.',
    detail: 'Leagues · Live data',
    metric: 'Layer 04',
  },
];

/** GWD Sports, an athlete's path through the platform. */
const sportsJourney: Seed[] = [
  { group: 'sports_journey', slug: 'find', title: 'Find', summary: 'A parent searches and lands on a real academy profile.', detail: null, metric: '01' },
  {
    group: 'sports_journey',
    slug: 'enrol',
    title: 'Enrol',
    summary: 'Registration and fees run through the platform from day one.',
    detail: null,
    metric: '02',
  },
  {
    group: 'sports_journey',
    slug: 'train',
    title: 'Train',
    summary: 'Attendance, performance, and trainer notes are captured daily.',
    detail: null,
    metric: '03',
  },
  {
    group: 'sports_journey',
    slug: 'compete',
    title: 'Compete',
    summary: 'Match data flows into leagues, brackets, and standings.',
    detail: null,
    metric: '04',
  },
  { group: 'sports_journey', slug: 'carry', title: 'Carry', summary: 'It all lands in a passport the athlete keeps for life.', detail: null, metric: '05' },
];

/** GWD Sports, why the business compounds. */
const sportsMoat: Seed[] = [
  {
    group: 'sports_moat',
    slug: 'compounds',
    title: 'Subscription, not project',
    summary: 'An academy that runs registration, attendance, and fees on GWD Sports doesn’t churn. The platform becomes the way the business operates.',
    detail: null,
    metric: 'Why it compounds',
  },
  {
    group: 'sports_moat',
    slug: 'spreads',
    title: 'Parents pull it in',
    summary: 'Discovery brings parents to academies that are already on the platform. Every listed academy makes the next one easier to sign.',
    detail: null,
    metric: 'Why it spreads',
  },
  {
    group: 'sports_moat',
    slug: 'defends',
    title: 'The passport locks it in',
    summary: 'An athlete’s record lives across academies, not inside one. The longer the network runs, the harder the data layer is to replace.',
    detail: null,
    metric: 'Why it defends',
  },
];

/** GWD Club, "Three formats. Zero theory." */
const clubFormats: Seed[] = [
  {
    group: 'club_format',
    slug: 'gwd-induction',
    title: 'GWD Induction',
    summary:
      'A career reality check. What the market actually pays for, what it ignores, and the honest gap between where a student is and where they think they are. Uncomfortable by design, because the alternative is finding out at graduation.',
    detail: null,
    metric: 'Format 01 · Induction',
  },
  {
    group: 'club_format',
    slug: 'networking-nights',
    title: 'Networking Nights',
    summary:
      'Freelancers and founders in a room with invited industry people, to pitch their skills, trade value, and leave with actual opportunities. Not a panel discussion. A trading floor.',
    detail: null,
    metric: 'Format 02 · Connection',
  },
  {
    group: 'club_format',
    slug: 'behind-the-build',
    title: 'Behind The Build',
    summary:
      'A talent show for builders, with live audience voting. People demo what they’ve actually made, and the room decides. Public proof beats a private portfolio every time.',
    detail: null,
    metric: 'Format 03 · Competition',
  },
];

export const highlights: Seed[] = [...operatingModel, ...clubPillars, ...clubFormats, ...sportsLayers, ...sportsJourney, ...sportsMoat];
