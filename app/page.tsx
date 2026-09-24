import { PortalClientEntry } from '@/components/portal/portal-client-entry';

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
  return <PortalClientEntry initialProducts={products || []} />;
}
