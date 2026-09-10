'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Product } from '@/types';

const T3NUnifiedPortal = dynamic(
  () => import('@/components/portal/t3n-unified-portal').then((mod) => mod.T3NUnifiedPortal),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#090f15] flex items-center justify-center" role="status" aria-label="جاري تحميل البوابة">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logo.png" alt="تعن" width={54} height={54} className="rounded-2xl" />
          <div className="w-6 h-6 border-2 border-emerald-200/15 border-t-emerald-200 rounded-full animate-spin motion-reduce:animate-none" />
          <p className="text-emerald-100/70 text-xs">جاري تحميل البوابة...</p>
        </div>
      </div>
    ),
  },
);

export function PortalClientEntry({ initialProducts }: { initialProducts: Product[] }) {
  return <T3NUnifiedPortal initialProducts={initialProducts} />;
}
