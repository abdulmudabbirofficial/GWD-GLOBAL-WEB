import type { Product } from '@/types/content';

/** GWD's own products, as listed in the GWD Global deck ("04 The Product Line"); GWD Sports per its product overview PDF. */
export const products: Omit<Product, 'id'>[] = [
  {
    slug: 'gwd-sports',
    name: 'GWD Sports',
    category: 'Grassroots and youth sports',
    tagline: 'The operating system for grassroots and youth sports.',
    description:
      'One platform for academies, tournaments and players: the Academy Operating System, the Tournament Operating System and a Sports Passport that every athlete owns. Free for academies, and live with academies and leagues in Hyderabad.',
    status: 'live',
    isFlagship: true,
    metrics: [
      { value: 'Live', label: 'Running in academies and leagues' },
      { value: '10', label: 'Clubs in the HSL Youth Cup' },
    ],
    features: [
      'Academy Operating System',
      'Tournament Operating System',
      'Universal Sports Passport',
      'QR and GPS attendance',
      'Automated fee collection',
      'WhatsApp parent updates',
      'Live auction room',
      'Touchline scoring',
    ],
    accent: '#1F8F5F',
    href: '/sports',
  },
  {
    slug: 'nestbridge',
    name: 'NestBridge',
    category: 'Real-estate platform',
    tagline: 'Buy, sell, rent and maintain property, in one place.',
    description:
      'A complete real-estate platform that sits in the middle of every property journey. It markets upcoming flats, homes and villas for sale and for rent, connects buyers, sellers, owners and tenants, and keeps the property running afterwards: rent collection, tenant records and maintenance. Digital first, with a local team on the ground for support.',
    status: 'in_development',
    isFlagship: false,
    metrics: [],
    features: ['Flats, homes and villas for sale', 'Properties for rent', 'Digital marketing for new projects', 'Rent collection and autopay', 'Tenant records', 'Maintenance tracking', 'On-ground local support'],
    accent: '#5B7FA6',
    href: null,
  },
  {
    slug: 'torqio',
    name: 'Torqio',
    category: 'Pre-owned mobility platform',
    tagline: 'Buy and sell vehicles, then keep them running.',
    description:
      'A platform for pre-owned cars, two-wheelers and commercial vehicles that does not stop at the sale. It finds the best mechanics near you, digitally, and gets spare parts to you fast by connecting the local spare-parts stores in your city into one system.',
    status: 'in_development',
    isFlagship: false,
    metrics: [],
    features: ['Pre-owned cars', 'Two-wheelers', 'Commercial vehicles', 'Find the best mechanics nearby', 'Spare parts from local stores', 'Vehicle verification'],
    accent: '#E0892B',
    href: null,
  },
  {
    slug: 'dreamx',
    name: 'DreamX',
    category: 'Instant fashion delivery',
    tagline: 'Your city’s clothing stores, delivered in 30 minutes.',
    description:
      'Instant delivery of clothing from the stores around you: local boutiques and the big-brand stores in your city, for men, women and kids. Stores get a digital storefront with their live inventory; customers browse what is actually on the shelf, order, and receive it in 30 to 40 minutes, or 30 minutes within a 3 to 4 km radius.',
    status: 'ideation',
    isFlagship: false,
    metrics: [],
    features: ['Local and big-brand stores', 'Live store inventory', 'Men, women and kids', '30-minute delivery within 3–4 km', '30 to 40 minutes across the city'],
    accent: '#B4005A',
    href: null,
  },
];
