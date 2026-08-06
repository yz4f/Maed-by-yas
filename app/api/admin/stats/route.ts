import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await StoreDB.getStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("Stats API failed:", err);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
