import { asc, desc, eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { AppError, notFound } from '@/server/lib/errors';

/*
 * Declarative registry of CMS-managed collections. The admin API is generic
 * over this registry: validation, ordering and cache revalidation are defined
 * once per collection instead of once per endpoint.
 */

const slug = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.');
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
/** Relative paths or https URLs only, never `javascript:` or protocol-relative URLs. */
const href = z
  .string()
  .trim()
  .max(500)
  .refine((v) => (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\/[^\s]+$/.test(v), 'Use a site path ("/about") or an https:// URL.');
/** An uploaded image (/api/v1/media/…) or a published file under /media. */
const mediaUrl = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/api\/v1\/media\/[0-9a-f-]{36}$|^\/media\/[\w./-]+\.(webp|png|jpe?g|avif)$/, 'Upload an image or pick one from the library.')
  .refine((v) => !v.includes('..'), 'Invalid path.');
const editorial = { sortOrder: z.number().int().min(0).max(100_000).optional(), isPublished: z.boolean().optional() };
const isoDate = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

const collectionSchemas = {
  services: z.object({
    slug,
    name: text(80),
    shortName: z.string().trim().max(40).default(''),
    group: z.enum(['engineering', 'experience']).default('engineering'),
    summary: text(200),
    headline: z.string().trim().max(200).default(''),
    description: text(4000),
    capabilities: z
      .array(z.object({ title: text(80), detail: text(400) }).strict())
      .max(12)
      .default([]),
    deliverables: z.array(text(120)).max(20).default([]),
    idealFor: z.array(text(160)).max(10).default([]),
    technologies: z
      .array(z.string().regex(/^[a-z0-9]{1,40}$/))
      .max(40)
      .default([]),
    imageUrl: href.nullable().optional(),
    ...editorial,
  }),
  products: z.object({
    slug,
    name: text(80),
    category: text(120),
    tagline: text(200),
    description: text(4000),
    status: z.enum(['live', 'in_development', 'in_design', 'paused', 'ideation']),
    isFlagship: z.boolean().default(false),
    metrics: z
      .array(z.object({ value: text(24), label: text(60) }).strict())
      .max(4)
      .default([]),
    features: z.array(text(120)).max(16).default([]),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    href: href.nullable().optional(),
    ...editorial,
  }),
  team: z.object({
    slug,
    name: text(120),
    role: text(160),
    group: z.enum(['core', 'club']),
    tier: z.enum(['founder', 'executive', 'lead']),
    bio: optionalText(2000),
    photoUrl: href.nullable().optional(),
    ...editorial,
  }),
  organizations: z.object({
    slug,
    name: text(120),
    kind: z.enum(['client', 'government', 'ecosystem', 'sports_partner', 'sports_club']),
    logoUrl: href.nullable().optional(),
    websiteUrl: href.nullable().optional(),
    ...editorial,
  }),
  stats: z.object({
    key: z.string().regex(/^[a-z0-9_]{2,60}$/),
    group: z.enum(['company', 'sports', 'club']),
    value: z.number().finite(),
    decimals: z.number().int().min(0).max(4).default(0),
    prefix: z.string().max(8).default(''),
    suffix: z.string().max(8).default(''),
    label: text(80),
    description: optionalText(200),
    ...editorial,
  }),
  locations: z.object({
    city: text(80),
    country: text(80),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    timezone: z.string().refine((tz) => Intl.supportedValuesOf('timeZone').includes(tz) || tz === 'UTC', 'Unknown IANA time zone.'),
    isHq: z.boolean().default(false),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    ...editorial,
  }),
  highlights: z.object({
    group: z.enum(['operating_model', 'club_pillar', 'club_format', 'sports_module', 'sports_journey', 'sports_moat']),
    slug,
    title: text(120),
    summary: text(240),
    detail: optionalText(2000),
    metric: optionalText(40),
    ...editorial,
  }),
  recognitions: z.object({ title: text(120), detail: optionalText(240), ...editorial }),
  events: z.object({
    slug,
    title: text(160),
    summary: text(400),
    scope: z.enum(['company', 'club', 'sports']),
    startsAt: isoDate,
    endsAt: isoDate.nullable().optional(),
    venue: optionalText(200),
    registrationUrl: href.nullable().optional(),
    isPublished: z.boolean().optional(),
  }),
  announcements: z.object({
    title: text(160),
    body: text(600),
    href: href.nullable().optional(),
    startsAt: isoDate.nullable().optional(),
    endsAt: isoDate.nullable().optional(),
    isPublished: z.boolean().optional(),
  }),
  gallery: z.object({
    slug,
    url: mediaUrl,
    smallUrl: mediaUrl.nullable().optional(),
    width: z.number().int().min(1).max(20000),
    height: z.number().int().min(1).max(20000),
    tag: z.enum(['team', 'events', 'workshops']),
    alt: text(300),
    ...editorial,
  }),
  'ecosystem-entities': z.object({
    slug,
    name: text(80),
    kind: z.enum(['core', 'venture', 'community', 'capability', 'network']),
    summary: text(300),
    facts: z.array(text(120)).max(8).default([]),
    href: href.nullable().optional(),
    ...editorial,
  }),
} satisfies Record<string, z.ZodObject>;

export type CollectionName = keyof typeof collectionSchemas;
export const COLLECTION_NAMES = Object.keys(collectionSchemas) as CollectionName[];

interface CollectionConfig {
  table: PgTable & { id: PgColumn };
  order: PgColumn;
  /** Pages whose static output depends on this collection. */
  paths: string[];
}

const ALL = ['/', '/services', '/products', '/community', '/sports', '/about'];

const configs: Record<CollectionName, CollectionConfig> = {
  services: { table: schema.services, order: schema.services.sortOrder, paths: ['/', '/services', '/contact'] },
  products: { table: schema.products, order: schema.products.sortOrder, paths: ['/', '/products', '/sports'] },
  team: { table: schema.teamMembers, order: schema.teamMembers.sortOrder, paths: ['/about', '/community'] },
  organizations: { table: schema.organizations, order: schema.organizations.sortOrder, paths: ALL },
  stats: { table: schema.stats, order: schema.stats.sortOrder, paths: ALL },
  locations: { table: schema.locations, order: schema.locations.sortOrder, paths: ['/', '/about'] },
  highlights: { table: schema.highlights, order: schema.highlights.sortOrder, paths: ['/', '/community', '/sports'] },
  recognitions: { table: schema.recognitions, order: schema.recognitions.sortOrder, paths: ['/', '/about'] },
  events: { table: schema.events, order: schema.events.startsAt, paths: ['/community', '/sports'] },
  announcements: { table: schema.announcements, order: schema.announcements.createdAt, paths: ALL },
  gallery: { table: schema.galleryPhotos, order: schema.galleryPhotos.sortOrder, paths: ['/', '/community'] },
  'ecosystem-entities': { table: schema.ecosystemEntities, order: schema.ecosystemEntities.sortOrder, paths: ['/'] },
};

/**
 * Partial-update schema: every field optional and, crucially, with its
 * default removed, so a PATCH of one field can never reset the others to
 * their defaults. Unknown fields are rejected rather than silently dropped.
 */
function toUpdateSchema(schema: z.ZodObject) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => {
      const bare = field instanceof z.ZodDefault ? field.unwrap() : field;
      return [key, (bare as z.ZodType).optional()];
    }),
  );
  return z.object(shape).strict();
}

