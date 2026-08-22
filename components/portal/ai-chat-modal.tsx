'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';

type ChatRole = 'customer' | 'assistant' | 'system' | 'staff';

type ChatMessage = {
  id: string;
  role: ChatRole;
  body: string;
  createdAt: string;
};

interface AiChatModalProps {
  open: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  isDark: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const copy = {
  ar: {
    badge: 'ذكاء تعن',
    title: 'مساعد تعن الذكي',
    subtitle: 'اسأل عن منتجاتك، الشروحات، التفعيل أو المشكلة الظاهرة لديك.',
    placeholder: 'اكتب مشكلتك أو سؤالك هنا...',
    send: 'إرسال',
    loading: 'يحضّر مساعد تعن رداً واضحاً...',
    start: 'مرحباً، كيف يمكنني مساعدتك اليوم؟',
    error: 'تعذر إرسال الرسالة الآن. حاول مرة أخرى.',
    quick: ['أين أجد شرح منتجي؟', 'قائمة Spoofer لا تظهر', 'كيف أرفع طلب Reset؟'],
    close: 'إغلاق المحادثة',
    handoff: 'تم تحويل هذه الحالة للمراجعة المختصة.',
  },
  en: {
    badge: 'TA3N AI',
    title: 'Ta3n AI assistant',
    subtitle: 'Ask about your products, guides, activation, or the issue you are seeing.',
    placeholder: 'Type your question or issue here...',
    send: 'Send',
    loading: 'Ta3n AI is preparing a clear reply...',
    start: 'Hello — how can I help you today?',
    error: 'Unable to send your message right now. Please try again.',
    quick: ['Where is my product guide?', 'The Spoofer list is not showing', 'How do I request a reset?'],
    close: 'Close chat',
    handoff: 'This case has been sent for specialist review.',
  },
};

export function AiChatModal({ open, onClose, lang, isDark, onNotify }: AiChatModalProps) {
  const t = copy[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const loadConversation = async () => {
      setInitializing(true);
      try {
        const response = await fetch('/api/ai?view=conversation', { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || t.error);
        if (active) setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (error) {
        if (active) onNotify?.(error instanceof Error ? error.message : t.error, 'error');
      } finally {
        if (active) setInitializing(false);
      }
    };
    void loadConversation();
    return () => { active = false; };
  }, [open, t.error, onNotify]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [open, messages, loading]);

  const submit = async (message = input) => {
    const body = message.trim();
    if (body.length < 2 || loading) return;
    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: 'customer', body, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'chat', body, language: lang }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      if (data.message) setMessages((current) => [...current, data.message as ChatMessage]);
      if (data.handoff) onNotify?.(t.handoff, 'info');
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      onNotify?.(error instanceof Error ? error.message : t.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return <AnimatePresence>{open && <motion.div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !loading && onClose()}>
    <motion.section className={`flex h-[min(720px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border shadow-[0_30px_100px_rgba(0,0,0,.52)] ${isDark ? 'border-cyan-300/[.18] bg-[#0a1321] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 12 }} onMouseDown={(event) => event.stopPropagation()}>
      <header className={`relative overflow-hidden border-b px-5 py-4 sm:px-6 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,.16),transparent_36%),radial-gradient(circle_at_95%_95%,rgba(139,92,246,.13),transparent_38%)]" />
        <div className="relative flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950"><img src="/t3nn-ai.png" alt="Ta3n AI" className="h-full w-full object-cover" /></div><div className="min-w-0"><span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black tracking-[.14em] text-cyan-300"><Sparkles className="h-3 w-3" />{t.badge}</span><h2 className="mt-1 text-base font-black sm:text-lg">{t.title}</h2><p className={`mt-0.5 truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p></div></div><button onClick={onClose} disabled={loading} aria-label={t.close} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-slate-400 transition hover:text-white disabled:opacity-50 ${isDark ? 'border-white/[.1] hover:bg-white/[.06]' : 'border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}><X className="h-4 w-4" /></button></div>
      </header>

      <div className={`flex-1 overflow-y-auto px-4 py-5 sm:px-6 ${isDark ? 'bg-[linear-gradient(180deg,rgba(8,17,30,.56),rgba(3,8,16,.22))]' : 'bg-slate-50/60'}`}>
        {initializing ? <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div> : <div className="space-y-3.5">
          {messages.length === 0 && <div className={`mx-auto max-w-md rounded-2xl border p-4 text-center ${isDark ? 'border-cyan-300/[.13] bg-cyan-400/[.045]' : 'border-sky-100 bg-white'}`}><Bot className="mx-auto h-5 w-5 text-cyan-300" /><p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.start}</p><div className="mt-3 flex flex-wrap justify-center gap-2">{t.quick.map((quick) => <button key={quick} onClick={() => void submit(quick)} className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${isDark ? 'border-white/[.1] bg-white/[.035] text-cyan-100 hover:bg-cyan-400/[.12]' : 'border-slate-200 bg-slate-50 text-sky-700 hover:bg-sky-50'}`}>{quick}</button>)}</div></div>}
          {messages.map((message) => {
            const mine = message.role === 'customer';
            const system = message.role === 'system';
            return <div key={message.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-6 shadow-sm ${mine ? 'rounded-tr-md bg-gradient-to-l from-cyan-400 to-sky-500 font-medium text-slate-950' : system ? (isDark ? 'border border-amber-300/[.16] bg-amber-400/[.07] text-amber-100' : 'border border-amber-100 bg-amber-50 text-amber-900') : (isDark ? 'rounded-tl-md border border-white/[.09] bg-white/[.045] text-slate-200' : 'rounded-tl-md border border-slate-100 bg-white text-slate-700')}`}>{!mine && !system && <span className="mb-1 flex items-center gap-1.5 text-[9px] font-black tracking-[.12em] text-cyan-300"><Sparkles className="h-3 w-3" />{t.badge}</span>}<p className="whitespace-pre-wrap">{message.body}</p></div></div>;
          })}
          {loading && <div className="flex justify-end"><div className={`flex items-center gap-2 rounded-2xl rounded-tl-md border px-3 py-2 text-[11px] ${isDark ? 'border-white/[.09] bg-white/[.045] text-slate-300' : 'border-slate-100 bg-white text-slate-500'}`}><Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />{t.loading}</div></div>}
          <div ref={endRef} />
        </div>}
      </div>

      <form className={`border-t p-3 sm:p-4 ${isDark ? 'border-white/[.08] bg-[#0a1321]' : 'border-slate-100 bg-white'}`} onSubmit={(event) => { event.preventDefault(); void submit(); }}><div className={`flex items-end gap-2 rounded-2xl border p-2 ${isDark ? 'border-white/[.1] bg-slate-950/45 focus-within:border-cyan-300/35' : 'border-slate-200 bg-slate-50 focus-within:border-sky-300'}`}><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={1} maxLength={1800} disabled={loading || initializing} placeholder={t.placeholder} className={`min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }} /><button type="submit" disabled={loading || initializing || input.trim().length < 2} className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" aria-label={t.send}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></form>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
