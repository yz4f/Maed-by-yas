import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await StoreDB.getFaqCategories(true);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل التصنيفات حالياً.' }, { status: 500 });
  }
}
