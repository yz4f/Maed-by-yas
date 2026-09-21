import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل التصنيف.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = await getSessionActor();
    const ip = getClientIp(request);
    const body = await request.json();

    const existing = await StoreDB.getFaqCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'التصنيف غير موجود.' }, { status: 404 });
    }

    const updates: any = {};
    if (body.name_ar !== undefined) updates.name_ar = String(body.name_ar).trim();
    if (body.name_en !== undefined) updates.name_en = String(body.name_en).trim();
    if (body.description_ar !== undefined) updates.description_ar = String(body.description_ar).trim();
    if (body.description_en !== undefined) updates.description_en = String(body.description_en).trim();
    if (body.icon !== undefined) updates.icon = String(body.icon).trim();
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

    const result = await StoreDB.updateFaqCategory(id, updates);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر تحديث التصنيف.' }, { status: 400 });
    }

    await StoreDB.addLog(
      'FAQ_CATEGORY_UPDATED',
      `تم تحديث التصنيف: «${existing.name_ar}»`,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: 'FAQ_CATEGORY_UPDATED',
        description: `تحديث تصنيف: ${existing.name_ar}`,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { categoryId: id, updates },
      }
    );

    return NextResponse.json({ success: true, category: result.category });
  } catch (error) {
    console.error('Admin update category error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء تعديل التصنيف.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بحذف التصنيف.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = await getSessionActor();
    const ip = getClientIp(request);

    const existing = await StoreDB.getFaqCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'التصنيف غير موجود.' }, { status: 404 });
    }

    const result = await StoreDB.deleteFaqCategory(id);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر حذف التصنيف.' }, { status: 400 });
    }

    await StoreDB.addLog(
      'FAQ_CATEGORY_DELETED',
      `تم حذف التصنيف: «${existing.name_ar}»`,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: 'FAQ_CATEGORY_DELETED',
        description: `حذف تصنيف: ${existing.name_ar}`,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { categoryId: id, name_ar: existing.name_ar },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حذف التصنيف.' }, { status: 500 });
  }
}
