import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

export async function POST(req: Request) {
  try {
    if (!requestHasTrustedOrigin(req)) {
      return NextResponse.json({ success: false, message: 'طلب غير مسموح.' }, { status: 403 });
    }

    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ success: false, message: 'بيانات المنتج غير صحيحة.' }, { status: 400 });
    }

    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'تعذر تهيئة حساب المستخدم. أعد تسجيل الدخول وحاول مجدداً.' }, { status: 401 });
    }

    const userProducts = await StoreDB.getUserProducts(user.id);
    const license = userProducts.find((item) => item.productId === productId);
    const expiresAt = license?.expiresAt ? new Date(license.expiresAt).getTime() : 0;
    const isUsable = license?.status === 'Active' && Number.isFinite(expiresAt) && expiresAt > Date.now();

    if (!isUsable || !license?.product?.fileUrl) {
      return NextResponse.json({ success: false, message: 'لا يوجد ترخيص نشط صالح لتحميل هذا المنتج.' }, { status: 403 });
    }

    const result = await StoreDB.recordDownload(productId, user.id, getClientIp(req));
    if (!result.success) {
      return NextResponse.json({ success: false, message: 'تعذر تسجيل عملية التحميل.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fileUrl: license.product.fileUrl });
  } catch (error: any) {
    console.error('Download request failed:', error);
    return NextResponse.json({ success: false, message: error?.message || 'خطأ غير متوقع أثناء تجهيز التحميل.' }, { status: 500 });
  }
}
