import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false }, { status: 403 });
  try {
    const stats = await StoreDB.getStats();
    return NextResponse.json({ success: true, stats }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    console.error('Database diagnostics failed:', err);
    return NextResponse.json({ success: false, message: 'تعذر فحص قاعدة البيانات.' }, { status: 500 });
  }
}
