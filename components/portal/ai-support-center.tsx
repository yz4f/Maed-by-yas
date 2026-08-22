'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUp, Bot, CheckCircle2, ChevronLeft, CircleHelp, Clock3, Database, ExternalLink, FileText, Headset, KeyRound, Loader2, MessageCircle, RefreshCcw, Send, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import type { AiConversation, AiKnowledgeEntry, AiMessage, ResetRequest } from '@/types';

interface CustomerProduct {
  id: string;
  productId: string;
  name: string;
  status: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
  keyId?: string | null;
  keyMasked: string;
  resetCount: number;
  lastResetAt?: string | null;
  guideAvailable: boolean;
}

interface AiWorkspace {
  conversation: AiConversation;
  messages: AiMessage[];
  customer: { user: { id: string; name: string; image?: string | null; email?: string | null }; products: CustomerProduct[] };
  isStaff: boolean;
}

interface AiSupportCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  isStaff: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenProducts?: () => void;
}

const copy = {
  ar: {
    title: 'ذكاء تعن', subtitle: 'مركز الدعم الذكي الرسمي', online: 'متصل وآمن', products: 'منتجاتك', productNone: 'لا توجد منتجات مفعلة في حسابك حالياً.', quick: 'اختصارات سريعة', faq: 'أسئلة عن المنتجات', faqHint: 'إجابات من قاعدة المعرفة المعتمدة', reset: 'طلب Reset للمفتاح', resetHint: 'يراجعه فريق الإدارة قبل التنفيذ', handoff: 'التواصل مع الدعم', send: 'إرسال', placeholder: 'اكتب سؤالك عن منتجاتك أو مفتاحك...', thinking: 'مساعد تعن يكتب...', guide: 'فتح منتجاتي', resetTitle: 'طلب Reset للمفتاح', resetDescription: 'لن ينفذ أي Reset تلقائياً. سيرسل طلبك للمراجعة من الإدارة فقط.', chooseProduct: 'اختر المنتج', reason: 'سبب طلب Reset', reasonPlaceholder: 'مثال: غيرت الجهاز أو احتاج مراجعة لحالة المفتاح', cancel: 'إلغاء', submitReset: 'رفع الطلب للمراجعة', resetDone: 'تم رفع طلب Reset بنجاح.', status: { AI_ACTIVE: 'ذكاء تعن نشط', WAITING_FOR_SUPPORT: 'بانتظار الدعم', HUMAN_ACTIVE: 'موظف الدعم يتابع', CLOSED: 'المحادثة مغلقة' }, private: 'بيانات حسابك خاصة ولا تظهر إلا لك وفريق الإدارة المخوّل.', chatEmpty: 'مرحباً بك في تعن', chatEmptyHint: 'اسأل عن منتجاتك، التفعيل، المفاتيح أو الدعم. سأعتمد فقط على معلومات المنصة المعتمدة.', requestError: 'تعذر تنفيذ الطلب. حاول مرة أخرى.', admin: 'لوحة ذكاء تعن', resetRequests: 'طلبات Reset', knowledge: 'قاعدة المعرفة', conversations: 'المحادثات', pending: 'معلقة', customer: 'العميل', product: 'المنتج', reasonLabel: 'السبب', approve: 'موافقة', reject: 'رفض', requestInfo: 'طلب معلومات', complete: 'تنفيذ Reset', save: 'حفظ', newKnowledge: 'إضافة معلومة', noRequests: 'لا توجد طلبات Reset حالياً.', noConversations: 'لا توجد محادثات بعد.', policy: 'المساعد لا يشارك مفاتيح كاملة ولا ينفذ Reset أو تفعيل بنفسه.', active: 'مفعل', expired: 'منتهي أو غير مفعل', expires: 'ينتهي', key: 'المفتاح', resetCount: 'عمليات Reset', context: 'حسابك', aiBadge: 'TA3N AI', faqQuestions: [
      { q: 'هل يوجد شرح للمنتج الذي اشتريته؟', a: 'نعم، افتح قسم منتجاتي ثم اختر المنتج وستجد الشرح والملفات المرتبطة به داخل الموقع.' },
      { q: 'هل يمكن استرجاع منتج رقمي؟', a: 'تخضع المنتجات الرقمية لسياسة الاسترجاع المعتمدة في المنصة. عند وجود حالة تحتاج مراجعة، يمكن تحويلها للدعم.' },
      { q: 'اتبعت الشرح وما زالت المشكلة موجودة، ماذا أفعل؟', a: 'أرسل وصفاً واضحاً للمشكلة أو صورة للخطأ. إذا لم توجد معلومة مؤكدة فسيتم تحويل الحالة للدعم المختص.' },
    ],
  },
  en: {
    title: 'Ta3n AI', subtitle: 'Official intelligent support center', online: 'Online & secure', products: 'Your products', productNone: 'No active products are visible on your account.', quick: 'Quick actions', faq: 'Product questions', faqHint: 'Answers from the approved knowledge base', reset: 'Request key reset', resetHint: 'Reviewed by administration before any action', handoff: 'Contact support', send: 'Send', placeholder: 'Ask about your products or license key...', thinking: 'Ta3n AI is typing...', guide: 'Open My Products', resetTitle: 'Request a key reset', resetDescription: 'No reset is performed automatically. Your request is sent to administration for review only.', chooseProduct: 'Select a product', reason: 'Reason for reset', reasonPlaceholder: 'Example: I changed my device or need the key status reviewed', cancel: 'Cancel', submitReset: 'Submit for review', resetDone: 'Your reset request has been submitted.', status: { AI_ACTIVE: 'Ta3n AI active', WAITING_FOR_SUPPORT: 'Waiting for support', HUMAN_ACTIVE: 'Support agent active', CLOSED: 'Conversation closed' }, private: 'Your account data is private and visible only to you and authorized administration.', chatEmpty: 'Welcome to Ta3n', chatEmptyHint: 'Ask about your products, activation, keys, or support. I only use approved platform information.', requestError: 'The request could not be completed. Please try again.', admin: 'Ta3n AI console', resetRequests: 'Reset requests', knowledge: 'Knowledge base', conversations: 'Conversations', pending: 'Pending', customer: 'Customer', product: 'Product', reasonLabel: 'Reason', approve: 'Approve', reject: 'Reject', requestInfo: 'Request info', complete: 'Perform reset', save: 'Save', newKnowledge: 'Add knowledge', noRequests: 'No reset requests right now.', noConversations: 'No conversations yet.', policy: 'The assistant never shows full keys or performs resets or activation itself.', active: 'Active', expired: 'Expired or inactive', expires: 'Expires', key: 'Key', resetCount: 'Reset count', context: 'Your account', aiBadge: 'TA3N AI', faqQuestions: [
      { q: 'Is there a guide for my purchased product?', a: 'Yes. Open My Products, choose the product, and use the in-site guide and attached files.' },
      { q: 'Can a digital product be refunded?', a: 'Digital products are governed by the platform refund policy. Cases requiring review can be sent to support.' },
      { q: 'I followed the guide and still have an issue. What next?', a: 'Send a clear description or an image of the error. If no confirmed answer is available, the case is sent to support.' },
    ],
  },
};

