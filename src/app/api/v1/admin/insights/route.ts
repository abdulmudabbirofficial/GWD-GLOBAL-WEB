import { and, desc, gte, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { RATE_LIMITS } from '@/server/security/rate-limit';

const querySchema = z.object({ days: z.coerce.number().int().min(1).max(400).default(30) });

/**
 * The admin overview: every call to action clicked and every form sent, by
 * page, over the last N days, plus the latest clicks as they come in.
 */
export const GET = handler({ auth: 'enquiries:read', rateLimit: RATE_LIMITS.admin, query: querySchema }, async ({ query }) => {
  const db = getDb();
  const since = new Date(Date.now() - query.days * 86_400_000);
  const c = schema.ctaClicks;
  const e = schema.enquiries;
  const inRange = gte(c.createdAt, since);
  const count = sql<number>`count(*)::int`;
  const visitors = sql<number>`count(distinct ${c.ipHash})::int`;

  const [actions, [totals], daily, devices, recent, forms] = await Promise.all([
    db
      .select({ cta: c.cta, page: c.page, label: sql<string | null>`max(${c.label})`, clicks: count, visitors, last: sql<Date>`max(${c.createdAt})`.mapWith(c.createdAt) })
      .from(c)
      .where(inRange)
      .groupBy(c.cta, c.page)
      .orderBy(sql`count(*) desc`)
      .limit(300),
    db.select({ clicks: count, visitors }).from(c).where(inRange),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${c.createdAt}), 'YYYY-MM-DD')`, clicks: count })
      .from(c)
      .where(inRange)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db.select({ device: c.device, clicks: count }).from(c).where(inRange).groupBy(c.device),
    db.select({ page: c.page, cta: c.cta, label: c.label, device: c.device, at: c.createdAt }).from(c).orderBy(desc(c.createdAt)).limit(40),
    db
      .select({
        intent: e.intent,
        page: e.sourcePath,
        sent: count,
        fresh: sql<number>`(count(*) filter (where ${e.status} = 'new'))::int`,
        last: sql<Date>`max(${e.createdAt})`.mapWith(e.createdAt),
      })
      .from(e)
      .where(and(gte(e.createdAt, since), ne(e.status, 'spam')))
      .groupBy(e.intent, e.sourcePath)
      .orderBy(sql`count(*) desc`),
  ]);

  return { days: query.days, totals: totals ?? { clicks: 0, visitors: 0 }, actions, daily, devices, recent, forms };
});
