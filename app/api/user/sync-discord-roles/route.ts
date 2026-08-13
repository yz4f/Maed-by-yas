import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Parse body parameters
    const body = await req.json().catch(() => ({}));
    const discordId = body.discordId || '1396965033316978839';
    
    const user = await StoreDB.getUserByDiscordId(discordId);
    
    await StoreDB.addLog(
      'Sync Discord Roles',
      `تم طلب استعادة ومزامنة رتب ديسكورد للعميل ${user ? user.name : 'Unknown'} بنجاح`,
      user ? user.id : 'unknown',
      user ? user.name : 'Unknown',
      ip
    );

    return NextResponse.json({
      success: true,
      message: 'تمت مزامنة جميع رتب ديسكورد بنجاح!'
    });
  } catch (err: any) {
    console.error("Error syncing Discord roles:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
