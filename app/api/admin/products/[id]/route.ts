import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const product = await StoreDB.getProductById(id);
  if (!product) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, product });
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await req.json();
    const product = await StoreDB.updateProduct(id, data);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Product update failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحديث المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const success = await StoreDB.deleteProduct(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Product deletion failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر حذف المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}
