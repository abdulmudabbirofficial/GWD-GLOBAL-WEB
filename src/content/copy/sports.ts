import { SPORTS } from '@/content/sports';
import { doc, seo } from './define';

const P = 'sports' as const;

/** GWD Sports: from the GWD Sports product overview (see src/content/sports.ts). */
export const sportsCopy = {
  'sports.seo': seo(
    P,
    'GWD Sports',
    'GWD Sports is the operating system for grassroots and youth sports: academy operations, live tournament management and a Sports Passport every athlete owns. Free for academies, live in Hyderabad.',
  ),
  'sports.hero': doc(P, 'Hero', 'Hero', {
    kicker: 'GWD Sports · Live in Hyderabad',
    title: SPORTS.title as string,
    lead: SPORTS.lead as string,
    primary: { label: 'Host your academy', href: '?register=academy' },
    secondary: { label: 'Request a demo', href: '?register=demo' },
    proof: 'Powering the HSL Youth Cup and the Sreenidi Deccan Little Stars academy',
  }),
  'sports.problems': doc(P, 'The problem', 'The problem', {
    label: 'The problem',
    title: 'Youth sport runs in silos.',
    items: SPORTS.problems.map((p) => ({ title: p.title as string, body: p.body as string })),
  }),
  'sports.platform': doc(P, 'The platform', 'Three systems', {
    label: 'The platform',
    title: 'Three systems. One record for every player.',
    pillars: SPORTS.pillars.map((p) => ({
      key: p.key as string,
      name: p.name as string,
      line: p.line as string,
      render: { name: p.render.name as string, alt: p.render.alt as string },
      points: p.points.map((x) => ({ title: x.title as string, body: x.body as string })),
    })),
  }),
  'sports.passport': doc(P, 'The Sports Passport', 'The Sports Passport', {
    label: 'The Sports Passport',
    title: SPORTS.passport.title as string,
    body: SPORTS.passport.body as string,
    facts: SPORTS.passport.facts.map((f) => ({ value: f.value as string, label: f.label as string })),
    editions: SPORTS.passport.editions.map((e) => e as string),
    note: 'Sample card. Ratings on real cards come from verified match events.',
  }),
  'sports.promise': doc(P, 'The partner promise', 'The partner promise', {
    label: 'The partner promise',
    title: SPORTS.promise.title as string,
    body: SPORTS.promise.body as string,
    facts: SPORTS.promise.facts.map((f) => ({ value: f.value as string, label: f.label as string })),
  }),
  'sports.deployments': doc(P, 'Live today', 'Deployments', {
    label: 'Live today',
    title: 'Running on real pitches.',
    hint: 'Drag to look through',
    items: SPORTS.deployments.map((d) => ({
      name: d.name as string,
      org: d.org as string,
      crest: d.crest as string,
      body: d.body as string,
      facts: d.facts.map((f) => ({ value: f.value as string, label: f.label as string })),
    })),
  }),
  'sports.auction': doc(P, 'Auction night', 'The auction films', {
    label: 'Behind the scenes',
    title: 'The night it went live.',
    lead: 'GWD Sports went live for the first time at the HSL U16 auction, hosted by the Hyderabad Super League in collaboration with GWD, with the clubs bidding for their players on the platform.',
    play: 'Play with sound',
    clips: [
      {
        key: 'bts',
        src: '/media/sports/hsl-auction-behind-the-scenes.mp4',
        poster: '/media/sports/hsl-auction-behind-the-scenes.jpg',
        title: 'HSL U16 auctions on GWD Sports',
        note: 'Behind the scenes on auction night.',
        shape: 'wide',
      },
      {
        key: 'night',
        src: '/media/sports/hsl-auction-night.mp4',
        poster: '/media/sports/hsl-auction-night.jpg',
        title: 'Auction night',
        note: 'The room, the bids and the big screen.',
        shape: 'tall',
      },
    ],
  }),
  'sports.clubs': doc(P, 'Clubs', 'Club crests', {
    label: 'HSL Season 3',
    title: 'Ten clubs, one live league.',
    lead: 'Every club in the Hyderabad Super League Youth Cup runs on the GWD Sports Tournament OS.',
  }),
  'sports.events': doc(
    P,
    'Events',
    'Upcoming events',
    {
      title: 'Matchdays, trials and tournaments.',
      lead: 'Upcoming GWD Sports events: tournaments, trials and academy days, each with its link to register.',
      emptyTitle: 'The next matchday is being scheduled.',
      emptyBody: 'Tournaments, trials and academy days are listed here as soon as they are confirmed. Follow GWD Sports for news in between.',
      empty: { label: 'Follow @gwdsports.in', href: 'https://www.instagram.com/gwdsports.in/' },
    },
    'The events themselves are added under Events (choose the GWD Sports page). The empty message shows when nothing is scheduled.',
  ),
  'sports.partners': doc(P, 'Who it is for', 'Partners', {
    label: 'Who it is for',
    title: 'Built for everyone around the game.',
    items: SPORTS.partners.map((p) => ({ who: p.who as string, what: p.what as string, terms: p.terms as string })),
  }),
  'sports.ways': doc(P, 'Ways in', 'Ways in', { label: 'Ways in', title: 'Bring your academy, league or school.', lead: 'A short form, then a call from the GWD Sports team.' }),
};
