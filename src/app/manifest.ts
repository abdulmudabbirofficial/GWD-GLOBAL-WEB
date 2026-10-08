import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GWD Global, Get Work Done',
    short_name: 'GWD',
    description: 'Technology, products and people, from Hyderabad, operating in ten countries.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07080b',
    theme_color: '#07080b',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
