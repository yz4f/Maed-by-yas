import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض بيانات الإدارة.' }, { status: 403 });
  }
  try {
    const stats = await StoreDB.getStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("Stats API failed:", err);
    return NextResponse.json({ success: false, error: 'تعذر تحميل إحصائيات الإدارة.' }, { status: 500 });
  }
}
