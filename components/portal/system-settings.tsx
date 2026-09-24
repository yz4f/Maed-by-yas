'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Settings2 } from 'lucide-react';

type SettingsStatus = {
  environment: string;
  checks: { nextAuthUrl: boolean; nextAuthSecret: boolean; discordOAuth: boolean; discordBot: boolean };
};

export function SystemSettings({ lang }: { lang: 'ar' | 'en' }) {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const ar = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load settings.');
      setStatus({ environment: data.environment, checks: data.checks });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر تحميل حالة الإعدادات.' : 'Could not load settings status.'));
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const checks = status ? [
    { key: 'nextAuthUrl', label: ar ? 'عنوان الموقع في NextAuth' : 'NextAuth site URL', description: ar ? 'يُستخدم لتثبيت روابط العودة بعد تسجيل الدخول.' : 'Used to build authentication callback URLs.' },
    { key: 'nextAuthSecret', label: ar ? 'سر جلسات NextAuth' : 'NextAuth session secret', description: ar ? 'مطلوب لتوقيع جلسات الدخول والتحقق منها.' : 'Required to sign and validate sessions.' },
    { key: 'discordOAuth', label: ar ? 'تسجيل دخول Discord' : 'Discord sign-in', description: ar ? 'يتطلب معرف تطبيق OAuth والسر الخاص به.' : 'Requires a Discord OAuth application ID and secret.' },
    { key: 'discordBot', label: ar ? 'تكامل بوت Discord' : 'Discord bot integration', description: ar ? 'يُستخدم لمزامنة الرتب وإرسال سجلات Discord.' : 'Used for role synchronization and Discord logs.' },
  ] as const : [];

  return (
    <section className="space-y-5 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 sm:p-6" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Settings2 size={19} />{ar ? 'إعدادات النظام' : 'System settings'}</h2>
          <p className="mt-1 text-xs opacity-60">{ar ? 'حالة تهيئة خدمات تسجيل الدخول والتكاملات. لا تُعرض قيم الأسرار.' : 'Configuration status for sign-in and integrations. Secret values are never displayed.'}</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{ar ? 'تحديث الحالة' : 'Refresh status'}
        </button>
      </div>
      {loading && <p className="py-5 text-center text-sm opacity-60">{ar ? 'جارٍ فحص الإعدادات…' : 'Checking configuration…'}</p>}
      {!loading && error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] p-4 text-sm text-rose-300">{error}</p>}
      {!loading && status && <>
        <p className="text-xs opacity-60">{ar ? 'البيئة:' : 'Environment:'} <span className="font-mono">{status.environment}</span></p>
        <ul className="divide-y divide-white/[.07] rounded-xl border border-white/[.07] px-4">
          {checks.map((check) => {
            const ready = status.checks[check.key];
            return <li key={check.key} className="flex items-start justify-between gap-4 py-4">
              <div><h3 className="text-sm font-medium">{check.label}</h3><p className="mt-1 text-xs opacity-60">{check.description}</p></div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${ready ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>
                {ready ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{ready ? (ar ? 'مهيأ' : 'Configured') : (ar ? 'غير مهيأ' : 'Missing')}
              </span>
            </li>;
          })}
        </ul>
        <p className="text-xs leading-6 opacity-60">{ar ? 'تُضبط هذه القيم في بيئة النشر. لا يمكن تعديل الأسرار من لوحة الموقع.' : 'These values are managed in the deployment environment and cannot be changed from the portal.'}</p>
      </>}
    </section>
  );
}
