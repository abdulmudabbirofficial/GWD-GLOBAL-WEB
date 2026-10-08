import 'server-only';
import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';
import { AppError, forbidden, unauthenticated, type FieldIssue } from '@/server/lib/errors';
import { logger, type Logger } from '@/server/lib/logger';
import { resolveSession, sessionCookieName, type AuthUser } from '@/server/modules/auth/session';
import { can, type Permission } from '@/server/security/permissions';
import { rateLimit, rateLimitHeaders, type RateLimitRule } from '@/server/security/rate-limit';
import { clientIp, isSameOrigin } from '@/server/security/request';

type Schema = z.ZodType;
type Infer<S> = S extends Schema ? z.infer<S> : undefined;

interface Options<B extends Schema | undefined, Q extends Schema | undefined> {
  /** Required permission, or "authenticated" for any signed-in user. */
  auth?: Permission | 'authenticated';
  rateLimit?: RateLimitRule;
  body?: B;
  query?: Q;
  /** Validates dynamic route segments; a mismatch is reported as 404. */
  params?: Schema;
  /** Cache-Control for successful responses. Defaults to `no-store`. */
  cache?: string;
  /** HTTP status for successful JSON responses. */
  status?: number;
  maxBodyBytes?: number;
}

export interface HandlerContext<B, Q, P> {
  request: NextRequest;
  requestId: string;
  params: P;
  body: B;
  query: Q;
  user: AuthUser | null;
  ip: string;
  log: Logger;
}

type RouteContext<P> = { params: Promise<P> };

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Wraps a route handler with the cross-cutting concerns every endpoint needs.
 * Handlers return plain data (wrapped as `{ data }`) or a full Response.
 */
export function handler<
  P extends Record<string, string | string[]> = Record<string, never>,
  B extends Schema | undefined = undefined,
  Q extends Schema | undefined = undefined,
>(options: Options<B, Q>, fn: (ctx: HandlerContext<Infer<B>, Infer<Q>, P>) => Promise<unknown>) {
  return async (request: NextRequest, route: RouteContext<P>): Promise<Response> => {
    const requestId = request.headers.get('x-request-id')?.slice(0, 64) || randomUUID();
    const log = logger.child({ requestId, method: request.method, path: request.nextUrl.pathname });
    const extraHeaders: Record<string, string> = { 'X-Request-Id': requestId };
    const started = performance.now();

    try {
      const ip = clientIp(request);

      if (options.rateLimit) {
        const result = await rateLimit(options.rateLimit, ip);
        Object.assign(extraHeaders, rateLimitHeaders(result));
        if (!result.allowed) {
          throw new AppError('RATE_LIMITED', 'Too many requests. Please try again shortly.', { headers: { 'Retry-After': String(result.resetSeconds) } });
        }
      }

      if (MUTATING.has(request.method) && !isSameOrigin(request)) {
        throw new AppError('FORBIDDEN', 'Cross-origin request rejected.');
      }

      let user: AuthUser | null = null;
      if (options.auth) {
        user = await resolveSession(request.cookies.get(sessionCookieName())?.value);
        if (!user) throw unauthenticated();
        if (options.auth !== 'authenticated' && !can(user.role, options.auth)) throw forbidden();
      }

      const rawParams = (await route.params) ?? {};
      if (options.params && !options.params.safeParse(rawParams).success) throw new AppError('NOT_FOUND', 'Not found.');
      const params = rawParams as P;
      const query = options.query ? parse(options.query, Object.fromEntries(request.nextUrl.searchParams)) : undefined;
      const body = options.body ? parse(options.body, await readJson(request, options.maxBodyBytes ?? 32_768)) : undefined;

      const result = await fn({ request, requestId, params, body: body as Infer<B>, query: query as Infer<Q>, user, ip, log });

      const response =
        result instanceof Response
          ? result
          : Response.json({ data: result ?? null }, { status: options.status ?? 200, headers: { 'Cache-Control': options.cache ?? 'no-store' } });
      for (const [k, v] of Object.entries(extraHeaders)) response.headers.set(k, v);
      log.info('request.complete', { status: response.status, ms: Math.round(performance.now() - started) });
      return response;
    } catch (error) {
      return errorResponse(error, requestId, extraHeaders, log);
    }
  };
}

function parse<S extends Schema>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const details: FieldIssue[] = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  throw new AppError('VALIDATION_FAILED', 'Some fields need attention.', { details });
}

async function readJson(request: NextRequest, maxBytes: number): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Expected an application/json body.');
  }
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new AppError('PAYLOAD_TOO_LARGE', 'Request body is too large.');
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw new AppError('PAYLOAD_TOO_LARGE', 'Request body is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError('BAD_REQUEST', 'Malformed JSON body.');
  }
}

export function errorResponse(error: unknown, requestId: string, headers: Record<string, string>, log: Logger): Response {
  const appError = error instanceof AppError ? error : new AppError('INTERNAL', 'Something went wrong on our side. Please try again.', { cause: error });

  if (appError.status >= 500) log.error('request.failed', { code: appError.code, error: appError.cause ?? error });
  else log.warn('request.rejected', { code: appError.code, status: appError.status });

  return Response.json(
    { error: { code: appError.code, message: appError.message, details: appError.details, requestId } },
    { status: appError.status, headers: { 'Cache-Control': 'no-store', ...headers, ...appError.headers } },
  );
}

/** Public, CDN-cacheable content responses. */
export const PUBLIC_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/** For endpoints whose body schema is chosen at runtime (e.g. per collection). */
export async function parseJsonBody<S extends Schema>(request: NextRequest, schema: S, maxBytes = 65_536): Promise<z.infer<S>> {
  return parse(schema, await readJson(request, maxBytes));
}
