'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileImage, Loader2, Megaphone, Pencil, Plus, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import type { SiteUpdate, SiteUpdateKind, SiteUpdateStatus } from '@/types';

type Language = 'ar' | 'en';
type ToastType = 'success' | 'error' | 'warning' | 'info';

type SiteUpdatesAdminProps = {
  lang: Language;
  isDark: boolean;
  onNotify?: (message: string, type?: ToastType) => void;
};

type Draft = {
  title: string;
  summary: string;
  highlights: string;
  imageUrl: string;
  imageAlt: string;
  kind: SiteUpdateKind;
};

const emptyDraft: Draft = { title: '', summary: '', highlights: '', imageUrl: '', imageAlt: '', kind: 'FEATURE' };
const statusMeta: Record<SiteUpdateStatus, { ar: string; en: string; tone: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', tone: 'bg-slate-400/10 text-slate-300 border-slate-300/15' },
  APPROVED: { ar: 'معتمد', en: 'Approved', tone: 'bg-emerald-400/10 text-emerald-200 border-emerald-300/20' },
  PUBLISHED: { ar: 'جارٍ النشر', en: 'Publishing', tone: 'bg-cyan-400/10 text-cyan-200 border-cyan-300/20' },
  DISCORD_SENT: { ar: 'تم إرسال Discord', en: 'Discord sent', tone: 'bg-violet-400/10 text-violet-200 border-violet-300/20' },
  DISCORD_FAILED: { ar: 'فشل الإرسال', en: 'Delivery failed', tone: 'bg-rose-400/10 text-rose-200 border-rose-300/20' },
};

function formatDate(value: string, lang: Language) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

async function compressedImage(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة صورة التحديث.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onerror = () => reject(new Error('صورة التحديث غير صالحة.'));
    element.onload = () => resolve(element);
    element.src = source;
  });
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز صورة التحديث.');
  context.fillStyle = '#0a1321';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/jpeg', 0.78);
  if (result.length > 700_000) throw new Error('الصورة كبيرة جداً بعد الضغط؛ اختر لقطة أقرب أو أوضح بحجم أصغر.');
  return result;
}

