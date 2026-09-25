import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StockPermission } from '@/types';

const ADMIN_ROLES = new Set(['Boss', 'Co-Boss', 'Admin', 'Owner']);

export async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return false;

    return ADMIN_ROLES.has(String(user.role || '')) || user.email === 'boss@t3n-store.com';
  } catch (error) {
    console.error('Unable to resolve the admin session:', error);
    return false;
  }
}

export async function hasStockPermission(permission: StockPermission = 'stock.view'): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return false;

    const role = String(user.role || '');
    if (['Boss', 'Co-Boss', 'Owner'].includes(role) || user.email === 'boss@t3n-store.com') {
      return true;
    }

    if (role === 'Admin') {
      return true;
    }

    if (permission === 'stock.view' && ['Moderator', 'Staff'].includes(role)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Stock permission check failed:', error);
    return false;
  }
}

