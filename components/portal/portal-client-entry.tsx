'use client';

import dynamic from 'next/dynamic';
import type { Product } from '@/types';

const T3NUnifiedPortal = dynamic(
  () => import('@/components/portal/t3n-unified-portal').then((mod) => mod.T3NUnifiedPortal),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-400 font-mono text-sm animate-pulse">جاري تحميل البوابة...</p>
        </div>
      </div>
    ),
  },
);

export function PortalClientEntry({ initialProducts }: { initialProducts: Product[] }) {
  return <T3NUnifiedPortal initialProducts={initialProducts} />;
}
