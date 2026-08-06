import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await StoreDB.getStats();
  return NextResponse.json({ success: true, stats });
}
