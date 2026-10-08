import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { AppError } from '@/server/lib/errors';
import { audit } from '@/server/modules/audit/service';
import { revokeSessions, sessionCookieName } from '@/server/modules/auth/session';
import { hashPassword, verifyPassword } from '@/server/security/password';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(12, 'Use at least 12 characters.').max(256),
  })
  .strict();

/** Changes your own password, after checking the current one. Other devices are signed out. */
export const POST = handler<Record<string, never>, typeof changePasswordSchema>(
  { auth: 'authenticated', rateLimit: RATE_LIMITS.login, body: changePasswordSchema, maxBodyBytes: 2048 },
  async ({ body, user, request, ip }) => {
    const db = getDb();
    const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user!.id));
    if (!row || !(await verifyPassword(body.currentPassword, row.hash))) throw new AppError('VALIDATION_FAILED', 'Your current password is not right.');
    if (body.currentPassword === body.newPassword) throw new AppError('VALIDATION_FAILED', 'Choose a password you have not used here.');
    await db
      .update(schema.users)
      .set({ passwordHash: await hashPassword(body.newPassword), updatedAt: new Date() })
      .where(eq(schema.users.id, user!.id));
    await revokeSessions(user!.id, request.cookies.get(sessionCookieName())?.value);
    await audit({ userId: user!.id, action: 'auth.password_change', entity: 'user', entityId: user!.id, ipHash: hashIp(ip) });
    return { changed: true };
  },
);
