'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import type { AuditEvent, SystemLog, User } from '@/types';

const PAGE_SIZE = 20;
type Outcome = 'all' | 'success' | 'failure' | 'unknown';

export function AdminAuditLogs({ logs, customers, lang }: { logs: SystemLog[]; customers: User[]; lang: string }) {
  const ar = lang === 'ar';
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [userId, setUserId] = useState('all');
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SystemLog | null>(null);
  const [event, setEvent] = useState<AuditEvent | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim().toLocaleLowerCase()); setPage(0); }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (keyEvent: KeyboardEvent) => { if (keyEvent.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const customerById = useMemo(() => new Map(customers.flatMap((customer) => [
    [customer.id, customer], [customer.discordId, customer],
  ] as [string, User][])), [customers]);
  const actions = useMemo(() => [...new Set(logs.map((log) => log.action))].sort(), [logs]);
  const users = useMemo(() => [...new Map(logs.map((log) => {
    const id = log.userId || log.discordId || log.userName || '';
    const customer = customerById.get(id);
    return [id, customer?.name || log.userName || id] as const;
  }).filter(([id]) => id))], [logs, customerById]);
  const filtered = useMemo(() => logs.filter((log) => {
    const customer = customerById.get(log.userId || '') || customerById.get(log.discordId || '');
    const timestamp = Date.parse(log.createdAt);
    const matchesSearch = !search || [log.action, log.details, log.userName, log.userId, log.discordId, customer?.name, customer?.discordId, log.ipAddress]
      .some((value) => String(value || '').toLocaleLowerCase().includes(search));
    return matchesSearch
      && (action === 'all' || log.action === action)
      && (userId === 'all' || [log.userId, log.discordId, log.userName].includes(userId))
      && (outcome === 'all' || (log.status || 'unknown') === outcome)
      && (!fromDate || (Number.isFinite(timestamp) && timestamp >= new Date(`${fromDate}T00:00:00`).getTime()))
      && (!toDate || (Number.isFinite(timestamp) && timestamp <= new Date(`${toDate}T23:59:59.999`).getTime()));
  }), [logs, customerById, search, action, userId, outcome, fromDate, toDate]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const inputClass = 'min-h-10 min-w-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-inherit outline-none focus:border-cyan-400';

  async function showDetails(log: SystemLog) {
    setSelected(log);
    setEvent(null);
    setDetailsError(false);
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/logs/${encodeURIComponent(log.id)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load details');
      setSelected(data.log);
      setEvent(data.auditEvent || null);
    } catch {
      setDetailsError(true);
    } finally {
      setLoadingDetails(false);
    }
  }

  return <section dir={ar ? 'rtl' : 'ltr'} className="rounded-2xl border p-5 md:p-6" style={{ borderColor: 'var(--luxe-line)', background: 'var(--luxe-panel)', color: 'var(--luxe-ink)' }}>
    <div className="mb-5 flex items-center gap-2"><FileText className="h-5 w-5" style={{ color: 'var(--luxe-accent)' }} /><h2 className="text-lg font-semibold">{ar ? 'سجلات النظام' : 'System logs'}</h2><span className="ms-auto text-xs" style={{ color: 'var(--luxe-muted)' }}>{filtered.length}</span></div>
    <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
      <label className="relative sm:col-span-2"><span className="sr-only">{ar ? 'ابحث في السجلات' : 'Search logs'}</span><Search className="pointer-events-none absolute top-3 start-3 h-4 w-4" style={{ color: 'var(--luxe-muted)' }} /><input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={ar ? 'بحث في الحدث أو المستخدم أو التفاصيل' : 'Search action, user or details'} className={`${inputClass} w-full ps-9`} /></label>
      <label className="sr-only" htmlFor="log-action-filter">{ar ? 'تصفية الحدث' : 'Filter action'}</label><select id="log-action-filter" value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} className={inputClass}><option value="all">{ar ? 'كل الأحداث' : 'All actions'}</option>{actions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <label className="sr-only" htmlFor="log-user-filter">{ar ? 'تصفية المستخدم' : 'Filter user'}</label><select id="log-user-filter" value={userId} onChange={(e) => { setUserId(e.target.value); setPage(0); }} className={inputClass}><option value="all">{ar ? 'كل المستخدمين' : 'All users'}</option>{users.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <label className="sr-only" htmlFor="log-status-filter">{ar ? 'تصفية الحالة' : 'Filter status'}</label><select id="log-status-filter" value={outcome} onChange={(e) => { setOutcome(e.target.value as Outcome); setPage(0); }} className={inputClass}><option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option><option value="success">{ar ? 'نجاح' : 'Success'}</option><option value="failure">{ar ? 'فشل' : 'Failure'}</option><option value="unknown">{ar ? 'غير محدد (قديم)' : 'Unspecified (legacy)'}</option></select>
      <div className="flex gap-2 sm:col-span-2 xl:col-span-2"><label className="min-w-0 flex-1"><span className="sr-only">{ar ? 'من تاريخ' : 'From date'}</span><input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} className={`${inputClass} w-full`} /></label><label className="min-w-0 flex-1"><span className="sr-only">{ar ? 'إلى تاريخ' : 'To date'}</span><input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => { setToDate(e.target.value); setPage(0); }} className={`${inputClass} w-full`} /></label></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-start text-xs"><thead><tr className="border-b text-start" style={{ borderColor: 'var(--luxe-line)', color: 'var(--luxe-muted)' }}><th className="py-3 text-start font-medium">{ar ? 'الحدث' : 'Action'}</th><th className="py-3 text-start font-medium">{ar ? 'التفاصيل' : 'Details'}</th><th className="py-3 text-start font-medium">{ar ? 'المستخدم' : 'User'}</th><th className="py-3 text-start font-medium">{ar ? 'الحالة' : 'Status'}</th><th className="py-3 text-start font-medium">{ar ? 'الوقت' : 'Time'}</th><th className="py-3 text-end font-medium">{ar ? 'عرض' : 'View'}</th></tr></thead><tbody>{visible.map((log) => <tr key={log.id} className="border-b" style={{ borderColor: 'var(--luxe-line)' }}><td className="py-3 font-medium">{log.action}</td><td className="max-w-[260px] truncate py-3" title={log.details}>{log.details}</td><td className="py-3">{customerById.get(log.userId || '')?.name || log.userName || '—'}</td><td className="py-3">{log.status === 'success' ? (ar ? 'نجاح' : 'Success') : log.status === 'failure' ? (ar ? 'فشل' : 'Failure') : (ar ? 'غير محدد' : 'Unspecified')}</td><td className="py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')}</td><td className="py-3 text-end"><button type="button" onClick={() => void showDetails(log)} className="rounded-md px-2 py-1 font-medium" style={{ color: 'var(--luxe-accent)' }}>{ar ? 'التفاصيل' : 'Details'}</button></td></tr>)}</tbody></table>{!visible.length && <p className="py-10 text-center text-sm" style={{ color: 'var(--luxe-muted)' }}>{ar ? 'لا توجد سجلات مطابقة.' : 'No matching logs.'}</p>}</div>
    <div className="mt-4 flex items-center justify-between text-xs" style={{ color: 'var(--luxe-muted)' }}><span>{ar ? 'الصفحة' : 'Page'} {currentPage + 1} / {pageCount}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40" style={{ borderColor: 'var(--luxe-line)' }}>{ar ? 'السابق' : 'Previous'}</button><button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40" style={{ borderColor: 'var(--luxe-line)' }}>{ar ? 'التالي' : 'Next'}</button></div></div>
    {selected && <div className="fixed inset-0 z-[100] flex justify-end bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><aside role="dialog" aria-modal="true" aria-label={ar ? 'تفاصيل السجل' : 'Log details'} className="h-full w-full max-w-md overflow-y-auto border-s p-6 shadow-xl" style={{ borderColor: 'var(--luxe-line)', background: 'var(--luxe-panel)', color: 'var(--luxe-ink)' }}><div className="mb-6 flex items-center justify-between"><h3 className="text-lg font-semibold">{ar ? 'تفاصيل السجل' : 'Log details'}</h3><button type="button" onClick={() => setSelected(null)} aria-label={ar ? 'إغلاق' : 'Close'} className="rounded-lg p-2"><X className="h-5 w-5" /></button></div>{loadingDetails && <p className="mb-3 text-xs" style={{ color: 'var(--luxe-muted)' }}>{ar ? 'جارٍ تحميل التفاصيل...' : 'Loading details...'}</p>}{detailsError && <p role="alert" className="mb-3 text-xs text-amber-500">{ar ? 'تعذر تحميل سجل التدقيق التفصيلي؛ تظهر البيانات المتاحة.' : 'Detailed audit record could not be loaded; showing available data.'}</p>}<dl className="space-y-4 text-sm">{[[ar ? 'الحدث' : 'Action', selected.action], [ar ? 'التفاصيل' : 'Details', selected.details], [ar ? 'المستخدم' : 'User', selected.userName || selected.userId || '—'], ['Discord ID', selected.discordId || event?.actorDiscordId || '—'], [ar ? 'عنوان IP' : 'IP address', selected.ipAddress || '—'], [ar ? 'الوقت' : 'Time', new Date(selected.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')], [ar ? 'الحالة' : 'Status', selected.status || (ar ? 'غير محدد' : 'Unspecified')]].map(([label, value]) => <div key={label} className="border-b pb-3" style={{ borderColor: 'var(--luxe-line)' }}><dt className="mb-1 text-xs" style={{ color: 'var(--luxe-muted)' }}>{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>{event && <div className="mt-6 space-y-3 text-xs"><h4 className="font-semibold">{ar ? 'بيانات التدقيق' : 'Audit data'}</h4><p>{event.eventType}</p>{Object.entries(event.metadata || {}).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b py-2" style={{ borderColor: 'var(--luxe-line)' }}><span style={{ color: 'var(--luxe-muted)' }}>{key}</span><span className="max-w-[60%] break-all text-end">{typeof value === 'string' ? value : JSON.stringify(value)}</span></div>)}</div>}</aside></div>}
  </section>;
}
