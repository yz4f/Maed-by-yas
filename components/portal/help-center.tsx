'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, BookOpen, CircleHelp, ExternalLink, Headphones, KeyRound, Loader2, RefreshCcw, ShieldCheck, Sparkles, X } from 'lucide-react';

interface HelpCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  isStaff: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenProducts: () => void;
}

const copy = {
  ar: {
    badge: 'مركز المساعدة',
    title: 'كيف يمكننا مساعدتك؟',
    subtitle: 'المعلومات والخطوات المهمة في مكان واحد، بدون تذاكر أو محادثات مزدحمة.',
    products: 'منتجاتي',
    productsText: 'افتح المنتج من مكتبتك لعرض الشرح والفيديو وملف التحميل المرتبط به.',
    productsAction: 'فتح المنتجات',
    reset: 'طلب Reset',
    resetText: 'عند تغيير الجهاز، يمكنك رفع طلب منظم للمراجعة. لا ينفذ أي تغيير تلقائياً.',
    resetAction: 'رفع الطلب',
    discord: 'الدعم الخارجي',
    discordText: 'إذا بقيت المشكلة بعد اتباع الشرح كاملاً، تواصل مع مجتمع ديسكورد.',
    discordAction: 'فتح ديسكورد',
    guidance: 'إرشادات مهمة',
    guideTitle: 'ابدأ بالشرح',
    guideText: 'اتبع شرح المنتج بالترتيب من صفحة منتجاتي قبل طلب المراجعة.',
    keyTitle: 'مفاتيحك محمية',
    keyText: 'لا تعرض المنصة مفتاح التفعيل كاملاً في مركز المساعدة، حفاظاً على حسابك.',
    reviewTitle: 'مراجعة الإدارة',
    reviewText: 'طلبات Reset تراجعها الإدارة أولاً، ثم تنفذ فقط بعد اعتمادها.',
    resetTitle: 'رفع طلب Reset',
    resetIntro: 'اكتب سبب طلبك بوضوح. سيصل للإدارة للمراجعة، ولن يتغير مفتاحك أو جهازك تلقائياً.',
    reason: 'سبب الطلب',
    reasonPlaceholder: 'مثال: قمت بتغيير الجهاز',
    cancel: 'إلغاء',
    submit: 'إرسال للمراجعة',
    submitted: 'تم إرسال طلب Reset إلى الإدارة للمراجعة.',
    duplicate: 'لديك طلب قائم لهذا المنتج قيد المراجعة.',
    error: 'تعذر إرسال الطلب حالياً. حاول مرة أخرى.',
    admin: 'إدارة Reset',
    adminText: 'طلبات Reset منظمة ومخفية عن المحادثات. راجعها من لوحة الإدارة عند الحاجة.',
  },
  en: {
    badge: 'HELP CENTER',
    title: 'How can we help?',
    subtitle: 'Important information and next steps in one place—without crowded tickets or chat threads.',
    products: 'My products',
    productsText: 'Open a product from your library to view its guide, video, and attached download.',
    productsAction: 'Open products',
    reset: 'Reset request',
    resetText: 'After changing devices, send an organized request for review. No change runs automatically.',
    resetAction: 'Send request',
    discord: 'External support',
    discordText: 'If the issue remains after completing the guide, contact the Discord community.',
    discordAction: 'Open Discord',
    guidance: 'Important guidance',
    guideTitle: 'Start with the guide',
    guideText: 'Follow your product guide in order from My Products before requesting a review.',
    keyTitle: 'Your keys stay protected',
    keyText: 'The help center never displays a full activation key, protecting your account.',
    reviewTitle: 'Administration review',
    reviewText: 'Reset requests are reviewed by administration first and run only after approval.',
    resetTitle: 'Send a reset request',
    resetIntro: 'Write your reason clearly. Administration reviews it; your key or device is never changed automatically.',
    reason: 'Reason for request',
    reasonPlaceholder: 'Example: I changed my device',
    cancel: 'Cancel',
    submit: 'Send for review',
    submitted: 'Your reset request was sent to administration for review.',
    duplicate: 'You already have an open request for this product.',
    error: 'The request could not be sent right now. Please try again.',
    admin: 'Reset administration',
    adminText: 'Reset requests stay organized and separate from chat. Review them from Admin when needed.',
  },
};

