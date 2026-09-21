import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import { FaqItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول لإدارة الأسئلة.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const search = searchParams.get('q') || undefined;

    const faqs = await StoreDB.getFaqs({
      categoryId,
      search,
      onlyPublished: false, // Admin views all
    });

    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error('Admin FAQs fetch failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر جلب الأسئلة.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإضافة الأسئلة.' }, { status: 403 });
  }

  try {
    const admin = await getSessionActor();
    const ip = getClientIp(request);
    const body = await request.json();

    const {
      category_id,
      question_ar,
      question_en,
      answer_ar,
      answer_en,
      keywords,
      is_pinned,
      is_published,
      sort_order,
    } = body;

    // Strict validation
    if (!question_ar || typeof question_ar !== 'string' || !question_ar.trim()) {
      return NextResponse.json({ success: false, message: 'عنوان السؤال باللغة العربية مطلوب.' }, { status: 400 });
    }
    if (!answer_ar || typeof answer_ar !== 'string' || !answer_ar.trim()) {
      return NextResponse.json({ success: false, message: 'نص الإجابة باللغة العربية مطلوب.' }, { status: 400 });
    }
    if (!category_id || typeof category_id !== 'string') {
      return NextResponse.json({ success: false, message: 'يرجى تحديد التصنيف المناسب.' }, { status: 400 });
    }

    const newFaq: FaqItem = {
      id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category_id: category_id.trim(),
      question_ar: question_ar.trim(),
      question_en: (question_en || question_ar).trim(),
      answer_ar: answer_ar.trim(),
      answer_en: (answer_en || answer_ar).trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((k: string) => String(k).trim()).filter(Boolean)
        : typeof keywords === 'string'
        ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
      is_pinned: Boolean(is_pinned),
      is_published: is_published !== undefined ? Boolean(is_published) : true,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_by: admin?.name || 'Admin',
    };

    const result = await StoreDB.createFaq(newFaq);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر إنشاء السؤال.' }, { status: 400 });
    }

    // Audit Log
    await StoreDB.addLog(
      'FAQ_CREATED',
      `تمت إضافة سؤال جديد: «${newFaq.question_ar}»`,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: 'FAQ_CREATED',
        description: `إضافة سؤال: ${newFaq.question_ar}`,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { faqId: newFaq.id, categoryId: newFaq.category_id },
      }
    );

    return NextResponse.json({ success: true, faq: result.faq });
  } catch (error) {
    console.error('Admin create FAQ error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حفظ السؤال.' }, { status: 500 });
  }
}
