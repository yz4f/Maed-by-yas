'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  Filter,
  Flag,
  FolderOpen,
  Image as ImageIcon,
  Inbox,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  SupportTicket,
  TicketAttachment,
  TicketCategory,
  TicketDetail,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from '@/types';

interface TicketCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  isStaff: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type NewTicketState = {
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  body: string;
};

const statusMeta: Record<TicketStatus, { ar: string; en: string; color: string; dot: string }> = {
  open: { ar: 'مفتوحة', en: 'Open', color: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  in_progress: { ar: 'قيد المعالجة', en: 'In progress', color: 'border-sky-400/25 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  awaiting_user: { ar: 'بانتظار المستخدم', en: 'Awaiting user', color: 'border-amber-400/25 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  awaiting_staff: { ar: 'بانتظار الإدارة', en: 'Awaiting staff', color: 'border-orange-400/25 bg-orange-400/10 text-orange-200', dot: 'bg-orange-400' },
  closed: { ar: 'مغلقة', en: 'Closed', color: 'border-slate-400/25 bg-slate-400/10 text-slate-300', dot: 'bg-slate-400' },
};

const priorityMeta: Record<TicketPriority, { ar: string; en: string; color: string }> = {
  low: { ar: 'منخفضة', en: 'Low', color: 'border-slate-400/25 bg-slate-400/10 text-slate-300' },
  medium: { ar: 'متوسطة', en: 'Medium', color: 'border-blue-400/25 bg-blue-400/10 text-blue-200' },
  high: { ar: 'عالية', en: 'High', color: 'border-rose-400/25 bg-rose-400/10 text-rose-200' },
  urgent: { ar: 'عاجلة', en: 'Urgent', color: 'border-red-400/30 bg-red-400/15 text-red-200' },
};

const categoryLabel: Record<TicketCategory, { ar: string; en: string }> = {
  technical: { ar: 'مشكلة تقنية', en: 'Technical issue' },
  account: { ar: 'مشكلة في الحساب', en: 'Account issue' },
  service: { ar: 'مشكلة في الخدمة', en: 'Service issue' },
  suggestion: { ar: 'اقتراح', en: 'Suggestion' },
  other: { ar: 'أخرى', en: 'Other' },
};

const emptyForm: NewTicketState = { title: '', category: 'technical', priority: 'medium', body: '' };

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string, lang: 'ar' | 'en') {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function relativeTime(value: string, lang: 'ar' | 'en') {
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return lang === 'ar' ? 'الآن' : 'Now';
  if (minutes < 60) return lang === 'ar' ? `منذ ${minutes} د` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'ar' ? `منذ ${days} ي` : `${days}d ago`;
}

function initialLetter(name?: string | null) {
  return (name || 'T').trim().slice(0, 1).toUpperCase();
}

export function TicketCenter({ lang, isDark, isStaff, onNotify }: TicketCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | TicketStatus | 'unassigned' | 'mine'>('all');
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<NewTicketState>(emptyForm);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [composer, setComposer] = useState('');
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const isRtl = lang === 'ar';
  const textMain = isDark ? 'text-white' : 'text-slate-950';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const card = isDark ? 'border-sky-100/[0.11] bg-slate-950/55 shadow-[0_18px_46px_rgba(3,15,32,0.22)]' : 'border-slate-900/[0.09] bg-white/75 shadow-[0_18px_42px_rgba(83,138,181,0.10)]';
  const field = isDark ? 'border-sky-100/[0.13] bg-slate-950/55 text-white placeholder:text-slate-500' : 'border-slate-900/[0.10] bg-white/75 text-slate-900 placeholder:text-slate-400';

  const notify = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotice({ text, type });
    onNotify?.(text, type);
    window.setTimeout(() => setNotice(current => current?.text === text ? null : current), 4200);
  };

  const loadTickets = async (preserveDetail = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'mine') params.set('mine', 'true');
      else if (filter === 'unassigned') params.set('status', 'open');
      else if (filter !== 'all') params.set('status', filter);
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/tickets?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل التذاكر.');
      const nextTickets: SupportTicket[] = filter === 'unassigned'
        ? data.tickets.filter((ticket: SupportTicket) => !ticket.assignedAgentId)
        : data.tickets;
      setTickets(nextTickets);
      if (!preserveDetail || (detail && !nextTickets.some(ticket => ticket.id === detail.ticket.id))) setDetail(null);
    } catch (error: any) {
      notify(error.message || 'تعذر تحميل التذاكر.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!isStaff) return;
    try {
      const response = await fetch('/api/tickets?action=stats', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.success) setStats(data.stats);
    } catch { /* Ticket list remains usable if summary stats fail. */ }
  };

  const selectTicket = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/tickets?ticketId=${encodeURIComponent(ticketId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر فتح التذكرة.');
      setDetail(data.detail);
      setComposer('');
      setComposerFiles([]);
      setInternalNote(false);
    } catch (error: any) {
      notify(error.message || 'تعذر فتح التذكرة.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { loadTickets(false); loadStats(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => loadTickets(), 240);
    return () => window.clearTimeout(timer);
  }, [filter, query]);

  const uploadFiles = async (ticketId: string, files: File[]) => {
    const attachments: TicketAttachment[] = [];
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`/api/tickets?action=attachment&ticketId=${encodeURIComponent(ticketId)}`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || `تعذر رفع ${file.name}`);
      attachments.push(data.attachment);
    }
    return attachments;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTicket) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر إنشاء التذكرة.');
      let nextDetail: TicketDetail = data.detail;
      if (newFiles.length) {
        const attachments = await uploadFiles(nextDetail.ticket.id, newFiles);
        const attachmentResponse = await fetch(`/api/tickets?action=message&ticketId=${encodeURIComponent(nextDetail.ticket.id)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: isRtl ? 'مرفقات إضافية للتذكرة.' : 'Additional ticket attachments.', attachments }),
        });
        const attachmentData = await attachmentResponse.json();
        if (!attachmentResponse.ok || !attachmentData.success) throw new Error(attachmentData.error || 'تم إنشاء التذكرة لكن تعذر إرفاق الملفات.');
        nextDetail = attachmentData.detail;
      }
      setDetail(nextDetail);
      setNewTicket(emptyForm);
      setNewFiles([]);
      setNewOpen(false);
      setTickets(current => [nextDetail.ticket, ...current]);
      notify(isRtl ? `تم إنشاء التذكرة ${nextDetail.ticket.number} بنجاح.` : `${nextDetail.ticket.number} was created successfully.`);
      loadTickets(); loadStats();
    } catch (error: any) {
      notify(error.message || 'تعذر إنشاء التذكرة.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const patchTicket = async (payload: Record<string, unknown>, successMessage?: string) => {
    if (!detail) return;
    try {
      const response = await fetch(`/api/tickets?ticketId=${encodeURIComponent(detail.ticket.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحديث التذكرة.');
      setDetail(data.detail);
      setTickets(current => current.map(ticket => ticket.id === data.detail.ticket.id ? data.detail.ticket : ticket));
      if (successMessage) notify(successMessage);
      loadStats();
    } catch (error: any) { notify(error.message || 'تعذر تحديث التذكرة.', 'error'); }
  };

  const sendMessage = async () => {
    if (!detail || sending) return;
    setSending(true);
    try {
      const attachments = await uploadFiles(detail.ticket.id, composerFiles);
      const response = await fetch(`/api/tickets?action=message&ticketId=${encodeURIComponent(detail.ticket.id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: composer, isInternal: internalNote, attachments }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر إرسال الرد.');
      setDetail(data.detail);
      setTickets(current => current.map(ticket => ticket.id === data.detail.ticket.id ? data.detail.ticket : ticket));
      setComposer(''); setComposerFiles([]); setInternalNote(false);
      notify(internalNote ? (isRtl ? 'تمت إضافة الملاحظة الداخلية.' : 'Internal note added.') : (isRtl ? 'تم إرسال الرد.' : 'Reply sent.'));
    } catch (error: any) {
      notify(error.message || 'تعذر إرسال الرد.', 'error');
    } finally { setSending(false); }
  };

  const insertComposerToken = (before: string, after = before) => {
    const target = composerRef.current;
    const start = target?.selectionStart ?? composer.length;
    const end = target?.selectionEnd ?? composer.length;
    const selected = composer.slice(start, end) || (isRtl ? 'نص' : 'text');
    const next = `${composer.slice(0, start)}${before}${selected}${after}${composer.slice(end)}`;
    setComposer(next);
    requestAnimationFrame(() => {
      if (!target) return;
      target.focus();
      target.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const statusOptions = useMemo(() => Object.keys(statusMeta) as TicketStatus[], []);
  const priorityOptions = useMemo(() => Object.keys(priorityMeta) as TicketPriority[], []);
  const selectedTicket = detail?.ticket;

  return (
    <section className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${notice.type === 'error' ? 'border-red-400/25 bg-red-500/10 text-red-200' : notice.type === 'warning' ? 'border-amber-400/25 bg-amber-500/10 text-amber-200' : 'border-sky-400/25 bg-sky-500/10 text-sky-100'}`}>
          <span>{notice.text}</span><button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${card}`}>
        <div className="pointer-events-none absolute -left-16 -top-24 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={`mb-1 flex items-center gap-2 text-[10px] font-black tracking-[0.18em] ${isDark ? 'text-sky-200/75' : 'text-sky-700/75'}`}><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />{isRtl ? 'الدعم الاحترافي' : 'PREMIUM SUPPORT'}</div>
            <h2 className={`text-2xl font-black tracking-tight ${textMain}`}>{isRtl ? 'مركز التذاكر' : 'Ticket Center'}</h2>
            <p className={`mt-1 max-w-xl text-sm ${textMuted}`}>{isRtl ? 'نستلم مشكلتك ونتابعها معك من مكان واحد حتى يتم الحل.' : 'Open a ticket and keep every update, reply, and attachment in one place.'}</p>
          </div>
          <button onClick={() => setNewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-slate-100 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_12px_26px_rgba(56,189,248,0.25)] transition hover:-translate-y-0.5 active:translate-y-0"><Plus className="h-4 w-4" />{isRtl ? 'فتح تذكرة' : 'Open ticket'}</button>
        </div>
      </div>

      {isStaff && stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            [Inbox, stats.open, isRtl ? 'مفتوحة' : 'Open', 'text-emerald-300'],
            [UserCheck, stats.unassigned, isRtl ? 'بانتظار الاستلام' : 'Unassigned', 'text-sky-300'],
            [Clock3, stats.inProgress, isRtl ? 'قيد المعالجة' : 'In progress', 'text-blue-300'],
            [MessageCircle, stats.awaitingUser, isRtl ? 'بانتظار المستخدم' : 'Awaiting user', 'text-amber-300'],
            [CheckCircle2, stats.closedToday, isRtl ? 'مغلقة اليوم' : 'Closed today', 'text-slate-300'],
            [AlertCircle, stats.urgent, isRtl ? 'عاجلة' : 'Urgent', 'text-red-300'],
          ].map(([Icon, value, label, color]: any) => (
            <div key={label} className={`rounded-2xl border p-4 ${card}`}><Icon className={`mb-3 h-4 w-4 ${color}`} /><div className={`text-2xl font-black ${textMain}`}>{value}</div><div className={`mt-1 text-[11px] font-bold ${textMuted}`}>{label}</div></div>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.85fr)]">
        <aside className={`min-h-[620px] rounded-3xl border p-3 ${card}`}>
          <div className="mb-3 flex items-center gap-2 px-2 pt-1"><Filter className={`h-4 w-4 ${textMuted}`} /><span className={`text-sm font-black ${textMain}`}>{isRtl ? 'التذاكر' : 'Tickets'}</span><span className={`mr-auto rounded-full px-2 py-0.5 text-[10px] font-black ${isDark ? 'bg-sky-400/10 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>{tickets.length}</span></div>
          <div className="px-1 pb-3"><div className={`flex items-center gap-2 rounded-xl border px-3 ${field}`}><Search className="h-4 w-4 opacity-50" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isRtl ? 'بحث برقم أو عنوان...' : 'Search tickets...'} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none" /></div></div>
          <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {[
              ['all', isRtl ? 'الكل' : 'All'], ['open', isRtl ? 'الجديدة' : 'New'], ['unassigned', isRtl ? 'غير مستلمة' : 'Unassigned'], ...(isStaff ? [['mine', isRtl ? 'استلمتها' : 'Mine'], ['in_progress', isRtl ? 'قيد المعالجة' : 'In progress'], ['awaiting_user', isRtl ? 'بانتظار المستخدم' : 'Awaiting user'], ['closed', isRtl ? 'مغلقة' : 'Closed']] : []),
            ].map(([value, label]) => <button key={value} onClick={() => setFilter(value as any)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${filter === value ? 'bg-sky-400 text-slate-950' : isDark ? 'bg-white/[0.045] text-slate-400 hover:bg-white/[0.08]' : 'bg-slate-900/[0.05] text-slate-500 hover:bg-slate-900/[0.09]'}`}>{label}</button>)}
          </div>
          <div className="space-y-2 overflow-y-auto px-1 pb-1 xl:max-h-[550px]">
            {loading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className={`h-24 animate-pulse rounded-2xl border ${isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-900/[0.06] bg-slate-900/[0.035]'}`} />) : tickets.length === 0 ? (
              <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${textMuted}`}><div className={`mb-3 rounded-2xl p-4 ${isDark ? 'bg-white/[0.05]' : 'bg-sky-100/70'}`}><TicketIcon className="h-6 w-6 text-sky-400" /></div><div className={`text-sm font-black ${textMain}`}>{isRtl ? 'لا توجد تذاكر حاليًا' : 'No tickets right now'}</div><p className="mt-1 text-xs">{isRtl ? 'عندما تحتاج مساعدة، افتح تذكرة وسنتابعها هنا.' : 'Open a ticket whenever you need help.'}</p></div>
            ) : tickets.map(ticket => <TicketListItem key={ticket.id} ticket={ticket} active={selectedTicket?.id === ticket.id} lang={lang} isDark={isDark} onClick={() => selectTicket(ticket.id)} />)}
          </div>
        </aside>

        <main className={`min-h-[620px] overflow-hidden rounded-3xl border ${card}`}>
          {detailLoading ? <TicketDetailSkeleton isDark={isDark} /> : !detail ? (
            <div className={`flex min-h-[620px] flex-col items-center justify-center px-6 text-center ${textMuted}`}><div className={`mb-5 rounded-3xl p-6 ${isDark ? 'bg-sky-400/[0.08]' : 'bg-sky-100/70'}`}><MessageCircle className="h-9 w-9 text-sky-400" /></div><h3 className={`text-lg font-black ${textMain}`}>{isRtl ? 'اختر تذكرة لعرض التفاصيل' : 'Select a ticket to view details'}</h3><p className="mt-2 max-w-sm text-sm">{isRtl ? 'ستجد المحادثة والمرفقات وسجل كل إجراء في صفحة واحدة منظمة.' : 'Conversation, attachments, and activity history will appear here.'}</p><button onClick={() => setNewOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-black text-slate-950"><Plus className="h-4 w-4" />{isRtl ? 'فتح تذكرة جديدة' : 'Open new ticket'}</button></div>
          ) : <TicketDetailView detail={detail} lang={lang} isDark={isDark} isStaff={isStaff} composer={composer} setComposer={setComposer} composerRef={composerRef} composerFiles={composerFiles} setComposerFiles={setComposerFiles} internalNote={internalNote} setInternalNote={setInternalNote} sending={sending} sendMessage={sendMessage} patchTicket={patchTicket} confirmClose={confirmClose} setConfirmClose={setConfirmClose} statusOptions={statusOptions} priorityOptions={priorityOptions} field={field} textMain={textMain} textMuted={textMuted} insertComposerToken={insertComposerToken} />}
        </main>
      </div>

      {newOpen && <NewTicketModal lang={lang} isDark={isDark} field={field} textMain={textMain} textMuted={textMuted} form={newTicket} setForm={setNewTicket} files={newFiles} setFiles={setNewFiles} creating={creating} onClose={() => !creating && setNewOpen(false)} onSubmit={handleCreate} />}
    </section>
  );
}

function TicketListItem({ ticket, active, lang, isDark, onClick }: { ticket: SupportTicket; active: boolean; lang: 'ar' | 'en'; isDark: boolean; onClick: () => void }) {
  const status = statusMeta[ticket.status];
  const priority = priorityMeta[ticket.priority];
  return <button onClick={onClick} className={`w-full rounded-2xl border p-3.5 text-right transition ${active ? 'border-sky-400/45 bg-sky-400/[0.10] shadow-[0_12px_24px_rgba(56,189,248,0.10)]' : isDark ? 'border-white/[0.07] bg-white/[0.025] hover:border-sky-300/25 hover:bg-white/[0.055]' : 'border-slate-900/[0.07] bg-white/50 hover:border-sky-400/30 hover:bg-white/80'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="flex items-start justify-between gap-2"><span className={`font-mono text-[10px] font-bold ${isDark ? 'text-sky-200/80' : 'text-sky-700'}`}>#{ticket.number}</span><span className={`h-2 w-2 shrink-0 rounded-full ${status.dot} shadow-[0_0_9px_currentColor]`} /></div>
    <div className={`mt-1 line-clamp-1 text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.title}</div>
    <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><UserRound className="h-3 w-3" />{ticket.userName}<span className="opacity-50">•</span>{relativeTime(ticket.updatedAt, lang)}</div>
    <div className="mt-3 flex flex-wrap gap-1.5"><span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black ${status.color}`}>{lang === 'ar' ? status.ar : status.en}</span><span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black ${priority.color}`}>{lang === 'ar' ? priority.ar : priority.en}</span></div>
  </button>;
}

function TicketDetailView(props: any) {
  const { detail, lang, isDark, isStaff, composer, setComposer, composerRef, composerFiles, setComposerFiles, internalNote, setInternalNote, sending, sendMessage, patchTicket, confirmClose, setConfirmClose, statusOptions, priorityOptions, field, textMain, textMuted, insertComposerToken } = props;
  const ticket: SupportTicket = detail.ticket;
  const isRtl = lang === 'ar';
  const status = statusMeta[ticket.status];
  const priority = priorityMeta[ticket.priority];
  const closed = ticket.status === 'closed';
  return <div className="flex min-h-[620px] flex-col">
    <div className={`border-b p-5 sm:p-6 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0"><div className={`mb-2 font-mono text-xs font-black ${isDark ? 'text-sky-200' : 'text-sky-700'}`}>#{ticket.number}</div><h3 className={`text-xl font-black tracking-tight ${textMain}`}>{ticket.title}</h3><div className="mt-3 flex flex-wrap gap-2"><Badge className={status.color} label={isRtl ? status.ar : status.en} /><Badge className={priority.color} label={isRtl ? priority.ar : priority.en} /><Badge className={isDark ? 'border-violet-400/20 bg-violet-400/10 text-violet-200' : 'border-violet-500/18 bg-violet-50 text-violet-700'} label={isRtl ? categoryLabel[ticket.category].ar : categoryLabel[ticket.category].en} /></div></div>
        {isStaff && <div className="flex flex-wrap gap-2">{!ticket.assignedAgentId && !closed && <button onClick={() => patchTicket({ action: 'claim' }, isRtl ? 'تم استلام التذكرة وتحويلها إلى قيد المعالجة.' : 'Ticket claimed and moved to in progress.')} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-3.5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-sky-300"><UserCheck className="h-4 w-4" />{isRtl ? 'استلام التذكرة' : 'Claim ticket'}</button>}{!closed && <button onClick={() => setConfirmClose(true)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black transition ${isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/18' : 'border-emerald-500/25 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><CheckCircle2 className="h-4 w-4" />{isRtl ? 'إغلاق التذكرة' : 'Close ticket'}</button>}</div>}
      </div>
    </div>
    <div className="grid flex-1 xl:grid-cols-[minmax(0,1.72fr)_280px]">
      <div className="min-w-0 p-4 sm:p-5">
        <div className={`mb-4 rounded-2xl border p-4 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-900/[0.07] bg-slate-900/[0.025]'}`}><div className={`mb-2 flex items-center gap-2 text-xs font-black ${textMain}`}><FileText className="h-4 w-4 text-sky-400" />{isRtl ? 'وصف المشكلة' : 'Issue details'}</div><p className={`whitespace-pre-wrap text-sm leading-7 ${textMuted}`}>{detail.messages.find((message: any) => !message.isInternal)?.body || (isRtl ? 'لا يوجد وصف.' : 'No description.')}</p></div>
        <div className="mb-3 flex items-center justify-between"><div className={`flex items-center gap-2 text-sm font-black ${textMain}`}><MessageCircle className="h-4 w-4 text-sky-400" />{isRtl ? 'المحادثة' : 'Conversation'}</div><span className={`text-[11px] ${textMuted}`}>{ticket.messageCount || detail.messages.length} {isRtl ? 'رسائل' : 'messages'}</span></div>
        <div className="space-y-3">{detail.messages.map((message: any) => <MessageBubble key={message.id} message={message} lang={lang} isDark={isDark} textMain={textMain} textMuted={textMuted} />)}</div>
        <div className={`mt-5 rounded-2xl border p-3 sm:p-4 ${isDark ? 'border-sky-100/[0.12] bg-slate-950/48' : 'border-slate-900/[0.10] bg-white/80'}`}>
          {closed ? <div className={`flex items-center gap-3 p-3 text-sm ${textMuted}`}><Archive className="h-5 w-5 text-slate-400" /><div><div className={`font-black ${textMain}`}>{isRtl ? 'تم حل هذه التذكرة وإغلاقها.' : 'This ticket has been resolved and closed.'}</div><button onClick={() => patchTicket({ action: 'update', status: 'open' }, isRtl ? 'تمت إعادة فتح التذكرة.' : 'Ticket reopened.')} className="mt-1 font-bold text-sky-400 hover:underline">{isRtl ? 'إعادة فتح التذكرة' : 'Reopen ticket'}</button></div></div> : <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className={`flex items-center gap-2 text-xs font-black ${textMain}`}><Send className="h-4 w-4 text-sky-400" />{internalNote ? (isRtl ? 'ملاحظة داخلية — لا يراها المستخدم' : 'Internal note — hidden from customer') : (isRtl ? 'اكتب ردك' : 'Write a reply')}</div>{isStaff && <button onClick={() => setInternalNote(!internalNote)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${internalNote ? 'border-amber-400/30 bg-amber-400/15 text-amber-200' : isDark ? 'border-white/[0.12] text-slate-400' : 'border-slate-900/[0.10] text-slate-500'}`}><LockKeyhole className="h-3 w-3" />{internalNote ? (isRtl ? 'ملاحظة داخلية' : 'Internal note') : (isRtl ? 'إضافة ملاحظة' : 'Add note')}</button>}</div>
            <textarea ref={composerRef} value={composer} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setComposer(event.target.value)} placeholder={internalNote ? (isRtl ? 'اكتب ملاحظة للفريق...' : 'Write a note for your team...') : (isRtl ? 'اكتب ردك هنا...' : 'Write your reply here...')} className={`min-h-[110px] w-full resize-y rounded-xl border p-3 text-sm outline-none transition focus:border-sky-400/55 ${field}`} />
            {composerFiles.length > 0 && <FileChips files={composerFiles} onRemove={index => setComposerFiles((files: File[]) => files.filter((_, itemIndex) => itemIndex !== index))} isDark={isDark} />}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-1.5"><button onClick={() => insertComposerToken('**')} className={`rounded-lg border px-2 py-1.5 text-xs font-black ${isDark ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.06]' : 'border-slate-900/[0.1] text-slate-600 hover:bg-slate-900/[0.04]'}`}>B</button><button onClick={() => insertComposerToken('*')} className={`rounded-lg border px-2 py-1.5 text-xs italic ${isDark ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.06]' : 'border-slate-900/[0.1] text-slate-600 hover:bg-slate-900/[0.04]'}`}>I</button><button onClick={() => insertComposerToken('[', '](https://)')} className={`rounded-lg border px-2 py-1.5 text-[10px] font-black ${isDark ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.06]' : 'border-slate-900/[0.1] text-slate-600 hover:bg-slate-900/[0.04]'}`}>Link</button><label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-black ${isDark ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.06]' : 'border-slate-900/[0.1] text-slate-600 hover:bg-slate-900/[0.04]'}`}><Paperclip className="h-3.5 w-3.5" /><span>{isRtl ? 'إرفاق' : 'Attach'}</span><input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={event => setComposerFiles((files: File[]) => [...files, ...Array.from(event.target.files || [])].slice(0, 8))} /></label></div><button disabled={sending || (!composer.trim() && !composerFiles.length)} onClick={sendMessage} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{sending ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الرد' : 'Send reply')}</button></div>
          </>}
        </div>
      </div>
      <aside className={`border-t p-4 xl:border-r xl:border-t-0 ${isDark ? 'border-white/[0.08] bg-black/[0.10]' : 'border-slate-900/[0.08] bg-slate-900/[0.025]'}`}>
        <div className={`mb-4 text-sm font-black ${textMain}`}>{isRtl ? 'تفاصيل التذكرة' : 'Ticket details'}</div>
        {isStaff && <div className="mb-5 space-y-3"><label className={`block text-[11px] font-bold ${textMuted}`}>{isRtl ? 'الحالة' : 'Status'}<select value={ticket.status} onChange={event => patchTicket({ action: 'update', status: event.target.value }, isRtl ? 'تم تحديث الحالة.' : 'Status updated.')} className={`mt-1.5 h-10 w-full rounded-xl border px-2 text-xs font-bold outline-none ${field}`}>{statusOptions.map((value: TicketStatus) => <option key={value} value={value}>{isRtl ? statusMeta[value].ar : statusMeta[value].en}</option>)}</select></label><label className={`block text-[11px] font-bold ${textMuted}`}>{isRtl ? 'الأولوية' : 'Priority'}<select value={ticket.priority} onChange={event => patchTicket({ action: 'update', priority: event.target.value }, isRtl ? 'تم تحديث الأولوية.' : 'Priority updated.')} className={`mt-1.5 h-10 w-full rounded-xl border px-2 text-xs font-bold outline-none ${field}`}>{priorityOptions.map((value: TicketPriority) => <option key={value} value={value}>{isRtl ? priorityMeta[value].ar : priorityMeta[value].en}</option>)}</select></label></div>}
        <div className="space-y-3"><DetailRow icon={UserRound} label={isRtl ? 'صاحب التذكرة' : 'Customer'} value={ticket.userName} image={ticket.userImage} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={UsersRound} label={isRtl ? 'الموظف المسؤول' : 'Assigned agent'} value={ticket.assignedAgentName || (isRtl ? 'غير مستلمة' : 'Unassigned')} image={ticket.assignedAgentImage} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={Clock3} label={isRtl ? 'تاريخ الإنشاء' : 'Created'} value={formatDate(ticket.createdAt, lang)} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={MessageCircle} label={isRtl ? 'آخر تحديث' : 'Last update'} value={relativeTime(ticket.updatedAt, lang)} isDark={isDark} textMain={textMain} textMuted={textMuted} /></div>
        <div className={`my-5 h-px ${isDark ? 'bg-white/[0.08]' : 'bg-slate-900/[0.08]'}`} />
        <div className={`mb-3 flex items-center gap-2 text-sm font-black ${textMain}`}><Clock3 className="h-4 w-4 text-sky-400" />{isRtl ? 'سجل النشاط' : 'Activity'}</div><div className="space-y-3">{detail.timeline.slice(-8).reverse().map((event: any, index: number) => <div key={event.id} className="relative flex gap-3"><div className="flex flex-col items-center"><span className={`mt-1.5 h-2 w-2 rounded-full ${event.type === 'closed' ? 'bg-emerald-400' : event.type === 'note' ? 'bg-amber-400' : 'bg-sky-400'}`} />{index < Math.min(detail.timeline.length, 8) - 1 && <span className={`mt-1 h-full w-px ${isDark ? 'bg-white/[0.10]' : 'bg-slate-900/[0.10]'}`} />}</div><div className="pb-3"><p className={`text-[11px] leading-5 ${textMuted}`}>{event.message}</p><span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{relativeTime(event.createdAt, lang)}</span></div></div>)}</div>
      </aside>
    </div>
    {confirmClose && <ConfirmClose lang={lang} isDark={isDark} onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); patchTicket({ action: 'update', status: 'closed' }, isRtl ? 'تم إغلاق التذكرة وتسجيل العملية.' : 'Ticket closed and logged.'); }} />}
  </div>;
}

function NewTicketModal(props: any) {
  const { lang, isDark, field, textMain, textMuted, form, setForm, files, setFiles, creating, onClose, onSubmit } = props;
  const isRtl = lang === 'ar';
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}><div className={`max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl ${isDark ? 'border-sky-100/[0.14] bg-[#081527]/95' : 'border-slate-900/[0.12] bg-white/95'}`}><div className="mb-5 flex items-start justify-between"><div><div className={`mb-1 text-[10px] font-black tracking-[0.18em] ${isDark ? 'text-sky-200/70' : 'text-sky-700/70'}`}>{isRtl ? 'الدعم الفني' : 'SUPPORT DESK'}</div><h3 className={`text-xl font-black ${textMain}`}>{isRtl ? 'فتح تذكرة جديدة' : 'Open a new ticket'}</h3><p className={`mt-1 text-sm ${textMuted}`}>{isRtl ? 'اكتب ما حدث، وسيتابع فريق الدعم طلبك.' : 'Describe what happened and our support team will follow up.'}</p></div><button onClick={onClose} className={`rounded-xl border p-2 ${isDark ? 'border-white/[0.1] text-slate-300' : 'border-slate-900/[0.1] text-slate-600'}`}><X className="h-4 w-4" /></button></div><div className="grid gap-4 sm:grid-cols-2"><FieldLabel label={isRtl ? 'عنوان المشكلة' : 'Issue title'}><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder={isRtl ? 'لا أستطيع تسجيل الدخول إلى حسابي' : 'I cannot sign in to my account'} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-sky-400/55 ${field}`} /></FieldLabel><FieldLabel label={isRtl ? 'نوع المشكلة' : 'Issue category'}><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}>{(Object.keys(categoryLabel) as TicketCategory[]).map(value => <option key={value} value={value}>{isRtl ? categoryLabel[value].ar : categoryLabel[value].en}</option>)}</select></FieldLabel><FieldLabel label={isRtl ? 'الأولوية' : 'Priority'}><select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}>{(Object.keys(priorityMeta) as TicketPriority[]).map(value => <option key={value} value={value}>{isRtl ? priorityMeta[value].ar : priorityMeta[value].en}</option>)}</select></FieldLabel><div className={`rounded-xl border p-3 text-xs leading-5 ${isDark ? 'border-sky-100/[0.1] bg-sky-400/[0.05] text-sky-100/80' : 'border-sky-500/15 bg-sky-50 text-sky-800'}`}><ShieldCheck className="mb-1 h-4 w-4 text-sky-400" />{isRtl ? 'يمكن لفريق الدعم فقط الاطلاع على طلبك، ولا يراه مستخدمون آخرون.' : 'Only support staff can view your request; it is never visible to other customers.'}</div></div><FieldLabel label={isRtl ? 'شرح المشكلة' : 'Issue details'} className="mt-4"><textarea value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder={isRtl ? 'اشرح المشكلة بالتفصيل، واذكر ماذا حدث ومتى بدأت المشكلة...' : 'Describe the issue, what happened, and when it started...'} className={`min-h-[150px] w-full resize-y rounded-xl border p-3 text-sm outline-none focus:border-sky-400/55 ${field}`} /></FieldLabel><div className={`mt-4 rounded-2xl border border-dashed p-4 ${isDark ? 'border-sky-100/[0.18] bg-sky-400/[0.035]' : 'border-sky-500/20 bg-sky-50/60'}`}><div className={`flex flex-wrap items-center justify-between gap-3 text-sm ${textMuted}`}><div className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-sky-400" /><span>{isRtl ? 'اسحب الملفات هنا أو اضغط لاختيار ملف' : 'Drop files here or choose files'}</span></div><label className="cursor-pointer rounded-lg bg-sky-400 px-3 py-2 text-xs font-black text-slate-950"><span>{isRtl ? 'اختيار ملف' : 'Choose files'}</span><input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={event => setFiles([...files, ...Array.from(event.target.files || [])].slice(0, 8))} /></label></div><p className={`mt-2 text-[10px] ${textMuted}`}>{isRtl ? 'صور، PDF أو TXT حتى 10 ميغابايت لكل ملف.' : 'Images, PDF, or TXT up to 10 MB per file.'}</p>{files.length > 0 && <FileChips files={files} onRemove={(index: number) => setFiles(files.filter((_: File, itemIndex: number) => itemIndex !== index))} isDark={isDark} />}</div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onClose} disabled={creating} className={`rounded-xl px-4 py-3 text-sm font-black ${textMuted}`}>{isRtl ? 'إلغاء' : 'Cancel'}</button><button onClick={onSubmit} disabled={creating || form.title.trim().length < 4 || form.body.trim().length < 10} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-slate-100 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{creating ? (isRtl ? 'جاري إنشاء التذكرة...' : 'Creating ticket...') : (isRtl ? 'إرسال التذكرة' : 'Submit ticket')}</button></div></div></div>;
}

function MessageBubble({ message, lang, isDark, textMain, textMuted }: any) {
  const isRtl = lang === 'ar';
  const internal = Boolean(message.isInternal);
  const staff = message.authorRole === 'staff';
  const surfaceClass = internal
    ? (isDark ? 'border-amber-400/28 bg-amber-400/[0.10]' : 'border-amber-500/25 bg-amber-50')
    : staff
      ? (isDark ? 'border-sky-400/18 bg-sky-400/[0.07]' : 'border-sky-500/18 bg-sky-50/80')
      : (isDark ? 'border-white/[0.08] bg-white/[0.025]' : 'border-slate-900/[0.07] bg-white/70');
  const bodyClass = internal ? (isDark ? 'text-amber-100/90' : 'text-amber-900') : textMuted;

  return (
    <article className={`rounded-2xl border p-3.5 sm:p-4 ${surfaceClass}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar image={message.authorImage} name={message.authorName} isDark={isDark} />
        <div>
          <div className={`flex items-center gap-2 text-xs font-black ${textMain}`}>
            <span>{message.authorName}</span>
            {internal ? (
              <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[9px] text-amber-300">{isRtl ? 'ملاحظة داخلية' : 'Internal note'}</span>
            ) : (
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] ${staff ? 'bg-sky-400/12 text-sky-300' : isDark ? 'bg-white/[0.07] text-slate-300' : 'bg-slate-900/[0.06] text-slate-600'}`}>
                {staff ? (isRtl ? 'الدعم الفني' : 'Support agent') : (isRtl ? 'المستخدم' : 'Customer')}
              </span>
            )}
          </div>
          <div className={`mt-0.5 text-[10px] ${textMuted}`}>{formatDate(message.createdAt, lang)}</div>
        </div>
      </div>
      <p className={`whitespace-pre-wrap text-sm leading-7 ${bodyClass}`}>{message.body}</p>
      {message.attachments?.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {message.attachments.map((attachment: TicketAttachment) => <AttachmentCard key={attachment.id} attachment={attachment} isDark={isDark} />)}
        </div>
      )}
    </article>
  );
}

function AttachmentCard({ attachment, isDark }: { attachment: TicketAttachment; isDark: boolean }) {
  const image = attachment.contentType.startsWith('image/');
  return <a href={attachment.url} target="_blank" rel="noreferrer" className={`group flex items-center gap-3 rounded-xl border p-2.5 transition ${isDark ? 'border-white/[0.09] bg-black/20 hover:border-sky-300/30' : 'border-slate-900/[0.09] bg-white hover:border-sky-400/35'}`}>{image ? <img src={attachment.url} alt={attachment.name} className="h-10 w-10 rounded-lg object-cover" /> : <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? 'bg-white/[0.06] text-sky-300' : 'bg-sky-100 text-sky-700'}`}><FileText className="h-5 w-5" /></div>}<div className="min-w-0 flex-1"><div className={`truncate text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{attachment.name}</div><div className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatSize(attachment.size)}</div></div><ArrowLeft className={`h-3.5 w-3.5 ${isDark ? 'text-slate-500 group-hover:text-sky-300' : 'text-slate-400 group-hover:text-sky-700'}`} /></a>;
}

function FileChips({ files, onRemove, isDark }: { files: File[]; onRemove: (index: number) => void; isDark: boolean }) { return <div className="mt-3 flex flex-wrap gap-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${isDark ? 'border-white/[0.1] bg-white/[0.04] text-slate-200' : 'border-slate-900/[0.10] bg-white text-slate-700'}`}><FileText className="h-3.5 w-3.5 text-sky-400" /><span className="max-w-[160px] truncate font-bold">{file.name}</span><span className="opacity-55">{formatSize(file.size)}</span><button onClick={() => onRemove(index)}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button></div>)}</div>; }

function DetailRow({ icon: Icon, label, value, image, isDark, textMain, textMuted }: any) { return <div className="flex items-center gap-2.5"><div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg ${isDark ? 'bg-white/[0.055] text-sky-300' : 'bg-sky-100 text-sky-700'}`}>{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Icon className="h-4 w-4" />}</div><div className="min-w-0"><div className={`text-[10px] font-bold ${textMuted}`}>{label}</div><div className={`truncate text-[11px] font-black ${textMain}`}>{value}</div></div></div>; }
function Badge({ className, label }: { className: string; label: string }) { return <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${className}`}>{label}</span>; }
function Avatar({ image, name, isDark }: { image?: string | null; name?: string | null; isDark: boolean }) { return image ? <img src={image} alt="" className={`h-8 w-8 rounded-full border object-cover ${isDark ? 'border-white/[0.12]' : 'border-slate-900/[0.10]'}`} /> : <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${isDark ? 'bg-sky-400/15 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>{initialLetter(name)}</span>; }
function FieldLabel({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block text-xs font-black text-slate-500 ${className}`}><span className="mb-1.5 block">{label}</span>{children}</label>; }
function TicketDetailSkeleton({ isDark }: { isDark: boolean }) { return <div className="animate-pulse p-6"><div className={`h-5 w-20 rounded ${isDark ? 'bg-white/[0.08]' : 'bg-slate-900/[0.08]'}`} /><div className={`mt-3 h-8 w-3/4 rounded ${isDark ? 'bg-white/[0.08]' : 'bg-slate-900/[0.08]'}`} /><div className={`mt-6 h-28 rounded-2xl ${isDark ? 'bg-white/[0.06]' : 'bg-slate-900/[0.06]'}`} /><div className={`mt-4 h-40 rounded-2xl ${isDark ? 'bg-white/[0.05]' : 'bg-slate-900/[0.05]'}`} /></div>; }
function ConfirmClose({ lang, isDark, onCancel, onConfirm }: { lang: 'ar' | 'en'; isDark: boolean; onCancel: () => void; onConfirm: () => void }) { const ar = lang === 'ar'; return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-5 backdrop-blur-sm"><div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-emerald-400/20 bg-[#0a1726]' : 'border-slate-900/[0.12] bg-white'}`} dir={ar ? 'rtl' : 'ltr'}><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300"><CheckCircle2 className="h-6 w-6" /></div><h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{ar ? 'إغلاق التذكرة؟' : 'Close this ticket?'}</h4><p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ar ? 'هل تم حل مشكلة المستخدم؟ سيُسجل وقت الإغلاق واسم الموظف المسؤول، ويمكن إعادة فتحها عند الحاجة.' : 'Confirm that the issue is solved. The closing action is logged and the ticket can be reopened if needed.'}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onCancel} className={`rounded-xl px-4 py-2.5 text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ar ? 'إلغاء' : 'Cancel'}</button><button onClick={onConfirm} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950">{ar ? 'إغلاق التذكرة' : 'Close ticket'}</button></div></div></div>; }
