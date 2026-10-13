import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  }

  const actor = await getSessionActor();
  if (!actor) {
    return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  try {
    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) return NextResponse.json({ success: false, message: 'الحساب غير موجود.' }, { status: 404 });
    if (!user.welcomeVideoRequiredAt || user.welcomeVideoCompletedAt) {
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    await StoreDB.updateUser(user.id, { welcomeVideoCompletedAt: new Date().toISOString() });
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Unable to save welcome video completion:', error);
    return NextResponse.json({ success: false, message: 'تعذر حفظ حالة الفيديو. أعد المحاولة.' }, { status: 500 });
  }
}
