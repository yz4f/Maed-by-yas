import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin('logs.view')) return NextResponse.json({ success: false, error: 'غير مصرح لك بعرض السجلات.' }, { status: 403 });
  const [logs, canViewIp] = await Promise.all([StoreDB.getLogs(), isAuthorizedAdmin('settings.view')]);
  return NextResponse.json({ success: true, logs: canViewIp ? logs : logs.map((log) => ({ ...log, ipAddress: undefined })) });
}
