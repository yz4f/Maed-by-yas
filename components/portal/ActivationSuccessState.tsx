'use client';

import React from 'react';

type Props = {
  lang: 'ar' | 'en';
  duration: '3 Days' | 'Lifetime';
  productName?: string;
  closing?: boolean;
};

export function ActivationSuccessState({ lang, duration, productName, closing = false }: Props) {
  const isArabic = lang === 'ar';
  const durationLabel = duration === 'Lifetime'
    ? (isArabic ? 'مدى الحياة' : 'Lifetime')
    : (isArabic ? '3 أيام' : '3 days');

  return (
    <div className={`activation-success-state${closing ? ' activation-success-state--closing' : ''}`} role="status" aria-live="polite" dir={isArabic ? 'rtl' : 'ltr'}>
      <style>{`
        .activation-success-state { position: relative; display: flex; min-height: 270px; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; text-align: center; }
        .activation-success-state--closing { animation: activation-close 300ms ease-in both; }
        .activation-success-state::before { content: ''; position: absolute; top: 30px; left: 50%; width: 180px; height: 150px; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(52, 211, 153, .18), transparent 68%); filter: blur(12px); animation: activation-glow 900ms ease-out both; pointer-events: none; }
        .activation-success-mark { position: relative; z-index: 1; width: clamp(68px, 22vw, 92px); height: clamp(68px, 22vw, 92px); animation: activation-pop 520ms cubic-bezier(.22, 1.35, .45, 1) both; }
        .activation-success-mark__circle, .activation-success-mark__check { fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .activation-success-mark__circle { stroke: #34d399; stroke-width: 3; stroke-dasharray: 283; stroke-dashoffset: 283; animation: activation-draw 520ms ease-out 80ms forwards; }
        .activation-success-mark__check { stroke: white; stroke-width: 4.5; stroke-dasharray: 62; stroke-dashoffset: 62; animation: activation-draw 360ms ease-out 520ms forwards; }
        .activation-success-title { position: relative; z-index: 1; margin-top: 20px; color: white; font-size: clamp(18px, 4vw, 23px); font-weight: 900; animation: activation-slide-up 360ms ease-out 700ms both; }
        .activation-success-detail { position: relative; z-index: 1; margin-top: 8px; color: rgba(186, 230, 253, .88); font-size: 13px; font-weight: 700; animation: activation-slide-up 360ms ease-out 900ms both; }
        .activation-success-product { position: relative; z-index: 1; margin-top: 5px; max-width: 90%; overflow: hidden; color: rgba(148, 163, 184, .82); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; animation: activation-slide-up 360ms ease-out 1020ms both; }
        @keyframes activation-pop { 0% { opacity: 0; transform: scale(.5); } 72% { opacity: 1; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes activation-draw { to { stroke-dashoffset: 0; } }
        @keyframes activation-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes activation-glow { from { opacity: .95; transform: translateX(-50%) scale(.7); } to { opacity: .2; transform: translateX(-50%) scale(1.2); } }
        @keyframes activation-close { to { opacity: 0; transform: scale(.97); } }
        @media (prefers-reduced-motion: reduce) { .activation-success-state *, .activation-success-state::before { animation-duration: 1ms !important; animation-delay: 0ms !important; } }
      `}</style>
      <svg className="activation-success-mark" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="activation-success-mark__circle" cx="50" cy="50" r="45" />
        <path className="activation-success-mark__check" d="M27 51 L43 66 L74 34" />
      </svg>
      <h2 className="activation-success-title">{isArabic ? 'تم التفعيل بنجاح' : 'Activation successful'}</h2>
      <p className="activation-success-detail">
        {isArabic ? `تم تفعيل المنتج لمدة ${durationLabel}` : `Product activated for ${durationLabel}`}
      </p>
      {productName && <p className="activation-success-product">{productName}</p>}
    </div>
  );
}
