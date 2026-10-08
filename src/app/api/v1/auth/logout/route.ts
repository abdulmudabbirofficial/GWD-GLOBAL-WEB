import { clearedSessionCookie } from '@/server/http/cookies';
import { handler } from '@/server/http/handler';
import { destroySession, sessionCookieName } from '@/server/modules/auth/session';

export const POST = handler({}, async ({ request }) => {
  await destroySession(request.cookies.get(sessionCookieName())?.value);
  const response = Response.json({ data: { signedOut: true } }, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.append('Set-Cookie', clearedSessionCookie());
  return response;
});