function formatDate(value: string | null | undefined, language: 'ar' | 'en') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function StatusPill({ status, labels }: { status: AiConversation['status']; labels: Record<AiConversation['status'], string> }) {
  const tone = status === 'AI_ACTIVE' ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200' : status === 'HUMAN_ACTIVE' ? 'border-violet-300/20 bg-violet-400/10 text-violet-200' : status === 'CLOSED' ? 'border-slate-400/20 bg-slate-400/10 text-slate-300' : 'border-amber-300/20 bg-amber-400/10 text-amber-200';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{labels[status]}</span>;
}

export function AiSupportCenter({ lang, isDark, isStaff, onNotify, onOpenProducts }: AiSupportCenterProps) {
  const t = copy[lang];
  const [workspace, setWorkspace] = useState<AiWorkspace | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetProductId, setResetProductId] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [adminView, setAdminView] = useState<'resets' | 'knowledge' | 'conversations'>('resets');
  const [adminData, setAdminData] = useState<{ resets: ResetRequest[]; knowledge: AiKnowledgeEntry[]; conversations: AiConversation[] } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState<{ title: string; category: AiKnowledgeEntry['category']; content: string }>({ title: '', category: 'FAQ', content: '' });
  const [adminNote, setAdminNote] = useState('');

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setWorkspace(data);
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.requestError, 'error');
    } finally { setLoading(false); }
  }, [onNotify, t.requestError]);

  const loadAdmin = useCallback(async () => {
    if (!isStaff) return;
    setAdminLoading(true);
    try {
      const response = await fetch('/api/ai?view=admin', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setAdminData(data);
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.requestError, 'error');
    } finally { setAdminLoading(false); }
  }, [isStaff, onNotify, t.requestError]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { if (isStaff) void loadAdmin(); }, [isStaff, loadAdmin]);

  const customerProducts = workspace?.customer.products || [];
  const canSend = input.trim().length >= 2 && !sending && workspace?.conversation.status !== 'CLOSED';
  const orderedMessages = useMemo(() => workspace?.messages.filter((message) => message.visibleToCustomer) || [], [workspace?.messages]);

  const sendMessage = async (text = input) => {
    const body = text.trim();
    if (body.length < 2 || sending) return;
    setSending(true);
    setInput('');
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'chat', body, language: lang }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setWorkspace((current) => current ? { ...current, messages: [...current.messages, { id: `local-customer-${Date.now()}`, conversationId: current.conversation.id, role: 'customer', body, visibleToCustomer: true, createdAt: new Date().toISOString() }, data.message], conversation: data.handoff ? { ...current.conversation, status: 'WAITING_FOR_SUPPORT' } : current.conversation } : current);
      if (data.handoff) onNotify?.(lang === 'ar' ? 'تم تحويل المحادثة إلى الدعم.' : 'The conversation was sent to support.', 'info');
      if (isStaff) void loadAdmin();
    } catch (error) {
      setInput(body);
      onNotify?.(error instanceof Error ? error.message : t.requestError, 'error');
    } finally { setSending(false); }
  };

  const submitReset = async () => {
    if (!resetReason.trim() || submittingReset) return;
    setSubmittingReset(true);
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'reset_request', productId: resetProductId || undefined, reason: resetReason, language: lang }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setShowReset(false); setResetReason(''); setResetProductId('');
      onNotify?.(data.duplicate ? (lang === 'ar' ? 'لديك طلب Reset قائم بالفعل لهذا المنتج.' : 'You already have an open reset request for this product.') : t.resetDone, data.duplicate ? 'info' : 'success');
      await loadWorkspace();
      if (isStaff) void loadAdmin();
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.requestError, 'error');
    } finally { setSubmittingReset(false); }
  };

  const patchAdmin = async (payload: Record<string, string>) => {
    try {
      const response = await fetch('/api/ai', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setAdminNote('');
      onNotify?.(lang === 'ar' ? 'تم حفظ القرار بنجاح.' : 'Decision saved successfully.', 'success');
      await loadAdmin();
    } catch (error) { onNotify?.(error instanceof Error ? error.message : t.requestError, 'error'); }
  };

  const saveKnowledge = async () => {
    if (!newKnowledge.title.trim() || !newKnowledge.content.trim()) return;
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'knowledge', ...newKnowledge, enabled: true, source: 'لوحة ذكاء تعن' }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.requestError);
      setNewKnowledge({ title: '', category: 'FAQ', content: '' });
      onNotify?.(lang === 'ar' ? 'تم حفظ المعلومة في قاعدة المعرفة.' : 'Knowledge entry saved.', 'success');
      await loadAdmin();
    } catch (error) { onNotify?.(error instanceof Error ? error.message : t.requestError, 'error'); }
  };

  const quickActions = [
    { label: lang === 'ar' ? 'مشاكل المفتاح' : 'Key issue', icon: KeyRound, text: lang === 'ar' ? 'لدي مشكلة في مفتاح المنتج، ما المعلومات التي تحتاجها مني؟' : 'I have an issue with my product key. What information do you need from me?' },
    { label: lang === 'ar' ? 'استلام المنتج' : 'Receive product', icon: Database, text: lang === 'ar' ? 'اشتريت منتجاً وأحتاج مساعدة في استلامه أو تفعيله.' : 'I purchased a product and need help receiving or activating it.' },
    { label: lang === 'ar' ? 'مشكلة تقنية' : 'Technical issue', icon: AlertTriangle, text: lang === 'ar' ? 'لدي مشكلة تقنية في منتج اشتريته.' : 'I have a technical issue with a product I own.' },
  ];

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`relative overflow-hidden rounded-[28px] border ${isDark ? 'border-cyan-300/[0.14] bg-[#08111e] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,.35)]' : 'border-sky-100 bg-white text-slate-900 shadow-[0_24px_70px_rgba(32,104,150,.12)]'}`}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(38,185,255,.16),transparent_28%),radial-gradient(circle_at_92%_100%,rgba(116,79,255,.12),transparent_35%)]" />
    <div className="relative grid min-h-[680px] xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <aside className={`border-b p-5 xl:border-b-0 xl:border-e ${isDark ? 'border-white/[0.08] bg-slate-950/35' : 'border-slate-100 bg-slate-50/80'}`}>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_0_26px_rgba(34,211,238,.24)]"><img src="/t3nn-ai.png" alt="ذكاء تعن" className="h-full w-full object-cover" /><span className="absolute bottom-1 end-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" /></div>
          <div className="min-w-0"><div className="flex items-center gap-1.5"><h2 className="truncate text-base font-black tracking-tight">{t.title}</h2><Sparkles className="h-3.5 w-3.5 text-cyan-300" /></div><p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p><span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{t.online}</span></div>
        </div>
        <div className={`mt-5 rounded-2xl border p-3.5 ${isDark ? 'border-white/[0.08] bg-white/[0.035]' : 'border-white bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between"><span className={`text-[10px] font-black uppercase tracking-[.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.context}</span><ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /></div>
          {loading ? <div className="mt-4 flex h-16 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div> : <><div className="mt-3 flex items-center gap-2.5"><div className="h-8 w-8 overflow-hidden rounded-xl bg-cyan-500/15"><img src={workspace?.customer.user.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="truncate text-xs font-bold">{workspace?.customer.user.name || '—'}</p><p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.private}</p></div></div></>}
        </div>
        <div className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-black">{t.products}</h3><span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{customerProducts.length}</span></div>
          <div className="space-y-2">{loading ? <div className="h-24 animate-pulse rounded-2xl bg-white/[0.05]" /> : customerProducts.length ? customerProducts.slice(0, 3).map((product) => <div key={product.id} className={`rounded-2xl border p-3 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-100 bg-white'}`}><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-[11px] font-bold leading-relaxed">{product.name}</p><CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${product.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`} /></div><div className={`mt-2 grid grid-cols-2 gap-1 text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><span>{t.key}: {product.keyMasked}</span><span>{t.expires}: {formatDate(product.expiresAt, lang)}</span></div></div>) : <p className={`rounded-2xl border border-dashed p-3 text-[11px] leading-relaxed ${isDark ? 'border-white/[0.09] text-slate-500' : 'border-slate-200 text-slate-400'}`}>{t.productNone}</p>}</div>
          <button onClick={onOpenProducts} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] font-black text-cyan-200 transition hover:bg-cyan-400/15 active:scale-[.98]"><ExternalLink className="h-3.5 w-3.5" />{t.guide}</button>
        </div>
        <p className={`mt-5 rounded-xl px-1 text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.policy}</p>
      </aside>

      <main className="flex min-w-0 flex-col">
        <header className={`flex min-h-[86px] items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/[0.08] bg-slate-950/10' : 'border-slate-100 bg-white/75'}`}><div><div className="flex items-center gap-2"><span className="rounded-md bg-cyan-400/10 px-2 py-1 text-[9px] font-black tracking-[.18em] text-cyan-300">{t.aiBadge}</span>{workspace && <StatusPill status={workspace.conversation.status} labels={t.status} />}</div><p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.faqHint}</p></div><button onClick={() => setShowFaq((open) => !open)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black transition active:scale-[.98] ${isDark ? 'border-white/[0.1] bg-white/[.04] text-slate-200 hover:bg-white/[.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><CircleHelp className="h-3.5 w-3.5 text-cyan-400" />{t.faq}</button></header>
        <AnimatePresence>{showFaq && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`mx-5 mt-4 rounded-2xl border p-4 ${isDark ? 'border-cyan-300/[.13] bg-cyan-400/[.045]' : 'border-cyan-100 bg-cyan-50/60'}`}><div className="mb-3 flex items-center justify-between"><p className="text-xs font-black">{t.faq}</p><button onClick={() => setShowFaq(false)} aria-label="close" className="rounded-lg p-1 text-slate-400 hover:bg-black/5"><X className="h-4 w-4" /></button></div><div className="grid gap-2 md:grid-cols-3">{t.faqQuestions.map((item) => <button key={item.q} onClick={() => { setShowFaq(false); void sendMessage(item.q); }} className={`rounded-xl border p-3 text-start transition hover:-translate-y-0.5 ${isDark ? 'border-white/[.08] bg-slate-950/30 hover:border-cyan-300/25' : 'border-white bg-white hover:border-cyan-200'}`}><p className="text-[11px] font-bold leading-relaxed">{item.q}</p><p className={`mt-1.5 line-clamp-2 text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.a}</p></button>)}</div></motion.div>}</AnimatePresence>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5" style={{ maxHeight: '420px' }}>{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-400" /></div> : orderedMessages.length === 0 ? <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,.13)]"><Bot className="h-8 w-8 text-cyan-300" /></div><h3 className="text-base font-black">{t.chatEmpty}</h3><p className={`mt-2 max-w-sm text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.chatEmptyHint}</p></div> : orderedMessages.map((message) => { const customer = message.role === 'customer'; const system = message.role === 'system'; return <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${customer ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-xs leading-6 shadow-sm ${customer ? (isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700') : system ? (isDark ? 'border border-amber-300/15 bg-amber-400/[.07] text-amber-100' : 'border border-amber-100 bg-amber-50 text-amber-900') : 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-cyan-500/15'}`}><div className="mb-1 flex items-center gap-1.5 text-[9px] font-black opacity-75">{customer ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}{customer ? workspace?.customer.user.name : message.role === 'staff' ? (lang === 'ar' ? 'فريق الدعم' : 'Support') : t.title}</div><p className="whitespace-pre-wrap">{message.body}</p><p className="mt-1 text-[9px] opacity-60">{new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</p></div></motion.div>; })}{sending && <div className="flex justify-end"><div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs ${isDark ? 'bg-white/[.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`}><Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />{t.thinking}</div></div>}</div>
        <div className={`border-t p-4 ${isDark ? 'border-white/[0.08] bg-slate-950/25' : 'border-slate-100 bg-white/70'}`}><div className="mb-3 flex flex-wrap gap-2">{quickActions.map((item) => <button key={item.label} onClick={() => void sendMessage(item.text)} disabled={sending} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-50 ${isDark ? 'border-white/[.08] bg-white/[.035] text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-400/[.07]' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50'}`}><item.icon className="h-3 w-3 text-cyan-400" />{item.label}</button>)}<button onClick={() => setShowReset(true)} disabled={!customerProducts.length} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/20 bg-violet-400/[.07] px-2.5 py-1.5 text-[10px] font-bold text-violet-200 transition hover:bg-violet-400/[.13] disabled:opacity-40"><RefreshCcw className="h-3 w-3" />{t.reset}</button><button onClick={() => void sendMessage(lang === 'ar' ? 'أحتاج التواصل مع الدعم البشري.' : 'I need to contact human support.')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/20 bg-amber-400/[.07] px-2.5 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-amber-400/[.13]"><Headset className="h-3 w-3" />{t.handoff}</button></div><div className={`flex items-end gap-2 rounded-2xl border p-2 ${isDark ? 'border-white/[.1] bg-slate-950/55 focus-within:border-cyan-300/40' : 'border-slate-200 bg-white focus-within:border-cyan-300'}`}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} disabled={workspace?.conversation.status === 'CLOSED'} placeholder={t.placeholder} rows={2} className={`min-h-[42px] flex-1 resize-none bg-transparent px-2 py-1 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`} /><button onClick={() => void sendMessage()} disabled={!canSend} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"><Send className="h-4 w-4" /></button></div></div>
      </main>

      <aside className={`border-t p-5 xl:border-s xl:border-t-0 ${isDark ? 'border-white/[.08] bg-slate-950/35' : 'border-slate-100 bg-slate-50/80'}`}><h3 className="text-xs font-black">{t.quick}</h3><p className={`mt-1 text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.resetHint}</p><button onClick={() => setShowReset(true)} disabled={!customerProducts.length} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/[.16] to-fuchsia-500/[.06] p-3 text-start transition hover:-translate-y-0.5 disabled:opacity-40"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200"><RefreshCcw className="h-4 w-4" /></span><span><span className="block text-[11px] font-black">{t.reset}</span><span className={`mt-0.5 block text-[9px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetHint}</span></span><ChevronLeft className="ms-auto h-4 w-4 text-violet-300" /></button><button onClick={() => void sendMessage(lang === 'ar' ? 'أحتاج التواصل مع الدعم البشري.' : 'I need to contact human support.')} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-500/[.12] to-orange-500/[.05] p-3 text-start transition hover:-translate-y-0.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200"><Headset className="h-4 w-4" /></span><span><span className="block text-[11px] font-black">{t.handoff}</span><span className={`mt-0.5 block text-[9px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'تحويل منظم بدون فقدان سياق المحادثة' : 'Organized handoff without losing context'}</span></span></button>{isStaff && <div className={`mt-5 border-t pt-4 ${isDark ? 'border-white/[.08]' : 'border-slate-200'}`}><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /><h3 className="text-xs font-black">{t.admin}</h3></div><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/[.08] p-1">{(['resets', 'knowledge', 'conversations'] as const).map((view) => <button key={view} onClick={() => setAdminView(view)} className={`rounded-lg px-1.5 py-2 text-[9px] font-black transition ${adminView === view ? 'bg-cyan-400 text-slate-950' : isDark ? 'text-slate-400 hover:bg-white/[.06]' : 'text-slate-500 hover:bg-white'}`}>{view === 'resets' ? t.resetRequests : view === 'knowledge' ? t.knowledge : t.conversations}</button>)}</div><div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">{adminLoading ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-cyan-400" /> : adminView === 'resets' ? (!adminData?.resets.length ? <p className="py-5 text-center text-[10px] text-slate-500">{t.noRequests}</p> : adminData.resets.slice(0, 8).map((request) => <div key={request.id} className={`rounded-xl border p-2.5 ${isDark ? 'border-white/[.07] bg-white/[.03]' : 'border-white bg-white'}`}><div className="flex items-start justify-between gap-2"><span className="text-[10px] font-black text-cyan-300">{request.reference}</span><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${request.status === 'PENDING' ? 'bg-amber-400/15 text-amber-300' : request.status === 'COMPLETED' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-400/10 text-slate-400'}`}>{request.status}</span></div><p className="mt-1 text-[10px] font-bold">{request.customerName}</p><p className="mt-1 line-clamp-1 text-[9px] text-slate-500">{request.productName} · {request.keyMasked}</p><p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-slate-400">{request.reason}</p>{request.status === 'PENDING' && <><textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder={lang === 'ar' ? 'ملاحظة للعميل (اختيارية)' : 'Note to customer (optional)'} className={`mt-2 w-full rounded-lg border bg-transparent p-1.5 text-[9px] outline-none ${isDark ? 'border-white/[.08] text-slate-200' : 'border-slate-200 text-slate-700'}`} rows={2} /><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={() => void patchAdmin({ action: 'process_reset', requestId: request.id, decision: 'approve', note: adminNote })} className="rounded-md bg-emerald-400/15 px-1 py-1.5 text-[8px] font-black text-emerald-300">{t.approve}</button><button onClick={() => void patchAdmin({ action: 'process_reset', requestId: request.id, decision: 'request_info', note: adminNote })} className="rounded-md bg-amber-400/15 px-1 py-1.5 text-[8px] font-black text-amber-300">{t.requestInfo}</button><button onClick={() => void patchAdmin({ action: 'process_reset', requestId: request.id, decision: 'reject', note: adminNote })} className="rounded-md bg-rose-400/15 px-1 py-1.5 text-[8px] font-black text-rose-300">{t.reject}</button></div></>}{request.status === 'APPROVED' && <button onClick={() => void patchAdmin({ action: 'process_reset', requestId: request.id, decision: 'complete' })} className="mt-2 w-full rounded-md bg-violet-400/15 px-2 py-1.5 text-[9px] font-black text-violet-200">{t.complete}</button>}</div>)) : adminView === 'knowledge' ? <><div className={`rounded-xl border p-2.5 ${isDark ? 'border-cyan-300/[.12] bg-cyan-400/[.04]' : 'border-cyan-100 bg-cyan-50'}`}><input value={newKnowledge.title} onChange={(event) => setNewKnowledge((current) => ({ ...current, title: event.target.value }))} placeholder={lang === 'ar' ? 'عنوان المعلومة' : 'Knowledge title'} className={`w-full border-b bg-transparent pb-1.5 text-[10px] font-bold outline-none ${isDark ? 'border-white/[.1]' : 'border-cyan-100'}`} /><select value={newKnowledge.category} onChange={(event) => setNewKnowledge((current) => ({ ...current, category: event.target.value as AiKnowledgeEntry['category'] }))} className={`mt-2 w-full rounded-md border bg-transparent p-1.5 text-[9px] ${isDark ? 'border-white/[.1]' : 'border-cyan-100'}`}><option value="FAQ">FAQ</option><option value="PRODUCTS">PRODUCTS</option><option value="PRODUCT_GUIDES">PRODUCT_GUIDES</option><option value="TROUBLESHOOTING">TROUBLESHOOTING</option><option value="REFUNDS">REFUNDS</option><option value="SUPPORT_POLICY">SUPPORT_POLICY</option></select><textarea value={newKnowledge.content} onChange={(event) => setNewKnowledge((current) => ({ ...current, content: event.target.value }))} placeholder={lang === 'ar' ? 'اكتب المعلومة المعتمدة هنا...' : 'Write approved knowledge here...'} rows={4} className={`mt-2 w-full resize-none rounded-md border bg-transparent p-1.5 text-[9px] outline-none ${isDark ? 'border-white/[.1]' : 'border-cyan-100'}`} /><button onClick={() => void saveKnowledge()} className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-cyan-400 px-2 py-1.5 text-[9px] font-black text-slate-950"><FileText className="h-3 w-3" />{t.save}</button></div>{adminData?.knowledge.slice(0, 10).map((entry) => <div key={entry.id} className={`rounded-xl border p-2.5 ${isDark ? 'border-white/[.07] bg-white/[.03]' : 'border-white bg-white'}`}><p className="text-[10px] font-bold">{entry.title}</p><p className="mt-1 text-[8px] font-black text-cyan-400">{entry.category}</p><p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-500">{entry.content}</p></div>)}</> : (!adminData?.conversations.length ? <p className="py-5 text-center text-[10px] text-slate-500">{t.noConversations}</p> : adminData.conversations.slice(0, 12).map((conversation) => <div key={conversation.id} className={`rounded-xl border p-2.5 ${isDark ? 'border-white/[.07] bg-white/[.03]' : 'border-white bg-white'}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-bold">{conversation.customerName}</p><StatusPill status={conversation.status} labels={t.status} /></div><p className="mt-1 text-[9px] text-slate-500">{formatDate(conversation.lastMessageAt, lang)}</p><div className="mt-2 grid grid-cols-2 gap-1"><button onClick={() => void patchAdmin({ action: 'conversation_status', conversationId: conversation.id, status: 'HUMAN_ACTIVE' })} className="rounded-md bg-violet-400/15 px-1 py-1.5 text-[8px] font-black text-violet-200">{lang === 'ar' ? 'استلام' : 'Take over'}</button><button onClick={() => void patchAdmin({ action: 'conversation_status', conversationId: conversation.id, status: 'AI_ACTIVE' })} className="rounded-md bg-cyan-400/15 px-1 py-1.5 text-[8px] font-black text-cyan-200">{lang === 'ar' ? 'تشغيل AI' : 'Enable AI'}</button></div></div>))}</div></div>}</aside>
    </div>

    <AnimatePresence>{showReset && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={() => !submittingReset && setShowReset(false)}><motion.div initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 8 }} onMouseDown={(event) => event.stopPropagation()} className={`w-full max-w-md rounded-[26px] border p-6 shadow-2xl ${isDark ? 'border-violet-300/[.2] bg-[#101527] text-slate-100' : 'border-white bg-white text-slate-900'}`}><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><RefreshCcw className="h-5 w-5" /></div><button onClick={() => !submittingReset && setShowReset(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[.07]"><X className="h-4 w-4" /></button></div><h3 className="mt-4 text-lg font-black">{t.resetTitle}</h3><p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetDescription}</p><div className={`mt-4 rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-amber-300/15 bg-amber-400/[.06] text-amber-100' : 'border-amber-100 bg-amber-50 text-amber-800'}`}><AlertTriangle className="me-1 inline h-3.5 w-3.5" />{t.policy}</div><label className="mt-5 block text-[11px] font-black">{t.chooseProduct}</label><select value={resetProductId} onChange={(event) => setResetProductId(event.target.value)} className={`mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`}><option value="">{customerProducts[0]?.name || '—'}</option>{customerProducts.map((product) => <option value={product.productId} key={product.id}>{product.name}</option>)}</select><label className="mt-4 block text-[11px] font-black">{t.reason}</label><textarea value={resetReason} onChange={(event) => setResetReason(event.target.value)} placeholder={t.reasonPlaceholder} rows={4} className={`mt-2 w-full resize-none rounded-xl border bg-transparent p-3 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`} /><div className="mt-5 flex gap-2"><button onClick={() => setShowReset(false)} disabled={submittingReset} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black ${isDark ? 'border-white/[.1] text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t.cancel}</button><button onClick={() => void submitReset()} disabled={submittingReset || resetReason.trim().length < 3} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-xs font-black text-white disabled:opacity-45">{submittingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}{t.submitReset}</button></div></motion.div></motion.div>}</AnimatePresence>
  </section>;
}
