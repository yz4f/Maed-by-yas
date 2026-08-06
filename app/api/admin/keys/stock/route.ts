import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function POST(req: Request) {
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
