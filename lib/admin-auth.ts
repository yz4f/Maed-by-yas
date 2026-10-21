import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StockPermission } from '@/types';
import { getCurrentStaffRole } from '@/lib/current-staff-role';

export async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.discordId) return false;
    return Boolean(await getCurrentStaffRole(String(user.discordId)));
  } catch (error) {
    console.error('Unable to resolve the admin session:', error);
    return false;
  }
}

export async function hasStockPermission(_permission: StockPermission = 'stock.view'): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.discordId) return false;
    const currentRole = await getCurrentStaffRole(String(user.discordId));
    return currentRole !== null;
  } catch (error) {
    console.error('Stock permission check failed:', error);
    return false;
  }
}

