import { createHash } from 'node:crypto';
import { env } from '@/server/config/env';

/**
 * Client IP. X-Forwarded-For is only trusted when TRUST_PROXY is enabled,
 * otherwise any caller could spoof it and escape rate limiting.
 */
export function clientIp(request: Request): string {
  if (env().TRUST_PROXY) {
    const forwarded = request.headers.get('x-forwarded-for');
    const first = forwarded?.split(',')[0]?.trim();
    if (first) return first;
    const real = request.headers.get('x-real-ip');
    if (real) return real.trim();
  }
  return 'direct';
}

export function hashIp(ip: string): string {
  const salt = env().IP_HASH_SALT ?? 'gwd-dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function userAgent(request: Request): string | null {
  return request.headers.get('user-agent')?.slice(0, 300) ?? null;
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests: the browser
 * always sends Origin on cross-origin POST/PATCH/DELETE, so requiring it to
 * match our own origin blocks forged requests. SameSite=Strict cookies add a
 * second layer.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Non-browser clients (curl, server-to-server) do not send Origin; they
    // also cannot ride on a victim's cookies, so there is nothing to forge.
    return request.headers.get('sec-fetch-site') === null;
  }
  const allowed = new Set([new URL(env().NEXT_PUBLIC_SITE_URL).origin, new URL(request.url).origin]);
  return allowed.has(origin);
}
