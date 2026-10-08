import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { AppError } from '@/server/lib/errors';
import { dummyPasswordHash, verifyPassword } from '@/server/security/password';
import { createSession, type AuthUser } from './session';

export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(256),
});

const INVALID = () => new AppError('UNAUTHENTICATED', 'Email or password is incorrect.');

/**
 * Verifies credentials and opens a session. Unknown users still pay the cost
 * of a hash comparison so response timing does not reveal which emails exist.
 */
export async function login(input: z.infer<typeof loginSchema>, meta: { ipHash: string | null; userAgent: string | null }) {
  const db = getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, input.email));

  const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyPasswordHash()));
  if (!user || !valid || !user.isActive) throw INVALID();

  const session = await createSession(user.id, meta);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

  const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: authUser, ...session };
}
