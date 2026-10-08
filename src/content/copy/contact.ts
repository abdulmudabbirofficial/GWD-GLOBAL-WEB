import { doc, seo } from './define';

const P = 'contact' as const;

export const contactCopy = {
  'contact.seo': seo(
    P,
    'Contact',
    'Brief a new build, request a service, join GWD Community, bring your academy or league to GWD Sports, or partner with GWD Global. Tell us what needs to get done.',
  ),
  'contact.hero': doc(P, 'Hero', 'Hero', {
    label: 'Contact',
    title: 'Tell us what needs doing.',
    lead: 'A project, a partnership, GWD Community, GWD Sports or a place in the network. It all starts with one message.',
    hq: 'Headquarters',
    time: 'Local time',
    email: 'Email',
  }),
  'contact.directory': doc(P, 'Direct forms', 'Direct forms', { label: 'Direct forms', title: 'Know what you need? Go straight to its form.' }),
};
