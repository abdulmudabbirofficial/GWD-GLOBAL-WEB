import { doc } from './define';

const P = 'global' as const;

const LINKEDIN = 'https://www.linkedin.com/company/gwd-global/';
const GWD_GLOBAL = { instagramUrl: 'https://www.instagram.com/gwd.global/', linkedinUrl: LINKEDIN };

/** Header, menu and footer: on every page. */
export const globalCopy = {
  'global.nav': doc(
    P,
    'Header & menu',
    'Main navigation',
    {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Products', href: '/products' },
        { label: 'GWD Sports', href: '/sports' },
        { label: 'Community', href: '/community' },
        { label: 'About', href: '/about' },
      ],
    },
    'Rename or reorder the main links. Links must be site paths like /about.',
  ),
  'global.actions': doc(
    P,
    'Header & menu',
    'The header button on each page',
    {
      home: { label: 'Get in touch', href: '/contact' },
      services: { label: 'Request a service', href: '?register=service' },
      service: { label: 'Request this service' },
      products: { label: 'Request a demo', href: '?register=demo' },
      sports: { label: 'Host your academy', href: '?register=academy' },
      community: { label: 'Join the community', href: '?register=member' },
      contact: { label: 'Write to us', href: '#form' },
      about: { label: 'Get in touch', href: '/contact' },
    },
    'Links can be a site path (/contact), a built-in form (?register=member) or an https:// link such as a Google Form.',
  ),
  'global.social': doc(
    P,
    'Social links',
    'Instagram and LinkedIn on each page',
    {
      home: GWD_GLOBAL,
      services: GWD_GLOBAL,
      products: GWD_GLOBAL,
      sports: { instagramUrl: 'https://www.instagram.com/gwdsports.in/', linkedinUrl: LINKEDIN },
      community: { instagramUrl: 'https://www.instagram.com/gwdclub.vjit/', linkedinUrl: LINKEDIN },
      about: GWD_GLOBAL,
      contact: GWD_GLOBAL,
    },
    'The small Instagram and LinkedIn icons in the corner and the footer of each page. Use full https:// links; leave one empty to hide that icon. Services also covers every service page.',
  ),
  'global.footer': doc(P, 'Footer', 'Footer', {
    label: 'Get work done',
    line: 'Have something to build? Tell us what it is.',
    cta: { label: 'Get in touch', href: '/contact' },
    exploreHeading: 'Explore',
    workHeading: 'Work with us',
    work: [
      { label: 'Request a service', href: '?register=service' },
      { label: 'Host your academy', href: '?register=academy' },
      { label: 'Join the community', href: '?register=member' },
      { label: 'Join as a freelancer', href: '?register=freelancer' },
    ],
    studioHeading: 'Studio',
    registeredHeading: 'Registered',
    brandLine: 'Get Work Done',
    rights: 'GWD Global Private Limited. All rights and copyrights reserved.',
    credit: 'Designed and developed by Mohammed Abdul Mudabbir.',
  }),
};
