import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addTicketMessage,
  assignTicket,
  claimTicket,
  createTicket,
  setTicketCustomerMute,
  getTicketDetail,
  getTicketStats,
  listTicketAgents,
  listTickets,
  TicketError,
  updateTicket,
  uploadTicketAttachment,
} from '@/lib/ticket-store';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

const createTicketSchema = z.object({
  title: z.string().trim().min(4).max(140),
  department: z.enum(['technical_support', 'sales', 'billing', 'accounts']).optional(),
  category: z.enum(['technical', 'account', 'service', 'suggestion', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  body: z.string().trim().min(10).max(6000),
});
const patchSchema = z.object({
  action: z.enum(['claim', 'assign', 'update', 'mute_customer', 'unmute_customer']),
  status: z.enum(['new', 'open', 'in_progress', 'awaiting_user', 'awaiting_staff', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().trim().min(1).max(128).nullable().optional(),
  tags: z.array(z.string().trim().min(2).max(24)).max(8).optional(),
  muteReason: z.string().trim().max(240).optional(),
});
const messageSchema = z.object({
  body: z.string().max(6000).default(''),
  isInternal: z.boolean().optional(),
  attachments: z.array(z.object({ id: z.string().trim().min(1).max(128) })).max(8).optional(),
});

function failed(error: unknown) {
  if (error instanceof TicketError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  console.error('Ticket API failed:', error);
  return NextResponse.json({ success: false, error: 'تعذر تنفيذ العملية. حاول مرة أخرى.' }, { status: 500 });
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function enforceRateLimit(actorId: string, action: string, limit: number, windowMs: number) {
  const key = `${actorId}:${action}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) throw new TicketError('تم تنفيذ محاولات كثيرة بسرعة. انتظر قليلًا ثم حاول مجددًا.', 429);
  bucket.count += 1;
}

async function actor() {
  return await getTicketActor();
}

export async function GET(request: NextRequest) {
  try {
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const params = request.nextUrl.searchParams;
    if (params.get('action') === 'stats') return NextResponse.json({ success: true, stats: await getTicketStats(current) });
    if (params.get('action') === 'agents') return NextResponse.json({ success: true, agents: await listTicketAgents(current) });
    const ticketId = params.get('ticketId');
    if (ticketId) return NextResponse.json({ success: true, detail: await getTicketDetail(ticketId, current) });
    const tickets = await listTickets(current, {
      status: params.get('status') || undefined,
      priority: params.get('priority') || undefined,
      department: params.get('department') || undefined,
      mine: params.get('mine') === 'true',
      query: params.get('q') || undefined,
    });
    return NextResponse.json({ success: true, tickets, isStaff: ['Boss', 'Co-Boss', 'Admin'].includes(current.role) });
  } catch (error) { return failed(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const action = request.nextUrl.searchParams.get('action') || 'create';
    const ticketId = request.nextUrl.searchParams.get('ticketId');
    if (action === 'create') {
      enforceRateLimit(current.id, 'create', 6, 60 * 60 * 1000);
      return NextResponse.json({ success: true, detail: await createTicket(current, createTicketSchema.parse(await request.json())) }, { status: 201 });
    }
    if (!ticketId) return NextResponse.json({ success: false, error: 'رقم التذكرة مطلوب.' }, { status: 400 });
    if (action === 'message') {
      enforceRateLimit(current.id, 'message', 24, 60 * 1000);
      const input = messageSchema.parse(await request.json());
      return NextResponse.json({ success: true, detail: await addTicketMessage(ticketId, current, { body: input.body, isInternal: input.isInternal, attachmentIds: input.attachments?.map((attachment) => attachment.id) }) });
    }
    if (action === 'attachment') {
      const formData = await request.formData();
      enforceRateLimit(current.id, 'attachment', 16, 60 * 60 * 1000);
      const file = formData.get('file');
      if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'اختر ملفًا صالحًا.' }, { status: 400 });
      return NextResponse.json({ success: true, attachment: await uploadTicketAttachment(ticketId, current, file) });
    }
    return NextResponse.json({ success: false, error: 'عملية غير معروفة.' }, { status: 404 });
  } catch (error) { return failed(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const ticketId = request.nextUrl.searchParams.get('ticketId');
    if (!ticketId) return NextResponse.json({ success: false, error: 'رقم التذكرة مطلوب.' }, { status: 400 });
    const input = patchSchema.parse(await request.json());
    const detail = input.action === 'claim'
      ? await claimTicket(ticketId, current)
      : input.action === 'assign'
        ? await assignTicket(ticketId, current, input.assigneeId || null)
        : input.action === 'mute_customer'
          ? await setTicketCustomerMute(ticketId, current, true, input.muteReason || '')
          : input.action === 'unmute_customer'
            ? await setTicketCustomerMute(ticketId, current, false)
            : await updateTicket(ticketId, current, { status: input.status, priority: input.priority, tags: input.tags });
    return NextResponse.json({ success: true, detail });
  } catch (error) { return failed(error); }
}
