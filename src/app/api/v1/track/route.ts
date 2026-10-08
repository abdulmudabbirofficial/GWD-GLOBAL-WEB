import { lt } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp, userAgent } from '@/server/security/request';

const clean = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

const trackSchema = z.object({
  page: z.string().max(200).regex(/^\/[^\s]*$/),
  cta: z.string().min(1).max(120).regex(/^[^\s<>"'`]+$/),
  label: z.string().max(400).transform((v) => clean(v).slice(0, 120)).optional(),
});

const device = (ua: string | null) => (!ua ? null : /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop');
const KEEP_DAYS = 400;

/**
 * Counts one click on a call to action (sent by the site's tracker as a
 * beacon). Anonymous: page, action, label and a device class; the salted IP
 * hash only lets the admin count unique visitors.
 */
export const POST = handler({ rateLimit: RATE_LIMITS.track, body: trackSchema, maxBodyBytes: 1024 }, async ({ body, request, ip }) => {
  const ua = userAgent(request);
  if (ua && /bot|crawler|spider|headless|lighthouse/i.test(ua)) return new Response(null, { status: 204 });
  const db = getDb();
  await db.insert(schema.ctaClicks).values({ page: body.page, cta: body.cta, label: body.label || null, device: device(ua), ipHash: hashIp(ip) });
  // Now and then, let go of clicks older than about a year.
  if (Math.random() < 0.01) await db.delete(schema.ctaClicks).where(lt(schema.ctaClicks.createdAt, new Date(Date.now() - KEEP_DAYS * 86_400_000)));
  return new Response(null, { status: 204 });
});
