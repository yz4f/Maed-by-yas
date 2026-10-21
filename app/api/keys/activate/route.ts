import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { activateGiveawayKey } from '@/lib/giveaways';
import { limitKeyActivation } from '@/lib/security-rate-limit';

export async function POST(req: Request) {
  try {
    if (!requestHasTrustedOrigin(req)) {
      return NextResponse.json({ success: false, message: 'طلب غير مسموح.' }, { status: 403 });
    }

    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول عبر Discord قبل تفعيل المفتاح.' }, { status: 401 });
    }

    if (Number(req.headers.get('content-length') || 0) > 4096) {
      return NextResponse.json({ success: false, message: 'الطلب كبير جداً.' }, { status: 413 });
    }
    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (user?.isBanned && (user.banType !== 'temporary' || !user.banExpiresAt || Date.parse(user.banExpiresAt) > Date.now())) {
      return NextResponse.json({ success: false, message: 'الحساب محظور من تفعيل المفاتيح.' }, { status: 403 });
    }
    const ip = getClientIp(req);
    const rateLimit = await limitKeyActivation(actor.discordId, ip);
    if (!rateLimit.allowed) {
      if (rateLimit.firstRejection) {
        await StoreDB.addLog('Security Rate Limit', 'تجاوز حد محاولات تفعيل المفاتيح', user?.id, actor.name, ip, {
          eventType: 'security_activation_rate_limit', actorDiscordId: actor.discordId,
          actorUserId: user?.id || null, actorName: actor.name,
        }).catch((error) => console.error('Unable to log activation rate limit:', error));
      }
      return NextResponse.json({ success: false, message: 'محاولات كثيرة. حاول لاحقاً.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } });
    }
    const { keyString: submittedKey, key } = await req.json();
    const keyString = submittedKey || key;
    if (!keyString || typeof keyString !== 'string' || keyString.trim().length > 160) {
      return NextResponse.json({ success: false, message: 'مفتاح التفعيل مطلوب.' }, { status: 400 });
    }

    const userDetails = {
      discordId: actor.discordId,
      name: actor.name,
      email: actor.email || undefined,
      image: actor.image || undefined,
    };
    let res = await activateGiveawayKey(keyString.trim(), userDetails, ip);
    if (!res.success && res.message === 'المفتاح غير صحيح أو غير موجود') {
      res = await StoreDB.activateProductWithKey(keyString.trim(), userDetails, ip);
    }

    let discordRoleSync: { success: boolean; message: string; grantedRoleIds: string[]; failedRoleIds: string[] } | null = null;
    if (res.success && res.product) {
      await sendDiscordWebsiteLog({
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
    return NextResponse.json({ success: false, message: 'تعذر تفعيل المفتاح الآن. حاول مرة أخرى لاحقاً.' }, { status: 503 });
  }
}
