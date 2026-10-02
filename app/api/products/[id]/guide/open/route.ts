import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, code: 'UNTRUSTED_ORIGIN', message: 'طلب غير مسموح.' }, { status: 403 });
  }
  const actor = await getSessionActor();
  if (!actor) {
    return NextResponse.json({ success: false, code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }
  try {
    const { id: productId } = await params;
    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) {
      return NextResponse.json({ success: false, code: 'USER_NOT_FOUND', message: 'لم يتم العثور على حساب العميل.' }, { status: 404 });
    }
    const result = await StoreDB.openProductGuide(user.id, productId, getClientIp(req));
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Product guide open failed:', error);
    return NextResponse.json({ success: false, code: 'GUIDE_OPEN_FAILED', message: 'تعذر فتح دليل المنتج حالياً.' }, { status: 500 });
  }
}
