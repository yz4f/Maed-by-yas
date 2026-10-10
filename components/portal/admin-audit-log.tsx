'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, CalendarDays, ChevronDown, Clock3, RefreshCw, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import type { SystemLog } from '@/types';

type Language = 'ar' | 'en';
type LogsPage = { success: boolean; logs?: SystemLog[]; nextCursor?: string | null; message?: string };

const ACTION_NAMES: Record<string, string> = {
  'Key Started': 'بدء مدة المنتج',
  'Key Activation': 'تفعيل مفتاح',
  'Key Creation': 'إنشاء مفاتيح',
  'Stock Keys Added': 'إضافة مفاتيح للمخزون',
  'Product Granted': 'منح منتج',
  'Login': 'تسجيل الدخول',
  'Register': 'تسجيل حساب',
  'Logout': 'تسجيل الخروج',
  'User Registered': 'تسجيل عميل جديد',
  'User Banned': 'حظر عميل',
  'User Unbanned': 'فك حظر عميل',
  'User Unbanned Automatically': 'انتهاء حظر العميل',
  'User Warned': 'تحذير عميل',
  'Product Revoked': 'سحب منتج',
  'Product Status Updated': 'تعديل حالة المنتج',
  'Discord Direct Message Sent': 'إرسال رسالة خاصة',
  'HWID Reset': 'إعادة ربط الجهاز',
  'Reset Request Created': 'طلب إعادة تعيين',
  'AI Reset APPROVED': 'الموافقة على إعادة التعيين',
  'AI Reset COMPLETED': 'اكتمال إعادة التعيين',
  'AI Reset REJECTED': 'رفض إعادة التعيين',
  'AI Reset CANCELLED': 'إلغاء إعادة التعيين',
  'Key Inventory Updated': 'تعديل مفتاح المخزون',
  'Key Inventory Deleted': 'حذف مفتاح المخزون',
  'AI Reset Requests Purged': 'تنظيف طلبات إعادة التعيين',
  'AI Knowledge Updated': 'تحديث محتوى المساعدة',
  'AI Conversation Reopened': 'إعادة فتح محادثة',
  'AI Conversation Auto Closed': 'إغلاق محادثة تلقائيًا',
  'AI Conversation Claimed': 'استلام محادثة العميل',
  'AI Conversation Returned': 'إعادة المحادثة',
  'AI Staff Reply': 'رد الإدارة',
  'AI Conversation Closed By Staff': 'إغلاق محادثة من الإدارة',
};

function actionName(action: string, lang: Language) {
  if (lang === 'en') return action;
  return ACTION_NAMES[action] || action;
}

function formatDate(value: string, lang: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '—', time: '—' };
  const locale = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  const options = { timeZone: 'Asia/Riyadh', calendar: 'gregory' } as const;
  const clockParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const hour = Number(clockParts.find((part) => part.type === 'hour')?.value || '0');
  const minute = clockParts.find((part) => part.type === 'minute')?.value || '00';
  const period = lang === 'ar' ? (hour >= 18 ? 'مساءً' : hour >= 12 ? 'ظهرًا' : 'صباحًا') : (hour >= 12 ? 'PM' : 'AM');
  return {
    day: new Intl.DateTimeFormat(locale, { ...options, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date),
    time: `${lang === 'ar' ? 'الساعة ' : ''}${hour % 12 || 12}:${minute} ${period}`,
  };
}

function actionTone(action: string) {
  if (/Ban|Revoke|Delete|REJECTED|CANCELLED/i.test(action)) return 'danger';
  if (/Reset|HWID|Request/i.test(action)) return 'warning';
  if (/Activation|Login|Register|Started|Granted|COMPLETED/i.test(action)) return 'success';
  return 'neutral';
}

