'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Award, Check, Copy } from 'lucide-react';

interface FooterProps {
  lang?: 'ar' | 'en';
  isDark?: boolean;
}

const CERTIFICATE_NUMBER = 'FL-485778088';

export function Footer({ lang = 'ar', isDark = true }: FooterProps) {
  const isAr = lang === 'ar';
  const currentYear = new Date().getFullYear();
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timeout = window.setTimeout(() => setCopyStatus('idle'), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyCertificateNumber = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CERTIFICATE_NUMBER);
      } else {
        const field = document.createElement('textarea');
        field.value = CERTIFICATE_NUMBER;
        field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(field);
        try {
          field.select();
          if (!document.execCommand('copy')) throw new Error('Copy failed');
        } finally {
          field.remove();
        }
      }
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  return (
    <footer
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.09] bg-[#0e1925] text-slate-100' : 'border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(22,78,120,.06)]'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-6 sm:items-center sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border p-1 ${isDark ? 'border-cyan-300/15 bg-[#111f2b]' : 'border-slate-200 bg-slate-50'}`}>
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
          </span>
          <div className="min-w-0">
            <strong className="block text-xl font-black leading-tight" translate="no">{isAr ? 'تعن' : 'T3N'}</strong>
            <p className={`mt-1 text-xs leading-5 ${muted}`}>{isAr ? 'منتجاتك وتراخيصك في مكان واحد' : 'Your products and licenses in one place'}</p>
          </div>
        </div>

        <div className="ms-auto flex max-w-full flex-wrap items-center gap-2">
          <div className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 ${isDark ? 'border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-semibold">{isAr ? 'وثيقة العمل الحر' : 'Freelance certificate'}</span>
            <bdi className="font-mono text-[11px] font-bold tracking-wide">{CERTIFICATE_NUMBER}</bdi>
          </div>
          <button
            type="button"
            onClick={copyCertificateNumber}
            aria-label={isAr ? 'نسخ رقم وثيقة العمل الحر' : 'Copy freelance certificate number'}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${isDark ? 'border-white/[.12] bg-white/[.04] text-slate-100 hover:border-emerald-300/40 hover:bg-emerald-300/[.08]' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'}`}
          >
            {copyStatus === 'copied' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-emerald-400" />}
            <span aria-live="polite">{copyStatus === 'copied' ? (isAr ? 'تم النسخ' : 'Copied') : copyStatus === 'error' ? (isAr ? 'تعذر النسخ' : 'Copy failed') : (isAr ? 'نسخ الرقم' : 'Copy number')}</span>
          </button>
        </div>
      </div>

      <div className={`flex justify-end border-t px-5 py-4 text-xs sm:px-8 ${isDark ? 'border-white/[.08] bg-black/[.13]' : 'border-slate-200 bg-slate-50/70'}`}>
        <p className={`text-[11px] font-medium ${muted}`}>
          {isAr ? `جميع الحقوق محفوظة © ${currentYear} تعن` : `© ${currentYear} T3N. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
