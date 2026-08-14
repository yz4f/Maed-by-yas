import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
