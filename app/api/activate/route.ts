import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, discordId, name, email, image } = body;

    if (!key) {
      return NextResponse.json({ success: false, message: 'مفتاح التفعيل مطلوب.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Process activation in DB
    const res = await StoreDB.activateProductWithKey(
      key,
      {
        discordId: discordId || '1396965033316978839',
        name: name || 'Customer',
        email,
        image,
      },
      ip
    );

    if (res.success && res.product && discordId) {
      // Trigger automated Discord roles assignment
      await DiscordBotService.syncRolesOnProductActivation(discordId, res.product.name);
    }

    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
