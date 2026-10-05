'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { NoticePlacement, Product } from '@/types';

export function ProductNotice({ product, placement, lang = 'ar' }: { product?: Product; placement: NoticePlacement; lang?: 'ar' | 'en' }) {
  const config = product?.notice;
  if (config && (!config.enabled || !config.placements.includes(placement))) return null;
  const kind = config?.type || 'Warning';
  const Icon = kind === 'Information' ? Info : kind === 'Error' ? AlertCircle : AlertTriangle;
  const palette = kind === 'Information' ? 'border-sky-300/25 bg-sky-300/[.07] text-sky-200' : kind === 'Error' || kind === 'Important' ? 'border-rose-300/25 bg-rose-300/[.07] text-rose-200' : 'border-amber-300/25 bg-amber-300/[.07] text-amber-200';
  return <aside dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`rounded-2xl border p-4 ${palette}`}>
    <div className="flex items-start gap-3"><Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0">
      <h3 className="text-sm font-bold">{config?.title || (lang === 'ar' ? 'تنبيه مهم' : 'Important notice')}</h3>
      <p className="mt-2 text-xs leading-6 opacity-90">{lang === 'ar' ? 'يرجى قراءة دليل المنتج والمتطلبات كاملة قبل البدء. تختلف بعض الخطوات حسب نوع الجهاز واللوحة الأم وإعدادات Windows. اتبع الخطوات بالترتيب ولا تتجاوز أي خطوة.' : 'Read the product guide and requirements before starting. Steps may differ by device, motherboard and Windows settings. Follow the instructions in order.'}</p>
      {config?.text && <p className="mt-3 whitespace-pre-wrap border-t border-current/10 pt-3 text-sm leading-7 [overflow-wrap:anywhere]">{config.text}</p>}
    </div></div>
  </aside>;
}
