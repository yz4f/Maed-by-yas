import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض سجلات الإدارة.' }, { status: 403 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') || undefined;
  if (cursor && !/^log-[a-zA-Z0-9-]{1,100}$/.test(cursor)) {
    return NextResponse.json({ success: false, message: 'معرف الصفحة غير صالح.' }, { status: 400 });
  }

  try {
    const page = await StoreDB.getLogsPage(cursor);
    return NextResponse.json({ success: true, ...page }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Unable to load admin audit logs:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل سجلات الإدارة.' }, { status: 500 });
  }
}
