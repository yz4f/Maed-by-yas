'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, BookOpen, CheckCircle2, CircleHelp, ExternalLink, Headphones, KeyRound, Loader2, MonitorPlay, RefreshCcw, ShieldCheck, Sparkles, X } from 'lucide-react';

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

const spooferGuideCopy = {
  ar: {
    eyebrow: 'حلول المنتجات',
    title: 'مشكلة عدم ظهور قائمة Spoofer',
    description: 'إذا ظهر أن واجهة WebUI تعمل لكن قائمة Spoofer لا تظهر، اتبع الخطوات المختصرة التالية من نفس الجهاز.',
    action: 'عرض الحل بالفيديو',
    modalTitle: 'حل مشكلة قائمة Spoofer',
    modalText: 'الفيديو والصورة يوضحان علامة التشغيل الصحيحة قبل فتح القائمة.',
    steps: [
      ['تأكد من تشغيل اللودر', 'اترك نافذة اللودر مفتوحة حتى تظهر رسالة WebUI running بدون أي خطأ.'],
      ['افتح الواجهة من نفس الجهاز', 'افتح المتصفح على نفس الجهاز ثم استخدم العنوان المحلي الظاهر في اللودر: 127.0.0.1:8080.'],
      ['انتظر ظهور القائمة', 'امنح الواجهة عدة ثوانٍ للتحميل. لا تشغّل أكثر من نسخة من اللودر في الوقت نفسه.'],
      ['أعد التشغيل عند الحاجة', 'إذا لم تظهر القائمة، أغلق اللودر وافتحه من جديد مرة واحدة، ثم أعد الخطوات بالترتيب.'],
    ],
    footer: 'إذا استمرت المشكلة بعد تنفيذ الخطوات، افتح منتجاتي وتأكد من أن الترخيص نشط، ثم تواصل مع الدعم الخارجي.',
    openProducts: 'فتح منتجاتي',
  },
  en: {
    eyebrow: 'PRODUCT SOLUTIONS',
    title: 'Spoofer list is not appearing',
    description: 'If WebUI is running but the Spoofer list does not appear, follow these short steps on the same device.',
    action: 'Watch the video guide',
    modalTitle: 'Fix the Spoofer list issue',
    modalText: 'The image and video show the correct running status before opening the list.',
    steps: [
      ['Confirm the loader is running', 'Keep the loader window open until the WebUI running message appears with no error.'],
      ['Open the UI on the same device', 'Use a browser on the same device and enter the local address shown by the loader: 127.0.0.1:8080.'],
      ['Allow the list to load', 'Give the interface a few seconds. Do not run more than one loader instance at the same time.'],
      ['Restart once if needed', 'If the list is still missing, close the loader, open it once more, and repeat the steps in order.'],
    ],
    footer: 'If the issue remains, open My Products to confirm the license is active, then contact external support.',
    openProducts: 'Open My Products',
  },
};

