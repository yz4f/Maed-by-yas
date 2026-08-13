import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addTicketMessage,
  claimTicket,
  createTicket,
  getTicketDetail,
  getTicketStats,
  listTickets,
  TicketError,
  updateTicket,
  uploadTicketAttachment,
} from '@/lib/ticket-store';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

const createTicketSchema = z.object({
  title: z.string().trim().min(4).max(140),
  category: z.enum(['technical', 'account', 'service', 'suggestion', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  body: z.string().trim().min(10).max(6000),
});
const patchSchema = z.object({
  action: z.enum(['claim', 'update']),
  status: z.enum(['open', 'in_progress', 'awaiting_user', 'awaiting_staff', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedAgentId: z.string().nullable().optional(),
  assignedAgentName: z.string().nullable().optional(),
  assignedAgentImage: z.string().nullable().optional(),
});
const messageSchema = z.object({
  body: z.string().max(6000).default(''),
  isInternal: z.boolean().optional(),
  attachments: z.array(z.object({
    id: z.string(), name: z.string(), url: z.string().url(), contentType: z.string(),
    size: z.number().nonnegative(), uploadedAt: z.string(), uploadedById: z.string(),
  })).max(8).optional(),
});

function failed(error: unknown) {
  if (error instanceof TicketError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  console.error('Ticket API failed:', error);
  return NextResponse.json({ success: false, error: 'تعذر تنفيذ العملية. حاول مرة أخرى.' }, { status: 500 });
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
    const ticketId = params.get('ticketId');
    if (ticketId) return NextResponse.json({ success: true, detail: await getTicketDetail(ticketId, current) });
    const tickets = await listTickets(current, { status: params.get('status') || undefined, mine: params.get('mine') === 'true', query: params.get('q') || undefined });
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
    if (action === 'create') return NextResponse.json({ success: true, detail: await createTicket(current, createTicketSchema.parse(await request.json())) }, { status: 201 });
    if (!ticketId) return NextResponse.json({ success: false, error: 'رقم التذكرة مطلوب.' }, { status: 400 });
    if (action === 'message') return NextResponse.json({ success: true, detail: await addTicketMessage(ticketId, current, messageSchema.parse(await request.json())) });
    if (action === 'attachment') {
      const formData = await request.formData();
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
    const detail = input.action === 'claim' ? await claimTicket(ticketId, current) : await updateTicket(ticketId, current, input);
    return NextResponse.json({ success: true, detail });
  } catch (error) { return failed(error); }
}
