import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم ومعرف المنتج مطلوبان.' },
        { status: 400 }
      );
    }

    const result = await StoreDB.resetUserProductHwid(userId, productId);
    return NextResponse.json(
      {
        ...result,
        message: result.success
          ? 'تمت إعادة تعيين ربط الجهاز لهذا الترخيص بنجاح.'
          : result.message || 'تعذر إعادة تعيين ربط الجهاز.'
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error: any) {
    console.error('HWID reset failed:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'حدث خطأ غير متوقع أثناء إعادة تعيين الجهاز.' },
      { status: 500 }
    );
  }
}
