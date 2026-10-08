import { z } from 'zod';
import { handler } from '@/server/http/handler';
import { resetSetting, saveSetting } from '@/server/modules/admin/settings';
import { audit } from '@/server/modules/audit/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const params = z.object({ key: z.string().regex(/^[a-z0-9._:-]{2,160}$/i) });
const body = z.object({ value: z.unknown() });
type Params = { key: string };

/** Saves one field. Changes go live at once, so this needs publishing rights. */
export const PUT = handler<Params, typeof body>(
  { auth: 'content:publish', rateLimit: RATE_LIMITS.admin, params, body, maxBodyBytes: 256 * 1024 },
  async ({ params, body, user, ip }) => {
    const saved = await saveSetting(params.key, body.value, user!.id);
    await audit({ userId: user!.id, action: 'settings.update', entity: 'setting', entityId: params.key.slice(0, 100), ipHash: hashIp(ip) });
    return saved;
  },
);

/** Puts a field back to its default. */
export const DELETE = handler<Params>({ auth: 'content:publish', rateLimit: RATE_LIMITS.admin, params }, async ({ params, user, ip }) => {
  const r = await resetSetting(params.key);
  await audit({ userId: user!.id, action: 'settings.reset', entity: 'setting', entityId: params.key.slice(0, 100), ipHash: hashIp(ip) });
  return r;
});
