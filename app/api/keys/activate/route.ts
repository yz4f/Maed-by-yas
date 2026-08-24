import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';
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

    let discordRoleSync: { success: boolean; message: string; grantedRoleIds: string[]; failedRoleIds: string[] } | null = null;
    if (res.success && res.product) {
      void sendDiscordWebsiteLog({
        type: 'productActivated',
        customerId: actor.discordId,
        customerName: actor.name || 'عميل',
        customerImage: actor.image || null,
        productName: res.product.name,
      }).catch((error) => console.error('[Discord Log] Product activation event failed:', error));

      try {
        discordRoleSync = await DiscordBotService.syncRolesOnProductActivation(actor.discordId, res.product.name);
        if (!discordRoleSync.success) {
          console.warn('Discord role synchronization was incomplete after activation:', discordRoleSync);
        }
      } catch (error) {
        console.error('Discord role synchronization failed after activation:', error);
        discordRoleSync = {
          success: false,
          message: 'تم تفعيل المنتج، لكن تعذر مزامنة رتب ديسكورد حالياً.',
          grantedRoleIds: [],
          failedRoleIds: [],
        };
      }
    }

    return NextResponse.json({ ...res, discordRoleSync }, { status: res.success ? 200 : 400 });
  } catch (error: any) {
    console.error('Key activation failed:', error);
    return NextResponse.json({ success: false, message: error?.message || 'خطأ غير متوقع أثناء تفعيل المفتاح.' }, { status: 500 });
  }
}
