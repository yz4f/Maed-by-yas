import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { getClientIp, requestHasTrustedOrigin } from '@/lib/request-security';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getAuthenticatedActor } from '@/lib/request-actor';
import { clearRolePermissionCache, DEFAULT_ROLE_PERMISSIONS, normalizeRole, PERMISSION_KEYS, type ManagedRole } from '@/lib/permissions';
import { db, StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

const roleSchema = z.object({
  role: z.enum(['Admin', 'Moderator', 'Staff', 'Customer']),
  permissions: z.array(z.enum(PERMISSION_KEYS)).max(PERMISSION_KEYS.length),
});

async function getDatabase() {
  const value = db();
  if (!value) throw new Error('قاعدة بيانات الأدوار غير متاحة.');
  return value;
}

export async function GET() {
  if (!await isAuthorizedAdmin('roles.view')) return NextResponse.json({ success: false, error: 'لا تملك صلاحية عرض الأدوار.' }, { status: 403 });
  try {
    const [snapshot, users, actor] = await Promise.all([getDocs(collection(await getDatabase(), 'roles')), StoreDB.getUsers(), getAuthenticatedActor()]);
    const configured = new Map(snapshot.docs.map((entry) => [entry.id, entry.data()]));
    const roles: ManagedRole[] = ['Owner', 'Admin', 'Moderator', 'Staff', 'Customer'];
    return NextResponse.json({ success: true, roles: roles.map((role) => {
      const saved = configured.get(role);
      const permissions = role === 'Owner' ? [...PERMISSION_KEYS] : Array.isArray(saved?.permissions) ? saved.permissions : DEFAULT_ROLE_PERMISSIONS[role];
      const userCount = users.filter((user) => normalizeRole(user.role) === role).length;
      return { role, permissions, userCount, editable: role !== 'Owner' && normalizeRole(actor?.role) === 'Owner' };
    }) });
  } catch (error) {
    console.error('Admin roles could not be loaded:', error);
    return NextResponse.json({ success: false, error: 'تعذر تحميل الأدوار.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('roles.manage')) return NextResponse.json({ success: false, error: 'لا تملك صلاحية إدارة الأدوار.' }, { status: 403 });
  try {
    const input = roleSchema.parse(await request.json());
    const actor = await getAuthenticatedActor();
    if (!actor || normalizeRole(actor.role) !== 'Owner') return NextResponse.json({ success: false, error: 'إدارة الصلاحيات متاحة للمالك فقط.' }, { status: 403 });
    const database = await getDatabase();
    await setDoc(doc(database, 'roles', input.role), { role: input.role, permissions: [...new Set(input.permissions)], updatedAt: new Date().toISOString(), updatedById: actor.id, updatedByName: actor.name });
    clearRolePermissionCache(input.role);
    await StoreDB.addLog('Role Permissions Updated', `Owner ${actor.name} updated permissions for ${input.role}.`, actor.id, actor.name, getClientIp(request));
    return NextResponse.json({ success: true, role: input.role, permissions: input.permissions });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: 'بيانات الصلاحيات غير صالحة.' }, { status: 400 });
    console.error('Admin role update failed:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'تعذر حفظ الصلاحيات.' }, { status: 500 });
  }
}
