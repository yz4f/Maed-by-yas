import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SessionActor {
  discordId: string;
  name: string;
  email: string | null;
  image: string | null;
  role: string;
}

export async function getSessionActor(): Promise<SessionActor | null> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.discordId) return null;

    return {
      discordId: String(user.discordId),
      name: String(user.name || 'مستخدم'),
      email: user.email ? String(user.email) : null,
      image: user.image ? String(user.image) : null,
      role: String(user.role || 'Customer'),
    };
  } catch (error) {
    console.error('Unable to resolve the authenticated session:', error);
    return null;
  }
}

export function requestHasTrustedOrigin(request: Request): boolean {
  try {
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite === 'cross-site' || fetchSite === 'same-site') return false;
    const configuredOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : new URL(request.url).origin;
    const origin = request.headers.get('origin');
    const source = origin || request.headers.get('referer');
    if (!source || source === 'null') return fetchSite === 'same-origin';
    return new URL(source).origin === configuredOrigin;
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
