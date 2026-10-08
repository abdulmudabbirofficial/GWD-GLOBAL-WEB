import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { notFound } from '@/server/lib/errors';
import { audit } from '@/server/modules/audit/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const line = (max: number) => z.string().trim().min(1).max(max);
const companySchema = z
  .object({
    legalName: line(160),
    brandName: line(80),
    tagline: line(120),
    motto: line(160),
    foundedIdea: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM.'),
    incorporatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
    cin: line(21),
    gstin: line(15),
    locality: line(80),
    city: line(80),
    region: line(80),
    country: line(80),
    email: z.email().max(254).nullable(),
    phone: z.string().trim().max(32).nullable(),
    socials: z
      .array(z.object({ label: line(40), url: z.string().regex(/^https:\/\/[^\s<>"']+$/, 'Use an https:// link.').max(300) }).strict())
      .max(12),
  })
  .partial()
  .strict();

/** The company's legal and contact details (one record), shown in the footer, About and Contact. */
export const GET = handler({ auth: 'content:read', rateLimit: RATE_LIMITS.admin }, async () => {
  const [row] = await getDb().select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1));
  if (!row) throw notFound('Company profile');
  return row;
});

export const PATCH = handler<Record<string, never>, typeof companySchema>(
  { auth: 'content:publish', rateLimit: RATE_LIMITS.admin, body: companySchema, maxBodyBytes: 16 * 1024 },
  async ({ body, user, ip }) => {
    const [row] = await getDb()
      .update(schema.companyProfile)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.companyProfile.id, 1))
      .returning();
    if (!row) throw notFound('Company profile');
    revalidatePath('/', 'layout');
    await audit({ userId: user!.id, action: 'company.update', entity: 'company', entityId: '1', meta: { fields: Object.keys(body) }, ipHash: hashIp(ip) });
    return row;
  },
);
