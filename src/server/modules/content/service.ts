import 'server-only';
import { cache } from 'react';
import { contentSource } from '@/server/config/env';
import type { EventScope, HighlightGroup, OrganizationKind, StatGroup, TeamGroup } from '@/types/content';
import { databaseSource } from './database-source';
import { createResilientSource } from './resilient-source';
import { snapshotSource } from './snapshot-source';
import type { ContentSource } from './source';

const resilientDatabase = createResilientSource(databaseSource, snapshotSource);

/**
 * The single entry point for reading site content, used by server
 * components and the public API alike. Calls are memoised per request with
 * React `cache`, so a page that asks for the same collection in several
 * sections hits the database once.
 */
function source(): ContentSource {
  return contentSource() === 'database' ? resilientDatabase : snapshotSource;
}

export const content = {
  company: cache(() => source().company()),
  stats: cache((group?: StatGroup) => source().stats(group)),
  recognitions: cache(() => source().recognitions()),
  services: cache(() => source().services()),
  service: cache((slug: string) => source().service(slug)),
  products: cache(() => source().products()),
  product: cache((slug: string) => source().product(slug)),
  team: cache((group?: TeamGroup) => source().team(group)),
  organizations: cache((kind?: OrganizationKind) => source().organizations(kind)),
  locations: cache(() => source().locations()),
  highlights: cache((group: HighlightGroup) => source().highlights(group)),
  ecosystem: cache(() => source().ecosystem()),
  events: cache((scope?: EventScope, upcoming = false) => source().events({ scope, upcoming })),
  announcements: cache(() => source().announcements()),
  gallery: cache(() => source().gallery()),
  settings: cache(() => source().settings()),
};

/** Stats keyed by `key`, stats are few, so this is a cheap in-memory index. */
export async function statsByKey(group?: StatGroup) {
  const list = await content.stats(group);
  return Object.fromEntries(list.map((s) => [s.key, s]));
}
