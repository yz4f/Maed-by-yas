'use client';

import dynamic from 'next/dynamic';
import type { Product } from '@/types';
import { PortalLoadingScreen } from './portal-loading-screen';

const T3NUnifiedPortal = dynamic(
  () => import('@/components/portal/t3n-unified-portal').then((mod) => mod.T3NUnifiedPortal),
  {
    ssr: false,
    loading: () => <PortalLoadingScreen />,
  },
);

export function PortalClientEntry({ initialProducts }: { initialProducts: Product[] }) {
  return <T3NUnifiedPortal initialProducts={initialProducts} />;
}
