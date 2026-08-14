import { NextResponse } from 'next/server';
import { getKeyStockSummary, StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول إلى المفاتيح.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const keys = await StoreDB.getKeysByProduct(productId);
      return NextResponse.json({ success: true, keys, stock: getKeyStockSummary(keys) });
    }

    const keys = await StoreDB.getKeys();
    return NextResponse.json({ success: true, keys, stock: getKeyStockSummary(keys) });
  } catch (err: any) {
    console.error("Keys API failed:", err);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المفاتيح.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { keyId, deleteAllForProductId } = body;

    if (deleteAllForProductId) {
      const deletedCount = await StoreDB.deleteAllKeysForProduct(deleteAllForProductId);
      return NextResponse.json({
        success: true,
        count: deletedCount,
        message: deletedCount > 0
          ? `تم حذف ${deletedCount} مفتاح غير مستخدم بنجاح.`
          : 'لا توجد مفاتيح غير مستخدمة للحذف.'
      });
    }

    if (!keyId) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح مطلوب' }, { status: 400 });
    }

    const result = await StoreDB.deleteKey(keyId);
    return NextResponse.json({
      success: result,
      message: result ? 'تم حذف المفتاح غير المستخدم بنجاح.' : 'تعذر حذف المفتاح لأنه غير موجود أو مستخدم بالفعل.'
    }, { status: result ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المفاتيح.' }, { status: 403 });
  }
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
