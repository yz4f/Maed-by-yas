import dynamicImport from 'next/dynamic';
import { initialProducts } from '@/lib/products-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const T3NUnifiedPortal = dynamicImport(
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
  }
);

import { StoreDB } from '@/lib/store-db';
import { Product } from '@/types';

export default async function HomePage() {
  let products: Product[] = [];
  try {
    products = await StoreDB.getProducts();
  } catch (e) {
    console.error("Failed to load products on Home server component:", e);
  }
  const displayProducts = products && products.length > 0 ? products : initialProducts;

  return <T3NUnifiedPortal initialProducts={displayProducts} />;
}
