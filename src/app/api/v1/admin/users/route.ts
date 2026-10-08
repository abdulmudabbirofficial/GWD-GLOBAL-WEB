import { asc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/server/db/client';
import { handler } from '@/server/http/handler';
import { AppError } from '@/server/lib/errors';
import { audit } from '@/server/modules/audit/service';
import { hashPassword } from '@/server/security/password';
import { ROLES } from '@/server/security/permissions';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

const createUserSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2).max(120),
  role: z.enum(ROLES),
  password: z.string().min(12, 'Use at least 12 characters.').max(256),
});

export const GET = handler({ auth: 'users:manage', rateLimit: RATE_LIMITS.admin }, () =>
  getDb()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      isActive: schema.users.isActive,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.createdAt)),
);

export const POST = handler(
  { auth: 'users:manage', rateLimit: RATE_LIMITS.admin, body: createUserSchema, status: 201, maxBodyBytes: 4096 },
  async ({ body, user, ip }) => {
    if (body.role === 'super_admin' && user!.role !== 'super_admin') throw new AppError('FORBIDDEN', 'Only a super admin can create another super admin.');
    try {
      const [created] = await getDb()
        .insert(schema.users)
        .values({ email: body.email, name: body.name, role: body.role, passwordHash: await hashPassword(body.password) })
        .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role });
      await audit({ userId: user!.id, action: 'user.create', entity: 'user', entityId: created!.id, meta: { role: body.role }, ipHash: hashIp(ip) });
      return created;
    } catch (error) {
      if ((error as { cause?: { code?: string } }).cause?.code === '23505' || (error as { code?: string }).code === '23505') {
        throw new AppError('CONFLICT', 'A user with this email already exists.');
      }
      throw error;
    }
  },
);
