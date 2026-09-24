'use client';

import { ErrorScreen } from '@/components/ui/error-screen';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen reset={reset} />;
}
