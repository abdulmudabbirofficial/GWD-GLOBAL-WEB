import { z } from 'zod';
import { handler, parseJsonBody } from '@/server/http/handler';
import { COLLECTION_NAMES, createInCollection, listCollection, resolveCollection } from '@/server/modules/admin/collections';
import { enforcePublishing, revalidateCollection } from '@/server/modules/admin/publishing';
import { audit } from '@/server/modules/audit/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const params = z.object({ collection: z.enum(COLLECTION_NAMES as [string, ...string[]]) });

/** Lists every item in a collection, drafts included. */
export const GET = handler<{ collection: string }>({ auth: 'content:read', rateLimit: RATE_LIMITS.admin, params }, ({ params }) =>
  listCollection(params.collection),
);

export const POST = handler<{ collection: string }>(
  { auth: 'content:write', rateLimit: RATE_LIMITS.admin, params, status: 201 },
  async ({ params, request, user, ip }) => {
    const { createSchema } = resolveCollection(params.collection);
    const data = enforcePublishing(user!, await parseJsonBody(request, createSchema), 'create');
    const row = await createInCollection(params.collection, data);
    revalidateCollection(params.collection);
    await audit({ userId: user!.id, action: 'content.create', entity: params.collection, entityId: String(row.id), ipHash: hashIp(ip) });
    return row;
  },
);
