import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getSessionActor } from '@/lib/request-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TUTORIAL_VIDEO_SOURCE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/mHiKjOdRBJBDsCnu.mp4';

export async function GET(req: Request) {
  try {
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const productId = new URL(req.url).searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, message: 'معرّف المنتج غير صحيح.' }, { status: 400 });
    }

    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'تعذر التحقق من حساب المستخدم.' }, { status: 401 });
    }

    const now = Date.now();
    const hasActiveLicense = (await StoreDB.getUserProducts(user.id)).some((license) => {
      if (license.productId !== productId || license.status !== 'Active') return false;
      const expiresAt = license.expiresAt ? new Date(license.expiresAt).getTime() : Number.NaN;
      return Number.isFinite(expiresAt) && expiresAt > now;
    });

    if (!hasActiveLicense) {
      return NextResponse.json({ success: false, message: 'لا يوجد ترخيص نشط صالح لمشاهدة هذا الشرح.' }, { status: 403 });
    }

    const range = req.headers.get('range');
    const upstream = await fetch(TUTORIAL_VIDEO_SOURCE, {
      cache: 'no-store',
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ success: false, message: 'تعذر تجهيز فيديو الشرح الآن.' }, { status: 502 });
    }

    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
    });

    for (const headerName of ['content-length', 'content-range']) {
      const value = upstream.headers.get(headerName);
      if (value) headers.set(headerName, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('Tutorial video stream failed:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء تجهيز فيديو الشرح.' }, { status: 500 });
  }
}
