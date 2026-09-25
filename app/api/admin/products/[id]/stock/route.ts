import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { hasStockPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  if (!await hasStockPermission('stock.view')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض المخزون.' }, { status: 403 });
  }

  try {
    const { id: productId } = await params;
    const product = await StoreDB.getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'المنتج غير موجود.' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sort = (searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest') as 'newest' | 'oldest';

    const result = await StoreDB.getProductStockPaginated({
      productId,
      page,
      limit,
      search,
      status,
      sort,
    });

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        sku: product.sku || product.id,
        stockType: product.stockType || 'digital_keys',
        downloadsCount: product.downloadsCount || 0,
        isDisabled: product.isDisabled || false,
        updatedAt: product.updatedAt,
      },
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to get product stock:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر تحميل بيانات المخزون حالياً.',
    }, { status: 500 });
  }
}
