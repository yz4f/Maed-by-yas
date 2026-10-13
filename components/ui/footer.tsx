'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Copy } from 'lucide-react';
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
      <div className={`inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-xl border bg-transparent px-3 py-2 text-xs ${isDark ? 'border-cyan-200/20 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
        <span className="grid h-10 w-14 shrink-0 place-items-center px-1"><Image src="/freelance-mark.png" alt={isAr ? 'شعار العمل الحر' : 'Freelance logo'} width={48} height={28} className={`h-7 w-full object-contain ${isDark ? 'drop-shadow-[0_0_5px_rgba(125,211,252,0.45)]' : ''}`} /></span>
        <span className="font-bold">{isAr ? 'وثيقة تعن' : 'T3N document'}</span>
        <bdi className="select-all font-mono text-[11px] font-semibold tracking-wide">{FREELANCE_DOCUMENT_NUMBER}</bdi>
        <button type="button" onClick={() => void copyDocument()} aria-label={isAr ? 'نسخ رقم الوثيقة' : 'Copy document number'} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border bg-transparent px-2.5 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 ${isDark ? 'border-white/15 text-cyan-100 hover:bg-white/10' : 'border-slate-200 text-teal-800 hover:bg-slate-100/60'}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-400">{isAr ? 'تعذر النسخ. يمكنك تحديد رقم الوثيقة ونسخه.' : 'Copy failed. Select the document number to copy it.'}</p>}
    </footer>
  );
}