export function HelpCenter({ lang, isDark, isStaff, onNotify, onOpenProducts }: HelpCenterProps) {
  const t = copy[lang];
  const guide = spooferGuideCopy[lang];
  const [showReset, setShowReset] = useState(false);
  const [showSpooferGuide, setShowSpooferGuide] = useState(false);
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
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`overflow-hidden rounded-[28px] border ${isDark ? 'border-cyan-300/[.14] bg-[#08121f] text-slate-100' : 'border-sky-100 bg-[#fafdff] text-slate-900'}`}>
    <header className={`relative overflow-hidden border-b px-5 py-8 sm:px-8 ${isDark ? 'border-white/[.08]' : 'border-sky-100'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_93%_80%,rgba(139,92,246,.13),transparent_34%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/25 bg-slate-950 shadow-[0_0_32px_rgba(34,211,238,.18)]"><img src="/t3nn-ai.png" alt="تعن" className="h-full w-full object-cover" /></div>
          <div><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-black tracking-[.16em] text-cyan-300"><ShieldCheck className="h-3 w-3" />{t.badge}</span><h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{t.title}</h2><p className={`mt-1 max-w-2xl text-xs leading-6 ${mutedText}`}>{t.subtitle}</p></div>
        </div>
        <button onClick={onOpenProducts} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[.98]"><BookOpen className="h-4 w-4" />{t.productsAction}</button>
      </div>
    </header>

    <div className="p-5 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><BookOpen className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.products}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${mutedText}`}>{t.productsText}</p><button onClick={onOpenProducts} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-cyan-300 transition hover:text-cyan-200"><ArrowUpRight className="h-4 w-4" />{t.productsAction}</button></article>
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.reset}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${mutedText}`}>{t.resetText}</p><button onClick={() => setShowReset(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-violet-200 transition hover:text-violet-100"><RefreshCcw className="h-4 w-4" />{t.resetAction}</button></article>
        <article className={`rounded-3xl border p-5 ${surface}`}><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200"><Headphones className="h-5 w-5" /></span><h3 className="mt-5 text-base font-black">{t.discord}</h3><p className={`mt-2 min-h-[48px] text-xs leading-6 ${mutedText}`}>{t.discordText}</p><a href="https://discord.gg/t3n" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-amber-200 transition hover:text-amber-100"><ExternalLink className="h-4 w-4" />{t.discordAction}</a></article>
      </div>

      <section className={`mt-7 overflow-hidden rounded-3xl border ${surface}`}>
        <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
          <button onClick={() => setShowSpooferGuide(true)} className="group relative min-h-[220px] overflow-hidden text-start" aria-label={guide.action}>
            <img src="/spoofer-list-fix.png" alt={guide.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b12] via-[#060b12]/35 to-transparent" />
            <span className="absolute inset-x-5 bottom-5 inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-200/25 bg-slate-950/70 px-3 py-2 text-[11px] font-black text-cyan-100 backdrop-blur-md"><MonitorPlay className="h-4 w-4 text-cyan-300" />{guide.action}</span>
          </button>
          <div className="p-5 sm:p-6">
            <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/[.08] px-2.5 py-1 text-[9px] font-black tracking-[.13em] text-cyan-300">{guide.eyebrow}</span>
            <h3 className="mt-3 text-lg font-black tracking-tight">{guide.title}</h3>
            <p className={`mt-2 text-xs leading-6 ${mutedText}`}>{guide.description}</p>
            <button onClick={() => setShowSpooferGuide(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/[.08] px-3.5 py-2.5 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/[.14]"><MonitorPlay className="h-4 w-4" />{guide.action}</button>
          </div>
        </div>
      </section>

      <section className={`mt-7 rounded-3xl border p-5 sm:p-6 ${surface}`}><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-cyan-300" /><h3 className="text-base font-black">{t.guidance}</h3></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[[t.guideTitle, t.guideText, BookOpen], [t.keyTitle, t.keyText, KeyRound], [t.reviewTitle, t.reviewText, ShieldCheck]].map(([title, text, Icon]) => { const SafeIcon = Icon as typeof BookOpen; return <article key={title as string} className={`rounded-2xl border p-4 ${isDark ? 'border-white/[.08] bg-slate-950/25' : 'border-slate-100 bg-slate-50'}`}><SafeIcon className="h-4 w-4 text-cyan-300" /><h4 className="mt-3 text-xs font-black">{title as string}</h4><p className={`mt-2 text-[11px] leading-6 ${mutedText}`}>{text as string}</p></article>; })}</div></section>

      {isStaff && <aside className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-amber-300/15 bg-amber-400/[.05]' : 'border-amber-100 bg-amber-50'}`}><Sparkles className="h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-[11px] font-black text-amber-200">{t.admin}</p><p className={`mt-0.5 text-[10px] leading-5 ${mutedText}`}>{t.adminText}</p></div></aside>}
    </div>

    <AnimatePresence>
      {showSpooferGuide && <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setShowSpooferGuide(false)}>
        <motion.div className={`max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border shadow-2xl ${isDark ? 'border-cyan-300/[.17] bg-[#0b1320] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 10 }} onMouseDown={(event) => event.stopPropagation()}>
          <div className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-4 backdrop-blur-xl sm:px-6 ${isDark ? 'border-white/[.08] bg-[#0b1320]/92' : 'border-slate-100 bg-white/92'}`}><div><span className="text-[9px] font-black tracking-[.14em] text-cyan-300">{guide.eyebrow}</span><h3 className="mt-1 text-lg font-black">{guide.modalTitle}</h3><p className={`mt-1 text-[11px] ${mutedText}`}>{guide.modalText}</p></div><button onClick={() => setShowSpooferGuide(false)} className={`rounded-xl border p-2 text-slate-400 transition hover:text-white ${isDark ? 'border-white/[.1] hover:bg-white/[.06]' : 'border-slate-200 hover:bg-slate-50'}`} aria-label={t.cancel}><X className="h-4 w-4" /></button></div>
          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,.85fr)] sm:p-6"><div><div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-black shadow-[0_16px_42px_rgba(0,0,0,.28)]"><video controls preload="metadata" playsInline poster="/spoofer-list-fix.png" className="aspect-video w-full bg-black" src="/spoofer-list-fix.mp4">Your browser does not support this video.</video></div><div className={`mt-4 flex gap-3 rounded-2xl border p-3.5 text-[11px] leading-6 ${isDark ? 'border-amber-300/15 bg-amber-400/[.06] text-amber-100' : 'border-amber-100 bg-amber-50 text-amber-900'}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>{guide.footer}</p></div></div><ol className="space-y-3">{guide.steps.map(([stepTitle, text], index) => <li key={stepTitle} className={`flex gap-3 rounded-2xl border p-4 ${isDark ? 'border-white/[.08] bg-white/[.025]' : 'border-slate-100 bg-slate-50'}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-[11px] font-black text-cyan-300">{index + 1}</span><div><h4 className="text-xs font-black">{stepTitle}</h4><p className={`mt-1.5 text-[11px] leading-6 ${mutedText}`}>{text}</p></div></li>)}</ol></div>
          <div className={`flex justify-end border-t px-5 py-4 sm:px-6 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}><button onClick={() => { setShowSpooferGuide(false); onOpenProducts(); }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:brightness-110"><BookOpen className="h-4 w-4" />{guide.openProducts}</button></div>
        </motion.div>
      </motion.div>}
      {showReset && <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !submitting && setShowReset(false)}><motion.div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${isDark ? 'border-violet-300/[.2] bg-[#101727] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 10 }} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/12 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><button onClick={() => !submitting && setShowReset(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[.06]"><X className="h-4 w-4" /></button></div><h3 className="mt-4 text-lg font-black">{t.resetTitle}</h3><p className={`mt-2 text-xs leading-6 ${mutedText}`}>{t.resetIntro}</p><div className={`mt-4 rounded-xl border p-3 text-[10px] leading-5 ${isDark ? 'border-amber-300/15 bg-amber-400/[.06] text-amber-100' : 'border-amber-100 bg-amber-50 text-amber-800'}`}><AlertTriangle className="me-1 inline h-3.5 w-3.5" />{t.reviewText}</div><label className="mt-5 block text-[11px] font-black">{t.reason}</label><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t.reasonPlaceholder} rows={4} className={`mt-2 w-full resize-none rounded-xl border bg-transparent p-3 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`} /><div className="mt-5 flex gap-2"><button onClick={() => setShowReset(false)} disabled={submitting} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black ${isDark ? 'border-white/[.1] text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t.cancel}</button><button onClick={() => void submitReset()} disabled={submitting || reason.trim().length < 3} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-xs font-black text-white disabled:opacity-45">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}{t.submit}</button></div></motion.div></motion.div>}
    </AnimatePresence>
  </section>;
}
