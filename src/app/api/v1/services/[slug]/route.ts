import { notFound } from '@/server/lib/errors';
import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { slugParam } from '@/server/http/schemas';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

export const GET = handler<{ slug: string }>({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE, params: slugParam }, async ({ params }) => {
  const item = await content.service(params.slug);
  if (!item) throw notFound('Service');
  return item;
});
