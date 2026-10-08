import { z } from 'zod';
import { handler, parseJsonBody } from '@/server/http/handler';
import { COLLECTION_NAMES, deleteFromCollection, resolveCollection, updateInCollection } from '@/server/modules/admin/collections';
import { enforcePublishing, revalidateCollection } from '@/server/modules/admin/publishing';
import { audit } from '@/server/modules/audit/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const params = z.object({ collection: z.enum(COLLECTION_NAMES as [string, ...string[]]), id: z.uuid() });
type Params = { collection: string; id: string };

export const PATCH = handler<Params>({ auth: 'content:write', rateLimit: RATE_LIMITS.admin, params }, async ({ params, request, user, ip }) => {
  const { updateSchema } = resolveCollection(params.collection);
  const data = enforcePublishing(user!, await parseJsonBody(request, updateSchema), 'update');
  const row = await updateInCollection(params.collection, params.id, data);
  revalidateCollection(params.collection);
  await audit({
    userId: user!.id,
    action: 'content.update',
    entity: params.collection,
    entityId: params.id,
    meta: { fields: Object.keys(data) },
    ipHash: hashIp(ip),
  });
  return row;
});

export const DELETE = handler<Params>({ auth: 'content:publish', rateLimit: RATE_LIMITS.admin, params }, async ({ params, user, ip }) => {
  await deleteFromCollection(params.collection, params.id);
  revalidateCollection(params.collection);
  await audit({ userId: user!.id, action: 'content.delete', entity: params.collection, entityId: params.id, ipHash: hashIp(ip) });
  return { deleted: true };
});
