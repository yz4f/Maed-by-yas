import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = await StoreDB.getKeys();
  const products = await StoreDB.getProducts();
  return NextResponse.json({ success: true, keys, products });
}
