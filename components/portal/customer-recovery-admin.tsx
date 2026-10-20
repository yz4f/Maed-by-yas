'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Search, ShieldCheck, UserRoundPlus } from 'lucide-react';

type Result = {
  member: { discordId: string; name: string; image: string | null; verifiedRole: 'Customer' | 'Member' };
  state: 'missing' | 'archived' | 'active';
};

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

  const loadMembers = async (cursor?: string) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/customers/recovery?list=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر تحميل أعضاء البوت.' : 'Could not load bot members.'));
      setMembers((current) => cursor ? [...current, ...data.members] : data.members);
      setNextCursor(data.nextCursor || null);
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
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر فحص الحساب.' : 'Could not check the account.'));
      setResult({ member: data.member, state: data.state });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر فحص الحساب.' : 'Could not check the account.'));
    } finally {
      setBusy(false);
    }
  };

  const recover = async (candidate: Result) => {
    if (candidate.state === 'active') return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/customers/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: candidate.member.discordId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (ar ? 'تعذر الاسترجاع.' : 'Recovery failed.'));
      setResult((current) => current?.member.discordId === candidate.member.discordId ? { ...current, state: 'active' } : current);
      setMembers((current) => current.map((item) => item.member.discordId === candidate.member.discordId ? { ...item, state: 'active' } : item));
      setMessage(data.message || (ar ? 'تم استرجاع العميل.' : 'Customer recovered.'));
      onRecovered();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر الاسترجاع.' : 'Recovery failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-card rounded-[24px] border border-cyan-400/10 p-5 md:p-8 space-y-5" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><UserRoundPlus className="h-5 w-5" /></div>
        <div>
          <h3 className="text-lg font-black">{ar ? 'استرجاع الأعضاء والعملاء الموثقين بالبوت' : 'Recover bot verified members and customers'}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">{ar ? 'استعرض أصحاب رتبة عضو أو عميل في البوت، أو افحص Discord ID مباشرة. يمكنك استعادة الحساب المؤرشف أو إضافة حساب لم يُسجل في الموقع بعد.' : 'Browse members with the bot Member or Customer role, or check a Discord ID directly, then recover a missing or archived account.'}</p>
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
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300"><ShieldCheck className="h-3 w-3" />{ar ? (result.member.verifiedRole === 'Customer' ? 'رتبة عميل' : 'رتبة عضو') : result.member.verifiedRole}</span>
        </div>
        {result.state === 'active'
          ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" />{ar ? 'العميل موجود في الموقع' : 'Already on site'}</span>
          : <button type="button" onClick={() => void recover(result)} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs font-black text-cyan-200 transition-all hover:bg-cyan-400/20 active:translate-y-0.5 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
              {result.state === 'archived' ? (ar ? 'استعادة الحساب المحفوظ' : 'Restore archived account') : (ar ? 'إضافة العميل إلى الموقع' : 'Add customer to site')}
            </button>}
      </div>}
      <div className="border-t border-white/10 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black">{ar ? 'أعضاء وعملاء البوت' : 'Bot members and customers'}</h4>
          <button type="button" onClick={() => void loadMembers()} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/[.06] disabled:opacity-50">{ar ? 'عرض الحسابات الموثقة' : 'Show verified accounts'}</button>
        </div>
        {listStarted && members.length === 0 && <p className="text-xs text-slate-400">{ar ? 'لم تظهر حسابات برتبة عضو أو عميل في هذه الصفحة من الخادم.' : 'No Member or Customer role holders appeared on this server page.'}</p>}
        {members.length > 0 && <div className="grid gap-2 md:grid-cols-2">
          {members.map((candidate) => <div key={candidate.member.discordId} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3">
            <div className="min-w-0"><p className="truncate text-xs font-black">{candidate.member.name}</p><p className="font-mono text-[10px] text-slate-400">{candidate.member.discordId}</p><p className="mt-1 text-[10px] text-slate-500">{candidate.member.verifiedRole === 'Customer' ? (ar ? 'عميل' : 'Customer') : (ar ? 'عضو' : 'Member')} · {candidate.state === 'active' ? (ar ? 'موجود في الموقع' : 'On site') : candidate.state === 'archived' ? (ar ? 'مؤرشف' : 'Archived') : (ar ? 'غير مسجل' : 'Not registered')}</p></div>
            {candidate.state !== 'active' && <button type="button" onClick={() => void recover(candidate)} disabled={busy} className="shrink-0 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[11px] font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:opacity-50">{ar ? 'استرجاع' : 'Recover'}</button>}
          </div>)}
        </div>}
        {nextCursor && <button type="button" onClick={() => void loadMembers(nextCursor)} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/[.06] disabled:opacity-50">{busy ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'عرض المزيد' : 'Load more')}</button>}
      </div>
      <p className="text-[11px] leading-5 text-slate-500">{ar ? 'يُسترجع ملف العميل فقط. المنتجات والمفاتيح لا تُضاف تلقائيًا؛ تبقى التراخيص السابقة المحفوظة كما هي.' : 'Only the customer profile is recovered. Products and keys are never granted automatically; saved licenses remain intact.'}</p>
    </section>
  );
}
