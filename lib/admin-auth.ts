import { hasPermission, type PermissionKey } from '@/lib/permissions';
import { getAuthenticatedActor } from '@/lib/request-actor';

export async function isAuthorizedAdmin(permission: PermissionKey = 'dashboard.view'): Promise<boolean> {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) return false;
    return hasPermission(actor, permission);
  } catch (error) {
    console.error('Unable to resolve the admin session:', error);
    return false;
  }
}
