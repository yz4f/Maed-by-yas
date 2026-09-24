import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });

  try {
    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) return NextResponse.json({ success: false, error: 'الحساب غير موجود.' }, { status: 404 });
    if (user.isBanned || user.isArchived) return NextResponse.json({ success: false, error: 'الحساب غير متاح لتعديل التنبيهات.' }, { status: 403 });
    await StoreDB.updateUser(user.id, { warningMessage: null });
    await StoreDB.addLog('User Warning Acknowledged', `${user.name} acknowledged the account warning.`, user.id, user.name, getClientIp(request), {
      eventType: 'user_warning_acknowledged', actorUserId: user.id, actorDiscordId: user.discordId,
      actorName: user.name, targetUserId: user.id, targetDiscordId: user.discordId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Warning acknowledgement failed:', error);
    return NextResponse.json({ success: false, error: 'تعذر تأكيد التنبيه حالياً.' }, { status: 500 });
  }
}
