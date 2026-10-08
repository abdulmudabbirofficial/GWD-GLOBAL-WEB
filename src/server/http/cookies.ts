import 'server-only';
import { env } from '@/server/config/env';
import { sessionCookieName } from '@/server/modules/auth/session';

/** Session cookie: HttpOnly (no JS access), SameSite=Strict (CSRF), Secure in production. */
export function sessionCookie(token: string, expires: Date): string {
  const secure = env().NODE_ENV === 'production' ? '; Secure' : '';
  return `${sessionCookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; Expires=${expires.toUTCString()}${secure}`;
}

export function clearedSessionCookie(): string {
  const secure = env().NODE_ENV === 'production' ? '; Secure' : '';
  return `${sessionCookieName()}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
