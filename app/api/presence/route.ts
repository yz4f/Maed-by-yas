import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordWebsiteLog } from '@/lib/discord-bot';
import { listActiveSitePresence, recordSiteHeartbeat, recordSiteLogout } from '@/lib/site-presence';
import { sendSmsAuditAlert } from '@/lib/sms-alerts';
import { canManageTickets, getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تحديث حالة الحضور حالياً.';
  return NextResponse.json({ success: false, error: message }, { status: /تسجيل الدخول/.test(message) ? 401 : /صلاحية|مخصصة للإدارة/.test(message) ? 403 : 400 });
}

export async function GET() {
  try {
    const actor = await getTicketActor();
    if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
    if (!canManageTickets(actor)) throw new Error('هذه البيانات مخصصة للإدارة.');
    const active = await listActiveSitePresence();
    return NextResponse.json({ success: true, active, generatedAt: new Date().toISOString() });
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
    const presence = await recordSiteHeartbeat({ discordId: actor.id, name: actor.name, image: actor.image, role: actor.role });
    return NextResponse.json({ success: true, presence });
  } catch (error) {
    return failed(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
    const presence = await recordSiteLogout({ discordId: actor.id, name: actor.name, image: actor.image, role: actor.role });
    await sendDiscordWebsiteLog({ type: 'logout', customerId: actor.id, customerName: actor.name, customerImage: actor.image }).catch((error) => console.error('[Website Presence] Logout log failed:', error));
    if (process.env.SMS_ALERTS_ENABLED === '1') {
      void sendSmsAuditAlert({ action: 'Logout', actorName: actor.name })
        .catch((error) => console.error('[SMS Audit] Logout alert failed:', error));
    }
    return NextResponse.json({ success: true, presence });
  } catch (error) {
    return failed(error);
  }
}
