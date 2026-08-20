'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Ban,
  BadgeCheck,
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
  TicketDepartment,
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
  department: TicketDepartment;
  category: TicketCategory;
  priority: TicketPriority;
  body: string;
};

const statusMeta: Record<TicketStatus, { ar: string; en: string; color: string; dot: string }> = {
  new: { ar: 'جديدة', en: 'New', color: 'border-violet-400/25 bg-violet-400/10 text-violet-200', dot: 'bg-violet-400' },
  open: { ar: 'مفتوحة', en: 'Open', color: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  in_progress: { ar: 'قيد المعالجة', en: 'In progress', color: 'border-sky-400/25 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  awaiting_user: { ar: 'بانتظار المستخدم', en: 'Awaiting user', color: 'border-amber-400/25 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  awaiting_staff: { ar: 'بانتظار الإدارة', en: 'Awaiting staff', color: 'border-orange-400/25 bg-orange-400/10 text-orange-200', dot: 'bg-orange-400' },
  resolved: { ar: 'تم الحل', en: 'Resolved', color: 'border-teal-400/25 bg-teal-400/10 text-teal-200', dot: 'bg-teal-400' },
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

const departmentLabel: Record<TicketDepartment, { ar: string; en: string }> = {
  technical_support: { ar: 'الدعم الفني', en: 'Technical support' },
  sales: { ar: 'المبيعات', en: 'Sales' },
  billing: { ar: 'الفوترة', en: 'Billing' },
  accounts: { ar: 'الحسابات', en: 'Accounts' },
};

const emptyForm: NewTicketState = { title: '', department: 'technical_support', category: 'technical', priority: 'medium', body: '' };

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
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | TicketDepartment>('all');
  const [sort, setSort] = useState<'updated' | 'newest' | 'oldest' | 'priority'>('updated');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
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
  const [customerAction, setCustomerAction] = useState<'mute' | 'unmute' | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; image?: string | null; role: string }>>([]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isRtl = lang === 'ar';
  const textMain = isDark ? 'text-zinc-100' : 'text-zinc-950';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const card = isDark ? 'border-white/[0.09] bg-[#111113] shadow-[0_16px_34px_rgba(0,0,0,0.18)]' : 'border-zinc-900/[0.10] bg-white/85 shadow-[0_12px_28px_rgba(0,0,0,0.07)]';
  const field = isDark ? 'border-white/[0.10] bg-[#0a0a0b] text-zinc-100 placeholder:text-zinc-500' : 'border-zinc-900/[0.10] bg-white text-zinc-900 placeholder:text-zinc-400';

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
      else if (filter !== 'all' && filter !== 'unassigned') params.set('status', filter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (departmentFilter !== 'all') params.set('department', departmentFilter);
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/tickets?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل التذاكر.');
      const filteredTickets: SupportTicket[] = filter === 'unassigned'
        ? data.tickets.filter((ticket: SupportTicket) => !ticket.assignedAgentId)
        : data.tickets;
      const priorityWeight: Record<TicketPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const nextTickets = [...filteredTickets].sort((a: SupportTicket, b: SupportTicket) => {
        if (sort === 'priority') return priorityWeight[b.priority] - priorityWeight[a.priority];
        if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
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

  const loadAgents = async () => {
    if (!isStaff) return;
    try {
      const response = await fetch('/api/tickets?action=agents', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.success) setAgents(data.agents || []);
    } catch { /* Assignment remains optional if the staff directory is unavailable. */ }
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
      setMobileDetailOpen(true);
    } catch (error: any) {
      notify(error.message || 'تعذر فتح التذكرة.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { loadTickets(false); loadStats(); loadAgents(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => loadTickets(), 240);
    return () => window.clearTimeout(timer);
  }, [filter, priorityFilter, departmentFilter, sort, query]);

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

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === '/') { event.preventDefault(); searchRef.current?.focus(); }
      if (key === 'n') { event.preventDefault(); setNewOpen(true); }
      if (key === 'r' && detail) { event.preventDefault(); composerRef.current?.focus(); }
      if (key === 'a' && detail && isStaff && !detail.ticket.assignedAgentId && detail.ticket.status !== 'closed') { event.preventDefault(); patchTicket({ action: 'claim' }, isRtl ? 'تم استلام التذكرة.' : 'Ticket claimed.'); }
      if (key === 'c' && detail && isStaff && detail.ticket.status !== 'closed') { event.preventDefault(); setConfirmClose(true); }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [detail, isStaff, isRtl]);

  const statusOptions = useMemo(() => Object.keys(statusMeta) as TicketStatus[], []);
  const priorityOptions = useMemo(() => Object.keys(priorityMeta) as TicketPriority[], []);
  const selectedTicket = detail?.ticket;

  return (
    <section className="ticket-center--graphite space-y-3 sm:space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${notice.type === 'error' ? 'border-red-400/25 bg-red-500/10 text-red-200' : notice.type === 'warning' ? 'border-amber-400/25 bg-amber-500/10 text-amber-200' : 'border-sky-400/25 bg-sky-500/10 text-sky-100'}`}>
          <span>{notice.text}</span><button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      <header className={`ticket-workspace-header flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${card}`}>
        <div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-sky-400/10 text-sky-200' : 'bg-sky-100 text-sky-700'}`}><TicketIcon className="h-4 w-4" /></span><div className="min-w-0"><h2 className={`truncate text-base font-black tracking-tight ${textMain}`}>{isRtl ? 'إدارة التذاكر' : 'Ticket management'}</h2><p className={`hidden text-[11px] sm:block ${textMuted}`}>{isRtl ? 'الطلبات، الإجراءات، وسجل المتابعة في مساحة واحدة.' : 'Requests, actions, and activity in one workspace.'}</p></div></div>
        <button onClick={() => setNewOpen(true)} className="ticket-primary inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition"><Plus className="h-3.5 w-3.5" />{isRtl ? 'تذكرة' : 'Ticket'}</button>
      </header>

      {isStaff && stats && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            [Inbox, stats.open, isRtl ? 'مفتوحة' : 'Open', 'text-emerald-300'],
            [UserCheck, stats.unassigned, isRtl ? 'بانتظار الاستلام' : 'Unassigned', 'text-sky-300'],
            [Clock3, stats.inProgress, isRtl ? 'قيد المعالجة' : 'In progress', 'text-blue-300'],
            [MessageCircle, stats.awaitingUser, isRtl ? 'بانتظار المستخدم' : 'Awaiting user', 'text-amber-300'],
            [CheckCircle2, stats.closedToday, isRtl ? 'مغلقة اليوم' : 'Closed today', 'text-slate-300'],
            [AlertCircle, stats.urgent, isRtl ? 'عاجلة' : 'Urgent', 'text-red-300'],
          ].map(([Icon, value, label, color]: any) => (
            <div key={label} className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2 ${card}`}><Icon className={`h-3.5 w-3.5 ${color}`} /><div><div className={`text-lg leading-none font-black ${textMain}`}>{value}</div><div className={`mt-1 text-[10px] font-bold ${textMuted}`}>{label}</div></div></div>
          ))}
        </div>
      )}

      <div className="ticket-workspace grid gap-3 xl:grid-cols-[minmax(245px,0.82fr)_minmax(0,1.72fr)]">
        <aside className={`ticket-list-pane min-h-[520px] rounded-xl border p-2 ${mobileDetailOpen ? 'max-md:hidden' : ''} ${card}`}>
          <div className="mb-2 flex h-8 items-center gap-2 px-1.5"><Filter className={`h-3.5 w-3.5 ${textMuted}`} /><span className={`text-xs font-black ${textMain}`}>{isRtl ? 'التذاكر' : 'Tickets'}</span><span className={`mr-auto rounded-md px-1.5 py-0.5 text-[10px] font-black ${isDark ? 'bg-sky-400/10 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>{tickets.length}</span></div>
          <div className="space-y-1.5 px-1 pb-2"><div className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 ${field}`}><Search className="h-3.5 w-3.5 opacity-50" /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder={isRtl ? 'ابحث برقم التذكرة أو العنوان...' : 'Search by ticket or title...'} className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></div><div className="grid grid-cols-3 gap-1.5"><select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value as 'all' | TicketPriority)} className={`h-7 rounded-md border px-1.5 text-[9px] font-bold outline-none ${field}`}><option value="all">{isRtl ? 'كل الأولويات' : 'All priorities'}</option>{(Object.keys(priorityMeta) as TicketPriority[]).map(value => <option key={value} value={value}>{isRtl ? priorityMeta[value].ar : priorityMeta[value].en}</option>)}</select><select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value as 'all' | TicketDepartment)} className={`h-7 rounded-md border px-1.5 text-[9px] font-bold outline-none ${field}`}><option value="all">{isRtl ? 'كل الأقسام' : 'All departments'}</option>{(Object.keys(departmentLabel) as TicketDepartment[]).map(value => <option key={value} value={value}>{isRtl ? departmentLabel[value].ar : departmentLabel[value].en}</option>)}</select><select value={sort} onChange={event => setSort(event.target.value as 'updated' | 'newest' | 'oldest' | 'priority')} className={`h-7 rounded-md border px-1.5 text-[9px] font-bold outline-none ${field}`} aria-label={isRtl ? 'ترتيب التذاكر' : 'Sort tickets'}><option value="updated">{isRtl ? 'آخر تحديث' : 'Updated'}</option><option value="newest">{isRtl ? 'الأحدث' : 'Newest'}</option><option value="oldest">{isRtl ? 'الأقدم' : 'Oldest'}</option><option value="priority">{isRtl ? 'الأولوية' : 'Priority'}</option></select></div></div>
          <div className="scrollbar-none mb-2 flex gap-1 overflow-x-auto px-1 pb-1">
            {[
              ['all', isRtl ? 'الكل' : 'All'], ['new', isRtl ? 'جديدة' : 'New'], ['open', isRtl ? 'مفتوحة' : 'Open'], ['unassigned', isRtl ? 'غير مستلمة' : 'Unassigned'], ...(isStaff ? [['mine', isRtl ? 'استلمتها' : 'Mine'], ['in_progress', isRtl ? 'قيد المعالجة' : 'In progress'], ['awaiting_user', isRtl ? 'بانتظار المستخدم' : 'Awaiting user'], ['resolved', isRtl ? 'تم الحل' : 'Resolved'], ['closed', isRtl ? 'مغلقة' : 'Closed']] : []),
            ].map(([value, label]) => <button key={value} onClick={() => setFilter(value as any)} className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition ${filter === value ? 'ticket-filter--active' : isDark ? 'bg-white/[0.045] text-slate-400 hover:bg-white/[0.08]' : 'bg-slate-900/[0.05] text-slate-500 hover:bg-slate-900/[0.09]'}`}>{label}</button>)}
          </div>
          <div className="space-y-1 overflow-y-auto px-1 pb-1 xl:max-h-[590px]">
            {loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className={`h-[68px] animate-pulse rounded-lg border ${isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-900/[0.06] bg-slate-900/[0.035]'}`} />) : tickets.length === 0 ? (
              <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${textMuted}`}><div className={`ticket-empty-icon mb-3 rounded-2xl p-4 ${isDark ? 'bg-white/[0.05]' : 'bg-zinc-100'}`}><TicketIcon className="h-6 w-6 text-sky-400" /></div><div className={`text-sm font-black ${textMain}`}>{isRtl ? 'لا توجد تذاكر حاليًا' : 'No tickets right now'}</div><p className="mt-1 text-xs">{isRtl ? 'عندما تحتاج مساعدة، افتح تذكرة وسنتابعها هنا.' : 'Open a ticket whenever you need help.'}</p></div>
            ) : tickets.map(ticket => <TicketListItem key={ticket.id} ticket={ticket} active={selectedTicket?.id === ticket.id} lang={lang} isDark={isDark} onClick={() => selectTicket(ticket.id)} />)}
          </div>
        </aside>

        <main className={`ticket-detail-pane min-h-[520px] overflow-hidden rounded-xl border ${mobileDetailOpen ? '' : 'max-md:hidden'} ${card}`}>
          {mobileDetailOpen && <button onClick={() => setMobileDetailOpen(false)} className={`m-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black md:hidden ${isDark ? 'border-white/[0.1] text-zinc-300' : 'border-slate-900/[0.1] text-slate-600'}`}><ArrowLeft className="h-3.5 w-3.5" />{isRtl ? 'التذاكر' : 'Tickets'}</button>}{detailLoading ? <TicketDetailSkeleton isDark={isDark} /> : !detail ? (
            <div className={`flex min-h-[520px] flex-col items-center justify-center px-6 text-center ${textMuted}`}><div className={`ticket-empty-icon mb-3 rounded-xl p-3 ${isDark ? 'bg-white/[0.05]' : 'bg-zinc-100'}`}><FileText className="h-6 w-6 text-sky-400" /></div><h3 className={`text-sm font-black ${textMain}`}>{isRtl ? 'اختر تذكرة لعرض ملفها' : 'Select a ticket file'}</h3><p className="mt-1 max-w-sm text-xs">{isRtl ? 'ستظهر المعلومات والإجراءات وسجل المتابعة هنا.' : 'Details, actions, and activity will appear here.'}</p><button onClick={() => setNewOpen(true)} className="ticket-primary mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black"><Plus className="h-3.5 w-3.5" />{isRtl ? 'تذكرة جديدة' : 'New ticket'}</button></div>
                      ) : <TicketDetailView detail={detail} lang={lang} isDark={isDark} isStaff={isStaff} agents={agents} composer={composer} setComposer={setComposer} composerRef={composerRef} composerFiles={composerFiles} setComposerFiles={setComposerFiles} internalNote={internalNote} setInternalNote={setInternalNote} sending={sending} sendMessage={sendMessage} patchTicket={patchTicket} confirmClose={confirmClose} setConfirmClose={setConfirmClose} customerAction={customerAction} setCustomerAction={setCustomerAction} statusOptions={statusOptions} priorityOptions={priorityOptions} field={field} textMain={textMain} textMuted={textMuted} insertComposerToken={insertComposerToken} />}
        </main>
      </div>

      {newOpen && <NewTicketModal lang={lang} isDark={isDark} field={field} textMain={textMain} textMuted={textMuted} form={newTicket} setForm={setNewTicket} files={newFiles} setFiles={setNewFiles} creating={creating} onClose={() => !creating && setNewOpen(false)} onSubmit={handleCreate} />}
    </section>
  );
}

function TicketListItem({ ticket, active, lang, isDark, onClick }: { ticket: SupportTicket; active: boolean; lang: 'ar' | 'en'; isDark: boolean; onClick: () => void }) {
  const status = statusMeta[ticket.status];
  const priority = priorityMeta[ticket.priority];
  return <button onClick={onClick} className={`ticket-row w-full border-b px-2.5 py-2.5 text-right transition last:border-b-0 ${active ? 'ticket-list--active' : isDark ? 'border-white/[0.06] hover:bg-white/[0.045]' : 'border-slate-900/[0.06] hover:bg-slate-900/[0.03]'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="flex items-center justify-between gap-2"><span className={`font-mono text-[9px] font-bold ${isDark ? 'text-sky-200/80' : 'text-sky-700'}`}>#{ticket.number}</span><div className="flex items-center gap-1"><span className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${status.color}`}>{lang === 'ar' ? status.ar : status.en}</span><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /></div></div>
    <div className={`mt-1 line-clamp-1 text-[12px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.title}</div>
    <div className={`mt-1 flex items-center gap-1 text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><span className="truncate">{ticket.userName}</span><span className="opacity-45">•</span><span className="shrink-0">{relativeTime(ticket.updatedAt, lang)}</span><span className={`mr-auto rounded border px-1 py-0.5 text-[8px] font-black ${priority.color}`}>{lang === 'ar' ? priority.ar : priority.en}</span></div>
  </button>;
}

function TicketDetailView(props: any) {
  const { detail, lang, isDark, isStaff, agents, composer, setComposer, composerRef, composerFiles, setComposerFiles, internalNote, setInternalNote, sending, sendMessage, patchTicket, confirmClose, setConfirmClose, customerAction, setCustomerAction, priorityOptions, field, textMain, textMuted } = props;
  const ticket: SupportTicket = detail.ticket;
  const customer = detail.customer;
  const isRtl = lang === 'ar';
  const status = statusMeta[ticket.status];
  const priority = priorityMeta[ticket.priority];
  const closed = ticket.status === 'closed';
  const initialMessage = detail.messages.find((message: any) => !message.isInternal);
  const permittedStatusOptions: Record<TicketStatus, TicketStatus[]> = {
    new: ['new', 'open', 'in_progress', 'awaiting_staff', 'closed'],
    open: ['open', 'in_progress', 'awaiting_staff', 'awaiting_user', 'resolved', 'closed'],
    in_progress: ['in_progress', 'open', 'awaiting_user', 'awaiting_staff', 'resolved', 'closed'],
    awaiting_user: ['awaiting_user', 'in_progress', 'resolved', 'closed'],
    awaiting_staff: ['awaiting_staff', 'open', 'in_progress', 'closed'],
    resolved: ['resolved', 'closed', 'open'],
    closed: ['closed'],
  };

  return <div className="flex min-h-[520px] flex-col">
    <header className={`border-b px-3 py-3 sm:px-4 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className={`font-mono text-[10px] font-black ${isDark ? 'text-sky-200' : 'text-sky-700'}`}>#{ticket.number}</div><h3 className={`mt-0.5 truncate text-base font-black tracking-tight sm:text-lg ${textMain}`}>{ticket.title}</h3><div className="mt-2 flex flex-wrap gap-1.5"><Badge className={status.color} label={isRtl ? status.ar : status.en} /><Badge className={priority.color} label={isRtl ? priority.ar : priority.en} /><Badge className={isDark ? 'border-violet-400/20 bg-violet-400/10 text-violet-200' : 'border-violet-500/18 bg-violet-50 text-violet-700'} label={isRtl ? categoryLabel[ticket.category].ar : categoryLabel[ticket.category].en} /></div></div>
        {isStaff && <div className="flex flex-wrap gap-2">{!ticket.assignedAgentId && !closed && <button onClick={() => patchTicket({ action: 'claim' }, isRtl ? 'تم استلام التذكرة.' : 'Ticket claimed.')} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-400 px-3 text-[10px] font-black text-slate-950 transition hover:scale-[1.02]"><UserCheck className="h-3.5 w-3.5" />{isRtl ? 'استلام التذكرة' : 'Claim ticket'}</button>}{closed ? <span className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black ${isDark ? 'border-slate-400/25 bg-slate-400/10 text-slate-300' : 'border-slate-500/20 bg-slate-100 text-slate-600'}`}><LockKeyhole className="h-3.5 w-3.5" />{isRtl ? 'إغلاق نهائي' : 'Final closure'}</span> : <button onClick={() => setConfirmClose(true)} className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black transition hover:scale-[1.02] ${isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/18' : 'border-emerald-500/25 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><CheckCircle2 className="h-3.5 w-3.5" />{isRtl ? 'إغلاق نهائي' : 'Final close'}</button>}</div>}
      </div>
    </header>
    <div className={`flex flex-wrap gap-x-4 gap-y-1 border-b px-3 py-2 text-[10px] sm:px-4 ${isDark ? 'border-white/[0.07] bg-black/[0.09] text-zinc-400' : 'border-slate-900/[0.07] bg-slate-900/[0.02] text-slate-500'}`}><span><b className={textMain}>{isRtl ? 'العميل:' : 'Customer:'}</b> {ticket.userName}</span><span><b className={textMain}>{isRtl ? 'القسم:' : 'Department:'}</b> {ticket.department ? (isRtl ? departmentLabel[ticket.department].ar : departmentLabel[ticket.department].en) : (isRtl ? 'الدعم الفني' : 'Technical support')}</span><span><b className={textMain}>{isRtl ? 'المسؤول:' : 'Owner:'}</b> {ticket.assignedAgentName || (isRtl ? 'غير معيّن' : 'Unassigned')}</span><span><b className={textMain}>{isRtl ? 'آخر تحديث:' : 'Updated:'}</b> {relativeTime(ticket.updatedAt, lang)}</span></div>
    <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0 p-3 sm:p-4">
        <section className={`border-b pb-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}><div className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-black ${textMain}`}><FileText className="h-3.5 w-3.5 text-sky-400" />{isRtl ? 'وصف المشكلة' : 'Issue description'}</div><p className={`whitespace-pre-wrap text-[12px] leading-6 ${textMuted}`}>{initialMessage?.body || (isRtl ? 'لا يوجد وصف مضاف.' : 'No description added.')}</p>{initialMessage?.attachments?.length > 0 && <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{initialMessage.attachments.map((attachment: TicketAttachment) => <AttachmentCard key={attachment.id} attachment={attachment} isDark={isDark} />)}</div>}</section>
        <section className="pt-3"><div className="mb-1 flex items-center justify-between"><div className={`flex items-center gap-1.5 text-[11px] font-black ${textMain}`}><Clock3 className="h-3.5 w-3.5 text-sky-400" />{isRtl ? 'التحديثات والمراسلات' : 'Updates and correspondence'}</div><span className={`text-[9px] ${textMuted}`}>{ticket.messageCount || detail.messages.length} {isRtl ? 'تحديثاً' : 'updates'}</span></div><div className="divide-y divide-white/[0.07]">{detail.messages.map((message: any) => <TicketUpdateItem key={message.id} message={message} lang={lang} isDark={isDark} textMain={textMain} textMuted={textMuted} />)}</div></section>
        <div className={`sticky bottom-0 mt-3 border-t pt-3 ${isDark ? 'border-white/[0.08] bg-[#111113]' : 'border-slate-900/[0.08] bg-white'}`}>{closed ? <div className={`flex items-center gap-2 py-1 text-[11px] ${textMuted}`}><LockKeyhole className="h-4 w-4" />{isRtl ? 'هذه التذكرة مغلقة نهائيًا ولا يمكن إعادة فتحها أو إضافة تحديثات جديدة.' : 'This ticket is permanently closed and cannot be reopened or updated.'}</div> : <><div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><div className={`text-[10px] font-black ${textMain}`}>{internalNote ? (isRtl ? 'ملاحظة داخلية للفريق' : 'Internal staff note') : (isRtl ? 'إضافة تحديث على التذكرة' : 'Add a ticket update')}</div>{isStaff && <button onClick={() => setInternalNote(!internalNote)} className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[9px] font-black ${internalNote ? 'border-amber-400/30 bg-amber-400/15 text-amber-200' : isDark ? 'border-white/[0.10] text-zinc-400' : 'border-slate-900/[0.10] text-slate-500'}`}><LockKeyhole className="h-3 w-3" />{internalNote ? (isRtl ? 'ملاحظة داخلية' : 'Internal') : (isRtl ? 'رد للعميل' : 'Customer reply')}</button>}</div><div className={`flex items-end gap-2 rounded-lg border p-1.5 ${isDark ? 'border-white/[0.10] bg-black/[0.18]' : 'border-slate-900/[0.10] bg-white'}`}><textarea ref={composerRef} value={composer} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setComposer(event.target.value)} onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey && (composer.trim() || composerFiles.length)) { event.preventDefault(); sendMessage(); } }} placeholder={internalNote ? (isRtl ? 'أضف ملاحظة للفريق...' : 'Add an internal note...') : (isRtl ? 'أضف تحديثاً على التذكرة...' : 'Add a ticket update...')} className={`min-h-[52px] flex-1 resize-y border-0 bg-transparent px-2 py-1 text-[11px] outline-none ${textMain}`} /><label className={`inline-flex h-7 cursor-pointer items-center rounded-md border px-2 text-[9px] font-black ${isDark ? 'border-white/[0.1] text-zinc-300' : 'border-slate-900/[0.1] text-slate-600'}`}><Paperclip className="h-3.5 w-3.5" /><input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={event => setComposerFiles((files: File[]) => [...files, ...Array.from(event.target.files || [])].slice(0, 8))} /></label><button disabled={sending || (!composer.trim() && !composerFiles.length)} onClick={sendMessage} className="inline-flex h-7 items-center gap-1 rounded-md bg-sky-400 px-2.5 text-[10px] font-black text-slate-950 disabled:opacity-50"><Send className="h-3.5 w-3.5" />{sending ? '...' : (isRtl ? 'إرسال' : 'Send')}</button></div>{composerFiles.length > 0 && <FileChips files={composerFiles} onRemove={index => setComposerFiles((files: File[]) => files.filter((_, itemIndex) => itemIndex !== index))} isDark={isDark} />}</>}</div>
      </div>
      <aside className={`ticket-metadata border-t px-3 py-3 xl:border-r xl:border-t-0 ${isDark ? 'border-white/[0.08] bg-black/[0.10]' : 'border-slate-900/[0.08] bg-slate-900/[0.025]'}`}>
        {isStaff && <section className={`mb-3 overflow-hidden rounded-2xl border p-3 ${isDark ? 'border-sky-300/15 bg-sky-400/[0.045]' : 'border-sky-500/15 bg-sky-50/70'}`}>
          <div className="flex items-center gap-2.5"><Avatar image={customer?.image || ticket.userImage} name={customer?.name || ticket.userName} isDark={isDark} /><div className="min-w-0 flex-1"><div className={`truncate text-[11px] font-black ${textMain}`}>{customer?.name || ticket.userName}</div><div className={`mt-0.5 truncate text-[9px] ${textMuted}`}>{customer?.email || `ID: ${ticket.userId.slice(-10)}`}</div></div><BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" /></div>
          <div className="mt-3 flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black ${customer?.ticketMuted ? 'border-rose-400/25 bg-rose-400/10 text-rose-200' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'}`}>{customer?.ticketMuted ? <Ban className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}{customer?.ticketMuted ? (isRtl ? 'مكتوم من التذاكر' : 'Ticket muted') : (isRtl ? 'يسمح بفتح تذاكر' : 'Tickets allowed')}</span><span className={`text-[8px] font-bold ${textMuted}`}>{customer?.role || 'Customer'}</span></div>
          {customer?.ticketMuted && <p className={`mt-2 text-[9px] leading-4 ${textMuted}`}>{isRtl ? `تم الكتم بواسطة ${customer.mutedByName || 'الإدارة'}.` : `Muted by ${customer.mutedByName || 'staff'}.`}</p>}
          <button onClick={() => setCustomerAction(customer?.ticketMuted ? 'unmute' : 'mute')} className={`mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl border text-[10px] font-black transition hover:scale-[1.01] ${customer?.ticketMuted ? (isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-emerald-500/25 bg-emerald-50 text-emerald-700') : (isDark ? 'border-rose-400/25 bg-rose-400/10 text-rose-200' : 'border-rose-500/25 bg-rose-50 text-rose-700')}`}>{customer?.ticketMuted ? <BadgeCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}{customer?.ticketMuted ? (isRtl ? 'رفع الكتم' : 'Remove mute') : (isRtl ? 'كتم العميل من التذاكر' : 'Mute ticket access')}</button>
        </section>}
        <div className={`mb-2 text-[11px] font-black ${textMain}`}>{isRtl ? 'إجراءات التذكرة' : 'Ticket actions'}</div>{isStaff && <div className="space-y-2"><label className={`block text-[9px] font-bold ${textMuted}`}>{isRtl ? 'الحالة' : 'Status'}<select disabled={closed} value={ticket.status} onChange={event => patchTicket({ action: 'update', status: event.target.value }, isRtl ? 'تم تحديث الحالة.' : 'Status updated.')} className={`mt-1 h-7 w-full rounded-md border px-1.5 text-[10px] font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${field}`}>{permittedStatusOptions[ticket.status].map((value: TicketStatus) => <option key={value} value={value}>{isRtl ? statusMeta[value].ar : statusMeta[value].en}</option>)}</select></label><label className={`block text-[9px] font-bold ${textMuted}`}>{isRtl ? 'الأولوية' : 'Priority'}<select disabled={closed} value={ticket.priority} onChange={event => patchTicket({ action: 'update', priority: event.target.value }, isRtl ? 'تم تحديث الأولوية.' : 'Priority updated.')} className={`mt-1 h-7 w-full rounded-md border px-1.5 text-[10px] font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${field}`}>{priorityOptions.map((value: TicketPriority) => <option key={value} value={value}>{isRtl ? priorityMeta[value].ar : priorityMeta[value].en}</option>)}</select></label><label className={`block text-[9px] font-bold ${textMuted}`}>{isRtl ? 'الموظف المسؤول' : 'Assigned agent'}<select disabled={closed} value={ticket.assignedAgentId || ''} onChange={event => patchTicket({ action: 'assign', assigneeId: event.target.value || null }, event.target.value ? (isRtl ? 'تم تعيين الموظف.' : 'Agent assigned.') : (isRtl ? 'تم إلغاء التعيين.' : 'Assignment cleared.'))} className={`mt-1 h-7 w-full rounded-md border px-1.5 text-[10px] font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${field}`}><option value="">{isRtl ? 'غير معيّن' : 'Unassigned'}</option>{agents.map((agent: { id: string; name: string; role: string }) => <option key={agent.id} value={agent.id}>{agent.name} — {agent.role}</option>)}</select></label></div>}<div className={`mt-3 space-y-2 border-t pt-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}><DetailRow icon={UserRound} label={isRtl ? 'صاحب التذكرة' : 'Customer'} value={ticket.userName} image={ticket.userImage} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={FolderOpen} label={isRtl ? 'القسم' : 'Department'} value={ticket.department ? (isRtl ? departmentLabel[ticket.department].ar : departmentLabel[ticket.department].en) : (isRtl ? 'الدعم الفني' : 'Technical support')} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={Clock3} label={isRtl ? 'الإنشاء' : 'Created'} value={formatDate(ticket.createdAt, lang)} isDark={isDark} textMain={textMain} textMuted={textMuted} /><DetailRow icon={Clock3} label={isRtl ? 'المهلة' : 'SLA due'} value={ticket.slaDueAt ? formatDate(ticket.slaDueAt, lang) : (isRtl ? 'غير محددة' : 'Not set')} isDark={isDark} textMain={textMain} textMuted={textMuted} /></div>{(ticket.tags?.length ?? 0) > 0 && <div className={`mt-3 border-t pt-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}><div className={`mb-1.5 text-[9px] font-bold ${textMuted}`}>{isRtl ? 'الوسوم' : 'Tags'}</div><div className="flex flex-wrap gap-1">{(ticket.tags || []).map((tag: string) => <span key={tag} className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${isDark ? 'border-white/[0.1] text-zinc-300' : 'border-slate-900/[0.1] text-slate-600'}`}>{tag}</span>)}</div></div>}<div className={`mt-3 border-t pt-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'}`}><div className={`mb-2 text-[10px] font-black ${textMain}`}>{isRtl ? 'آخر النشاط' : 'Recent activity'}</div><div className="space-y-2">{detail.timeline.slice(-4).reverse().map((event: any) => <div key={event.id} className="flex gap-2"><span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${event.type === 'closed' ? 'bg-emerald-400' : event.type === 'note' ? 'bg-amber-400' : 'bg-sky-400'}`} /><div className="min-w-0"><p className={`line-clamp-2 text-[9px] leading-4 ${textMuted}`}>{event.message}</p><span className={`text-[8px] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>{relativeTime(event.createdAt, lang)}</span></div></div>)}</div></div></aside>
    </div>
    {confirmClose && <ConfirmClose lang={lang} isDark={isDark} onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); patchTicket({ action: 'update', status: 'closed' }, isRtl ? 'تم إغلاق التذكرة نهائيًا وتسجيل العملية.' : 'Ticket permanently closed and logged.'); }} />}
    {customerAction && <ConfirmCustomerAction action={customerAction} lang={lang} isDark={isDark} customerName={customer?.name || ticket.userName} onCancel={() => setCustomerAction(null)} onConfirm={() => { const action = customerAction; setCustomerAction(null); patchTicket({ action: action === 'mute' ? 'mute_customer' : 'unmute_customer', muteReason: action === 'mute' ? 'تم الكتم من لوحة التذاكر.' : undefined }, action === 'mute' ? (isRtl ? 'تم كتم العميل من فتح تذاكر جديدة.' : 'Customer muted from new tickets.') : (isRtl ? 'تم رفع كتم التذاكر عن العميل.' : 'Ticket mute removed.')); }} />}
  </div>;
}

function NewTicketModal(props: any) {
  const { lang, isDark, field, textMain, textMuted, form, setForm, files, setFiles, creating, onClose, onSubmit } = props;
  const isRtl = lang === 'ar';
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}><div className={`max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl ${isDark ? 'border-sky-100/[0.14] bg-[#081527]/95' : 'border-slate-900/[0.12] bg-white/95'}`}><div className="mb-5 flex items-start justify-between"><div><div className={`mb-1 text-[10px] font-black tracking-[0.18em] ${isDark ? 'text-sky-200/70' : 'text-sky-700/70'}`}>{isRtl ? 'الدعم الفني' : 'SUPPORT DESK'}</div><h3 className={`text-xl font-black ${textMain}`}>{isRtl ? 'فتح تذكرة جديدة' : 'Open a new ticket'}</h3><p className={`mt-1 text-sm ${textMuted}`}>{isRtl ? 'اكتب ما حدث، وسيتابع فريق الدعم طلبك.' : 'Describe what happened and our support team will follow up.'}</p></div><button onClick={onClose} className={`rounded-xl border p-2 ${isDark ? 'border-white/[0.1] text-slate-300' : 'border-slate-900/[0.1] text-slate-600'}`}><X className="h-4 w-4" /></button></div><div className="grid gap-4 sm:grid-cols-2"><FieldLabel label={isRtl ? 'عنوان المشكلة' : 'Issue title'}><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder={isRtl ? 'لا أستطيع تسجيل الدخول إلى حسابي' : 'I cannot sign in to my account'} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-sky-400/55 ${field}`} /></FieldLabel><FieldLabel label={isRtl ? 'قسم الدعم' : 'Support department'}><select value={form.department} onChange={event => setForm({ ...form, department: event.target.value as TicketDepartment })} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}>{(Object.keys(departmentLabel) as TicketDepartment[]).map(value => <option key={value} value={value}>{isRtl ? departmentLabel[value].ar : departmentLabel[value].en}</option>)}</select></FieldLabel><FieldLabel label={isRtl ? 'نوع المشكلة' : 'Issue category'}><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}>{(Object.keys(categoryLabel) as TicketCategory[]).map(value => <option key={value} value={value}>{isRtl ? categoryLabel[value].ar : categoryLabel[value].en}</option>)}</select></FieldLabel><FieldLabel label={isRtl ? 'الأولوية' : 'Priority'}><select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })} className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}>{(Object.keys(priorityMeta) as TicketPriority[]).map(value => <option key={value} value={value}>{isRtl ? priorityMeta[value].ar : priorityMeta[value].en}</option>)}</select></FieldLabel><div className={`rounded-xl border p-3 text-xs leading-5 ${isDark ? 'border-sky-100/[0.1] bg-sky-400/[0.05] text-sky-100/80' : 'border-sky-500/15 bg-sky-50 text-sky-800'}`}><ShieldCheck className="mb-1 h-4 w-4 text-sky-400" />{isRtl ? 'يمكن لفريق الدعم فقط الاطلاع على طلبك، ولا يراه مستخدمون آخرون.' : 'Only support staff can view your request; it is never visible to other customers.'}</div></div><FieldLabel label={isRtl ? 'شرح المشكلة' : 'Issue details'} className="mt-4"><textarea value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder={isRtl ? 'اشرح المشكلة بالتفصيل، واذكر ماذا حدث ومتى بدأت المشكلة...' : 'Describe the issue, what happened, and when it started...'} className={`min-h-[150px] w-full resize-y rounded-xl border p-3 text-sm outline-none focus:border-sky-400/55 ${field}`} /></FieldLabel><div className={`mt-4 rounded-2xl border border-dashed p-4 ${isDark ? 'border-sky-100/[0.18] bg-sky-400/[0.035]' : 'border-sky-500/20 bg-sky-50/60'}`}><div className={`flex flex-wrap items-center justify-between gap-3 text-sm ${textMuted}`}><div className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-sky-400" /><span>{isRtl ? 'اسحب الملفات هنا أو اضغط لاختيار ملف' : 'Drop files here or choose files'}</span></div><label className="cursor-pointer rounded-lg bg-sky-400 px-3 py-2 text-xs font-black text-slate-950"><span>{isRtl ? 'اختيار ملف' : 'Choose files'}</span><input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={event => setFiles([...files, ...Array.from(event.target.files || [])].slice(0, 8))} /></label></div><p className={`mt-2 text-[10px] ${textMuted}`}>{isRtl ? 'صور، PDF أو TXT حتى 10 ميغابايت لكل ملف.' : 'Images, PDF, or TXT up to 10 MB per file.'}</p>{files.length > 0 && <FileChips files={files} onRemove={(index: number) => setFiles(files.filter((_: File, itemIndex: number) => itemIndex !== index))} isDark={isDark} />}</div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onClose} disabled={creating} className={`rounded-xl px-4 py-3 text-sm font-black ${textMuted}`}>{isRtl ? 'إلغاء' : 'Cancel'}</button><button onClick={onSubmit} disabled={creating || form.title.trim().length < 4 || form.body.trim().length < 10} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-slate-100 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{creating ? (isRtl ? 'جاري إنشاء التذكرة...' : 'Creating ticket...') : (isRtl ? 'إرسال التذكرة' : 'Submit ticket')}</button></div></div></div>;
}

function TicketUpdateItem({ message, lang, isDark, textMain, textMuted }: any) {
  const isRtl = lang === 'ar';
  const internal = Boolean(message.isInternal);
  const staff = message.authorRole === 'staff';
  return <article className={`relative flex gap-2.5 py-3 ${internal ? (isDark ? 'bg-amber-400/[0.035]' : 'bg-amber-50/50') : ''}`}>
    <div className="relative shrink-0"><Avatar image={message.authorImage} name={message.authorName} isDark={isDark} /><span className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 ${isDark ? 'border-[#111113]' : 'border-white'} ${internal ? 'bg-amber-400' : staff ? 'bg-sky-400' : 'bg-zinc-400'}`} /></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><span className={`text-[11px] font-black ${textMain}`}>{message.authorName}</span><span className={`text-[9px] ${textMuted}`}>{internal ? (isRtl ? 'أضاف ملاحظة داخلية' : 'added an internal note') : staff ? (isRtl ? 'أضاف تحديثاً للدعم' : 'added a support update') : (isRtl ? 'أضاف تعليقاً' : 'added a comment')}</span>{internal && <span className="rounded border border-amber-400/25 bg-amber-400/10 px-1 py-0.5 text-[8px] font-bold text-amber-300">{isRtl ? 'داخلي' : 'Internal'}</span>}</div><div className={`mt-0.5 text-[9px] ${textMuted}`}>{relativeTime(message.createdAt, lang)} · {formatDate(message.createdAt, lang)}</div><p className={`mt-1.5 whitespace-pre-wrap text-[11px] leading-5 ${internal ? (isDark ? 'text-amber-100/85' : 'text-amber-900') : textMuted}`}>{message.body}</p>{message.attachments?.length > 0 && <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{message.attachments.map((attachment: TicketAttachment) => <AttachmentCard key={attachment.id} attachment={attachment} isDark={isDark} />)}</div>}</div>
  </article>;
}

function AttachmentCard({ attachment, isDark }: { attachment: TicketAttachment; isDark: boolean }) {
  const image = attachment.contentType.startsWith('image/');
  return <a href={attachment.url} target="_blank" rel="noreferrer" className={`group flex items-center gap-3 rounded-xl border p-2.5 transition ${isDark ? 'border-white/[0.09] bg-black/20 hover:border-sky-300/30' : 'border-slate-900/[0.09] bg-white hover:border-sky-400/35'}`}>{image ? <img src={attachment.url} alt={attachment.name} className="h-10 w-10 rounded-lg object-cover" /> : <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? 'bg-white/[0.06] text-sky-300' : 'bg-sky-100 text-sky-700'}`}><FileText className="h-5 w-5" /></div>}<div className="min-w-0 flex-1"><div className={`truncate text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{attachment.name}</div><div className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatSize(attachment.size)}</div></div><ArrowLeft className={`h-3.5 w-3.5 ${isDark ? 'text-slate-500 group-hover:text-sky-300' : 'text-slate-400 group-hover:text-sky-700'}`} /></a>;
}

function FileChips({ files, onRemove, isDark }: { files: File[]; onRemove: (index: number) => void; isDark: boolean }) { return <div className="mt-3 flex flex-wrap gap-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${isDark ? 'border-white/[0.1] bg-white/[0.04] text-slate-200' : 'border-slate-900/[0.10] bg-white text-slate-700'}`}><FileText className="h-3.5 w-3.5 text-sky-400" /><span className="max-w-[160px] truncate font-bold">{file.name}</span><span className="opacity-55">{formatSize(file.size)}</span><button onClick={() => onRemove(index)}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button></div>)}</div>; }

function DetailRow({ icon: Icon, label, value, image, isDark, textMain, textMuted }: any) { return <div className="flex min-w-0 items-center gap-1.5"><span className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{image ? <img src={image} alt="" className="h-5 w-5 rounded object-cover" /> : <Icon className="h-3.5 w-3.5" />}</span><div className="min-w-0"><span className={`text-[8px] font-bold ${textMuted}`}>{label}: </span><span className={`text-[10px] font-black ${textMain}`}>{value}</span></div></div>; }
function Badge({ className, label }: { className: string; label: string }) { return <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${className}`}>{label}</span>; }
function Avatar({ image, name, isDark }: { image?: string | null; name?: string | null; isDark: boolean }) { return image ? <img src={image} alt="" className={`h-8 w-8 rounded-full border object-cover ${isDark ? 'border-white/[0.12]' : 'border-slate-900/[0.10]'}`} /> : <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${isDark ? 'bg-sky-400/15 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>{initialLetter(name)}</span>; }
function FieldLabel({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block text-xs font-black text-slate-500 ${className}`}><span className="mb-1.5 block">{label}</span>{children}</label>; }
function TicketDetailSkeleton({ isDark }: { isDark: boolean }) { return <div className="animate-pulse p-4"><div className={`h-4 w-16 rounded ${isDark ? 'bg-white/[0.08]' : 'bg-slate-900/[0.08]'}`} /><div className={`mt-2 h-6 w-3/5 rounded ${isDark ? 'bg-white/[0.08]' : 'bg-slate-900/[0.08]'}`} /><div className={`mt-4 h-10 rounded-lg ${isDark ? 'bg-white/[0.06]' : 'bg-slate-900/[0.06]'}`} /><div className={`mt-4 h-20 rounded-lg ${isDark ? 'bg-white/[0.05]' : 'bg-slate-900/[0.05]'}`} /><div className={`mt-2 h-16 rounded-lg ${isDark ? 'bg-white/[0.05]' : 'bg-slate-900/[0.05]'}`} /></div>; }
function ConfirmClose({ lang, isDark, onCancel, onConfirm }: { lang: 'ar' | 'en'; isDark: boolean; onCancel: () => void; onConfirm: () => void }) { const ar = lang === 'ar'; return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-5 backdrop-blur-sm"><div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-emerald-400/20 bg-[#0a1726]' : 'border-slate-900/[0.12] bg-white'}`} dir={ar ? 'rtl' : 'ltr'}><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300"><CheckCircle2 className="h-6 w-6" /></div><h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{ar ? 'إغلاق التذكرة؟' : 'Close this ticket?'}</h4><p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ar ? 'هل تم حل مشكلة المستخدم؟ سيُسجل وقت الإغلاق واسم الموظف المسؤول، وسيكون الإغلاق نهائيًا ولا يمكن إعادة فتح التذكرة بعد التأكيد.' : 'Confirm that the issue is solved. The closure is logged and is final; the ticket cannot be reopened after confirmation.'}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onCancel} className={`rounded-xl px-4 py-2.5 text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ar ? 'إلغاء' : 'Cancel'}</button><button onClick={onConfirm} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950">{ar ? 'تأكيد الإغلاق النهائي' : 'Confirm final closure'}</button></div></div></div>; }

function ConfirmCustomerAction({ action, lang, isDark, customerName, onCancel, onConfirm }: { action: 'mute' | 'unmute'; lang: 'ar' | 'en'; isDark: boolean; customerName: string; onCancel: () => void; onConfirm: () => void }) {
  const ar = lang === 'ar';
  const isMute = action === 'mute';
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm" dir={ar ? 'rtl' : 'ltr'}>
    <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-rose-400/20 bg-[#10111a]' : 'border-slate-900/[0.12] bg-white'}`}>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isMute ? 'bg-rose-400/12 text-rose-300' : 'bg-emerald-400/12 text-emerald-300'}`}>{isMute ? <Ban className="h-6 w-6" /> : <BadgeCheck className="h-6 w-6" />}</div>
      <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{isMute ? (ar ? 'كتم العميل من التذاكر؟' : 'Mute customer from tickets?') : (ar ? 'رفع كتم العميل؟' : 'Remove customer mute?')}</h4>
      <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isMute ? (ar ? `لن يتمكن ${customerName} من فتح أي تذكرة دعم جديدة حتى تقوم الإدارة برفع الكتم.` : `${customerName} will not be able to open new support tickets until staff removes the mute.`) : (ar ? `سيتمكن ${customerName} من فتح تذاكر دعم جديدة مجددًا.` : `${customerName} will be allowed to open new support tickets again.`)}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onCancel} className={`rounded-xl px-4 py-2.5 text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ar ? 'إلغاء' : 'Cancel'}</button><button onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-black ${isMute ? 'bg-rose-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>{isMute ? (ar ? 'تأكيد الكتم' : 'Confirm mute') : (ar ? 'رفع الكتم' : 'Remove mute')}</button></div>
    </div>
  </div>;
}
