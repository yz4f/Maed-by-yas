import { after, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { hasStockPermission } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';
import { KeyStatus } from '@/types';

type RouteContext = { params: Promise<{ id: string; keyId: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }

  const hasEdit = await hasStockPermission('stock.edit');
  const hasDisable = await hasStockPermission('stock.disable');
  if (!hasEdit && !hasDisable) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل المفاتيح.' }, { status: 403 });
  }

  try {
    const { id: productId, keyId } = await params;
    const body = await req.json();
    const { status, key: newKeyString } = body;

    const actor = await getSessionActor();
    const actorId = actor?.discordId || 'admin-system';
    const actorName = actor?.name || 'Admin';

    if (status) {
      const validStatuses: KeyStatus[] = ['available', 'disabled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: 'حالة المفتاح غير صالحة.' }, { status: 400 });
      }

      const res = await StoreDB.setKeyStatus(keyId, status);
      if (!res.success) {
        return NextResponse.json(res, { status: 400 });
      }

      await StoreDB.addLog(
        status === 'disabled' ? 'Stock Key Disabled' : 'Stock Key Status Changed',
        `تم تغيير حالة المفتاح إلى: ${status}`,
        actorId,
        actorName,
        getClientIp(req),
        {
          eventType: 'stock_key_status_changed',
          actorDiscordId: actor?.discordId || null,
          actorName,
          productId,
          keyId,
          metadata: { newStatus: status },
        }
      );

      return NextResponse.json({
        success: true,
        key: res.key,
        message: res.message || 'تم تحديث حالة المفتاح بنجاح.',
      });
    }

    if (newKeyString && typeof newKeyString === 'string') {
      const clean = newKeyString.trim();
      const allKeys = await StoreDB.getKeys();
      const duplicate = allKeys.some(
        (k) => k.id !== keyId && (!k.isArchived || k.isUsed) && (k.key || '').trim().toUpperCase() === clean.toUpperCase()
      );
      if (duplicate) {
        return NextResponse.json({ success: false, message: 'هذا الكود موجود بالفعل في المخزون.' }, { status: 409 });
      }

      await StoreDB.updateKey(keyId, { key: clean, updatedAt: new Date().toISOString() });
      await StoreDB.addLog(
        'Stock Key Edited',
        'تم تعديل كود المفتاح بالمخزون.',
        actorId,
        actorName,
        getClientIp(req),
        {
          eventType: 'stock_key_edited',
          actorDiscordId: actor?.discordId || null,
          actorName,
          productId,
          keyId,
        }
      );

      return NextResponse.json({ success: true, message: 'تم تعديل كود المفتاح بنجاح.' });
    }

    return NextResponse.json({ success: false, message: 'لا توجد بيانات للتعديل.' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update key:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر تحديث المفتاح.',
    }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  if (!requestHasTrustedOrigin(req)) {
    return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
  }

  if (!await hasStockPermission('stock.delete')) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بحذف المفاتيح.' }, { status: 403 });
  }

  try {
    const { id: productId, keyId } = await params;
    const actor = await getSessionActor();
    const actorId = actor?.discordId || 'admin-system';
    const actorName = actor?.name || 'Admin';

    const result = await StoreDB.deleteKeySafely(keyId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    const product = await StoreDB.getProductById(productId);
    const actionTitle = 'Stock Key Deleted';
    const details = `تم حذف مفتاح من مخزون منتج ${product?.name || productId} فورياً؛ تبقى تراخيص العملاء المحفوظة مستقلة عن سجل المخزون.`;

    await StoreDB.addLog(
      actionTitle,
      details,
      actorId,
      actorName,
      getClientIp(req),
      {
        eventType: 'stock_key_deleted',
        actorDiscordId: actor?.discordId || null,
        actorName,
        productId,
        keyId,
        metadata: { wasDisabledInstead: false },
      }
    );

    after(async () => {
      await sendDiscordWebsiteLog({
        type: 'keyInventoryChanged',
        customerId: actorId,
        customerName: actorName,
        customerImage: actor?.image || null,
        productName: product?.name || productId,
        action: 'deleted',
        keyCount: 1,
      }).catch((err) => console.error('[Discord Log] Key delete log failed:', err));
    });

    return NextResponse.json({
      success: true,
      wasDisabledInstead: result.wasDisabledInstead,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Failed to delete key safely:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'تعذر إتمام عملية الحذف.',
    }, { status: 500 });
  }
}
