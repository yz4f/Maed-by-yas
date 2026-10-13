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
      <div className={`flex w-[208px] max-w-full flex-col items-center gap-2 rounded-2xl border bg-transparent px-4 py-3 text-center text-xs ${isDark ? 'border-cyan-200/20 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
        <Image src="/freelance-logo-full.png" alt={isAr ? 'شعار العمل الحر' : 'Freelance logo'} width={144} height={72} className={`h-[62px] w-36 object-contain ${isDark ? 'drop-shadow-[0_0_5px_rgba(125,211,252,0.45)]' : ''}`} />
        <span className="font-bold">{isAr ? 'وثيقة تعن' : 'T3N document'}</span>
        <div className={`flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 ${isDark ? 'border-white/10' : 'border-slate-200/70'}`}>
          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? 'رقم الوثيقة' : 'Document number'}</span>
          <bdi className="select-all font-mono text-[11px] font-semibold tracking-wide">{FREELANCE_DOCUMENT_NUMBER}</bdi>
        </div>
        <button type="button" onClick={() => void copyDocument()} aria-label={isAr ? 'نسخ رقم الوثيقة' : 'Copy document number'} className={`inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg border bg-transparent px-2.5 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 ${isDark ? 'border-white/15 text-cyan-100 hover:bg-white/10' : 'border-slate-200 text-teal-800 hover:bg-slate-100/60'}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-400">{isAr ? 'تعذر النسخ. يمكنك تحديد رقم الوثيقة ونسخه.' : 'Copy failed. Select the document number to copy it.'}</p>}
    </footer>
  );
}
