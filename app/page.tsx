import { PortalClientEntry } from '@/components/portal/portal-client-entry';
import { initialProducts } from '@/lib/products-data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { StoreDB } from '@/lib/store-db';
import { Product } from '@/types';

export default async function HomePage() {
  if (process.env.NEXTAUTH_SECRET) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return <PortalClientEntry initialProducts={[]} />;
    }
  }

  let products: Product[] = [];
  try {
    products = await StoreDB.getProducts();
  } catch (e) {
    console.error("Failed to load products on Home server component:", e);
  }
  const displayProducts = products && products.length > 0 ? products : initialProducts;

  return <PortalClientEntry initialProducts={displayProducts} />;
}