const updateSchemas = Object.fromEntries(Object.entries(collectionSchemas).map(([name, schema]) => [name, toUpdateSchema(schema)])) as Record<
  CollectionName,
  z.ZodObject
>;

export function resolveCollection(name: string) {
  if (!(name in collectionSchemas)) throw notFound('Collection');
  const key = name as CollectionName;
  const createSchema = collectionSchemas[key].strict();
  return { name: key, createSchema, updateSchema: updateSchemas[key], ...configs[key] };
}

type Row = Record<string, unknown>;

/*
 * Drizzle's builders are typed per table; the registry is intentionally
 * table-agnostic. Payloads are fully validated by the collection's Zod schema
 * before reaching these calls, so the widened types below are safe.
 */
export async function listCollection(name: string): Promise<Row[]> {
  const c = resolveCollection(name);
  const order = c.name === 'events' || c.name === 'announcements' ? desc(c.order) : asc(c.order);
  return (await getDb().select().from(c.table).orderBy(order)) as Row[];
}

export async function createInCollection(name: string, data: Row): Promise<Row> {
  const c = resolveCollection(name);
  try {
    const [row] = (await getDb()
      .insert(c.table)
      .values(data as never)
      .returning()) as Row[];
    return row!;
  } catch (error) {
    throw mapConstraintError(error);
  }
}

export async function updateInCollection(name: string, id: string, data: Row): Promise<Row> {
  const c = resolveCollection(name);
  if (!Object.keys(data).length) throw new AppError('BAD_REQUEST', 'Nothing to update.');
  try {
    const [row] = (await getDb()
      .update(c.table)
      .set(data as never)
      .where(eq(c.table.id, id))
      .returning()) as Row[];
    if (!row) throw notFound('Item');
    return row;
  } catch (error) {
    throw mapConstraintError(error);
  }
}

export async function deleteFromCollection(name: string, id: string): Promise<void> {
  const c = resolveCollection(name);
  const rows = (await getDb().delete(c.table).where(eq(c.table.id, id)).returning()) as Row[];
  if (!rows.length) throw notFound('Item');
}

function mapConstraintError(error: unknown): unknown {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  if (code === '23505') return new AppError('CONFLICT', 'An item with the same unique value already exists.');
  if (code === '23503') return new AppError('CONFLICT', 'This item is referenced by other content.');
  return error;
}
