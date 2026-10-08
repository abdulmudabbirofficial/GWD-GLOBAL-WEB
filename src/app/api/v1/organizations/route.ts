import { handler, PUBLIC_CACHE } from '@/server/http/handler';
import { organizationQuery } from '@/server/http/schemas';
import { content } from '@/server/modules/content/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/** Clients, partners, network bodies and league clubs, filter with `?kind=`. */
export const GET = handler({ rateLimit: RATE_LIMITS.publicRead, cache: PUBLIC_CACHE, query: organizationQuery }, ({ query }) =>
  content.organizations(query.kind),
);
