import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedActor, requestHasTrustedOrigin } from '@/lib/request-actor';
import { getClientIp } from '@/lib/request-security';
import { hasPermission } from '@/lib/permissions';
import { deleteProductFaq, listProductFaqs, saveProductFaq } from '@/lib/product-faqs';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

const faqSchema = z.object({
  id: z.string().trim().min(1).max(180),
  productId: z.string().trim().min(1).max(180),
  questionAr: z.string().trim().min(3).max(240),
  questionEn: z.string().trim().min(3).max(240),
  answerAr: z.string().trim().min(3).max(4000),
  answerEn: z.string().trim().min(3).max(4000),
  category: z.string().trim().min(1).max(80),
  priority: z.number().int().min(0).max(100),
  weight: z.number().int().min(1).max(100),
  enabled: z.boolean(),
});

async function adminActor(permission: 'faq.view' | 'faq.create' | 'faq.edit' | 'faq.delete' = 'faq.view') {
  const actor = await getAuthenticatedActor();
  if (!actor) return { response: NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 }) };
  if (!await hasPermission(actor, permission)) return { response: NextResponse.json({ success: false, error: 'هذه العملية مخصصة للإدارة.' }, { status: 403 }) };
  return { actor };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'تعذر تنفيذ الطلب.';
  console.error('Product FAQ request failed:', error);
  return NextResponse.json({ success: false, error: message }, { status: /تسجيل الدخول/.test(message) ? 401 : /مخصصة للإدارة/.test(message) ? 403 : 400 });
}

export async function GET(request: NextRequest) {
  try {
    const includeDisabled = request.nextUrl.searchParams.get('all') === '1';
    const requestedProductIds = request.nextUrl.searchParams.getAll('productId').filter(Boolean).slice(0, 100);
    let productIds: string[] | undefined = requestedProductIds.length ? requestedProductIds : undefined;
    if (includeDisabled) {
      const result = await adminActor('faq.view');
      if ('response' in result) return result.response;
    } else {
      const activeProductIds = new Set((await StoreDB.getProducts()).filter((product) => !product.isArchived).map((product) => product.id));
      productIds = productIds ? productIds.filter((id) => activeProductIds.has(id)) : [...activeProductIds];
    }
    const faqs = await listProductFaqs({ includeDisabled, productIds });
    return NextResponse.json({ success: true, faqs });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  return writeFaq(request);
}

export async function PUT(request: NextRequest) {
  return writeFaq(request);
}

async function writeFaq(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const result = await adminActor(request.method === 'POST' ? 'faq.create' : 'faq.edit');
    if ('response' in result) return result.response;
    const input = faqSchema.parse(await request.json());
    const wasUpdate = (await listProductFaqs({ includeDisabled: true })).some((entry) => entry.id === input.id);
    const faq = await saveProductFaq(input);
    await StoreDB.addLog(wasUpdate ? 'Product FAQ Updated' : 'Product FAQ Created', `${result.actor.name} ${wasUpdate ? 'updated' : 'created'} FAQ ${faq.id} for product ${faq.productId}.`, result.actor.id, result.actor.name, getClientIp(request), {
      eventType: wasUpdate ? 'product_faq_updated' : 'product_faq_created', actorUserId: result.actor.id,
      actorDiscordId: result.actor.id, actorName: result.actor.name, productId: faq.productId,
      metadata: { action: wasUpdate ? 'update_faq' : 'create_faq', faqId: faq.id },
    });
    return NextResponse.json({ success: true, faq });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
    const result = await adminActor('faq.delete');
    if ('response' in result) return result.response;
    const id = z.string().trim().min(1).max(180).parse(request.nextUrl.searchParams.get('id'));
    const faq = (await listProductFaqs({ includeDisabled: true })).find((entry) => entry.id === id);
    await deleteProductFaq(id);
    await StoreDB.addLog('Product FAQ Deleted', `${result.actor.name} deleted FAQ ${id} for product ${faq?.productId || 'unknown'}.`, result.actor.id, result.actor.name, getClientIp(request), {
      eventType: 'product_faq_deleted', actorUserId: result.actor.id, actorDiscordId: result.actor.id,
      actorName: result.actor.name, productId: faq?.productId || null,
      metadata: { action: 'delete_faq', faqId: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}

