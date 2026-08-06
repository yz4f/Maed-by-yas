import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await StoreDB.getUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error("Customers API failed:", err);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
