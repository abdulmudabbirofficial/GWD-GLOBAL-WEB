import { and, count, desc, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { notFound } from '@/server/lib/errors';
import type { Logger } from '@/server/lib/logger';
import { composeMessage, INTENT_GROUPS, intentByKey } from '@/features/register/intents';
import type { EnquiryInput, enquiryListQuerySchema } from './schema';

const MIN_HUMAN_MS = 2500;

export interface EnquiryMeta {
  ipHash: string | null;
  userAgent: string | null;
  log: Logger;
}

/**
 * Stores an enquiry. Obvious bots (honeypot filled, or submitted faster than
 * a person can type) receive the same success response but nothing is stored,
 * so they learn nothing from the reply.
 */
export async function createEnquiry(input: EnquiryInput, meta: EnquiryMeta): Promise<{ received: true }> {
  const isBot = Boolean(input.website) || (input.elapsedMs !== undefined && input.elapsedMs < MIN_HUMAN_MS);
  if (isBot) {
    meta.log.warn('enquiry.discarded_as_bot', { honeypot: Boolean(input.website), elapsedMs: input.elapsedMs });
    return { received: true };
  }

  // A registration carries structured answers. Keep them as data, and also
  // spell them out in the message so the inbox reads well without tooling.
  const intent = intentByKey(input.intent);
  const details = intent ? (input.details ?? {}) : null;
  const message = intent ? composeMessage(intent, details, input.message) : input.message;
  const organisation = intent?.fields.find((f) => f.organisation && details?.[f.name]);

  const [row] = await getDb()
    .insert(schema.enquiries)
    .values({
      name: input.name,
      email: input.email,
      company: input.company ?? (organisation ? details?.[organisation.name] : null) ?? null,
      topic: intent?.topic ?? input.topic,
      message,
      intent: intent?.key ?? null,
      details,
      sourcePath: input.sourcePath ?? null,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
    })
    .returning({ id: schema.enquiries.id });

  // Extension point: notify the team (email, Slack, CRM) from here.
  meta.log.info('enquiry.created', { enquiryId: row?.id, topic: intent?.topic ?? input.topic, intent: intent?.key });
  return { received: true };
}

export async function listEnquiries(query: z.infer<typeof enquiryListQuerySchema>) {
  const db = getDb();
  const filters: SQL[] = [];
  if (query.status) filters.push(eq(schema.enquiries.status, query.status));
  if (query.group === 'general') filters.push(isNull(schema.enquiries.intent));
  else if (query.group) {
    const group = INTENT_GROUPS.find((g) => g.key === query.group)!;
    filters.push(inArray(schema.enquiries.intent, [...group.intents]));
  }
  const where = filters.length ? and(...filters) : undefined;
  const [items, totals, unread] = await Promise.all([
    db
      .select({
        id: schema.enquiries.id,
        name: schema.enquiries.name,
        email: schema.enquiries.email,
        company: schema.enquiries.company,
        topic: schema.enquiries.topic,
        message: schema.enquiries.message,
        intent: schema.enquiries.intent,
        details: schema.enquiries.details,
        status: schema.enquiries.status,
        sourcePath: schema.enquiries.sourcePath,
        createdAt: schema.enquiries.createdAt,
      })
      .from(schema.enquiries)
      .where(where)
      .orderBy(desc(schema.enquiries.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(schema.enquiries).where(where),
    // Unread ("new") counts per form, so the inbox can badge each page's group.
    db
      .select({ intent: schema.enquiries.intent, total: count() })
      .from(schema.enquiries)
      .where(eq(schema.enquiries.status, 'new'))
      .groupBy(schema.enquiries.intent),
  ]);
  const total = totals[0]?.total ?? 0;
  const newByIntent = Object.fromEntries(unread.map((r) => [r.intent ?? 'general', r.total]));
  return { items, page: query.page, pageSize: query.pageSize, total, pages: Math.ceil(total / query.pageSize), newByIntent };
}

export async function updateEnquiryStatus(id: string, status: (typeof schema.enquiries.$inferSelect)['status'], userId: string) {
  const [row] = await getDb()
    .update(schema.enquiries)
    .set({ status, handledBy: userId })
    .where(eq(schema.enquiries.id, id))
    .returning({ id: schema.enquiries.id, status: schema.enquiries.status });
  if (!row) throw notFound('Enquiry');
  return row;
}
