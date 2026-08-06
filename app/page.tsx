import { T3NUnifiedPortal } from '@/components/portal/t3n-unified-portal';
import { initialProducts } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <T3NUnifiedPortal initialProducts={initialProducts} />;
}
