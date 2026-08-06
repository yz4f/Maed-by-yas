import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET() {
  const users = await StoreDB.getUsers();
  return NextResponse.json({ success: true, users });
}
