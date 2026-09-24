import { NextResponse } from 'next/server';
import { getKeyStockSummary, StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { requestHasTrustedOrigin, getSessionActor, getClientIp } from '@/lib/request-security';
import { productCreateSchema, productUpdateSchema } from '@/lib/product-validation.mjs';

export async function GET() {
  if (!await isAuthorizedAdmin('products.view')) {
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
  if (!requestHasTrustedOrigin(req)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('products.create')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const parsed = productCreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات المنتج غير مكتملة أو غير صالحة.', issues: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;
    if (await StoreDB.getProductById(data.id)) return NextResponse.json({ success: false, message: 'معرف المنتج مستخدم بالفعل.' }, { status: 409 });
    const existingProducts = await StoreDB.getProducts();
    const now = new Date().toISOString();
    const product = {
      ...data,
      displayOrder: existingProducts.reduce((max, item) => Math.max(max, Number(item.displayOrder) || 0), -1) + 1,
      downloadsCount: data.downloadsCount ?? 0,
      isVisible: true,
      isDisabled: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    const result = await StoreDB.createProduct(product);
    if (!result.success) return NextResponse.json({ success: false, message: result.message || 'معرف المنتج مستخدم بالفعل.' }, { status: 409 });
    const actor = await getSessionActor();
    await StoreDB.addLog('Product Created', `Product ${(result as any)?.product?.name || data.name || 'unknown'} was created.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!requestHasTrustedOrigin(req)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('products.edit')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const data = await req.json();
    const { id } = data;
    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف المنتج مطلوب' }, { status: 400 });
    }
    const parsed = productUpdateSchema.safeParse(Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'id')));
    if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات التعديل غير صالحة.', issues: parsed.error.flatten() }, { status: 400 });
    const result = await StoreDB.updateProduct(id, parsed.data);
    const actor = await getSessionActor();
    await StoreDB.addLog('Product Updated', `Product ${id} was updated.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!requestHasTrustedOrigin(req)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin('products.delete')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المنتجات.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف المنتج مطلوب' }, { status: 400 });
    }
    const result = await StoreDB.deleteProduct(id);
    const actor = await getSessionActor();
    await StoreDB.addLog('Product Deleted', `Product ${id} was archived or deleted.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req));
    return NextResponse.json({ success: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
