import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getOwnedActiveLicense, isSafeDownloadUrl } from '@/lib/license-access';
import { getClientIp, getSessionActor } from '@/lib/request-security';

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { productId } = await params;
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const ownership = await getOwnedActiveLicense(actor, productId);
    if (!ownership) {
      return NextResponse.json({ success: false, message: 'لا تملك ترخيصاً نشطاً لهذا المنتج.' }, { status: 403 });
    }

    const product = await StoreDB.getProductById(productId);
    if (!product || product.isDisabled || product.isArchived || !isSafeDownloadUrl(product.fileUrl)) {
      return NextResponse.json({ success: false, message: 'ملف المنتج غير متاح حالياً.' }, { status: 404 });
    }

    const result = await StoreDB.recordDownload(productId, ownership.user.id, getClientIp(req));
    return NextResponse.json({ ...result, fileUrl: product.fileUrl }, { status: result.success ? 200 : 403 });
  } catch (error) {
    console.error('Direct download registration failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تسجيل التنزيل. حاول مرة أخرى.' }, { status: 500 });
  }
}
