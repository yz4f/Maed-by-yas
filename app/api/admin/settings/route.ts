import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin('settings.view')) {
    return NextResponse.json({ success: false, error: 'لا تملك صلاحية عرض إعدادات النظام.' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    checks: {
      nextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
      nextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
      discordOAuth: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
      discordBot: Boolean(process.env.DISCORD_BOT_TOKEN),
    },
    environment: process.env.NODE_ENV || 'development',
  });
}
