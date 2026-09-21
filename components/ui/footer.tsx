'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Award, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface FooterProps {
  lang?: 'ar' | 'en';
}

export function Footer({ lang = 'ar' }: FooterProps) {
  const isAr = lang === 'ar';
  const currentYear = new Date().getFullYear();
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <footer
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full border-t border-[#24343e] bg-[#0b121a] pt-10 pb-8 text-[#93a9ad] transition-colors"
      >
        <div className="mx-auto max-w-[1420px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Brand / Identity Section */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#24343e] bg-[#101b23] p-1.5 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="عتن"
                  width={38}
                  height={38}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-base font-black tracking-wide text-[#eef4f2]">
                  {isAr ? 'عتن' : 'T3N'}
                </span>
                <p className="mt-0.5 text-xs text-[#93a9ad]">
                  {isAr
                    ? 'منصة رقمية لتقديم المنتجات والخدمات الخاصة بنا.'
                    : 'Digital platform for our products and private services.'}
                </p>
              </div>
            </div>

            {/* Freelance Certificate Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setCertModalOpen(true)}
                className="group flex items-center gap-3 rounded-xl border border-[#24343e] bg-[#101b23] px-3.5 py-2 text-right transition-all duration-200 hover:border-[#94e6c3]/40 hover:bg-[#14222b] focus:outline-none focus:ring-1 focus:ring-[#94e6c3]"
                aria-label={isAr ? 'عرض تفاصيل وثيقة العمل الحر' : 'View Freelance Certificate'}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#94e6c3]/25 bg-[#94e6c3]/10 text-[#94e6c3] transition group-hover:scale-105">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#eef4f2]">
                    <span>{isAr ? 'شهادة العمل الحر' : 'Freelance Certificate'}</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-[#94e6c3]" />
                  </div>
                  <div className="font-mono text-[10px] tracking-wider text-[#94e6c3]">
                    FL-485778088
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Simple Divider */}
          <div className="my-6 h-px w-full bg-[#24343e]/70" />

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-start text-xs text-[#93a9ad]">
            <p className="font-medium text-[#93a9ad]">
              {isAr ? 'صنع من فريق عتن' : 'Crafted by T3N Team'}
            </p>
            <p className="font-mono text-[11px]">
              {isAr
                ? `جميع الحقوق محفوظة © ${currentYear} عتن.`
                : `All rights reserved © ${currentYear} T3N.`}
            </p>
          </div>
        </div>
      </footer>

      {/* Freelance Certificate Preview Modal */}
      {certModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setCertModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#24343e] bg-[#101b23] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#24343e]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#94e6c3]/10 text-[#94e6c3] border border-[#94e6c3]/20">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="cert-modal-title" className="text-sm font-bold text-[#eef4f2]">
                    {isAr ? 'شهادة العمل الحر المعتمدة' : 'Official Freelance Certificate'}
                  </h3>
                  <p className="text-[11px] text-[#93a9ad] font-mono">
                    FL-485778088
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="rounded-lg p-1 text-[#93a9ad] hover:bg-[#14222b] hover:text-[#eef4f2] transition"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center justify-center text-center">
              {!imgError ? (
                <div className="relative w-full max-h-[300px] overflow-hidden rounded-xl border border-[#24343e] bg-[#0b121a]">
                  <Image
                    src="/assets/freelance-certificate.png"
                    alt="شهادة العمل الحر FL-485778088"
                    width={500}
                    height={350}
                    className="object-contain w-full h-auto"
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : (
                <div className="w-full rounded-xl border border-[#94e6c3]/20 bg-[#94e6c3]/5 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#94e6c3]/15 text-[#94e6c3]">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#eef4f2]">
                      {isAr ? 'وثيقة العمل الحر الرسمية' : 'Official Freelance Certificate'}
                    </h4>
                    <p className="text-xs text-[#93a9ad] mt-1">
                      {isAr
                        ? 'المنصة الرقمية معتمدة برقم وثيقة العمل الحر الصادرة من وزارة الموارد البشرية والتنمية الاجتماعية.'
                        : 'Accredited under the official freelance certificate issued by the Ministry of Human Resources.'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#101b23] border border-[#24343e] px-3 py-1.5 font-mono text-xs text-[#94e6c3]">
                    <span>FL-485778088</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#94e6c3]" />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="w-full rounded-xl bg-[#14222b] hover:bg-[#24343e] text-[#eef4f2] text-xs font-bold py-2.5 transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
