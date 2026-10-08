import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { timestamps } from './_shared';

export const enquiryTopic = pgEnum('enquiry_topic', ['project', 'partnership', 'club', 'sports', 'careers', 'other']);
export const enquiryStatus = pgEnum('enquiry_status', ['new', 'in_progress', 'closed', 'spam']);

export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    company: varchar('company', { length: 160 }),
    topic: enquiryTopic('topic').notNull(),
    message: text('message').notNull(),
    /** Which "way in" the visitor used, e.g. `freelancer`, `academy` (null for the general contact form). */
    intent: varchar('intent', { length: 40 }),
    /** That registration's structured answers. */
    details: jsonb('details').$type<Record<string, string>>(),
    status: enquiryStatus('status').notNull().default('new'),
    sourcePath: varchar('source_path', { length: 200 }),
    /** Salted SHA-256 of the sender IP, enough for abuse analysis, not identification. */
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 300 }),
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('enquiries_status_created_idx').on(t.status, t.createdAt)],
);

/**
 * One click on a call to action on the public site: which page, which action
 * and what kind of device. Anonymous; the salted IP hash only counts unique
 * visitors and is never shown.
 */
export const ctaClicks = pgTable(
  'cta_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page: varchar('page', { length: 200 }).notNull(),
    /** What was clicked, e.g. `register:academy`, `link:/contact`, `social-instagram`. */
    cta: varchar('cta', { length: 120 }).notNull(),
    label: varchar('label', { length: 120 }),
    device: varchar('device', { length: 12 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cta_clicks_created_idx').on(t.createdAt), index('cta_clicks_cta_idx').on(t.cta, t.createdAt)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 60 }).notNull(),
    entity: varchar('entity', { length: 60 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_entity_idx').on(t.entity, t.entityId), index('audit_created_idx').on(t.createdAt)],
);
