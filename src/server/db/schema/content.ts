import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  timestamp,
  uuid,
  varchar,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { editorial, timestamps } from './_shared';

/* ───────────── enums ───────────── */

export const productStatus = pgEnum('product_status', ['live', 'in_development', 'in_design', 'paused', 'ideation']);
export const organizationKind = pgEnum('organization_kind', ['client', 'government', 'ecosystem', 'sports_partner', 'sports_club']);
export const teamGroup = pgEnum('team_group', ['core', 'club']);
export const teamTier = pgEnum('team_tier', ['founder', 'executive', 'lead']);
export const eventScope = pgEnum('event_scope', ['company', 'club', 'sports']);
export const highlightGroup = pgEnum('highlight_group', ['operating_model', 'club_pillar', 'club_format', 'sports_module', 'sports_journey', 'sports_moat']);
export const serviceGroup = pgEnum('service_group', ['engineering', 'experience']);
export const statGroup = pgEnum('stat_group', ['company', 'sports', 'club']);
export const ecosystemKind = pgEnum('ecosystem_kind', ['core', 'venture', 'community', 'capability', 'network']);
export const galleryTag = pgEnum('gallery_tag', ['team', 'events', 'workshops']);

/* ───────────── company ───────────── */

/** Singleton row (id = 1) holding legal and contact details. */
export const companyProfile = pgTable(
  'company_profile',
  {
    id: smallint('id').primaryKey().default(1),
    legalName: varchar('legal_name', { length: 160 }).notNull(),
    brandName: varchar('brand_name', { length: 80 }).notNull(),
    tagline: varchar('tagline', { length: 120 }).notNull(),
    motto: varchar('motto', { length: 160 }).notNull(),
    foundedIdea: varchar('founded_idea', { length: 7 }).notNull(),
    incorporatedOn: varchar('incorporated_on', { length: 10 }).notNull(),
    cin: varchar('cin', { length: 21 }).notNull(),
    gstin: varchar('gstin', { length: 15 }).notNull(),
    locality: varchar('locality', { length: 80 }).notNull(),
    city: varchar('city', { length: 80 }).notNull(),
    region: varchar('region', { length: 80 }).notNull(),
    country: varchar('country', { length: 80 }).notNull(),
    email: varchar('email', { length: 254 }),
    phone: varchar('phone', { length: 32 }),
    /** Ordered list of `{ label, url }`, validated at the API boundary. */
    socials: jsonb('socials').$type<{ label: string; url: string }[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [check('company_profile_singleton', sql`${t.id} = 1`)],
);

export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 60 }).notNull().unique(),
  group: statGroup('group').notNull().default('company'),
  value: numeric('value', { precision: 14, scale: 4, mode: 'number' }).notNull(),
  decimals: smallint('decimals').notNull().default(0),
  prefix: varchar('prefix', { length: 8 }).notNull().default(''),
  suffix: varchar('suffix', { length: 8 }).notNull().default(''),
  label: varchar('label', { length: 80 }).notNull(),
  description: varchar('description', { length: 200 }),
  ...editorial,
  ...timestamps,
});

export const recognitions = pgTable('recognitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 120 }).notNull().unique(),
  detail: varchar('detail', { length: 240 }),
  ...editorial,
  ...timestamps,
});

/* ───────────── offering ───────────── */

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    name: varchar('name', { length: 80 }).notNull(),
    shortName: varchar('short_name', { length: 40 }).notNull().default(''),
    group: serviceGroup('group').notNull().default('engineering'),
    summary: varchar('summary', { length: 200 }).notNull(),
    headline: varchar('headline', { length: 200 }).notNull().default(''),
    description: text('description').notNull(),
    capabilities: jsonb('capabilities').$type<{ title: string; detail: string }[]>().notNull().default([]),
    deliverables: text('deliverables')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    idealFor: text('ideal_for')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    technologies: text('technologies')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    imageUrl: varchar('image_url', { length: 300 }),
    ...editorial,
    ...timestamps,
  },
  (t) => [index('services_order_idx').on(t.isPublished, t.sortOrder)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    name: varchar('name', { length: 80 }).notNull(),
    category: varchar('category', { length: 120 }).notNull(),
    tagline: varchar('tagline', { length: 200 }).notNull(),
    description: text('description').notNull(),
    status: productStatus('status').notNull(),
    isFlagship: boolean('is_flagship').notNull().default(false),
    metrics: jsonb('metrics').$type<{ value: string; label: string }[]>().notNull().default([]),
    features: text('features')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    accent: varchar('accent', { length: 7 }).notNull().default('#D0021B'),
    href: varchar('href', { length: 300 }),
    ...editorial,
    ...timestamps,
  },
  (t) => [index('products_order_idx').on(t.isPublished, t.sortOrder)],
);

