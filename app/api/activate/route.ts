import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, discordId, name, email, image } = body;

    if (!key || !discordId || typeof discordId !== 'string') {
      return NextResponse.json({ success: false, message: 'مفتاح التفعيل وحساب ديسكورد صالحان مطلوبان.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const res = await StoreDB.activateProductWithKey(
      key.trim(),
      {
        discordId,
        name: typeof name === 'string' && name.trim() ? name.trim() : 'Customer',
        email,
        image,
      },
      ip,
    );

    const discordRoleSync = res.success && res.product
      ? await DiscordBotService.syncRolesOnProductActivation(discordId, res.product.name)
      : null;

    return NextResponse.json({ ...res, discordRoleSync }, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
