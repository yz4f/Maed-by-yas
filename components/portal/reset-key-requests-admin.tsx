'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, CheckCircle2, Clock3, Copy, KeyRound, MessageSquareText, RefreshCw, UserRound, XCircle } from 'lucide-react';
import type { ResetRequest, ResetRequestStatus } from '@/types';

interface ResetKeyRequestsAdminProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onNotify: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const statusStyle: Record<ResetRequestStatus, string> = {
  PENDING: 'border-amber-300/20 bg-amber-300/[0.09] text-amber-100',
  APPROVED: 'border-sky-300/20 bg-sky-300/[0.09] text-sky-100',
  REJECTED: 'border-rose-300/20 bg-rose-300/[0.09] text-rose-100',
  WAITING_FOR_CUSTOMER: 'border-violet-300/20 bg-violet-300/[0.09] text-violet-100',
  COMPLETED: 'border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-100',
  CANCELLED: 'border-slate-300/20 bg-slate-300/[0.07] text-slate-200',
};

function statusLabel(status: ResetRequestStatus, lang: 'ar' | 'en') {
  const ar: Record<ResetRequestStatus, string> = {
    PENDING: 'قيد المراجعة', APPROVED: 'تمت الموافقة', REJECTED: 'مرفوض',
    WAITING_FOR_CUSTOMER: 'بانتظار العميل', COMPLETED: 'تم التنفيذ', CANCELLED: 'ملغي',
  };
  if (lang === 'ar') return ar[status];
  return status.replaceAll('_', ' ');
}

export function ResetKeyRequestsAdmin({ lang, isDark, onNotify }: ResetKeyRequestsAdminProps) {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai?view=admin_resets', { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل الطلبات.');
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'تعذر تحميل الطلبات.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => { void load(); }, [load]);

  const copyKey = async (key: string | null | undefined, id: string) => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1800);
    } catch {
      onNotify(lang === 'ar' ? 'تعذر نسخ المفتاح.' : 'Could not copy the key.', 'error');
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
      setRequests((current) => current.map((request) => request.id === requestId ? data.request : request));
      onNotify(lang === 'ar' ? 'تم تحديث حالة الطلب.' : 'Request status updated.', 'success');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'تعذر تحديث الطلب.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const completedCount = requests.filter((request) => request.status === 'COMPLETED').length;

  return (
    <section className="space-y-5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 rounded-[24px] border border-cyan-200/[0.12] bg-gradient-to-l from-cyan-300/[0.07] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100"><KeyRound size={21} /></div>
          <div>
            <h3 className="text-base font-black text-white">{lang === 'ar' ? 'طلبات رستات المفاتيح' : 'Key reset requests'}</h3>
            <p className="mt-1 text-xs text-slate-400">{lang === 'ar' ? 'راجع السبب، انسخ المفتاح عند الحاجة، ثم اعتمد أو نفّذ الطلب.' : 'Review the reason, copy the key when needed, then approve or complete the request.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-amber-300/15 bg-amber-300/[0.08] px-3 py-2 text-[11px] font-black text-amber-100">{pendingCount} {lang === 'ar' ? 'قيد المراجعة' : 'pending'}</span>
          <span className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2 text-[11px] font-black text-emerald-100">{completedCount} {lang === 'ar' ? 'مكتمل' : 'completed'}</span>
          <button onClick={() => void load()} disabled={isLoading} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.09] disabled:opacity-50" title={lang === 'ar' ? 'تحديث' : 'Refresh'}><RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-56 animate-pulse rounded-[22px] border border-white/[0.06] bg-white/[0.025]" />)}</div>
      ) : requests.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-14 text-center">
          <UserRound className="mx-auto mb-3 text-slate-600" size={28} />
          <p className="font-bold text-slate-300">{lang === 'ar' ? 'لا توجد طلبات رستات مفاتيح حالياً.' : 'No key reset requests yet.'}</p>
          <p className="mt-1 text-xs text-slate-500">{lang === 'ar' ? 'ستظهر هنا الطلبات المرسلة من بطاقات المنتجات.' : 'Requests sent from product cards will appear here.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[22px] border border-white/[0.08] bg-[#0b111b]/90 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition hover:border-cyan-200/[0.16]">
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img src={request.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-11 w-11 rounded-2xl border border-cyan-300/20 object-cover" onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} />
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-white">{request.customerName}</h4>
                    <p className="mt-0.5 text-[11px] text-slate-400">{request.productName} · {request.reference}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusStyle[request.status]}`}>{statusLabel(request.status, lang)}</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                <div className="rounded-2xl border border-cyan-200/[0.1] bg-black/20 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black text-cyan-100/70"><KeyRound size={12} />{lang === 'ar' ? 'المفتاح' : 'License key'}</div>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-white/[0.07] bg-slate-950/60 px-2.5 py-2 text-[10px] font-bold tracking-[0.035em] text-cyan-100">{request.keyValue || request.keyMasked}</code>
                    <button onClick={() => void copyKey(request.keyValue || request.keyMasked, request.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100 transition hover:bg-cyan-300/[0.18]" title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy key'}>{copiedId === request.id ? <Check size={14} /> : <Copy size={14} />}</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-300/[0.1] bg-rose-300/[0.035] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-rose-100/75"><MessageSquareText size={12} />{lang === 'ar' ? 'سبب الرستات' : 'Reset reason'}</div>
                  <p className="line-clamp-3 text-[11px] leading-5 text-slate-200">{request.reason}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><Clock3 size={12} />{new Date(request.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                <div className="flex items-center gap-2">
                  {request.status === 'PENDING' && <>
                    <button disabled={busyId === request.id} onClick={() => void process(request.id, 'approve')} className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/20 bg-sky-300/[0.1] px-3 py-2 text-[10px] font-black text-sky-100 transition hover:bg-sky-300/[0.18] disabled:opacity-50"><CheckCircle2 size={13} />{lang === 'ar' ? 'اعتماد' : 'Approve'}</button>
                    <button disabled={busyId === request.id} onClick={() => void process(request.id, 'reject')} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/20 bg-rose-300/[0.1] px-3 py-2 text-[10px] font-black text-rose-100 transition hover:bg-rose-300/[0.18] disabled:opacity-50"><XCircle size={13} />{lang === 'ar' ? 'رفض' : 'Reject'}</button>
                  </>}
                  {request.status === 'APPROVED' && <button disabled={busyId === request.id} onClick={() => void process(request.id, 'complete')} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.1] px-3 py-2 text-[10px] font-black text-emerald-100 transition hover:bg-emerald-300/[0.18] disabled:opacity-50"><CheckCircle2 size={13} />{lang === 'ar' ? 'تنفيذ الرستات' : 'Complete reset'}</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
