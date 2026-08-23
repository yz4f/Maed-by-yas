import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordProductStatus } from '@/lib/discord-bot';
import { actorCanManageAi } from '@/lib/t3n-ai';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (!actorCanManageAi(actor)) return NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 });
    const result = await sendDiscordProductStatus();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر إرسال بطاقة حالة المنتجات.';
    console.error('Discord product status publish failed:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
