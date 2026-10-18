'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Gift, KeyRound, Loader2, Plus, Send, Users, RotateCw } from 'lucide-react';
import type { Product } from '@/types';
import type { Giveaway } from '@/lib/giveaways';

type Item = Giveaway & { keyCount: number; availableKeys: number };
type Props = { products: Product[]; lang: 'ar' | 'en'; isDark: boolean; onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void };
const statusText: Record<Giveaway['status'], string> = { DRAFT: 'مسودة', PUBLISHING: 'جارٍ النشر', OPEN: 'مفتوح للمشاركة', DRAWING: 'جارٍ اختيار الفائز', SENDING: 'جارٍ إرسال الجائزة', DELIVERED: 'أُرسلت للفائز', DELIVERY_FAILED: 'تعذر إرسال الخاص', EMPTY: 'انتهى دون فائز', CANCELLED: 'ملغى' };

export function GiveawayAdmin({ products, isDark, onNotify }: Props) {
  const notifyRef = useRef(onNotify);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [now, setNow] = useState(0);
  const [draft, setDraft] = useState({ title: '', body: '', productId: products.find(product => !product.isDisabled)?.id || '', duration: '3 Days', endsAt: '' });
  const panel = isDark ? 'border-white/10 bg-[#0b1826] text-white' : 'border-slate-200 bg-white text-slate-900';
  const field = isDark ? 'border-white/10 bg-[#07111e] text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400';
  useEffect(() => { notifyRef.current = onNotify; }, [onNotify]);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/giveaways', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحميل السحوبات.');
      setItems(data.giveaways || []);
    } catch (error) { notifyRef.current?.(error instanceof Error ? error.message : 'تعذر تحميل السحوبات.', 'error'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const first = setTimeout(() => void refresh(), 0); const timer = setInterval(() => setNow(Date.now()), 1000); return () => { clearTimeout(first); clearInterval(timer); }; }, [refresh]);
  const act = async (payload: object, success: string) => {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/giveaways', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر حفظ العملية.');
      onNotify?.(success, 'success');
      await refresh();
      return true;
    } catch (error) { onNotify?.(error instanceof Error ? error.message : 'تعذر حفظ العملية.', 'error'); return false; }
    finally { setBusy(false); }
  };
  const countdown = (date: string) => {
    if (!now) return '…';
    const seconds = Math.max(0, Math.floor((Date.parse(date) - now) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600) % 24;
    const minutes = Math.floor(seconds / 60) % 60;
    return `${days ? `${days}ي ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  return <section dir="rtl" className="space-y-5">
    <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 ${panel}`}>
      <div className="absolute -left-20 -top-28 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3 mb-5"><span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-300"><Gift size={22} /></span><div><h3 className="font-black text-lg">إنشاء قيفاوي</h3><p className="text-xs text-slate-400">اكتب الإعلان، اختر المنتج والوقت، ثم أضف مفتاح السحب قبل النشر في Discord.</p></div></div>
      <form className="relative grid gap-3" onSubmit={async event => { event.preventDefault(); const done = await act({ action: 'create', ...draft, endsAt: new Date(draft.endsAt).toISOString() }, 'حُفظ السحب كمسودة. أضف مفاتيحه ثم انشره.'); if (done) setDraft({ title: '', body: '', productId: products.find(product => !product.isDisabled)?.id || '', duration: '3 Days', endsAt: '' }); }}>
        <label className="text-xs font-bold">عنوان السحب<input required minLength={3} maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="مثال: سحب تعن الأسبوعي" className={`mt-1 block w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400 ${field}`} /></label>
        <label className="text-xs font-bold">تفاصيل الإعلان<textarea required minLength={10} maxLength={1500} rows={4} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} placeholder="اكتب وصف الجائزة وشروط المشاركة بوضوح" className={`mt-1 block w-full resize-y rounded-xl border px-4 py-3 outline-none focus:border-cyan-400 ${field}`} /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold">المنتج<select required value={draft.productId} onChange={event => setDraft({ ...draft, productId: event.target.value, duration: event.target.value === 'prod-hwid-master' ? 'Lifetime' : draft.duration })} className={`mt-1 block w-full rounded-xl border px-3 py-3 ${field}`}>{products.filter(product => !product.isDisabled).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label className="text-xs font-bold">مدة المفتاح<select value={draft.productId === 'prod-hwid-master' ? 'Lifetime' : draft.duration} disabled={draft.productId === 'prod-hwid-master'} onChange={event => setDraft({ ...draft, duration: event.target.value })} className={`mt-1 block w-full rounded-xl border px-3 py-3 disabled:opacity-60 ${field}`}><option value="3 Days">3 أيام</option><option value="Lifetime">مدى الحياة</option></select></label>
          <label className="text-xs font-bold">وقت انتهاء السحب<input required type="datetime-local" value={draft.endsAt} onChange={event => setDraft({ ...draft, endsAt: event.target.value })} className={`mt-1 block w-full rounded-xl border px-3 py-3 ${field}`} /></label>
        </div>
        <button disabled={busy || !products.length} className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/15 transition hover:-translate-y-0.5 hover:bg-cyan-300 active:scale-[.98] disabled:opacity-50"><Plus size={16} /> إنشاء مسودة</button>
      </form>
    </div>
    <div className="flex items-center justify-between"><h3 className="text-base font-black">السحوبات والمفاتيح الخاصة بها</h3><button onClick={() => void refresh()} aria-label="تحديث" className="rounded-xl border border-cyan-300/20 p-2 text-cyan-300 hover:bg-cyan-300/10"><RotateCw size={16} /></button></div>
    {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div> : !items.length ? <div className={`rounded-2xl border p-8 text-center text-sm text-slate-400 ${panel}`}>لم تُنشأ سحوبات بعد.</div> : <div className="grid gap-4 lg:grid-cols-2">{items.map(item => <article key={item.id} className={`rounded-2xl border p-5 transition hover:border-cyan-400/30 ${panel}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[11px] font-bold text-cyan-300">{item.productName}</p><h4 className="mt-1 text-base font-black">{item.title}</h4></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold text-cyan-200">{statusText[item.status]}</span></div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{item.body}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="inline-flex items-center gap-1 rounded-lg bg-cyan-400/10 px-2.5 py-2 text-cyan-200"><Clock3 size={13} />{item.status === 'OPEN' ? countdown(item.endsAt) : new Date(item.endsAt).toLocaleString('ar-SA')}</span><span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-2"><KeyRound size={13} />{item.availableKeys} متاح من {item.keyCount}</span><span className="rounded-lg bg-white/5 px-2.5 py-2">{item.duration === 'Lifetime' ? 'مدى الحياة' : '3 أيام'}</span>{item.entryCount != null && <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-2"><Users size={13} />{item.entryCount} مشارك</span>}</div>
      {item.status === 'DRAFT' && <div className="mt-4 grid gap-2"><label className="text-xs font-bold">مفاتيح السحب — مفتاح في كل سطر<textarea rows={3} value={keyInputs[item.id] || ''} onChange={event => setKeyInputs({ ...keyInputs, [item.id]: event.target.value })} placeholder="KEY-..." className={`mt-1 block w-full rounded-xl border px-3 py-2 font-mono text-xs ${field}`} /></label><div className="flex flex-wrap gap-2"><button disabled={busy || !keyInputs[item.id]?.trim()} onClick={async () => { const done = await act({ action: 'addKeys', id: item.id, keys: (keyInputs[item.id] || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean) }, 'أُضيفت مفاتيح السحب في مخزون منفصل.'); if (done) setKeyInputs({ ...keyInputs, [item.id]: '' }); }} className="rounded-xl border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50">إضافة مفاتيح السحب</button><button disabled={busy || item.availableKeys < 1} onClick={() => void act({ action: 'publish', id: item.id }, 'نُشر السحب في روم Discord.') } className="inline-flex items-center gap-1 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"><Send size={13} /> نشر في الروم</button></div></div>}
      {item.winnerId && <p className="mt-3 text-xs text-slate-400">الفائز: <span className="font-mono text-cyan-200">{item.winnerId}</span></p>}
      {item.status === 'DELIVERY_FAILED' && <div className="mt-3 space-y-2"><p className="text-xs text-rose-300">{item.deliveryError || 'تعذر إرسال المفتاح في الخاص.'}</p><button disabled={busy} onClick={() => void act({ action: 'retryDelivery', id: item.id }, 'أُعيد إرسال المفتاح للفائز.') } className="rounded-xl border border-rose-400/30 px-4 py-2 text-xs font-bold text-rose-200">إعادة إرسال المفتاح</button></div>}
    </article>)}</div>}
    <p className="text-xs text-slate-500">مفاتيح القيفاوي محفوظة منفصلة عن مخزون البيع. لا يُفعّل المفتاح إلا من حساب Discord الخاص بالفائز.</p>
  </section>;
}
