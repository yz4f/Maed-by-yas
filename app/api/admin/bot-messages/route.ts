import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { listDiscordBotDirectMessages, sendDiscordAdminDirectMessage } from '@/lib/discord-bot';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, error: 'غير مصرح لك بعرض رسائل البوت.' }, { status: 403 });
  const before = new URL(request.url).searchParams.get('before');
  if (before && !/^\d{16,22}$/.test(before)) return NextResponse.json({ success: false, error: 'مؤشر الرسائل غير صالح.' }, { status: 400 });
  try {
    const result = await listDiscordBotDirectMessages(before || undefined);
    return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[Discord Bot DM] Unable to load messages:', error);
    return NextResponse.json({ success: false, error: 'تعذر تحميل رسائل البوت الآن.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, error: 'غير مصرح لك بمراسلة الأعضاء.' }, { status: 403 });
  let payload: { discordId?: unknown; message?: unknown };
  try { payload = await request.json(); }
  catch { return NextResponse.json({ success: false, error: 'بيانات الرسالة غير صالحة.' }, { status: 400 }); }
  const discordId = typeof payload.discordId === 'string' ? payload.discordId.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!/^\d{16,22}$/.test(discordId) || message.length < 2 || message.length > 1200) {
    return NextResponse.json({ success: false, error: 'أدخل Discord ID صالحًا ورسالة بين حرفين و1200 حرف.' }, { status: 400 });
  }
  if (discordId === actor.discordId) return NextResponse.json({ success: false, error: 'لا يمكنك إرسال رسالة إلى حساب الإدارة نفسه.' }, { status: 400 });
  try {
    const result = await sendDiscordAdminDirectMessage({
      customerDiscordId: discordId, customerName: discordId, body: message, staffName: actor.name || 'إدارة تعن',
    });
    if (!result.sent) return NextResponse.json({ success: false, error: 'تم إرسال الرسالة نفسها لهذا العضو قبل لحظات.' }, { status: 429 });
    await StoreDB.addLog('Discord Bot Direct Message', `أرسل ${actor.name || 'الإدارة'} رسالة خاصة إلى ${discordId}.`, actor.discordId || 'admin-system', actor.name || 'إدارة تعن', getClientIp(request), {
      eventType: 'discord_bot_direct_message', actorDiscordId: actor.discordId,
      actorName: actor.name, targetDiscordId: discordId, metadata: { messageLength: message.length },
    }).catch((error) => console.error('[Discord Bot DM] Unable to save send audit:', error));
    return NextResponse.json({ success: true, message: 'تم إرسال الرسالة الخاصة.' });
  } catch (error) {
    console.error('[Discord Bot DM] Unable to send message:', error);
    return NextResponse.json({ success: false, error: 'تعذر إرسال الرسالة. تأكد أن العضو يسمح برسائل البوت الخاصة.' }, { status: 502 });
  }
}
