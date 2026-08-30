import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';

export async function POST(req: Request) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإضافة مفاتيح إلى المخزون.' }, { status: 403 });
  }
  try {
    const { productId, rawKeysText, duration } = await req.json();

    if (!productId || !rawKeysText) {
      return NextResponse.json({ success: false, message: 'معرف المنتج ونص المفاتيح مطلوبين.' }, { status: 400 });
    }

    const actor = await getSessionActor();
    const res = await StoreDB.bulkAddKeys(productId, rawKeysText, actor?.discordId || 'admin-system', duration);
    if (res.count > 0) {
      const product = await StoreDB.getProductById(productId);
      const details = `تمت إضافة أو استعادة ${res.count} مفتاحاً لمنتج ${product?.name || productId}${res.skipped ? `، وتم تجاهل ${res.skipped} مكرراً` : ''}.`;
      await StoreDB.addLog('Key Inventory Updated', details, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req), {
        eventType: 'key_inventory_updated', actorDiscordId: actor?.discordId || null, actorName: actor?.name || 'Admin', productId,
        metadata: { action: 'add_or_restore_keys', keyCount: res.count, skipped: res.skipped },
      });
      void sendDiscordWebsiteLog({
        type: 'keyInventoryChanged',
        customerId: actor?.discordId || 'admin-system',
        customerName: actor?.name || 'Admin',
        customerImage: actor?.image || null,
        productName: product?.name || productId,
        action: 'added',
        keyCount: res.count,
      }).catch((error) => console.error('[Discord Log] Key inventory update failed:', error));
    }
    return NextResponse.json({ success: true, count: res.count, skipped: res.skipped });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
