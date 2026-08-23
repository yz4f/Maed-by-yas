'use client';

import { ChangeEvent, ClipboardEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Bot, Clock3, FileImage, ImagePlus, Loader2, Paperclip, Send, ShieldCheck, Trash2, Wrench, X } from 'lucide-react';

type ChatRole = 'customer' | 'assistant' | 'system' | 'staff';
type ConversationStatus = 'AI_ACTIVE' | 'WAITING_FOR_SUPPORT' | 'WAITING_FOR_CUSTOMER' | 'HUMAN_ACTIVE' | 'CLOSED';
type ConversationState = { status: ConversationStatus; idleCloseAt?: string | null; reopenAt?: string | null; closedReason?: 'INACTIVITY' | 'MANUAL' | null };
type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';

type ChatAttachment = {
  id: string;
  name: string;
  contentType: ImageContentType;
  size: number;
  previewData?: string | null;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  body: string;
  createdAt: string;
  attachments?: ChatAttachment[];
};

interface AiChatModalProps {
  open: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  isDark: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenGuide?: (destination: 'guide' | 'issues') => void;
}

const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_PREVIEW_CHARS = 320_000;
const IMAGE_TYPES = new Set<ImageContentType>(['image/jpeg', 'image/png', 'image/webp']);

const copy = {
  ar: {
    title: 'مساعد تعن',
    subtitle: 'مساعد الدعم داخل المنصة للمنتجات، التفعيل، الشروحات وحلول المشاكل.',
    placeholder: 'اكتب مشكلتك، أو الصق صورة للخطأ هنا...',
    send: 'إرسال',
    loading: 'مساعد تعن يراجع رسالتك...',
    start: 'مرحباً، كيف يمكنني مساعدتك اليوم؟',
    error: 'تعذر إرسال الرسالة الآن. حاول مرة أخرى.',
    quick: ['أين أجد شرح منتجي؟', 'قائمة Spoofer لا تظهر', 'كيف أرفع طلب Reset؟'],
    close: 'إغلاق المحادثة',
    handoff: 'تم إرسال موضوعك للمراجعة. اكتب التفاصيل بوضوح وانتظر الرد عند توفر فريق الدعم.',
    humanActive: 'فريق الدعم متاح الآن، ويمكنه الرد عليك داخل هذه المحادثة.',
    humanLabel: 'فريق الدعم متاح',
    waitingCustomerLabel: 'بانتظار ردك',
    closedLabel: 'مغلقة تلقائياً',
    inactivityWarning: 'لم نتلقَّ رداً جديداً منك. أرسل أي رسالة خلال الوقت المتبقي لتستمر المحادثة.',
    closedMessage: 'تم إغلاق هذه المحادثة تلقائياً لعدم وجود رد جديد منك خلال 3 دقائق.',
    reopenMessage: 'يمكنك فتح محادثة جديدة بعد',
    openNew: 'فتح محادثة جديدة',
    continueChat: 'متابعة المحادثة',
    staffLabel: 'فريق الإدارة',
    attach: 'إرفاق صورة',
    removeImage: 'إزالة الصورة',
    imageReady: 'الصورة جاهزة للإرسال',
    imageHint: 'PNG أو JPG أو WEBP — حتى 4MB',
    imageOnly: 'صورة مرفقة لشرح المشكلة.',
    imageTooLarge: 'اختر صورة لا يتجاوز حجمها 12MB قبل الضغط، وسيجري ضغطها تلقائياً للإرسال.',
    imageType: 'استخدم صورة بصيغة PNG أو JPG أو WEBP.',
    imageProcess: 'تعذر تجهيز الصورة. جرّب صورة مختلفة.',
    imageLimit: 'يمكن إرفاق صورة واحدة فقط مع كل رسالة.',
    protected: 'تُرسل الصورة للمساعد فقط لمراجعة المشكلة.',
    openGuide: 'فتح الشرح',
    openFixes: 'حلول المشاكل',
  },
  en: {
    title: 'Ta3n Assistant',
    subtitle: 'Your in-platform support assistant for products, activation, guides, and issues.',
    placeholder: 'Describe the issue, or paste an error image here...',
    send: 'Send',
    loading: 'Ta3n Assistant is reviewing your message...',
    start: 'Hello — how can I help you today?',
    error: 'Unable to send your message right now. Please try again.',
    quick: ['Where is my product guide?', 'The Spoofer list is not showing', 'How do I request a reset?'],
    close: 'Close chat',
    handoff: 'Your topic has been sent for review. Describe it clearly and wait for a reply when support is available.',
    humanActive: 'The support team is currently available and can reply in this conversation.',
    humanLabel: 'Support available',
    waitingCustomerLabel: 'Waiting for your reply',
    closedLabel: 'Closed automatically',
    inactivityWarning: 'We have not received a new reply. Send any message before the countdown ends to keep this conversation open.',
    closedMessage: 'This conversation was closed automatically because no new reply was received for 3 minutes.',
    reopenMessage: 'You can open a new conversation in',
    openNew: 'Open new conversation',
    continueChat: 'Continue conversation',
    staffLabel: 'Administration',
    attach: 'Attach image',
    removeImage: 'Remove image',
    imageReady: 'Image ready to send',
    imageHint: 'PNG, JPG, or WEBP — up to 4MB',
    imageOnly: 'An image is attached to explain the issue.',
    imageTooLarge: 'Choose an image under 12MB before compression.',
    imageType: 'Use a PNG, JPG, or WEBP image.',
    imageProcess: 'Unable to prepare this image. Please try a different one.',
    imageLimit: 'You can attach one image per message.',
    protected: 'The image is only sent to the assistant to review this issue.',
    openGuide: 'Open guide',
    openFixes: 'Troubleshooting',
  },
};

