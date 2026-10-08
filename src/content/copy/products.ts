import { doc, seo } from './define';

const P = 'products' as const;

/** The Products hall (each product's own content lives in the Products collection). */
export const productsCopy = {
  'products.seo': seo(
    P,
    'Products',
    'The products GWD builds and runs for itself: GWD Sports, the operating system for grassroots and youth sports, NestBridge for property, Torqio for pre-owned mobility, and DreamX, instant fashion delivery from city stores.',
  ),
  'products.hero': doc(P, 'Hero', 'Hero', {
    label: 'Products',
    title: 'What we build',
    titleSecond: 'for ourselves.',
    lead: 'Alongside client work, GWD builds and runs its own products. The same team, the same process, with our own name on the result. Walk the hall.',
  }),
  'products.actions': doc(
    P,
    'Each product',
    'Buttons under each product',
    {
      explore: 'Explore {name}',
      demo: { label: 'Request a demo', href: '?register=demo' },
      ask: { label: 'Ask about {name}', href: '/contact' },
    },
    'A product with its own link gets “explore” and the demo button; the others get “ask”.',
  ),
  'products.close': doc(P, 'Closing', 'Closing', {
    title: 'Building a product of your own?',
    lead: 'We build products the way we build ours: scoped honestly, shipped in visible cycles, and run after launch.',
    primary: { label: 'Send a brief', href: '?register=project' },
    secondary: { label: 'Product Engineering', href: '/services/digital-product-engineering' },
  }),
};
