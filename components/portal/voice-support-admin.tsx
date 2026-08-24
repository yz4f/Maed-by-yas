'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Headphones, Mic2, MonitorUp, PhoneCall, Plus, RefreshCw, ShieldCheck, Users, Video, XCircle } from 'lucide-react';
import type { VoiceSupportSession, VoiceSupportSessionStatus } from '@/types';

type CustomerOption = { discordId: string; name: string; image?: string | null; email?: string | null };

const statusMeta: Record<VoiceSupportSessionStatus, { label: string; icon: typeof Clock3; tone: string }> = {
  PENDING_CONSENT: { label: 'بانتظار موافقة العميل', icon: ShieldCheck, tone: 'text-amber-200 border-amber-200/20 bg-amber-300/[.08]' },
  WAITING_FOR_CUSTOMER: { label: 'بانتظار دخول العميل', icon: Clock3, tone: 'text-sky-200 border-sky-200/20 bg-sky-300/[.08]' },
  ACTIVE: { label: 'جلسة نشطة', icon: Activity, tone: 'text-emerald-200 border-emerald-200/20 bg-emerald-300/[.08]' },
  STAFF_ASSISTANCE: { label: 'متابعة موظف', icon: Headphones, tone: 'text-violet-200 border-violet-200/20 bg-violet-300/[.08]' },
  ENDED: { label: 'انتهت الجلسة', icon: CheckCircle2, tone: 'text-slate-300 border-white/[.08] bg-white/[.04]' },
  FAILED: { label: 'تعذر البدء', icon: XCircle, tone: 'text-rose-200 border-rose-200/20 bg-rose-300/[.08]' },
};

function formatTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(value));
}

