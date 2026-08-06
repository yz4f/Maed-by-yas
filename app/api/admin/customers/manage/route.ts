import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';

export async function POST(req: Request) {
  try {
    const { action, userId, productId, status } = await req.json();

    const userObj = (await StoreDB.getUsers()).find((u) => u.id === userId);

    if (action === 'remove_product') {
      await StoreDB.removeProductFromUser(userId, productId);
      if (userObj?.discordId) {
        // Trigger Discord role removal
        const prod = await StoreDB.getProductById(productId);
        if (prod?.name.toLowerCase().includes('fortnite')) {
          await DiscordBotService.removeRoleFromMember(userObj.discordId, '1483330317040484364');
        }
      }
      return NextResponse.json({ success: true, message: 'تم إزالة المنتج وتحديث رتب الديسكورد.' });
    }

    if (action === 'add_product') {
      await StoreDB.addProductToUser(userId, productId);
      return NextResponse.json({ success: true, message: 'تم إضافة المنتج للعميل بنجاح.' });
    }

    if (action === 'update_status') {
      await StoreDB.updateUserProductStatus(userId, productId, status);
      return NextResponse.json({ success: true, message: 'تم تحديث حالة المنتج.' });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
