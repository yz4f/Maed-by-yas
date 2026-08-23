import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actorCanManageAi } from '@/lib/t3n-ai';
import { getTicketActor, requestHasTrustedOrigin } from '@/lib/ticket-auth';
import { approveSiteUpdate, createSiteUpdate, listSiteUpdates, publishSiteUpdate, updateSiteUpdate } from '@/lib/site-updates';

export const dynamic = 'force-dynamic';

const updateFields = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(800),
  highlights: z.array(z.string().trim().min(2).max(180)).min(1).max(8),
  imageUrl: z.string().trim().url().max(2000),
  imageAlt: z.string().trim().max(180).optional().default(''),
  kind: z.enum(['FEATURE', 'IMPROVEMENT', 'FIX', 'RELEASE']),
});

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), update: updateFields }),
  z.object({ action: z.literal('edit'), updateId: z.string().trim().min(1).max(160), update: updateFields }),
  z.object({ action: z.literal('approve'), updateId: z.string().trim().min(1).max(160) }),
  z.object({ action: z.literal('publish'), updateId: z.string().trim().min(1).max(160) }),
]);

async function administrator() {
  const actor = await getTicketActor();
  if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
  if (!actorCanManageAi(actor)) throw new Error('هذه العملية مخصصة للإدارة.');
  return actor;
}

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ عملية التحديث.';
  const status = /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة/.test(message) ? 403 : 400;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    await administrator();
    return NextResponse.json({ success: true, updates: await listSiteUpdates() });
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const actor = await administrator();
    const body = bodySchema.parse(await request.json());
    if (body.action === 'create') return NextResponse.json({ success: true, update: await createSiteUpdate(actor, body.update) }, { status: 201 });
    if (body.action === 'edit') return NextResponse.json({ success: true, update: await updateSiteUpdate(actor, body.updateId, body.update) });
    if (body.action === 'approve') return NextResponse.json({ success: true, update: await approveSiteUpdate(actor, body.updateId) });
    return NextResponse.json({ success: true, update: await publishSiteUpdate(actor, body.updateId) });
  } catch (error) {
    return failed(error);
  }
}
