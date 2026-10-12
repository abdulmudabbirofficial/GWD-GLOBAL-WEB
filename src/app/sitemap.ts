import type { MetadataRoute } from 'next';
import { NAV, SITE_URL } from '@/lib/site';
import { content } from '@/server/modules/content/service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const services = await content.services();
  // A set: the navigation already includes '/', and listing the homepage twice
  // is noise in the one file search engines are given to trust.
  const pages = [...new Set(['/', ...NAV.map((n) => n.href), '/contact', ...services.map((s) => `/services/${s.slug}`)])];
  return pages.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/services/') ? 0.7 : path === '/contact' ? 0.6 : 0.8,
  }));
}
