import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, resultsCount, lang } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ success: false, message: 'استعلام البحث فارغ' }, { status: 400 });
    }

    await StoreDB.logFaqSearch(
      query.slice(0, 100),
      typeof resultsCount === 'number' ? resultsCount : 0,
      lang === 'en' ? 'en' : 'ar'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging search query:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
