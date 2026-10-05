'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { NoticePlacement, Product } from '@/types';

export function ProductNotice({ product, placement, lang = 'ar' }: { product?: Product; placement: NoticePlacement; lang?: 'ar' | 'en' }) {
  const config = product?.notice;
  if (config && (!config.enabled || !config.placements.includes(placement))) return null;
  const kind = config?.type || 'Warning';
  const Icon = kind === 'Information' ? Info : kind === 'Error' ? AlertCircle : AlertTriangle;
  return <aside dir={lang === 'ar' ? 'rtl' : 'ltr'} className="product-notice">
    <div className="product-notice__content"><Icon aria-hidden="true" className="product-notice__icon" /><div className="min-w-0">
      <h3>{config?.title || (lang === 'ar' ? 'تنبيه قبل البدء' : 'Before you begin')}</h3>
      <p>{lang === 'ar' ? 'راجع متطلبات المنتج، واتبع خطوات دليل الاستخدام بالترتيب.' : 'Review product requirements and follow the guide in order.'}</p>
      {config?.text && <p className="product-notice__custom whitespace-pre-wrap [overflow-wrap:anywhere]">{config.text}</p>}
    </div></div>
  </aside>;
}
