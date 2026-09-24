import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { requestHasTrustedOrigin as isTrustedOrigin, type SessionActor } from '@/lib/request-security';
import { StoreDB } from '@/lib/store-db';
import { resolveCurrentRole } from '@/lib/role-utils';
import { RoleType } from '@/types';

export interface AuthenticatedActor {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  role: RoleType;
}

export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as (SessionActor & { name?: string }) | undefined;
    if (!user?.discordId) return null;
    const storedUser = await StoreDB.getUserByDiscordId(user.discordId);
    if (!storedUser || storedUser.isArchived || storedUser.isBanned) return null;
    return {
      id: user.discordId,
      name: user.name || 'مستخدم',
      email: user.email || null,
      image: user.image || null,
      role: resolveCurrentRole(user.role, storedUser.role) as RoleType,
    };
  } catch (error) {
    console.error('Unable to resolve the authenticated request actor:', error);
    return null;
  }
}

export function requestHasTrustedOrigin(request: NextRequest) {
  return isTrustedOrigin(request);
}
