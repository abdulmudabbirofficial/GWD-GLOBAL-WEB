import { and, asc, eq, gte, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, schema } from '@/server/db/client';
import { notFound } from '@/server/lib/errors';
import type { ContentSource } from './source';

const s = schema;
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/** Postgres-backed content. Every query filters to published rows. */
export const databaseSource: ContentSource = {
  async company() {
    const [row] = await getDb().select().from(s.companyProfile).where(eq(s.companyProfile.id, 1));
    if (!row) throw notFound('Company profile');
    return {
      legalName: row.legalName,
      brandName: row.brandName,
      tagline: row.tagline,
      motto: row.motto,
      foundedIdea: row.foundedIdea,
      incorporatedOn: row.incorporatedOn,
      cin: row.cin,
      gstin: row.gstin,
      locality: row.locality,
      city: row.city,
      region: row.region,
      country: row.country,
      email: row.email,
      phone: row.phone,
      socials: row.socials,
    };
  },

  async stats(group) {
    const where = group ? and(eq(s.stats.isPublished, true), eq(s.stats.group, group)) : eq(s.stats.isPublished, true);
    const rows = await getDb().select().from(s.stats).where(where).orderBy(asc(s.stats.sortOrder));
    return rows.map((r) => ({
      key: r.key,
      group: r.group,
      value: Number(r.value),
      decimals: r.decimals,
      prefix: r.prefix,
      suffix: r.suffix,
      label: r.label,
      description: r.description,
    }));
  },

  async recognitions() {
    const rows = await getDb().select().from(s.recognitions).where(eq(s.recognitions.isPublished, true)).orderBy(asc(s.recognitions.sortOrder));
    return rows.map((r) => ({ id: r.id, title: r.title, detail: r.detail }));
  },

  async services() {
    const rows = await getDb().select().from(s.services).where(eq(s.services.isPublished, true)).orderBy(asc(s.services.sortOrder));
    return rows.map(mapService);
  },

  async service(slug) {
    const [row] = await getDb()
      .select()
      .from(s.services)
      .where(and(eq(s.services.slug, slug), eq(s.services.isPublished, true)));
    return row ? mapService(row) : null;
  },

  async products() {
    const rows = await getDb().select().from(s.products).where(eq(s.products.isPublished, true)).orderBy(asc(s.products.sortOrder));
    return rows.map(mapProduct);
  },

  async product(slug) {
    const [row] = await getDb()
      .select()
      .from(s.products)
      .where(and(eq(s.products.slug, slug), eq(s.products.isPublished, true)));
    return row ? mapProduct(row) : null;
  },

  async team(group) {
    const where = group ? and(eq(s.teamMembers.isPublished, true), eq(s.teamMembers.group, group)) : eq(s.teamMembers.isPublished, true);
    const rows = await getDb().select().from(s.teamMembers).where(where).orderBy(asc(s.teamMembers.sortOrder));
    return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, role: r.role, group: r.group, tier: r.tier, bio: r.bio, photoUrl: r.photoUrl }));
  },

  async organizations(kind) {
    const where = kind ? and(eq(s.organizations.isPublished, true), eq(s.organizations.kind, kind)) : eq(s.organizations.isPublished, true);
    const rows = await getDb().select().from(s.organizations).where(where).orderBy(asc(s.organizations.sortOrder));
    return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, kind: r.kind, logoUrl: r.logoUrl, websiteUrl: r.websiteUrl }));
  },

  async locations() {
    const rows = await getDb().select().from(s.locations).where(eq(s.locations.isPublished, true)).orderBy(asc(s.locations.sortOrder));
    return rows.map((r) => ({
      id: r.id,
      city: r.city,
      country: r.country,
      countryCode: r.countryCode,
      timezone: r.timezone,
      isHq: r.isHq,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  },

  async highlights(group) {
    const rows = await getDb()
      .select()
      .from(s.highlights)
      .where(and(eq(s.highlights.group, group), eq(s.highlights.isPublished, true)))
      .orderBy(asc(s.highlights.sortOrder));
    return rows.map((r) => ({ id: r.id, group: r.group, slug: r.slug, title: r.title, summary: r.summary, detail: r.detail, metric: r.metric }));
  },

  async ecosystem() {
    const db = getDb();
    const entities = await db.select().from(s.ecosystemEntities).where(eq(s.ecosystemEntities.isPublished, true)).orderBy(asc(s.ecosystemEntities.sortOrder));
    const from = alias(s.ecosystemEntities, 'from_entity');
    const to = alias(s.ecosystemEntities, 'to_entity');
    const links = await db
      .select({ from: from.slug, to: to.slug })
      .from(s.ecosystemLinks)
      .innerJoin(from, eq(from.id, s.ecosystemLinks.fromId))
      .innerJoin(to, eq(to.id, s.ecosystemLinks.toId))
      .where(and(eq(from.isPublished, true), eq(to.isPublished, true)));
    return { entities: entities.map((e) => ({ id: e.id, slug: e.slug, name: e.name, kind: e.kind, summary: e.summary, facts: e.facts, href: e.href })), links };
  },

  async events(query = {}) {
    const conditions: SQL[] = [eq(s.events.isPublished, true)];
    if (query.scope) conditions.push(eq(s.events.scope, query.scope));
    if (query.upcoming) {
      const endOrStart = sql`coalesce(${s.events.endsAt}, ${s.events.startsAt})`;
      conditions.push(gte(endOrStart, sql`now()`));
    }
    const rows = await getDb()
      .select()
      .from(s.events)
      .where(and(...conditions))
      .orderBy(asc(s.events.startsAt))
      .limit(Math.min(query.limit ?? 50, 100));
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      scope: r.scope,
      startsAt: r.startsAt.toISOString(),
      endsAt: iso(r.endsAt),
      venue: r.venue,
      registrationUrl: r.registrationUrl,
    }));
  },

  async announcements() {
    const now = sql`now()`;
    const rows = await getDb()
      .select()
      .from(s.announcements)
      .where(
        and(
          eq(s.announcements.isPublished, true),
          or(isNull(s.announcements.startsAt), lte(s.announcements.startsAt, now)),
          or(isNull(s.announcements.endsAt), gte(s.announcements.endsAt, now)),
        ),
      )
      .orderBy(asc(s.announcements.createdAt));
    return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, href: r.href, startsAt: iso(r.startsAt), endsAt: iso(r.endsAt) }));
  },

  async gallery() {
    const rows = await getDb().select().from(s.galleryPhotos).where(eq(s.galleryPhotos.isPublished, true)).orderBy(asc(s.galleryPhotos.sortOrder));
    return rows.map((r) => ({ id: r.id, slug: r.slug, url: r.url, smallUrl: r.smallUrl, width: r.width, height: r.height, tag: r.tag, alt: r.alt }));
  },

  async settings() {
    const rows = await getDb().select({ key: s.siteSettings.key, value: s.siteSettings.value }).from(s.siteSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
};

function mapService(r: typeof s.services.$inferSelect) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortName: r.shortName || r.name,
    group: r.group,
    summary: r.summary,
    headline: r.headline,
    description: r.description,
    capabilities: r.capabilities,
    deliverables: r.deliverables,
    idealFor: r.idealFor,
    technologies: r.technologies,
    imageUrl: r.imageUrl,
  };
}

function mapProduct(r: typeof s.products.$inferSelect) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    tagline: r.tagline,
    description: r.description,
    status: r.status,
    isFlagship: r.isFlagship,
    metrics: r.metrics,
    features: r.features,
    accent: r.accent,
    href: r.href,
  };
}
