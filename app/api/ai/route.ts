import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  actorCanManageAi,
  createResetRequest,
  getHelpOverview,
  getAiConversation,
  sendAiMessage,
  listCustomerResetRequests,
  listResetRequests,
  processResetRequest,
} from '@/lib/t3n-ai';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';

export const dynamic = 'force-dynamic';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const resetSchema = z.object({
  action: z.literal('reset_request'),
  productId: z.string().trim().min(1).max(180).optional(),
  reason: z.string().trim().min(3).max(500),
  language: z.enum(['ar', 'en']).default('ar'),
});
const chatSchema = z.object({
  action: z.literal('chat'),
  body: z.string().trim().min(2).max(1800),
  language: z.enum(['ar', 'en']).default('ar'),
});
const adminPatchSchema = z.object({
  action: z.literal('process_reset'),
  requestId: z.string().trim().min(1).max(180),
  decision: z.enum(['approve', 'reject', 'request_info', 'complete']),
  note: z.string().trim().max(1000).optional(),
});

function enforceRateLimit(actorId: string, action: string, limit: number, windowMs: number) {
  const key = `${actorId}:${action}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) throw new Error('تم تنفيذ محاولات كثيرة بسرعة. انتظر قليلاً ثم أعد المحاولة.');
  bucket.count += 1;
}

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ طلب ذكاء تعن حالياً.';
  console.error('T3N AI API failed:', error);
  const status = /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة|صلاحية/.test(message) ? 403 : /محاولات كثيرة/.test(message) ? 429 : 400;
  return NextResponse.json({ success: false, error: message }, { status });
}

async function actor() {
  return getTicketActor();
}

export async function GET(request: NextRequest) {
  try {
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    const view = request.nextUrl.searchParams.get('view') || 'conversation';
    if (view === 'conversation') {
      return NextResponse.json({ success: true, ...(await getAiConversation(current)) });
    }
    if (view === 'help') {
      return NextResponse.json({ success: true, ...(await getHelpOverview(current)) });
    }
    if (view === 'reset_requests') {
      return NextResponse.json({ success: true, requests: await listCustomerResetRequests(current) });
    }
    if (view === 'admin_resets') {
      if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه البيانات مخصصة للإدارة.' }, { status: 403 });
      return NextResponse.json({ success: true, requests: await listResetRequests(current) });
    }
    return NextResponse.json({ success: true, ...(await getHelpOverview(current)) });
  } catch (error) { return failed(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    const body = await request.json();
    if (body?.action === 'chat') {
      const input = chatSchema.parse(body);
      enforceRateLimit(current.id, 'chat', 16, 10 * 60 * 1000);
      return NextResponse.json({ success: true, ...(await sendAiMessage(current, input)) });
    }
    const input = resetSchema.parse(body);
    enforceRateLimit(current.id, 'reset_request', 4, 60 * 60 * 1000);
    return NextResponse.json({ success: true, ...(await createResetRequest(current, input)) }, { status: 201 });
  } catch (error) { return failed(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const current = await actor();
    if (!current) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 });
    const input = adminPatchSchema.parse(await request.json());
    return NextResponse.json({ success: true, request: await processResetRequest(current, { requestId: input.requestId, action: input.decision, note: input.note }) });
  } catch (error) { return failed(error); }
}
