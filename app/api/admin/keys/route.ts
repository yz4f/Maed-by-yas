import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض المفاتيح.' }, { status: 403 });
  }

  try {
    const [keys, products] = await Promise.all([StoreDB.getKeys(), StoreDB.getProducts()]);
    return NextResponse.json({ success: true, keys, products });
  } catch (error) {
    console.error('Admin keys request failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل المفاتيح حالياً.' }, { status: 500 });
  }
}
