import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

export async function POST(req: Request) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإلغاء المفاتيح.' }, { status: 403 });
  }

  try {
    const { keyId, userId } = await req.json();
    if (typeof keyId !== 'string' || !keyId.trim() || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح ومعرف المستخدم مطلوبان.' }, { status: 400 });
    }

    const actor = await getSessionActor();
    const success = await StoreDB.revokeKey(keyId, userId);
    if (!success) {
      return NextResponse.json({ success: false, message: 'تعذر العثور على المفتاح أو إلغاؤه.' }, { status: 404 });
    }

    await StoreDB.addLog(
      'Key Revoked',
      'تم إلغاء المفتاح وتعطيل الترخيص المرتبط مع الاحتفاظ بكامل سجله.',
      actor?.discordId || 'admin-system',
      actor?.name || 'Admin',
      getClientIp(req),
      {
        eventType: 'key_revoked', actorDiscordId: actor?.discordId || null, actorName: actor?.name || 'Admin',
        targetUserId: userId, keyId, metadata: { action: 'revoke_key' },
      }
    );
    return NextResponse.json({ success: true, message: 'تم إلغاء المفتاح وأرشفة الترخيص المرتبط.' });
  } catch (error) {
    console.error('Key revocation failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تنفيذ إلغاء المفتاح. حاول مرة أخرى.' }, { status: 500 });
  }
}
