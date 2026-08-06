import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyString, userProfile } = body;

    if (!keyString) {
      return NextResponse.json({ success: false, message: 'مفتاح التفعيل مطلوب.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const res = await StoreDB.activateProductWithKey(
      keyString,
      {
        discordId: userProfile?.discordId || '1396965033316978839',
        name: userProfile?.name || 'Customer',
        email: userProfile?.email,
        image: userProfile?.image,
      },
      ip
    );

    if (res.success && res.product && userProfile?.discordId) {
      try {
        await DiscordBotService.syncRolesOnProductActivation(userProfile.discordId, res.product.name);
      } catch (e) {
        // Discord bot may not be configured locally
      }
    }

    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
