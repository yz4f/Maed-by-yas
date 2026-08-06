import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdOrDiscordId = searchParams.get('userId') || 'user-demo-customer';

  // First try to find the user by Discord ID to get their true internal userId
  const user = await StoreDB.getUserByDiscordId(userIdOrDiscordId);
  const targetUserId = user ? user.id : userIdOrDiscordId;

  const products = await StoreDB.getUserProducts(targetUserId);
  return NextResponse.json({ success: true, products });
}
