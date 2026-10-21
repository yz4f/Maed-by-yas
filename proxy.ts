import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['Boss', 'Co-Boss', 'Admin', 'Owner']);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hasTrustedOrigin(request: NextRequest): boolean {
  try {
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite === 'cross-site' || fetchSite === 'same-site') return false;
    const configuredOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : request.nextUrl.origin;
    const origin = request.headers.get('origin');
    const source = origin || request.headers.get('referer');
    if (!source || source === 'null') return fetchSite === 'same-origin';
    return new URL(source).origin === configuredOrigin;
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
