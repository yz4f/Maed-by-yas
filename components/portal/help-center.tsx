'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, BookOpen, CheckCircle2, ChevronLeft, CircleHelp, Clock3, ExternalLink, FileText, Headphones, KeyRound, Loader2, RefreshCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { ResetRequest } from '@/types';

interface ProductSummary {
  id: string;
  productId: string;
  name: string;
  status: string;
  expiresAt?: string | null;
  guideAvailable: boolean;
}

interface HelpCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  isStaff: boolean;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenProducts: () => void;
}

const words = {
  ar: {
    label: 'مركز المساعدة', title: 'كيف يمكننا مساعدتك؟', subtitle: 'كل ما تحتاجه لمنتجك في مكان واحد، بدون تذاكر أو محادثات مزدحمة.', openProducts: 'فتح منتجاتي', guides: 'الشروحات والملفات', guidesText: 'اختر منتجك من مكتبتك لفتح الشرح والفيديو والملف المرتبط به.', guidesAction: 'عرض المنتجات', reset: 'طلبات Reset', resetText: 'ارفع طلباً منظماً عند تغيير الجهاز. تتم المراجعة والتنفيذ من الإدارة فقط.', newReset: 'رفع طلب Reset', policies: 'إرشادات الدعم', policy1Title: 'ابدأ بالشرح', policy1: 'يوجد شرح كل منتج داخل قسم منتجاتي. اتبع الخطوات بالترتيب قبل طلب المراجعة.', policy2Title: 'المفاتيح محمية', policy2: 'لا تعرض المنصة مفتاحك الكامل داخل مركز المساعدة لحماية حسابك.', policy3Title: 'المراجعة الإدارية', policy3: 'لا يتم تنفيذ Reset أو أي تغيير على الترخيص تلقائياً.', yourProducts: 'منتجاتك', noProducts: 'لا توجد منتجات ظاهرة حالياً. فعّل مفتاحاً صحيحاً أولاً.', guideReady: 'شرح متاح', guidePending: 'الشرح غير مضاف', status: { PENDING: 'قيد المراجعة', APPROVED: 'تمت الموافقة', REJECTED: 'مرفوض', WAITING_FOR_CUSTOMER: 'مطلوب معلومات', COMPLETED: 'مكتمل', CANCELLED: 'ملغي' }, resetTitle: 'رفع طلب Reset', resetDescription: 'سيصل طلبك للإدارة للمراجعة. لن يتغير مفتاحك أو جهازك تلقائياً.', selectProduct: 'اختر المنتج', reason: 'سبب الطلب', reasonHint: 'مثال: قمت بتغيير الجهاز', cancel: 'إلغاء', submit: 'إرسال للمراجعة', noRequests: 'لا توجد طلبات Reset حالياً.', requestSubmitted: 'تم رفع طلب Reset للمراجعة.', admin: 'إدارة طلبات Reset', adminHint: 'طلبات منظمة فقط، من دون محادثات أو سجل رسائل.', approve: 'موافقة', reject: 'رفض', moreInfo: 'طلب معلومات', complete: 'تنفيذ Reset', note: 'ملاحظة الإدارة (اختيارية)', success: 'تم حفظ الإجراء بنجاح.', error: 'تعذر تنفيذ العملية. حاول مرة أخرى.', expires: 'ينتهي', active: 'مفعل', inactive: 'غير مفعل', product: 'المنتج', reasonLabel: 'السبب', customer: 'العميل', support: 'الدعم الخارجي', supportText: 'إذا احتجت مساعدة مباشرة بعد مراجعة الشرح، يمكنك التواصل عبر مجتمع ديسكورد.', openDiscord: 'فتح ديسكورد', secure: 'مركز مساعدة آمن ومنظم', overview: 'نظرة سريعة', requestNumber: 'رقم الطلب', emptyAdmin: 'لا توجد طلبات بانتظار المراجعة.',
  },
  en: {
    label: 'HELP CENTER', title: 'How can we help?', subtitle: 'Everything for your product in one place—without crowded tickets or chat threads.', openProducts: 'Open My Products', guides: 'Guides & files', guidesText: 'Choose a product from your library to open its guide, video, and attached file.', guidesAction: 'View products', reset: 'Reset requests', resetText: 'Send an organized request after changing your device. Administration reviews and performs it only when approved.', newReset: 'Request reset', policies: 'Support guidance', policy1Title: 'Start with the guide', policy1: 'Each product guide is available in My Products. Follow it in order before requesting a review.', policy2Title: 'Keys stay protected', policy2: 'Your full key is never shown in the help center to protect your account.', policy3Title: 'Administration review', policy3: 'No reset or license change is performed automatically.', yourProducts: 'Your products', noProducts: 'No products are visible yet. Activate a valid key first.', guideReady: 'Guide available', guidePending: 'Guide pending', status: { PENDING: 'Under review', APPROVED: 'Approved', REJECTED: 'Rejected', WAITING_FOR_CUSTOMER: 'More information needed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }, resetTitle: 'Request a reset', resetDescription: 'Your request is sent to administration for review. Your key or device is never changed automatically.', selectProduct: 'Select product', reason: 'Reason for request', reasonHint: 'Example: I changed my device', cancel: 'Cancel', submit: 'Send for review', noRequests: 'No reset requests yet.', requestSubmitted: 'Your reset request was sent for review.', admin: 'Reset request management', adminHint: 'Organized requests only—no chat threads or message history.', approve: 'Approve', reject: 'Reject', moreInfo: 'Request info', complete: 'Perform reset', note: 'Administration note (optional)', success: 'Action saved successfully.', error: 'The request could not be completed. Please try again.', expires: 'Expires', active: 'Active', inactive: 'Inactive', product: 'Product', reasonLabel: 'Reason', customer: 'Customer', support: 'External support', supportText: 'If you need direct assistance after reviewing the guide, contact the Discord community.', openDiscord: 'Open Discord', secure: 'Secure, organized help center', overview: 'Quick overview', requestNumber: 'Request', emptyAdmin: 'No requests are waiting for review.',
  },
};

function formatDate(value: string | null | undefined, lang: 'ar' | 'en') {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

function RequestStatus({ status, label }: { status: ResetRequest['status']; label: string }) {
  const tone = status === 'COMPLETED' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : status === 'REJECTED' ? 'border-rose-300/20 bg-rose-400/10 text-rose-300' : status === 'APPROVED' ? 'border-violet-300/20 bg-violet-400/10 text-violet-200' : 'border-amber-300/20 bg-amber-400/10 text-amber-200';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function HelpCenter({ lang, isDark, isStaff, onNotify, onOpenProducts }: HelpCenterProps) {
  const t = words[lang];
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [adminRequests, setAdminRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [productId, setProductId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResponse, requestResponse, adminResponse] = await Promise.all([
        fetch('/api/ai?view=help', { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/ai?view=reset_requests', { credentials: 'same-origin', cache: 'no-store' }),
        isStaff ? fetch('/api/ai?view=admin_resets', { credentials: 'same-origin', cache: 'no-store' }) : Promise.resolve(null),
      ]);
      const overview = await overviewResponse.json();
      const ownRequests = await requestResponse.json();
      const admin = adminResponse ? await adminResponse.json() : null;
      if (!overviewResponse.ok || !overview.success) throw new Error(overview.error || t.error);
      if (!requestResponse.ok || !ownRequests.success) throw new Error(ownRequests.error || t.error);
      setProducts(overview.products || []);
      setRequests(ownRequests.requests || []);
      if (admin?.success) setAdminRequests(admin.requests || []);
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : t.error, 'error');
    } finally { setLoading(false); }
  }, [isStaff, onNotify, t.error]);

  useEffect(() => { void load(); }, [load]);

  const actionableProducts = useMemo(() => products.filter((product) => product.status === 'Active'), [products]);
  const openReset = () => { setProductId(actionableProducts[0]?.productId || ''); setReason(''); setShowReset(true); };

  const submitReset = async () => {
    if (reason.trim().length < 3 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'reset_request', productId: productId || undefined, reason, language: lang }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      setShowReset(false);
      onNotify?.(data.duplicate ? (lang === 'ar' ? 'لديك طلب قائم لهذا المنتج.' : 'You already have an open request for this product.') : t.requestSubmitted, data.duplicate ? 'info' : 'success');
      await load();
    } catch (error) { onNotify?.(error instanceof Error ? error.message : t.error, 'error'); }
    finally { setSubmitting(false); }
  };

  const processRequest = async (requestId: string, decision: 'approve' | 'reject' | 'request_info' | 'complete') => {
    try {
      const response = await fetch('/api/ai', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'process_reset', requestId, decision, note: adminNote[requestId] || '' }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.error);
      onNotify?.(t.success, 'success');
      await load();
    } catch (error) { onNotify?.(error instanceof Error ? error.message : t.error, 'error'); }
  };

  const cardTone = isDark ? 'border-white/[.08] bg-white/[.025] shadow-[0_12px_34px_rgba(0,0,0,.16)]' : 'border-slate-100 bg-white shadow-[0_12px_30px_rgba(22,78,120,.06)]';

  return <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`overflow-hidden rounded-[28px] border ${isDark ? 'border-cyan-300/[.14] bg-[#08121f] text-slate-100' : 'border-sky-100 bg-[#fafdff] text-slate-900'}`}>
    <div className={`relative overflow-hidden border-b px-5 py-8 sm:px-8 ${isDark ? 'border-white/[.08]' : 'border-sky-100'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_93%_80%,rgba(139,92,246,.13),transparent_34%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/25 bg-slate-950 shadow-[0_0_32px_rgba(34,211,238,.18)]"><img src="/t3nn-ai.png" alt="تعن" className="h-full w-full object-cover" /></div><div><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-black tracking-[.16em] text-cyan-300"><ShieldCheck className="h-3 w-3" />{t.label}</span><h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{t.title}</h2><p className={`mt-1 max-w-2xl text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p></div></div><button onClick={onOpenProducts} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[.98]"><BookOpen className="h-4 w-4" />{t.openProducts}</button></div>
    </div>

    <div className="p-5 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className={`rounded-3xl border p-5 ${cardTone}`}><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><BookOpen className="h-5 w-5" /></span><span className={`text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.overview}</span></div><h3 className="mt-5 text-base font-black">{t.guides}</h3><p className={`mt-2 min-h-[44px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.guidesText}</p><button onClick={onOpenProducts} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-cyan-300 transition hover:text-cyan-200"><ArrowUpRight className="h-4 w-4" />{t.guidesAction}</button></article>
        <article className={`rounded-3xl border p-5 ${cardTone}`}><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-[10px] font-black text-violet-200">{requests.length}</span></div><h3 className="mt-5 text-base font-black">{t.reset}</h3><p className={`mt-2 min-h-[44px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetText}</p><button onClick={openReset} disabled={actionableProducts.length === 0} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-violet-200 transition hover:text-violet-100 disabled:opacity-40"><RefreshCcw className="h-4 w-4" />{t.newReset}</button></article>
        <article className={`rounded-3xl border p-5 ${cardTone}`}><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200"><Headphones className="h-5 w-5" /></span><Sparkles className="h-4 w-4 text-amber-300" /></div><h3 className="mt-5 text-base font-black">{t.support}</h3><p className={`mt-2 min-h-[44px] text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.supportText}</p><a href="https://discord.gg/t3n" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-amber-200 transition hover:text-amber-100"><ExternalLink className="h-4 w-4" />{t.openDiscord}</a></article>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <section className={`rounded-3xl border p-5 sm:p-6 ${cardTone}`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] text-cyan-300">{t.yourProducts}</p><h3 className="mt-1 text-base font-black">{t.guides}</h3></div><button onClick={onOpenProducts} className={`rounded-xl border px-3 py-2 text-[10px] font-black ${isDark ? 'border-white/[.1] text-slate-300 hover:bg-white/[.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.openProducts}</button></div>{loading ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div> : products.length === 0 ? <p className={`mt-5 rounded-2xl border border-dashed p-4 text-xs leading-6 ${isDark ? 'border-white/[.1] text-slate-500' : 'border-slate-200 text-slate-500'}`}>{t.noProducts}</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{products.slice(0, 6).map((product) => <button key={product.id} onClick={onOpenProducts} className={`group rounded-2xl border p-4 text-start transition hover:-translate-y-0.5 ${isDark ? 'border-white/[.08] bg-slate-950/25 hover:border-cyan-300/20' : 'border-slate-100 bg-slate-50 hover:border-cyan-200'}`}><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-xs font-bold leading-5">{product.name}</p><ChevronLeft className="h-4 w-4 shrink-0 text-cyan-400 transition group-hover:-translate-x-0.5" /></div><div className={`mt-3 flex items-center justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}><span className={product.status === 'Active' ? 'text-emerald-300' : 'text-slate-400'}>{product.status === 'Active' ? t.active : t.inactive}</span><span>{product.guideAvailable ? t.guideReady : t.guidePending}</span></div></button>)}</div>}</section>
        <section className={`rounded-3xl border p-5 sm:p-6 ${cardTone}`}><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-200" /><div><p className="text-[10px] font-black tracking-[.16em] text-violet-200">{t.reset}</p><h3 className="mt-1 text-base font-black">{t.overview}</h3></div></div><div className="mt-5 space-y-2">{loading ? <div className="h-20 animate-pulse rounded-2xl bg-white/[.05]" /> : requests.length === 0 ? <div className={`rounded-2xl border border-dashed p-4 text-xs leading-6 ${isDark ? 'border-white/[.1] text-slate-500' : 'border-slate-200 text-slate-500'}`}>{t.noRequests}</div> : requests.slice(0, 4).map((request) => <div key={request.id} className={`rounded-2xl border p-3 ${isDark ? 'border-white/[.08] bg-slate-950/25' : 'border-slate-100 bg-slate-50'}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-violet-200">{request.reference}</span><RequestStatus status={request.status} label={t.status[request.status]} /></div><p className="mt-2 text-[11px] font-bold">{request.productName}</p><p className={`mt-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatDate(request.createdAt, lang)}</p>{request.adminNotes && <p className={`mt-2 rounded-lg px-2 py-1.5 text-[10px] leading-5 ${isDark ? 'bg-white/[.04] text-slate-400' : 'bg-white text-slate-500'}`}>{request.adminNotes}</p>}</div>)}</div><button onClick={openReset} disabled={actionableProducts.length === 0} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[.08] px-3 py-2.5 text-xs font-black text-violet-200 transition hover:bg-violet-400/[.14] disabled:opacity-40"><RefreshCcw className="h-3.5 w-3.5" />{t.newReset}</button></section>
      </div>

      <section className={`mt-7 rounded-3xl border p-5 sm:p-6 ${cardTone}`}><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-cyan-300" /><h3 className="text-base font-black">{t.policies}</h3></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[[t.policy1Title, t.policy1, BookOpen], [t.policy2Title, t.policy2, KeyRound], [t.policy3Title, t.policy3, ShieldCheck]].map(([title, description, Icon]) => { const SafeIcon = Icon as typeof BookOpen; return <div key={title as string} className={`rounded-2xl border p-4 ${isDark ? 'border-white/[.08] bg-slate-950/25' : 'border-slate-100 bg-slate-50'}`}><SafeIcon className="h-4 w-4 text-cyan-300" /><h4 className="mt-3 text-xs font-black">{title as string}</h4><p className={`mt-2 text-[11px] leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description as string}</p></div>; })}</div></section>

      {isStaff && <section className={`mt-7 rounded-3xl border p-5 sm:p-6 ${cardTone}`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black tracking-[.16em] text-amber-200">ADMIN</p><h3 className="mt-1 text-base font-black">{t.admin}</h3><p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.adminHint}</p></div><span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black text-amber-200">{adminRequests.filter((request) => request.status === 'PENDING').length} {t.status.PENDING}</span></div><div className="mt-5 space-y-3">{adminRequests.length === 0 ? <p className={`rounded-2xl border border-dashed p-4 text-xs ${isDark ? 'border-white/[.1] text-slate-500' : 'border-slate-200 text-slate-500'}`}>{t.emptyAdmin}</p> : adminRequests.map((request) => <article key={request.id} className={`rounded-2xl border p-4 ${isDark ? 'border-white/[.08] bg-slate-950/25' : 'border-slate-100 bg-slate-50'}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black text-amber-200">{request.reference}</p><h4 className="mt-1 text-xs font-black">{request.customerName} · {request.productName}</h4><p className={`mt-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.reasonLabel}: {request.reason}</p></div><RequestStatus status={request.status} label={t.status[request.status]} /></div>{['PENDING', 'APPROVED'].includes(request.status) && <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]"><input value={adminNote[request.id] || ''} onChange={(event) => setAdminNote((current) => ({ ...current, [request.id]: event.target.value }))} placeholder={t.note} className={`rounded-xl border bg-transparent px-3 py-2 text-xs outline-none ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`} />{request.status === 'PENDING' ? <div className="grid grid-cols-3 gap-2"><button onClick={() => void processRequest(request.id, 'approve')} className="rounded-xl bg-emerald-400/15 px-3 py-2 text-[10px] font-black text-emerald-300">{t.approve}</button><button onClick={() => void processRequest(request.id, 'request_info')} className="rounded-xl bg-amber-400/15 px-3 py-2 text-[10px] font-black text-amber-200">{t.moreInfo}</button><button onClick={() => void processRequest(request.id, 'reject')} className="rounded-xl bg-rose-400/15 px-3 py-2 text-[10px] font-black text-rose-300">{t.reject}</button></div> : <button onClick={() => void processRequest(request.id, 'complete')} className="rounded-xl bg-violet-400/15 px-4 py-2 text-[10px] font-black text-violet-200">{t.complete}</button>}</div>}</article>)}</div></section>}
    </div>

    <AnimatePresence>{showReset && <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !submitting && setShowReset(false)}><motion.div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${isDark ? 'border-violet-300/[.2] bg-[#101727] text-slate-100' : 'border-white bg-white text-slate-900'}`} initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 10 }} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/12 text-violet-200"><RefreshCcw className="h-5 w-5" /></span><button onClick={() => !submitting && setShowReset(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[.06]"><X className="h-4 w-4" /></button></div><h3 className="mt-4 text-lg font-black">{t.resetTitle}</h3><p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetDescription}</p><div className={`mt-4 rounded-xl border p-3 text-[10px] leading-5 ${isDark ? 'border-amber-300/15 bg-amber-400/[.06] text-amber-100' : 'border-amber-100 bg-amber-50 text-amber-800'}`}><AlertTriangle className="me-1 inline h-3.5 w-3.5" />{t.policy3}</div><label className="mt-5 block text-[11px] font-black">{t.selectProduct}</label><select value={productId} onChange={(event) => setProductId(event.target.value)} className={`mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`}>{actionableProducts.map((product) => <option key={product.id} value={product.productId}>{product.name}</option>)}</select><label className="mt-4 block text-[11px] font-black">{t.reason}</label><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t.reasonHint} rows={4} className={`mt-2 w-full resize-none rounded-xl border bg-transparent p-3 text-xs outline-none placeholder:text-slate-500 ${isDark ? 'border-white/[.1] text-slate-100' : 'border-slate-200 text-slate-700'}`} /><div className="mt-5 flex gap-2"><button onClick={() => setShowReset(false)} disabled={submitting} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black ${isDark ? 'border-white/[.1] text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t.cancel}</button><button onClick={() => void submitReset()} disabled={submitting || reason.trim().length < 3} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-xs font-black text-white disabled:opacity-45">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}{t.submit}</button></div></motion.div></motion.div>}</AnimatePresence>
  </section>;
}
