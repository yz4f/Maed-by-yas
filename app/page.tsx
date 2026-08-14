import { PortalClientEntry } from '@/components/portal/portal-client-entry';
import { initialProducts } from '@/lib/products-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  return <PortalClientEntry initialProducts={displayProducts} />;
}
