import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { hasStockPermission } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }

  if (!await hasStockPermission('stock.add')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإضافة مفاتيح إلى المخزون.' }, { status: 403 });
  }

  try {
    const { id: productId } = await params;
    const body = await req.json();
    const { key, duration, allowDuplicates } = body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ success: false, message: 'كود المفتاح مطلوب.' }, { status: 400 });
    }

    const product = await StoreDB.getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'المنتج المطلوب غير موجود.' }, { status: 404 });
    }

    const actor = await getSessionActor();
    const actorId = actor?.discordId || 'admin-system';
    const actorName = actor?.name || 'Admin';

    const result = await StoreDB.addSingleKey(productId, key, actorId, duration, allowDuplicates !== false);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Audit Logging
    await StoreDB.addLog(
      'Stock Key Added',
      `تمت إضافة مفتاح فردي جديد لمنتج ${product.name}`,
      actorId,
      actorName,
      getClientIp(req),
      {
        eventType: 'stock_key_added',
        actorDiscordId: actor?.discordId || null,
        actorName,
        productId,
        keyId: result.key?.id,
        metadata: { action: 'add_single_key' },
      }
    );

    void sendDiscordWebsiteLog({
      type: 'keyInventoryChanged',
      customerId: actorId,
      customerName: actorName,
      customerImage: actor?.image || null,
      productName: product.name,
      action: 'added',
      keyCount: 1,
    }).catch((err) => console.error('[Discord Log] Single key add failed:', err));

    return NextResponse.json({
      success: true,
      key: result.key,
      message: 'تمت إضافة المفتاح بنجاح.',
    });
  } catch (error: any) {
    console.error('Failed to add single key:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر إضافة المفتاح حالياً.',
    }, { status: 500 });
  }
}
