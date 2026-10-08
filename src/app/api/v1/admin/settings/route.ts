import { handler } from '@/server/http/handler';
import { settingsOverview } from '@/server/modules/admin/settings';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/** Every editable field (with its default), every image slot, and the admin's current changes. */
export const GET = handler({ auth: 'content:read', rateLimit: RATE_LIMITS.admin }, () => settingsOverview());
