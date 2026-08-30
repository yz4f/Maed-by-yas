import { NextResponse } from 'next/server';
import { getKeyStockSummary, StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';

export async function GET(req: Request) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول إلى المفاتيح.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const keys = await StoreDB.getKeysByProduct(productId);
      return NextResponse.json({ success: true, keys, stock: getKeyStockSummary(keys) });
    }

    const keys = await StoreDB.getKeys();
    return NextResponse.json({ success: true, keys, stock: getKeyStockSummary(keys) });
  } catch (err: any) {
    console.error("Keys API failed:", err);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المفاتيح.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { keyId, deleteAllForProductId } = body;
    const actor = await getSessionActor();

    if (deleteAllForProductId) {
      const product = await StoreDB.getProductById(deleteAllForProductId);
      const deletedCount = await StoreDB.deleteAllKeysForProduct(deleteAllForProductId);
      if (deletedCount > 0) {
        const details = `تم حذف ${deletedCount} مفتاح غير مستخدم من منتج ${product?.name || deleteAllForProductId}.`;
        await StoreDB.addLog('Key Inventory Deleted', details, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req), {
          eventType: 'key_inventory_deleted', actorDiscordId: actor?.discordId || null, actorName: actor?.name || 'Admin', productId: deleteAllForProductId,
          metadata: { action: 'delete_unused_keys', keyCount: deletedCount },
        });
        void sendDiscordWebsiteLog({
          type: 'keyInventoryChanged', customerId: actor?.discordId || 'admin-system', customerName: actor?.name || 'Admin', customerImage: actor?.image || null,
          productName: product?.name || deleteAllForProductId, action: 'deleted', keyCount: deletedCount,
        }).catch((error) => console.error('[Discord Log] Key inventory deletion failed:', error));
      }
      return NextResponse.json({
        success: true,
        count: deletedCount,
        message: deletedCount > 0
          ? `تم حذف ${deletedCount} مفتاح غير مستخدم بنجاح.`
          : 'لا توجد مفاتيح غير مستخدمة للحذف.'
      });
    }

    if (!keyId) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح مطلوب' }, { status: 400 });
    }

    const existingKey = (await StoreDB.getKeys()).find((key) => key.id === keyId);
    const product = existingKey ? await StoreDB.getProductById(existingKey.productId) : null;
    const result = await StoreDB.deleteKey(keyId);
    if (result) {
      const details = `تم حذف مفتاح غير مستخدم من منتج ${product?.name || existingKey?.productId || 'غير معروف'}.`;
      await StoreDB.addLog('Key Inventory Deleted', details, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req), {
        eventType: 'key_inventory_deleted', actorDiscordId: actor?.discordId || null, actorName: actor?.name || 'Admin', productId: existingKey?.productId || null, keyId,
        metadata: { action: 'delete_unused_key' },
      });
      void sendDiscordWebsiteLog({
        type: 'keyInventoryChanged', customerId: actor?.discordId || 'admin-system', customerName: actor?.name || 'Admin', customerImage: actor?.image || null,
        productName: product?.name || existingKey?.productId || 'Unknown product', action: 'deleted', keyCount: 1,
      }).catch((error) => console.error('[Discord Log] Key deletion failed:', error));
    }
    return NextResponse.json({
      success: result,
      message: result ? 'تم حذف المفتاح غير المستخدم بنجاح.' : 'تعذر حذف المفتاح لأنه غير موجود أو مستخدم بالفعل.'
    }, { status: result ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة المفاتيح.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { keyId, newKey } = body;

    if (typeof keyId !== 'string' || !keyId.trim() || typeof newKey !== 'string' || !newKey.trim()) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح والكود الجديد مطلوبان' }, { status: 400 });
    }

    const allKeys = await StoreDB.getKeys();
    const currentKey = allKeys.find((key) => key.id === keyId);
    if (!currentKey) return NextResponse.json({ success: false, message: 'المفتاح غير موجود.' }, { status: 404 });
    const normalizedNewKey = newKey.trim().toUpperCase();
    const duplicate = allKeys.some((key) => key.id !== keyId && (key.isUsed || !key.isArchived) && key.key.trim().toUpperCase() === normalizedNewKey);
    if (duplicate) return NextResponse.json({ success: false, message: 'هذا المفتاح مستخدم أو موجود بالفعل.' }, { status: 409 });

    const result = await StoreDB.updateKey(keyId, { key: newKey.trim(), isArchived: false, isDisabled: false, isUsed: false, archivedAt: null });
    const actor = await getSessionActor();
    const product = await StoreDB.getProductById(currentKey.productId);
    if (result) {
      await StoreDB.addLog('Key Inventory Updated', `تم تعديل مفتاح في منتج ${product?.name || currentKey.productId}.`, actor?.discordId || 'admin-system', actor?.name || 'Admin', getClientIp(req), {
        eventType: 'key_inventory_updated', actorDiscordId: actor?.discordId || null, actorName: actor?.name || 'Admin', productId: currentKey.productId, keyId,
        metadata: { action: 'update_key' },
      });
      void sendDiscordWebsiteLog({
        type: 'keyInventoryChanged', customerId: actor?.discordId || 'admin-system', customerName: actor?.name || 'Admin', customerImage: actor?.image || null,
        productName: product?.name || currentKey.productId, action: 'updated', keyCount: 1,
      }).catch((error) => console.error('[Discord Log] Key update failed:', error));
    }
    return NextResponse.json({ success: result, message: result ? 'تم تحديث الكود بنجاح' : 'تعذر تحديث الكود' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
