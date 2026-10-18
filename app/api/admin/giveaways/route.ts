import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { addGiveawayKeys, createAndPublishGiveaway, createGiveaway, deliverGiveaway, enableGiveawayParticipation, listGiveaways, publishGiveaway } from '@/lib/giveaways';

export const dynamic = 'force-dynamic';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), title: z.string().trim().min(3).max(100), body: z.string().trim().min(10).max(1500), productId: z.string().trim().min(1), duration: z.enum(['3 Days', 'Lifetime']), durationHours: z.number().int().min(1).max(720), keys: z.array(z.string()).min(1).max(125) }),
  z.object({ action: z.literal('createAndPublish'), title: z.string().trim().min(3).max(100), body: z.string().trim().min(10).max(1500), productId: z.string().trim().min(1), duration: z.enum(['3 Days', 'Lifetime']), durationHours: z.number().int().min(1).max(720), keys: z.array(z.string()).min(1).max(125) }),
  z.object({ action: z.literal('addKeys'), id: z.string().uuid(), keys: z.array(z.string()).min(1).max(125) }),
  z.object({ action: z.literal('publish'), id: z.string().uuid() }),
  z.object({ action: z.literal('retryDelivery'), id: z.string().uuid() }),
  z.object({ action: z.literal('retryParticipation'), id: z.string().uuid() }),
]);

export async function GET() {
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
  try { return NextResponse.json({ success: true, giveaways: await listGiveaways() }); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'تعذر تحميل السحوبات.' }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request) || !await isAuthorizedAdmin()) return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
  try {
    const actor = await getSessionActor();
    if (!actor) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول.' }, { status: 401 });
    const body = bodySchema.parse(await request.json());
    if (body.action === 'create') return NextResponse.json({ success: true, giveaway: await createGiveaway(body, actor.discordId) });
    if (body.action === 'createAndPublish') return NextResponse.json({ success: true, giveaway: await createAndPublishGiveaway(body, actor.discordId) });
    if (body.action === 'addKeys') return NextResponse.json({ success: true, added: await addGiveawayKeys(body.id, body.keys) });
    if (body.action === 'publish') return NextResponse.json({ success: true, giveaway: await publishGiveaway(body.id) });
    if (body.action === 'retryParticipation') { await enableGiveawayParticipation(body.id); return NextResponse.json({ success: true }); }
    await deliverGiveaway(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const savedId = error && typeof error === 'object' && 'savedId' in error ? String(error.savedId) : undefined;
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'تعذر تنفيذ العملية.', savedId }, { status: savedId ? 502 : 400 });
  }
}
