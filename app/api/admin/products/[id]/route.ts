import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { ZodError } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const product = await StoreDB.getProductById(id);
  if (!product) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, product });
}

export async function PUT(req: Request, { params }: RouteContext) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل المنتجات.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const data = await req.json();
    const result = await StoreDB.updateProduct(id, data);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ success: false, message: 'إعدادات الدليل أو التنبيه غير صالحة.' }, { status: 400 });
    console.error('Product update failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحديث المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بحذف المنتجات.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const success = await StoreDB.deleteProduct(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Product deletion failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر حذف المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}
