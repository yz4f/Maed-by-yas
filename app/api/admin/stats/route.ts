import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin('dashboard.view')) return NextResponse.json({ success: false, error: 'غير مصرح لك بعرض الإحصائيات.' }, { status: 403 });
  try {
    const [stats, canViewLogs, canViewIp] = await Promise.all([
      StoreDB.getStats(), isAuthorizedAdmin('logs.view'), isAuthorizedAdmin('settings.view'),
    ]);
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        recentLogs: canViewLogs ? stats.recentLogs.map((log) => canViewIp ? log : { ...log, ipAddress: undefined }) : [],
      },
    });
  } catch (error) {
    console.error('Stats API failed:', error);
    return NextResponse.json({ success: false, error: 'تعذر تحميل الإحصائيات حالياً.' }, { status: 500 });
  }
}
