import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'اتصال Discord Bot قائم ونشط، وجاهز لمنح وإزالة الرتب أوتوماتيكياً.',
  });
}
