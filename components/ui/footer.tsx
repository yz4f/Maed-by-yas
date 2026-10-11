'use client';

import { useEffect, useRef, useState } from 'react';
import { Award, Check, Copy } from 'lucide-react';
import { FREELANCE_DOCUMENT_NUMBER } from '@/lib/site-identity';

interface FooterProps {
  lang?: 'ar' | 'en';
  isDark?: boolean;
  onNavigate?: (tab: 'overview' | 'my-products') => void;
}

export function Footer({ lang = 'ar', isDark = true }: FooterProps) {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copyDocument = async () => {
    try {
      await navigator.clipboard.writeText(FREELANCE_DOCUMENT_NUMBER);
      setError(false);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { setError(true); }
  };

  return (
    <footer
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex flex-col items-center gap-2 py-5"
      data-allow-copy
    >
      <div className={`inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-xl border px-4 py-2.5 text-xs ${isDark ? 'border-cyan-200/15 bg-cyan-200/[.035] text-slate-200' : 'border-slate-200 bg-white/60 text-slate-700'}`}>
        <Award className={`h-5 w-5 shrink-0 ${isDark ? 'text-cyan-200' : 'text-teal-700'}`} aria-hidden="true" />
        <span className="font-semibold">{isAr ? 'وثيقة عميل تعن' : 'T3N customer document'}</span>
        <bdi className="select-all font-mono text-[11px] tracking-wide">{FREELANCE_DOCUMENT_NUMBER}</bdi>
        <button type="button" onClick={() => void copyDocument()} aria-label={isAr ? 'نسخ رقم الوثيقة' : 'Copy document number'} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 ${isDark ? 'bg-white/[.06] hover:bg-white/10 text-cyan-100' : 'bg-teal-50 hover:bg-teal-100 text-teal-800'}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-400">{isAr ? 'تعذر النسخ. يمكنك تحديد رقم الوثيقة ونسخه.' : 'Copy failed. Select the document number to copy it.'}</p>}
    </footer>
  );
}
