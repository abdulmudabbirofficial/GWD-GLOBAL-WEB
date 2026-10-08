import { clearedSessionCookie, sessionCookie } from '@/server/http/cookies';
import { handler } from '@/server/http/handler';
import { audit } from '@/server/modules/audit/service';
import { login, loginSchema } from '@/server/modules/auth/service';
import { permissionsFor } from '@/server/security/permissions';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp, userAgent } from '@/server/security/request';

export const POST = handler({ rateLimit: RATE_LIMITS.login, body: loginSchema, maxBodyBytes: 2048 }, async ({ body, request, ip }) => {
  const ipHash = hashIp(ip);
  const { user, token, expiresAt } = await login(body, { ipHash, userAgent: userAgent(request) });
  await audit({ userId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ipHash });

  const response = Response.json({ data: { user, permissions: permissionsFor(user.role), expiresAt } }, { headers: { 'Cache-Control': 'no-store' } });
  // Replace any stale cookie before setting the new one (session fixation hygiene).
  response.headers.append('Set-Cookie', clearedSessionCookie());
  response.headers.append('Set-Cookie', sessionCookie(token, expiresAt));
  return response;
});
