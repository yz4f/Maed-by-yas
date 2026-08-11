import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

process.env.NEXTAUTH_URL = 'https://t3n-store-production.up.railway.app';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
