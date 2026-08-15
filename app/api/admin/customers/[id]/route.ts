import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بعرض بيانات العميل.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await StoreDB.getUserDetails(id);
    if (!data) return NextResponse.json({ success: false, message: 'العميل غير موجود.' }, { status: 404 });
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Admin customer detail request failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل بيانات العميل حالياً.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بأرشفة العميل.' }, { status: 403 });
  }

  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const details = await StoreDB.getUserDetails(id);
    if (!details) return NextResponse.json({ success: false, message: 'العميل غير موجود.' }, { status: 404 });

    const result = await StoreDB.deleteUser(id);
    if (!result) return NextResponse.json({ success: false, message: 'تعذرت أرشفة العميل.' }, { status: 500 });

    await StoreDB.addLog(
      'User Archived',
      `تمت أرشفة حساب العميل ${details.user.name} مع الاحتفاظ ببياناته وتاريخه.`,
      actor?.discordId || 'admin-system',
      actor?.name || 'Admin',
      getClientIp(req),
      {
        eventType: 'user_archived',
        actorDiscordId: actor?.discordId || null,
        actorName: actor?.name || 'Admin',
        targetUserId: id,
        targetDiscordId: details.user.discordId || null,
        metadata: { action: 'archive_user' },
      }
    );

    return NextResponse.json({ success: true, message: 'تمت أرشفة العميل مع الاحتفاظ بكامل سجله وتراخيصه.' });
  } catch (error) {
    console.error('Customer archive failed:', error);
    return NextResponse.json({ success: false, message: 'تعذرت أرشفة العميل. حاول مرة أخرى.' }, { status: 500 });
  }
}
