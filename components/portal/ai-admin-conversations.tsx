'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createImageAttachment, type ChatAttachment } from './ai-chat-modal';
import { Bot, CheckCircle2, Clock3, ImagePlus, Loader2, MessageCircle, RefreshCw, Send, Trash2, UserRound, UsersRound, XCircle } from 'lucide-react';

type Language = 'ar' | 'en';
type ConversationStatus = 'AI_ACTIVE' | 'WAITING_FOR_SUPPORT' | 'WAITING_FOR_CUSTOMER' | 'HUMAN_ACTIVE' | 'CLOSED';
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
    waitingCustomer: 'بانتظار رد العميل',
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
    unavailable: 'استلم المحادثة أولاً قبل إرسال رد من الإدارة.',
    close: 'إنهاء المحادثة',
    closeConfirm: 'تأكيد الإنهاء',
    closeCancel: 'إلغاء',
    closeSuccess: 'تم حذف المحادثة نهائياً من قائمة الدعم.',
    quickReplies: ['مرحباً، اكتب تفاصيل المشكلة بوضوح وسأتابع معك هنا.', 'جرّب الخطوات الموجودة في الشرح ثم أرسل صورة واضحة للنتيجة.', 'تم استلام التفاصيل، يرجى الانتظار قليلاً وسيتم الرد عند توفر فريق الدعم.'],
    attachImage: 'إرفاق صورة',
    removeImage: 'إزالة الصورة',
    imageReady: 'الصورة جاهزة للإرسال',
    imageError: 'تعذر تجهيز الصورة. استخدم PNG أو JPG أو WEBP بحجم أصغر.',
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
    waitingCustomer: 'Waiting for customer',
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
    unavailable: 'Take the conversation before sending an administration reply.',
    close: 'Close conversation',
    closeConfirm: 'Confirm close',
    closeCancel: 'Cancel',
    closeSuccess: 'Conversation deleted from the support list.',
    quickReplies: ['Hello. Describe the issue clearly and I will follow it up here.', 'Try the steps in the guide, then send a clear image of the result.', 'The details were received. Please wait and support will reply when available.'],
    attachImage: 'Attach image',
    removeImage: 'Remove image',
    imageReady: 'Image ready to send',
    imageError: 'Unable to prepare the image. Use a smaller PNG, JPG, or WEBP image.',
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
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const notifyRef = useRef(onNotify);
  const selectedIdRef = useRef<string | null>(null);
  const displayedThreadIdRef = useRef<string | null>(null);
  const threadAbortRef = useRef<AbortController | null>(null);
  const threadRequestRef = useRef(0);
  const inFlightThreadIdRef = useRef<string | null>(null);
  const threadCacheRef = useRef(new Map<string, { conversation: Conversation; messages: Message[] }>());

  useEffect(() => { notifyRef.current = onNotify; }, [onNotify]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const activeStatus = useMemo(() => ({
    AI_ACTIVE: { label: t.ai, className: isDark ? 'border-cyan-300/15 bg-cyan-400/[.08] text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-700' },
    WAITING_FOR_SUPPORT: { label: t.waiting, className: isDark ? 'border-amber-300/15 bg-amber-400/[.08] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700' },
    WAITING_FOR_CUSTOMER: { label: t.waitingCustomer, className: isDark ? 'border-orange-300/15 bg-orange-400/[.08] text-orange-100' : 'border-orange-200 bg-orange-50 text-orange-700' },
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

  const applyThread = useCallback((conversationId: string, conversation: Conversation, nextMessages: Message[]) => {
    threadCacheRef.current.set(conversationId, { conversation, messages: nextMessages });
    if (selectedIdRef.current !== conversationId) return;
    displayedThreadIdRef.current = conversationId;
    setSelected((current) => {
      const unchanged = current?.id === conversation.id && current.updatedAt === conversation.updatedAt && current.status === conversation.status && current.messageCount === conversation.messageCount;
      return unchanged ? current : conversation;
    });
    setMessages((current) => {
      const currentSignature = current.map((item) => `${item.id}:${item.body}:${item.createdAt}`).join('|');
      const nextSignature = nextMessages.map((item) => `${item.id}:${item.body}:${item.createdAt}`).join('|');
      return currentSignature === nextSignature ? current : nextMessages;
    });
  }, []);

  const loadThread = useCallback(async (conversationId: string, options: { showSpinner?: boolean; notify?: boolean } = {}) => {
    const cached = threadCacheRef.current.get(conversationId);
    if (cached && selectedIdRef.current === conversationId) applyThread(conversationId, cached.conversation, cached.messages);
    if (inFlightThreadIdRef.current === conversationId) return;

    const requestId = ++threadRequestRef.current;
    if (threadAbortRef.current && inFlightThreadIdRef.current !== conversationId) threadAbortRef.current.abort();
    const controller = new AbortController();
    threadAbortRef.current = controller;
    inFlightThreadIdRef.current = conversationId;
    if (options.showSpinner && !cached) setLoadingThread(true);
    try {
      const response = await fetch(`/api/ai?view=admin_conversation&conversationId=${encodeURIComponent(conversationId)}`, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load conversation.');
      const nextConversation = data.conversation as Conversation;
      const nextMessages = Array.isArray(data.messages) ? data.messages as Message[] : [];
      if (requestId === threadRequestRef.current) applyThread(conversationId, nextConversation, nextMessages);
    } catch (error) {
      if (options.notify && !(error instanceof DOMException && error.name === 'AbortError')) notifyRef.current?.(error instanceof Error ? error.message : 'Unable to load conversation.', 'error');
    } finally {
      if (requestId === threadRequestRef.current) {
        inFlightThreadIdRef.current = null;
        setLoadingThread(false);
      }
    }
  }, [applyThread]);

  useEffect(() => { void loadList({ showSpinner: true }); }, [loadList]);
  useEffect(() => {
    setCloseConfirm(false);
    setAttachment(null);
    setDraft('');
    if (selectedId) {
      const cached = threadCacheRef.current.get(selectedId);
      if (cached) applyThread(selectedId, cached.conversation, cached.messages);
      void loadThread(selectedId, { showSpinner: !cached });
    } else {
      displayedThreadIdRef.current = null;
      setSelected(null);
      setMessages([]);
    }
  }, [selectedId, applyThread, loadThread]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void loadList();
      if (selectedId) void loadThread(selectedId);
    };
    const interval = window.setInterval(refresh, 20_000);
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

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || attachment || preparingImage || working) return;
    setPreparingImage(true);
    try {
      setAttachment(await createImageAttachment(file));
    } catch {
      onNotify?.(t.imageError, 'error');
    } finally {
      setPreparingImage(false);
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || (!draft.trim() && !attachment) || working || preparingImage) return;
    if (selected.status !== 'HUMAN_ACTIVE') { onNotify?.(t.unavailable, 'warning'); return; }
    const outgoingAttachment = attachment;
    setWorking(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'staff_reply', conversationId: selected.id, body: draft.trim(), attachments: outgoingAttachment ? [outgoingAttachment] : [] }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send reply.');
      setMessages((current) => [...current, data.message as Message]);
      setDraft('');
      setAttachment(null);
      void loadList();
      onNotify?.(t.replySuccess, 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'Unable to send reply.', 'error');
    } finally { setWorking(false); }
  };

  const closeConversation = async () => {
    if (!selected || working) return;
    setWorking(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'conversation_close', conversationId: selected.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to close conversation.');
      const deletedId = typeof data.deletedConversationId === 'string' ? data.deletedConversationId : selected.id;
      threadCacheRef.current.delete(deletedId);
      setConversations((current) => current.filter((conversation) => conversation.id !== deletedId));
      setSelectedId((current) => current === deletedId ? null : current);
      setSelected(null);
      setMessages([]);
      setCloseConfirm(false);
      setAttachment(null);
      onNotify?.(t.closeSuccess, 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'Unable to close conversation.', 'error');
    } finally { setWorking(false); }
  };

  return <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="grid gap-4 xl:grid-cols-[296px_minmax(0,1fr)]">
    <aside className={`overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.08] bg-[#0c1422]' : 'border-slate-200 bg-white'}`}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-4 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
        <div className="flex min-w-0 items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><UsersRound className="h-4 w-4" /></span><div><h3 className="text-sm font-black">{t.title}</h3><p className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{conversations.length}</p></div></div>
        <button onClick={() => void loadList({ showSpinner: true, notify: true })} disabled={loadingList} className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isDark ? 'border-white/[.1] text-slate-300 hover:bg-white/[.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} title={t.refresh}>{loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</button>
      </div>
      <div className="max-h-[630px] overflow-y-auto p-2">
        {loadingList && conversations.length === 0 ? <div className={`m-1 grid min-h-52 place-items-center rounded-2xl border border-dashed text-center ${isDark ? 'border-cyan-300/[.14] bg-cyan-300/[.035] text-slate-400' : 'border-cyan-200 bg-cyan-50/50 text-slate-500'}`}><div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Loader2 className="h-5 w-5 animate-spin" /></span><p className="text-[11px] font-black">{t.loading}</p><p className="mt-1 text-[10px] opacity-75">{lang === 'ar' ? 'يتم ترتيب المحادثات بأحدث رسالة.' : 'Ordering conversations by latest message.'}</p></div></div> : conversations.length === 0 ? <div className={`m-1 grid min-h-52 place-items-center rounded-2xl border border-dashed p-5 text-center ${isDark ? 'border-white/[.08] bg-white/[.025] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><div><span className={`mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl ${isDark ? 'bg-violet-400/[.09] text-violet-200' : 'bg-violet-50 text-violet-600'}`}><MessageCircle className="h-5 w-5" /></span><p className={`text-[11px] font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.empty}</p><p className="mt-1 max-w-[190px] text-[10px] leading-5">{lang === 'ar' ? 'ستظهر المحادثات الجديدة هنا فور بدء العميل التحدث مع مساعد تعن.' : 'New chats appear here as soon as a customer starts talking with Ta3n Assistant.'}</p><button onClick={() => void loadList({ showSpinner: true, notify: true })} className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${isDark ? 'border-white/[.1] text-slate-300 hover:bg-white/[.06]' : 'border-slate-200 text-slate-600 hover:bg-white'}`}><RefreshCw className="h-3 w-3" />{t.refresh}</button></div></div> : conversations.map((conversation) => {
          const status = activeStatus[conversation.status];
          return <button key={conversation.id} onClick={() => {
            if (selectedId === conversation.id) return;
            const cached = threadCacheRef.current.get(conversation.id);
            setSelected(cached?.conversation || conversation);
            setMessages(cached?.messages || []);
            setLoadingThread(!cached);
            setSelectedId(conversation.id);
          }} className={`mb-1.5 w-full rounded-2xl border p-3 text-start transition ${selectedId === conversation.id ? (isDark ? 'border-cyan-300/25 bg-cyan-400/[.08]' : 'border-cyan-200 bg-cyan-50') : (isDark ? 'border-transparent hover:bg-white/[.04]' : 'border-transparent hover:bg-slate-50')}`}>
            <div className="flex items-center gap-2.5"><img src={conversation.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-9 w-9 rounded-xl object-cover" onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{conversation.customerName}</p><p className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(conversation.lastMessageAt, lang)}</p></div></div>
            <div className="mt-2 flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${status.className}`}>{conversation.status === 'WAITING_FOR_CUSTOMER' && <Clock3 className="h-3 w-3" />}{status.label}</span><span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{conversation.messageCount || 0}</span></div>
          </button>;
        })}
      </div>
    </aside>

    <section className={`flex h-[min(630px,calc(100vh-210px))] min-h-[500px] flex-col overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.08] bg-[#0a1321] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
      {!selected ? <div className={`m-auto max-w-sm px-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><span className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] border ${isDark ? 'border-cyan-300/[.14] bg-cyan-400/[.06] text-cyan-200 shadow-[0_14px_34px_rgba(34,211,238,.08)]' : 'border-cyan-100 bg-cyan-50 text-cyan-600'}`}><MessageCircle className="h-7 w-7" /></span><p className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.select}</p><p className="mt-2 text-[11px] leading-6">{lang === 'ar' ? 'اختر محادثة من القائمة للرد السريع أو متابعة التفاصيل والصور.' : 'Choose a conversation to reply quickly or review its details and images.'}</p></div> : <>
        <header className={`flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
          <div className="flex min-w-0 items-center gap-3"><img src={selected.customerImage || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-10 w-10 rounded-2xl object-cover" onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} /><div className="min-w-0"><h3 className="truncate text-sm font-black">{selected.customerName}</h3><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${activeStatus[selected.status].className}`}>{selected.status === 'WAITING_FOR_CUSTOMER' && <Clock3 className="h-3 w-3" />}{activeStatus[selected.status].label}</span>{selected.status === 'HUMAN_ACTIVE' && selected.humanAgentName && <span className={`text-[10px] ${isDark ? 'text-violet-200' : 'text-violet-700'}`}>{t.takenBy(selected.humanAgentName)}</span>}</div></div></div>
          <div className="flex flex-wrap items-center gap-2">{selected.status !== 'CLOSED' && <button onClick={() => void changeMode(selected.status === 'HUMAN_ACTIVE' ? 'ai' : 'human')} disabled={working} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition disabled:opacity-50 ${selected.status === 'HUMAN_ACTIVE' ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:brightness-110'}`}>{working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : selected.status === 'HUMAN_ACTIVE' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}{selected.status === 'HUMAN_ACTIVE' ? t.returnAi : t.take}</button>}{selected.status !== 'CLOSED' && (closeConfirm ? <div className={`flex items-center gap-1 rounded-xl border p-1 ${isDark ? 'border-rose-300/20 bg-rose-400/[.08]' : 'border-rose-200 bg-rose-50'}`}><button onClick={() => void closeConversation()} disabled={working} className="rounded-lg bg-rose-500 px-2.5 py-2 text-[10px] font-black text-white transition hover:bg-rose-400 disabled:opacity-50">{t.closeConfirm}</button><button onClick={() => setCloseConfirm(false)} disabled={working} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${isDark ? 'text-slate-300 hover:bg-white/[.06]' : 'text-slate-600 hover:bg-white'}`}>{t.closeCancel}</button></div> : <button onClick={() => setCloseConfirm(true)} disabled={working} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-[10px] font-black transition disabled:opacity-50 ${isDark ? 'border-rose-300/20 text-rose-200 hover:bg-rose-400/[.09]' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}><XCircle className="h-3.5 w-3.5" />{t.close}</button>)}</div>
        </header>

        <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-4 ${isDark ? 'bg-[linear-gradient(180deg,rgba(8,17,30,.56),rgba(3,8,16,.22))]' : 'bg-slate-50/60'}`}>
          {loadingThread && messages.length === 0 ? <div className={`grid h-full place-items-center gap-2 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><span>{t.loading}</span></div> : <div className="space-y-3">{messages.map((message) => {
            const customer = message.role === 'customer';
            const system = message.role === 'system';
            const staff = message.role === 'staff';
            const label = customer ? t.customer : staff ? t.team : system ? t.system : t.ai;
            return <div key={message.id} className={`flex ${customer ? 'justify-start' : 'justify-end'}`}><article className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-xs leading-6 ${customer ? 'rounded-tr-md bg-cyan-400 text-slate-950' : system ? (isDark ? 'border border-amber-300/[.16] bg-amber-400/[.07] text-amber-100' : 'border border-amber-100 bg-amber-50 text-amber-900') : staff ? (isDark ? 'rounded-tl-md border border-violet-300/[.18] bg-violet-400/[.08] text-violet-100' : 'rounded-tl-md border border-violet-200 bg-violet-50 text-violet-800') : (isDark ? 'rounded-tl-md border border-white/[.09] bg-white/[.045] text-slate-200' : 'rounded-tl-md border border-slate-100 bg-white text-slate-700')}`}><span className={`mb-1 block text-[9px] font-black tracking-[.1em] ${customer ? 'text-slate-800/65' : staff ? 'text-violet-300' : system ? 'text-amber-300' : 'text-cyan-300'}`}>{label}</span>{message.attachments?.map((attachment) => attachment.previewData ? <a key={attachment.id} href={attachment.previewData} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl border border-black/10"><img src={attachment.previewData} alt={attachment.name} className="max-h-64 w-full object-contain" /></a> : null)}<p className="whitespace-pre-wrap">{message.body}</p><time className="mt-1 block text-[9px] opacity-60">{formatDate(message.createdAt, lang)}</time></article></div>;
          })}</div>}
        </div>

        <form onSubmit={sendReply} className={`shrink-0 border-t p-3 ${isDark ? 'border-white/[.08] bg-[#0a1321]' : 'border-slate-100 bg-white'}`}>
          {selected.status === 'HUMAN_ACTIVE' && <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">{t.quickReplies.slice(0, 2).map((reply) => <button key={reply} type="button" onClick={() => setDraft(reply)} disabled={working || preparingImage} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[9px] font-bold transition active:scale-95 ${isDark ? 'border-violet-300/[.16] bg-violet-400/[.06] text-violet-100 hover:bg-violet-400/[.13]' : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>{reply}</button>)}</div>}
          {attachment && <div className={`mb-2 flex items-center gap-2 rounded-xl border p-2 ${isDark ? 'border-violet-300/[.16] bg-violet-400/[.06]' : 'border-violet-100 bg-violet-50'}`}><img src={attachment.previewData || ''} alt={attachment.name} className="h-10 w-10 rounded-lg border border-white/10 object-cover" /><div className="min-w-0 flex-1"><p className={`truncate text-[10px] font-black ${isDark ? 'text-violet-100' : 'text-violet-800'}`}>{t.imageReady}</p><p className={`truncate text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{attachment.name}</p></div><button type="button" onClick={() => setAttachment(null)} disabled={working} className={`grid h-8 w-8 place-items-center rounded-lg ${isDark ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-200' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`} aria-label={t.removeImage}><Trash2 className="h-3.5 w-3.5" /></button></div>}
          <div className={`flex items-end gap-2 rounded-2xl border p-2 ${isDark ? 'border-white/[.1] bg-slate-950/45 focus-within:border-violet-300/35' : 'border-slate-200 bg-slate-50'}`}><label title={t.attachImage} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${working || preparingImage || attachment || selected.status !== 'HUMAN_ACTIVE' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${isDark ? 'border-white/[.1] text-violet-200 hover:bg-violet-400/[.12]' : 'border-slate-200 text-violet-700 hover:bg-violet-50'}`}><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={selectImage} disabled={working || preparingImage || Boolean(attachment) || selected.status !== 'HUMAN_ACTIVE'} /><ImagePlus className="h-4 w-4" /></label><textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={working || preparingImage || selected.status !== 'HUMAN_ACTIVE'} rows={1} maxLength={1800} placeholder={t.reply} className={`min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={working || preparingImage || selected.status !== 'HUMAN_ACTIVE' || (draft.trim().length < 2 && !attachment)} className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40" title={t.send}>{working || preparingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div>
        </form>
      </>}
    </section>
  </div>;
}
