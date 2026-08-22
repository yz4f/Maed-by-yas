'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock3, Loader2, MessageCircle, RefreshCw, Send, UserRound, UsersRound } from 'lucide-react';

type Language = 'ar' | 'en';
type ConversationStatus = 'AI_ACTIVE' | 'WAITING_FOR_SUPPORT' | 'HUMAN_ACTIVE' | 'CLOSED';
type MessageRole = 'customer' | 'assistant' | 'staff' | 'system';

type Conversation = {
  id: string;
  customerName: string;
  customerImage?: string | null;
  status: ConversationStatus;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  humanAgentId?: string | null;
  humanAgentName?: string | null;
};

type Message = {
  id: string;
  role: MessageRole;
  body: string;
  createdAt: string;
  attachments?: { id: string; name: string; previewData?: string | null }[];
};

interface AiAdminConversationsProps {
  lang: Language;
  isDark: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const copy = {
  ar: {
    title: 'محادثات مساعد تعن',
    subtitle: 'اطّلع على رسائل العملاء، استلم المحادثة عند الحاجة، ثم أعدها لمساعد تعن بعد انتهاء المتابعة.',
    refresh: 'تحديث',
    empty: 'لا توجد محادثات للعملاء حتى الآن.',
    select: 'اختر محادثة لعرض الرسائل.',
    take: 'استلام المحادثة',
    returnAi: 'إنهاء المتابعة وإعادة الذكاء',
    reply: 'اكتب رد الإدارة للعميل...',
    send: 'إرسال الرد',
    sending: 'جارٍ الإرسال...',
    ai: 'مساعد تعن',
    waiting: 'بانتظار الإدارة',
    human: 'متابعة الإدارة',
    closed: 'مغلقة',
    customer: 'العميل',
    team: 'فريق الإدارة',
    system: 'حالة المحادثة',
    takenBy: (name: string) => `يتابعها الآن ${name}`,
    loading: 'جارٍ تحميل المحادثة...',
    updated: 'تم تحديث القائمة',
    takeSuccess: 'تم استلام المحادثة. أصبح بإمكانك الرد على العميل الآن.',
    returnSuccess: 'تم تحويل الرد على مساعد ذكاء تعن.',
    replySuccess: 'تم إرسال الرد للعميل.',
    unavailable: 'لا يمكن الرد قبل استلام المحادثة من الإدارة.',
  },
  en: {
    title: 'Ta3n Assistant Conversations',
    subtitle: 'Review customer conversations, take over when needed, then return the conversation to Ta3n Assistant after follow-up.',
    refresh: 'Refresh',
    empty: 'There are no customer conversations yet.',
    select: 'Choose a conversation to view messages.',
    take: 'Take conversation',
    returnAi: 'End follow-up & return to AI',
    reply: 'Write an administration reply...',
    send: 'Send reply',
    sending: 'Sending...',
    ai: 'Ta3n Assistant',
    waiting: 'Waiting for staff',
    human: 'Administration active',
    closed: 'Closed',
    customer: 'Customer',
    team: 'Administration',
    system: 'Conversation status',
    takenBy: (name: string) => `Currently handled by ${name}`,
    loading: 'Loading conversation...',
    updated: 'List updated',
    takeSuccess: 'Conversation taken. You can reply to the customer now.',
    returnSuccess: 'Replies are now handled by Ta3n Assistant.',
    replySuccess: 'Reply sent to the customer.',
    unavailable: 'Take the conversation before replying.',
  },
};

function formatDate(value: string, lang: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }).format(date);
}

