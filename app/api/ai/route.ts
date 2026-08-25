import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  actorCanManageAi,
  createResetRequest,
  getHelpOverview,
  getAiConversation,
  getAiConversationForStaff,
  listAiConversations,
  sendAiMessage,
  sendStaffAiMessage,
  setConversationHumanMode,
  listCustomerResetRequests,
  listResetRequests,
  processResetRequest,
  purgeTerminalResetRequests,
  listCustomerSupportNotifications,
  markCustomerSupportNotificationSeen,
  reopenAiConversation,
  recordAiCustomerPage,
  deleteAiConversation,
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
const imageAttachmentSchema = z.object({
  id: z.string().trim().min(4).max(100),
  name: z.string().trim().min(1).max(180),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(4 * 1024 * 1024),
  previewData: z.string().min(40).max(850_000),
});
const chatSchema = z.object({
  action: z.literal('chat'),
  body: z.string().trim().max(1800).default(''),
  attachments: z.array(imageAttachmentSchema).max(1).default([]),
  language: z.enum(['ar', 'en']).default('ar'),
}).superRefine((value, context) => {
  if (value.body.length < 2 && value.attachments.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'اكتب رسالتك أو أرفق صورة واحدة على الأقل.' });
  }
});
const adminResetPatchSchema = z.object({
  action: z.literal('process_reset'),
  requestId: z.string().trim().min(1).max(180),
  decision: z.enum(['approve', 'reject', 'request_info', 'complete']),
  note: z.string().trim().max(1000).optional(),
});
const notificationSeenSchema = z.object({
  action: z.literal('notification_seen'),
  notificationId: z.string().trim().min(1).max(220),
});
const reopenConversationSchema = z.object({ action: z.literal('reopen_conversation') });
const pageActivitySchema = z.object({ action: z.literal('page_activity'), page: z.string().trim().min(1).max(80) });
const conversationModeSchema = z.object({
  action: z.literal('conversation_mode'),
  conversationId: z.string().trim().min(1).max(180),
  mode: z.enum(['human', 'ai']),
});
const staffReplySchema = z.object({
  action: z.literal('staff_reply'),
  conversationId: z.string().trim().min(1).max(180),
  body: z.string().trim().max(1800).default(''),
  attachments: z.array(imageAttachmentSchema).max(1).default([]),
}).superRefine((value, context) => {
  if (value.body.length < 2 && value.attachments.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'اكتب رداً أو أرفق صورة واحدة على الأقل.' });
  }
});
const conversationCloseSchema = z.object({
  action: z.literal('conversation_close'),
  conversationId: z.string().trim().min(1).max(180),
});
const purgeTerminalResetsSchema = z.object({ action: z.literal('purge_terminal_resets') });

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
    if (view === 'notifications') {
      return NextResponse.json({ success: true, notifications: await listCustomerSupportNotifications(current) });
    }
    if (view === 'admin_resets') {
      if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه البيانات مخصصة للإدارة.' }, { status: 403 });
      return NextResponse.json({ success: true, requests: await listResetRequests(current) });
    }
    if (view === 'admin_conversations') {
      if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه البيانات مخصصة للإدارة.' }, { status: 403 });
      return NextResponse.json({ success: true, conversations: await listAiConversations(current) });
    }
    if (view === 'admin_conversation') {
      if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه البيانات مخصصة للإدارة.' }, { status: 403 });
      const conversationId = request.nextUrl.searchParams.get('conversationId')?.trim();
      if (!conversationId) return NextResponse.json({ success: false, error: 'معرف المحادثة مطلوب.' }, { status: 400 });
      return NextResponse.json({ success: true, ...(await getAiConversationForStaff(current, conversationId)) });
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
    if (body?.action === 'notification_seen') {
      const input = notificationSeenSchema.parse(body);
      return NextResponse.json({ success: true, notification: await markCustomerSupportNotificationSeen(current, input.notificationId) });
    }
    if (body?.action === 'reopen_conversation') {
      reopenConversationSchema.parse(body);
      return NextResponse.json({ success: true, ...(await reopenAiConversation(current)) });
    }
    if (body?.action === 'page_activity') {
      const input = pageActivitySchema.parse(body);
      return NextResponse.json({ success: true, ...(await recordAiCustomerPage(current, input.page)) });
    }
    if (body?.action === 'chat') {
      const input = chatSchema.parse(body);
      enforceRateLimit(current.id, 'chat', 16, 10 * 60 * 1000);
      return NextResponse.json({ success: true, ...(await sendAiMessage(current, input)) });
    }
    if (body?.action === 'staff_reply') {
      if (!actorCanManageAi(current)) return NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 });
      const input = staffReplySchema.parse(body);
      enforceRateLimit(current.id, 'staff_reply', 40, 10 * 60 * 1000);
      return NextResponse.json({ success: true, ...(await sendStaffAiMessage(current, input)) });
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
    const body = await request.json();
    if (body?.action === 'conversation_mode') {
      const input = conversationModeSchema.parse(body);
      return NextResponse.json({ success: true, ...(await setConversationHumanMode(current, input.conversationId, input.mode === 'human' ? 'HUMAN_ACTIVE' : 'AI_ACTIVE')) });
    }
    if (body?.action === 'conversation_close') {
      const input = conversationCloseSchema.parse(body);
      return NextResponse.json({ success: true, ...(await deleteAiConversation(current, input.conversationId)) });
    }
    if (body?.action === 'purge_terminal_resets') {
      purgeTerminalResetsSchema.parse(body);
      return NextResponse.json({ success: true, ...(await purgeTerminalResetRequests(current)) });
    }
    const input = adminResetPatchSchema.parse(body);
    return NextResponse.json({ success: true, request: await processResetRequest(current, { requestId: input.requestId, action: input.decision, note: input.note }) });
  } catch (error) { return failed(error); }
}