function extensionFor(contentType: ImageContentType) {
  return contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
}

function baseName(name: string) {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name || 'image';
}

function createImageAttachment(file: File): Promise<ChatAttachment> {
  if (!IMAGE_TYPES.has(file.type as ImageContentType)) return Promise.reject(new Error('image_type'));
  if (file.size > MAX_SOURCE_IMAGE_BYTES) return Promise.reject(new Error('image_size'));

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const maxDimension = 768;
        const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
        let width = Math.max(1, Math.round((image.naturalWidth || 1) * ratio));
        let height = Math.max(1, Math.round((image.naturalHeight || 1) * ratio));
        let contentType: ImageContentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        let quality = 0.78;
        let previewData = '';

        for (let attempt = 0; attempt < 7; attempt += 1) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('canvas');
          if (contentType === 'image/jpeg') {
            context.fillStyle = '#07111d';
            context.fillRect(0, 0, width, height);
          }
          context.drawImage(image, 0, 0, width, height);
          previewData = canvas.toDataURL(contentType, quality);
          if (previewData.length <= MAX_PREVIEW_CHARS) break;
          if (contentType === 'image/png') contentType = 'image/jpeg';
          else if (quality > 0.54) quality -= 0.12;
          else {
            width = Math.max(480, Math.round(width * 0.78));
            height = Math.max(480, Math.round(height * 0.78));
            quality = 0.74;
          }
        }

        URL.revokeObjectURL(objectUrl);
        if (!previewData || previewData.length > MAX_PREVIEW_CHARS) throw new Error('too_large');
        const estimatedSize = Math.max(1, Math.ceil(((previewData.length - previewData.indexOf(',') - 1) * 3) / 4));
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: `${baseName(file.name)}.${extensionFor(contentType)}`,
          contentType,
          size: estimatedSize,
          previewData,
        });
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('decode'));
    };
    image.src = objectUrl;
  });
}

