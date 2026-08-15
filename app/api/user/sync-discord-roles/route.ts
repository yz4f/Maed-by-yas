import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DiscordBotService } from '@/lib/discord';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 20_000;
const recentRequests = new Map<string, number>();

function clientIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const discordId = sessionUser?.discordId ? String(sessionUser.discordId) : '';
    if (!discordId) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول عبر ديسكورد أولًا.' }, { status: 401 });
    }

    const now = Date.now();
    const lastRequestAt = recentRequests.get(discordId) || 0;
    if (now - lastRequestAt < COOLDOWN_MS) {
      const seconds = Math.ceil((COOLDOWN_MS - (now - lastRequestAt)) / 1000);
      return NextResponse.json({ success: false, message: `يرجى الانتظار ${seconds} ثانية قبل إعادة المحاولة.` }, { status: 429 });
    }
    recentRequests.set(discordId, now);

    const user = await StoreDB.getUserByDiscordId(discordId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'لا توجد استحقاقات مرتبطة بحساب ديسكورد هذا بعد.' }, { status: 404 });
    }

    const activeProducts = (await StoreDB.getUserProducts(user.id)).filter((product) => {
      if (product.status !== 'Active' || !product.product?.name) return false;
      return !product.expiresAt || new Date(product.expiresAt).getTime() > Date.now();
    });
    if (activeProducts.length === 0) {
      await StoreDB.addLog('Discord Role Restore', 'تم رفض طلب استرجاع الرتب لعدم وجود تراخيص مفعلة.', user.id, user.name, clientIp(request));
      return NextResponse.json({ success: false, message: 'لا توجد تراخيص مفعلة لاسترجاع رتبها.' }, { status: 403 });
    }

    const result = await DiscordBotService.restoreEntitledRoles(
      discordId,
      activeProducts.map((product) => product.product?.name || '')
    );

    await StoreDB.addLog(
      'Discord Role Restore',
      result.success
        ? `تمت استعادة ${result.restoredRoleIds.length} رتبة استحقاق مرتبطة بالتراخيص المفعلة.`
        : 'تعذر استعادة جميع رتب الاستحقاق المرتبطة بالتراخيص المفعلة.',
      user.id,
      user.name,
      clientIp(request)
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        restoredCount: result.restoredRoleIds.length
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      restoredCount: result.restoredRoleIds.length
    });
  } catch (error) {
    console.error('Discord role restore failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر استرجاع رتب ديسكورد الآن. حاول لاحقًا.' }, { status: 500 });
  }
}
