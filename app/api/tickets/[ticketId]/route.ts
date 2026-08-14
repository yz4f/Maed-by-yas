import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assignTicket, claimTicket, getTicketDetail, TicketError, updateTicket } from '@/lib/ticket-store';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';
const patchSchema = z.object({
  action: z.enum(['claim', 'assign', 'update']),
  status: z.enum(['new', 'open', 'in_progress', 'awaiting_user', 'awaiting_staff', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().trim().min(1).max(128).nullable().optional(),
  tags: z.array(z.string().trim().min(2).max(24)).max(8).optional(),
});

function fail(error: unknown) {
  if (error instanceof TicketError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  console.error('Ticket detail API failed:', error);
  return NextResponse.json({ success: false, error: 'تعذر تنفيذ العملية. حاول مرة أخرى.' }, { status: 500 });
}

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    const actor = await getTicketActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    return NextResponse.json({ success: true, detail: await getTicketDetail(ticketId, actor) });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const input = patchSchema.parse(await request.json());
    const detail = input.action === 'claim'
      ? await claimTicket(ticketId, actor)
      : input.action === 'assign'
        ? await assignTicket(ticketId, actor, input.assigneeId || null)
        : await updateTicket(ticketId, actor, { status: input.status, priority: input.priority, tags: input.tags });
    return NextResponse.json({ success: true, detail });
  } catch (error) { return fail(error); }
}
