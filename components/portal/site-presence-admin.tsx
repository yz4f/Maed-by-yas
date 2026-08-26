'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleDot, Clock3, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import type { SitePresence } from '@/types';

interface SitePresenceAdminProps {
  lang: 'ar' | 'en';
  isDark: boolean;
}

export function SitePresenceAdmin({ lang, isDark }: SitePresenceAdminProps) {
  const [active, setActive] = useState<SitePresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const requestInFlightRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch('/api/presence', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load active users.');
      setActive(data.active || []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load active users.');
    } finally {
      requestInFlightRef.current = false;
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    void load();
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [load]);

  const timeFormatter = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const dateFormatter = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const onlineLabel = lang === 'ar' ? 'متصل الآن' : 'Online now';

  return (
    <section className="space-y-5 animate-slide-up" aria-label={lang === 'ar' ? 'الحسابات النشطة' : 'Active accounts'}>
      <div className={`overflow-hidden rounded-[24px] border ${isDark ? 'border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.10] via-[#101419] to-[#0b0d11]' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50'} p-6 md:p-8`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${isDark ? 'border-emerald-300/25 bg-emerald-300/[0.12] text-emerald-200' : 'border-emerald-200 bg-emerald-100 text-emerald-700'}`}>
              <Users size={22} />
            </div>
            <div>
              <div className={`mb-1 flex items-center gap-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <span>{lang === 'ar' ? 'الحسابات النشطة الآن' : 'Active accounts now'}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${isDark ? 'bg-emerald-300/[0.13] text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}><CircleDot size={12} className="animate-pulse" />{active.length} {onlineLabel}</span>
              </div>
              <p className={`max-w-2xl text-xs leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {lang === 'ar' ? 'تظهر هنا الحسابات التي أرسلت نبض حضور خلال آخر دقيقتين. لا يتم عرض البريد أو عنوان الشبكة أو محتوى المحادثات.' : 'Only accounts with a heartbeat in the last two minutes appear here. Email, network address, and chat content are never shown.'}
              </p>
            </div>
          </div>
          <button onClick={() => void load()} disabled={isLoading} className={`inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border px-4 text-xs font-black transition active:scale-95 disabled:opacity-55 md:self-center ${isDark ? 'border-white/[0.1] bg-white/[0.05] text-slate-100 hover:bg-white/[0.10]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />{lang === 'ar' ? 'تحديث الحالة' : 'Refresh status'}</button>
        </div>
      </div>

      {error ? (
        <div className={`rounded-2xl border px-4 py-3 text-xs font-bold ${isDark ? 'border-rose-300/25 bg-rose-300/[0.09] text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>
      ) : null}

      <div className={`overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[0.08] bg-[#101216]' : 'border-slate-200 bg-white'}`}>
        {isLoading && active.length === 0 ? (
          <div className={`flex min-h-44 items-center justify-center gap-3 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><RefreshCw className="animate-spin" size={18} />{lang === 'ar' ? 'جارٍ تحميل الحضور…' : 'Loading presence…'}</div>
        ) : active.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
            <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`}><Users size={20} /></div>
            <p className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{lang === 'ar' ? 'لا توجد حسابات نشطة حالياً' : 'No active accounts right now'}</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'سيظهر الحساب هنا فور تسجيل الدخول وإرسال نبض الحضور.' : 'Accounts appear here immediately after sign-in and their first heartbeat.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
            {active.map((presence) => (
              <article key={presence.userId} className={`flex flex-col gap-4 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0"><img src={presence.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className={`h-10 w-10 rounded-full border object-cover ${isDark ? 'border-white/[0.13]' : 'border-slate-200'}`} /><span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#101216] bg-emerald-400" /></div>
                  <div className="min-w-0"><p className={`truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{presence.name}</p><p className={`mt-0.5 truncate text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Discord ID: {presence.discordId}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${isDark ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><ShieldCheck size={12} />{presence.role}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${isDark ? 'border-white/[0.08] bg-white/[0.04] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><Clock3 size={12} />{lang === 'ar' ? 'آخر نشاط' : 'Last seen'}: {timeFormatter.format(new Date(presence.lastSeenAt))}</span>
                  <span className={`hidden text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} md:inline`}>{dateFormatter.format(new Date(presence.loginAt))}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
