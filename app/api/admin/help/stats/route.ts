import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض الإحصائيات.' }, { status: 403 });
  }

  try {
    const stats = await StoreDB.getFaqStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Admin FAQ stats error:', error);
    return NextResponse.json({ success: false, message: 'تعذر جلب إحصائيات مركز المساعدة.' }, { status: 500 });
  }
}
