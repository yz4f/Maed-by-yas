'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Clock3, Copy, KeyRound, MessageSquareText, RefreshCw, Send, UserRound, XCircle } from 'lucide-react';
import type { ResetRequest, ResetRequestStatus } from '@/types';

interface ResetKeyRequestsAdminProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onNotify: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const darkStatusStyle: Record<ResetRequestStatus, string> = {
  PENDING: 'border-amber-300/20 bg-amber-300/[0.09] text-amber-100',
  APPROVED: 'border-sky-300/20 bg-sky-300/[0.09] text-sky-100',
  REJECTED: 'border-rose-300/20 bg-rose-300/[0.09] text-rose-100',
  WAITING_FOR_CUSTOMER: 'border-violet-300/20 bg-violet-300/[0.09] text-violet-100',
  COMPLETED: 'border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-100',
  CANCELLED: 'border-slate-300/20 bg-slate-300/[0.07] text-slate-200',
};

const lightStatusStyle: Record<ResetRequestStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  APPROVED: 'border-sky-200 bg-sky-50 text-sky-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
  WAITING_FOR_CUSTOMER: 'border-violet-200 bg-violet-50 text-violet-800',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-600',
};

function statusLabel(status: ResetRequestStatus, lang: 'ar' | 'en') {
  const ar: Record<ResetRequestStatus, string> = {
    PENDING: 'قيد المراجعة', APPROVED: 'تمت الموافقة', REJECTED: 'مرفوض',
    WAITING_FOR_CUSTOMER: 'بانتظار العميل', COMPLETED: 'تم التنفيذ', CANCELLED: 'ملغي',
  };
  return lang === 'ar' ? ar[status] : status.replaceAll('_', ' ');
}

