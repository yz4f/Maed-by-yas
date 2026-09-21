import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const faq = await StoreDB.getFaqById(id);

    if (!faq || !faq.is_published) {
      return NextResponse.json({ success: false, message: 'السؤال غير موجود أو غير متاح.' }, { status: 404 });
    }

    // Related questions in same category
    const categoryFaqs = await StoreDB.getFaqs({
      categoryId: faq.category_id,
      onlyPublished: true,
    });
    const relatedFaqs = categoryFaqs
      .filter((f) => f.id !== faq.id)
      .slice(0, 3);

    return NextResponse.json({ success: true, faq, relatedFaqs });
  } catch (error) {
    console.error('Error fetching FAQ by id:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل السؤال.' }, { status: 500 });
  }
}