export function HelpCenter({ lang, isDark, isStaff, onNotify, onOpenProducts }: HelpCenterProps) {
  const t = copy[lang];
  const [showReset, setShowReset] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReset = async () => {
    if (reason.trim().length < 3 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'reset_request', reason, language: lang }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      setShowReset(false);
      setReason('');
      onNotify?.(data.duplicate ? t.duplicate : t.submitted, data.duplicate ? 'info' : 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.error, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const surface = isDark ? 'border-white/[.08] bg-white/[.025] shadow-[0_14px_34px_rgba(0,0,0,.16)]' : 'border-slate-100 bg-white shadow-[0_14px_30px_rgba(22,78,120,.06)]';

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`overflow-hidden rounded-[28px] border ${isDark ? 'border-cyan-300/[.14] bg-[#08121f] text-slate-100' : 'border-sky-100 bg-[#fafdff] text-slate-900'}`}>
    <header className={`relative overflow-hidden border-b px-5 py-8 sm:px-8 ${isDark ? 'border-white/[.08]' : 'border-sky-100'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_93%_80%,rgba(139,92,246,.13),transparent_34%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/25 bg-slate-950 shadow-[0_0_32px_rgba(34,211,238,.18)]"><img src="/t3nn-ai.png" alt="تعن" className="h-full w-full object-cover" /></div>
          <div><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-black tracking-[.16em] text-cyan-300"><ShieldCheck className="h-3 w-3" />{t.badge}</span><h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{t.title}</h2><p className={`mt-1 max-w-2xl text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p></div>
        </div>
        <button onClick={onOpenProducts} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[.98]"><BookOpen className="h-4 w-4" />{t.productsAction}</button>
      </div>
    </header>

    <div className="p-5 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><BookOpen className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.products}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.productsText}</p><button onClick={onOpenProducts} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-cyan-300 transition hover:text-cyan-200"><ArrowUpRight className="h-4 w-4" />{t.productsAction}</button></article>
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.reset}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetText}</p><button onClick={() => setShowReset(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-violet-200 transition hover:text-violet-100"><RefreshCcw className="h-4 w-4" />{t.resetAction}</button></article>
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200"><Headphones className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.discord}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.discordText}</p><a href="https://discord.gg/t3n" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-amber-200 transition hover:text-amber-100"><ExternalLink className="h-4 w-4" />{t.discordAction}</a></article>
      </div>

      <section className={`mt-7 rounded-3xl border p-5 sm:p-6 ${surface}`}><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-cyan-300" /><h3 className="text-base font-black">{t.guidance}</h3></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[[t.guideTitle, t.guideText, BookOpen], [t.keyTitle, t.keyText, KeyRound], [t.reviewTitle, t.reviewText, ShieldCheck]].map(([title, text, Icon]) => { const SafeIcon = Icon as typeof BookOpen; return <article key={title as string} className={`rounded-2xl border p-4 ${isDark ? 'border-white/[.08] bg-slate-950/25' : 'border-slate-100 bg-slate-50'}`}><SafeIcon className="h-4 w-4 text-cyan-300" /><h4 className="mt-3 text-xs font-black">{title as string}</h4><p className={`mt-2 text-[11px] leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text as string}</p></article>; })}</div></section>

      {isStaff && <aside className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-amber-300/15 bg-amber-400/[.05]' : 'border-amber-100 bg-amber-50'}`}><Sparkles className="h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-[11px] font-black text-amber-200">{t.admin}</p><p className={`mt-0.5 text-[10px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.adminText}</p></div></aside>}
    </div>

    <AnimatePresence>{showReset && <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !submitting && setShowReset(false)}><motion.div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${isDark ? 'border-violet-300/[.2] bg-[#101727] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 10 }} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/12 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><button onClick={() => !submitting && setShowReset(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[.06]"><X className="h-4 w-4" /></button></div><h3 className="mt-4 text-lg font-black">{t.resetTitle}</h3><p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetIntro}</p><div className={`mt-4 rounded-xl border p-3 text-[10px] leading-5 ${isDark ? 'border-amber-300/15 bg-amber-400/[.06] text-amber-100' : 'border-amber-100 bg-amber-50 text-amber-800'}`}><AlertTriangle className="me-1 inline h-3.5 w-3.5" />{t.reviewText}</div><label className="mt-5 block text-[11px] font-black">{t.reason}</label><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t.reasonPlaceholder} rows={4} className={`mt-2 w-full resize-none rounded-xl border bg-transparent p-3 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`} /><div className="mt-5 flex gap-2"><button onClick={() => setShowReset(false)} disabled={submitting} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black ${isDark ? 'border-white/[.1] text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t.cancel}</button><button onClick={() => void submitReset()} disabled={submitting || reason.trim().length < 3} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-xs font-black text-white disabled:opacity-45">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}{t.submit}</button></div></motion.div></motion.div>}</AnimatePresence>
  </section>;
}
