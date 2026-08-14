import { NextRequest, NextResponse } from 'next/server';
import { TicketError, uploadTicketAttachment } from '@/lib/ticket-store';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getTicketActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولًا.' }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'اختر ملفًا صالحًا.' }, { status: 400 });
    const attachment = await uploadTicketAttachment(ticketId, actor, file);
    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    if (error instanceof TicketError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('Ticket attachment API failed:', error);
    return NextResponse.json({ success: false, error: 'تعذر رفع الملف.' }, { status: 500 });
  }
}