export function SiteUpdatesAdmin({ lang, isDark, onNotify }: SiteUpdatesAdminProps) {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isArabic = lang === 'ar';
  const surface = isDark ? 'border-white/[.08] bg-[#0c1422] text-slate-100' : 'border-slate-200 bg-white text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const previewHighlights = useMemo(() => draft.highlights.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8), [draft.highlights]);

  const loadUpdates = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/admin/site-updates', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load updates.');
      setUpdates(Array.isArray(data.updates) ? data.updates : []);
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر تحميل سجل التحديثات.', 'error');
    } finally { if (!quiet) setLoading(false); }
  };

  useEffect(() => { void loadUpdates(); }, []);

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBusy(true);
    try {
      const imageUrl = await compressedImage(file);
      setDraft((current) => ({ ...current, imageUrl, imageAlt: current.imageAlt || file.name.replace(/\.[^.]+$/, '') }));
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر تجهيز الصورة.', 'error');
    } finally {
      setImageBusy(false);
      event.target.value = '';
    }
  };

  const saveDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const highlights = previewHighlights;
    if (!draft.imageUrl) { onNotify?.(isArabic ? 'يرجى إضافة صورة توضيحية للتحديث قبل الحفظ.' : 'Add an update image before saving.', 'warning'); return; }
    if (!highlights.length) { onNotify?.(isArabic ? 'أضف عنصراً واحداً على الأقل من أبرز التحديثات.' : 'Add at least one highlight.', 'warning'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/site-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: editingId ? 'edit' : 'create', ...(editingId ? { updateId: editingId } : {}), update: { ...draft, highlights } }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save update.');
      setDraft(emptyDraft); setEditingId(null); await loadUpdates(true);
      onNotify?.(isArabic ? 'تم حفظ التحديث كمسودة. لن يُرسل أي شيء إلى Discord بعد.' : 'Update saved as draft. Nothing has been sent to Discord.', 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر حفظ التحديث.', 'error');
    } finally { setSaving(false); }
  };

  const act = async (action: 'approve' | 'publish', update: SiteUpdate) => {
    if (action === 'publish' && !window.confirm(isArabic ? 'سيتم إرسال هذا التحديث المعتمد مع صورته إلى قناة Discord مرة واحدة. هل تريد المتابعة؟' : 'This will send the approved update with its image to Discord once. Continue?')) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/site-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action, updateId: update.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to complete update action.');
      await loadUpdates(true);
      onNotify?.(action === 'approve' ? (isArabic ? 'تم اعتماد التحديث. يمكنك نشره عندما تكون مستعداً.' : 'Update approved and ready to publish.') : (isArabic ? 'تم إرسال التحديث إلى Discord وتسجيل النتيجة.' : 'Update sent to Discord and recorded.'), 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر تنفيذ إجراء التحديث.', 'error');
      await loadUpdates(true);
    } finally { setSaving(false); }
  };

  const publishProductStatus = async () => {
    if (!window.confirm(isArabic ? 'سيتم إرسال بطاقة حالة المنتجات بالصور إلى قناة Discord المحددة. هل تريد المتابعة؟' : 'This will send the product status card with images to the configured Discord channel. Continue?')) return;
    setPublishingStatus(true);
    try {
      const response = await fetch('/api/admin/product-status', { method: 'POST', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to publish product status.');
      onNotify?.(isArabic ? 'تم إرسال بطاقة حالة المنتجات إلى Discord.' : 'Product status card sent to Discord.', 'success');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر إرسال بطاقة حالة المنتجات.', 'error');
    } finally { setPublishingStatus(false); }
  };

  const edit = (update: SiteUpdate) => {
    setEditingId(update.id);
    setDraft({ title: update.title, summary: update.summary, highlights: update.highlights.join('\n'), imageUrl: update.imageUrl, imageAlt: update.imageAlt || '', kind: update.kind });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div dir={isArabic ? 'rtl' : 'ltr'} className="space-y-5 animate-slide-up">
    <div className={`rounded-[24px] border p-5 md:p-6 ${surface}`}>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div><div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Megaphone className="h-5 w-5" /></span><div><h3 className="text-base font-black">{isArabic ? 'سجل تحديثات الموقع' : 'Website updates'}</h3><p className={`mt-1 text-xs ${muted}`}>{isArabic ? 'مسودة → اعتماد → نشر صريح مع صورة مرتبطة. لا يوجد إرسال تلقائي أو مكرر.' : 'Draft → approval → explicit image-backed publishing. No automatic or duplicate sending.'}</p></div></div></div>
        <div className="flex flex-wrap items-center gap-2"><button onClick={() => void publishProductStatus()} disabled={publishingStatus} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-400 to-cyan-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow-[0_10px_24px_rgba(34,211,238,.14)] transition hover:brightness-110 disabled:opacity-50">{publishingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{isArabic ? 'نشر حالة المنتجات' : 'Publish product status'}</button><button onClick={() => void loadUpdates()} disabled={loading} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition disabled:opacity-50 ${isDark ? 'border-white/[.1] text-slate-200 hover:bg-white/[.06]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />{isArabic ? 'تحديث السجل' : 'Refresh'}</button></div>
      </div>

      <form onSubmit={saveDraft} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'عنوان التحديث' : 'Update title'}</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={120} required className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${isDark ? 'border-white/[.1] bg-black/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`} placeholder={isArabic ? 'مثال: تحسين استقرار محادثات الإدارة' : 'Example: Stable admin conversations'} /></label>
          <label className="space-y-1.5 sm:col-span-2"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'وصف واضح ومختصر' : 'Clear short summary'}</span><textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} maxLength={800} required rows={3} className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${isDark ? 'border-white/[.1] bg-black/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`} /></label>
          <label className="space-y-1.5"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'نوع التحديث' : 'Update type'}</span><select value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as SiteUpdateKind }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-white/[.1] bg-[#111b2b] text-white' : 'border-slate-200 bg-white text-slate-900'}`}><option value="FEATURE">{isArabic ? 'ميزة جديدة' : 'Feature'}</option><option value="IMPROVEMENT">{isArabic ? 'تحسين' : 'Improvement'}</option><option value="FIX">{isArabic ? 'إصلاح' : 'Fix'}</option><option value="RELEASE">{isArabic ? 'إصدار' : 'Release'}</option></select></label>
          <label className="space-y-1.5"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'وصف الصورة' : 'Image description'}</span><input value={draft.imageAlt} onChange={(event) => setDraft((current) => ({ ...current, imageAlt: event.target.value }))} maxLength={180} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${isDark ? 'border-white/[.1] bg-black/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`} placeholder={isArabic ? 'لقطة فعلية من القسم المحدّث' : 'Actual screenshot of the updated area'} /></label>
          <label className="space-y-1.5 sm:col-span-2"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'أو رابط HTTPS مباشر للصورة' : 'Or direct HTTPS image URL'}</span><input type="url" value={draft.imageUrl.startsWith('data:image/') ? '' : draft.imageUrl} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value.trim() }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${isDark ? 'border-white/[.1] bg-black/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`} placeholder="https://…/update-screenshot.png" /><span className={`block text-[10px] ${muted}`}>{isArabic ? 'استخدم هذا الخيار للقطات المستضافة فعلياً؛ اختيار ملف محلي أدناه يظل متاحاً أيضاً.' : 'Use this for a genuinely hosted screenshot; local upload remains available below.'}</span></label>
          <label className="space-y-1.5 sm:col-span-2"><span className={`text-[11px] font-black ${muted}`}>{isArabic ? 'أبرز ما تم إضافته — سطر لكل نقطة' : 'Highlights — one item per line'}</span><textarea value={draft.highlights} onChange={(event) => setDraft((current) => ({ ...current, highlights: event.target.value }))} required rows={4} className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${isDark ? 'border-white/[.1] bg-black/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`} placeholder={isArabic ? 'تحسين عرض المحادثة\nتحديث أسرع للرسائل\nحفظ البيانات أثناء التحديث' : 'Stable message rendering\nFaster refresh\nPersistent data during sync'} /></label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button type="button" onClick={() => fileRef.current?.click()} disabled={imageBusy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3.5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">{imageBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileImage className="h-3.5 w-3.5" />}{isArabic ? 'إرفاق لقطة التحديث' : 'Attach update screenshot'}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={selectImage} /><span className={`text-[10px] ${muted}`}>{isArabic ? 'الصورة إلزامية، وتُضغط قبل الحفظ. لا يمكن الاعتماد أو النشر من دونها.' : 'An image is required and compressed before saving.'}</span></div>
        </div>
        <aside className={`overflow-hidden rounded-2xl border ${isDark ? 'border-white/[.08] bg-black/10' : 'border-slate-200 bg-slate-50'}`}>{draft.imageUrl ? <img src={draft.imageUrl} alt={draft.imageAlt || draft.title} className="aspect-video w-full object-cover" /> : <div className={`grid aspect-video place-items-center ${muted}`}><div className="text-center"><FileImage className="mx-auto mb-2 h-6 w-6" /><p className="text-xs">{isArabic ? 'أضف لقطة حقيقية للتحديث' : 'Add a real update screenshot'}</p></div></div>}<div className="p-4"><p className="text-sm font-black">{draft.title || (isArabic ? 'معاينة التحديث' : 'Update preview')}</p><p className={`mt-2 line-clamp-3 text-xs leading-6 ${muted}`}>{draft.summary || (isArabic ? 'سيظهر وصف التحديث هنا.' : 'The update description appears here.')}</p>{previewHighlights.length > 0 && <div className={`mt-3 border-t pt-3 text-[11px] ${isDark ? 'border-white/[.08] text-slate-300' : 'border-slate-200 text-slate-600'}`}>{previewHighlights.map((item) => <p key={item} className="mb-1">• {item}</p>)}</div>}</div></aside>
        <div className="flex flex-wrap items-center gap-2 lg:col-span-2"><button type="submit" disabled={saving || imageBusy} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-400 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingId ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{editingId ? (isArabic ? 'حفظ التعديل' : 'Save changes') : (isArabic ? 'حفظ كمسودة' : 'Save draft')}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); }} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black ${isDark ? 'border-white/[.1] text-slate-200' : 'border-slate-200 text-slate-700'}`}><X className="h-3.5 w-3.5" />{isArabic ? 'إلغاء التعديل' : 'Cancel'}</button>}</div>
      </form>
    </div>

    <div className={`overflow-hidden rounded-[24px] border ${surface}`}><div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/[.08]' : 'border-slate-100'}`}><div><h3 className="text-sm font-black">{isArabic ? 'سجل التحديثات' : 'Update log'}</h3><p className={`mt-1 text-[11px] ${muted}`}>{isArabic ? 'كل إرسال مرتبط بمعرّف واحد ونتيجة مسجلة.' : 'Each delivery is tied to one ID and a recorded result.'}</p></div><span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black text-cyan-300">{updates.length}</span></div>{loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /></div> : updates.length === 0 ? <div className={`p-8 text-center text-sm ${muted}`}>{isArabic ? 'لا توجد تحديثات رسمية بعد. ابدأ بمسودة موثقة بصورة حقيقية.' : 'No official updates yet. Start with an image-backed draft.'}</div> : <div className="divide-y divide-white/[.06]">{updates.map((update) => { const status = statusMeta[update.status]; return <article key={update.id} className="grid gap-4 p-4 md:grid-cols-[150px_minmax(0,1fr)_auto]"><img src={update.imageUrl} alt={update.imageAlt || update.title} className="aspect-video w-full rounded-xl border border-white/[.08] object-cover" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-black">{update.title}</h4><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${status.tone}`}>{isArabic ? status.ar : status.en}</span></div><p className={`mt-2 text-xs leading-6 ${muted}`}>{update.summary}</p><div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] ${muted}`}><span>{isArabic ? 'أنشئ' : 'Created'}: {formatDate(update.createdAt, lang)}</span>{update.discordSentAt && <span>{isArabic ? 'أرسل' : 'Sent'}: {formatDate(update.discordSentAt, lang)}</span>}</div>{update.discordError && <p className="mt-2 text-[10px] text-rose-300">{isArabic ? 'سبب الفشل: ' : 'Failure: '}{update.discordError}</p>}</div><div className="flex flex-wrap items-start gap-2 md:justify-end">{update.status === 'DRAFT' && <><button onClick={() => edit(update)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black ${isDark ? 'border-white/[.1] text-slate-200 hover:bg-white/[.06]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Pencil className="h-3 w-3" />{isArabic ? 'تعديل' : 'Edit'}</button><button onClick={() => void act('approve', update)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50"><ShieldCheck className="h-3 w-3" />{isArabic ? 'اعتماد' : 'Approve'}</button></>}{(update.status === 'APPROVED' || update.status === 'DISCORD_FAILED') && <button onClick={() => void act('publish', update)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-2 text-[10px] font-black text-slate-950 disabled:opacity-50"><Send className="h-3 w-3" />{update.status === 'DISCORD_FAILED' ? (isArabic ? 'إعادة الإرسال' : 'Retry') : (isArabic ? 'نشر إلى Discord' : 'Publish to Discord')}</button>}{update.status === 'DISCORD_SENT' && <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-400/10 px-3 py-2 text-[10px] font-black text-violet-200"><CheckCircle2 className="h-3 w-3" />{isArabic ? 'تم الإرسال' : 'Sent'}</span>}</div></article>; })}</div>}</div>
  </div>;
}
