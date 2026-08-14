import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await StoreDB.getUserDetails(id);
  if (!data) return NextResponse.json({ success: false, message: 'العميل غير موجود' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await StoreDB.deleteUser(id);
    return NextResponse.json({ success: result, message: result ? 'تم حذف العميل بنجاح' : 'تعذر حذف العميل' });
  } catch (error) {
    console.error('Customer deletion failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر حذف العميل. حاول مرة أخرى.' }, { status: 500 });
  }
}
