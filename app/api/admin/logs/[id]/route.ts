import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/store-db';
import type { AuditEvent, SystemLog } from '@/types';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!await isAuthorizedAdmin('logs.view')) {
    return NextResponse.json({ success: false, error: 'غير مصرح لك بعرض السجلات.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || id.length > 180 || id.includes('/')) {
    return NextResponse.json({ success: false, error: 'معرف السجل غير صالح.' }, { status: 400 });
  }
  const database = db();
  if (!database) return NextResponse.json({ success: false, error: 'قاعدة البيانات غير متاحة.' }, { status: 503 });

  try {
    const snapshot = await getDoc(doc(database, 'logs', id));
    if (!snapshot.exists()) return NextResponse.json({ success: false, error: 'السجل غير موجود.' }, { status: 404 });
    const log = snapshot.data() as SystemLog;
    let auditEvent: AuditEvent | null = null;
    if (log.auditEventId && !log.auditEventId.includes('/')) {
      const event = await getDoc(doc(database, 'auditEvents', log.auditEventId));
      if (event.exists()) auditEvent = event.data() as AuditEvent;
    }
    const canViewIp = await isAuthorizedAdmin('settings.view');
    return NextResponse.json({
      success: true,
      log: canViewIp ? log : { ...log, ipAddress: undefined },
      auditEvent: auditEvent && (canViewIp ? auditEvent : { ...auditEvent, ipAddress: undefined, userAgent: undefined }),
    });
  } catch (error) {
    console.error('Audit log details failed:', error);
    return NextResponse.json({ success: false, error: 'تعذر تحميل تفاصيل السجل.' }, { status: 500 });
  }
}
