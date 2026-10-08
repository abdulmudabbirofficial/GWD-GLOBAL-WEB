import 'server-only';
import { resetDb } from '@/server/db/client';
import { logger } from '@/server/lib/logger';
import type { ContentSource } from './source';

/*
 * Keeps the public site up during a database outage.
 *
 * Connectivity failures open a short circuit breaker; while it is open, reads
 * are answered from the version-controlled content snapshot instead of
 * waiting on connection timeouts query after query. Anything that is not a
 * connectivity problem (a bug, a bad query) is re-thrown so it gets fixed,
 * not masked.
 */
const BREAKER_MS = 15_000;
/** A half-open connection never errors on its own, bound every read. */
const QUERY_TIMEOUT_MS = 4_000;
const CONNECTIVITY_CODES = new Set([
  'QUERY_TIMEOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'CONNECT_TIMEOUT',
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  'CONNECTION_DESTROYED',
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
]);

let openUntil = 0;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`Content query exceeded ${ms}ms`), { code: 'QUERY_TIMEOUT' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function isConnectivityError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && CONNECTIVITY_CODES.has(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export function createResilientSource(primary: ContentSource, fallback: ContentSource): ContentSource {
  const wrap = <K extends keyof ContentSource>(key: K): ContentSource[K] =>
    (async (...args: unknown[]) => {
      const call = (source: ContentSource) => (source[key] as (...a: unknown[]) => Promise<unknown>)(...args);
      if (Date.now() < openUntil) return call(fallback);
      try {
        return await withTimeout(call(primary), QUERY_TIMEOUT_MS);
      } catch (error) {
        if (!isConnectivityError(error)) throw error;
        openUntil = Date.now() + BREAKER_MS;
        // Drop pooled sockets that may be half-open; the next attempt reconnects cleanly.
        void resetDb();
        logger.error('content.database_unreachable', { error, fallback: 'snapshot', retryInMs: BREAKER_MS, method: key });
        return call(fallback);
      }
    }) as ContentSource[K];

  return Object.fromEntries((Object.keys(primary) as (keyof ContentSource)[]).map((k) => [k, wrap(k)])) as unknown as ContentSource;
}
