import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET(req: Request, { params }: { params: { productId: string } }) {
  const { productId } = params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'user-demo-customer';
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  const result = await StoreDB.recordDownload(userId, productId, ip);
  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}
