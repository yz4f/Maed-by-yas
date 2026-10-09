import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processResetRequest } from '@/lib/t3n-ai';
import { canManageTickets, getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

const approvedResetSchema = z.object({ requestId: z.string().trim().min(1).max(180) }).strict();

export async function POST(request: NextRequest) {
  if (!requestHasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  }
  const actor = await getTicketActor();
  if (!actor) return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  if (!canManageTickets(actor)) return NextResponse.json({ success: false, message: 'تنفيذ الرستات مخصص للإدارة فقط.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'بيانات الطلب غير صالحة.' }, { status: 400 });
  }
  const parsed = approvedResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'نفذ الرستات من طلب موافَق عليه في لوحة الإدارة.' }, { status: 400 });
  }

  try {
    const resetRequest = await processResetRequest(actor, { requestId: parsed.data.requestId, action: 'complete' });
    return NextResponse.json({ success: true, request: resetRequest });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر تنفيذ الرستات.' }, { status: 400 });
  }
}
