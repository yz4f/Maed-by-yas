import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, productId } = body;

    if (!userId || !productId) {
      return NextResponse.json({ success: false, message: 'بيانات ناقصة.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await StoreDB.recordDownload(userId, productId, ip);

    return NextResponse.json(result, { status: result.success ? 200 : 403 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
