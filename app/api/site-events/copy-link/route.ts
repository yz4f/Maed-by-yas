import { NextResponse } from 'next/server';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';
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
    await sendDiscordWebsiteLog({
      type: 'websiteLinkCopied',
      customerId: actor.discordId,
      customerName: actor.name,
      customerImage: actor.image,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Discord Log] Website link copy event failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تسجيل نسخ الرابط.' }, { status: 502 });
  }
}
