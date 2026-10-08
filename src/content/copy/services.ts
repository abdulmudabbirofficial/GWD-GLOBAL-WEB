import { PRACTICE_GROUPS } from '@/lib/practices';
import { doc, seo } from './define';

const P = 'services' as const;

/** The Services page and the fifteen service pages (their own content lives in the Services collection). */
export const servicesCopy = {
  'services.seo': seo(
    P,
    'Services',
    'Fifteen GWD services under one team: Product Engineering, Enterprise Software, Websites & E-commerce, Mobile Apps, AI & Automation, Cloud & DevOps, Cybersecurity, Data & Analytics, APIs & Integrations, UX & Product Design, Branding & Marketing, 3D, Motion & VFX, Game Development, Tech Consulting and Managed Services.',
  ),
  'services.hero': doc(P, 'Hero', 'Hero', {
    label: 'Services',
    title: 'Fifteen services. One team.',
    lead: 'From the first line of code to the brand around it and the systems that keep it running. Pick one service, or bring us the whole build.',
    groups: {
      engineering: { title: PRACTICE_GROUPS.engineering.title, intro: PRACTICE_GROUPS.engineering.intro },
      experience: { title: PRACTICE_GROUPS.experience.title, intro: PRACTICE_GROUPS.experience.intro },
    },
    explore: 'Explore',
  }),
  'services.ways': doc(P, 'Ways in', 'Ways in', {
    label: 'Ways in',
    title: 'One service, a new build, or a seat in the network.',
    lead: 'Each is a short form that goes straight to the team. Not sure which service you need? Describe the problem and we will tell you.',
  }),
  'services.detail': doc(P, 'Each service page', 'Labels on every service page', {
    back: 'Services',
    request: 'Request this service',
    talk: { label: 'Talk to us', href: '/contact' },
    promise: 'The promise',
    capabilities: 'What we do',
    capabilitiesTitle: '{name}, in practice.',
    deliverables: 'What you get',
    idealFor: 'Who it suits',
    tools: 'The tools behind it',
    next: 'Next service',
  }),
};