export function AiChatModal({ open, onClose, lang, isDark, onNotify, onOpenGuide }: AiChatModalProps) {
  const t = copy[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [loading, setLoading] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const [conversation, setConversation] = useState<ConversationState>({ status: 'AI_ACTIVE' });
  const [clock, setClock] = useState(() => Date.now());
  const [reopening, setReopening] = useState(false);
  const conversationStatus = conversation.status;
  const endRef = useRef<HTMLDivElement | null>(null);
  const notifyRef = useRef(onNotify);
  const refreshInFlightRef = useRef(false);

  useEffect(() => { notifyRef.current = onNotify; }, [onNotify]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let controller: AbortController | null = null;
    const loadConversation = async (initial = false) => {
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch('/api/ai?view=conversation', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || t.error);
        if (!active) return;
        const remote = Array.isArray(data.messages) ? data.messages as ChatMessage[] : [];
        setConversation((current) => {
          const next = data.conversation as ConversationState | undefined;
          if (!next) return current;
          return current.status === next.status && current.idleCloseAt === next.idleCloseAt && current.reopenAt === next.reopenAt && current.closedReason === next.closedReason ? current : next;
        });
        setMessages((current) => {
          const local = current.filter((item) => item.id.startsWith('local-'));
          const known = new Set(remote.map((item) => item.id));
          const next = [...remote, ...local.filter((item) => !known.has(item.id))];
          const unchanged = current.length === next.length && current.every((item, index) => item.id === next[index]?.id && item.body === next[index]?.body && item.createdAt === next[index]?.createdAt);
          return unchanged ? current : next;
        });
      } catch (error) {
        if (active && initial && !(error instanceof DOMException && error.name === 'AbortError')) notifyRef.current?.(error instanceof Error ? error.message : t.error, 'error');
      } finally {
        refreshInFlightRef.current = false;
      }
    };
    void loadConversation(true);
    const interval = window.setInterval(() => { void loadConversation(); }, 12_000);
    const onFocus = () => { void loadConversation(); };
    window.addEventListener('focus', onFocus);
    return () => { active = false; controller?.abort(); window.clearInterval(interval); window.removeEventListener('focus', onFocus); refreshInFlightRef.current = false; };
  }, [open, t.error]);

  useEffect(() => {
    if (!open || (!conversation.idleCloseAt && !conversation.reopenAt)) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [open, conversation.idleCloseAt, conversation.reopenAt]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preparingImage) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, preparingImage, onClose]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [open, messages, loading, attachment]);

  const selectImage = async (file?: File | null) => {
    if (!file || loading || preparingImage) return;
    if (attachment) {
      onNotify?.(t.imageLimit, 'warning');
      return;
    }
    setPreparingImage(true);
    try {
      setAttachment(await createImageAttachment(file));
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotify?.(code === 'image_type' ? t.imageType : code === 'image_size' ? t.imageTooLarge : t.imageProcess, 'error');
    } finally {
      setPreparingImage(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void selectImage(file);
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));
    if (!image) return;
    event.preventDefault();
    void selectImage(image);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const image = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
    void selectImage(image);
  };

  const submit = async (message = input) => {
    const body = message.trim();
    const outgoingAttachment = attachment;
    if ((body.length < 2 && !outgoingAttachment) || loading || preparingImage) return;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'customer',
      body: body || t.imageOnly,
      attachments: outgoingAttachment ? [outgoingAttachment] : [],
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setInput('');
    setAttachment(null);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), outgoingAttachment ? 26_000 : 17_000);
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({ action: 'chat', body, attachments: outgoingAttachment ? [outgoingAttachment] : [], language: lang }),
      }).finally(() => window.clearTimeout(timeout));
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      setMessages((current) => {
        const withoutOptimistic = current.filter((item) => item.id !== optimistic.id);
        return [...withoutOptimistic, { ...optimistic, id: data.customerMessage?.id || optimistic.id }, ...(data.message ? [data.message as ChatMessage] : [])];
      });
      if (data.handoff) onNotify?.(t.handoff, 'info');
      if (data.humanActive) { setConversation((current) => ({ ...current, status: 'HUMAN_ACTIVE', idleCloseAt: null })); onNotify?.(t.humanActive, 'info'); }
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setAttachment(outgoingAttachment);
      onNotify?.(error instanceof Error ? error.message : t.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const idleRemainingMs = conversation.idleCloseAt ? Math.max(0, new Date(conversation.idleCloseAt).getTime() - clock) : 0;
  const reopenRemainingMs = conversation.reopenAt ? Math.max(0, new Date(conversation.reopenAt).getTime() - clock) : 0;
  const formatRemaining = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `0:${String(seconds).padStart(2, '0')}`;
  };
  const reopenConversation = async () => {
    if (reopening || reopenRemainingMs > 0) return;
    setReopening(true);
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'reopen_conversation' }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      if (data.conversation) setConversation(data.conversation as ConversationState);
      if (Array.isArray(data.messages)) setMessages(data.messages as ChatMessage[]);
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.error, 'error');
    } finally {
      setReopening(false);
    }
  };
  const attachmentUrl = attachment?.previewData || null;

  return <AnimatePresence>{open && <motion.div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !preparingImage && onClose()}>
    <motion.section className={`flex h-[min(740px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border shadow-[0_30px_100px_rgba(0,0,0,.52)] ${isDark ? 'border-cyan-300/[.18] bg-[#0a1321] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 12 }} onMouseDown={(event) => event.stopPropagation()}>
      <header className={`relative overflow-hidden border-b px-5 py-4 sm:px-6 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,.16),transparent_36%),radial-gradient(circle_at_95%_95%,rgba(139,92,246,.13),transparent_38%)]" />
        <div className="relative flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950 shadow-[0_0_28px_rgba(34,211,238,.1)]"><img src="/t3nn-ai.png" alt={t.title} className="h-full w-full object-cover" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-black tracking-tight sm:text-lg">{t.title}</h2>{conversationStatus === 'HUMAN_ACTIVE' && <span className={`rounded-full border px-2 py-1 text-[8px] font-black tracking-wide ${isDark ? 'border-violet-300/20 bg-violet-400/[.1] text-violet-100' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>{t.humanLabel}</span>}{conversationStatus === 'WAITING_FOR_CUSTOMER' && <span className={`rounded-full border px-2 py-1 text-[8px] font-black tracking-wide ${isDark ? 'border-amber-300/20 bg-amber-400/[.1] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{t.waitingCustomerLabel}</span>}{conversationStatus === 'CLOSED' && <span className={`rounded-full border px-2 py-1 text-[8px] font-black tracking-wide ${isDark ? 'border-rose-300/20 bg-rose-400/[.1] text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{t.closedLabel}</span>}</div><p className={`mt-1 max-w-[30rem] text-[11px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{conversationStatus === 'HUMAN_ACTIVE' ? t.humanActive : t.subtitle}</p></div></div><button onClick={onClose} disabled={preparingImage} aria-label={t.close} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-slate-400 transition hover:text-white disabled:opacity-50 ${isDark ? 'border-white/[.1] hover:bg-white/[.06]' : 'border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}><X className="h-4 w-4" /></button></div>
      </header>

      {conversationStatus === 'WAITING_FOR_CUSTOMER' && idleRemainingMs > 0 && <div className={`mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-[10px] sm:mx-6 ${isDark ? 'border-amber-300/[.18] bg-amber-400/[.08] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><div className="flex min-w-0 flex-1 items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /><span className="leading-5">{t.inactivityWarning}</span></div><div className="flex shrink-0 items-center gap-2"><span className="font-mono text-xs font-black"><Clock3 className="mb-0.5 me-1 inline h-3.5 w-3.5" />{formatRemaining(idleRemainingMs)}</span><button type="button" onClick={() => document.querySelector<HTMLTextAreaElement>('[data-ai-chat-input]')?.focus()} className={`rounded-lg border px-2 py-1 text-[9px] font-black transition active:scale-95 ${isDark ? 'border-amber-200/20 bg-amber-300/[.08] hover:bg-amber-300/[.14]' : 'border-amber-200 bg-white hover:bg-amber-100'}`}>{t.continueChat}</button></div></div>}

      <div className={`flex-1 overflow-y-auto px-4 py-5 sm:px-6 ${isDark ? 'bg-[linear-gradient(180deg,rgba(8,17,30,.56),rgba(3,8,16,.22))]' : 'bg-slate-50/60'}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <div className="space-y-3.5">
          {messages.length === 0 && <div className={`mx-auto max-w-md rounded-2xl border p-4 text-center ${isDark ? 'border-cyan-300/[.13] bg-cyan-400/[.045]' : 'border-sky-100 bg-white'}`}><Bot className="mx-auto h-5 w-5 text-cyan-300" /><p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.start}</p><div className="mt-3 flex flex-wrap justify-center gap-2">{t.quick.map((quick) => <button key={quick} onClick={() => void submit(quick)} className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${isDark ? 'border-white/[.1] bg-white/[.035] text-cyan-100 hover:bg-cyan-400/[.12]' : 'border-slate-200 bg-slate-50 text-sky-700 hover:bg-sky-50'}`}>{quick}</button>)}</div></div>}
          {messages.map((message) => {
            const mine = message.role === 'customer';
            const system = message.role === 'system';
            return <div key={message.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-6 shadow-sm ${mine ? 'rounded-tr-md bg-gradient-to-l from-cyan-400 to-sky-500 font-medium text-slate-950' : system ? (isDark ? 'border border-amber-300/[.16] bg-amber-400/[.07] text-amber-100' : 'border border-amber-100 bg-amber-50 text-amber-900') : (isDark ? 'rounded-tl-md border border-white/[.09] bg-white/[.045] text-slate-200' : 'rounded-tl-md border border-slate-100 bg-white text-slate-700')}`}>{!mine && !system && <span className={`mb-1 flex items-center gap-1.5 text-[9px] font-black tracking-[.12em] ${message.role === 'staff' ? 'text-violet-300' : 'text-cyan-300'}`}>{message.role === 'staff' ? <ShieldCheck className="h-3 w-3" /> : <Bot className="h-3 w-3" />}{message.role === 'staff' ? t.staffLabel : t.title}</span>}{message.attachments?.map((item) => item.previewData ? <a key={item.id} href={item.previewData} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl border border-black/10 bg-slate-950/10"><img src={item.previewData} alt={item.name} className="max-h-64 w-full object-contain" /><span className="flex items-center gap-1.5 px-2 py-1 text-[9px] opacity-75"><FileImage className="h-3 w-3" />{item.name}</span></a> : null)}<p className="whitespace-pre-wrap">{message.body}</p>{message.role === 'assistant' && onOpenGuide && <div className={`mt-3 flex flex-wrap gap-2 border-t pt-2.5 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}><button type="button" onClick={() => onOpenGuide('guide')} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${isDark ? 'border-cyan-300/20 bg-cyan-400/[.08] text-cyan-100 hover:bg-cyan-400/[.16]' : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}><BookOpen className="h-3.5 w-3.5" />{t.openGuide}</button><button type="button" onClick={() => onOpenGuide('issues')} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${isDark ? 'border-emerald-300/20 bg-emerald-400/[.08] text-emerald-100 hover:bg-emerald-400/[.16]' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><Wrench className="h-3.5 w-3.5" />{t.openFixes}</button></div>}</div></div>;
          })}
          {loading && <div className="flex justify-end"><div className={`flex items-center gap-2 rounded-2xl rounded-tl-md border px-3 py-2 text-[11px] ${isDark ? 'border-white/[.09] bg-white/[.045] text-slate-300' : 'border-slate-100 bg-white text-slate-500'}`}><Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />{t.loading}</div></div>}
          <div ref={endRef} />
        </div>
      </div>

      {conversationStatus !== 'CLOSED' ? <form className={`border-t p-3 sm:p-4 ${isDark ? 'border-white/[.08] bg-[#0a1321]' : 'border-slate-100 bg-white'}`} onSubmit={(event) => { event.preventDefault(); void submit(); }}>{attachment && <div className={`mb-2 flex items-center gap-2 rounded-2xl border p-2 ${isDark ? 'border-cyan-300/[.16] bg-cyan-400/[.06]' : 'border-sky-100 bg-sky-50'}`}><div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-slate-950"><img src={attachmentUrl || ''} alt={attachment.name} className="h-full w-full object-cover" /></div><div className="min-w-0 flex-1"><p className={`truncate text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.imageReady}</p><p className={`truncate text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{attachment.name}</p></div><button type="button" onClick={() => setAttachment(null)} disabled={loading} aria-label={t.removeImage} className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isDark ? 'border-white/[.1] text-slate-400 hover:bg-rose-400/10 hover:text-rose-300' : 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`}><Trash2 className="h-4 w-4" /></button></div>}<div className={`flex items-end gap-2 rounded-2xl border p-2 ${isDark ? 'border-white/[.1] bg-slate-950/45 focus-within:border-cyan-300/35' : 'border-slate-200 bg-slate-50 focus-within:border-sky-300'}`}><label aria-label={t.attach} title={t.attach} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${loading || preparingImage || attachment ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${isDark ? 'border-white/[.1] text-cyan-200 hover:bg-cyan-400/[.12]' : 'border-slate-200 text-sky-700 hover:bg-sky-50'}`}><input onChange={onFileChange} type="file" accept="image/png,image/jpeg,image/webp" disabled={loading || preparingImage || Boolean(attachment)} className="sr-only" />{preparingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}</label><textarea data-ai-chat-input value={input} onChange={(event) => setInput(event.target.value)} onPaste={onPaste} rows={1} maxLength={1800} disabled={loading || preparingImage} placeholder={t.placeholder} className={`min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }} /><button type="submit" disabled={loading || preparingImage || (input.trim().length < 2 && !attachment)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label={t.send}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div><div className={`mt-2 flex items-center justify-between gap-2 px-1 text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><span className="inline-flex items-center gap-1"><ImagePlus className="h-3 w-3" />{t.imageHint}</span><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{t.protected}</span></div></form> : <section className={`border-t px-4 py-5 text-center sm:px-6 ${isDark ? 'border-white/[.08] bg-[#0a1321]' : 'border-slate-100 bg-white'}`}><div className={`mx-auto max-w-md rounded-2xl border p-4 ${isDark ? 'border-rose-300/[.16] bg-rose-400/[.07] text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-900'}`}><AlertTriangle className="mx-auto h-5 w-5" /><p className="mt-2 text-xs font-black">{t.closedMessage}</p>{reopenRemainingMs > 0 ? <p className={`mt-2 text-[11px] ${isDark ? 'text-rose-100/80' : 'text-rose-800'}`}>{t.reopenMessage} <span className="font-mono font-black">{formatRemaining(reopenRemainingMs)}</span></p> : <button type="button" onClick={() => void reopenConversation()} disabled={reopening} className={`mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-black transition active:scale-95 disabled:opacity-55 ${isDark ? 'bg-rose-200 text-rose-950 hover:bg-white' : 'bg-rose-600 text-white hover:bg-rose-700'}`}>{reopening && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t.openNew}</button>}</div></section>}
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
