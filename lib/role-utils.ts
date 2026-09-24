export type ManagedRole = 'Owner' | 'Admin' | 'Moderator' | 'Staff' | 'Customer';

export function normalizeRole(role: unknown): ManagedRole {
  const value = String(role || 'Customer');
  if (value === 'Boss' || value === 'Owner') return 'Owner';
  if (value === 'Co-Boss' || value === 'Admin') return 'Admin';
  if (value === 'Moderator' || value === 'Staff') return value;
  return 'Customer';
}

/** Resolve the role used for authorization from the current account record.
 * Discord-managed privileged roles remain authoritative; database-managed roles
 * are refreshed on each authenticated server request so role changes take
 * effect without waiting for a new OAuth login.
 */
export function resolveCurrentRole(sessionRole: unknown, storedRole: unknown): ManagedRole {
  if (sessionRole === 'Boss' || sessionRole === 'Co-Boss') return normalizeRole(sessionRole);
  const current = normalizeRole(storedRole);
  // Owner is a protected Discord-managed role, not a self-assignable DB role.
  return current === 'Owner' ? 'Customer' : current;
}

const ROLE_LEVEL: Record<ManagedRole, number> = {
  Owner: 100,
  Admin: 80,
  Moderator: 50,
  Staff: 30,
  Customer: 10,
};

export function canManageRole(actorRole: unknown, targetRole: unknown): boolean {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  return target !== 'Owner' && (actor === 'Owner' || ROLE_LEVEL[actor] > ROLE_LEVEL[target]);
}
