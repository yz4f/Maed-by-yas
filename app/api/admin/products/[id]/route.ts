import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { requestHasTrustedOrigin, getSessionActor, getClientIp } from '@/lib/request-security';
import { productUpdateSchema } from '@/lib/product-validation.mjs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!await isAuthorizedAdmin('products.view')) return NextResponse.json({ success: false, message: 'غير مصرح بعرض بيانات المنتج.' }, { status: 403 });
  const { id } = await params;
  const product = await StoreDB.getProductById(id);
  if (!product) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, product });
}

export async function PUT(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('products.edit')) return NextResponse.json({ success: false, message: 'غير مصرح بتعديل المنتج.' }, { status: 403 });
  try {
    const { id } = await params;
    const parsed = productUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات التعديل غير صالحة.', issues: parsed.error.flatten() }, { status: 400 });
    const product = await StoreDB.updateProduct(id, parsed.data);
    const actor = await getSessionActor();
    await StoreDB.addLog('Product Updated', `Product ${id} was updated.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req));
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Product update failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحديث المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('products.delete')) return NextResponse.json({ success: false, message: 'غير مصرح بحذف المنتج.' }, { status: 403 });
  try {
    const { id } = await params;
    const success = await StoreDB.deleteProduct(id);
    const actor = await getSessionActor();
    await StoreDB.addLog('Product Deleted', `Product ${id} was archived or deleted.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Product deletion failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر حذف المنتج. حاول مرة أخرى.' }, { status: 500 });
  }
}