export function ResetKeyRequestsAdmin({ lang, isDark, onNotify }: ResetKeyRequestsAdminProps) {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const requestCacheRef = useRef<ResetRequest[]>([]);
  const notifyRef = useRef(onNotify);

  notifyRef.current = onNotify;

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai?view=admin_resets', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل الطلبات.');
      const next = Array.isArray(data.requests) ? data.requests as ResetRequest[] : [];
      requestCacheRef.current = next;
      if (mountedRef.current) setRequests(next);
    } catch (error) {
      if (mountedRef.current) notifyRef.current(error instanceof Error ? error.message : 'تعذر تحميل الطلبات.', 'error');
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const copyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1800);
    } catch {
      onNotify(lang === 'ar' ? 'تعذر نسخ المفتاح.' : 'Could not copy the key.', 'error');
    }
  };

  const publishPanel = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const response = await fetch('/api/admin/reset-panel', { method: 'POST', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر نشر لوحة طلب الريست.');
      onNotify(lang === 'ar' ? 'تم نشر لوحة طلب الريست في Discord.' : 'The reset request panel was published in Discord.', 'success');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'تعذر نشر لوحة طلب الريست.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const process = async (requestId: string, decision: 'approve' | 'reject' | 'complete') => {
    setBusyId(requestId);
    try {
      const response = await fetch('/api/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'process_reset', requestId, decision }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحديث الطلب.');
      setRequests((current) => {
        const next = data.request?.removed
          ? current.filter((request) => request.id !== requestId)
          : current.map((request) => request.id === requestId ? data.request : request);
        requestCacheRef.current = next;
        return next;
      });
      onNotify(data.request?.removed
        ? (lang === 'ar' ? 'تمت معالجة الطلب وإزالته من القائمة المنتهية.' : 'The request was processed and removed from the completed list.')
        : (lang === 'ar' ? 'تم تحديث حالة الطلب.' : 'Request status updated.'), 'success');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'تعذر تحديث الطلب.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const completedCount = requests.filter((request) => request.status === 'COMPLETED').length;
  const cardClass = isDark ? 'border-white/[0.08] bg-[#0b111b]/90 shadow-[0_16px_40px_rgba(0,0,0,0.18)] hover:border-cyan-200/[0.16]' : 'border-slate-200 bg-white shadow-[0_14px_34px_rgba(33,82,118,0.08)] hover:border-sky-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const keyPanel = isDark ? 'border-cyan-200/[0.1] bg-black/20' : 'border-sky-100 bg-sky-50/70';
  const reasonPanel = isDark ? 'border-rose-300/[0.1] bg-rose-300/[0.035]' : 'border-rose-100 bg-rose-50/60';
  const statusStyle = isDark ? darkStatusStyle : lightStatusStyle;

  return (
    <section className="space-y-5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-cyan-200/[0.12] bg-gradient-to-l from-cyan-300/[0.07] to-transparent' : 'border-sky-100 bg-gradient-to-l from-sky-50 to-white shadow-[0_12px_30px_rgba(33,82,118,0.06)]'}`}>
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${isDark ? 'border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100' : 'border-sky-200 bg-sky-100 text-sky-700'}`}><KeyRound size={21} /></div>
          <div>
            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'طلبات رستات المفاتيح' : 'Key reset requests'}</h3>
            <p className={`mt-1 text-xs ${muted}`}>{lang === 'ar' ? 'الطلبات مستقرة ولا تتغير إلا عند التحديث أو تنفيذ إجراء إداري.' : 'Requests remain stable and change only after refresh or an administrative action.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-xl border px-3 py-2 text-[11px] font-black ${isDark ? 'border-amber-300/15 bg-amber-300/[0.08] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{pendingCount} {lang === 'ar' ? 'قيد المراجعة' : 'pending'}</span>
          <span className={`rounded-xl border px-3 py-2 text-[11px] font-black ${isDark ? 'border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{completedCount} {lang === 'ar' ? 'مكتمل' : 'completed'}</span>
          <button onClick={() => void publishPanel()} disabled={isPublishing} className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black transition active:scale-95 disabled:opacity-55 ${isDark ? 'border-amber-300/20 bg-amber-300/[0.1] text-amber-100 hover:bg-amber-300/[0.17]' : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'}`} title={lang === 'ar' ? 'نشر لوحة طلب الريست في Discord' : 'Publish reset request panel in Discord'}><Send size={13} />{isPublishing ? (lang === 'ar' ? 'جارٍ النشر…' : 'Publishing…') : (lang === 'ar' ? 'نشر اللوحة' : 'Publish panel')}</button>
          <button onClick={() => void load()} disabled={isLoading} className={`grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95 disabled:opacity-55 ${isDark ? 'border-white/[0.1] bg-white/[0.04] text-slate-300 hover:bg-white/[0.09]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} title={lang === 'ar' ? 'تحديث' : 'Refresh'}><RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      {isLoading && requests.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className={`h-56 animate-pulse rounded-[22px] border ${isDark ? 'border-white/[0.06] bg-white/[0.025]' : 'border-slate-200 bg-slate-100'}`} />)}</div>
      ) : requests.length === 0 ? (
        <div className={`rounded-[22px] border border-dashed px-6 py-14 text-center ${isDark ? 'border-white/[0.12] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
          <UserRound className={`mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} size={28} />
          <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{lang === 'ar' ? 'لا توجد طلبات رستات مفاتيح حالياً.' : 'No key reset requests yet.'}</p>
          <p className={`mt-1 text-xs ${muted}`}>{lang === 'ar' ? 'ستظهر هنا الطلبات المرسلة من بطاقات المنتجات.' : 'Requests sent from product cards will appear here.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => {
            const hasFullKey = Boolean(request.keyValue?.trim());
            return <article key={request.id} className={`rounded-[22px] border p-4 transition ${cardClass}`}>
              <div className={`flex items-start justify-between gap-3 border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <img src={request.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className={`h-11 w-11 rounded-2xl border object-cover ${isDark ? 'border-cyan-300/20' : 'border-sky-200'}`} onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} />
                  <div className="min-w-0"><h4 className={`truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{request.customerName}</h4><p className={`mt-0.5 text-[11px] ${muted}`}>{request.reference}</p><div className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border px-2 py-1 ${isDark ? 'border-cyan-300/[0.14] bg-cyan-300/[0.06] text-cyan-100' : 'border-sky-200 bg-sky-50 text-sky-800'}`}><img src={request.productImage || '/logo.png'} alt="" loading="lazy" className="h-5 w-5 shrink-0 rounded-md object-cover" onError={(event) => { event.currentTarget.src = '/logo.png'; }} /><span className="truncate text-[10px] font-black">{request.productName}</span></div></div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusStyle[request.status]}`}>{statusLabel(request.status, lang)}</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                <div className={`rounded-2xl border p-3 ${keyPanel}`}>
                  <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-black ${isDark ? 'text-cyan-100/70' : 'text-sky-700'}`}><KeyRound size={12} />{lang === 'ar' ? 'المفتاح' : 'License key'}</div>
                  <div className="flex items-center gap-2">
                    <code className={`min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border px-2.5 py-2 text-[10px] font-bold tracking-[0.035em] ${isDark ? 'border-white/[0.07] bg-slate-950/60 text-cyan-100' : 'border-sky-100 bg-white text-sky-900'}`}>{hasFullKey ? request.keyValue : request.keyMasked}</code>
                    {hasFullKey ? <button onClick={() => void copyKey(request.keyValue!, request.id)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition active:scale-95 ${isDark ? 'border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100 hover:bg-cyan-300/[0.18]' : 'border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-200'}`} title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy key'}>{copiedId === request.id ? <Check size={14} /> : <Copy size={14} />}</button> : <span className={`shrink-0 text-[9px] font-bold ${muted}`}>{lang === 'ar' ? 'قديم' : 'legacy'}</span>}
                  </div>
                </div>
                <div className={`rounded-2xl border p-3 ${reasonPanel}`}><div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-black ${isDark ? 'text-rose-100/75' : 'text-rose-700'}`}><MessageSquareText size={12} />{lang === 'ar' ? 'سبب الرستات' : 'Reset reason'}</div><p className={`line-clamp-3 text-[11px] leading-5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{request.reason}</p></div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${muted}`}><Clock3 size={12} />{new Date(request.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span><div className="flex items-center gap-2">{request.status === 'PENDING' && <><button disabled={busyId === request.id} onClick={() => void process(request.id, 'approve')} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black transition active:scale-95 disabled:opacity-50 ${isDark ? 'border-sky-300/20 bg-sky-300/[0.1] text-sky-100 hover:bg-sky-300/[0.18]' : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'}`}><CheckCircle2 size={13} />{lang === 'ar' ? 'اعتماد' : 'Approve'}</button><button disabled={busyId === request.id} onClick={() => void process(request.id, 'reject')} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black transition active:scale-95 disabled:opacity-50 ${isDark ? 'border-rose-300/20 bg-rose-300/[0.1] text-rose-100 hover:bg-rose-300/[0.18]' : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'}`}><XCircle size={13} />{lang === 'ar' ? 'رفض' : 'Reject'}</button></>}{request.status === 'APPROVED' && <button disabled={busyId === request.id} onClick={() => void process(request.id, 'complete')} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black transition active:scale-95 disabled:opacity-50 ${isDark ? 'border-emerald-300/20 bg-emerald-300/[0.1] text-emerald-100 hover:bg-emerald-300/[0.18]' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}><CheckCircle2 size={13} />{lang === 'ar' ? 'تنفيذ الرستات' : 'Complete reset'}</button>}</div></div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
