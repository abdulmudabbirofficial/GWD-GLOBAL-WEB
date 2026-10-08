import * as snapshot from '@/content';
import photos from '@/content/community-photos.json';
import type { GalleryPhoto, GalleryTag } from '@/types/content';
import type { ContentSource } from './source';

/**
 * Serves the bundled content snapshot. Ids are derived from natural keys so
 * they stay stable across builds. Snapshot mode has no events/announcements:
 * those only exist once someone publishes them through the admin API.
 */
const withId = <T extends object>(items: T[], key: (item: T) => string) => items.map((item) => ({ id: key(item), ...item }));

const services = withId(snapshot.services, (s) => s.slug);
const products = withId(snapshot.products, (p) => p.slug);
const team = withId(snapshot.team, (m) => m.slug);
const organizations = withId(snapshot.organizations, (o) => o.slug);
const locations = withId(snapshot.locations, (l) => `${l.countryCode}-${l.city}`.toLowerCase());
const recognitions = withId(snapshot.recognitions, (r) => r.title);
const highlights = withId(snapshot.highlights, (h) => `${h.group}:${h.slug}`);
const entities = withId(snapshot.ecosystemEntities, (e) => e.slug);
const gallery: GalleryPhoto[] = photos.photos.map((p) => ({
  id: p.slug,
  slug: p.slug,
  url: `/media/community/${p.file}`,
  smallUrl: `/media/community/${p.file.replace('.webp', '-sm.webp')}`,
  width: p.w,
  height: p.h,
  tag: p.tag as GalleryTag,
  alt: p.alt,
}));

export const snapshotSource: ContentSource = {
  company: async () => snapshot.company,
  stats: async (group) => (group ? snapshot.stats.filter((s) => s.group === group) : snapshot.stats),
  recognitions: async () => recognitions,
  services: async () => services,
  service: async (slug) => services.find((s) => s.slug === slug) ?? null,
  products: async () => products,
  product: async (slug) => products.find((p) => p.slug === slug) ?? null,
  team: async (group) => (group ? team.filter((m) => m.group === group) : team),
  organizations: async (kind) => (kind ? organizations.filter((o) => o.kind === kind) : organizations),
  locations: async () => locations,
  highlights: async (group) => highlights.filter((h) => h.group === group),
  ecosystem: async () => ({ entities, links: snapshot.ecosystemLinks }),
  events: async () => [],
  announcements: async () => [],
  gallery: async () => gallery,
  settings: async () => ({}),
};
