import { handler } from '@/server/http/handler';
import { idParam } from '@/server/http/schemas';
import { audit } from '@/server/modules/audit/service';
import { enquiryUpdateSchema } from '@/server/modules/enquiries/schema';
import { updateEnquiryStatus } from '@/server/modules/enquiries/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

export const PATCH = handler<{ id: string }, typeof enquiryUpdateSchema>(
  { auth: 'enquiries:write', rateLimit: RATE_LIMITS.admin, params: idParam, body: enquiryUpdateSchema },
  async ({ params, body, user, ip }) => {
    const updated = await updateEnquiryStatus(params.id, body.status, user!.id);
    await audit({ userId: user!.id, action: 'enquiry.status', entity: 'enquiry', entityId: params.id, meta: { status: body.status }, ipHash: hashIp(ip) });
    return updated;
  },
);
