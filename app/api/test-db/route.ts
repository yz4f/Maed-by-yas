import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push("Calling StoreDB.getStats()");
    const stats = await StoreDB.getStats();
    steps.push("getStats returned successfully");
    return NextResponse.json({ success: true, stats, steps });
  } catch (err: any) {
    steps.push(`getStats thrown: ${err.message}`);
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack,
      steps
    }, { status: 500 });
  }
}
