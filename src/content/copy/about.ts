import { doc, seo } from './define';

const P = 'about' as const;

/** About: the ascent. {tokens} fill from the Company profile, Locations and Products. */
export const aboutCopy = {
  'about.seo': seo(
    P,
    'About GWD',
    'GWD Global began as a student-led freelance initiative in March 2024 and was incorporated in Hyderabad on 12 June 2025. The story, the mission, and the people leading it.',
  ),
  'about.hero': doc(
    P,
    'Hero',
    'Hero',
    {
      label: 'About GWD',
      title: 'A student idea. A registered company.',
      lead: 'GWD began in March 2024 as a student-led freelance initiative and became {legalName} in June 2025. Today it builds for clients, and builds products of its own.',
      started: 'Where it started',
      incorporated: 'Incorporated',
      headquarters: 'Headquarters',
    },
    'Tokens: {legalName}, {city}, {founded}, {incorporated}.',
  ),
  'about.story': doc(
    P,
    'The road so far',
    'Milestones',
    {
      label: 'The road so far',
      title: 'From a student idea to a company with its own products.',
      milestones: [
        {
          when: '{founded}',
          title: 'A student initiative begins.',
          body: 'GWD starts as a student-led freelance collective: connecting young talent with real paid client work in tech, media, and digital.',
          highlight: '',
        },
        { when: 'Dec 2024', title: 'National recognition.', body: '{recognitions}, through E-Cell Bombay, before completing the first year.', highlight: '' },
        {
          when: '{incorporated}',
          title: 'Officially incorporated.',
          body: '{legalName} registered in {city}, {region} under the Ministry of Corporate Affairs. Office established in {locality}.',
          highlight: 'yes',
        },
        {
          when: '2025',
          title: 'GWD Community launches at VJIT.',
          body: 'Launched as GWD Club, in the biggest club inauguration of VJIT’s 25-year history, with Meraj Faheem (CEO, Telangana Innovation Cell) and Sadiya Sabira (CEO, Code for India) as chief guests.',
          highlight: '',
        },
        {
          when: '2025-2026',
          title: 'Agency to ecosystem.',
          body: 'Enterprise projects delivered for clients across {countries} countries, and the beginning of proprietary product building.',
          highlight: '',
        },
        {
          when: '2026',
          title: '{live} goes live.',
          body: 'The flagship product: the operating system for grassroots and youth sports, live with academies and leagues in Hyderabad.',
          highlight: 'yes',
        },
        { when: 'Next', title: '{upcomingNames}.', body: '{upcomingCount} more products on the way: {upcomingList}.', highlight: '' },
      ],
    },
    'Tokens: {founded}, {incorporated}, {legalName}, {city}, {region}, {locality}, {countries}, {recognitions}, {live}, {upcomingNames}, {upcomingCount}, {upcomingList}. “highlight” = yes marks a major milestone.',
  ),
  'about.purpose': doc(P, 'Mission & vision', 'Mission, vision and stages', {
    mission: 'Put skilled young talent and real client work in the same room, so businesses get capable, affordable teams that get work done.',
    vision: 'India’s largest student-led ecosystem: a network where talent is found, trained, paid and, eventually, turned into founders.',
    stages: [
      { label: 'Then · A student collective', statement: 'No funding, no office, no brand. Just people who could deliver and clients who needed delivery.' },
      { label: 'Now · A registered company', statement: '{legalName}, incorporated {incorporated} under the Ministry of Corporate Affairs, {city}.' },
      { label: 'Next · A product company', statement: 'Services fund the building. What gets built is what we own, and what compounds.' },
    ],
  }),
  'about.people': doc(
    P,
    'The people',
    'Founders and founding members',
    {
      label: 'The people',
      title: 'Two co-founders, and the founding members who built it with them.',
      boardTitle: 'Founding Members',
      notes: [
        { slug: 'mohammed-abdul-mudabbir', note: 'Also the founder of GWD Community, which began at VJIT as GWD Club.' },
        { slug: 'mohd-abdul-rahman-pasha', note: 'Also a co-founder of GWD Community, which began at VJIT as GWD Club.' },
      ],
    },
    'People, photos and roles are edited under Team. “notes” adds a line under a founder (by their slug).',
  ),
  'about.company': doc(P, 'The company', 'Registration', { label: 'The company', title: 'Registered in {city}. Working in {countries} countries.' }),
};
