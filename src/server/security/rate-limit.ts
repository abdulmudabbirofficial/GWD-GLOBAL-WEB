/**
 * Sliding-window rate limiting.
 *
 * The in-memory store is correct for a single Node process. For horizontally
 * scaled deployments, implement `RateLimitStore` on Redis/Upstash (same
 * interface) and register it with `setRateLimitStore` at startup.
 */
export interface RateLimitRule {
  /** Logical bucket name, e.g. "enquiry" or "login". */
  bucket: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest hit in the window expires. */
  resetSeconds: number;
}

export interface RateLimitStore {
  hit(key: string, rule: RateLimitRule, now: number): Promise<RateLimitResult>;
}

class MemoryStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private lastSweep = 0;

  async hit(key: string, rule: RateLimitRule, now: number): Promise<RateLimitResult> {
    this.sweep(now, rule.windowMs);
    const windowStart = now - rule.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    const allowed = timestamps.length < rule.limit;
    if (allowed) timestamps.push(now);
    this.hits.set(key, timestamps);
    const oldest = timestamps[0] ?? now;
    return {
      allowed,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - timestamps.length),
      resetSeconds: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)),
    };
  }

  /** Bounded memory: drop idle keys at most once a minute. */
  private sweep(now: number, windowMs: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, list] of this.hits) {
      if (!list.length || list[list.length - 1]! < now - windowMs) this.hits.delete(key);
    }
  }
}

const globalRef = globalThis as typeof globalThis & { __gwdRateLimitStore?: RateLimitStore };

export function setRateLimitStore(store: RateLimitStore) {
  globalRef.__gwdRateLimitStore = store;
}

export function rateLimit(rule: RateLimitRule, identifier: string): Promise<RateLimitResult> {
  globalRef.__gwdRateLimitStore ??= new MemoryStore();
  return globalRef.__gwdRateLimitStore.hit(`${rule.bucket}:${identifier}`, rule, Date.now());
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return { 'RateLimit-Limit': String(result.limit), 'RateLimit-Remaining': String(result.remaining), 'RateLimit-Reset': String(result.resetSeconds) };
}

export const RATE_LIMITS = {
  publicRead: { bucket: 'public-read', limit: 120, windowMs: 60_000 },
  enquiry: { bucket: 'enquiry', limit: 5, windowMs: 10 * 60_000 },
  login: { bucket: 'login', limit: 8, windowMs: 15 * 60_000 },
  admin: { bucket: 'admin', limit: 300, windowMs: 60_000 },
  upload: { bucket: 'upload', limit: 30, windowMs: 60 * 60_000 },
  track: { bucket: 'track', limit: 120, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;
