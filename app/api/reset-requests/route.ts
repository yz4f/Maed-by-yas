import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createResetRequest, listCustomerResetNotifications, listCustomerResetRequests, markCustomerResetNotificationSeen } from '@/lib/reset-requests';
import { getAuthenticatedActor, requestHasTrustedOrigin } from '@/lib/request-actor';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  productId: z.string().trim().min(1).max(180).optional(),
  reason: z.string().trim().min(3).max(500),
  language: z.enum(['ar', 'en']).default('ar'),
});
const seenSchema = z.object({ notificationId: z.string().trim().min(1).max(220) });
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(actorId: string) {
  const now = Date.now();
  const bucket = buckets.get(actorId);
  if (!bucket || bucket.resetAt <= now) { buckets.set(actorId, { count: 1, resetAt: now + 60 * 60 * 1000 }); return; }
  if (bucket.count >= 4) throw new Error('تم تنفيذ محاولات كثيرة بسرعة. انتظر قليلاً ثم أعد المحاولة.');
  bucket.count += 1;
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ الطلب.';
  console.error('Reset request endpoint failed:', error);
  const status = /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة|صلاحية/.test(message) ? 403 : /محاولات كثيرة/.test(message) ? 429 : 400;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (request.nextUrl.searchParams.get('view') === 'notifications') {
      return NextResponse.json({ success: true, notifications: await listCustomerResetNotifications(actor) });
    }
    return NextResponse.json({ success: true, requests: await listCustomerResetRequests(actor) });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await getAuthenticatedActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    const body = await request.json();
    if (body?.action === 'notification_seen') {
      const input = seenSchema.parse(body);
      return NextResponse.json({ success: true, notification: await markCustomerResetNotificationSeen(actor, input.notificationId) });
    }
    const input = createSchema.parse(body);
    rateLimit(actor.id);
    return NextResponse.json({ success: true, ...(await createResetRequest(actor, input)) }, { status: 201 });
  } catch (error) { return failure(error); }
}
