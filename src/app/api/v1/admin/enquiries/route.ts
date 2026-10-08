import { handler } from '@/server/http/handler';
import { enquiryListQuerySchema } from '@/server/modules/enquiries/schema';
import { listEnquiries } from '@/server/modules/enquiries/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

export const GET = handler({ auth: 'enquiries:read', rateLimit: RATE_LIMITS.admin, query: enquiryListQuerySchema }, ({ query }) => listEnquiries(query));
