import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const isPinnedParam = searchParams.get('pinned');
    const isPinned = isPinnedParam !== null ? isPinnedParam === 'true' : undefined;

    const faqs = await StoreDB.getFaqs({
      categoryId,
      search,
      onlyPublished: true,
      isPinned,
    });

    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل الأسئلة حالياً.' }, { status: 500 });
  }
}
