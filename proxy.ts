import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['Boss', 'Co-Boss', 'Admin', 'Owner']);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const actualOrigin = new URL(origin).origin;
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    const configuredOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : null;
    const allowedOrigins = new Set([request.nextUrl.origin, configuredOrigin].filter(Boolean) as string[]);
    if (forwardedHost) allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
    return allowedOrigins.has(actualOrigin);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  if (!ADMIN_ROLES.has(String(token.role || ''))) {
    return NextResponse.json({ success: false, message: 'لا تملك صلاحية الوصول إلى هذه العملية.' }, { status: 403 });
  }

  if (MUTATING_METHODS.has(request.method) && !hasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
