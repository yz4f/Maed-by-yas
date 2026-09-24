import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordProductStatus } from '@/lib/discord-bot';
import { hasPermission } from '@/lib/permissions';
import { getAuthenticatedActor, requestHasTrustedOrigin } from '@/lib/request-actor';
import { getClientIp } from '@/lib/request-security';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getAuthenticatedActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (!await hasPermission(actor, 'announcements.publish')) return NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 });
    const result = await sendDiscordProductStatus();
    await StoreDB.addLog('Product Status Published', 'تم إرسال حالة المنتجات إلى Discord.', actor.id, actor.name, getClientIp(request), {
      eventType: 'product_status_published', actorDiscordId: actor.id, actorName: actor.name,
      metadata: { action: 'publish_product_status' },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر إرسال بطاقة حالة المنتجات.';
    console.error('Discord product status publish failed:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
