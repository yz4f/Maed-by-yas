import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export async function POST(req: Request) {
  try {
    const { keyId, userId } = await req.json();

    if (!keyId || !userId) {
      return NextResponse.json({ success: false, message: 'معرف المفتاح ومعرف المستخدم مطلوبان' }, { status: 400 });
    }

    const success = await StoreDB.revokeKey(keyId, userId);
    
    if (success) {
      // Log the action
      await StoreDB.addLog('Revoke Key', `تم إلغاء المفتاح وسحبه من المستخدم`, userId, 'Admin');
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'فشل الإلغاء' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
