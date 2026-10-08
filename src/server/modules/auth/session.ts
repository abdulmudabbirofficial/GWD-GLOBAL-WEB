import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, lt, ne } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { getDb, schema } from '@/server/db/client';
import type { Role } from '@/server/security/permissions';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** `__Host-` binds the cookie to our exact origin (Secure, Path=/, no Domain). */
export function sessionCookieName(): string {
  return env().NODE_ENV === 'production' ? '__Host-gwd_session' : 'gwd_session';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string, meta: { ipHash: string | null; userAgent: string | null }) {
  const db = getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  // Opportunistic cleanup keeps the table small without a cron job.
  await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, new Date())));
  await db.insert(schema.sessions).values({ id: digest(token), userId, expiresAt, ipHash: meta.ipHash, userAgent: meta.userAgent });
  return { token, expiresAt };
}

export async function resolveSession(token: string | undefined): Promise<AuthUser | null> {
  if (!token || token.length > 128) return null;
  const [row] = await getDb()
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, isActive: schema.users.isActive })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, digest(token)), gt(schema.sessions.expiresAt, new Date())));
  if (!row || !row.isActive) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  await getDb()
    .delete(schema.sessions)
    .where(eq(schema.sessions.id, digest(token)));
}

/** Signs a user out everywhere, except (optionally) the session making the change. */
export async function revokeSessions(userId: string, keepToken?: string) {
  const where = keepToken ? and(eq(schema.sessions.userId, userId), ne(schema.sessions.id, digest(keepToken))) : eq(schema.sessions.userId, userId);
  await getDb().delete(schema.sessions).where(where);
}
