'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, Loader2, Search, ShieldCheck, UserRoundPlus, Users, UserX } from 'lucide-react';

type Result = {
  member: { discordId: string; name: string; image: string | null; verifiedRole: 'Customer' | 'Member' };
  state: 'missing' | 'archived' | 'active';
  membership: 'in' | 'out';
  verification: 'live' | 'historical';
  canRejoin: boolean;
  blocked: boolean;
};

async function readApiResponse(response: Response, ar: boolean) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    if (response.status === 401 || response.status === 403 || response.redirected) {
      throw new Error(ar ? 'انتهت جلسة الإدارة. حدّث الصفحة وسجّل الدخول مجددًا.' : 'Admin session expired. Refresh and sign in again.');
    }
    throw new Error(ar ? 'تعذر الاتصال بخدمة الاسترجاع مؤقتًا. أعد المحاولة بعد قليل.' : 'Recovery service is temporarily unavailable. Try again shortly.');
  }
  try { return await response.json(); }
  catch { throw new Error(ar ? 'استجابة الخدمة غير مكتملة. أعد المحاولة.' : 'The service returned an incomplete response. Try again.'); }
}

export function CustomerRecoveryAdmin({ lang, onRecovered }: { lang: 'ar' | 'en'; onRecovered: () => void }) {
  const ar = lang === 'ar';
  const [discordId, setDiscordId] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Result[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listStarted, setListStarted] = useState(false);
  const [listMode, setListMode] = useState<'server' | 'history'>('server');
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'in' | 'out'>('out');

  const loadMembers = async (mode: 'server' | 'history', cursor?: string) => {
    setBusy(true);
    setError('');
    try {
      const query = mode === 'server'
        ? `list=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
        : `list=history${cursor ? `&offset=${encodeURIComponent(cursor)}` : ''}`;
      const response = await fetch(`/api/admin/customers/recovery?${query}`, { cache: 'no-store' });
      const data = await readApiResponse(response, ar);
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر تحميل أعضاء البوت.' : 'Could not load bot members.'));
      setMembers((current) => cursor ? [...current, ...data.members] : data.members);
      setNextCursor(mode === 'server' ? data.nextCursor || null : data.nextOffset === null ? null : String(data.nextOffset));
      setListMode(mode);
      setListStarted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر تحميل أعضاء البوت.' : 'Could not load bot members.'));
    } finally {
      setBusy(false);
    }
  };

  const lookup = async () => {
    setBusy(true);
    setResult(null);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/customers/recovery?discordId=${encodeURIComponent(discordId.trim())}`, { cache: 'no-store' });
      const data = await readApiResponse(response, ar);
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر فحص الحساب.' : 'Could not check the account.'));
      setResult({ member: data.member, state: data.state, membership: data.membership, verification: data.verification, canRejoin: data.canRejoin, blocked: data.blocked });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر فحص الحساب.' : 'Could not check the account.'));
    } finally {
      setBusy(false);
    }
  };

  const recover = async (candidate: Result) => {
    if (candidate.state === 'active' && candidate.membership === 'in') return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/customers/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: candidate.member.discordId }),
      });
      const data = await readApiResponse(response, ar);
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر الاسترجاع.' : 'Recovery failed.'));
      setResult((current) => current?.member.discordId === candidate.member.discordId ? { ...current, state: 'active', membership: 'in', verification: 'live' } : current);
      setMembers((current) => current.map((item) => item.member.discordId === candidate.member.discordId ? { ...item, state: 'active', membership: 'in', verification: 'live' } : item));
      setMessage(data.message || (ar ? 'تم استرجاع العميل.' : 'Customer recovered.'));
      onRecovered();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر الاسترجاع.' : 'Recovery failed.'));
      if (candidate.membership === 'out') void loadMembers(listMode);
    } finally {
      setBusy(false);
    }
  };

  const copyReturnLink = async () => {
    try {
      await navigator.clipboard.writeText('https://t3nn.wtf/rejoin-consent');
      setMessage(ar ? 'تم نسخ رابط الموقع. أرسله للعميل ليسجل الدخول ويوافق على إعادة الانضمام.' : 'Site link copied. Ask the customer to sign in and authorize rejoining.');
    } catch {
      setError(ar ? 'تعذر نسخ الرابط. أرسل للعميل https://t3nn.wtf/rejoin-consent مباشرة.' : 'Could not copy the link. Send https://t3nn.wtf/rejoin-consent to the customer.');
    }
  };

  const action = (candidate: Result) => candidate.blocked
    ? <span className="shrink-0 rounded-lg bg-rose-400/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-300">{ar ? 'محظور إدارياً' : 'Admin blocked'}</span>
    : candidate.membership === 'in' && candidate.verification === 'historical'
      ? <span className="shrink-0 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200">{ar ? 'راجع الرتبة' : 'Review role'}</span>
    : candidate.membership === 'out' && !candidate.canRejoin
    ? <button type="button" onClick={() => void copyReturnLink()} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/20"><Copy className="h-3.5 w-3.5" />{ar ? 'نسخ رابط الموافقة' : 'Copy consent link'}</button>
    : candidate.membership === 'out' || candidate.state !== 'active'
      ? <button type="button" onClick={() => void recover(candidate)} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-black text-cyan-200 transition-all hover:bg-cyan-400/20 active:translate-y-0.5 disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRoundPlus className="h-3.5 w-3.5" />}{candidate.membership === 'out' ? (ar ? 'إعادة للسيرفر' : 'Rejoin server') : candidate.state === 'archived' ? (ar ? 'استعادة الحساب' : 'Restore account') : (ar ? 'إضافة للموقع' : 'Add to site')}</button>
      : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />{ar ? 'موجود' : 'Present'}</span>;

  const status = (candidate: Result) => <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
    <span className={`rounded-full px-2 py-0.5 ${candidate.membership === 'in' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>{candidate.membership === 'in' ? (ar ? 'داخل السيرفر' : 'In server') : (ar ? 'خارج السيرفر' : 'Left server')}</span>
    <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-cyan-200">{candidate.member.verifiedRole === 'Customer' ? (ar ? 'عميل' : 'Customer') : (ar ? 'عضو' : 'Member')}</span>
    <span className="text-slate-400">{candidate.verification === 'historical' ? candidate.membership === 'in' ? (ar ? 'الرتبة السابقة غير موجودة الآن' : 'Previous role missing now') : (ar ? 'رتبة محفوظة بالسجل' : 'Previously recorded role') : (ar ? 'رتبة مؤكدة الآن' : 'Role verified now')}</span>
    {candidate.state === 'archived' && <span className="text-amber-300">{ar ? 'حساب مؤرشف' : 'Archived account'}</span>}
  </div>;

  const visibleMembers = listMode === 'history' ? members.filter((item) => membershipFilter === 'all' || item.membership === membershipFilter) : members;

  return (
    <section className="glass-card rounded-[24px] border border-cyan-400/10 p-5 md:p-8 space-y-5" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><UserRoundPlus className="h-5 w-5" /></div>
        <div>
          <h3 className="text-lg font-black">{ar ? 'استرجاع الأعضاء والعملاء الموثقين بالبوت' : 'Recover bot verified members and customers'}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">{ar ? 'افحص عضوية ديسكورد الفعلية، واعرض من هم داخل السيرفر أو غادروه مع رتبتهم المسجلة. إعادة من غادر تتطلب موافقته على صلاحية البوت عند تسجيل الدخول.' : 'Check live Discord membership and browse people in or out of the server. Rejoining requires their OAuth consent when they sign in.'}</p>
        </div>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void lookup(); }} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="recovery-discord-id" className="sr-only">Discord ID</label>
        <input id="recovery-discord-id" inputMode="numeric" pattern="[0-9]{16,22}" maxLength={22} value={discordId}
          onChange={(event) => { setDiscordId(event.target.value.replace(/\D/g, '')); setResult(null); setError(''); setMessage(''); }}
          placeholder={ar ? 'أدخل Discord ID للعميل' : 'Enter customer Discord ID'}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-cyan-400/50 dark:bg-white/[.04]" />
        <button type="submit" disabled={busy || !/^\d{16,22}$/.test(discordId)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black text-slate-950 transition-all hover:bg-cyan-300 active:translate-y-0.5 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{ar ? 'فحص الحساب' : 'Check account'}
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-300">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-300">{message}</p>}

      {result && <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={result.member.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-11 w-11 rounded-xl object-cover" />
          <div className="min-w-0"><p className="truncate text-sm font-black">{result.member.name}</p><p className="font-mono text-[11px] text-slate-400">{result.member.discordId}</p></div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
        </div>
        {status(result)}
        {action(result)}
      </div>}
      <div className="border-t border-white/10 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black">{ar ? 'حالة أعضاء وعملاء البوت' : 'Bot member status'}</h4>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadMembers('server')} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${listMode === 'server' && listStarted ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 hover:bg-white/[.06]'}`}><Users className="h-3.5 w-3.5" />{ar ? 'داخل السيرفر' : 'In server'}</button>
            <button type="button" onClick={() => { setMembershipFilter('out'); void loadMembers('history'); }} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${listMode === 'history' && listStarted ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-white/10 hover:bg-white/[.06]'}`}><UserX className="h-3.5 w-3.5" />{ar ? 'خارج السيرفر' : 'Left server'}</button>
          </div>
        </div>
        {listMode === 'history' && listStarted && <div className="flex flex-wrap gap-1.5">{(['out', 'in', 'all'] as const).map((filter) => <button key={filter} type="button" onClick={() => setMembershipFilter(filter)} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${membershipFilter === filter ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:bg-white/[.05]'}`}>{filter === 'out' ? (ar ? 'غادروا' : 'Left') : filter === 'in' ? (ar ? 'ما زالوا' : 'Still here') : (ar ? 'الكل' : 'All')}</button>)}</div>}
        {listStarted && visibleMembers.length === 0 && <p className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-xs text-slate-400">{ar ? 'لا توجد حسابات في هذه المجموعة من الصفحات المحمّلة.' : 'No accounts in this group among loaded pages.'}</p>}
        {visibleMembers.length > 0 && <div className="grid gap-2 md:grid-cols-2">
          {visibleMembers.map((candidate) => <div key={candidate.member.discordId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3 transition-colors hover:border-cyan-400/20">
            <div className="flex min-w-0 items-center gap-2.5"><img src={candidate.member.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-9 w-9 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-xs font-black">{candidate.member.name}</p><p className="font-mono text-[10px] text-slate-400">{candidate.member.discordId}</p>{status(candidate)}</div></div>
            {action(candidate)}
          </div>)}
        </div>}
        {nextCursor && <button type="button" onClick={() => void loadMembers(listMode, nextCursor)} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/[.06] disabled:opacity-50">{busy ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'عرض المزيد' : 'Load more')}</button>}
      </div>
      <p className="text-[11px] leading-5 text-slate-500">{ar ? 'لا يمكن إعادة عضو غادر دون موافقته على صلاحية Discord. الاسترجاع لا يمنح مفاتيح أو منتجات جديدة ولا يلغي الحظر الإداري.' : 'A former member must consent to Discord rejoining. Recovery grants no new keys or products and never lifts an administrative ban.'}</p>
    </section>
  );
}
