'use client';

import { BookOpen, ChevronDown, CircleHelp, Download, ImagePlus, KeyRound, MessageCircle, PackageOpen, ShieldCheck, Wrench } from 'lucide-react';

type Language = 'ar' | 'en';

type FaqItem = { question: string; answer: string };

type FaqGroup = { label: string; title: string; icon: 'product' | 'troubleshoot' | 'support' | 'license'; items: FaqItem[] };

interface FaqPageProps {
  lang: Language;
  isDark: boolean;
  onOpenProducts: () => void;
  onOpenAssistant: () => void;
}

const faqGroups: Record<Language, FaqGroup[]> = {
  ar: [
    {
      label: 'منتجاتك',
      title: 'المنتجات والشروحات',
      icon: 'product',
      items: [
        { question: 'أين أجد شرح المنتج؟', answer: 'افتح «منتجاتي»، ثم اختر المنتج المفعّل واضغط «الشروحات والتعليمات». ستجد الفيديو والمكتبة الخاصة بحلول مشاكل المنتج داخل الموقع.' },
        { question: 'كيف أحمّل اللودر؟', answer: 'من بطاقة المنتج المفعّل اضغط «تحميل اللودر». يظهر هذا الخيار فقط للتراخيص النشطة وغير المنتهية.' },
        { question: 'لماذا لا أستطيع فتح الشرح أو التحميل؟', answer: 'تأكد أولاً من أن المنتج ما زال مفعّلاً ولم تنتهِ مدته. المنتجات المنتهية تبقى في السجل لكنها لا تتيح التحميل أو الشروحات.' },
      ],
    },
    {
      label: 'حلول المشاكل',
      title: 'التفعيل والأخطاء',
      icon: 'troubleshoot',
      items: [
        { question: 'ماذا أفعل عند ظهور مشكلة Spoofer أو خطأ آخر؟', answer: 'ادخل إلى «الشروحات والتعليمات» في المنتج ثم افتح «حلول المشاكل» واختر المشكلة المطابقة لما يظهر لديك. اتبع الخطوات كاملة وبالترتيب.' },
        { question: 'هل أستطيع إرسال صورة للمشكلة؟', answer: 'نعم. افتح مساعد تعن، ثم اختر صورة من جهازك أو الصق لقطة الشاشة مباشرة في خانة الكتابة. أرسل صورة واضحة للخطأ مع وصف قصير.' },
        { question: 'لماذا لا يتم تفعيل المفتاح؟', answer: 'تأكد من كتابة المفتاح كاملاً كما تم استلامه، وأنه لم يُستخدم سابقاً. إذا استمرت المشكلة، افتح مساعد تعن وأرسل تفاصيل الرسالة الظاهرة.' },
      ],
    },
    {
      label: 'التراخيص',
      title: 'المفاتيح والرستات',
      icon: 'license',
      items: [
        { question: 'أين أجد مفتاح المنتج الخاص بي؟', answer: 'افتح «منتجاتي» وستجد شريط المفتاح ضمن بطاقة الترخيص المفعّل. استخدم زر النسخ لنسخه بدقة.' },
        { question: 'متى أطلب رستات للمفتاح؟', answer: 'استخدم «طلب رستات المفتاح» من بطاقة المنتج عند الحاجة، ثم اكتب سبباً واضحاً. ستظهر حالة الطلب داخل حسابك حتى تتم مراجعته.' },
        { question: 'كيف أعرف أن الرستات اكتمل؟', answer: 'عند تنفيذ الرستات ستظهر لك رسالة واضحة في صفحة «منتجاتي» تؤكد أن المفتاح أصبح جاهزاً للتسجيل أو التشغيل من جديد.' },
      ],
    },
    {
      label: 'المتابعة',
      title: 'المساعدة والإدارة',
      icon: 'support',
      items: [
        { question: 'كيف أتواصل مع فريق الإدارة؟', answer: 'افتح مساعد تعن واكتب موضوع المشكلة وتفاصيلها بوضوح، ثم انتظر الرد. إذا كان فريق الدعم متاحاً فسيتم الرد عليك داخل المحادثة نفسها.' },
        { question: 'هل تظهر رتبة المنتج في ديسكورد بعد التفعيل؟', answer: 'عند تفعيل مفتاح منتج صالح من حسابك المرتبط بديسكورد، تُمنح رتبة Customer ورتبة المنتج المناسبة تلقائياً.' },
        { question: 'ماذا أكتب للحصول على مساعدة أسرع؟', answer: 'اذكر اسم المنتج، وصف الخطأ، والخطوات التي جرّبتها. أرفق لقطة شاشة عندما يكون ذلك ممكناً لتسهيل فهم الحالة.' },
      ],
    },
  ],
  en: [
    {
      label: 'YOUR PRODUCTS',
      title: 'Products & guides',
      icon: 'product',
      items: [
        { question: 'Where can I find my product guide?', answer: 'Open “My Products”, choose your active product, then select “Guide”. The video and troubleshooting library are available inside the site.' },
        { question: 'How do I download the loader?', answer: 'Use “Download Loader” on an active product card. This option is available only for active, non-expired licenses.' },
        { question: 'Why cannot I open the guide or download?', answer: 'First confirm that the product is still active and has not expired. Expired products remain in your record, but downloads and guides are unavailable.' },
      ],
    },
    {
      label: 'TROUBLESHOOTING',
      title: 'Activation & issues',
      icon: 'troubleshoot',
      items: [
        { question: 'What should I do if Spoofer or another issue appears?', answer: 'Open “Guide” for the product, then choose “Issue fixes” and select the entry matching your issue. Follow the full sequence in order.' },
        { question: 'Can I send an image of the issue?', answer: 'Yes. Open Ta3n Assistant, then choose an image from your device or paste a screenshot directly into the message field. Add a short description too.' },
        { question: 'Why is my key not activating?', answer: 'Confirm that you entered the complete key exactly as received and that it has not been used before. If the issue continues, open Ta3n Assistant and send the displayed error.' },
      ],
    },
    {
      label: 'LICENSES',
      title: 'Keys & resets',
      icon: 'license',
      items: [
        { question: 'Where can I find my product key?', answer: 'Open “My Products” to find the key bar on your active license card. Use the copy button to copy it accurately.' },
        { question: 'When should I request a key reset?', answer: 'Use “Request key reset” on the product card when needed, then write a clear reason. The request status remains visible in your account while it is reviewed.' },
        { question: 'How do I know the reset is complete?', answer: 'When the reset is completed, a clear message appears on “My Products” confirming that your key is ready to register or start again.' },
      ],
    },
    {
      label: 'FOLLOW-UP',
      title: 'Assistant & administration',
      icon: 'support',
      items: [
        { question: 'How do I contact administration?', answer: 'Open Ta3n Assistant and clearly describe the issue, then wait for a reply. If the support team is available, it will reply in the same conversation.' },
        { question: 'Do Discord product roles appear after activation?', answer: 'When you activate a valid product key from a Discord-linked account, the Customer role and the relevant product role are granted automatically.' },
        { question: 'What should I write for faster help?', answer: 'Include the product name, what happened, and steps you already tried. Attach a clear screenshot whenever possible.' },
      ],
    },
  ],
};

