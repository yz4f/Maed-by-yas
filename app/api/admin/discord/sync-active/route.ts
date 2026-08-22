import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { DiscordBotService } from '@/lib/discord';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) {
      return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
    }

    const actor = await getSessionActor();
    if (!actor) return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, message: 'غير مصرح لك بمزامنة رتب العملاء.' }, { status: 403 });
    if (!DiscordBotService.isConfigured()) {
      return NextResponse.json({ success: false, message: 'بوت ديسكورد غير مهيأ. تحقق من متغيرات الخدمة أولاً.' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return NextResponse.json({
        success: false,
        message: 'تحتاج هذه العملية إلى تأكيد صريح لأنها ستمنح رتباً للعملاء ذوي التراخيص النشطة السابقة.',
      }, { status: 400 });
    }

    const now = Date.now();
    const users = await StoreDB.getUsers();
    const report = { scanned: users.length, eligible: 0, synced: 0, partial: 0, skipped: 0, failed: 0 };
    const failures: Array<{ userId: string; message: string }> = [];

    for (const user of users) {
      if (!user.discordId || user.isBanned) {
        report.skipped += 1;
        continue;
      }

      const activeProducts = (await StoreDB.getUserProducts(user.id)).filter((product) => {
        if (product.status !== 'Active' || !product.product?.name) return false;
        return !product.expiresAt || new Date(product.expiresAt).getTime() > now;
      });
      if (activeProducts.length === 0) {
        report.skipped += 1;
        continue;
      }

      report.eligible += 1;
      const result = await DiscordBotService.syncEntitledRoles(
        user.discordId,
        activeProducts.map((product) => product.product?.name || ''),
      );

      await StoreDB.addLog(
        'Discord Role Backfill',
        result.success
          ? `تمت مزامنة رتبة Customer ورتب المنتجات النشطة للعميل ${user.name}.`
          : `تعذرت مزامنة جميع الرتب للعميل ${user.name}: ${result.message}`,
        user.id,
        user.name,
        getClientIp(request),
      );

      if (result.success) report.synced += 1;
      else if (result.grantedRoleIds.length > 0) report.partial += 1;
      else report.failed += 1;
      if (!result.success) failures.push({ userId: user.id, message: result.message });

      // Keep bulk Discord updates comfortably below rate limits.
      await pause(180);
    }

    await StoreDB.addLog(
      'Discord Role Backfill Summary',
      `مزامنة الرتب السابقة: ${report.synced} مكتملة، ${report.partial} جزئية، ${report.failed} فاشلة، ${report.skipped} تم تجاوزها.`,
      actor.discordId,
      actor.name,
      getClientIp(request),
    );

    return NextResponse.json({
      success: report.failed === 0 && report.partial === 0,
      message: report.failed || report.partial
        ? 'اكتملت المزامنة مع وجود حالات تحتاج مراجعة في سجل النظام.'
        : 'اكتملت مزامنة Customer ورتب المنتجات لكل العملاء المؤهلين.',
      report,
      failures: failures.slice(0, 20),
    });
  } catch (error) {
    console.error('Discord role backfill failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر إكمال مزامنة الرتب السابقة حالياً.' }, { status: 500 });
  }
}
