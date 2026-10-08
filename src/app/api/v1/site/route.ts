import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/** Company profile, headline stats, recognitions and operating locations. */
export const GET = handler({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE }, async () => {
  const [company, stats, recognitions, locations] = await Promise.all([
    content.company(),
    content.stats('company'),
    content.recognitions(),
    content.locations(),
  ]);
  return { company, stats, recognitions, locations };
});
