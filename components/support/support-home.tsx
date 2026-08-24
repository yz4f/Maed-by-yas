'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Clock3, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

type Conversation = {
  supportSessionId?: string | null;
  status?: string;
  updatedAt?: string;
  messageCount?: number;
};

const statusCopy: Record<string, string> = {
  AI_ACTIVE: 'المساعدة الذكية متاحة',
  WAITING_FOR_SUPPORT: 'بانتظار المراجعة',
  WAITING_FOR_CUSTOMER: 'بانتظار ردك',
  HUMAN_ACTIVE: 'فريق الدعم يتابع',
  CLOSED: 'جلسة مغلقة ومحفوظة',
};

export function SupportHome() {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ai?view=conversation', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل جلسة الدعم.');
        if (active) setConversation(data.conversation || null);
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل جلسة الدعم.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const openSession = () => {
    if (!conversation?.supportSessionId) return;
    router.push(`/support/session/${encodeURIComponent(conversation.supportSessionId)}`);
  };

  return <main dir="rtl" className="min-h-screen bg-[#07111d] px-4 py-6 text-slate-100 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-4"><button onClick={() => router.push('/')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[.09] bg-white/[.035] px-3 text-xs font-black text-slate-300 transition hover:bg-white/[.08] hover:text-white"><ArrowLeft className="h-4 w-4" />الرئيسية</button><div className="text-left"><p className="text-[10px] font-black tracking-[.18em] text-cyan-300">TA3N SUPPORT</p><h1 className="mt-1 text-lg font-black tracking-tight sm:text-xl">مركز المساعدة</h1></div></header>
      <section className="relative mt-7 overflow-hidden rounded-[30px] border border-cyan-200/[.14] bg-[linear-gradient(135deg,rgba(8,47,73,.72),rgba(7,17,29,.94)_64%)] p-6 shadow-[0_26px_65px_rgba(0,0,0,.28)] sm:p-9"><div className="pointer-events-none absolute -left-20 -top-28 h-64 w-64 rounded-full bg-cyan-300/[.10] blur-3xl" /><div className="relative max-w-2xl"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/[.16] bg-cyan-300/[.09] text-cyan-100"><Bot className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">المساعدة الذكية</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">ابدأ من جلسة دعم مستقلة ومخصصة بالكامل لمشكلتك. تبقى المحادثة والرسائل والصور محفوظة ضمن حسابك حتى بعد الإغلاق.</p><button disabled={loading || !conversation?.supportSessionId} onClick={openSession} className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-cyan-300 px-5 text-xs font-black text-slate-950 shadow-[0_14px_30px_rgba(34,211,238,.16)] transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"><MessageSquare className="h-4 w-4" />{loading ? 'جارٍ تجهيز جلستك...' : 'بدء المحادثة'}</button>{error && <p className="mt-3 text-xs font-bold text-rose-200">{error}</p>}</div></section>
      <section className="mt-5 grid gap-4 md:grid-cols-[1fr_260px]"><div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-5"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-cyan-200" /><h3 className="text-sm font-black">جلساتك</h3></div>{conversation?.supportSessionId ? <button onClick={openSession} className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-black/[.15] p-4 text-right transition hover:border-cyan-200/[.25] hover:bg-white/[.04]"><div><p className="text-xs font-black text-white">جلسة المساعدة</p><p className="mt-1 font-mono text-[10px] text-slate-500">{conversation.supportSessionId}</p><p className="mt-2 text-[10px] font-bold text-cyan-100">{statusCopy[conversation.status || ''] || 'جلسة محفوظة'}</p></div><ArrowLeft className="h-4 w-4 text-cyan-200" /></button> : <p className="mt-4 text-xs text-slate-500">{loading ? 'جارٍ تحميل جلساتك...' : 'لا توجد جلسة جاهزة حالياً.'}</p>}</div><aside className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-5"><div className="flex items-center gap-2 text-cyan-100"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-black">خصوصية الجلسة</p></div><p className="mt-3 text-[11px] leading-6 text-slate-400">لا تُشارك أي مفتاح أو كلمة مرور. مشاركة الشاشة اختيارية ولا تبدأ إلا بعد موافقتك الواضحة.</p><div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500"><Clock3 className="h-3.5 w-3.5" />السجل محفوظ داخل حسابك</div><div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500"><Sparkles className="h-3.5 w-3.5" />حلول مبنية على قاعدة المعرفة</div></aside></section>
    </div>
  </main>;
}
