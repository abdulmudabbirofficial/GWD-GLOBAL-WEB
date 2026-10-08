import { handler } from '@/server/http/handler';
import { enquiryInputSchema } from '@/server/modules/enquiries/schema';
import { createEnquiry } from '@/server/modules/enquiries/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp, userAgent } from '@/server/security/request';

/** Contact / project / club / sports enquiries from the public site. */
export const POST = handler({ rateLimit: RATE_LIMITS.enquiry, body: enquiryInputSchema, status: 201 }, ({ body, request, ip, log }) =>
  createEnquiry(body, { ipHash: hashIp(ip), userAgent: userAgent(request), log }),
);