/* ───────────── people & organisations ───────────── */

export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 120 }).notNull(),
    role: varchar('role', { length: 160 }).notNull(),
    group: teamGroup('group').notNull(),
    tier: teamTier('tier').notNull(),
    bio: text('bio'),
    photoUrl: varchar('photo_url', { length: 500 }),
    ...editorial,
    ...timestamps,
  },
  (t) => [index('team_group_order_idx').on(t.group, t.isPublished, t.sortOrder)],
);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 120 }).notNull(),
    kind: organizationKind('kind').notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    websiteUrl: varchar('website_url', { length: 500 }),
    ...editorial,
    ...timestamps,
  },
  (t) => [index('organizations_kind_order_idx').on(t.kind, t.isPublished, t.sortOrder)],
);

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    city: varchar('city', { length: 80 }).notNull(),
    country: varchar('country', { length: 80 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    timezone: varchar('timezone', { length: 64 }).notNull(),
    isHq: boolean('is_hq').notNull().default(false),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    ...editorial,
    ...timestamps,
  },
  (t) => [uniqueIndex('locations_city_country_unique').on(t.city, t.countryCode)],
);

/* ───────────── editorial structures ───────────── */

/** Ordered, grouped highlights: operating-model steps, club pillars, sports modules. */
export const highlights = pgTable(
  'highlights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    group: highlightGroup('group').notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    title: varchar('title', { length: 120 }).notNull(),
    summary: varchar('summary', { length: 240 }).notNull(),
    detail: text('detail'),
    metric: varchar('metric', { length: 40 }),
    ...editorial,
    ...timestamps,
  },
  (t) => [uniqueIndex('highlights_group_slug_unique').on(t.group, t.slug), index('highlights_group_order_idx').on(t.group, t.isPublished, t.sortOrder)],
);

export const ecosystemEntities = pgTable('ecosystem_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 80 }).notNull(),
  kind: ecosystemKind('kind').notNull(),
  summary: varchar('summary', { length: 300 }).notNull(),
  facts: text('facts')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  href: varchar('href', { length: 300 }),
  ...editorial,
  ...timestamps,
});

export const ecosystemLinks = pgTable(
  'ecosystem_links',
  {
    fromId: uuid('from_id')
      .notNull()
      .references(() => ecosystemEntities.id, { onDelete: 'cascade' }),
    toId: uuid('to_id')
      .notNull()
      .references(() => ecosystemEntities.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.fromId, t.toId] }), check('ecosystem_links_no_self', sql`${t.fromId} <> ${t.toId}`)],
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    title: varchar('title', { length: 160 }).notNull(),
    summary: varchar('summary', { length: 400 }).notNull(),
    scope: eventScope('scope').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    venue: varchar('venue', { length: 200 }),
    registrationUrl: varchar('registration_url', { length: 500 }),
    isPublished: boolean('is_published').notNull().default(false),
    ...timestamps,
  },
  (t) => [index('events_scope_start_idx').on(t.scope, t.isPublished, t.startsAt)],
);

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 160 }).notNull(),
  body: varchar('body', { length: 600 }).notNull(),
  href: varchar('href', { length: 300 }),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isPublished: boolean('is_published').notNull().default(false),
  ...timestamps,
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  storageKey: varchar('storage_key', { length: 200 }).notNull().unique(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: varchar('alt', { length: 300 }).notNull().default(''),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────── site control (CMS) ───────────── */

/**
 * Overrides for the site's editable text, links and image slots. Keys and
 * defaults live in code (src/content/site-copy.ts); a row here replaces the
 * default for its key. `value` is a string for text and links, an array for
 * lists, and `{ url, width, height }` for images.
 */
export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 160 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** The community album: published photos appear on Community, Home and in the album backdrop. */
export const galleryPhotos = pgTable(
  'gallery_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    url: varchar('url', { length: 500 }).notNull(),
    smallUrl: varchar('small_url', { length: 500 }),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    tag: galleryTag('tag').notNull().default('events'),
    alt: varchar('alt', { length: 300 }).notNull(),
    ...editorial,
    ...timestamps,
  },
  (t) => [index('gallery_order_idx').on(t.isPublished, t.sortOrder)],
);
