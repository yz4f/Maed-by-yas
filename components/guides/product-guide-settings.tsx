'use client';

import type { Product, ProductNoticeConfig, NoticePlacement } from '@/types';
import { DEFAULT_GUIDE_SECTIONS, GUIDE_ARTICLES } from '@/lib/guide-library';

export const DEFAULT_NOTICE: ProductNoticeConfig = { enabled: true, title: '', text: '', type: 'Warning', placements: ['beforePurchase', 'afterPurchase', 'guide', 'video'] };
const placements: { id: NoticePlacement; label: string }[] = [{ id: 'beforePurchase', label: 'قبل الشراء' }, { id: 'afterPurchase', label: 'بعد الشراء' }, { id: 'guide', label: 'داخل دليل المنتج' }, { id: 'video', label: 'عند تشغيل الشرح' }];
export function ProductGuideSettings({ value, onChange }: { value: Pick<Product, 'notice' | 'guideSections'>; onChange: (value: Pick<Product, 'notice' | 'guideSections'>) => void }) {
  const notice = value.notice || DEFAULT_NOTICE;
  const sections = value.guideSections || DEFAULT_GUIDE_SECTIONS;
  const update = (patch: Partial<ProductNoticeConfig>) => onChange({ ...value, notice: { ...notice, ...patch } });
  const field = 'w-full rounded-xl border border-white/15 bg-[#080f18] p-3 text-sm text-white focus:border-cyan-200 focus:outline-none';
  return <section dir="rtl" className="space-y-5 rounded-2xl border border-cyan-200/15 bg-cyan-200/[.025] p-5">
    <h3 className="text-base font-bold text-white">دليل المنتج والتنبيهات</h3>
    <label className="flex items-center gap-3 text-sm text-slate-200"><input type="checkbox" className="h-5 w-5 accent-emerald-300" checked={notice.enabled} onChange={event => update({ enabled: event.target.checked })} />إظهار تنبيه المنتج <span dir="ltr" className="text-xs text-slate-400">{notice.enabled ? 'ON' : 'OFF'}</span></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs text-slate-300"><span>عنوان التنبيه</span><input className={field} value={notice.title} maxLength={160} placeholder="تنبيه مهم" onChange={event => update({ title: event.target.value })} /></label><label className="space-y-2 text-xs text-slate-300"><span>نوع التنبيه</span><select className={field} value={notice.type} onChange={event => update({ type: event.target.value as ProductNoticeConfig['type'] })}><option value="Information">Information — معلومة</option><option value="Warning">Warning — تنبيه</option><option value="Important">Important — مهم</option><option value="Error">Error — خطأ</option></select></label></div>
    <label className="block space-y-2 text-xs text-slate-300"><span>نص إضافي خاص بالمنتج</span><textarea className={field} rows={3} value={notice.text} maxLength={3000} onChange={event => update({ text: event.target.value })} /><span className="block leading-5 text-slate-500">يظهر أسفل تنبيه قراءة الدليل المشترك بين المنتجات.</span></label>
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-bold text-slate-200">أماكن ظهور التنبيه</legend><div className="grid gap-3 sm:grid-cols-2">{placements.map(item => <label key={item.id} className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={notice.placements.includes(item.id)} onChange={event => update({ placements: event.target.checked ? [...notice.placements, item.id] : notice.placements.filter(id => id !== item.id) })} />{item.label}</label>)}</div></fieldset>
    <fieldset className="space-y-3 border-t border-white/10 pt-4"><legend className="text-sm font-bold text-slate-200">الشروحات المرتبطة بالمنتج</legend><p className="text-xs leading-6 text-slate-400">فعّل الشروحات التي يدعمها المنتج فقط. ASUS Permanent Spoof مستقل ولا يتضمن قسم BIOS أي شرح ASUS. المحتوى مركزي ومشترك بين المنتجات.</p><div className="grid gap-3 sm:grid-cols-2">{GUIDE_ARTICLES.map(article => <label key={article.id} className="flex items-start gap-2 text-xs leading-5 text-slate-300"><input type="checkbox" className="mt-1" checked={sections.includes(article.id)} onChange={event => onChange({ ...value, guideSections: event.target.checked ? [...sections, article.id] : sections.filter(id => id !== article.id) })} />{article.title}</label>)}</div></fieldset>
  </section>;
}
