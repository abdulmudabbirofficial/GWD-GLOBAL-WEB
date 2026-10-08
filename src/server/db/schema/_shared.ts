import { boolean, integer, timestamp } from 'drizzle-orm/pg-core';

/** Audit timestamps shared by every mutable table. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Editorial controls shared by every CMS-managed collection. */
export const editorial = { sortOrder: integer('sort_order').notNull().default(0), isPublished: boolean('is_published').notNull().default(true) };
