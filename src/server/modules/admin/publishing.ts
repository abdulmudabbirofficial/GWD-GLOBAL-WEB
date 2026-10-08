import { revalidatePath } from 'next/cache';
import { forbidden } from '@/server/lib/errors';
import type { AuthUser } from '@/server/modules/auth/session';
import { can } from '@/server/security/permissions';
import { resolveCollection } from './collections';

/**
 * Editors may draft but not publish. Creating as an editor always yields a
 * draft; flipping `isPublished` requires `content:publish`.
 */
export function enforcePublishing<T extends Record<string, unknown>>(user: AuthUser, data: T, mode: 'create' | 'update'): T {
  if (can(user.role, 'content:publish')) return data;
  if (mode === 'update' && 'isPublished' in data) throw forbidden();
  return mode === 'create' ? { ...data, isPublished: false } : data;
}

/** Regenerates the static pages that render a collection. */
export function revalidateCollection(name: string) {
  for (const path of resolveCollection(name).paths) revalidatePath(path);
}
