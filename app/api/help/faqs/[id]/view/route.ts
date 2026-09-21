import { NextRequest, NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await StoreDB.incrementFaqView(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording FAQ view:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
