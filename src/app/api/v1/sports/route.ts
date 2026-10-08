import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/** GWD Sports: product record, platform modules, partners, league clubs, traction. */
export const GET = handler({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE }, async () => {
  const [product, modules, partners, clubs, stats, events] = await Promise.all([
    content.product('gwd-sports'),
    content.highlights('sports_module'),
    content.organizations('sports_partner'),
    content.organizations('sports_club'),
    content.stats('sports'),
    content.events('sports', true),
  ]);
  return { product, modules, partners, clubs, stats, events };
});
