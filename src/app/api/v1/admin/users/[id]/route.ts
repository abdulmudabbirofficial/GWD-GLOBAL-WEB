import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { idParam } from '@/server/http/schemas';
import { AppError, notFound } from '@/server/lib/errors';
import { audit } from '@/server/modules/audit/service';
import { revokeSessions } from '@/server/modules/auth/session';
import { hashPassword } from '@/server/security/password';
import { ROLES } from '@/server/security/permissions';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(12, 'Use at least 12 characters.').max(256).optional(),
  })
  .strict();

/**
 * Edits a team account: rename, change role, deactivate or set a new
 * password. You cannot demote or deactivate yourself, only a super admin can
 * touch a super admin account, and the site always keeps at least one active
 * super admin. Deactivating an account or setting
 * its password signs it out everywhere.
 */
export const PATCH = handler<{ id: string }, typeof updateUserSchema>(
  { auth: 'users:manage', rateLimit: RATE_LIMITS.admin, params: idParam, body: updateUserSchema, maxBodyBytes: 4096 },
  async ({ params, body, user, ip }) => {
    const db = getDb();
    const [target] = await db.select().from(schema.users).where(eq(schema.users.id, params.id));
    if (!target) throw notFound('User');
    if (user!.role !== 'super_admin' && (target.role === 'super_admin' || body.role === 'super_admin')) {
      throw new AppError('FORBIDDEN', 'Only a super admin can change a super admin account.');
    }
    const self = target.id === user!.id;
    if (self && ((body.role && body.role !== target.role) || body.isActive === false)) {
      throw new AppError('FORBIDDEN', 'You cannot change your own role or deactivate yourself. Ask another super admin.');
    }
    const losingSuper = target.role === 'super_admin' && ((body.role && body.role !== 'super_admin') || body.isActive === false);
    if (losingSuper) {
      const others = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.role, 'super_admin'), eq(schema.users.isActive, true), ne(schema.users.id, target.id)));
      if (!others.length) throw new AppError('CONFLICT', 'The site needs at least one active super admin.');
    }
    const patch: Partial<typeof schema.users.$inferInsert> = {};
    if (body.name) patch.name = body.name;
    if (body.role) patch.role = body.role;
    if (body.isActive !== undefined) patch.isActive = body.isActive;
    if (body.password) patch.passwordHash = await hashPassword(body.password);
    if (!Object.keys(patch).length) throw new AppError('BAD_REQUEST', 'Nothing to update.');
    patch.updatedAt = new Date();
    const [row] = await db
      .update(schema.users)
      .set(patch)
      .where(eq(schema.users.id, target.id))
      .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, isActive: schema.users.isActive });
    if (body.isActive === false || (body.password && !self)) await revokeSessions(target.id);
    await audit({
      userId: user!.id,
      action: 'user.update',
      entity: 'user',
      entityId: target.id,
      meta: { fields: Object.keys(body).map((k) => (k === 'password' ? 'password(reset)' : k)) },
      ipHash: hashIp(ip),
    });
    return row;
  },
);
