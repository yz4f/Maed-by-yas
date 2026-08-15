import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import type { ProductStatus } from '@/types';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: ProductStatus[] = ['Active', 'Inactive'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أولاً.' },
        { status: 401 },
      );
    }

    const { productId } = await params;
    const body = await req.json().catch(() => null) as { status?: unknown } | null;
    const status = body?.status;

    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status as ProductStatus)) {
      return NextResponse.json(
        { success: false, message: 'حالة التفعيل المطلوبة غير صالحة.' },
        { status: 400 },
      );
    }

    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'تعذر العثور على حساب المستخدم.' },
        { status: 404 },
      );
    }

    const userProduct = (await StoreDB.getUserProducts(user.id)).find(
      (item) => item.productId === productId,
    );

    if (!userProduct) {
      return NextResponse.json(
        { success: false, message: 'هذا المنتج لا يخص الحساب الحالي.' },
        { status: 404 },
      );
    }

    const isExpired = Boolean(userProduct.expiresAt && new Date(userProduct.expiresAt).getTime() <= Date.now());
    if (status === 'Active' && (userProduct.product?.isDisabled || userProduct.product?.isArchived)) {
      return NextResponse.json(
        { success: false, message: 'لا يمكن تفعيل منتج غير متاح حالياً.' },
        { status: 409 },
      );
    }

    if (status === 'Active' && isExpired) {
      return NextResponse.json(
        { success: false, message: 'انتهت مدة الترخيص ولا يمكن إعادة تفعيله.' },
        { status: 409 },
      );
    }

    const result = await StoreDB.updateUserProductStatus(user.id, productId, status as ProductStatus);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'تعذر حفظ حالة المنتج. حاول مرة أخرى.' },
        { status: 500 },
      );
    }

    const ip = getClientIp(req);
    const productName = userProduct.product?.name || productId;
    await StoreDB.addLog(
      'User Product Status Changed',
      `${status === 'Active' ? 'تم تفعيل' : 'تم إلغاء تفعيل'} المنتج ${productName} بواسطة المستخدم`,
      user.id,
      user.name,
      ip,
    );

    return NextResponse.json({
      success: true,
      productId,
      status,
      message: status === 'Active' ? 'تم تفعيل المنتج بنجاح.' : 'تم إلغاء تفعيل المنتج بنجاح.',
    });
  } catch (error) {
    console.error('User product status update failed:', error);
    return NextResponse.json(
      { success: false, message: 'تعذر حفظ حالة المنتج الآن. حاول مرة أخرى.' },
      { status: 500 },
    );
  }
}
