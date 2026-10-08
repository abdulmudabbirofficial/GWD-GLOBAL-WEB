import { z } from 'zod';

/**
 * Validated server environment. Parsed lazily so that modules can be imported
 * during static analysis/builds without every variable being present, while
 * any code path that actually needs configuration fails fast and loudly.
 *
 * Intentionally free of `server-only` so CLI scripts (migrate/seed) can use it.
 */
const booleanString = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  /** Connections per process. Use 1 with the embedded dev server (single-session PGlite). */
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  CONTENT_SOURCE: z.preprocess(emptyToUndefined, z.enum(['database', 'snapshot']).optional()),
  ADMIN_EMAIL: z.preprocess(emptyToUndefined, z.email().optional()),
  ADMIN_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').optional()),
  IP_HASH_SALT: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  TRUST_PROXY: booleanString,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MEDIA_STORAGE_DIR: z.string().default('.data/uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).default(8),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.IP_HASH_SALT) {
    throw new Error('IP_HASH_SALT is required in production.');
  }
  cached = parsed.data;
  return cached;
}

/** Content is served from Postgres when configured, otherwise from the bundled snapshot. */
export function contentSource(): 'database' | 'snapshot' {
  const e = env();
  if (e.CONTENT_SOURCE) return e.CONTENT_SOURCE;
  return e.DATABASE_URL ? 'database' : 'snapshot';
}
