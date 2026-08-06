import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const data = await StoreDB.getUserDetails(params.id);
  if (!data) return NextResponse.json({ success: false, message: 'العميل غير موجود' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await StoreDB.deleteUser(params.id);
    return NextResponse.json({ success: result, message: result ? 'تم حذف العميل بنجاح' : 'تعذر حذف العميل' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
