import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';

export async function POST(req: Request) {
  try {
    if (!requestHasTrustedOrigin(req)) {
      return NextResponse.json({ success: false, message: 'طلب غير مسموح.' }, { status: 403 });
    }

    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول عبر Discord قبل تفعيل المفتاح.' }, { status: 401 });
    }

    const { keyString } = await req.json();
    if (!keyString || typeof keyString !== 'string') {
      return NextResponse.json({ success: false, message: 'مفتاح التفعيل مطلوب.' }, { status: 400 });
    }

    const res = await StoreDB.activateProductWithKey(
      keyString.trim(),
      {
        discordId: actor.discordId,
        name: actor.name,
        email: actor.email || undefined,
        image: actor.image || undefined,
      },
      getClientIp(req),
    );

    if (res.success && res.product) {
      try {
        await DiscordBotService.syncRolesOnProductActivation(actor.discordId, res.product.name);
      } catch (error) {
        console.warn('Discord role synchronization failed after activation:', error);
      }
    }

    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (error: any) {
    console.error('Key activation failed:', error);
    return NextResponse.json({ success: false, message: error?.message || 'خطأ غير متوقع أثناء تفعيل المفتاح.' }, { status: 500 });
  }
}
