import { NextRequest, NextResponse } from 'next/server';
import { actorCanManageAi } from '@/lib/t3n-ai';
import { sendDiscordVoiceConsentRequest } from '@/lib/discord-bot';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';
import { createVoiceSupportSession, listVoiceSupportSessions, updateVoiceSupportSession } from '@/lib/voice-support';
import type { VoiceSupportSessionStatus } from '@/types';

export const dynamic = 'force-dynamic';

async function requireAdmin(request?: NextRequest) {
  if (request && !requestHasTrustedOrigin(request)) throw new Error('مصدر الطلب غير موثوق.');
  const actor = await getTicketActor();
  if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
  if (!actorCanManageAi(actor)) throw new Error('هذه العملية مخصصة للإدارة.');
  return actor;
}

export async function GET() {
  try {
    const actor = await requireAdmin();
    return NextResponse.json({ success: true, sessions: await listVoiceSupportSessions(actor) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر تحميل جلسات الدعم الصوتي.';
    return NextResponse.json({ success: false, error: message }, { status: message.includes('تسجيل الدخول') ? 401 : 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json() as { customerDiscordId?: string; customerName?: string; customerImage?: string | null; screenShareRequested?: boolean };
    const session = await createVoiceSupportSession(actor, {
      customerDiscordId: String(body.customerDiscordId || ''),
      customerName: String(body.customerName || ''),
      customerImage: body.customerImage || null,
      screenShareRequested: Boolean(body.screenShareRequested),
    });
    await sendDiscordVoiceConsentRequest(session);
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر إنشاء جلسة الدعم الصوتي.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json() as { sessionId?: string; status?: VoiceSupportSessionStatus; notes?: string; staffJoined?: boolean };
    if (!body.sessionId || !body.status) throw new Error('بيانات الجلسة غير مكتملة.');
    await updateVoiceSupportSession(actor, body.sessionId, body.status, {
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : undefined,
      staffJoined: typeof body.staffJoined === 'boolean' ? body.staffJoined : undefined,
      endedAt: body.status === 'ENDED' ? new Date().toISOString() : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر تحديث جلسة الدعم الصوتي.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
