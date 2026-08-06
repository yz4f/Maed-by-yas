import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = await StoreDB.getProductById(params.id);
  if (!product) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true, product });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const product = await StoreDB.updateProduct(params.id, data);
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const success = await StoreDB.deleteProduct(params.id);
  return NextResponse.json({ success });
}
