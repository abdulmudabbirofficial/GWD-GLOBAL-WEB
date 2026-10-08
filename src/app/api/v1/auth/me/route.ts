import { handler } from '@/server/http/handler';
import { permissionsFor } from '@/server/security/permissions';

export const GET = handler({ auth: 'authenticated' }, async ({ user }) => ({ user, permissions: permissionsFor(user!.role) }));
