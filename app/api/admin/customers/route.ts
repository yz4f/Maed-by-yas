import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض العملاء.' }, { status: 403 });
  }
  try {
    const users = await StoreDB.getUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error("Customers API failed:", err);
    return NextResponse.json({ success: false, error: 'تعذر تحميل بيانات العملاء.' }, { status: 500 });
  }
}