const iconFor = (icon: FaqGroup['icon']) => icon === 'product' ? PackageOpen : icon === 'troubleshoot' ? Wrench : icon === 'license' ? KeyRound : MessageCircle;

export function FaqPage({ lang, isDark, onOpenProducts, onOpenAssistant }: FaqPageProps) {
  const groups = faqGroups[lang];
  const copy = lang === 'ar' ? {
    eyebrow: 'دليل الاستخدام',
    title: 'الأسئلة الشائعة',
    subtitle: 'إجابات واضحة وسريعة لأكثر الأسئلة المتعلقة بمنتجاتك المفعلة، التفعيل، الشروحات وحلول المشاكل.',
    products: 'فتح منتجاتي',
    assistant: 'فتح مساعد تعن',
    note: 'لم تجد إجابتك؟ اكتب للمساعد وأرفق صورة واضحة للخطأ إن وجدت.',
  } : {
    eyebrow: 'PRODUCT GUIDE',
    title: 'Frequently asked questions',
    subtitle: 'Clear, fast answers for your active products, activation, guides, and troubleshooting.',
    products: 'Open My Products',
    assistant: 'Open Ta3n Assistant',
    note: 'Did not find your answer? Message the assistant and attach a clear screenshot if available.',
  };

  return <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-6xl space-y-6 pb-8">
    <section className={`relative isolate overflow-hidden rounded-[28px] border px-5 py-7 sm:px-7 sm:py-8 ${isDark ? 'border-cyan-300/[.16] bg-[#0b1626] text-slate-100' : 'border-sky-100 bg-white text-slate-900 shadow-[0_16px_44px_rgba(22,78,120,.08)]'}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_95%_0%,rgba(34,211,238,.18),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(59,130,246,.10),transparent_36%)]" />
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/[.08] px-3 py-1.5 text-[9px] font-black tracking-[.16em] text-cyan-300"><CircleHelp className="h-3.5 w-3.5" />{copy.eyebrow}</div><h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h2><p className={`mt-2 max-w-xl text-xs leading-6 sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{copy.subtitle}</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={onOpenProducts} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px] font-black transition hover:-translate-y-px active:scale-[.97] ${isDark ? 'border-white/[.12] bg-white/[.05] text-slate-100 hover:bg-white/[.09]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><BookOpen className="h-3.5 w-3.5 text-cyan-300" />{copy.products}</button><button onClick={onOpenAssistant} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2.5 text-[11px] font-black text-slate-950 shadow-[0_10px_22px_rgba(34,211,238,.18)] transition hover:brightness-110 active:scale-[.97]"><MessageCircle className="h-3.5 w-3.5" />{copy.assistant}</button></div>
      </div>
    </section>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((group) => {
        const Icon = iconFor(group.icon);
        return <section key={group.title} className={`rounded-[24px] border p-4 sm:p-5 ${isDark ? 'border-white/[.08] bg-[#0b1422]' : 'border-slate-200 bg-white shadow-[0_12px_28px_rgba(22,78,120,.05)]'}`}>
          <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-2xl border ${isDark ? 'border-cyan-300/15 bg-cyan-400/[.08] text-cyan-300' : 'border-sky-100 bg-sky-50 text-sky-700'}`}><Icon className="h-4.5 w-4.5" /></span><div><p className={`text-[9px] font-black tracking-[.14em] ${isDark ? 'text-cyan-200/70' : 'text-sky-700/70'}`}>{group.label}</p><h3 className={`mt-0.5 text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.title}</h3></div></div>
          <div className="mt-4 space-y-2.5">{group.items.map((item) => <details key={item.question} className={`group rounded-2xl border px-3.5 py-3 transition-[background-color,border-color,transform] duration-200 ease-out hover:-translate-y-px ${isDark ? 'border-white/[.08] bg-white/[.025] open:border-cyan-300/[.24] open:bg-cyan-400/[.055]' : 'border-slate-100 bg-slate-50 open:border-sky-200 open:bg-sky-50/60'}`}><summary className={`flex cursor-pointer list-none items-start justify-between gap-3 text-[11px] font-black leading-5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}><span>{item.question}</span><ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300 transition-transform duration-200 ease-out group-open:rotate-180" /></summary><p className={`mt-3 border-t pt-3 text-[11px] leading-6 ${isDark ? 'border-white/[.07] text-slate-400' : 'border-slate-200 text-slate-600'}`}>{item.answer}</p></details>)}</div>
        </section>;
      })}
    </div>

    <section className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/[.08] bg-white/[.025]' : 'border-slate-200 bg-slate-50'}`}><p className={`flex items-start gap-2 text-[11px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}><ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{copy.note}</p><div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" />{lang === 'ar' ? 'مخصص للعملاء ذوي المنتجات المفعلة' : 'Available for customers with active products'}</div></section>
  </div>;
}
