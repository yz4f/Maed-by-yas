'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpLeft, Bot, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface HelpCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  isStaff: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenProducts: () => void;
  onOpenGuide?: (destination: 'guide' | 'issues') => void;
}

const copy = {
  ar: {
    eyebrow: 'مركز المساعدة',
    title: 'دعم واضح، داخل مكان واحد.',
    titleAccent: 'داخل مكان واحد.',
    subtitle: 'اكتب تفاصيل المشكلة بوضوح، وسيتولى مساعد تعن توجيهك إلى الشرح المناسب أو متابعة الحالة مع فريق الدعم عند الحاجة.',
    action: 'فتح المحادثة',
    supportTitle: 'مساعد تعن',
    supportDescription: 'منظم، سريع، ومصمم لفهم سياق منتجاتك.',
    note: 'اكتب موضوع المشكلة وانتظر الرد داخل المحادثة. يتدخل فريق الدعم فقط عند الحاجة.',
    pointOne: 'توجيه مباشر للشروحات',
    pointTwo: 'متابعة مشاكل الحساب والطلبات',
    pointThree: 'إرسال صورة لشرح المشكلة',
    online: 'جاهز لمساعدتك',
  },
  en: {
    eyebrow: 'HELP CENTER',
    title: 'Clear support, all in one place.',
    titleAccent: 'all in one place.',
    subtitle: 'Describe the issue clearly. Ta3n Assistant will direct you to the right guide or route the case to support when needed.',
    action: 'Open chat',
    supportTitle: 'Ta3n Assistant',
    supportDescription: 'Organized, fast, and aware of your product context.',
    note: 'Describe the issue and wait for the reply in this chat. Support joins only when needed.',
    pointOne: 'Direct guidance to product guides',
    pointTwo: 'Account and order follow-up',
    pointThree: 'Attach an image to explain the issue',
    online: 'Ready to assist',
  },
};

export function HelpCenter({ lang, isDark, onNotify, onOpenGuide }: HelpCenterProps) {
  const router = useRouter();
  const t = copy[lang];
  const surface = isDark
    ? 'border-cyan-200/[.14] bg-[#071426] text-slate-100 shadow-[0_28px_84px_rgba(0,0,0,.28)]'
    : 'border-slate-200/90 bg-white text-slate-950 shadow-[0_24px_60px_rgba(15,74,110,.10)]';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const softSurface = isDark ? 'border-white/[.08] bg-white/[.035]' : 'border-slate-200/80 bg-slate-50/80';

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`relative isolate overflow-hidden rounded-[28px] border ${surface}`}>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_87%_88%,rgba(99,102,241,.14),transparent_31%),linear-gradient(115deg,rgba(7,20,38,.08),transparent_55%)]" />
    <div className="pointer-events-none absolute -top-24 start-[43%] -z-10 h-52 w-52 rounded-full bg-cyan-300/[.08] blur-3xl" />

    <div className="grid min-h-[430px] lg:grid-cols-[minmax(0,1.14fr)_minmax(300px,.86fr)]">
      <motion.div className="flex flex-col justify-between px-5 py-7 sm:px-9 sm:py-10 lg:px-12 lg:py-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28, ease: [0.23, 1, 0.32, 1] }}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`grid h-8 w-8 place-items-center rounded-xl border ${isDark ? 'border-cyan-200/[.18] bg-cyan-300/[.08] text-cyan-200' : 'border-sky-100 bg-sky-50 text-sky-700'}`}><ShieldCheck className="h-4 w-4" /></span>
            <span className={`text-[10px] font-black tracking-[.16em] ${isDark ? 'text-cyan-200' : 'text-sky-700'}`}>{t.eyebrow}</span>
          </div>
          <h2 className="mt-7 max-w-2xl text-[clamp(1.85rem,4vw,3.15rem)] font-black leading-[1.16] tracking-[-.045em]">
            {t.title.replace(t.titleAccent, '')}<span className={isDark ? 'text-cyan-200' : 'text-sky-700'}>{t.titleAccent}</span>
          </h2>
          <p className={`mt-5 max-w-xl text-sm leading-7 sm:text-[15px] ${muted}`}>{t.subtitle}</p>
        </div>

        <div className="mt-9 flex flex-col items-stretch gap-4 sm:items-start">
          <button onClick={() => router.push('/support')} className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-cyan-300 via-sky-400 to-sky-500 px-5 text-xs font-black text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,.24)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[.98] sm:min-w-[172px]">
            <MessageCircle className="h-4 w-4" />{t.action}<ArrowUpLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
          <p className={`flex max-w-xl items-start gap-2 text-[11px] leading-5 ${muted}`}><Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />{t.note}</p>
        </div>
      </motion.div>

      <motion.aside className={`m-4 flex flex-col justify-between rounded-[24px] border p-5 sm:m-6 sm:p-6 lg:my-7 lg:me-7 lg:ms-0 ${softSurface}`} initial={{ opacity: 0, scale: .975, x: lang === 'ar' ? -10 : 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .3, delay: .06, ease: [0.23, 1, 0.32, 1] }}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[19px] border shadow-[0_10px_28px_rgba(0,0,0,.22)] ${isDark ? 'border-cyan-200/[.24] bg-[#04101f]' : 'border-sky-100 bg-slate-950'}`}>
                <img src="/t3nn-ai.png" alt={t.supportTitle} className="block h-full w-full scale-[1.2] object-cover" />
              </div>
              <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight">{t.supportTitle}</p><p className={`mt-1 text-[11px] leading-5 ${muted}`}>{t.supportDescription}</p></div>
            </div>
            <span className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-black ${isDark ? 'border-emerald-300/[.18] bg-emerald-400/[.08] text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.9)]" />{t.online}</span>
          </div>

          <div className={`my-6 h-px ${isDark ? 'bg-white/[.08]' : 'bg-slate-200/80'}`} />
          <div className="space-y-3">
            {[t.pointOne, t.pointTwo, t.pointThree].map((point, index) => <div key={point} className="flex items-center gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-black ${isDark ? 'bg-cyan-300/[.08] text-cyan-200' : 'bg-sky-50 text-sky-700'}`}>{String(index + 1).padStart(2, '0')}</span><span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{point}</span></div>)}
          </div>
        </div>

        <div className={`mt-8 flex items-center gap-2 rounded-2xl border px-3 py-2.5 ${isDark ? 'border-cyan-200/[.1] bg-cyan-300/[.045] text-cyan-100' : 'border-sky-100 bg-sky-50/75 text-sky-800'}`}><Sparkles className="h-3.5 w-3.5 shrink-0" /><p className="text-[10px] font-bold leading-5">{lang === 'ar' ? 'ابدأ بكتابة المشكلة كما تظهر لك للحصول على توجيه أدق.' : 'Start by describing the issue exactly as it appears for clearer guidance.'}</p></div>
      </motion.aside>
    </div>
  </section>;
}
