import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 't3n_super_secret_jwt_key_2026' });
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/admin')) {
      if (token && token.role !== 'Boss' && token.role !== 'Co-Boss' && token.role !== 'Admin') {
        return NextResponse.redirect(new URL('/dashboard/products', req.url));
      }
    }
  } catch (err) {
    // Ignore errors during static build evaluation
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
