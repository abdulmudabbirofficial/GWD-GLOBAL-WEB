import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { teamQuery } from '@/server/http/schemas';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

export const GET = handler({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE, query: teamQuery }, ({ query }) => content.team(query.group));
