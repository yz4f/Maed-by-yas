import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (productId) {
    const keys = await StoreDB.getKeysByProduct(productId);
    return NextResponse.json({ success: true, keys });
  }

  const keys = await StoreDB.getKeys();
  return NextResponse.json({ success: true, keys });
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { keyId, deleteAllForProductId } = body;

    if (deleteAllForProductId) {
      const deletedCount = await StoreDB.deleteAllKeysForProduct(deleteAllForProductId);
      return NextResponse.json({ success: true, count: deletedCount, message: `تم حذف جميع الأكواد بنجاح (${deletedCount} كود)` });
    }

    if (!keyId) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح مطلوب' }, { status: 400 });
    }

    const result = await StoreDB.deleteKey(keyId);
    return NextResponse.json({ success: result, message: result ? 'تم حذف المفتاح بنجاح' : 'لم يتم العثور على المفتاح' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { keyId, newKey } = body;

    if (!keyId || !newKey) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح والكود الجديد مطلوبان' }, { status: 400 });
    }

    const result = await StoreDB.updateKey(keyId, newKey);
    return NextResponse.json({ success: result, message: result ? 'تم تحديث الكود بنجاح' : 'تعذر تحديث الكود' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
