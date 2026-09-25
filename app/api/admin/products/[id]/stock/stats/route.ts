import { NextResponse } from 'next/server';
import { StoreDB, getKeyStockSummary } from '@/lib/store-db';
import { hasStockPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!await hasStockPermission('stock.view')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض إحصائيات المخزون.' }, { status: 403 });
  }

  try {
    const { id: productId } = await params;
    const product = await StoreDB.getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'المنتج غير موجود.' }, { status: 404 });
    }

    const allKeys = await StoreDB.getKeysByProduct(productId);
    const activeKeys = allKeys.filter((k) => !k.isArchived);
    const stats = getKeyStockSummary(activeKeys);

    return NextResponse.json({
      success: true,
      productId,
      stats,
    });
  } catch (error: any) {
    console.error('Failed to get product stock stats:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر جلب إحصائيات المخزون.',
    }, { status: 500 });
  }
}
