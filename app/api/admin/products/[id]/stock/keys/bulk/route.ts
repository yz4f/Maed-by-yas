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
    const { keys, duration, allowDuplicates } = body;

    let keysList: string[] = [];
    if (Array.isArray(keys)) {
      keysList = keys.map((k) => String(k || ''));
    } else if (typeof keys === 'string') {
      keysList = keys.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
    } else {
      return NextResponse.json({
        success: false,
        message: 'مصفوفة المفاتيح (keys) مطلوبة.',
      }, { status: 400 });
    }

    if (keysList.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لم يتم إرسال أي مفاتيح صالحة.',
      }, { status: 400 });
    }

    const product = await StoreDB.getProductById(productId);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'المنتج المطلوب غير موجود.',
      }, { status: 404 });
    }

    const actor = await getSessionActor();
    const actorId = actor?.discordId || 'admin-system';
    const actorName = actor?.name || 'Admin';

    const result = await StoreDB.bulkAddKeysStructured(productId, keysList, actorId, duration, allowDuplicates !== false);

    if (result.inserted > 0) {
      await StoreDB.addLog(
        'Stock Keys Added',
        `تمت إضافة ${result.inserted} مفتاحاً لمنتج ${product.name}${result.duplicates ? `، وتخطي ${result.duplicates} مكرراً` : ''}.`,
        actorId,
        actorName,
        getClientIp(req),
        {
          eventType: 'stock_keys_bulk_added',
          actorDiscordId: actor?.discordId || null,
          actorName,
          productId,
          metadata: {
            inserted: result.inserted,
            duplicates: result.duplicates,
            invalid: result.invalid,
          },
        }
      );

      void sendDiscordWebsiteLog({
        type: 'keyInventoryChanged',
        customerId: actorId,
        customerName: actorName,
        customerImage: actor?.image || null,
        productName: product.name,
        action: 'added',
        keyCount: result.inserted,
      }).catch((err) => console.error('[Discord Log] Bulk key add failed:', err));
    }

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      duplicates: result.duplicates,
      invalid: result.invalid,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Failed to bulk add keys:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر معالجة إضافة المفاتيح حالياً.',
    }, { status: 500 });
  }
}
