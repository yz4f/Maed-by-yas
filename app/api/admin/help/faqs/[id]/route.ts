import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import { normalizeFaqImage } from '@/lib/faq-image';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل الأسئلة.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = await getSessionActor();
    const ip = getClientIp(request);
    const body = await request.json();

    const existing = await StoreDB.getFaqById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'السؤال غير موجود.' }, { status: 404 });
    }

    const updates: any = {};
    if (body.question_ar !== undefined) updates.question_ar = String(body.question_ar).trim();
    if (body.question_en !== undefined) updates.question_en = String(body.question_en).trim();
    if (body.answer_ar !== undefined) updates.answer_ar = String(body.answer_ar).trim();
    if (body.answer_en !== undefined) updates.answer_en = String(body.answer_en).trim();
    if (body.image_url !== undefined) {
      try {
        updates.image_url = normalizeFaqImage(body.image_url);
      } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'صورة السؤال غير صالحة.' }, { status: 400 });
      }
    }
    if (body.category_id !== undefined) updates.category_id = String(body.category_id).trim();
    if (body.is_pinned !== undefined) updates.is_pinned = Boolean(body.is_pinned);
    if (body.is_published !== undefined) updates.is_published = Boolean(body.is_published);
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.keywords !== undefined) {
      updates.keywords = Array.isArray(body.keywords)
        ? body.keywords.map((k: string) => String(k).trim()).filter(Boolean)
        : typeof body.keywords === 'string'
        ? body.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : [];
    }

    const result = await StoreDB.updateFaq(id, updates);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر تحديث السؤال.' }, { status: 400 });
    }

    // Determine audit action
    let auditAction = 'FAQ_UPDATED';
    let auditDesc = `تم تعديل بيانات السؤال: «${existing.question_ar}»`;
    if (body.is_pinned !== undefined && body.is_pinned !== existing.is_pinned) {
      auditAction = body.is_pinned ? 'FAQ_PINNED' : 'FAQ_UNPINNED';
      auditDesc = body.is_pinned ? `تم تثبيت السؤال: «${existing.question_ar}»` : `تم إلغاء تثبيت السؤال: «${existing.question_ar}»`;
    } else if (body.is_published !== undefined && body.is_published !== existing.is_published) {
      auditAction = body.is_published ? 'FAQ_PUBLISHED' : 'FAQ_UNPUBLISHED';
      auditDesc = body.is_published ? `تم نشر السؤال: «${existing.question_ar}»` : `تم تعطيل/إخفاء السؤال: «${existing.question_ar}»`;
    }

    await StoreDB.addLog(
      auditAction,
      auditDesc,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: auditAction,
        description: auditDesc,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { faqId: id, changedFields: Object.keys(updates) },
      }
    );

    return NextResponse.json({ success: true, faq: result.faq });
  } catch (error) {
    console.error('Admin update FAQ error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء تحديث السؤال.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بحذف الأسئلة.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = await getSessionActor();
    const ip = getClientIp(request);

    const existing = await StoreDB.getFaqById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'السؤال غير موجود.' }, { status: 404 });
    }

    const result = await StoreDB.deleteFaq(id);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر حذف السؤال.' }, { status: 400 });
    }

    await StoreDB.addLog(
      'FAQ_DELETED',
      `تم حذف السؤال: «${existing.question_ar}»`,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: 'FAQ_DELETED',
        description: `حذف سؤال: ${existing.question_ar}`,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { faqId: id, question_ar: existing.question_ar },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete FAQ error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حذف السؤال.' }, { status: 500 });
  }
}
