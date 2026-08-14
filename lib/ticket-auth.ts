import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { requestHasTrustedOrigin as isTrustedOrigin } from '@/lib/request-security';
import { RoleType } from '@/types';

export interface TicketActor {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  role: RoleType;
}

const STAFF_ROLES: RoleType[] = ['Boss', 'Co-Boss', 'Admin'];

export function canManageTickets(actor: TicketActor) {
  return STAFF_ROLES.includes(actor.role);
}

export async function getTicketActor(): Promise<TicketActor | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.discordId) return null;
  return {
    id: String(user.discordId),
    name: user.name || 'مستخدم',
    email: user.email || null,
    image: user.image || null,
    role: (user.role || 'Customer') as RoleType,
  };
}

export function requestHasTrustedOrigin(request: NextRequest) {
  return isTrustedOrigin(request);
}
