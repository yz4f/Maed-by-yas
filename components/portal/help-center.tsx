'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, ShieldCheck } from 'lucide-react';
import { AiChatModal } from './ai-chat-modal';

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
    label: 'مركز المساعدة',
    title: 'مساعد تعن',
    subtitle: 'للسؤال عن المنتجات، التفعيل، التحميل، الشروحات أو أي مشكلة ظاهرة لديك.',
    action: 'فتح المحادثة',
    note: 'اكتب موضوع المشكلة بوضوح وانتظر الرد. إذا كان فريق الدعم متاحاً فسيتم الرد داخل المحادثة.',
  },
  en: {
    label: 'HELP CENTER',
    title: 'Ta3n Assistant',
    subtitle: 'Ask about your products, activation, downloads, guides, or an issue you are seeing.',
    action: 'Open chat',
    note: 'Describe the issue clearly and wait for a reply. The support team will respond in the chat when available.',
  },
};

export function HelpCenter({ lang, isDark, onNotify, onOpenGuide }: HelpCenterProps) {
  const [showChat, setShowChat] = useState(false);
  const t = copy[lang];
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`overflow-hidden rounded-[30px] border ${isDark ? 'border-cyan-300/[.16] bg-[#08121f] text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,.22)]' : 'border-sky-100 bg-white text-slate-900 shadow-[0_18px_48px_rgba(22,78,120,.08)]'}`}>
    <div className="relative isolate overflow-hidden px-5 py-12 text-center sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.16),transparent_42%),radial-gradient(circle_at_12%_100%,rgba(139,92,246,.11),transparent_32%)]" />
      <motion.div initial={{ opacity: 0, scale: .96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .26, ease: [0.23, 1, 0.32, 1] }}>
        <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[28px] border border-cyan-300/25 bg-slate-950 shadow-[0_0_44px_rgba(34,211,238,.16)]"><img src="/t3nn-ai.png" alt={t.title} className="h-full w-full object-cover" /></div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[9px] font-black tracking-[.16em] text-cyan-300"><ShieldCheck className="h-3 w-3" />{t.label}</span>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{t.title}</h2>
        <p className={`mx-auto mt-3 max-w-xl text-xs leading-6 sm:text-sm ${muted}`}>{t.subtitle}</p>
        <button onClick={() => setShowChat(true)} className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3.5 text-xs font-black text-slate-950 shadow-[0_14px_30px_rgba(34,211,238,.2)] transition hover:brightness-110 active:scale-[.97]"><MessageCircle className="h-4 w-4" />{t.action}</button>
        <p className={`mt-4 inline-flex items-center gap-1.5 text-[10px] ${muted}`}><Bot className="h-3.5 w-3.5 text-cyan-300" />{t.note}</p>
      </motion.div>
    </div>
    <AiChatModal open={showChat} onClose={() => setShowChat(false)} lang={lang} isDark={isDark} onNotify={onNotify} onOpenGuide={(destination) => { setShowChat(false); onOpenGuide?.(destination); }} />
  </section>;
}
