import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = await StoreDB.getLogs();
  return NextResponse.json({ success: true, logs });
}