export function AdminAuditLog({ lang }: { lang: Language }) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const initializedRef = useRef(false);

  const loadLogs = useCallback(async (nextCursor?: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (nextCursor) setLoadingMore(true);
    try {
      const url = nextCursor ? `/api/admin/logs?cursor=${encodeURIComponent(nextCursor)}` : '/api/admin/logs';
      const response = await fetch(url, { cache: 'no-store' });
      const page = await response.json() as LogsPage;
      if (!response.ok || !page.success || !Array.isArray(page.logs)) throw new Error(page.message || 'تعذر تحميل السجلات.');
      if (!mountedRef.current) return;
      setLogs((current) => {
        const combined = nextCursor ? [...current, ...page.logs!] : initializedRef.current ? [...page.logs!, ...current] : page.logs!;
        return Array.from(new Map(combined.map((item) => [item.id, item])).values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
      if (nextCursor || !initializedRef.current) setCursor(page.nextCursor || null);
      initializedRef.current = true;
      setLastUpdated(new Date().toISOString());
      setError('');
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : 'تعذر تحميل السجلات.');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const startup = window.setTimeout(() => { void loadLogs(); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadLogs();
    }, 15_000);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(startup);
      window.clearInterval(timer);
    };
  }, [loadLogs]);

  const actions = Array.from(new Set(logs.map((item) => item.action))).sort();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleLogs = logs.filter((item) => {
    if (action !== 'all' && item.action !== action) return false;
    if (!normalizedQuery) return true;
    return [item.action, actionName(item.action, lang), item.details, item.userName, item.discordId, item.userId, item.ipAddress]
      .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery));
  });
  const customerCount = new Set(logs.map((item) => item.discordId || item.userId).filter(Boolean)).size;

  return (
    <section className="admin-audit" aria-label={lang === 'ar' ? 'سجل نشاط الموقع' : 'Website activity log'}>
      <header className="admin-audit__header">
        <div className="admin-audit__heading">
          <span className="admin-audit__mark"><ShieldCheck size={22} aria-hidden="true" /></span>
          <div>
            <span className="admin-audit__eyebrow">{lang === 'ar' ? 'لوحة المتابعة' : 'OPERATIONS DESK'}</span>
            <h2>{lang === 'ar' ? 'سجل نشاط الموقع' : 'Website activity'}</h2>
            <p>{lang === 'ar' ? 'عمليات العملاء والإدارة مرتبة من الأحدث، مع تفاصيل واضحة لكل حدث.' : 'Customer and staff activity, newest first, with clear event details.'}</p>
          </div>
        </div>
        <button type="button" className="admin-audit__refresh" onClick={() => void loadLogs()} disabled={loading || loadingMore}>
          <RefreshCw size={15} aria-hidden="true" /> {lang === 'ar' ? 'تحديث الآن' : 'Refresh'}
        </button>
      </header>

      <div className="admin-audit__metrics">
        <div><Activity size={17} aria-hidden="true" /><span>{lang === 'ar' ? 'الأحداث المحمّلة' : 'Loaded events'}</span><strong>{logs.length}</strong></div>
        <div><Users size={17} aria-hidden="true" /><span>{lang === 'ar' ? 'أصحاب النشاط' : 'People in activity'}</span><strong>{customerCount}</strong></div>
        <div><Clock3 size={17} aria-hidden="true" /><span>{lang === 'ar' ? 'آخر تحديث' : 'Last update'}</span><strong>{lastUpdated ? formatDate(lastUpdated, lang).time : '—'}</strong></div>
      </div>

      <div className="admin-audit__tools">
        <label className="admin-audit__search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === 'ar' ? 'ابحث في السجلات المحمّلة بالعميل أو الحدث أو IP' : 'Search loaded logs by customer, event, or IP'} aria-label={lang === 'ar' ? 'بحث السجلات' : 'Search logs'} />
        </label>
        <select value={action} onChange={(event) => setAction(event.target.value)} aria-label={lang === 'ar' ? 'تصفية نوع الحدث' : 'Filter event type'}>
          <option value="all">{lang === 'ar' ? 'جميع أنواع الأحداث' : 'All event types'}</option>
          {actions.map((item) => <option key={item} value={item}>{actionName(item, lang)}</option>)}
        </select>
      </div>

      <div className="admin-audit__list" aria-live="polite">
        {visibleLogs.map((log) => {
          const date = formatDate(log.createdAt, lang);
          const name = log.userName || (lang === 'ar' ? 'مستخدم غير معروف' : 'Unknown user');
          const isLocalIp = !log.ipAddress || log.ipAddress === '127.0.0.1' || log.ipAddress === '::1';
          return (
            <article className="admin-audit__entry" key={log.id}>
              <div className="admin-audit__event">
                <span className={`admin-audit__badge admin-audit__badge--${actionTone(log.action)}`}>{actionName(log.action, lang)}</span>
                {ACTION_NAMES[log.action] && lang === 'ar' && <small dir="ltr">{log.action}</small>}
              </div>
              <div className="admin-audit__details"><p>{log.details || '—'}</p><span dir="ltr">{isLocalIp ? (lang === 'ar' ? 'عنوان IP غير متاح' : 'IP unavailable') : `IP ${log.ipAddress}`}</span></div>
              <div className="admin-audit__person">
                {log.userImage ? <>
                  {/* Discord avatar URLs are user supplied and may not use a configured image host. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={log.userImage} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                </> : <span className="admin-audit__avatar"><UserRound size={17} aria-hidden="true" /></span>}
                <div><strong>{name}</strong><small dir="ltr">{log.discordId ? `Discord ${log.discordId}` : log.userRole || log.userId || (lang === 'ar' ? 'بدون معرف' : 'No ID')}</small></div>
              </div>
              <div className="admin-audit__date"><CalendarDays size={16} aria-hidden="true" /><div><strong>{date.day}</strong><span>{date.time} <small>{lang === 'ar' ? 'بتوقيت الرياض' : 'Riyadh time'}</small></span></div></div>
            </article>
          );
        })}
        {!loading && !error && visibleLogs.length === 0 && <div className="admin-audit__empty">{lang === 'ar' ? 'لا توجد أحداث تطابق البحث أو التصفية.' : 'No events match this search or filter.'}</div>}
        {loading && <div className="admin-audit__empty">{lang === 'ar' ? 'جارٍ تحميل السجلات…' : 'Loading activity…'}</div>}
      </div>
      {error && <div className="admin-audit__error" role="alert">{error} <button type="button" onClick={() => void loadLogs()}>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}
      {cursor && <button type="button" className="admin-audit__more" onClick={() => void loadLogs(cursor)} disabled={loadingMore}><ChevronDown size={16} aria-hidden="true" />{loadingMore ? (lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…') : (lang === 'ar' ? 'عرض سجلات أقدم' : 'Load older events')}</button>}
    </section>
  );
}
