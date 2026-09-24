'use client';

import { ErrorScreen } from '@/components/ui/error-screen';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0 }}>
        <ErrorScreen reset={reset} />
      </body>
    </html>
  );
}