export function AiAdminConversations({ lang, isDark, onNotify }: AiAdminConversationsProps) {
  const t = copy[lang];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [working, setWorking] = useState(false);
  const [draft, setDraft] = useState('');
  const notifyRef = useRef(onNotify);
  const selectedIdRef = useRef<string | null>(null);
  const threadAbortRef = useRef<AbortController | null>(null);
  const threadRequestRef = useRef(0);

  useEffect(() => { notifyRef.current = onNotify; }, [onNotify]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const activeStatus = useMemo(() => ({
    AI_ACTIVE: { label: t.ai, className: isDark ? 'border-cyan-300/15 bg-cyan-400/[.08] text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-700' },
    WAITING_FOR_SUPPORT: { label: t.waiting, className: isDark ? 'border-amber-300/15 bg-amber-400/[.08] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700' },
    HUMAN_ACTIVE: { label: t.human, className: isDark ? 'border-violet-300/15 bg-violet-400/[.08] text-violet-100' : 'border-violet-200 bg-violet-50 text-violet-700' },
    CLOSED: { label: t.closed, className: isDark ? 'border-slate-300/15 bg-slate-400/[.08] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600' },
  }), [isDark, t]);

  const loadList = useCallback(async (options: { showSpinner?: boolean; notify?: boolean } = {}) => {
    if (options.showSpinner) setLoadingList(true);
    try {
      const response = await fetch('/api/ai?view=admin_conversations', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load conversations.');
      const next = Array.isArray(data.conversations) ? data.conversations as Conversation[] : [];
      setConversations((current) => {
        const currentSignature = current.map((item) => `${item.id}:${item.updatedAt}:${item.status}:${item.messageCount}`).join('|');
        const nextSignature = next.map((item) => `${item.id}:${item.updatedAt}:${item.status}:${item.messageCount}`).join('|');
        return currentSignature === nextSignature ? current : next;
      });
      setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id || null);
      if (options.notify) notifyRef.current?.(t.updated, 'success');
    } catch (error) {
      if (options.notify) notifyRef.current?.(error instanceof Error ? error.message : 'Unable to load conversations.', 'error');
    } finally {
      if (options.showSpinner) setLoadingList(false);
    }
  }, [t.updated]);

  const loadThread = useCallback(async (conversationId: string, options: { showSpinner?: boolean; notify?: boolean } = {}) => {
    const requestId = ++threadRequestRef.current;
    threadAbortRef.current?.abort();
    const controller = new AbortController();
    threadAbortRef.current = controller;
    if (options.showSpinner) setLoadingThread(true);
    try {
      const response = await fetch(`/api/ai?view=admin_conversation&conversationId=${encodeURIComponent(conversationId)}`, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load conversation.');
      if (requestId !== threadRequestRef.current || selectedIdRef.current !== conversationId) return;
      const nextMessages = Array.isArray(data.messages) ? data.messages as Message[] : [];
      setSelected(data.conversation as Conversation);
      setMessages((current) => {
        const currentSignature = current.map((item) => `${item.id}:${item.body}:${item.createdAt}`).join('|');
        const nextSignature = nextMessages.map((item) => `${item.id}:${item.body}:${item.createdAt}`).join('|');
        return currentSignature === nextSignature ? current : nextMessages;
      });
    } catch (error) {
      if (options.notify && !(error instanceof DOMException && error.name === 'AbortError')) notifyRef.current?.(error instanceof Error ? error.message : 'Unable to load conversation.', 'error');
    } finally {
      if (requestId === threadRequestRef.current && options.showSpinner) setLoadingThread(false);
    }
  }, []);

  useEffect(() => { void loadList({ showSpinner: true }); }, [loadList]);
  useEffect(() => {
    if (selectedId) { setSelected(null); setMessages([]); void loadThread(selectedId, { showSpinner: true }); }
    else { setSelected(null); setMessages([]); }
  }, [selectedId, loadThread]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void loadList();
      if (selectedId) void loadThread(selectedId);
    };
    const interval = window.setInterval(refresh, 15_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, [loadList, loadThread, selectedId]);
  useEffect(() => () => threadAbortRef.current?.abort(), []);

  const changeMode = async (mode: 'human' | 'ai') => {
    if (!selected || working) return;
    setWorking(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'conversation_mode', conversationId: selected.id, mode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update conversation.');
      setSelected(data.conversation as Conversation);
      setMessages(Array.isArray(data.messages) ? data.messages as Message[] : []);
      void loadList();
      onNotify?.(mode === 'human' ? t.takeSuccess : t.returnSuccess, 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'Unable to update conversation.', 'error');
    } finally { setWorking(false); }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !draft.trim() || working) return;
    if (selected.status !== 'HUMAN_ACTIVE') { onNotify?.(t.unavailable, 'warning'); return; }
    setWorking(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'staff_reply', conversationId: selected.id, body: draft.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send reply.');
      setMessages((current) => [...current, data.message as Message]);
      setDraft('');
      void loadList();
      onNotify?.(t.replySuccess, 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'Unable to send reply.', 'error');
    } finally { setWorking(false); }
  };

  return <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
    <aside className={`overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.08] bg-[#0c1422]' : 'border-slate-200 bg-white'}`}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-4 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
        <div className="flex min-w-0 items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><UsersRound className="h-4 w-4" /></span><div><h3 className="text-sm font-black">{t.title}</h3><p className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{conversations.length}</p></div></div>
        <button onClick={() => void loadList({ showSpinner: true, notify: true })} disabled={loadingList} className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isDark ? 'border-white/[.1] text-slate-300 hover:bg-white/[.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} title={t.refresh}>{loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</button>
      </div>
      <div className="max-h-[620px] overflow-y-auto p-2">
        {loadingList && conversations.length === 0 ? <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-300" /></div> : conversations.length === 0 ? <p className={`p-5 text-center text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.empty}</p> : conversations.map((conversation) => {
          const status = activeStatus[conversation.status];
          return <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`mb-1.5 w-full rounded-2xl border p-3 text-start transition ${selectedId === conversation.id ? (isDark ? 'border-cyan-300/25 bg-cyan-400/[.08]' : 'border-cyan-200 bg-cyan-50') : (isDark ? 'border-transparent hover:bg-white/[.04]' : 'border-transparent hover:bg-slate-50')}`}>
            <div className="flex items-center gap-2.5"><img src={conversation.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-9 w-9 rounded-xl object-cover" onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{conversation.customerName}</p><p className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(conversation.lastMessageAt, lang)}</p></div></div>
            <div className="mt-2 flex items-center justify-between gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${status.className}`}>{status.label}</span><span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{conversation.messageCount || 0}</span></div>
          </button>;
        })}
      </div>
    </aside>

    <section className={`flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.08] bg-[#0a1321] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
      {!selected ? <div className={`m-auto px-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><MessageCircle className="mx-auto mb-3 h-7 w-7 text-cyan-300" />{t.select}</div> : <>
        <header className={`flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
          <div className="flex min-w-0 items-center gap-3"><img src={selected.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-10 w-10 rounded-2xl object-cover" onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} /><div className="min-w-0"><h3 className="truncate text-sm font-black">{selected.customerName}</h3><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${activeStatus[selected.status].className}`}>{activeStatus[selected.status].label}</span>{selected.status === 'HUMAN_ACTIVE' && selected.humanAgentName && <span className={`text-[10px] ${isDark ? 'text-violet-200' : 'text-violet-700'}`}>{t.takenBy(selected.humanAgentName)}</span>}</div></div></div>
          <button onClick={() => void changeMode(selected.status === 'HUMAN_ACTIVE' ? 'ai' : 'human')} disabled={working} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition disabled:opacity-50 ${selected.status === 'HUMAN_ACTIVE' ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:brightness-110'}`}>{working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : selected.status === 'HUMAN_ACTIVE' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}{selected.status === 'HUMAN_ACTIVE' ? t.returnAi : t.take}</button>
        </header>

        <div className={`flex-1 overflow-y-auto px-4 py-5 ${isDark ? 'bg-[linear-gradient(180deg,rgba(8,17,30,.56),rgba(3,8,16,.22))]' : 'bg-slate-50/60'}`}>
          {loadingThread && messages.length === 0 ? <div className={`grid h-full place-items-center gap-2 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><span>{t.loading}</span></div> : <div className="space-y-3">{messages.map((message) => {
            const customer = message.role === 'customer';
            const system = message.role === 'system';
            const staff = message.role === 'staff';
            const label = customer ? t.customer : staff ? t.team : system ? t.system : t.ai;
            return <div key={message.id} className={`flex ${customer ? 'justify-start' : 'justify-end'}`}><article className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-xs leading-6 ${customer ? 'rounded-tr-md bg-cyan-400 text-slate-950' : system ? (isDark ? 'border border-amber-300/[.16] bg-amber-400/[.07] text-amber-100' : 'border border-amber-100 bg-amber-50 text-amber-900') : staff ? (isDark ? 'rounded-tl-md border border-violet-300/[.18] bg-violet-400/[.08] text-violet-100' : 'rounded-tl-md border border-violet-200 bg-violet-50 text-violet-800') : (isDark ? 'rounded-tl-md border border-white/[.09] bg-white/[.045] text-slate-200' : 'rounded-tl-md border border-slate-100 bg-white text-slate-700')}`}><span className={`mb-1 block text-[9px] font-black tracking-[.1em] ${customer ? 'text-slate-800/65' : staff ? 'text-violet-300' : system ? 'text-amber-300' : 'text-cyan-300'}`}>{label}</span>{message.attachments?.map((attachment) => attachment.previewData ? <a key={attachment.id} href={attachment.previewData} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl border border-black/10"><img src={attachment.previewData} alt={attachment.name} className="max-h-64 w-full object-contain" /></a> : null)}<p className="whitespace-pre-wrap">{message.body}</p><time className="mt-1 block text-[9px] opacity-60">{formatDate(message.createdAt, lang)}</time></article></div>;
          })}</div>}
        </div>

        <form onSubmit={sendReply} className={`border-t p-3 ${isDark ? 'border-white/[.08] bg-[#0a1321]' : 'border-slate-100 bg-white'}`}><div className={`flex items-end gap-2 rounded-2xl border p-2 ${isDark ? 'border-white/[.1] bg-slate-950/45 focus-within:border-violet-300/35' : 'border-slate-200 bg-slate-50'}`}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={working || selected.status !== 'HUMAN_ACTIVE'} rows={2} maxLength={1800} placeholder={t.reply} className={`min-h-[46px] flex-1 resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={working || selected.status !== 'HUMAN_ACTIVE' || draft.trim().length < 2} className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40" title={t.send}>{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></form>
      </>}
    </section>
  </div>;
}
