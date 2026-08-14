import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإضافة مفاتيح إلى المخزون.' }, { status: 403 });
  }
  try {
    const { productId, rawKeysText } = await req.json();

    if (!productId || !rawKeysText) {
      return NextResponse.json({ success: false, message: 'معرف المنتج ونص المفاتيح مطلوبين.' }, { status: 400 });
    }

    const res = await StoreDB.bulkAddKeys(productId, rawKeysText, "Admin");
    return NextResponse.json({ success: true, count: res.count });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
