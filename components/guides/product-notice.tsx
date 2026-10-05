'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { NoticePlacement, Product } from '@/types';

export function ProductNotice({ product, placement, lang = 'ar' }: { product?: Product; placement: NoticePlacement; lang?: 'ar' | 'en' }) {
  const config = product?.notice;
  if (config && (!config.enabled || !config.placements.includes(placement))) return null;
  const kind = config?.type || 'Warning';
  const Icon = kind === 'Information' ? Info : kind === 'Error' ? AlertCircle : AlertTriangle;
  return <aside dir={lang === 'ar' ? 'rtl' : 'ltr'} data-tone={kind.toLowerCase()} className="product-notice">
    <div className="flex items-start gap-3"><Icon aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0" /><div className="min-w-0">
      <h3>{config?.title || (lang === 'ar' ? 'قبل البدء' : 'Before you begin')}</h3>
      <p>{lang === 'ar' ? 'اتبع دليل المنتج بالترتيب وتحقق من متطلبات جهازك.' : 'Follow the product guide in order and check your device requirements.'}</p>
      {config?.text && <p className="product-notice__custom whitespace-pre-wrap [overflow-wrap:anywhere]">{config.text}</p>}
    </div></div>
  </aside>;
}
