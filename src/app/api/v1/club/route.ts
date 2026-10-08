import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/** Everything the GWD Club experience needs in one round trip. */
export const GET = handler({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE }, async () => {
  const [team, pillars, events, stats] = await Promise.all([
    content.team('club'),
    content.highlights('club_pillar'),
    content.events('club', true),
    content.stats('club'),
  ]);
  return { team, pillars, events, stats };
});