export function VoiceSupportAdmin({ customers }: { customers: CustomerOption[] }) {
  const [sessions, setSessions] = useState<VoiceSupportSession[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [screenShareRequested, setScreenShareRequested] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => sessions.filter((item) => ['PENDING_CONSENT', 'WAITING_FOR_CUSTOMER', 'ACTIVE', 'STAFF_ASSISTANCE'].includes(item.status)).length, [sessions]);
  const selectedCustomer = customers.find((customer) => customer.discordId === customerId);
  const visibleCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => `${customer.name} ${customer.discordId} ${customer.email || ''}`.toLowerCase().includes(query));
  }, [customerQuery, customers]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/voice-sessions', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'تعذر تحميل الجلسات.');
      setSessions(payload.sessions || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الجلسات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
    const refreshTimer = window.setInterval(() => void loadSessions(), 12_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const createSession = async () => {
    if (!selectedCustomer) return;
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/voice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDiscordId: selectedCustomer.discordId,
          customerName: selectedCustomer.name,
          customerImage: selectedCustomer.image || null,
          screenShareRequested,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'تعذر إنشاء الجلسة.');
      setSessions((current) => [payload.session, ...current]);
      setCustomerId('');
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'تعذر إنشاء الجلسة.');
    } finally {
      setIsCreating(false);
    }
  };

  const setSessionStatus = async (sessionId: string, status: VoiceSupportSessionStatus, staffJoined = false) => {
    try {
      const response = await fetch('/api/admin/voice-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status, staffJoined }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'تعذر تحديث الجلسة.');
      setSessions((current) => current.map((session) => session.id === sessionId ? { ...session, status, staffJoined: staffJoined || session.staffJoined, updatedAt: new Date().toISOString(), endedAt: status === 'ENDED' ? new Date().toISOString() : session.endedAt } : session));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'تعذر تحديث الجلسة.');
    }
  };

  return <div dir="rtl" className="space-y-5 animate-in fade-in duration-300">
    <section className="relative overflow-hidden rounded-[26px] border border-cyan-200/[.16] bg-[linear-gradient(135deg,rgba(8,47,73,.78),rgba(10,19,35,.92)_52%,rgba(22,78,99,.38))] p-5 shadow-[0_22px_52px_rgba(0,0,0,.22)] sm:p-6">
      <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/[.13] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-12 h-56 w-56 rounded-full bg-violet-400/[.10] blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/[.18] bg-cyan-300/[.08] px-3 py-1 text-[10px] font-black tracking-[.12em] text-cyan-100"><Mic2 className="h-3.5 w-3.5" />AI VOICE CONTROL</div><h3 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">جلسات الدعم الصوتية</h3><p className="mt-2 text-xs leading-6 text-slate-300">أنشئ جلسة خاصة للعميل من لوحة الإدارة. لا يبدأ الصوت أو مشاركة الشاشة إلا بعد قبول العميل الواضح داخل Discord.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]"><div className="rounded-2xl border border-white/[.08] bg-black/[.16] px-4 py-3"><p className="text-[9px] font-black tracking-[.13em] text-slate-500">الجلسات النشطة</p><p className="mt-1 text-xl font-black text-emerald-200">{activeCount}</p></div><div className="rounded-2xl border border-white/[.08] bg-black/[.16] px-4 py-3"><p className="text-[9px] font-black tracking-[.13em] text-slate-500">إجمالي السجل</p><p className="mt-1 text-xl font-black text-white">{sessions.length}</p></div></div>
      </div>
    </section>

    <section className="rounded-[24px] border border-white/[.08] bg-[#091321]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,.16)] sm:p-5">
      <div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/[.16] bg-cyan-300/[.08] text-cyan-200"><Plus className="h-4 w-4" /></span><div><h4 className="text-sm font-black text-white">إنشاء جلسة خاصة</h4><p className="mt-0.5 text-[10px] text-slate-500">يرسل النظام طلب موافقة للعميل قبل فتح أي مسار صوت أو شاشة.</p></div></div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]"><div className="space-y-2"><input value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} placeholder="ابحث باسم العميل أو Discord ID" className="h-10 w-full rounded-xl border border-white/[.08] bg-white/[.025] px-3 text-[11px] font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/[.35]" /><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-12 min-w-0 w-full rounded-xl border border-white/[.09] bg-[#050b14] px-3 text-xs font-bold text-white outline-none transition focus:border-cyan-300/[.45]" aria-label="اختيار العميل"><option value="">اختر العميل لإنشاء جلسة الدعم</option>{visibleCustomers.map((customer) => <option value={customer.discordId} key={customer.discordId}>{customer.name} — {customer.discordId}</option>)}</select></div><label className="flex h-12 self-end items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] px-3 text-[11px] font-bold text-slate-300"><input checked={screenShareRequested} onChange={(event) => setScreenShareRequested(event.target.checked)} type="checkbox" className="h-4 w-4 accent-cyan-300" /><MonitorUp className="h-4 w-4 text-cyan-200" />طلب مشاركة الشاشة</label><button disabled={!selectedCustomer || isCreating} onClick={() => void createSession()} className="inline-flex h-12 self-end items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#67e8f9,#38bdf8)] px-5 text-xs font-black text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"><PhoneCall className="h-4 w-4" />{isCreating ? 'جارٍ إنشاء الجلسة...' : 'إنشاء وطلب موافقة'}</button></div>
    </section>

    {error && <div className="flex items-center gap-2 rounded-2xl border border-rose-300/[.18] bg-rose-400/[.06] px-4 py-3 text-xs font-bold text-rose-100"><XCircle className="h-4 w-4 shrink-0" />{error}</div>}

    <section className="overflow-hidden rounded-[24px] border border-white/[.08] bg-[#07101c]/72">
      <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 sm:px-5"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-200" /><h4 className="text-sm font-black text-white">سجل الجلسات</h4></div><button onClick={() => void loadSessions()} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] text-slate-400 transition hover:bg-white/[.08] hover:text-white" aria-label="تحديث الجلسات"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></button></div>
      <div className="divide-y divide-white/[.055]">{!isLoading && sessions.length === 0 && <div className="px-5 py-12 text-center"><Video className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm font-black text-slate-300">لا توجد جلسات صوتية بعد</p><p className="mt-1 text-[11px] text-slate-500">اختر عميلاً من الأعلى وأرسل له طلب موافقة لجلسة الدعم.</p></div>}{sessions.map((session) => { const meta = statusMeta[session.status]; const StatusIcon = meta.icon; return <div key={session.id} className="flex flex-col gap-4 px-4 py-4 transition hover:bg-white/[.018] sm:px-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><img src={session.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-10 w-10 shrink-0 rounded-2xl border border-white/[.10] object-cover" /><div className="min-w-0"><p className="truncate text-xs font-black text-white">{session.customerName}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{session.customerDiscordId} · {formatTime(session.createdAt)}</p></div></div><div className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${meta.tone}`}><StatusIcon className="h-3.5 w-3.5" />{meta.label}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1 rounded-lg border border-white/[.07] bg-white/[.035] px-2.5 py-1.5 text-[10px] font-bold text-slate-400">{session.screenShareRequested ? <MonitorUp className="h-3.5 w-3.5 text-cyan-200" /> : <Mic2 className="h-3.5 w-3.5 text-slate-500" />}{session.screenShareRequested ? 'شاشة اختيارية' : 'صوت فقط'}</span>{!['ENDED', 'FAILED'].includes(session.status) && <><button onClick={() => void setSessionStatus(session.id, 'STAFF_ASSISTANCE', true)} className="rounded-lg border border-violet-200/[.16] bg-violet-300/[.07] px-2.5 py-1.5 text-[10px] font-black text-violet-100 transition hover:bg-violet-300/[.14]">متابعة موظف</button><button onClick={() => void setSessionStatus(session.id, 'ENDED')} className="rounded-lg border border-rose-200/[.16] bg-rose-300/[.06] px-2.5 py-1.5 text-[10px] font-black text-rose-100 transition hover:bg-rose-300/[.14]">إنهاء</button></>}</div></div>;})}</div>
    </section>
  </div>;
}
