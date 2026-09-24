import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { getAnnouncementsForUser, recordAnnouncementReceipt } from '@/lib/announcements';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await getSessionActor(); if (!user) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول.' }, { status: 401 });
  try { return NextResponse.json({ success: true, announcements: await getAnnouncementsForUser({ discordId: user.discordId, role: user.role }) }); } catch (error) { console.error('Announcements load failed:', error); return NextResponse.json({ success: false, error: 'تعذر تحميل الإعلانات.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, error: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  const user = await getSessionActor(); if (!user) return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول.' }, { status: 401 });
  const parsed = z.object({ announcementId: z.string().trim().min(1).max(180), action: z.enum(['read', 'dismiss']) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: 'بيانات غير صالحة.' }, { status: 400 });
  try { const receipt = await recordAnnouncementReceipt(parsed.data.announcementId, user.discordId, parsed.data.action); return NextResponse.json({ success: true, receipt }); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'تعذر تحديث الإعلان.' }, { status: 403 }); }
}
