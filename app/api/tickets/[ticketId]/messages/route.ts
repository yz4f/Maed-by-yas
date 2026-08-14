import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addTicketMessage, TicketError } from '@/lib/ticket-store';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';
const schema = z.object({
  body: z.string().max(6000).default(''),
  isInternal: z.boolean().optional(),
  attachments: z.array(z.object({ id: z.string(), name: z.string(), url: z.string().url(), contentType: z.string(), size: z.number().nonnegative(), uploadedAt: z.string(), uploadedById: z.string() })).max(8).optional(),
});

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const detail = await addTicketMessage(ticketId, actor, schema.parse(await request.json()));
    return NextResponse.json({ success: true, detail });
  } catch (error) {
    if (error instanceof TicketError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('Ticket message API failed:', error);
    return NextResponse.json({ success: false, error: 'تعذر إرسال الرد.' }, { status: 500 });
  }
}
