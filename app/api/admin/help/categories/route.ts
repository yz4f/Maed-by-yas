import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import { FaqCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإدارة التصنيفات.' }, { status: 403 });
  }

  try {
    const categories = await StoreDB.getFaqCategories(false);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Admin categories fetch error:', error);
    return NextResponse.json({ success: false, message: 'تعذر جلب التصنيفات.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorizedAdmin()) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بإنشاء التصنيفات.' }, { status: 403 });
  }

  try {
    const admin = await getSessionActor();
    const ip = getClientIp(request);
    const body = await request.json();
    const { name_ar, name_en, description_ar, description_en, icon, sort_order, is_active } = body;

    if (!name_ar || typeof name_ar !== 'string' || !name_ar.trim()) {
      return NextResponse.json({ success: false, message: 'اسم التصنيف باللغة العربية مطلوب.' }, { status: 400 });
    }

    const newCategory: FaqCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name_ar: name_ar.trim(),
      name_en: (name_en || name_ar).trim(),
      description_ar: (description_ar || '').trim(),
      description_en: (description_en || description_ar || '').trim(),
      icon: (icon || 'HelpCircle').trim(),
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await StoreDB.createFaqCategory(newCategory);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'تعذر إنشاء التصنيف.' }, { status: 400 });
    }

    await StoreDB.addLog(
      'FAQ_CATEGORY_CREATED',
      `تم إنشاء تصنيف جديد: «${newCategory.name_ar}»`,
      admin?.discordId || 'admin',
      admin?.name || 'Admin',
      ip,
      {
        eventType: 'FAQ_CATEGORY_CREATED',
        description: `إنشاء تصنيف: ${newCategory.name_ar}`,
        actorName: admin?.name || 'Admin',
        actorDiscordId: admin?.discordId || null,
        metadata: { categoryId: newCategory.id },
      }
    );

    return NextResponse.json({ success: true, category: result.category });
  } catch (error) {
    console.error('Admin create category error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حفظ التصنيف.' }, { status: 500 });
  }
}
