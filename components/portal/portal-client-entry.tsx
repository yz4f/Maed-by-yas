'use client';

import dynamic from 'next/dynamic';
import type { Product } from '@/types';

const T3NUnifiedPortal = dynamic(
  () => import('@/components/portal/t3n-unified-portal').then((mod) => mod.T3NUnifiedPortal),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen bg-[#08090d] text-slate-300" dir="rtl" role="status" aria-busy="true">
        <span className="sr-only">جاري تحميل البوابة...</span>
        <aside aria-hidden="true" className="hidden w-[244px] shrink-0 border-l border-white/10 bg-[#101b23] px-4 py-6 md:block">
          <div className="mb-12 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white/10 motion-safe:animate-pulse" /><div className="h-4 w-20 rounded bg-white/10 motion-safe:animate-pulse" /></div>
          <div className="space-y-4">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-10 rounded-lg bg-white/[0.06] motion-safe:animate-pulse" />)}</div>
        </aside>
        <div aria-hidden="true" className="mx-auto w-full max-w-[1280px] px-5 py-8 md:px-8">
          <div className="mb-12 h-8 w-32 rounded-lg bg-white/10 motion-safe:animate-pulse" />
          <div className="mb-6 h-36 rounded-2xl border border-white/10 bg-white/[0.04] motion-safe:animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl border border-white/10 bg-white/[0.04] motion-safe:animate-pulse" />)}</div>
        </div>
      </div>
    ),
  },
);

export function PortalClientEntry({ initialProducts }: { initialProducts: Product[] }) {
  return <T3NUnifiedPortal initialProducts={initialProducts} />;
}
