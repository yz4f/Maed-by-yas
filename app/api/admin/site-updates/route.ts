import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { getAuthenticatedActor, requestHasTrustedOrigin } from '@/lib/request-actor';
import { getClientIp } from '@/lib/request-security';
import { approveSiteUpdate, createSiteUpdate, listSiteUpdates, publishSiteUpdate, updateSiteUpdate } from '@/lib/site-updates';
import { StoreDB } from '@/lib/store-db';

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

async function administrator(permission: 'announcements.view' | 'announcements.create' | 'announcements.publish' = 'announcements.view') {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new Error('يجب تسجيل الدخول أولاً.');
  if (!await hasPermission(actor, permission)) throw new Error('هذه العملية مخصصة للإدارة.');
  return actor;
}

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ عملية التحديث.';
  const status = /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة/.test(message) ? 403 : 400;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    await administrator('announcements.view');
    return NextResponse.json({ success: true, updates: await listSiteUpdates() });
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const body = bodySchema.parse(await request.json());
    const actor = await administrator(body.action === 'publish' ? 'announcements.publish' : 'announcements.create');
    let update;
    if (body.action === 'create') update = await createSiteUpdate(actor, body.update);
    else if (body.action === 'edit') update = await updateSiteUpdate(actor, body.updateId, body.update);
    else if (body.action === 'approve') update = await approveSiteUpdate(actor, body.updateId);
    else update = await publishSiteUpdate(actor, body.updateId);
    await StoreDB.addLog(`Website Update ${body.action}`, `${actor.name} performed ${body.action} on ${update.id}.`, actor.id, actor.name, getClientIp(request), {
      eventType: `website_update_${body.action}`, actorDiscordId: actor.id, actorName: actor.name,
      metadata: { action: body.action, updateId: update.id, status: update.status },
    });
    return NextResponse.json({ success: true, update }, { status: body.action === 'create' ? 201 : 200 });
  } catch (error) {
    return failed(error);
  }
}
