import { NextResponse } from 'next/server';
import { getKeyStockSummary, StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const [products, keys] = await Promise.all([StoreDB.getProducts(), StoreDB.getKeys()]);
    const productsWithStock = products.map((product) => {
      const stock = getKeyStockSummary(keys.filter((key) => key.productId === product.id));
      return { ...product, stockKeysCount: stock.available, stockSummary: stock };
    });
    return NextResponse.json({ success: true, products: productsWithStock });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'تعذر تحميل المنتجات والمخزون.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const data = await req.json();
    const result = await StoreDB.createProduct(data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const data = await req.json();
    const { id, ...updates } = data;
    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف المنتج مطلوب' }, { status: 400 });
    }
    const result = await StoreDB.updateProduct(id, updates);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف المنتج مطلوب' }, { status: 400 });
    }
    const result = await StoreDB.deleteProduct(id);
    return NextResponse.json({ success: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
