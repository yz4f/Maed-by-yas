'use client';

import Image from 'next/image';
import { Award, Home, Package } from 'lucide-react';

interface FooterProps {
  lang?: 'ar' | 'en';
  isDark?: boolean;
  onNavigate?: (tab: 'overview' | 'my-products') => void;
}

export function Footer({ lang = 'ar', isDark = true, onNavigate }: FooterProps) {
  const isAr = lang === 'ar';
  const currentYear = new Date().getFullYear();
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <footer
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full overflow-hidden rounded-[24px] border ${isDark ? 'border-white/[.09] bg-[#0e1925] text-slate-100' : 'border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(22,78,120,.06)]'}`}
    >
      <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border p-1 ${isDark ? 'border-cyan-300/15 bg-[#111f2b]' : 'border-slate-200 bg-slate-50'}`}>
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
          </span>
          <div className="min-w-0">
            <strong className="block text-xl font-black leading-tight" translate="no">{isAr ? 'تعن' : 'T3N'}</strong>
            <p className={`mt-1 text-xs leading-5 ${muted}`}>{isAr ? 'منتجاتك وتراخيصك في مكان واحد' : 'Your products and licenses in one place'}</p>
          </div>
        </div>

        {onNavigate && <nav aria-label={isAr ? 'روابط سريعة' : 'Quick links'} className="flex flex-wrap items-center gap-2">
          {([
            { tab: 'overview' as const, label: isAr ? 'الرئيسية' : 'Home', icon: Home },
            { tab: 'my-products' as const, label: isAr ? 'منتجاتي' : 'My products', icon: Package },
          ]).map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => onNavigate(tab)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${isDark ? 'border-white/[.1] bg-white/[.035] hover:border-cyan-300/30 hover:bg-cyan-300/[.08]' : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50'}`}>
              <Icon className="h-4 w-4 text-cyan-400" />{label}
            </button>
          ))}
        </nav>}
      </div>

      <div className={`flex flex-col gap-3 border-t px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8 ${isDark ? 'border-white/[.08] bg-black/[.13]' : 'border-slate-200 bg-slate-50/70'}`}>
        <div className={`inline-flex w-fit items-center gap-2 rounded-lg border px-2.5 py-1.5 ${isDark ? 'border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{isAr ? 'وثيقة العمل الحر' : 'Freelance certificate'}</span>
          <bdi className="font-mono text-[11px] font-bold tracking-wide">FL-485778088</bdi>
        </div>
        <p className={`text-[11px] font-medium ${muted}`}>
          {isAr ? `جميع الحقوق محفوظة © ${currentYear} تعن` : `© ${currentYear} T3N. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
