'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import type { Product, ProductFaq } from '@/types';

type Draft = Omit<ProductFaq, 'createdAt' | 'updatedAt'> & { createdAt?: string };
const emptyDraft = (productId = ''): Draft => ({ id: '', productId, questionAr: '', questionEn: '', answerAr: '', answerEn: '', category: '', priority: 0, weight: 5, enabled: true });

export function ProductFaqAdmin({ products, lang, isDark, onNotify, canCreate, canEdit, canDelete }: { products: Product[]; lang: 'ar' | 'en'; isDark: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; onNotify: (text: string, type?: 'success' | 'error' | 'info') => void }) {
  const [faqs, setFaqs] = useState<ProductFaq[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft(products[0]?.id));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const notifyRef = useRef(onNotify);
  const ar = lang === 'ar';
  const panel = isDark ? 'border-white/10 bg-[#0a151d]' : 'border-slate-200 bg-white';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => { notifyRef.current = onNotify; }, [onNotify]);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/product-faqs?all=1', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل الأسئلة.');
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (error) { notifyRef.current(error instanceof Error ? error.message : (ar ? 'تعذر تحميل الأسئلة.' : 'Could not load questions.'), 'error'); }
    finally { setLoading(false); }
  }, [ar]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const startNew = () => { setDraft(emptyDraft(products[0]?.id)); setEditing(false); };
  const startEdit = (faq: ProductFaq) => { setDraft({ ...faq }); setEditing(true); };
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const payload: Draft = { ...draft, id: draft.id || `faq_${crypto.randomUUID()}`, ...(editing ? { createdAt: draft.createdAt } : {}) };
    try {
      const response = await fetch('/api/product-faqs', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر حفظ السؤال.');
      setFaqs((current) => editing ? current.map((item) => item.id === data.faq.id ? data.faq : item) : [data.faq, ...current]);
      startNew();
      onNotify(ar ? 'تم حفظ السؤال.' : 'Question saved.', 'success');
    } catch (error) { onNotify(error instanceof Error ? error.message : 'تعذر حفظ السؤال.', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/product-faqs?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر حذف السؤال.');
      setFaqs((current) => current.filter((item) => item.id !== id));
      if (draft.id === id) startNew();
      onNotify(ar ? 'تم حذف السؤال.' : 'Question deleted.', 'success');
    } catch (error) { onNotify(error instanceof Error ? error.message : 'تعذر حذف السؤال.', 'error'); }
    finally { setDeleting(null); }
  };

  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-400/25 ${isDark ? 'border-white/10 bg-[#071016] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`;

  return <section dir={ar ? 'rtl' : 'ltr'} className="space-y-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className={`text-lg font-semibold ${text}`}>{ar ? 'الأسئلة حسب المنتج' : 'Product questions'}</h2><p className={`mt-1 text-xs ${muted}`}>{ar ? 'تُعرض الإجابات المنشورة مباشرة من قاعدة البيانات.' : 'Published answers are served directly from the database.'}</p></div><button type="button" onClick={() => { setLoading(true); void load(); }} disabled={loading} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs ${panel} ${text}`}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{ar ? 'تحديث' : 'Refresh'}</button></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
      <div className={`divide-y rounded-xl border ${panel}`}>
        {loading ? <p className={`p-5 text-sm ${muted}`}>{ar ? 'جارٍ التحميل...' : 'Loading...'}</p> : faqs.length ? faqs.map((faq) => <article key={faq.id} className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`text-xs ${muted}`}>{products.find((product) => product.id === faq.productId)?.name || faq.productId}</span><span className={`rounded px-1.5 py-0.5 text-[10px] ${faq.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{faq.enabled ? (ar ? 'منشور' : 'Published') : (ar ? 'مسودة' : 'Disabled')}</span></div><p className={`mt-2 text-sm font-medium ${text}`}>{ar ? faq.questionAr : faq.questionEn}</p><p className={`mt-1 line-clamp-2 text-xs leading-6 ${muted}`}>{ar ? faq.answerAr : faq.answerEn}</p></div>
          {canEdit && <button type="button" onClick={() => startEdit(faq)} aria-label={ar ? 'تعديل السؤال' : 'Edit question'} className={`grid h-8 w-8 place-items-center rounded-md border ${panel} ${muted}`}><Pencil size={14} /></button>}{canDelete && <button type="button" onClick={() => setConfirmId(faq.id)} disabled={deleting === faq.id} aria-label={ar ? 'حذف السؤال' : 'Delete question'} className="grid h-8 w-8 place-items-center rounded-md border border-rose-500/20 text-rose-500 disabled:opacity-50"><Trash2 size={14} /></button>}
        </article>) : <p className={`p-5 text-sm ${muted}`}>{ar ? 'لا توجد أسئلة محفوظة لهذا النظام بعد.' : 'No questions are saved yet.'}</p>}
      </div>
      {(canCreate || (editing && canEdit)) && <form onSubmit={save} className={`space-y-3 rounded-xl border p-4 ${panel}`}>
        <div className="flex items-center justify-between"><h3 className={`text-sm font-semibold ${text}`}>{editing ? (ar ? 'تعديل سؤال' : 'Edit question') : (ar ? 'إضافة سؤال' : 'Add question')}</h3><button type="button" onClick={startNew} className={`inline-flex items-center gap-1 text-xs ${muted}`}><Plus size={14} />{ar ? 'جديد' : 'New'}</button></div>
        <select required value={draft.productId} onChange={(event) => change('productId', event.target.value)} className={inputClass}><option value="">{ar ? 'اختر المنتج' : 'Choose a product'}</option>{products.filter((product) => !product.isArchived).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
        <div className="grid gap-3 sm:grid-cols-2"><input required value={draft.questionAr} onChange={(event) => change('questionAr', event.target.value)} placeholder="السؤال بالعربية" className={inputClass} /><input required dir="ltr" value={draft.questionEn} onChange={(event) => change('questionEn', event.target.value)} placeholder="Question in English" className={inputClass} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><textarea required rows={4} value={draft.answerAr} onChange={(event) => change('answerAr', event.target.value)} placeholder="الإجابة بالعربية" className={inputClass} /><textarea required rows={4} dir="ltr" value={draft.answerEn} onChange={(event) => change('answerEn', event.target.value)} placeholder="Answer in English" className={inputClass} /></div>
        <div className="grid gap-3 sm:grid-cols-3"><input required value={draft.category} onChange={(event) => change('category', event.target.value)} placeholder={ar ? 'الفئة' : 'Category'} className={inputClass} /><label className={`flex items-center gap-2 text-xs ${muted}`}>{ar ? 'الأولوية' : 'Priority'}<input type="number" min={0} max={100} value={draft.priority} onChange={(event) => change('priority', Number(event.target.value))} className={`${inputClass} w-20`} /></label><label className={`flex items-center gap-2 text-xs ${muted}`}>{ar ? 'الوزن' : 'Weight'}<input type="number" min={1} max={100} value={draft.weight} onChange={(event) => change('weight', Number(event.target.value))} className={`${inputClass} w-20`} /></label></div>
        <label className={`flex items-center gap-2 text-xs ${muted}`}><input type="checkbox" checked={draft.enabled} onChange={(event) => change('enabled', event.target.checked)} />{ar ? 'نشر السؤال للعملاء' : 'Publish this question'}</label>
        <div className="flex gap-2"><button type="submit" disabled={saving || !products.length} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50"><Save size={14} />{saving ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}</button>{editing && <button type="button" onClick={startNew} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-xs ${panel} ${text}`}><X size={14} />{ar ? 'إلغاء' : 'Cancel'}</button>}</div>
      </form>}
    </div>
    {canDelete && confirmId && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmId(null); }}><section role="dialog" aria-modal="true" aria-labelledby="faq-delete-title" className={`w-full max-w-sm rounded-xl border p-5 shadow-2xl ${panel}`}><h3 id="faq-delete-title" className={`text-base font-semibold ${text}`}>{ar ? 'حذف السؤال؟' : 'Delete question?'}</h3><p className={`mt-2 text-sm ${muted}`}>{ar ? 'سيختفي هذا السؤال وإجابته من قائمة الأسئلة المنشورة.' : 'This question and answer will be removed from the published FAQ.'}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmId(null)} className={`min-h-9 rounded-lg border px-3 text-xs ${panel} ${text}`}>{ar ? 'إلغاء' : 'Cancel'}</button><button type="button" disabled={deleting === confirmId} onClick={async () => { const id = confirmId; await remove(id); setConfirmId(null); }} className="min-h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white disabled:opacity-50">{deleting === confirmId ? (ar ? 'جارٍ الحذف...' : 'Deleting...') : (ar ? 'حذف' : 'Delete')}</button></div></section></div>}
  </section>;
}
