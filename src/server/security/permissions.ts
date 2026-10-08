/**
 * Role-based access control. Roles are stored on the user; permissions are
 * resolved in code so they are reviewed and versioned with the application.
 */
export const ROLES = ['super_admin', 'admin', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'content:read',
  'content:write',
  'content:publish',
  'media:write',
  'enquiries:read',
  'enquiries:write',
  'users:manage',
  'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  // Admins reach every part of the admin; only a super admin can create or change a super admin (see the users routes).
  admin: ['content:read', 'content:write', 'content:publish', 'media:write', 'enquiries:read', 'enquiries:write', 'users:manage', 'audit:read'],
  editor: ['content:read', 'content:write', 'media:write', 'enquiries:read'],
  viewer: ['content:read', 'enquiries:read'],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
