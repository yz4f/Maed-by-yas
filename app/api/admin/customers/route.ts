import { NextResponse } from 'next/server';
import { StoreDB, db } from '@/lib/store-db';
import { collection, getDocs } from 'firebase/firestore';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin('users.view')) return NextResponse.json({ success: false, error: 'غير مصرح لك بعرض العملاء.' }, { status: 403 });
  try {
    const [users, keys] = await Promise.all([StoreDB.getUsers(), StoreDB.getKeys()]);
    const database = db();
    const licenseSnapshot = database ? await getDocs(collection(database, 'userProducts')) : null;
    const productCounts = new Map<string, Set<string>>();
    const now = Date.now();
    for (const license of licenseSnapshot?.docs || []) {
      const value = license.data();
      if (value.status !== 'Active') continue;
      if (value.expiresAt && new Date(value.expiresAt).getTime() <= now) continue;
      const ids = productCounts.get(String(value.userId)) || new Set<string>();
      ids.add(String(value.productId));
      productCounts.set(String(value.userId), ids);
    }
    const keyCounts = new Map<string, number>();
    for (const key of keys) if (key.usedByUserId && key.isUsed && !key.isArchived) keyCounts.set(key.usedByUserId, (keyCounts.get(key.usedByUserId) || 0) + 1);
    const canViewIp = await isAuthorizedAdmin('settings.view');
    const result = users.map((user) => ({
      ...user,
      lastIp: canViewIp ? user.lastIp : undefined,
      productCount: productCounts.get(user.id)?.size || 0,
      keyCount: keyCounts.get(user.id) || 0,
      lastActivity: user.lastLogin || null,
    }));
    return NextResponse.json({ success: true, users: result });
  } catch (err) {
    console.error('Customers API failed:', err);
    return NextResponse.json({ success: false, error: 'تعذر تحميل العملاء.' }, { status: 500 });
  }
}
