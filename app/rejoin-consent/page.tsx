'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function RejoinConsentPage() {
  const [busy, setBusy] = useState(false);
  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#071723] px-4 py-12 text-white">
    <div className="w-full max-w-lg rounded-[28px] border border-cyan-400/20 bg-[#0d2432] p-6 shadow-2xl shadow-black/30 sm:p-9">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><ShieldCheck className="h-7 w-7" /></div>
      <h1 className="text-2xl font-black">تفعيل استرجاع عضوية السيرفر</h1>
      <p className="mt-3 text-sm leading-7 text-slate-300">وافق من حساب ديسكورد الخاص بك على صلاحية إعادة الانضمام. يستطيع فريق الإدارة بعدها إعادتك إلى سيرفر تعن إذا غادرته، مع مراجعة رتبتك السابقة.</p>
      <p className="mt-3 rounded-xl border border-white/10 bg-white/[.04] p-3 text-xs leading-6 text-slate-400">الموافقة لا تمنح منتجات أو مفاتيح جديدة، ولا تلغي أي حظر إداري. يمكنك إلغاء التفويض من إعدادات تطبيقات ديسكورد المعتمدة.</p>
      <button type="button" disabled={busy} onClick={() => { setBusy(true); void signIn('discord', { callbackUrl: '/' }, { prompt: 'consent' }); }} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-black text-slate-950 transition-all hover:bg-cyan-300 active:translate-y-0.5 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}الموافقة عبر ديسكورد</button>
      <Link href="/" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-cyan-200"><ArrowRight className="h-3.5 w-3.5" />العودة إلى الموقع</Link>
    </div>
  </main>;
}
