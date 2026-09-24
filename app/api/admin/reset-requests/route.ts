import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listResetRequests, processResetRequest } from '@/lib/reset-requests';
import { getAuthenticatedActor, requestHasTrustedOrigin } from '@/lib/request-actor';
import { getClientIp } from '@/lib/request-security';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('process'), requestId: z.string().trim().min(1).max(180), decision: z.enum(['approve', 'reject', 'request_info', 'complete']), note: z.string().trim().max(1000).optional() }),
]);

async function administrator() {
  const actor = await getAuthenticatedActor();
  if (!actor) return { response: NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 }) };
  if (!await hasPermission(actor, 'keys.reset')) return { response: NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 }) };
  return { actor };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ الطلب.';
  console.error('Admin reset request endpoint failed:', error);
  return NextResponse.json({ success: false, error: message }, { status: /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة/.test(message) ? 403 : 400 });
}

export async function GET() {
  try {
    const result = await administrator();
    if ('response' in result) return result.response;
    return NextResponse.json({ success: true, requests: await listResetRequests(result.actor) });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const result = await administrator();
    if ('response' in result) return result.response;
    const input = actionSchema.parse(await request.json());
    return NextResponse.json({ success: true, request: await processResetRequest(result.actor, { requestId: input.requestId, action: input.decision, note: input.note, ipAddress: getClientIp(request) }) });
  } catch (error) { return failure(error); }
}
