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
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const actualOrigin = new URL(origin).origin;
    const requestOrigin = new URL(request.url).origin;
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    const configuredOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : null;
    const allowedOrigins = new Set([requestOrigin, configuredOrigin].filter(Boolean) as string[]);

    if (forwardedHost) allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
    return allowedOrigins.has(actualOrigin);
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
