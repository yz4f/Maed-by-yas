import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/store-db';
import { normalizeRole, type ManagedRole } from '@/lib/role-utils';
export { canManageRole, normalizeRole } from '@/lib/role-utils';

export const PERMISSION_KEYS = [
  'dashboard.view',
  'users.view', 'users.edit', 'users.disable',
  'products.view', 'products.create', 'products.edit', 'products.delete',
  'keys.view', 'keys.create', 'keys.disable', 'keys.reset',
  'inventory.view', 'inventory.edit',
  'faq.view', 'faq.create', 'faq.edit', 'faq.delete',
  'announcements.view', 'announcements.create', 'announcements.publish', 'announcements.delete',
  'roles.view', 'roles.manage', 'logs.view', 'settings.view', 'settings.edit',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type { ManagedRole } from '@/lib/role-utils';

export const DEFAULT_ROLE_PERMISSIONS: Record<ManagedRole, PermissionKey[]> = {
  Owner: [...PERMISSION_KEYS],
  Admin: ['dashboard.view', 'users.view', 'users.edit', 'users.disable', 'products.view', 'products.create', 'products.edit', 'products.delete', 'keys.view', 'keys.create', 'keys.disable', 'keys.reset', 'inventory.view', 'inventory.edit', 'faq.view', 'faq.create', 'faq.edit', 'faq.delete', 'announcements.view', 'announcements.create', 'announcements.publish', 'announcements.delete', 'roles.view', 'logs.view', 'settings.view'],
  Moderator: ['dashboard.view', 'users.view', 'products.view', 'keys.view', 'inventory.view', 'faq.view', 'faq.create', 'faq.edit', 'announcements.view', 'announcements.create', 'logs.view'],
  Staff: ['dashboard.view', 'users.view', 'products.view', 'keys.view', 'inventory.view', 'faq.view', 'announcements.view'],
  Customer: [],
};

const roleCache = new Map<ManagedRole, { permissions: PermissionKey[]; expiresAt: number }>();

export async function getRolePermissions(role: unknown): Promise<PermissionKey[]> {
  const normalized = normalizeRole(role);
  if (normalized === 'Owner') return [...PERMISSION_KEYS];
  const cached = roleCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return cached.permissions;
  let permissions = DEFAULT_ROLE_PERMISSIONS[normalized];
  const database = db();
  if (database) {
    try {
      const snapshot = await getDoc(doc(database, 'roles', normalized));
      const configured = snapshot.exists() ? snapshot.data().permissions : null;
      if (Array.isArray(configured)) permissions = configured.filter((item): item is PermissionKey => PERMISSION_KEYS.includes(item));
    } catch (error) {
      console.error('Role permissions could not be loaded:', error);
    }
  }
  roleCache.set(normalized, { permissions, expiresAt: Date.now() + 30_000 });
  return permissions;
}

export async function hasPermission(user: { role?: unknown; email?: unknown } | null | undefined, permission: PermissionKey) {
  if (!user) return false;
  return (await getRolePermissions(user.role)).includes(permission);
}

export function clearRolePermissionCache(role?: ManagedRole) {
  if (role) roleCache.delete(role);
  else roleCache.clear();
}
